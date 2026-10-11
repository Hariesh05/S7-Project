export type UserRole = 'student' | 'recruiter' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  headline: string;
  university: string;
  degree: string;
  graduationYear: number;
  cgpa: number;
  targetRoles: string[];
  bio: string;
  skills: StudentSkill[];
  education: Education[];
  experience: WorkExperience[];
  projects: StudentProject[];
  certifications: Certification[];
  placementReadiness: PlacementReadinessScore;
  atsScore: number;
  resumeUrl?: string;
  resumeFileName?: string;
  resumeLastUpdated?: string;
  resumeRawText?: string;
}

export interface StudentSkill {
  id: string;
  skillId: string;
  name: string;
  category: 'frontend' | 'backend' | 'ai_ml' | 'devops' | 'database' | 'mobile' | 'core_cs';
  proficiency: number; // 1 to 5
  verifiedBy: 'resume' | 'assessment' | 'project' | 'self';
  yearsExperience: number;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
  grade: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  skillsUsed: string[];
}

export interface StudentProject {
  title: string;
  description: string;
  technologies: string[];
  repoUrl?: string;
  liveUrl?: string;
  impactMetric?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface PlacementReadinessScore {
  overall: number; // 0-100
  breakdown: {
    technicalSkills: number; // 0-100 (35% weight)
    projectsPortfolio: number; // 0-100 (25% weight)
    resumeAtsQuality: number; // 0-100 (20% weight)
    mockInterviewPerformance: number; // 0-100 (15% weight)
    marketAlignment: number; // 0-100 (5% weight)
  };
  percentileRank: number;
  strengths: string[];
  improvementAreas: string[];
  digitalTwinProjection?: {
    withTargetSkillsAdded: number;
    recommendedMilestonesCount: number;
  };
}

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  title: string;
  location: string;
  workplaceType: 'remote' | 'hybrid' | 'on-site';
  employmentType: 'Full-time' | 'Internship' | 'Contract';
  salaryRange: string;
  experienceLevel: 'Entry-level' | 'Mid-level' | 'Senior' | 'Associate';
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  minEducation: string;
  postedAt: string;
  deadline?: string;
  applicantsCount: number;
  isDemo?: boolean;
}

export interface ExplainableMatchScore {
  jobId: string;
  overallMatch: number; // 0-100
  skillMatch: number; // 0-100
  experienceMatch: number; // 0-100
  educationMatch: number; // 0-100
  projectRelevance: number; // 0-100
  vectorSimilarity: number | null; // null when no vector embedding was computed
  whyRecommended: string[];
  matchedSkills: string[];
  missingSkills: {
    critical: string[];
    important: string[];
    optional: string[];
  };
}

export interface JobRecommendation {
  job: Job;
  matchScore: ExplainableMatchScore;
}

export interface SkillNode {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'ai_ml' | 'devops' | 'database' | 'mobile' | 'core_cs';
  level: 'fundamental' | 'intermediate' | 'advanced';
  demandGrowthRate: number; // percentage
  averageSalary: string;
  prerequisites: string[]; // array of skill names or IDs
}

export interface SkillKnowledgeEdge {
  source: string;
  target: string;
  relationshipType: 'prerequisite_of' | 'built_upon' | 'specializes_in' | 'synergizes_with';
  weight: number;
}

export interface SkillGapItem {
  skillName: string;
  category: string;
  importance: 'critical' | 'important' | 'optional';
  targetRole: string;
  studentCurrentLevel: number; // 0 if missing
  requiredLevel: number;
  learningDifficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Not assessed';
  estimatedHours: number;
  prerequisitesMet: boolean;
  prerequisitesKnown?: boolean;
  missingPrerequisites: string[];
}

export interface RoadmapStep {
  stepNumber: number;
  phase: string;
  estimatedWeeks: number;
  skillName: string;
  importance: 'critical' | 'important' | 'optional';
  prerequisites: string[];
  whyThisSkill: string;
  recommendedCourses: CourseRecommendation[];
  recommendedProject: ProjectRecommendation;
}

export interface CourseRecommendation {
  title: string;
  platform: 'Coursera' | 'Udemy' | 'freeCodeCamp' | 'Stanford Online' | 'Official Docs';
  duration: string;
  url: string;
  rating: number;
  level: string;
}

export interface ProjectRecommendation {
  id: string;
  title: string;
  targetSkills: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  keyDeliverables: string[];
  estimatedHours: number;
  portfolioImpact: string;
}

export interface ATSAnalysisResult {
  atsScore: number; // 0-100
  formatHealthScore: number;
  keywordMatchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  weakBulletPoints: {
    original: string;
    critique: string;
    suggestion: string;
  }[];
  formatCritique: string[];
  summaryStrengths: string[];
}

export interface MockInterviewQuestion {
  id: string;
  type: 'technical' | 'behavioral' | 'project_deep_dive' | 'system_design';
  category: string;
  question: string;
  expectedKeyConcepts: string[];
  difficulty: 'Medium' | 'Challenging' | 'Expert';
}

export interface InterviewEvaluation {
  questionId: string;
  score: number; // 0-100
  technicalCorrectness: number; // 0-100
  completeness: number; // 0-100
  communication: number; // 0-100
  clarity: number; // 0-100
  missingConcepts: string[];
  strengths: string[];
  actionableFeedback: string;
  exemplaryAnswer: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  appliedDate: string;
  status: 'Applied' | 'Reviewing' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected';
  matchScore: number;
  studentReadinessScore: number;
  recruiterNotes?: string;
}

export interface MarketTrendItem {
  skill: string;
  category: string;
  demandIndex: number; // 0-100
  growthYoY: number; // e.g. +34%
  openPositionsCount: number;
  trendDirection: 'up' | 'stable' | 'down';
  topHiringRoles: string[];
}

export interface AIModelEvaluationMetrics {
  totalEmbeddingsComputed: number;
  averageLatencyMs: number;
  semanticMatchAccuracyRate: number; // 0-100
  cosineDistribution: { bucket: string; count: number }[];
  userFeedbackApprovalRate: number; // 0-100
  feedbackSampleCount: number;
}
