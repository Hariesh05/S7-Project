import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the GoogleGenAI instance with telemetry header
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const MODEL_NAME = 'gemini-3.8-flash';

/**
 * Checks if the Gemini API key is configured
 */
export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
}

const RESUME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    degree: { type: Type.STRING },
    university: { type: Type.STRING },
    cgpa: { type: Type.NUMBER },
    graduationYear: { type: Type.INTEGER },
    targetRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
    bio: { type: Type.STRING },
    atsScore: { type: Type.INTEGER },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          proficiency: { type: Type.INTEGER },
          yearsExperience: { type: Type.NUMBER },
        },
        required: ['name', 'category', 'proficiency'],
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          institution: { type: Type.STRING },
          degree: { type: Type.STRING },
          fieldOfStudy: { type: Type.STRING },
          startYear: { type: Type.INTEGER },
          endYear: { type: Type.INTEGER },
          grade: { type: Type.STRING },
        },
      },
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          isCurrent: { type: Type.BOOLEAN },
          description: { type: Type.STRING },
          skillsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
          impactMetric: { type: Type.STRING },
        },
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          issuer: { type: Type.STRING },
          issueDate: { type: Type.STRING },
        },
      },
    },
  },
  required: ['headline', 'skills', 'atsScore', 'targetRoles'],
};

/**
 * Parses resume either from raw text OR from base64 PDF document using Gemini multimodal API
 */
export async function parseResumeWithGemini(
  content: string,
  isBase64Pdf = false,
  mimeType = 'application/pdf'
) {
  if (!hasGeminiKey()) {
    return null;
  }

  try {
    const promptText = `You are an expert student career coach and technical resume parser.
Extract detailed, high-accuracy structured data from this student resume.
Identify all technical and soft skills, categorize them (frontend, backend, ai_ml, devops, database, mobile, core_cs), estimate proficiency from 1 to 5 based on experience depth, extract education, work experience, projects, and certifications.
Also evaluate the overall resume quality and estimate an ATS score between 45 and 95.`;

    let contentsPayload: any;

    if (isBase64Pdf) {
      // Clean base64 string if data URL prefix exists
      const cleanBase64 = content.replace(/^data:[^;]+;base64,/, '');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'application/pdf',
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      };
    } else {
      contentsPayload = `${promptText}\n\nResume Content:\n${content.slice(0, 9000)}`;
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESUME_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (error) {
    console.error('Gemini Resume Parse error:', error);
    return null;
  }
}

/**
 * Analyzes a Job Description to extract skills, seniority, and responsibilities
 */
export async function analyzeJobDescriptionWithGemini(jobTitle: string, company: string, description: string) {
  if (!hasGeminiKey()) return null;

  try {
    const prompt = `Analyze this job posting for ${jobTitle} at ${company}.
Extract:
1. Required skills (non-negotiable hard prerequisites)
2. Preferred skills (good to have bonus skills)
3. Key technical responsibilities
4. Minimum education required
5. Experience level

Job Description:
${description.slice(0, 6000)}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            preferredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            experienceLevel: { type: Type.STRING },
            minEducation: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ['requiredSkills', 'preferredSkills', 'responsibilities'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Gemini Job Description Analysis error:', err);
    return null;
  }
}

/**
 * Computes explainable semantic match between student and job posting
 */
export async function computeExplainableSemanticMatch(studentProfile: any, job: any) {
  if (!hasGeminiKey()) return null;

  try {
    const prompt = `Perform an in-depth semantic resume-to-job matching analysis for a university student.
Student Profile:
- Target roles: ${studentProfile.targetRoles?.join(', ')}
- Skills: ${studentProfile.skills?.map((s: any) => `${s.name} (${s.proficiency}/5)`).join(', ')}
- Projects: ${studentProfile.projects?.map((p: any) => `${p.title} using ${p.technologies?.join(',')}: ${p.description}`).join('; ')}
- Experience: ${studentProfile.experience?.map((e: any) => `${e.role} at ${e.company}`).join('; ')}
- Education: ${studentProfile.degree} at ${studentProfile.university} (CGPA: ${studentProfile.cgpa})

Job Profile:
- Title: ${job.title} at ${job.companyName}
- Required Skills: ${job.requiredSkills?.join(', ')}
- Preferred Skills: ${job.preferredSkills?.join(', ')}
- Description: ${job.description}

Calculate:
1. Overall Match (0-100)
2. Skill Match (0-100)
3. Experience Match (0-100)
4. Education Match (0-100)
5. Project Relevance (0-100)
6. Vector cosine similarity estimation (0.0 to 1.0)
7. 3-4 concrete reasons WHY this job was recommended (prose sentences explaining specific overlaps)
8. Matched skills
9. Missing skills categorized strictly into:
   - Critical (vital prerequisites without which candidate will likely fail screening)
   - Important (moderately required for core responsibilities)
   - Optional (nice-to-have or preferred perks)
10. Projected readiness score boost if critical skills are mastered (1-15 points)`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallMatch: { type: Type.INTEGER },
            skillMatch: { type: Type.INTEGER },
            experienceMatch: { type: Type.INTEGER },
            educationMatch: { type: Type.INTEGER },
            projectRelevance: { type: Type.INTEGER },
            vectorSimilarity: { type: Type.NUMBER },
            whyRecommended: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: {
              type: Type.OBJECT,
              properties: {
                critical: { type: Type.ARRAY, items: { type: Type.STRING } },
                important: { type: Type.ARRAY, items: { type: Type.STRING } },
                optional: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['critical', 'important', 'optional'],
            },
            projectedReadinessBoost: { type: Type.INTEGER },
          },
          required: [
            'overallMatch',
            'skillMatch',
            'experienceMatch',
            'educationMatch',
            'projectRelevance',
            'whyRecommended',
            'matchedSkills',
            'missingSkills',
          ],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Semantic match error:', err);
    return null;
  }
}

/**
 * Analyzes resume against job description for ATS optimization
 */
export async function analyzeATSWithGemini(resumeText: string, targetJobDescription: string) {
  if (!hasGeminiKey()) return null;

  try {
    const prompt = `You are a Principal Talent Acquisition Architect and ATS parsing engine.
Compare this student's resume against the target job posting to identify ATS pass-rate blockers.
Provide:
1. Overall ATS score (0-100)
2. Format health score (0-100)
3. Keyword match score (0-100)
4. Matched keywords
5. Missing critical keywords from the job description
6. Weak bullet points that lack metrics or strong action verbs, with detailed critique and high-impact rewrites adhering to Google's XYZ formula ("Accomplished [X], measured by [Y], by doing [Z]"). Do NOT hallucinate fake company experience.
7. Format and layout critiques.
8. Strengths in the summary and experience.

Resume:
${resumeText.slice(0, 6000)}

Job Description:
${targetJobDescription.slice(0, 4000)}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.INTEGER },
            formatHealthScore: { type: Type.INTEGER },
            keywordMatchScore: { type: Type.INTEGER },
            matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            weakBulletPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  critique: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                },
                required: ['original', 'critique', 'suggestion'],
              },
            },
            formatCritique: { type: Type.ARRAY, items: { type: Type.STRING } },
            summaryStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'atsScore',
            'formatHealthScore',
            'keywordMatchScore',
            'matchedKeywords',
            'missingKeywords',
            'weakBulletPoints',
          ],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('ATS Analysis error:', err);
    return null;
  }
}

/**
 * Generates tailored mock interview questions based on student profile and target role
 */
export async function generateInterviewQuestionsWithGemini(
  studentProfile: any,
  targetRole: string,
  questionType: string
) {
  if (!hasGeminiKey()) return null;

  try {
    const prompt = `Generate 4 realistic interview questions for a student aspiring to become a ${targetRole}.
Focus on question type: ${questionType} (can be technical, system_design, behavioral, or project_deep_dive).
Candidate skills: ${studentProfile?.skills?.map((s: any) => s.name).slice(0, 8).join(', ') || 'General Engineering'}
Candidate projects: ${studentProfile?.projects?.map((p: any) => p.title).join(', ') || 'Web Applications'}

Each question must be challenging, professional, and contain expected key concepts to check for.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              category: { type: Type.STRING },
              question: { type: Type.STRING },
              expectedKeyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
              difficulty: { type: Type.STRING },
            },
            required: ['id', 'type', 'category', 'question', 'expectedKeyConcepts', 'difficulty'],
          },
        },
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (err) {
    console.error('Generate Interview Questions error:', err);
    return null;
  }
}

/**
 * Evaluates candidate interview answer in real-time
 */
export async function evaluateInterviewAnswerWithGemini(
  question: string,
  expectedConcepts: string[],
  studentAnswer: string,
  targetRole: string
) {
  if (!hasGeminiKey()) return null;

  try {
    const prompt = `You are a Senior Engineering Hiring Manager at a tier-1 tech company interviewing a candidate for ${targetRole}.
Evaluate the candidate's answer to this question:
Question: "${question}"
Expected Key Concepts: ${expectedConcepts.join(', ')}

Candidate's Answer:
"${studentAnswer}"

Evaluate strictly on:
1. Overall Score (0-100)
2. Technical Correctness (0-100)
3. Completeness (0-100)
4. Communication (0-100)
5. Clarity (0-100)
6. Missing Concepts (key technical nuances missed)
7. Strengths in the answer
8. Actionable coaching feedback to improve for the real interview
9. Exemplary Answer (a gold-standard 100/100 model answer that would blow the interviewer away)`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            technicalCorrectness: { type: Type.INTEGER },
            completeness: { type: Type.INTEGER },
            communication: { type: Type.INTEGER },
            clarity: { type: Type.INTEGER },
            missingConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableFeedback: { type: Type.STRING },
            exemplaryAnswer: { type: Type.STRING },
          },
          required: [
            'score',
            'technicalCorrectness',
            'completeness',
            'communication',
            'clarity',
            'missingConcepts',
            'strengths',
            'actionableFeedback',
            'exemplaryAnswer',
          ],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Evaluate interview answer error:', err);
    return null;
  }
}
