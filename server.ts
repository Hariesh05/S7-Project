import express from 'express';
import cors from 'cors';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
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
  StudentSkill,
  GitHubDetails,
  LeetCodeDetails,
} from './src/types/index.ts';

import { calculateLocalSemanticMatch } from './src/server/matching.ts';

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
import { parseResumeWithNlp } from './src/server/resumeNlp.ts';
import {
  database,
  deleteApplication,
  initializeStorage,
  saveApplication,
  saveFeedback,
  saveJob,
  saveSkill,
  saveStudentProfile,
  seedDemoJobs,
  saveUser,
} from './src/server/storage.ts';
const nodeRequire = createRequire(import.meta.url);
const { PDFParse } = nodeRequire('pdf-parse');
const mammoth = nodeRequire('mammoth');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
);
const RECRUITER_EMAILS = new Set(
  (process.env.RECRUITER_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
);
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
const requestUserStorage = new AsyncLocalStorage<string>();
const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-Memory Database State (mimicking PostgreSQL relational store with session state)
let users: User[] = [];
let studentProfiles: Record<string, StudentProfile> = {};
let jobs: Job[] = [];
let skills: SkillNode[] = [];
let applications: JobApplication[] = [];
let marketTrends: any[] = [];
let feedbackList: any[] = [];

// Helper to get active user
const getCurrentUser = () => {
  const userId = requestUserStorage.getStore();
  const user = users.find(candidate => candidate.id === userId);
  if (!user) throw new Error('Authenticated user not found');
  return user;
};

const getActiveUserId = () => {
  const userId = requestUserStorage.getStore();
  if (!userId) throw new Error('Authenticated user context is missing');
  return userId;
};

const createStudentProfile = (user: User): StudentProfile => ({
  id: `student_${user.id}`,
  userId: user.id,
  headline: `${user.name} · Student`,
  university: '',
  degree: '',
  graduationYear: new Date().getFullYear(),
  cgpa: 0,
  targetRoles: [],
  bio: '',
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  topCertifications: [],
  github: {
    username: '',
    profileUrl: '',
    publicRepos: 0,
    totalStars: 0,
    followers: 0,
    contributions: 0,
    topLanguages: [],
  },
  leetcode: {
    username: '',
    profileUrl: '',
    ranking: 0,
    rating: 0,
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    acceptanceRate: 0,
  },
  placementReadiness: {
    overall: 0,
    breakdown: {
      technicalSkills: 0,
      projectsPortfolio: 0,
      resumeAtsQuality: 0,
      mockInterviewPerformance: 0,
      marketAlignment: 0,
    },
    percentileRank: 0,
    strengths: [],
    improvementAreas: [],
  },
  atsScore: 0,
  resumeUrl: undefined,
  resumeFileName: '',
  resumeLastUpdated: undefined,
  resumeRawText: '',
});

async function loadPersistentState() {
  const [userRows, profileRows, jobRows, applicationRows, skillRows, trendRows, feedbackRows] = await Promise.all([
    database.query('SELECT id, email, name, avatar_url, role, created_at FROM career_app.users'),
    database.query('SELECT user_id, data FROM career_app.student_profiles'),
    database.query('SELECT id, data FROM career_app.jobs ORDER BY created_at DESC'),
    database.query('SELECT data FROM career_app.applications ORDER BY created_at DESC'),
    database.query('SELECT data FROM career_app.skills ORDER BY id'),
    database.query('SELECT data FROM career_app.market_trends ORDER BY id'),
    database.query('SELECT data FROM career_app.feedback ORDER BY created_at DESC'),
  ]);

  users = userRows.rows.map(row => ({
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: new Date(row.created_at).toISOString(),
  }));
  studentProfiles = Object.fromEntries(profileRows.rows.map(row => [row.user_id, row.data]));
  jobs = jobRows.rows.map(row => row.data);
  applications = applicationRows.rows.map(row => row.data);
  skills = skillRows.rows.map(row => row.data);
  marketTrends = trendRows.rows.map(row => row.data);
  feedbackList = feedbackRows.rows.map(row => row.data);
}

async function synchronizeAllowlistedRoles() {
  for (const user of users) {
    const email = user.email.toLowerCase();
    const role = ADMIN_EMAILS.has(email)
      ? 'admin'
      : RECRUITER_EMAILS.has(email)
        ? 'recruiter'
        : 'student';
    if (user.role !== role) {
      user.role = role;
      await saveUser(user);
    }
    if (role === 'student' && !studentProfiles[user.id]) {
      studentProfiles[user.id] = createStudentProfile(user);
      await saveStudentProfile(user.id, studentProfiles[user.id]);
    }
  }
}

const getSessionUserId = (req: express.Request) => {
  const sessionCookie = req.headers.cookie
    ?.split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith('nexus_session='))
    ?.slice('nexus_session='.length);
  if (!sessionCookie) return null;

  const [userId, signature] = decodeURIComponent(sessionCookie).split('.');
  if (!userId || !signature) return null;
  const expected = createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer)
    ? userId
    : null;
};

const setSessionCookie = (res: express.Response, userId: string) => {
  const signature = createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `nexus_session=${encodeURIComponent(`${userId}.${signature}`)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`);
};

const cleanGitHubUsername = (input: string): string => {
  if (!input) return '';
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\/(?:www\.)?github\.com\//i, '');
  cleaned = cleaned.replace(/^github\.com\//i, '');
  cleaned = cleaned.replace(/^@/, '');
  cleaned = cleaned.split('/')[0].split('?')[0].trim();
  return cleaned;
};

const cleanLeetCodeUsername = (input: string): string => {
  if (!input) return '';
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\/(?:www\.)?leetcode\.com\/u\//i, '');
  cleaned = cleaned.replace(/^https?:\/\/(?:www\.)?leetcode\.com\//i, '');
  cleaned = cleaned.replace(/^leetcode\.com\/u\//i, '');
  cleaned = cleaned.replace(/^leetcode\.com\//i, '');
  cleaned = cleaned.replace(/^@/, '');
  cleaned = cleaned.split('/')[0].split('?')[0].trim();
  return cleaned;
};

async function fetchGitHubDetails(usernameOrUrl: string): Promise<GitHubDetails> {
  const username = cleanGitHubUsername(usernameOrUrl);
  if (!username) {
    throw new Error('Please provide a valid GitHub username or profile link.');
  }
  const headers: Record<string, string> = {
    'User-Agent': 'NexusCareer-StudentPlatform',
    Accept: 'application/vnd.github.v3+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  if (!userRes.ok) {
    if (userRes.status === 404) {
      throw new Error(`GitHub user "${username}" was not found.`);
    }
    if (userRes.status === 403) {
      throw new Error('GitHub API rate limit exceeded. You can manually enter your profile statistics.');
    }
    throw new Error(`GitHub API returned status ${userRes.status}.`);
  }
  const userData = await userRes.json();

  let totalStars = 0;
  const languageFrequency: Record<string, number> = {};

  try {
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      { headers }
    );
    if (reposRes.ok) {
      const repos = await reposRes.json();
      if (Array.isArray(repos)) {
        for (const repo of repos) {
          totalStars += Number(repo.stargazers_count) || 0;
          if (repo.language && typeof repo.language === 'string') {
            languageFrequency[repo.language] = (languageFrequency[repo.language] || 0) + 1;
          }
        }
      }
    }
  } catch (err) {
    console.warn('GitHub repos fetching fallback:', err);
  }

  const topLanguages = Object.entries(languageFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  return {
    username: userData.login || username,
    profileUrl: userData.html_url || `https://github.com/${username}`,
    publicRepos: Number(userData.public_repos) || 0,
    totalStars,
    followers: Number(userData.followers) || 0,
    topLanguages,
    lastSyncedAt: new Date().toISOString(),
  };
}

async function fetchLeetCodeDetails(usernameOrUrl: string): Promise<LeetCodeDetails> {
  const username = cleanLeetCodeUsername(usernameOrUrl);
  if (!username) {
    throw new Error('Please provide a valid LeetCode username or profile link.');
  }

  const query = JSON.stringify({
    query: `query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          reputation
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        topPercentage
      }
    }`,
    variables: { username },
  });

  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: query,
  });

  if (!res.ok) {
    throw new Error(`LeetCode API returned status ${res.status}. You can manually enter your statistics.`);
  }

  const result = await res.json();
  if (!result?.data?.matchedUser) {
    throw new Error(`LeetCode user "${username}" was not found.`);
  }

  const matched = result.data.matchedUser;
  const contest = result.data.userContestRanking;
  const subStats = matched.submitStats?.acSubmissionNum || [];

  const getDifficultyCount = (diff: string): number => {
    const entry = subStats.find((s: any) => s.difficulty?.toLowerCase() === diff.toLowerCase());
    return entry ? Number(entry.count) || 0 : 0;
  };

  const totalSolved = getDifficultyCount('all');
  const easySolved = getDifficultyCount('easy');
  const mediumSolved = getDifficultyCount('medium');
  const hardSolved = getDifficultyCount('hard');
  const ranking = contest?.globalRanking || matched.profile?.ranking || 0;
  const rating = contest?.rating ? Math.round(contest.rating) : 0;

  return {
    username: matched.username || username,
    profileUrl: `https://leetcode.com/u/${matched.username || username}`,
    ranking: Number(ranking) || 0,
    rating: Number(rating) || 0,
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    lastSyncedAt: new Date().toISOString(),
  };
}

const getActiveStudentProfile = (): StudentProfile => {
  const userId = getActiveUserId();
  if (!studentProfiles[userId]) {
    const user = getCurrentUser();
    studentProfiles[userId] = createStudentProfile(user);
  }
  const profile = studentProfiles[userId];
  if (!profile.github) {
    profile.github = {
      username: '',
      profileUrl: '',
      publicRepos: 0,
      totalStars: 0,
      followers: 0,
      contributions: 0,
      topLanguages: [],
    };
  }
  if (!profile.leetcode) {
    profile.leetcode = {
      username: '',
      profileUrl: '',
      ranking: 0,
      rating: 0,
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0,
    };
  }
  if (!profile.topCertifications) {
    profile.topCertifications = [];
  }
  return profile;
};

const recalculateProfileReadiness = (profile: StudentProfile) => {
  const averageProficiency = profile.skills.length
    ? profile.skills.reduce((total, skill) => total + skill.proficiency, 0) / profile.skills.length
    : 0;

  let technicalSkills = Math.round(averageProficiency * 20);
  if (profile.leetcode?.totalSolved && profile.leetcode.totalSolved > 0) {
    const lcBonus = Math.min(25, Math.round(Math.log10(profile.leetcode.totalSolved + 1) * 10));
    technicalSkills = Math.min(100, technicalSkills + lcBonus);
  }
  profile.placementReadiness.breakdown.technicalSkills = technicalSkills;

  let projectsPortfolio = Math.min(100, profile.projects.length * 25);
  if (profile.github?.publicRepos && profile.github.publicRepos > 0) {
    const ghBonus = Math.min(20, Math.round(profile.github.publicRepos * 2 + (profile.github.totalStars || 0) * 3));
    projectsPortfolio = Math.min(100, Math.max(projectsPortfolio, ghBonus + profile.projects.length * 15));
  }
  profile.placementReadiness.breakdown.projectsPortfolio = projectsPortfolio;

  profile.placementReadiness.breakdown.resumeAtsQuality = profile.atsScore || 0;
  profile.placementReadiness.breakdown.marketAlignment = jobs.length && profile.skills.length
    ? Math.round(jobs.reduce((total, job) => total + calculateLocalSemanticMatch(profile, job).overallMatch, 0) / jobs.length)
    : 0;
  const breakdown = profile.placementReadiness.breakdown;
  profile.placementReadiness.overall = Math.round(
    breakdown.technicalSkills * 0.35 +
    breakdown.projectsPortfolio * 0.25 +
    breakdown.resumeAtsQuality * 0.2 +
    breakdown.mockInterviewPerformance * 0.15 +
    breakdown.marketAlignment * 0.05
  );

  const strengths = new Set(profile.placementReadiness.strengths || []);
  if (profile.leetcode?.totalSolved && profile.leetcode.totalSolved >= 10) {
    strengths.add(`LeetCode problem solver: ${profile.leetcode.totalSolved} problems solved (${profile.leetcode.mediumSolved || 0} medium, ${profile.leetcode.hardSolved || 0} hard)`);
  }
  if (profile.github?.publicRepos && profile.github.publicRepos >= 2) {
    strengths.add(`GitHub developer presence: ${profile.github.publicRepos} public repositories`);
  }
  if (profile.topCertifications && profile.topCertifications.length > 0) {
    strengths.add(`Verified credentials: ${profile.topCertifications.length} verified certification(s) with documentation`);
  }
  profile.placementReadiness.strengths = Array.from(strengths);

  return profile;
};

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT
// ==========================================

// Get current logged-in user
app.get('/api/auth/current-user', (req, res) => {
  const userId = getSessionUserId(req);
  const user = users.find(candidate => candidate.id === userId) || null;
  res.json({
    user,
    hasGeminiKey: hasGeminiKey(),
  });
});

app.get('/api/auth/config', (_req, res) => {
  res.json({ clientId: GOOGLE_CLIENT_ID || null });
});

app.post('/api/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', 'nexus_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ success: true });
});

app.post('/api/auth/google', async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: 'Google sign-in is not configured on the server' });
    }

    const { credential } = req.body;
    if (typeof credential !== 'string' || !credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    let identity;
    try {
      const ticket = await googleAuthClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
      identity = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'Google credential could not be verified' });
    }
    if (!identity?.sub || !identity.email || identity.email_verified !== true) {
      return res.status(401).json({ error: 'Google account verification failed' });
    }

    const userId = `google_${identity.sub}`;
    const normalizedEmail = identity.email.toLowerCase();
    const assignedRole = ADMIN_EMAILS.has(normalizedEmail)
      ? 'admin'
      : RECRUITER_EMAILS.has(normalizedEmail)
        ? 'recruiter'
        : 'student';
    let user = users.find(candidate => candidate.id === userId);
    const isNew = !user;
    if (user) {
      user.name = identity.name || user.name;
      user.avatarUrl = identity.picture || user.avatarUrl;
      user.role = assignedRole;
    } else {
      user = {
        id: userId,
        email: identity.email,
        name: identity.name || identity.email,
        avatarUrl: identity.picture || '',
        role: assignedRole,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    }

    await saveUser(user);
    if (assignedRole === 'student' && !studentProfiles[user.id]) {
      studentProfiles[user.id] = createStudentProfile(user);
      await saveStudentProfile(user.id, studentProfiles[user.id]);
    }
    setSessionCookie(res, user.id);
    res.json({ success: true, user, isNew });
  } catch (error) {
    console.error('Google sign-in verification failed:', error);
    res.status(502).json({ error: 'Unable to verify your Google account right now' });
  }
});

app.use('/api', (req, res, next) => {
  const userId = getSessionUserId(req);
  const user = users.find(candidate => candidate.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'Sign in with Google to continue' });
  }

  const routePath = req.originalUrl.split('?')[0];
  const requiredRole = routePath.startsWith('/api/admin/')
    ? 'admin'
    : routePath.startsWith('/api/recruiter/')
      ? 'recruiter'
      : routePath.startsWith('/api/student/')
        ? 'student'
        : null;
  if (requiredRole && user.role !== requiredRole) {
    return res.status(403).json({ error: 'Your account role cannot access this resource' });
  }
  if (user.role === 'admin' && !ADMIN_EMAILS.has(user.email.toLowerCase())) {
    return res.status(403).json({ error: 'This account is not authorized for administration' });
  }
  if (user.role === 'recruiter' && !RECRUITER_EMAILS.has(user.email.toLowerCase())) {
    return res.status(403).json({ error: 'This account is not authorized for recruiting' });
  }

  requestUserStorage.run(user.id, next);
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
  const updated = recalculateProfileReadiness({ ...profile, ...req.body, id: profile.id, userId: profile.userId });
  studentProfiles[getActiveUserId()] = updated;
  void saveStudentProfile(getActiveUserId(), updated)
    .then(() => res.json(updated))
    .catch(error => {
      console.error('Profile save failed:', error);
      res.status(500).json({ error: 'Could not save your profile' });
    });
});

// Sync GitHub details
app.post('/api/student/profile/sync-github', async (req, res) => {
  try {
    const profile = getActiveStudentProfile();
    const targetUsername = req.body?.username || profile.github?.username;
    if (!targetUsername) {
      return res.status(400).json({ error: 'Please enter a GitHub username or URL to sync' });
    }
    const syncedDetails = await fetchGitHubDetails(targetUsername);
    profile.github = {
      ...profile.github,
      ...syncedDetails,
    };
    const updated = recalculateProfileReadiness(profile);
    studentProfiles[getActiveUserId()] = updated;
    await saveStudentProfile(getActiveUserId(), updated);
    res.json({
      success: true,
      github: profile.github,
      profile: updated,
      message: `Successfully synchronized GitHub data for @${syncedDetails.username}! Found ${syncedDetails.publicRepos} public repos and ${syncedDetails.totalStars} stars.`,
    });
  } catch (error) {
    console.error('GitHub sync failed:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Could not synchronize GitHub data',
    });
  }
});

// Sync LeetCode details
app.post('/api/student/profile/sync-leetcode', async (req, res) => {
  try {
    const profile = getActiveStudentProfile();
    const targetUsername = req.body?.username || profile.leetcode?.username;
    if (!targetUsername) {
      return res.status(400).json({ error: 'Please enter a LeetCode username or URL to sync' });
    }
    const syncedDetails = await fetchLeetCodeDetails(targetUsername);
    profile.leetcode = {
      ...profile.leetcode,
      ...syncedDetails,
    };
    const updated = recalculateProfileReadiness(profile);
    studentProfiles[getActiveUserId()] = updated;
    await saveStudentProfile(getActiveUserId(), updated);
    res.json({
      success: true,
      leetcode: profile.leetcode,
      profile: updated,
      message: `Successfully synchronized LeetCode data for @${syncedDetails.username}! Found ${syncedDetails.totalSolved} problems solved.`,
    });
  } catch (error) {
    console.error('LeetCode sync failed:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Could not synchronize LeetCode data',
    });
  }
});

// Update Top 3 Certifications (with file base64 or Drive links)
app.put('/api/student/certifications/top', async (req, res) => {
  try {
    const profile = getActiveStudentProfile();
    const { topCertifications } = req.body;
    if (!Array.isArray(topCertifications)) {
      return res.status(400).json({ error: 'topCertifications must be an array' });
    }

    // Limit to top 3 and normalize
    const validated = topCertifications.slice(0, 3).map((cert: any, idx: number) => ({
      id: cert.id || `cert_${Date.now()}_${idx}`,
      name: (cert.name || '').trim(),
      issuer: (cert.issuer || '').trim(),
      issueDate: cert.issueDate || '',
      expiryDate: cert.expiryDate || '',
      credentialUrl: (cert.credentialUrl || cert.driveLink || '').trim(),
      driveLink: (cert.driveLink || cert.credentialUrl || '').trim(),
      fileUrl: cert.fileUrl || '',
      fileName: cert.fileName || '',
      fileType: cert.fileType || '',
      fileSize: Number(cert.fileSize) || 0,
      skillsCovered: Array.isArray(cert.skillsCovered)
        ? cert.skillsCovered.map((s: string) => s.trim()).filter(Boolean)
        : typeof cert.skillsCovered === 'string'
          ? cert.skillsCovered.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
      description: (cert.description || '').trim(),
    })).filter((c: any) => c.name.length > 0);

    profile.topCertifications = validated;

    // Merge into general certifications list so ATS/recommendations stay synchronized
    const topNames = new Set(validated.map((c: any) => c.name.toLowerCase()));
    const otherCerts = (profile.certifications || []).filter((c: any) => !topNames.has(c.name.toLowerCase()));
    profile.certifications = [
      ...validated.map((c: any) => ({
        name: c.name,
        issuer: c.issuer,
        issueDate: c.issueDate,
        credentialUrl: c.credentialUrl || c.driveLink,
        driveLink: c.driveLink,
        fileUrl: c.fileUrl,
        fileName: c.fileName,
        fileType: c.fileType,
      })),
      ...otherCerts,
    ];

    const updated = recalculateProfileReadiness(profile);
    studentProfiles[getActiveUserId()] = updated;
    await saveStudentProfile(getActiveUserId(), updated);

    res.json({
      success: true,
      topCertifications: profile.topCertifications,
      profile: updated,
      message: 'Top certifications successfully saved to your profile!',
    });
  } catch (error) {
    console.error('Failed to save top certifications:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Could not save top certifications',
    });
  }
});

// Resume Upload & AI Extraction (Supports PDF, DOCX, TXT via pdfParse & Gemini multimodal)
app.post('/api/student/resume/parse', async (req, res) => {
  try {
    const { resumeText, fileBase64, mimeType = 'application/pdf', fileName = 'resume.pdf' } = req.body;
    const profile = getActiveStudentProfile();

    let processedText = resumeText || '';

    if (fileBase64) {
      try {
        const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const documentBuffer = Buffer.from(cleanBase64, 'base64');
        if (documentBuffer.length > 18 * 1024 * 1024) {
          return res.status(413).json({ error: 'Resume files must be 18 MB or smaller' });
        }

        const extension = fileName.toLowerCase().split('.').pop();
        if (extension === 'pdf') {
          try {
            const parser = new PDFParse(new Uint8Array(documentBuffer));
            await parser.load();
            const parsedPdf = await parser.getText();
            if (parsedPdf?.text?.trim()) processedText = parsedPdf.text.trim();
          } catch (pdfError) {
            console.warn('PDF text extraction fallback:', pdfError);
          }
        } else if (extension === 'docx') {
          const parsedDocx = await mammoth.extractRawText({ buffer: documentBuffer });
          if (parsedDocx.value?.trim()) processedText = parsedDocx.value.trim();
        } else if (extension === 'txt') {
          processedText = documentBuffer.toString('utf8').trim();
        } else {
          return res.status(400).json({ error: 'Only PDF, DOCX, and TXT resumes are supported' });
        }
      } catch (parseError) {
        console.warn('Resume document extraction failed:', parseError);
        return res.status(422).json({ error: 'Could not read this document. Try a text-based PDF or DOCX file.' });
      }
    }

    if (!processedText.trim() && !(fileBase64 && fileName.toLowerCase().endsWith('.pdf'))) {
      return res.status(400).json({ error: 'Resume text or document content required' });
    }

    let parsedResult = null;
    const geminiConfigured = hasGeminiKey();
    const activeProfile = getActiveStudentProfile();
    let nlpResult = activeProfile;
    let geminiUsed = false;
    if (processedText.trim()) {
      nlpResult = parseResumeWithNlp(processedText, skills, activeProfile);
      parsedResult = nlpResult;
    }

    if (geminiConfigured) {
      let geminiResult = null;
      if (processedText && processedText.trim().length > 20) {
        geminiResult = await parseResumeWithGemini(processedText, false);
      } else if (fileBase64 && fileName.toLowerCase().endsWith('.pdf')) {
        geminiResult = await parseResumeWithGemini(fileBase64, true, mimeType);
      }
      if (geminiResult) {
        geminiUsed = true;
        parsedResult = {
          ...nlpResult,
          ...geminiResult,
          skills: Array.isArray(geminiResult.skills) && geminiResult.skills.length
            ? geminiResult.skills
            : nlpResult.skills,
        };
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
      profile.atsScore = parsedResult.atsScore ?? profile.atsScore;

      if (Array.isArray(parsedResult.skills) && parsedResult.skills.length > 0) {
        const extractedSkills: StudentSkill[] = parsedResult.skills.map((s: any, idx: number) => ({
          id: `sk_parsed_${idx}`,
          skillId: `s_${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: s.name,
          category: s.category || 'backend',
          proficiency: Math.min(5, Math.max(1, Number(s.proficiency) || 1)),
          verifiedBy: 'resume' as const,
          yearsExperience: Number(s.yearsExperience) || 0,
        }));
        const manualSkills = profile.skills.filter(skill => skill.verifiedBy === 'self');
        const manualSkillNames = new Set(manualSkills.map(skill => skill.name.trim().toLowerCase()));
        profile.skills = [
          ...extractedSkills.filter(skill => !manualSkillNames.has(skill.name.trim().toLowerCase())),
          ...manualSkills,
        ];
      }

      if (parsedResult.education) profile.education = parsedResult.education;
      if (parsedResult.experience) profile.experience = parsedResult.experience;
      if (parsedResult.projects) profile.projects = parsedResult.projects;
      if (parsedResult.certifications) profile.certifications = parsedResult.certifications;

      const detectedGh = parsedResult.github?.username || parsedResult.githubUsername;
      if (detectedGh && (!profile.github?.username || profile.github.username === '')) {
        const ghUsername = cleanGitHubUsername(detectedGh);
        profile.github = {
          username: ghUsername,
          profileUrl: `https://github.com/${ghUsername}`,
          publicRepos: profile.github?.publicRepos || 0,
          totalStars: profile.github?.totalStars || 0,
          followers: profile.github?.followers || 0,
          topLanguages: profile.github?.topLanguages || [],
        };
      }

      const detectedLc = parsedResult.leetcode?.username || parsedResult.leetcodeUsername;
      if (detectedLc && (!profile.leetcode?.username || profile.leetcode.username === '')) {
        const lcUsername = cleanLeetCodeUsername(detectedLc);
        profile.leetcode = {
          username: lcUsername,
          profileUrl: `https://leetcode.com/u/${lcUsername}`,
          ranking: profile.leetcode?.ranking || 0,
          rating: profile.leetcode?.rating || 0,
          totalSolved: profile.leetcode?.totalSolved || 0,
          easySolved: profile.leetcode?.easySolved || 0,
          mediumSolved: profile.leetcode?.mediumSolved || 0,
          hardSolved: profile.leetcode?.hardSolved || 0,
          acceptanceRate: profile.leetcode?.acceptanceRate || 0,
        };
      }
    }

    profile.resumeRawText = processedText || profile.resumeRawText || '';
    profile.resumeFileName = fileName;
    profile.resumeLastUpdated = new Date().toISOString();

    // Recalculate placement readiness
    recalculateProfileReadiness(profile);

    studentProfiles[getActiveUserId()] = profile;
    await saveStudentProfile(getActiveUserId(), profile);

    res.json({
      success: true,
      profile,
      extractedTextLength: processedText.length,
      parsedViaGemini: geminiUsed,
      extractionMethod: geminiUsed ? 'gemini+nlp' : 'nlp',
      geminiConfigured,
      parsingMessage: processedText.trim()
        ? geminiUsed
          ? 'Local NLP extraction completed and Gemini enrichment was applied.'
          : 'Local NLP extraction completed from the resume text.'
        : 'Resume text was saved, but this document did not contain readable text for NLP extraction.',
    });
  } catch (err: any) {
    console.error('Error in resume parse endpoint:', err);
    res.status(500).json({ error: err.message || 'Failed to process resume' });
  }
});

// Career Role Recommendations
app.get('/api/student/career-recommendations', (req, res) => {
  const profile = getActiveStudentProfile();
  const recommendations = jobs.map(job => ({
    title: job.title,
    job,
    matchScore: calculateLocalSemanticMatch(profile, job).overallMatch,
    demandLevel: 'Based on active listings',
    averageSalary: job.salaryRange,
    openJobsCount: 1,
    description: job.description,
    topOverlappingSkills: job.requiredSkills.filter(required =>
      profile.skills.some(skill => skill.name.toLowerCase() === required.toLowerCase())
    ),
    criticalMissingSkills: job.requiredSkills.filter(required =>
      !profile.skills.some(skill => skill.name.toLowerCase() === required.toLowerCase())
    ),
  }));
  res.json(recommendations.sort((a, b) => b.matchScore - a.matchScore));
});

app.get('/api/student/evidence-map', (req, res) => {
  const profile = getActiveStudentProfile();
  const sectionLines: Array<{ text: string; section: 'skills' | 'experience' | 'projects' | 'other' }> = [];
  let section: 'skills' | 'experience' | 'projects' | 'other' = 'other';

  for (const rawLine of (profile.resumeRawText || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.toLowerCase().replace(/[:|\-]+$/, '').trim();
    if (/^(technical\s+)?skills$|^core competencies$|^technologies$/.test(heading)) {
      section = 'skills';
      continue;
    }
    if (/^(work\s+)?experience$|^professional experience$|^employment$|^internships$/.test(heading)) {
      section = 'experience';
      continue;
    }
    if (/^(selected\s+)?projects$|^academic projects$|^personal projects$/.test(heading)) {
      section = 'projects';
      continue;
    }
    if (/^(education|certifications|certificates|summary|objective)$/.test(heading)) {
      section = 'other';
      continue;
    }
    sectionLines.push({ text: line, section });
  }

  const skillNames = new Map<string, string>();
  for (const skill of profile.skills) skillNames.set(skill.name.trim().toLowerCase(), skill.name.trim());
  for (const job of jobs) {
    for (const skillName of [...job.requiredSkills, ...job.preferredSkills]) {
      if (skillName.trim()) skillNames.set(skillName.trim().toLowerCase(), skillName.trim());
    }
  }

  const containsSkill = (line: string, skillName: string) => {
    const escaped = skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(line);
  };

  const evidence = [...skillNames].map(([normalizedName, name]) => {
    const profileSkill = profile.skills.find(skill => skill.name.trim().toLowerCase() === normalizedName);
    const experienceLines = sectionLines
      .filter(item => item.section === 'experience' && containsSkill(item.text, name))
      .map(item => item.text.slice(0, 240));
    const projectLines = sectionLines
      .filter(item => item.section === 'projects' && containsSkill(item.text, name))
      .map(item => item.text.slice(0, 240));
    const skillSectionMentioned = sectionLines.some(item => item.section === 'skills' && containsSkill(item.text, name));
    const evidenceLines = [...experienceLines, ...projectLines];
    const requiredBy = jobs.filter(job => job.requiredSkills.some(skill => skill.trim().toLowerCase() === normalizedName));
    const preferredByCount = jobs.filter(job => job.preferredSkills.some(skill => skill.trim().toLowerCase() === normalizedName)).length;
    const status = evidenceLines.length
      ? 'demonstrated'
      : profileSkill || skillSectionMentioned
        ? 'listed'
        : 'gap';

    return {
      name,
      status,
      proficiency: profileSkill?.proficiency ?? null,
      verifiedBy: profileSkill?.verifiedBy ?? null,
      requiredByCount: requiredBy.length,
      preferredByCount,
      jobTitles: requiredBy.map(job => job.title),
      experienceEvidence: experienceLines,
      projectEvidence: projectLines,
      mentionedInResumeSkills: skillSectionMentioned,
    };
  }).sort((left, right) => right.requiredByCount - left.requiredByCount || left.name.localeCompare(right.name));

  res.json({
    resumeFileName: profile.resumeFileName || null,
    resumeLastUpdated: profile.resumeLastUpdated || null,
    activeJobCount: jobs.length,
    summary: {
      demonstrated: evidence.filter(item => item.status === 'demonstrated').length,
      listed: evidence.filter(item => item.status === 'listed').length,
      gaps: evidence.filter(item => item.status === 'gap' && item.requiredByCount > 0).length,
    },
    skills: evidence,
  });
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
        job: {
          ...job,
          applicantsCount: applications.filter(application => application.jobId === job.id).length,
        },
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
  const targetJobs = jobs.filter(job => profile.targetRoles.length === 0 || profile.targetRoles.includes(job.title));
  const gaps = new Map<string, { skillName: string; targetRole: string; demand: number }>();
  for (const job of targetJobs) {
    for (const skillName of job.requiredSkills) {
      if ((studentSkillMap.get(skillName.toLowerCase()) || 0) >= 3) continue;
      const current = gaps.get(skillName) || { skillName, targetRole: job.title, demand: 0 };
      current.demand += 1;
      gaps.set(skillName, current);
    }
  }
  res.json([...gaps.values()].map(gap => {
    const catalogSkill = skills.find(skill => skill.name.toLowerCase() === gap.skillName.toLowerCase());
    const missingPrerequisites = (catalogSkill?.prerequisites || []).filter(
      prerequisite => (studentSkillMap.get(prerequisite.toLowerCase()) || 0) < 3
    );
    const difficulty = catalogSkill?.level === 'fundamental'
      ? 'Beginner'
      : catalogSkill?.level === 'advanced'
        ? 'Advanced'
        : catalogSkill?.level === 'intermediate'
          ? 'Intermediate'
          : 'Not assessed';
    return {
      ...gap,
      category: catalogSkill?.category || 'uncategorized',
      importance: 'critical' as const,
      studentCurrentLevel: studentSkillMap.get(gap.skillName.toLowerCase()) || 0,
      requiredLevel: 3,
      learningDifficulty: difficulty,
      estimatedHours: 0,
      prerequisitesMet: missingPrerequisites.length === 0,
      prerequisitesKnown: Boolean(catalogSkill),
      missingPrerequisites,
    };
  }));
});

// Personalized Learning Roadmap
app.get('/api/student/roadmap', (req, res) => {
  const profile = getActiveStudentProfile();
  const ownedSkills = new Set(profile.skills.map(skill => skill.name.toLowerCase()));
  const targetJobs = jobs.filter(job => profile.targetRoles.length === 0 || profile.targetRoles.includes(job.title));
  const missingSkills = [...new Set(targetJobs.flatMap(job => job.requiredSkills))].filter(skill => !ownedSkills.has(skill.toLowerCase()));
  const roadmap: RoadmapStep[] = missingSkills.slice(0, 6).map((skillName, index) => ({
    stepNumber: index + 1,
    phase: `Learning goal ${index + 1}`,
    estimatedWeeks: 0,
    skillName,
    importance: 'critical',
    prerequisites: [],
    whyThisSkill: `Required by ${targetJobs.filter(job => job.requiredSkills.includes(skillName)).length} active job listing(s).`,
    recommendedCourses: [],
    recommendedProject: {
      id: `practice_${skillName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      title: `Build a project using ${skillName}`,
      targetSkills: [skillName],
      difficulty: 'Intermediate',
      description: `Create and document a small, verifiable project that demonstrates practical use of ${skillName}.`,
      keyDeliverables: ['Working implementation', 'README with setup and design decisions', 'Tests or validation steps'],
      estimatedHours: 0,
      portfolioImpact: `Demonstrates ${skillName} for relevant active listings.`,
    },
  }));
  res.json(roadmap);
});

// Resume ATS Analysis
app.post('/api/student/ats-analyze', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const profile = getActiveStudentProfile();

    const targetResume = resumeText || profile.resumeRawText || '';
    const targetJD = typeof jobDescription === 'string' ? jobDescription.trim() : '';
    if (!targetResume.trim()) return res.status(400).json({ error: 'Upload or parse a resume before running ATS analysis' });
    if (!targetJD) return res.status(400).json({ error: 'Paste a target job description before running ATS analysis' });
    if (!hasGeminiKey()) return res.status(503).json({ error: 'ATS analysis requires a configured Gemini API key' });

    const aiResult = await analyzeATSWithGemini(targetResume, targetJD);
    if (!aiResult) return res.status(502).json({ error: 'Gemini could not analyze this resume right now' });
    res.json(aiResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ATS analysis failed' });
  }
});

// AI Mock Interview Questions
app.post('/api/student/interview/start', async (req, res) => {
  try {
    const { targetRole = 'Full Stack Developer', questionType = 'technical' } = req.body;
    const profile = getActiveStudentProfile();
    if (!hasGeminiKey()) return res.status(503).json({ error: 'Mock interview requires a configured Gemini API key' });
    const questions = await generateInterviewQuestionsWithGemini(profile, targetRole, questionType);
    if (!questions?.length) return res.status(502).json({ error: 'Gemini could not generate interview questions right now' });
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

    if (!hasGeminiKey()) return res.status(503).json({ error: 'Answer evaluation requires a configured Gemini API key' });
    const evalResult = await evaluateInterviewAnswerWithGemini(
      question,
      expectedConcepts,
      studentAnswer,
      targetRole
    );
    if (!evalResult) return res.status(502).json({ error: 'Gemini could not evaluate this answer right now' });
    res.json(evalResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Evaluation failed' });
  }
});

// Digital Twin Simulation ("What-If" Analysis)
app.post('/api/student/digital-twin/simulate', (req, res) => {
  const newSkills: string[] = Array.isArray(req.body.newSkills)
    ? [...new Set<string>(req.body.newSkills.filter((skill: unknown): skill is string => typeof skill === 'string'))]
    : [];
  const profile = getActiveStudentProfile();
  const existingSkills = new Set(profile.skills.map(skill => skill.name.toLowerCase()));
  const targetJobs = jobs.filter(job => profile.targetRoles.length === 0 || profile.targetRoles.includes(job.title));
  const coverage = (additionalSkills: string[]) => {
    const allSkills = new Set([...existingSkills, ...additionalSkills.map(skill => skill.toLowerCase())]);
    const totalRequired = targetJobs.reduce((total, job) => total + job.requiredSkills.length, 0);
    const matchingRequired = targetJobs.reduce(
      (total, job) => total + job.requiredSkills.filter(skill => allSkills.has(skill.toLowerCase())).length,
      0
    );
    return totalRequired ? Math.round((matchingRequired / totalRequired) * 100) : 0;
  };
  const currentScore = coverage([]);
  const simulatedScore = coverage(newSkills);

  res.json({
    currentScore,
    simulatedScore,
    boost: Math.max(0, simulatedScore - currentScore),
    unlockedJobsCount: targetJobs.filter(job => job.requiredSkills.every(skill =>
      existingSkills.has(skill.toLowerCase()) || newSkills.some(newSkill => newSkill.toLowerCase() === skill.toLowerCase())
    )).length,
    impactAnalysis: targetJobs.length
      ? `This scenario compares your current skills with required skills in ${targetJobs.length} active job posting(s). Coverage is a skills comparison, not a hiring probability.`
      : 'There are no active job postings to compare yet. Add or apply against real job listings to use this simulation.',
  });
});

// Applications tracking
app.get('/api/student/applications', (req, res) => {
  const profile = getActiveStudentProfile();
  res.json(applications.filter(application => application.studentId === profile.id));
});

app.post('/api/student/applications', async (req, res) => {
  const { jobId } = req.body;
  const job = jobs.find(j => j.id === jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const profile = getActiveStudentProfile();
  const existing = applications.find(a => a.jobId === jobId && a.studentId === profile.id);
  if (existing) {
    return res.json({ success: true, application: existing, alreadyApplied: true });
  }

  const match = calculateLocalSemanticMatch(profile, job);

  const newApp: JobApplication = {
    id: `app_${Date.now()}_${randomBytes(4).toString('hex')}`,
    jobId,
    studentId: profile.id,
    studentName: getCurrentUser().name,
    studentEmail: getCurrentUser().email,
    appliedDate: new Date().toISOString(),
    status: 'Applied',
    matchScore: match.overallMatch,
    studentReadinessScore: profile.placementReadiness.overall,
  };

  try {
    await saveApplication(newApp.id, jobId, getActiveUserId(), newApp.status, newApp);
  } catch (error) {
    console.error('Application save failed:', error);
    return res.status(500).json({ error: 'Could not submit your application' });
  }
  applications.unshift(newApp);
  job.applicantsCount = applications.filter(application => application.jobId === jobId).length;

  res.json({ success: true, application: newApp, alreadyApplied: false });
});

// Cancel / Withdraw job application
app.delete('/api/student/applications/:idOrJobId', async (req, res) => {
  const { idOrJobId } = req.params;
  const profile = getActiveStudentProfile();
  const index = applications.findIndex(
    a => (a.id === idOrJobId || a.jobId === idOrJobId) && a.studentId === profile.id
  );
  if (index !== -1) {
    const appItem = applications[index];
    await deleteApplication(appItem.id, getActiveUserId());
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
app.post('/api/student/recommendation-feedback', async (req, res) => {
  const { jobId, rating, isHelpful, comments } = req.body;
  const feedback = {
    id: `feedback_${Date.now()}_${randomBytes(4).toString('hex')}`,
    userId: getActiveUserId(),
    jobId,
    rating,
    isHelpful,
    comments,
    timestamp: new Date().toISOString(),
  };
  try {
    await saveFeedback(feedback.id, feedback.userId, feedback);
    feedbackList.push(feedback);
    res.json({ success: true });
  } catch (error) {
    console.error('Feedback save failed:', error);
    res.status(500).json({ error: 'Could not save feedback' });
  }
});

// ==========================================
// 3. RECRUITER PORTAL ENDPOINTS
// ==========================================

// Get recruiter jobs
app.get('/api/recruiter/jobs', async (req, res) => {
  const result = await database.query('SELECT data FROM career_app.jobs WHERE owner_id = $1 ORDER BY created_at DESC', [getActiveUserId()]);
  const ownedJobs = result.rows.map(row => ({
    ...row.data,
    applicantsCount: applications.filter(application => application.jobId === row.data.id).length,
  }));
  res.json(ownedJobs);
});

// Create job posting
app.post('/api/recruiter/jobs', async (req, res) => {
  const {
    companyName,
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

  if (!companyName?.trim() || !title?.trim() || !location?.trim() || !description?.trim() || !workplaceType || !employmentType || !experienceLevel) {
    return res.status(400).json({ error: 'Company, title, location, workplace, employment type, experience level, and description are required' });
  }
  if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    return res.status(400).json({ error: 'Add at least one required skill' });
  }

  const newJob: Job = {
    id: `job_${Date.now()}`,
    companyId: `company_${getActiveUserId()}`,
    companyName: companyName.trim(),
    companyLogo: '',
    title: title.trim(),
    location: location.trim(),
    workplaceType,
    employmentType,
    salaryRange: salaryRange || 'Not specified',
    experienceLevel,
    description: description.trim(),
    responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
    requiredSkills,
    preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
    minEducation: minEducation || '',
    postedAt: new Date().toISOString(),
    applicantsCount: 0,
  };

  try {
    await saveJob(newJob.id, getActiveUserId(), newJob);
    jobs.unshift(newJob);
  } catch (error) {
    console.error('Job save failed:', error);
    return res.status(500).json({ error: 'Could not save this job posting' });
  }
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
      const parsed = await analyzeJobDescriptionWithGemini(title || '', req.body.companyName || '', description);
      if (parsed) return res.json(parsed);
    }
    res.status(hasGeminiKey() ? 502 : 503).json({ error: 'AI job-description analysis is unavailable; enter requirements manually' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze JD' });
  }
});

// Recruiter AI Candidate Ranking
app.get('/api/recruiter/jobs/:id/candidates', async (req, res) => {
  const jobId = req.params.id;
  const jobResult = await database.query('SELECT data FROM career_app.jobs WHERE id = $1 AND owner_id = $2', [jobId, getActiveUserId()]);
  if (!jobResult.rowCount) return res.status(404).json({ error: 'Job not found' });
  const job: Job = jobResult.rows[0].data;
  const applicants = applications.filter(application => application.jobId === jobId);
  const rankedCandidates = applicants.flatMap(application => {
    const profile = Object.values(studentProfiles).find(candidate => candidate.id === application.studentId);
    if (!profile) return [];
    const user = users.find(candidate => candidate.id === profile.userId);
    if (!user) return [];
    const match = calculateLocalSemanticMatch(profile, job);
    return [{
      id: user.id,
      applicationId: application.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      headline: profile.headline,
      degree: profile.degree,
      university: profile.university,
      cgpa: profile.cgpa,
      skills: profile.skills,
      atsScore: profile.atsScore,
      readinessScore: profile.placementReadiness.overall,
      github: profile.github,
      leetcode: profile.leetcode,
      topCertifications: profile.topCertifications || [],
      profile: {
        headline: profile.headline,
        bio: profile.bio,
        university: profile.university,
        degree: profile.degree,
        graduationYear: profile.graduationYear,
        cgpa: profile.cgpa,
        targetRoles: profile.targetRoles,
        skills: profile.skills,
        education: profile.education,
        experience: profile.experience,
        projects: profile.projects,
        certifications: profile.certifications,
        topCertifications: profile.topCertifications || [],
        github: profile.github,
        leetcode: profile.leetcode,
        resumeFileName: profile.resumeFileName,
        resumeLastUpdated: profile.resumeLastUpdated,
        resumeRawText: profile.resumeRawText,
      },
      status: application.status,
      matchScore: match.overallMatch,
      skillMatchScore: match.skillMatch,
      matchedSkills: match.matchedSkills,
      missingCriticalSkills: match.missingSkills.critical,
      missingImportantSkills: match.missingSkills.important,
      whyRecommended: match.whyRecommended,
    }];
  }).sort((a, b) => b.matchScore - a.matchScore);

  res.json({
    job,
    totalApplicants: rankedCandidates.length,
    candidates: rankedCandidates,
  });
});

// Update application status
app.patch('/api/recruiter/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const appItem = applications.find(a => a.id === id);
  const allowedStatuses = ['Reviewing', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];
  if (!appItem || !allowedStatuses.includes(status)) return res.status(404).json({ error: 'Application or status not found' });
  const job = await database.query('SELECT 1 FROM career_app.jobs WHERE id = $1 AND owner_id = $2', [appItem.jobId, getActiveUserId()]);
  if (!job.rowCount) return res.status(403).json({ error: 'You cannot update this application' });
  appItem.status = status;
  if (typeof notes === 'string') appItem.recruiterNotes = notes;
  await saveApplication(appItem.id, appItem.jobId, appItem.studentId.replace(/^student_/, ''), status, appItem);
  res.json({ success: true, application: appItem });
});

// ==========================================
// 4. ADMIN & MARKET INTELLIGENCE ENDPOINTS
// ==========================================

// Executive Placement Analytics
app.get('/api/admin/jobs', (req, res) => {
  res.json(jobs.map(job => ({
    ...job,
    applicantsCount: applications.filter(application => application.jobId === job.id).length,
  })));
});

app.get('/api/admin/metrics', (req, res) => {
  const students = users.filter(user => user.role === 'student').length;
  const placedStudents = new Set(
    applications.filter(application => application.status === 'Offer').map(application => application.studentId)
  ).size;
  const companies = new Map<string, { name: string; offersCount: number; jobsCount: number }>();
  for (const job of jobs) {
    const company = companies.get(job.companyName) || { name: job.companyName, offersCount: 0, jobsCount: 0 };
    company.jobsCount += 1;
    company.offersCount += applications.filter(application =>
      application.jobId === job.id && application.status === 'Offer'
    ).length;
    companies.set(job.companyName, company);
  }
  res.json({
    placementRate: students ? Number(((placedStudents / students) * 100).toFixed(1)) : 0,
    totalStudents: students,
    placedStudents,
    averageSalaryPackage: 'Not recorded',
    highestSalaryPackage: 'Not recorded',
    activeHiringCompanies: companies.size,
    totalJobsPosted: jobs.length,
    demoJobsCount: jobs.filter(job => job.isDemo).length,
    topHiringCompanies: [...companies.values()]
      .sort((a, b) => b.offersCount - a.offersCount || b.jobsCount - a.jobsCount)
      .slice(0, 10)
      .map(company => ({ ...company, avgPackage: 'Not recorded' })),
  });
});

// Skill Taxonomy & Knowledge Graph
app.get('/api/admin/skills', (req, res) => {
  res.json(skills);
});

app.post('/api/admin/skills', async (req, res) => {
  const { name, category, level, demandGrowthRate, prerequisites } = req.body;
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Skill name is required' });
  const newSkill: SkillNode = {
    id: `s_${Date.now()}_${randomBytes(3).toString('hex')}`,
    name: name.trim(),
    category: category || 'backend',
    level: level || 'intermediate',
    demandGrowthRate: Number(demandGrowthRate) || 0,
    averageSalary: 'Not recorded',
    prerequisites: prerequisites || [],
  };
  await saveSkill(newSkill.id, newSkill);
  skills.push(newSkill);
  res.json(newSkill);
});

app.get('/api/student/skills', (req, res) => {
  res.json(skills);
});

app.get('/api/student/skill-graph', (req, res) => {
  res.json({
    nodes: skills,
    edges: skills.flatMap(skill => skill.prerequisites.map(prerequisite => ({
      source: prerequisite,
      target: skill.name,
      relationshipType: 'prerequisite_of',
      weight: 1,
    }))),
  });
});

app.get('/api/admin/skill-graph', (req, res) => {
  res.json({
    nodes: skills,
    edges: skills.flatMap(skill => skill.prerequisites.map(prerequisite => ({
      source: prerequisite,
      target: skill.name,
      relationshipType: 'prerequisite_of',
      weight: 1,
    }))),
  });
});

// Market Intelligence Trends
app.get('/api/admin/market-intelligence', (req, res) => {
  const demand = new Map<string, { skill: string; listings: number; roles: Set<string> }>();
  for (const job of jobs) {
    for (const skillName of [...new Set(job.requiredSkills)]) {
      const item = demand.get(skillName) || { skill: skillName, listings: 0, roles: new Set<string>() };
      item.listings += 1;
      item.roles.add(job.title);
      demand.set(skillName, item);
    }
  }
  const maxListings = Math.max(1, ...[...demand.values()].map(item => item.listings));
  const trends = [...demand.values()].map(item => ({
    skill: item.skill,
    category: skills.find(skill => skill.name.toLowerCase() === item.skill.toLowerCase())?.category || 'uncategorized',
    demandIndex: Math.round((item.listings / maxListings) * 100),
    growthYoY: 0,
    openPositionsCount: item.listings,
    trendDirection: 'stable',
    topHiringRoles: [...item.roles],
  }));
  res.json({
    trends,
    growingSkillsCount: 0,
    decliningSkillsCount: 0,
    source: 'active job postings in this workspace',
  });
});

// AI Model Evaluation Metrics
app.get('/api/admin/ai-model-eval', (req, res) => {
  const feedbackSampleCount = feedbackList.length;
  const positiveFeedbackCount = feedbackList.filter(feedback => feedback.isHelpful).length;
  res.json({
    totalEmbeddingsComputed: 0,
    averageLatencyMs: 0,
    semanticMatchAccuracyRate: 0,
    cosineDistribution: [],
    userFeedbackApprovalRate: feedbackSampleCount
      ? Number(((positiveFeedbackCount / feedbackSampleCount) * 100).toFixed(1))
      : 0,
    feedbackSampleCount,
  });
});

// PostgreSQL Database Schema Inspector & SQL Console
app.post('/api/admin/sql', async (req, res) => {
  const query = typeof req.body.query === 'string' ? req.body.query.trim() : '';
  const normalized = query.replace(/;\s*$/, '');
  if (!/^\s*(select|with)\b/i.test(normalized) || normalized.includes(';')) {
    return res.status(400).json({ error: 'Only a single read-only SELECT or WITH query is allowed' });
  }

  const client = await database.connect();
  const startedAt = Date.now();
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '5s'");
    await client.query('SET LOCAL search_path TO career_app, public');
    const result = await client.query<Record<string, unknown>>(normalized);
    await client.query('COMMIT');
    res.json({
      columns: result.fields.map(field => field.name),
      rows: result.rows.slice(0, 200).map(row => result.fields.map(field => row[field.name])),
      rowCount: result.rowCount,
      executionTimeMs: Date.now() - startedAt,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    const message = error instanceof Error ? error.message : 'Query failed';
    res.status(400).json({ error: message });
  } finally {
    client.release();
  }
});

app.get('/api/admin/schema-sql', async (req, res) => {
  try {
    const result = await database.query(
      'SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = $1 ORDER BY table_name, ordinal_position',
      ['career_app']
    );
    const tables = new Map<string, string[]>();
    for (const row of result.rows) {
      const columns = tables.get(row.table_name) || [];
      columns.push(`  ${row.column_name} ${row.data_type}`);
      tables.set(row.table_name, columns);
    }
    res.type('text/plain').send([...tables].map(([table, columns]) => `TABLE ${table}\n${columns.join('\n')}`).join('\n\n'));
  } catch (error) {
    console.error('Schema inspection failed:', error);
    res.status(500).type('text/plain').send('Could not inspect the application schema');
  }
});

// ==========================================
// 5. VITE INTEGRATION / SPA SERVING
// ==========================================
async function startServer() {
  await initializeStorage();
  await seedDemoJobs();
  await loadPersistentState();
  await synchronizeAllowlistedRoles();

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
