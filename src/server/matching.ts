import { ExplainableMatchScore, Job, StudentProfile } from '../types/index.ts';

export function calculateLocalSemanticMatch(studentProfile: StudentProfile, job: Job): ExplainableMatchScore {
  const studentSkillNames = new Set(studentProfile.skills.map(skill => skill.name.toLowerCase()));
  const required = job.requiredSkills.map(skill => skill.toLowerCase());
  const preferred = job.preferredSkills.map(skill => skill.toLowerCase());
  const matchedSkills: string[] = [];
  const missingRequired: string[] = [];
  const missingPreferred: string[] = [];

  for (const skill of job.requiredSkills) {
    if (studentSkillNames.has(skill.toLowerCase())) matchedSkills.push(skill);
    else missingRequired.push(skill);
  }
  for (const skill of job.preferredSkills) {
    if (studentSkillNames.has(skill.toLowerCase())) matchedSkills.push(skill);
    else missingPreferred.push(skill);
  }

  const requiredMatchCount = required.length - missingRequired.length;
  const preferredMatchCount = preferred.length - missingPreferred.length;
  const requiredCoverage = required.length ? requiredMatchCount / required.length : null;
  const preferredCoverage = preferred.length ? preferredMatchCount / preferred.length : null;
  const skillScore = requiredCoverage !== null && preferredCoverage !== null
    ? Math.round((requiredCoverage * 0.7 + preferredCoverage * 0.3) * 100)
    : Math.round((requiredCoverage ?? preferredCoverage ?? 0) * 100);
  const experienceScore = studentProfile.experience.length ? 100 : 0;
  const educationScore = studentProfile.degree && studentProfile.university ? 100 : 0;
  const projectTechnologies = new Set(
    studentProfile.projects.flatMap(project => project.technologies.map(technology => technology.toLowerCase()))
  );
  const projectRelevance = required.length
    ? Math.round((required.filter(skill => projectTechnologies.has(skill)).length / required.length) * 100)
    : 0;
  const overallMatch = Math.round(
    skillScore * 0.65 + projectRelevance * 0.15 + experienceScore * 0.1 + educationScore * 0.1
  );
  const whyRecommended = matchedSkills.length
    ? [`Documented skill matches: ${matchedSkills.slice(0, 5).join(', ')}.`]
    : ['No required or preferred skills are documented in the profile yet.'];
  if (studentProfile.experience.length) whyRecommended.push(`${studentProfile.experience.length} work experience record(s) are on the profile.`);
  if (studentProfile.projects.length) whyRecommended.push(`${studentProfile.projects.length} project record(s) are on the profile.`);
  if (studentProfile.degree && studentProfile.university) whyRecommended.push(`Education details are available for ${studentProfile.degree}.`);
  if (studentProfile.leetcode?.totalSolved) {
    whyRecommended.push(`${studentProfile.leetcode.totalSolved} LeetCode problems solved (${studentProfile.leetcode.mediumSolved || 0} medium, ${studentProfile.leetcode.hardSolved || 0} hard) validates core problem-solving ability.`);
  }
  if (studentProfile.github?.publicRepos) {
    whyRecommended.push(`${studentProfile.github.publicRepos} GitHub repositories (${studentProfile.github.topLanguages?.slice(0, 3).join(', ') || 'multiple languages'}) confirm hands-on coding experience.`);
  }

  return {
    jobId: job.id,
    overallMatch: Math.min(100, Math.max(0, overallMatch)),
    skillMatch: Math.min(100, Math.max(0, skillScore)),
    experienceMatch: experienceScore,
    educationMatch: educationScore,
    projectRelevance,
    vectorSimilarity: null,
    whyRecommended,
    matchedSkills,
    missingSkills: {
      critical: missingRequired,
      important: missingPreferred.slice(0, 2),
      optional: missingPreferred.slice(2),
    },
  };
}