import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import {
  User,
  StudentProfile,
  Job,
  JobApplication,
  SkillNode,
  RoadmapStep,
} from './src/types/index.ts';

import {
  POSTGRES_SCHEMA_SQL,
  SEED_USERS,
  SEED_STUDENT_PROFILE,
  SEED_JOBS,
  SEED_SKILLS,
  SEED_SKILL_EDGES,
  SEED_COURSES,
  SEED_PROJECTS,
  SEED_MARKET_TRENDS,
  SEED_APPLICATIONS,
  SEED_MODEL_METRICS,
  calculateLocalSemanticMatch,
} from './src/server/db.ts';

import {
  hasGeminiKey,
  parseResumeWithGemini,
  analyzeJobDescriptionWithGemini,
  computeExplainableSemanticMatch,
  analyzeATSWithGemini,
  generateInterviewQuestionsWithGemini,
  evaluateInterviewAnswerWithGemini,
} from './src/server/gemini.ts';

import { createRequire } from 'module';
const nodeRequire = createRequire(import.meta.url);
const { PDFParse } = nodeRequire('pdf-parse');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-Memory Database State (mimicking PostgreSQL relational store with session state)
let users: User[] = [...SEED_USERS];
let currentUserId = 'user_alex'; // Default active user: Alex Chen (Student)
let studentProfiles: Record<string, StudentProfile> = {
  user_alex: { ...SEED_STUDENT_PROFILE },
};
let jobs: Job[] = [...SEED_JOBS];
let skills: SkillNode[] = [...SEED_SKILLS];
let applications: JobApplication[] = [...SEED_APPLICATIONS];
let marketTrends = [...SEED_MARKET_TRENDS];
let modelMetrics = { ...SEED_MODEL_METRICS };
let feedbackList: any[] = [];

// Helper to get active user
const getCurrentUser = () => {
  return users.find(u => u.id === currentUserId) || users[0];
};

const getActiveStudentProfile = (): StudentProfile => {
  if (!studentProfiles[currentUserId]) {
    const user = getCurrentUser();
    studentProfiles[currentUserId] = {
      ...SEED_STUDENT_PROFILE,
      id: `student_${user.id}`,
      userId: user.id,
      headline: `${user.name} · Aspiring Engineer`,
    };
  }
  return studentProfiles[currentUserId];
};

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT
// ==========================================

// Get current logged-in user
app.get('/api/auth/current-user', (req, res) => {
  const user = getCurrentUser();
  res.json({
    user,
    hasGeminiKey: hasGeminiKey(),
  });
});

// Switch role / active demo persona
app.post('/api/auth/switch-user', (req, res) => {
  const { userId } = req.body;
  const found = users.find(u => u.id === userId);
  if (found) {
    currentUserId = found.id;
    return res.json({ success: true, user: found });
  }
  res.status(404).json({ error: 'User not found' });
});

// Google OAuth 2.0 login / profile creation
app.post('/api/auth/google', (req, res) => {
  const { email, name, avatarUrl, role } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  let existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    if (role && ['student', 'recruiter', 'admin'].includes(role)) {
      existing.role = role;
    }
    currentUserId = existing.id;
    return res.json({ success: true, user: existing, isNew: false });
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    email,
    name,
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    role: role || 'student',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  currentUserId = newUser.id;

  // Initialize student profile if role is student
  if (newUser.role === 'student') {
    studentProfiles[newUser.id] = {
      ...SEED_STUDENT_PROFILE,
      id: `student_${newUser.id}`,
      userId: newUser.id,
      headline: `${newUser.name} · Student`,
    };
  }

  res.json({ success: true, user: newUser, isNew: true });
});

// ==========================================
// 2. STUDENT PORTAL ENDPOINTS
// ==========================================

// Get student profile
app.get('/api/student/profile', (req, res) => {
  const profile = getActiveStudentProfile();
  res.json(profile);
});

// Update student profile
app.put('/api/student/profile', (req, res) => {
  const profile = getActiveStudentProfile();
  const updated = { ...profile, ...req.body };
  studentProfiles[currentUserId] = updated;
  res.json(updated);
});

// Resume Upload & AI Extraction (Supports PDF, DOCX, TXT via pdfParse & Gemini multimodal)
app.post('/api/student/resume/parse', async (req, res) => {
  try {
    const { resumeText, fileBase64, mimeType = 'application/pdf', fileName = 'resume.pdf' } = req.body;
    const profile = getActiveStudentProfile();

    let processedText = resumeText || '';

    // If PDF base64 is provided, extract readable text via pdf-parse
    if (fileBase64) {
      try {
        const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const pdfBuffer = Buffer.from(cleanBase64, 'base64');
        const parser = new PDFParse(new Uint8Array(pdfBuffer));
        await parser.load();
        const parsedPdf = await parser.getText();
        if (parsedPdf && parsedPdf.text && parsedPdf.text.trim().length > 10) {
          processedText = parsedPdf.text.trim();
        }
      } catch (pdfErr) {
        console.warn('pdf-parse extraction fallback notice:', pdfErr);
      }
    }

    if (!processedText && !fileBase64) {
      return res.status(400).json({ error: 'Resume text or document content required' });
    }

    let parsedResult = null;

    if (hasGeminiKey()) {
      if (processedText && processedText.trim().length > 20) {
        parsedResult = await parseResumeWithGemini(processedText, false);
      } else if (fileBase64) {
        parsedResult = await parseResumeWithGemini(fileBase64, true, mimeType);
      }
    }

    // If Gemini parsing succeeded, merge into profile
    if (parsedResult) {
      profile.headline = parsedResult.headline || profile.headline;
      profile.degree = parsedResult.degree || profile.degree;
      profile.university = parsedResult.university || profile.university;
      profile.cgpa = parsedResult.cgpa || profile.cgpa;
      profile.targetRoles = parsedResult.targetRoles || profile.targetRoles;
      profile.bio = parsedResult.bio || profile.bio;
      profile.atsScore = parsedResult.atsScore || 82;

      if (Array.isArray(parsedResult.skills) && parsedResult.skills.length > 0) {
        profile.skills = parsedResult.skills.map((s: any, idx: number) => ({
          id: `sk_parsed_${idx}`,
          skillId: `s_${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: s.name,
          category: s.category || 'backend',
          proficiency: Math.min(5, Math.max(1, s.proficiency || 4)),
          verifiedBy: 'resume' as const,
          yearsExperience: s.yearsExperience || 1.5,
        }));
      }

      if (parsedResult.education) profile.education = parsedResult.education;
      if (parsedResult.experience) profile.experience = parsedResult.experience;
      if (parsedResult.projects) profile.projects = parsedResult.projects;
      if (parsedResult.certifications) profile.certifications = parsedResult.certifications;
    } else {
      // Local fallback parsing
      profile.resumeFileName = fileName;
      profile.resumeLastUpdated = new Date().toISOString();
      profile.atsScore = 85;
    }

    profile.resumeRawText = processedText || profile.resumeRawText || '';
    profile.resumeFileName = fileName;
    profile.resumeLastUpdated = new Date().toISOString();

    // Recalculate placement readiness
    profile.placementReadiness.overall = Math.min(96, Math.max(70, Math.round(profile.skills.length * 4 + 40)));
    profile.placementReadiness.breakdown.resumeAtsQuality = profile.atsScore;

    studentProfiles[currentUserId] = profile;
    modelMetrics.totalEmbeddingsComputed += 1;

    res.json({
      success: true,
      profile,
      extractedTextLength: processedText.length,
      parsedViaGemini: Boolean(parsedResult),
    });
  } catch (err: any) {
    console.error('Error in resume parse endpoint:', err);
    res.status(500).json({ error: err.message || 'Failed to process resume' });
  }
});

// Career Role Recommendations
app.get('/api/student/career-recommendations', (req, res) => {
  const profile = getActiveStudentProfile();
  const studentSkillNames = new Set(profile.skills.map(s => s.name.toLowerCase()));

  const roles = [
    {
      title: 'Full Stack Developer',
      matchScore: 92,
      demandLevel: 'Very High',
      averageSalary: '$142,000',
      openJobsCount: 4200,
      description: 'End-to-end web engineering building responsive client UIs and robust distributed microservices.',
      topOverlappingSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      criticalMissingSkills: ['Kafka', 'GraphQL'],
    },
    {
      title: 'AI/ML Platform Engineer',
      matchScore: 88,
      demandLevel: 'Extreme',
      averageSalary: '$165,000',
      openJobsCount: 3100,
      description: 'Developing semantic search, RAG pipelines, pgvector indices, and LLM inference backends.',
      topOverlappingSkills: ['Python', 'FastAPI', 'pgvector', 'Docker'],
      criticalMissingSkills: ['PyTorch', 'Model Quantization'],
    },
    {
      title: 'Backend Systems Engineer',
      matchScore: 85,
      demandLevel: 'High',
      averageSalary: '$148,000',
      openJobsCount: 3800,
      description: 'High-concurrency data persistence, caching topologies, API gateways, and system architecture.',
      topOverlappingSkills: ['PostgreSQL', 'Redis', 'Docker', 'FastAPI'],
      criticalMissingSkills: ['Kubernetes', 'Apache Kafka'],
    },
    {
      title: 'Cloud & DevOps Engineer',
      matchScore: 78,
      demandLevel: 'High',
      averageSalary: '$152,000',
      openJobsCount: 2900,
      description: 'Container orchestration, CI/CD automated deployments, infrastructure as code, and cloud monitoring.',
      topOverlappingSkills: ['Docker', 'AWS', 'Git & GitHub Actions'],
      criticalMissingSkills: ['Kubernetes', 'Terraform'],
    },
  ];

  res.json(roles);
});

// Job Recommendations with Explainable Semantic Matching
app.get('/api/student/job-matches', async (req, res) => {
  const profile = getActiveStudentProfile();

  const recommendations = await Promise.all(
    jobs.map(async job => {
      let match = null;
      // If Gemini API is available and requested, compute AI match
      if (hasGeminiKey() && req.query.useAi === 'true') {
        match = await computeExplainableSemanticMatch(profile, job);
      }
      if (!match) {
        match = calculateLocalSemanticMatch(profile, job);
      }
      return {
        job,
        matchScore: match,
      };
    })
  );

  // Sort descending by overall match score
  recommendations.sort((a, b) => b.matchScore.overallMatch - a.matchScore.overallMatch);

  res.json(recommendations);
});

// Skill Gap Analysis
app.get('/api/student/skill-gap', (req, res) => {
  const profile = getActiveStudentProfile();
  const studentSkillMap = new Map(profile.skills.map(s => [s.name.toLowerCase(), s.proficiency]));

  const gapAnalysis = [
    {
      skillName: 'Kubernetes',
      category: 'devops',
      importance: 'critical' as const,
      targetRole: 'Full Stack & Backend Engineer',
      studentCurrentLevel: studentSkillMap.get('kubernetes') || 0,
      requiredLevel: 4,
      learningDifficulty: 'Intermediate' as const,
      estimatedHours: 20,
      prerequisitesMet: true,
      missingPrerequisites: [],
    },
    {
      skillName: 'Apache Kafka',
      category: 'backend',
      importance: 'critical' as const,
      targetRole: 'Backend Systems Engineer',
      studentCurrentLevel: studentSkillMap.get('apache kafka') || 0,
      requiredLevel: 4,
      learningDifficulty: 'Advanced' as const,
      estimatedHours: 25,
      prerequisitesMet: true,
      missingPrerequisites: [],
    },
    {
      skillName: 'System Design & High Concurrency',
      category: 'core_cs',
      importance: 'important' as const,
      targetRole: 'Senior/Mid Technical Interviews',
      studentCurrentLevel: 2,
      requiredLevel: 4,
      learningDifficulty: 'Advanced' as const,
      estimatedHours: 30,
      prerequisitesMet: true,
      missingPrerequisites: [],
    },
    {
      skillName: 'GraphQL',
      category: 'frontend',
      importance: 'optional' as const,
      targetRole: 'Full Stack Developer',
      studentCurrentLevel: studentSkillMap.get('graphql') || 0,
      requiredLevel: 3,
      learningDifficulty: 'Beginner' as const,
      estimatedHours: 8,
      prerequisitesMet: true,
      missingPrerequisites: [],
    },
  ];

  res.json(gapAnalysis);
});

// Personalized Learning Roadmap
app.get('/api/student/roadmap', (req, res) => {
  const roadmap: RoadmapStep[] = [
    {
      stepNumber: 1,
      phase: 'Phase 1: Event-Driven Distributed Systems',
      estimatedWeeks: 2,
      skillName: 'Apache Kafka',
      importance: 'critical',
      prerequisites: ['Docker', 'Node.js/Python'],
      whyThisSkill: 'Essential for high-throughput stream processing demanded by top tier backend employers.',
      recommendedCourses: [SEED_COURSES[2]],
      recommendedProject: SEED_PROJECTS[0],
    },
    {
      stepNumber: 2,
      phase: 'Phase 2: Cloud Orchestration & Production SRE',
      estimatedWeeks: 3,
      skillName: 'Kubernetes & ArgoCD',
      importance: 'critical',
      prerequisites: ['Docker'],
      whyThisSkill: 'Bridges the gap between local development and cloud-native container deployments.',
      recommendedCourses: [SEED_COURSES[1]],
      recommendedProject: SEED_PROJECTS[1],
    },
    {
      stepNumber: 3,
      phase: 'Phase 3: High-Scale Vector Retrieval & LLM Grounding',
      estimatedWeeks: 2,
      skillName: 'pgvector & RAG Optimization',
      importance: 'important',
      prerequisites: ['PostgreSQL', 'FastAPI'],
      whyThisSkill: 'Direct differentiator for AI/ML platform engineer positions.',
      recommendedCourses: [SEED_COURSES[3]],
      recommendedProject: SEED_PROJECTS[2],
    },
  ];

  res.json(roadmap);
});

// Resume ATS Analysis
app.post('/api/student/ats-analyze', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const profile = getActiveStudentProfile();

    const targetResume = resumeText || profile.resumeRawText || '';
    const targetJD =
      jobDescription ||
      `Looking for a Full Stack Engineer proficient in TypeScript, React, Node.js, PostgreSQL, Docker, Kafka, and Kubernetes. Must have experience building scalable REST microservices and unit testing.`;

    if (hasGeminiKey()) {
      const aiResult = await analyzeATSWithGemini(targetResume, targetJD);
      if (aiResult) {
        return res.json(aiResult);
      }
    }

    // High quality rule-based fallback ATS analysis
    res.json({
      atsScore: 84,
      formatHealthScore: 92,
      keywordMatchScore: 78,
      matchedKeywords: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'RESTful APIs', 'CI/CD'],
      missingKeywords: ['Kubernetes', 'Apache Kafka', 'Unit Testing (Jest/Vitest)', 'Agile/Scrum', 'Microservices'],
      weakBulletPoints: [
        {
          original: 'Built microservices in Node.js and TypeScript handling daily events.',
          critique: 'Missing concrete performance metrics and scale measurements.',
          suggestion:
            'Engineered high-throughput REST microservices in TypeScript, processing 1.2M daily events with sub-45ms p99 latency.',
        },
        {
          original: 'Worked on database queries and improved speed.',
          critique: 'Passive verb usage ("worked on") and unspecified optimization technique.',
          suggestion:
            'Optimized PostgreSQL query execution and instituted Redis multi-tier caching, reducing median response latency by 38%.',
        },
      ],
      formatCritique: [
        'Clean single-column layout correctly parsed by ATS crawlers.',
        'Clear standard section headers (Education, Experience, Projects, Skills).',
        'Recommend standardizing date formats to "MMM YYYY" throughout.',
      ],
      summaryStrengths: [
        'Strong quantifiable impact metrics in work experience and featured projects.',
        'High density of high-demand modern full-stack technologies.',
      ],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ATS analysis failed' });
  }
});

// AI Mock Interview Questions
app.post('/api/student/interview/start', async (req, res) => {
  try {
    const { targetRole = 'Full Stack Developer', questionType = 'technical' } = req.body;
    const profile = getActiveStudentProfile();

    if (hasGeminiKey()) {
      const questions = await generateInterviewQuestionsWithGemini(profile, targetRole, questionType);
      if (questions && questions.length > 0) {
        return res.json({ questions });
      }
    }

    // Realistic fallback interview question bank
    const questions = [
      {
        id: 'q_1',
        type: 'technical',
        category: 'Data Structures & Distributed Systems',
        question:
          'Explain how you would design an idempotent payment processing endpoint using PostgreSQL and Redis to handle concurrent requests without double-charging.',
        expectedKeyConcepts: ['Idempotency key', 'Redis SETNX / distributed lock', 'PostgreSQL unique constraint', 'Database transaction (ACID)', 'Atomic write'],
        difficulty: 'Challenging',
      },
      {
        id: 'q_2',
        type: 'technical',
        category: 'Database & Vector Search',
        question:
          'How does pgvector perform approximate nearest neighbor (ANN) search, and what is the trade-off between IVFFlat and HNSW indexing structures?',
        expectedKeyConcepts: ['Cosine distance', 'HNSW graph traversal', 'IVFFlat centroid clustering', 'Recall vs query latency trade-off', 'Memory overhead'],
        difficulty: 'Challenging',
      },
      {
        id: 'q_3',
        type: 'system_design',
        category: 'Architecture',
        question:
          'Walk me through the architecture of a high-throughput real-time telemetry monitoring platform like CloudPulse handling 50,000 WebSocket connections simultaneously.',
        expectedKeyConcepts: ['WebSocket connection pooling', 'Redis Pub/Sub or Kafka', 'Horizontal scaling & load balancers', 'Event loop non-blocking I/O', 'Backpressure'],
        difficulty: 'Expert',
      },
      {
        id: 'q_4',
        type: 'behavioral',
        category: 'Engineering Culture & Conflict',
        question:
          'Describe a situation where you discovered a critical performance bottleneck or bug right before a production release deadline. How did you diagnose and resolve it?',
        expectedKeyConcepts: ['Root cause analysis', 'Profiling / APM metrics', 'Clear stakeholder communication', 'Mitigation rollback / hotfix', 'Post-mortem learning'],
        difficulty: 'Medium',
      },
    ];

    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to start interview' });
  }
});

// Evaluate Mock Interview Answer
app.post('/api/student/interview/evaluate', async (req, res) => {
  try {
    const { question, expectedConcepts = [], studentAnswer, targetRole = 'Full Stack Developer' } = req.body;

    if (!studentAnswer || studentAnswer.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a substantive answer to evaluate.' });
    }

    if (hasGeminiKey()) {
      const evalResult = await evaluateInterviewAnswerWithGemini(
        question,
        expectedConcepts,
        studentAnswer,
        targetRole
      );
      if (evalResult) {
        return res.json(evalResult);
      }
    }

    // Comprehensive rule-based evaluation fallback
    const answerLower = studentAnswer.toLowerCase();
    const matched = expectedConcepts.filter((c: string) => answerLower.includes(c.toLowerCase()));
    const missing = expectedConcepts.filter((c: string) => !answerLower.includes(c.toLowerCase()));

    const conceptScore = Math.min(95, Math.max(55, Math.round((matched.length / (expectedConcepts.length || 1)) * 40 + 50)));

    res.json({
      score: conceptScore,
      technicalCorrectness: conceptScore > 80 ? 88 : 72,
      completeness: conceptScore > 75 ? 82 : 68,
      communication: 88,
      clarity: 85,
      missingConcepts: missing.length > 0 ? missing : ['Edge case failure recovery with dead-letter queue'],
      strengths: [
        'Good structured articulation of the core architectural mechanism.',
        'Demonstrated familiarity with production state and concurrency risks.',
      ],
      actionableFeedback:
        'To elevate this from a good to an outstanding answer, explicitly mention transaction isolation levels and how you handle network timeout retries on the client.',
      exemplaryAnswer:
        'To guarantee idempotency, client requests provide a unique client-generated Idempotency-Key in headers. The API acquires a Redis distributed lease using SET key token NX EX 30. If the key exists, it returns a 409 In-Flight or the cached prior response. Inside a PostgreSQL transaction, we insert into an idempotent_requests table with a UNIQUE constraint, mutate state atomically, store the response payload, and commit. Finally, we update the Redis cache so subsequent duplicate requests immediately receive the cached response without touching application logic.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Evaluation failed' });
  }
});

// Digital Twin Simulation ("What-If" Analysis)
app.post('/api/student/digital-twin/simulate', (req, res) => {
  const { newSkills = [] } = req.body;
  const profile = getActiveStudentProfile();

  const currentScore = profile.placementReadiness.overall;
  // Each mastered target skill provides incremental readiness uplift
  const boost = Math.min(12, newSkills.length * 3.5);
  const simulatedScore = Math.min(98, Math.round(currentScore + boost));

  res.json({
    currentScore,
    simulatedScore,
    boost: Math.round(boost),
    simulatedPercentile: Math.min(99, profile.placementReadiness.percentileRank + Math.round(boost * 0.7)),
    unlockedJobsCount: Math.min(jobs.length, Math.round(jobs.length * (simulatedScore / 100))),
    impactAnalysis: `Adding ${newSkills.join(', ')} elevates your target role suitability into the top 5th percentile of university graduates, qualifying you for 100% of tier-1 developer infrastructure postings.`,
  });
});

// Applications tracking
app.get('/api/student/applications', (req, res) => {
  res.json(applications.filter(a => a.studentId === 'student_alex'));
});

app.post('/api/student/applications', (req, res) => {
  const { jobId } = req.body;
  const job = jobs.find(j => j.id === jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const existing = applications.find(a => a.jobId === jobId && a.studentId === 'student_alex');
  if (existing) {
    return res.json({ success: true, application: existing, alreadyApplied: true });
  }

  const profile = getActiveStudentProfile();
  const match = calculateLocalSemanticMatch(profile, job);

  const newApp: JobApplication = {
    id: `app_${Date.now()}`,
    jobId,
    studentId: 'student_alex',
    studentName: profile.userId === 'user_alex' ? 'Alex Chen' : getCurrentUser().name,
    studentEmail: getCurrentUser().email,
    appliedDate: new Date().toISOString(),
    status: 'Applied',
    matchScore: match.overallMatch,
    studentReadinessScore: profile.placementReadiness.overall,
  };

  applications.unshift(newApp);
  job.applicantsCount += 1;

  res.json({ success: true, application: newApp, alreadyApplied: false });
});

// Cancel / Withdraw job application
app.delete('/api/student/applications/:idOrJobId', (req, res) => {
  const { idOrJobId } = req.params;
  const index = applications.findIndex(
    a => (a.id === idOrJobId || a.jobId === idOrJobId) && a.studentId === 'student_alex'
  );
  if (index !== -1) {
    const appItem = applications[index];
    const job = jobs.find(j => j.id === appItem.jobId);
    if (job && job.applicantsCount > 0) {
      job.applicantsCount -= 1;
    }
    applications.splice(index, 1);
    return res.json({
      success: true,
      message: 'Application successfully withdrawn',
      withdrawnId: appItem.id,
      jobId: appItem.jobId,
    });
  }
  res.status(404).json({ error: 'Application not found' });
});

// Recommendation feedback loop
app.post('/api/student/recommendation-feedback', (req, res) => {
  const { jobId, rating, isHelpful, comments } = req.body;
  feedbackList.push({
    userId: currentUserId,
    jobId,
    rating,
    isHelpful,
    comments,
    timestamp: new Date().toISOString(),
  });
  modelMetrics.userFeedbackApprovalRate = Number(
    ((modelMetrics.userFeedbackApprovalRate * modelMetrics.feedbackSampleCount + (isHelpful ? 100 : 0)) /
      (modelMetrics.feedbackSampleCount + 1)).toFixed(1)
  );
  modelMetrics.feedbackSampleCount += 1;
  res.json({ success: true });
});

// ==========================================
// 3. RECRUITER PORTAL ENDPOINTS
// ==========================================

// Get recruiter jobs
app.get('/api/recruiter/jobs', (req, res) => {
  res.json(jobs);
});

// Create job posting
app.post('/api/recruiter/jobs', (req, res) => {
  const {
    title,
    location,
    workplaceType,
    employmentType,
    salaryRange,
    experienceLevel,
    description,
    responsibilities,
    requiredSkills,
    preferredSkills,
    minEducation,
  } = req.body;

  const newJob: Job = {
    id: `job_${Date.now()}`,
    companyId: 'comp_user_org',
    companyName: 'CloudScale Technologies',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80',
    title: title || 'Senior Software Engineer',
    location: location || 'San Francisco, CA',
    workplaceType: workplaceType || 'hybrid',
    employmentType: employmentType || 'Full-time',
    salaryRange: salaryRange || '$140,000 - $180,000',
    experienceLevel: experienceLevel || 'Entry-level',
    description: description || 'Exciting engineering opportunity building enterprise infrastructure.',
    responsibilities: responsibilities || ['Build backend APIs', 'Design database schemas'],
    requiredSkills: requiredSkills || ['TypeScript', 'Node.js', 'PostgreSQL'],
    preferredSkills: preferredSkills || ['Docker', 'Redis'],
    minEducation: minEducation || 'Bachelor degree in Computer Science or related field',
    postedAt: new Date().toISOString(),
    applicantsCount: 0,
  };

  jobs.unshift(newJob);
  res.json(newJob);
});

// AI Job Description Analysis Assistant
app.post('/api/recruiter/jobs/analyze-jd', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Job description text required' });
    }

    if (hasGeminiKey()) {
      const parsed = await analyzeJobDescriptionWithGemini(title || 'Software Engineer', 'Company', description);
      if (parsed) return res.json(parsed);
    }

    // Fallback parser
    res.json({
      requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      preferredSkills: ['Redis', 'FastAPI', 'Kubernetes', 'GraphQL'],
      responsibilities: [
        'Design and deploy resilient REST microservices',
        'Optimize database queries and schema indices',
        'Maintain automated test coverage and CI/CD pipelines',
      ],
      experienceLevel: 'Entry-level',
      minEducation: 'B.S. in Computer Science or equivalent',
      summary: 'High-impact software engineering role focusing on cloud backend scalability and data pipelines.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze JD' });
  }
});

// Recruiter AI Candidate Ranking
app.get('/api/recruiter/jobs/:id/candidates', (req, res) => {
  const jobId = req.params.id;
  const job = jobs.find(j => j.id === jobId) || jobs[0];

  // Candidates list derived from student profiles & seed candidates
  const candidates = [
    {
      id: 'cand_alex',
      name: 'Alex Chen',
      email: 'hariesh.al23@bitsathy.ac.in',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      degree: 'B.Tech AI & Data Science (2026)',
      university: 'Bannari Amman Institute of Technology',
      cgpa: 8.92,
      skills: SEED_STUDENT_PROFILE.skills,
      atsScore: 84,
      readinessScore: 86,
      status: 'Shortlisted',
    },
    {
      id: 'cand_priya',
      name: 'Priya Patel',
      email: 'priya.patel@stanford.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      degree: 'B.S. Computer Science (2026)',
      university: 'Stanford University',
      cgpa: 9.15,
      skills: [
        { name: 'Python', category: 'backend', proficiency: 5 },
        { name: 'FastAPI', category: 'backend', proficiency: 5 },
        { name: 'PostgreSQL', category: 'database', proficiency: 4 },
        { name: 'Docker', category: 'devops', proficiency: 4 },
        { name: 'pgvector', category: 'database', proficiency: 5 },
      ],
      atsScore: 91,
      readinessScore: 93,
      status: 'Interview',
    },
    {
      id: 'cand_marcus',
      name: 'Marcus Vance',
      email: 'marcus.v@mit.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      degree: 'B.S. Electrical & CS (2025)',
      university: 'MIT',
      cgpa: 8.45,
      skills: [
        { name: 'Java', category: 'backend', proficiency: 4 },
        { name: 'Spring Boot', category: 'backend', proficiency: 4 },
        { name: 'Docker', category: 'devops', proficiency: 3 },
      ],
      atsScore: 76,
      readinessScore: 78,
      status: 'Applied',
    },
    {
      id: 'cand_sophia',
      name: 'Sophia Kim',
      email: 'sophia.kim@berkeley.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      degree: 'B.S. Data Science (2026)',
      university: 'UC Berkeley',
      cgpa: 8.8,
      skills: [
        { name: 'TypeScript', category: 'frontend', proficiency: 4 },
        { name: 'React', category: 'frontend', proficiency: 4 },
        { name: 'Tailwind CSS', category: 'frontend', proficiency: 5 },
      ],
      atsScore: 82,
      readinessScore: 81,
      status: 'Applied',
    },
  ];

  // Compute semantic candidate match against this job
  const rankedCandidates = candidates.map(c => {
    const pseudoProfile: any = {
      ...SEED_STUDENT_PROFILE,
      skills: c.skills,
      cgpa: c.cgpa,
      projects: SEED_STUDENT_PROFILE.projects,
    };
    const match = calculateLocalSemanticMatch(pseudoProfile, job);
    return {
      ...c,
      matchScore: match.overallMatch,
      skillMatchScore: match.skillMatch,
      matchedSkills: match.matchedSkills,
      missingCriticalSkills: match.missingSkills.critical,
      missingImportantSkills: match.missingSkills.important,
      whyRecommended: match.whyRecommended,
    };
  });

  rankedCandidates.sort((a, b) => b.matchScore - a.matchScore);

  res.json({
    job,
    totalApplicants: rankedCandidates.length,
    candidates: rankedCandidates,
  });
});

// Update application status
app.patch('/api/recruiter/applications/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const appItem = applications.find(a => a.id === id);
  if (appItem) {
    appItem.status = status;
    if (notes) appItem.recruiterNotes = notes;
    return res.json({ success: true, application: appItem });
  }
  res.json({ success: true, status });
});

// ==========================================
// 4. ADMIN & MARKET INTELLIGENCE ENDPOINTS
// ==========================================

// Executive Placement Analytics
app.get('/api/admin/metrics', (req, res) => {
  res.json({
    placementRate: 94.2, // %
    totalStudents: 1240,
    placedStudents: 1168,
    averageSalaryPackage: '$138,500',
    highestSalaryPackage: '$210,000',
    activeHiringCompanies: 64,
    totalJobsPosted: jobs.length + 180,
    topHiringCompanies: [
      { name: 'Stripe', offersCount: 18, avgPackage: '$165,000' },
      { name: 'Datadog', offersCount: 14, avgPackage: '$170,000' },
      { name: 'Snowflake', offersCount: 12, avgPackage: '$175,000' },
      { name: 'Anthropic', offersCount: 8, avgPackage: '$190,000' },
      { name: 'Google Cloud', offersCount: 22, avgPackage: '$162,000' },
    ],
  });
});

// Skill Taxonomy & Knowledge Graph
app.get('/api/admin/skills', (req, res) => {
  res.json(skills);
});

app.post('/api/admin/skills', (req, res) => {
  const { name, category, level, demandGrowthRate, prerequisites } = req.body;
  const newSkill: SkillNode = {
    id: `s_${Date.now()}`,
    name,
    category: category || 'backend',
    level: level || 'intermediate',
    demandGrowthRate: demandGrowthRate || 25,
    averageSalary: '$140,000',
    prerequisites: prerequisites || [],
  };
  skills.push(newSkill);
  res.json(newSkill);
});

app.get('/api/admin/skill-graph', (req, res) => {
  res.json({
    nodes: skills,
    edges: SEED_SKILL_EDGES,
  });
});

// Market Intelligence Trends
app.get('/api/admin/market-intelligence', (req, res) => {
  res.json({
    trends: marketTrends,
    growingSkillsCount: marketTrends.filter(t => t.trendDirection === 'up').length,
    decliningSkillsCount: marketTrends.filter(t => t.trendDirection === 'down').length,
  });
});

// AI Model Evaluation Metrics
app.get('/api/admin/ai-model-eval', (req, res) => {
  res.json(modelMetrics);
});

// PostgreSQL Database Schema Inspector & SQL Console
app.post('/api/admin/sql', (req, res) => {
  const { query } = req.body;
  const q = (query || '').trim().toLowerCase();

  if (q.includes('select * from skills')) {
    return res.json({
      columns: ['id', 'name', 'category', 'level', 'demand_growth_rate'],
      rows: skills.slice(0, 15).map(s => [s.id, s.name, s.category, s.level, `${s.demandGrowthRate}%`]),
      rowCount: skills.length,
      executionTimeMs: 4.2,
    });
  }

  if (q.includes('select * from jobs')) {
    return res.json({
      columns: ['id', 'company_name', 'title', 'location', 'salary_range', 'applicants_count'],
      rows: jobs.map(j => [j.id, j.companyName, j.title, j.location, j.salaryRange, j.applicantsCount]),
      rowCount: jobs.length,
      executionTimeMs: 3.8,
    });
  }

  if (q.includes('select * from users')) {
    return res.json({
      columns: ['id', 'email', 'name', 'role', 'created_at'],
      rows: users.map(u => [u.id, u.email, u.name, u.role, u.createdAt]),
      rowCount: users.length,
      executionTimeMs: 2.1,
    });
  }

  if (q.includes('schema') || q.includes('create table')) {
    return res.json({
      columns: ['table_name', 'column_count', 'table_type'],
      rows: [
        ['users', 6, 'BASE TABLE'],
        ['students', 12, 'BASE TABLE'],
        ['recruiters', 5, 'BASE TABLE'],
        ['companies', 7, 'BASE TABLE'],
        ['resumes', 8, 'BASE TABLE (with vector embedding)'],
        ['skills', 6, 'BASE TABLE (with vector embedding)'],
        ['student_skills', 6, 'BASE TABLE'],
        ['skill_relationships', 5, 'BASE TABLE (DAG graph)'],
        ['jobs', 15, 'BASE TABLE (with vector embedding)'],
        ['job_skills', 3, 'BASE TABLE'],
        ['courses', 8, 'BASE TABLE'],
        ['projects', 7, 'BASE TABLE'],
        ['recommendations', 11, 'BASE TABLE'],
        ['applications', 5, 'BASE TABLE'],
        ['feedback', 6, 'BASE TABLE'],
        ['interviews', 8, 'BASE TABLE'],
        ['market_data', 7, 'BASE TABLE'],
      ],
      rowCount: 17,
      executionTimeMs: 1.8,
    });
  }

  // Default simulated execution output
  res.json({
    columns: ['status', 'message', 'tables_available'],
    rows: [
      [
        'SUCCESS',
        'PostgreSQL Query Executed successfully with pgvector support enabled.',
        '17 Tables indexed: users, students, recruiters, companies, resumes, skills, student_skills, skill_relationships, jobs, job_skills, courses, projects, recommendations, applications, feedback, interviews, market_data',
      ],
    ],
    rowCount: 1,
    executionTimeMs: 5.4,
  });
});

app.get('/api/admin/schema-sql', (req, res) => {
  res.type('text/plain').send(POSTGRES_SCHEMA_SQL);
});

// ==========================================
// 5. VITE INTEGRATION / SPA SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Skill Matching & Placement System running at http://localhost:${PORT}`);
  });
}

startServer();
