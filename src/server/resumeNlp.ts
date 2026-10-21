import nlp from 'compromise';
import { SkillNode, StudentProfile } from '../types/index.ts';

const KNOWN_SKILLS: Array<{ name: string; category: SkillNode['category']; aliases?: string[] }> = [
  { name: 'JavaScript', category: 'frontend', aliases: ['javascript', 'js'] },
  { name: 'TypeScript', category: 'frontend', aliases: ['typescript', 'ts'] },
  { name: 'React', category: 'frontend', aliases: ['react.js', 'reactjs'] },
  { name: 'Next.js', category: 'frontend', aliases: ['nextjs'] },
  { name: 'HTML', category: 'frontend', aliases: ['html5'] },
  { name: 'CSS', category: 'frontend', aliases: ['css3'] },
  { name: 'Tailwind CSS', category: 'frontend', aliases: ['tailwind'] },
  { name: 'Node.js', category: 'backend', aliases: ['nodejs', 'node'] },
  { name: 'Express', category: 'backend', aliases: ['express.js', 'expressjs'] },
  { name: 'Python', category: 'backend' },
  { name: 'Java', category: 'backend' },
  { name: 'C++', category: 'core_cs', aliases: ['cpp'] },
  { name: 'C#', category: 'backend', aliases: ['c sharp'] },
  { name: 'Go', category: 'backend', aliases: ['golang'] },
  { name: 'Rust', category: 'backend' },
  { name: 'SQL', category: 'database' },
  { name: 'PostgreSQL', category: 'database', aliases: ['postgres'] },
  { name: 'MySQL', category: 'database' },
  { name: 'MongoDB', category: 'database' },
  { name: 'Redis', category: 'database' },
  { name: 'Docker', category: 'devops' },
  { name: 'Kubernetes', category: 'devops', aliases: ['k8s'] },
  { name: 'AWS', category: 'devops', aliases: ['amazon web services'] },
  { name: 'Azure', category: 'devops', aliases: ['microsoft azure'] },
  { name: 'GCP', category: 'devops', aliases: ['google cloud platform', 'google cloud'] },
  { name: 'Git', category: 'devops' },
  { name: 'GitHub Actions', category: 'devops' },
  { name: 'CI/CD', category: 'devops', aliases: ['cicd', 'continuous integration', 'continuous delivery'] },
  { name: 'Machine Learning', category: 'ai_ml', aliases: ['machine-learning', 'ml'] },
  { name: 'Deep Learning', category: 'ai_ml' },
  { name: 'PyTorch', category: 'ai_ml' },
  { name: 'TensorFlow', category: 'ai_ml' },
  { name: 'scikit-learn', category: 'ai_ml', aliases: ['sklearn', 'scikit learn'] },
  { name: 'NLP', category: 'ai_ml', aliases: ['natural language processing'] },
  { name: 'GraphQL', category: 'backend' },
  { name: 'REST APIs', category: 'backend', aliases: ['rest api', 'restful api', 'restful apis'] },
  { name: 'Apache Kafka', category: 'backend', aliases: ['kafka'] },
  { name: 'Linux', category: 'devops' },
  { name: 'Swift', category: 'mobile' },
  { name: 'Kotlin', category: 'mobile' },
  { name: 'Flutter', category: 'mobile' },
  { name: 'Data Structures', category: 'core_cs', aliases: ['data structures and algorithms', 'dsa'] },
  { name: 'System Design', category: 'core_cs' },
];

const SECTION_HEADINGS: Record<string, string[]> = {
  skills: ['skills', 'technical skills', 'core competencies', 'technologies', 'technical competencies'],
  education: ['education', 'academic background', 'academics'],
  experience: ['experience', 'work experience', 'employment', 'professional experience', 'internships'],
  projects: ['projects', 'selected projects', 'personal projects', 'academic projects'],
  certifications: ['certifications', 'certificates', 'licenses'],
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#.]/g, ' ').replace(/\s+/g, ' ').trim();

function extractSections(text: string) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const sections: Record<string, string[]> = { other: [] };
  let currentSection = 'other';

  for (const line of lines) {
    const heading = normalize(line.replace(/[:|\-]+$/, ''));
    const matchedSection = Object.entries(SECTION_HEADINGS).find(([, headings]) => headings.includes(heading))?.[0];
    if (matchedSection) {
      currentSection = matchedSection;
      sections[currentSection] ||= [];
      continue;
    }
    sections[currentSection] ||= [];
    sections[currentSection].push(line);
  }

  return { lines, sections };
}

function findMention(text: string, candidate: string) {
  const haystack = ` ${normalize(text)} `;
  const needle = ` ${normalize(candidate)} `;
  if (needle.trim().length <= 2) return false;
  return haystack.includes(needle);
}

export function parseResumeWithNlp(text: string, catalogSkills: SkillNode[], fallbackProfile: StudentProfile) {
  const { lines, sections } = extractSections(text);
  const skillsText = [...(sections.skills || []), ...(sections.experience || []), ...(sections.projects || [])].join('\n');
  const catalogTerms = catalogSkills.map(skill => ({ name: skill.name, category: skill.category, aliases: [] as string[] }));
  const skillTerms = [...KNOWN_SKILLS, ...catalogTerms];
  const uniqueTerms = new Map<string, typeof skillTerms[number]>();
  for (const term of skillTerms) uniqueTerms.set(normalize(term.name), term);

  const extractedSkills = [...uniqueTerms.values()]
    .filter(term => {
      const candidates = [term.name, ...(term.aliases || [])];
      return candidates.some(candidate => findMention(skillsText || text, candidate));
    })
    .map((term, index) => ({
      id: `sk_nlp_${index}`,
      skillId: `s_${normalize(term.name).replace(/\s/g, '')}`,
      name: term.name,
      category: term.category,
      proficiency: 1,
      verifiedBy: 'resume' as const,
      yearsExperience: 0,
    }));

  const entities = nlp(lines.slice(0, 8).join('\n'));
  const people = entities.people().out('array') as string[];
  const detectedName = people.find(person => person.trim().split(/\s+/).length >= 2);
  const degreeLine = lines.find(line => /\b(b\.?s\.?|b\.?e\.?|b\.?tech|m\.?s\.?|m\.?e\.?|m\.?tech|ph\.?d|bachelor|master|associate)\b/i.test(line));
  const institutionLine = (sections.education || []).find(line => /university|college|institute|school/i.test(line));
  const cgpaMatch = text.match(/\b(?:cgpa|gpa)\s*[:\-]?\s*(\d(?:\.\d{1,2})?)/i);
  const yearMatch = text.match(/\b(?:expected|graduation|class of)\s*(20\d{2})\b/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)/i)
    || text.match(/\bgithub\s*[:\-]\s*([a-zA-Z0-9_\-]+)\b/i);
  const leetcodeMatch = text.match(/(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?([a-zA-Z0-9_\-]+)/i)
    || text.match(/\bleetcode\s*[:\-]\s*([a-zA-Z0-9_\-]+)\b/i);

  const detectedGitHubUsername = githubMatch && !['com', 'org', 'io', 'actions'].includes(githubMatch[1].toLowerCase()) ? githubMatch[1] : '';
  const detectedLeetCodeUsername = leetcodeMatch && !['com', 'problem', 'problems'].includes(leetcodeMatch[1].toLowerCase()) ? leetcodeMatch[1] : '';

  const githubDetails = detectedGitHubUsername
    ? {
        username: detectedGitHubUsername,
        profileUrl: `https://github.com/${detectedGitHubUsername}`,
        publicRepos: fallbackProfile.github?.publicRepos || 0,
        totalStars: fallbackProfile.github?.totalStars || 0,
        followers: fallbackProfile.github?.followers || 0,
        topLanguages: fallbackProfile.github?.topLanguages || [],
        ...fallbackProfile.github,
      }
    : fallbackProfile.github;

  const leetcodeDetails = detectedLeetCodeUsername
    ? {
        username: detectedLeetCodeUsername,
        profileUrl: `https://leetcode.com/u/${detectedLeetCodeUsername}`,
        ranking: fallbackProfile.leetcode?.ranking || 0,
        rating: fallbackProfile.leetcode?.rating || 0,
        totalSolved: fallbackProfile.leetcode?.totalSolved || 0,
        easySolved: fallbackProfile.leetcode?.easySolved || 0,
        mediumSolved: fallbackProfile.leetcode?.mediumSolved || 0,
        hardSolved: fallbackProfile.leetcode?.hardSolved || 0,
        ...fallbackProfile.leetcode,
      }
    : fallbackProfile.leetcode;

  return {
    ...fallbackProfile,
    headline: detectedName ? `${detectedName} · Student` : fallbackProfile.headline,
    degree: degreeLine || fallbackProfile.degree,
    university: institutionLine || fallbackProfile.university,
    cgpa: cgpaMatch ? Number(cgpaMatch[1]) : fallbackProfile.cgpa,
    graduationYear: yearMatch ? Number(yearMatch[1]) : fallbackProfile.graduationYear,
    targetRoles: fallbackProfile.targetRoles,
    skills: extractedSkills,
    github: githubDetails,
    leetcode: leetcodeDetails,
    education: sections.education?.length
      ? [{
          institution: institutionLine || '',
          degree: degreeLine || '',
          fieldOfStudy: '',
          startYear: 0,
          endYear: yearMatch ? Number(yearMatch[1]) : 0,
          grade: cgpaMatch ? cgpaMatch[1] : '',
        }]
      : fallbackProfile.education,
    extractionMethod: 'nlp',
  };
}