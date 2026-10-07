import {
  User,
  StudentProfile,
  Job,
  SkillNode,
  SkillKnowledgeEdge,
  CourseRecommendation,
  ProjectRecommendation,
  JobApplication,
  MarketTrendItem,
  AIModelEvaluationMetrics,
  ExplainableMatchScore,
} from '../types/index.ts';

/**
 * PostgreSQL Schema DDL definitions
 * Representing all 17 tables required by the specification.
 */
export const POSTGRES_SCHEMA_SQL = `
-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'recruiter', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  headline VARCHAR(255),
  university VARCHAR(255),
  degree VARCHAR(255),
  graduation_year INT,
  cgpa NUMERIC(3,2),
  target_roles TEXT[],
  bio TEXT,
  ats_score INT DEFAULT 75,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. recruiters
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID,
  title VARCHAR(255),
  department VARCHAR(255)
);

-- 4. companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo TEXT,
  website TEXT,
  industry VARCHAR(100),
  headquarters VARCHAR(100),
  size VARCHAR(50)
);

-- 5. resumes
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  raw_text TEXT,
  parsed_data JSONB,
  vector_embedding vector(1536),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  level VARCHAR(50) DEFAULT 'intermediate',
  demand_growth_rate NUMERIC(5,2),
  vector_embedding vector(1536)
);

-- 7. student_skills
CREATE TABLE IF NOT EXISTS student_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  proficiency INT CHECK (proficiency BETWEEN 1 AND 5),
  verified_by VARCHAR(50),
  years_experience NUMERIC(3,1)
);

-- 8. skill_relationships (Knowledge Graph DAG)
CREATE TABLE IF NOT EXISTS skill_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_skill VARCHAR(100) NOT NULL,
  target_skill VARCHAR(100) NOT NULL,
  relationship_type VARCHAR(50) NOT NULL,
  weight NUMERIC(3,2) DEFAULT 1.0
);

-- 9. jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  title VARCHAR(255) NOT NULL,
  location VARCHAR(100),
  workplace_type VARCHAR(50),
  employment_type VARCHAR(50),
  salary_range VARCHAR(100),
  experience_level VARCHAR(50),
  description TEXT,
  responsibilities TEXT[],
  required_skills TEXT[],
  preferred_skills TEXT[],
  min_education VARCHAR(100),
  vector_embedding vector(1536),
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. job_skills
CREATE TABLE IF NOT EXISTS job_skills (
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (job_id, skill_id)
);

-- 11. courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  platform VARCHAR(100),
  duration VARCHAR(50),
  url TEXT,
  rating NUMERIC(2,1),
  level VARCHAR(50),
  skill_covered VARCHAR(100)
);

-- 12. projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  difficulty VARCHAR(50),
  description TEXT,
  key_deliverables TEXT[],
  target_skills TEXT[],
  estimated_hours INT
);

-- 13. recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  overall_match INT,
  skill_match INT,
  experience_match INT,
  education_match INT,
  project_relevance INT,
  cosine_similarity NUMERIC(4,3),
  why_recommended TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'Applied',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  recommendation_id UUID,
  rating INT,
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. interviews
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  target_role VARCHAR(100),
  question TEXT,
  student_answer TEXT,
  overall_score INT,
  actionable_feedback TEXT,
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. market_data
CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name VARCHAR(100),
  demand_index INT,
  growth_yoy NUMERIC(5,2),
  open_positions INT,
  trend_direction VARCHAR(20),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

// Seed Users
export const SEED_USERS: User[] = [
  {
    id: 'user_alex',
    email: 'hariesh.al23@bitsathy.ac.in',
    name: 'Alex Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'user_sarah',
    email: 'sarah.jenkins@cloudscale.io',
    name: 'Sarah Jenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'recruiter',
    createdAt: '2025-11-01T10:00:00Z',
  },
  {
    id: 'user_admin',
    email: 'admin.placement@university.edu',
    name: 'Dr. Robert Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    createdAt: '2025-09-01T09:00:00Z',
  },
  {
    id: 'user_priya',
    email: 'priya.patel@stanford.edu',
    name: 'Priya Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    createdAt: '2026-02-10T11:00:00Z',
  },
];

// Seed Student Profile
export const SEED_STUDENT_PROFILE: StudentProfile = {
  id: 'student_alex',
  userId: 'user_alex',
  headline: 'Senior Computer Science Major · Full-Stack & ML Specialist',
  university: 'Bannari Amman Institute of Technology',
  degree: 'B.Tech in Artificial Intelligence & Data Science',
  graduationYear: 2026,
  cgpa: 8.92,
  targetRoles: ['Full Stack Developer', 'AI/ML Engineer', 'Backend Developer'],
  bio: 'Passionate software engineer building resilient distributed systems and generative AI applications. Winner of 2 national hackathons with a keen interest in high-scale cloud architectures.',
  atsScore: 84,
  resumeFileName: 'Alex_Chen_Tech_Resume_2026.pdf',
  resumeLastUpdated: '2026-03-28T14:30:00Z',
  resumeRawText: `Alex Chen
Email: hariesh.al23@bitsathy.ac.in | GitHub: github.com/alexchen | LinkedIn: linkedin.com/in/alexchen
Education: B.Tech Artificial Intelligence & Data Science, Bannari Amman Institute of Technology, CGPA: 8.92/10 (Expected 2026)

Technical Skills:
- Languages: TypeScript, Python, Java, SQL, Go (Beginner)
- Frontend: React.js, Next.js, Tailwind CSS, Redux Toolkit
- Backend: Node.js, Express, FastAPI, RESTful APIs, GraphQL
- Databases & Vector: PostgreSQL, MongoDB, Redis, pgvector
- Cloud & DevOps: Docker, AWS (S3, EC2), Git, GitHub Actions, Linux

Work Experience:
Software Engineering Intern | ByteStream Technologies (Jun 2025 - Aug 2025)
- Engineered high-throughput REST microservices in Node.js and TypeScript, handling 1.2M daily payload events with sub-45ms p99 latency.
- Refactored PostgreSQL indexing and query caching with Redis, cutting database execution times by 38%.
- Integrated automated CI/CD pipeline using GitHub Actions and Docker, reducing release deployment cycles by 25 minutes.

Featured Projects:
1. NeuralSearch - Semantic Multimodal Retrieval Engine (Python, FastAPI, pgvector, PyTorch)
- Architected vector search platform indexing 150,000 research articles with hybrid BM25 and cosine dense vector re-ranking.
- Built interactive frontend with React and Tailwind CSS providing real-time query latencies under 60ms.

2. CloudPulse - Distributed Microservice Health Monitor (TypeScript, React, Go, Docker)
- Designed real-time telemetry dashboard monitoring distributed Kubernetes cluster nodes via WebSockets.

Certifications:
- AWS Certified Cloud Practitioner
- DeepLearning.AI Specialization in Deep Learning`,
  skills: [
    { id: 'sk_ts', skillId: 's_ts', name: 'TypeScript', category: 'frontend', proficiency: 5, verifiedBy: 'assessment', yearsExperience: 2.5 },
    { id: 'sk_py', skillId: 's_py', name: 'Python', category: 'backend', proficiency: 4, verifiedBy: 'project', yearsExperience: 3 },
    { id: 'sk_react', skillId: 's_react', name: 'React', category: 'frontend', proficiency: 5, verifiedBy: 'resume', yearsExperience: 2.5 },
    { id: 'sk_node', skillId: 's_node', name: 'Node.js', category: 'backend', proficiency: 4, verifiedBy: 'resume', yearsExperience: 2 },
    { id: 'sk_pg', skillId: 's_pg', name: 'PostgreSQL', category: 'database', proficiency: 4, verifiedBy: 'project', yearsExperience: 2 },
    { id: 'sk_redis', skillId: 's_redis', name: 'Redis', category: 'database', proficiency: 3, verifiedBy: 'project', yearsExperience: 1 },
    { id: 'sk_docker', skillId: 's_docker', name: 'Docker', category: 'devops', proficiency: 4, verifiedBy: 'assessment', yearsExperience: 1.5 },
    { id: 'sk_fastapi', skillId: 's_fastapi', name: 'FastAPI', category: 'backend', proficiency: 4, verifiedBy: 'project', yearsExperience: 1.5 },
    { id: 'sk_pgvector', skillId: 's_pgvector', name: 'pgvector', category: 'database', proficiency: 4, verifiedBy: 'project', yearsExperience: 1 },
    { id: 'sk_tailwind', skillId: 's_tailwind', name: 'Tailwind CSS', category: 'frontend', proficiency: 5, verifiedBy: 'project', yearsExperience: 2 },
    { id: 'sk_aws', skillId: 's_aws', name: 'AWS', category: 'devops', proficiency: 3, verifiedBy: 'self', yearsExperience: 1 },
    { id: 'sk_git', skillId: 's_git', name: 'Git & GitHub Actions', category: 'devops', proficiency: 4, verifiedBy: 'resume', yearsExperience: 3 },
  ],
  education: [
    {
      institution: 'Bannari Amman Institute of Technology',
      degree: 'B.Tech in Artificial Intelligence & Data Science',
      fieldOfStudy: 'Computer Science & AI',
      startYear: 2022,
      endYear: 2026,
      grade: '8.92 / 10 CGPA',
    },
  ],
  experience: [
    {
      company: 'ByteStream Technologies',
      role: 'Software Engineering Intern',
      startDate: 'June 2025',
      endDate: 'August 2025',
      isCurrent: false,
      description: 'Engineered high-throughput REST microservices in Node.js & TypeScript, handling 1.2M daily payload events with sub-45ms p99 latency.',
      skillsUsed: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
    },
  ],
  projects: [
    {
      title: 'NeuralSearch - Semantic Multimodal Retrieval Engine',
      description: 'Architected vector search platform indexing 150k articles with hybrid BM25 and cosine dense vector re-ranking.',
      technologies: ['Python', 'FastAPI', 'pgvector', 'PyTorch', 'React'],
      repoUrl: 'https://github.com/alexchen/neural-search',
      impactMetric: 'Achieved 94.2% MRR@10 with sub-60ms query latency',
    },
    {
      title: 'CloudPulse - Distributed Health Monitor',
      description: 'Designed real-time telemetry dashboard monitoring distributed Kubernetes cluster nodes via WebSockets.',
      technologies: ['TypeScript', 'React', 'Go', 'Docker', 'Tailwind CSS'],
      repoUrl: 'https://github.com/alexchen/cloudpulse',
      impactMetric: 'Monitored 40+ concurrent microservice instances in real-time',
    },
  ],
  certifications: [
    {
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issueDate: 'August 2025',
    },
    {
      name: 'Deep Learning Specialization',
      issuer: 'DeepLearning.AI',
      issueDate: 'December 2024',
    },
  ],
  placementReadiness: {
    overall: 86,
    breakdown: {
      technicalSkills: 88,
      projectsPortfolio: 90,
      resumeAtsQuality: 84,
      mockInterviewPerformance: 80,
      marketAlignment: 89,
    },
    percentileRank: 92,
    strengths: [
      'Strong hands-on mastery in modern TypeScript and Python full-stack architectures',
      'Proven projects utilizing vector embeddings and pgvector semantic retrieval',
      'Solid foundations in containerization (Docker) and relational query optimization (PostgreSQL + Redis)',
    ],
    improvementAreas: [
      'Expand distributed system design depth (Kafka/message queues and Kubernetes)',
      'Add end-to-end integration testing suites (Playwright, Jest/Vitest)',
      'Practice system design mock interviews for high-concurrency architectures',
    ],
    digitalTwinProjection: {
      withTargetSkillsAdded: 94,
      recommendedMilestonesCount: 3,
    },
  },
};

// Skill Knowledge Graph Nodes
export const SEED_SKILLS: SkillNode[] = [
  { id: 's_java', name: 'Java', category: 'backend', level: 'fundamental', demandGrowthRate: 12, averageSalary: '$125,000', prerequisites: [] },
  { id: 's_spring', name: 'Spring Framework', category: 'backend', level: 'intermediate', demandGrowthRate: 18, averageSalary: '$135,000', prerequisites: ['Java'] },
  { id: 's_springboot', name: 'Spring Boot', category: 'backend', level: 'intermediate', demandGrowthRate: 24, averageSalary: '$140,000', prerequisites: ['Spring Framework'] },
  { id: 's_springsec', name: 'Spring Security', category: 'backend', level: 'advanced', demandGrowthRate: 28, averageSalary: '$148,000', prerequisites: ['Spring Boot'] },

  { id: 's_py', name: 'Python', category: 'backend', level: 'fundamental', demandGrowthRate: 22, averageSalary: '$130,000', prerequisites: [] },
  { id: 's_numpy', name: 'NumPy', category: 'ai_ml', level: 'fundamental', demandGrowthRate: 19, averageSalary: '$132,000', prerequisites: ['Python'] },
  { id: 's_pandas', name: 'Pandas', category: 'ai_ml', level: 'intermediate', demandGrowthRate: 21, averageSalary: '$135,000', prerequisites: ['NumPy'] },
  { id: 's_ml', name: 'Machine Learning', category: 'ai_ml', level: 'intermediate', demandGrowthRate: 32, averageSalary: '$150,000', prerequisites: ['Pandas', 'Python'] },
  { id: 's_dl', name: 'Deep Learning', category: 'ai_ml', level: 'advanced', demandGrowthRate: 41, averageSalary: '$165,000', prerequisites: ['Machine Learning'] },
  { id: 's_llm', name: 'LLM & Generative AI', category: 'ai_ml', level: 'advanced', demandGrowthRate: 64, averageSalary: '$175,000', prerequisites: ['Deep Learning', 'Python'] },

  { id: 's_js', name: 'JavaScript', category: 'frontend', level: 'fundamental', demandGrowthRate: 14, averageSalary: '$120,000', prerequisites: [] },
  { id: 's_ts', name: 'TypeScript', category: 'frontend', level: 'intermediate', demandGrowthRate: 36, averageSalary: '$142,000', prerequisites: ['JavaScript'] },
  { id: 's_react', name: 'React', category: 'frontend', level: 'intermediate', demandGrowthRate: 28, averageSalary: '$138,000', prerequisites: ['JavaScript', 'TypeScript'] },
  { id: 's_next', name: 'Next.js', category: 'frontend', level: 'advanced', demandGrowthRate: 44, averageSalary: '$145,000', prerequisites: ['React', 'TypeScript'] },

  { id: 's_node', name: 'Node.js', category: 'backend', level: 'intermediate', demandGrowthRate: 20, averageSalary: '$136,000', prerequisites: ['JavaScript'] },
  { id: 's_fastapi', name: 'FastAPI', category: 'backend', level: 'intermediate', demandGrowthRate: 38, averageSalary: '$140,000', prerequisites: ['Python'] },
  { id: 's_go', name: 'Go (Golang)', category: 'backend', level: 'intermediate', demandGrowthRate: 35, averageSalary: '$155,000', prerequisites: [] },

  { id: 's_sql', name: 'SQL & Relational DBs', category: 'database', level: 'fundamental', demandGrowthRate: 15, averageSalary: '$128,000', prerequisites: [] },
  { id: 's_pg', name: 'PostgreSQL', category: 'database', level: 'intermediate', demandGrowthRate: 32, averageSalary: '$142,000', prerequisites: ['SQL & Relational DBs'] },
  { id: 's_pgvector', name: 'pgvector', category: 'database', level: 'advanced', demandGrowthRate: 72, averageSalary: '$158,000', prerequisites: ['PostgreSQL'] },
  { id: 's_redis', name: 'Redis', category: 'database', level: 'intermediate', demandGrowthRate: 26, averageSalary: '$145,000', prerequisites: [] },

  { id: 's_docker', name: 'Docker', category: 'devops', level: 'intermediate', demandGrowthRate: 30, averageSalary: '$140,000', prerequisites: [] },
  { id: 's_k8s', name: 'Kubernetes', category: 'devops', level: 'advanced', demandGrowthRate: 42, averageSalary: '$160,000', prerequisites: ['Docker'] },
  { id: 's_cicd', name: 'CI/CD Pipelines', category: 'devops', level: 'intermediate', demandGrowthRate: 27, averageSalary: '$138,000', prerequisites: ['Docker'] },
  { id: 's_aws', name: 'AWS Cloud', category: 'devops', level: 'intermediate', demandGrowthRate: 29, averageSalary: '$145,000', prerequisites: [] },
  { id: 's_kafka', name: 'Apache Kafka', category: 'backend', level: 'advanced', demandGrowthRate: 37, averageSalary: '$158,000', prerequisites: ['Docker', 'Java'] },
];

// Knowledge Graph Edges (DAG)
export const SEED_SKILL_EDGES: SkillKnowledgeEdge[] = [
  { source: 'Java', target: 'Spring Framework', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'Spring Framework', target: 'Spring Boot', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'Spring Boot', target: 'Spring Security', relationshipType: 'prerequisite_of', weight: 0.9 },
  { source: 'Spring Boot', target: 'Apache Kafka', relationshipType: 'synergizes_with', weight: 0.8 },

  { source: 'Python', target: 'NumPy', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'NumPy', target: 'Pandas', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'Pandas', target: 'Machine Learning', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'Machine Learning', target: 'Deep Learning', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'Deep Learning', target: 'LLM & Generative AI', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'Python', target: 'FastAPI', relationshipType: 'prerequisite_of', weight: 0.9 },

  { source: 'JavaScript', target: 'TypeScript', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'TypeScript', target: 'React', relationshipType: 'prerequisite_of', weight: 0.9 },
  { source: 'React', target: 'Next.js', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'JavaScript', target: 'Node.js', relationshipType: 'prerequisite_of', weight: 0.9 },

  { source: 'SQL & Relational DBs', target: 'PostgreSQL', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'PostgreSQL', target: 'pgvector', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'pgvector', target: 'LLM & Generative AI', relationshipType: 'synergizes_with', weight: 0.95 },

  { source: 'Docker', target: 'Kubernetes', relationshipType: 'prerequisite_of', weight: 1.0 },
  { source: 'Docker', target: 'CI/CD Pipelines', relationshipType: 'prerequisite_of', weight: 0.85 },
];

// Seed Jobs
export const SEED_JOBS: Job[] = [
  {
    id: 'job_stripe_fs',
    companyId: 'comp_stripe',
    companyName: 'Stripe',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    title: 'Full Stack Engineer - Developer Infrastructure',
    location: 'San Francisco, CA (or Remote)',
    workplaceType: 'hybrid',
    employmentType: 'Full-time',
    salaryRange: '$145,000 - $185,000 + Equity',
    experienceLevel: 'Entry-level',
    description: 'Join the team empowering millions of developers worldwide. You will build user-facing financial dashboards, resilient API endpoints in TypeScript/Node.js, and optimize database execution with PostgreSQL and Redis.',
    responsibilities: [
      'Design and deploy highly scalable microservices in TypeScript and Node.js',
      'Build performant, accessible web user interfaces using React and modern CSS systems',
      'Partner with product teams to build clean developer experiences and SDKs',
      'Optimize query execution paths in PostgreSQL and implement cache strategies with Redis',
    ],
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
    preferredSkills: ['Redis', 'FastAPI', 'GraphQL', 'AWS'],
    minEducation: 'Bachelor in Computer Science, AI, or equivalent technical experience',
    postedAt: '2026-03-24T10:00:00Z',
    applicantsCount: 42,
  },
  {
    id: 'job_datadog_ml',
    companyId: 'comp_datadog',
    companyName: 'Datadog',
    companyLogo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=80',
    title: 'AI & Vector Platform Engineer',
    location: 'New York, NY (Hybrid)',
    workplaceType: 'hybrid',
    employmentType: 'Full-time',
    salaryRange: '$150,000 - $190,000',
    experienceLevel: 'Entry-level',
    description: 'We are expanding our AI telemetry and log anomaly detection pipelines. You will develop vector search systems using pgvector, Python FastAPI, and transformer embeddings.',
    responsibilities: [
      'Develop vector similarity retrieval pipelines handling hundreds of thousands of queries per second',
      'Build robust APIs with Python and FastAPI integrating semantic embeddings',
      'Implement data storage and partitioning in PostgreSQL with pgvector',
      'Containerize workloads using Docker and deploy to Kubernetes clusters',
    ],
    requiredSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'pgvector'],
    preferredSkills: ['Kubernetes', 'Redis', 'Apache Kafka', 'PyTorch'],
    minEducation: 'Bachelor or Master in AI, Data Science, or Computer Science',
    postedAt: '2026-03-22T14:00:00Z',
    applicantsCount: 68,
  },
  {
    id: 'job_snowflake_be',
    companyId: 'comp_snowflake',
    companyName: 'Snowflake',
    companyLogo: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=100&auto=format&fit=crop&q=80',
    title: 'Backend Systems Engineer - Query Engine',
    location: 'Seattle, WA',
    workplaceType: 'on-site',
    employmentType: 'Full-time',
    salaryRange: '$155,000 - $195,000',
    experienceLevel: 'Entry-level',
    description: 'Architect foundational distributed query execution backends. Build high-concurrency data services with Java/Go and streaming pipelines.',
    responsibilities: [
      'Architect distributed query execution nodes handling petabyte-scale transformations',
      'Implement concurrency controls, thread pools, and cache hierarchies',
      'Instrument monitoring and profiling for sub-millisecond execution bottlenecks',
    ],
    requiredSkills: ['Java', 'SQL & Relational DBs', 'Docker', 'Apache Kafka'],
    preferredSkills: ['Spring Boot', 'Kubernetes', 'Go (Golang)', 'AWS Cloud'],
    minEducation: 'Bachelor in Computer Science or Software Engineering',
    postedAt: '2026-03-20T09:00:00Z',
    applicantsCount: 84,
  },
  {
    id: 'job_anthropic_fe',
    companyId: 'comp_anthropic',
    companyName: 'Anthropic',
    companyLogo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&auto=format&fit=crop&q=80',
    title: 'Frontend Product Engineer - AI Studio & Interfaces',
    location: 'San Francisco, CA (Hybrid)',
    workplaceType: 'hybrid',
    employmentType: 'Full-time',
    salaryRange: '$160,000 - $210,000 + Equity',
    experienceLevel: 'Mid-level',
    description: 'Craft beautiful, hyper-responsive interfaces for frontier AI research and developer tools. Work across React, Next.js, WebSockets, and state machines.',
    responsibilities: [
      'Build intuitive, latency-free interfaces for model evaluation and interactive prompt engineering',
      'Ensure impeccable typography, accessibility, and smooth 60fps animations',
      'Collaborate directly with AI researchers to prototype novel generative workflows',
    ],
    requiredSkills: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS'],
    preferredSkills: ['Node.js', 'WebSockets', 'GraphQL', 'Figma'],
    minEducation: 'Bachelor degree or demonstrated technical craft portfolio',
    postedAt: '2026-03-26T16:00:00Z',
    applicantsCount: 112,
  },
];

// Seed Courses
export const SEED_COURSES: CourseRecommendation[] = [
  {
    title: 'Distributed Systems & Microservices in Production',
    platform: 'Stanford Online',
    duration: '6 Weeks (Self-paced)',
    url: 'https://online.stanford.edu',
    rating: 4.9,
    level: 'Advanced',
  },
  {
    title: 'Kubernetes Hands-On: From Zero to Certified DevOps Hero',
    platform: 'Udemy',
    duration: '18 Hours',
    url: 'https://udemy.com',
    rating: 4.8,
    level: 'Intermediate',
  },
  {
    title: 'Apache Kafka Event Streaming Architecture & Spring Boot',
    platform: 'Coursera',
    duration: '4 Weeks',
    url: 'https://coursera.org',
    rating: 4.7,
    level: 'Intermediate',
  },
  {
    title: 'High-Performance PostgreSQL: Indexing, Partitioning & pgvector',
    platform: 'Official Docs',
    duration: '10 Hours',
    url: 'https://postgresql.org/docs',
    rating: 4.9,
    level: 'Advanced',
  },
];

// Seed Projects
export const SEED_PROJECTS: ProjectRecommendation[] = [
  {
    id: 'proj_kafka_queue',
    title: 'Fault-Tolerant Distributed Job Dispatcher with Kafka & Redis',
    targetSkills: ['Apache Kafka', 'Redis', 'Docker', 'Node.js'],
    difficulty: 'Advanced',
    description: 'Build an enterprise background task queue worker with dead-letter retries, distributed rate-limiting, and an interactive Grafana telemetry dashboard.',
    keyDeliverables: [
      'Kafka producer & consumer groups handling concurrent queue messages',
      'Redis distributed lock implementation avoiding race conditions',
      'Docker Compose automated environment with Prometheus metrics',
    ],
    estimatedHours: 24,
    portfolioImpact: 'Demonstrates distributed system reliability and production concurrency competence.',
  },
  {
    id: 'proj_k8s_cicd',
    title: 'End-to-End GitOps Deployment Pipeline with Kubernetes & ArgoCD',
    targetSkills: ['Kubernetes', 'CI/CD Pipelines', 'Docker'],
    difficulty: 'Intermediate',
    description: 'Deploy a multi-tier microservice app onto a local minikube or cloud Kubernetes cluster with automated zero-downtime rolling canary deployments.',
    keyDeliverables: [
      'Helm charts with ingress, secrets management, and persistent volume claims',
      'GitHub Actions workflow that builds, scans, and triggers deployment',
      'Horizontal Pod Autoscaler (HPA) configured to scale on CPU spikes',
    ],
    estimatedHours: 18,
    portfolioImpact: 'Proves readiness for DevOps, SRE, and modern backend engineering roles.',
  },
  {
    id: 'proj_rag_pipeline',
    title: 'Enterprise RAG Search Engine with Hybrid Dense-Sparse Vector Retrieval',
    targetSkills: ['pgvector', 'FastAPI', 'Python', 'LLM & Generative AI'],
    difficulty: 'Intermediate',
    description: 'Create an intelligent document Q&A copilot that extracts PDFs, chunks documents semantically, stores embeddings in PostgreSQL pgvector, and grounds answers.',
    keyDeliverables: [
      'PDF chunking with recursive text splitter and token windowing',
      'PostgreSQL pgvector cosine distance similarity search with IVFFlat index',
      'FastAPI endpoint with streaming SSE responses and source citation chips',
    ],
    estimatedHours: 16,
    portfolioImpact: 'Shows direct alignment with modern Generative AI and vector search job roles.',
  },
];

// Seed Market Trends (2024-2026 data points)
export const SEED_MARKET_TRENDS: MarketTrendItem[] = [
  {
    skill: 'pgvector & Vector Databases',
    category: 'database',
    demandIndex: 96,
    growthYoY: 74,
    openPositionsCount: 14200,
    trendDirection: 'up',
    topHiringRoles: ['AI Platform Engineer', 'Full Stack Developer', 'Data Engineer'],
  },
  {
    skill: 'TypeScript',
    category: 'frontend',
    demandIndex: 94,
    growthYoY: 38,
    openPositionsCount: 48900,
    trendDirection: 'up',
    topHiringRoles: ['Full Stack Developer', 'Frontend Engineer', 'Cloud Architect'],
  },
  {
    skill: 'Kubernetes & Container Orchestration',
    category: 'devops',
    demandIndex: 91,
    growthYoY: 42,
    openPositionsCount: 38400,
    trendDirection: 'up',
    topHiringRoles: ['DevOps Engineer', 'Cloud Architect', 'Backend Engineer'],
  },
  {
    skill: 'Python & FastAPI',
    category: 'backend',
    demandIndex: 93,
    growthYoY: 46,
    openPositionsCount: 42100,
    trendDirection: 'up',
    topHiringRoles: ['Backend Developer', 'ML Engineer', 'AI Solutions Architect'],
  },
  {
    skill: 'Apache Kafka',
    category: 'backend',
    demandIndex: 85,
    growthYoY: 29,
    openPositionsCount: 22600,
    trendDirection: 'up',
    topHiringRoles: ['Data Engineer', 'Backend Systems Engineer'],
  },
  {
    skill: 'Legacy PHP & jQuery',
    category: 'frontend',
    demandIndex: 32,
    growthYoY: -22,
    openPositionsCount: 7800,
    trendDirection: 'down',
    topHiringRoles: ['Legacy Web Maintainer'],
  },
];

// Seed Applications
export const SEED_APPLICATIONS: JobApplication[] = [
  {
    id: 'app_1',
    jobId: 'job_stripe_fs',
    studentId: 'student_alex',
    studentName: 'Alex Chen',
    studentEmail: 'hariesh.al23@bitsathy.ac.in',
    appliedDate: '2026-03-25T11:20:00Z',
    status: 'Shortlisted',
    matchScore: 92,
    studentReadinessScore: 86,
    recruiterNotes: 'Exceptional full-stack TypeScript project experience; scheduled for technical screen.',
  },
  {
    id: 'app_2',
    jobId: 'job_datadog_ml',
    studentId: 'student_alex',
    studentName: 'Alex Chen',
    studentEmail: 'hariesh.al23@bitsathy.ac.in',
    appliedDate: '2026-03-26T14:45:00Z',
    status: 'Interview',
    matchScore: 89,
    studentReadinessScore: 86,
    recruiterNotes: 'Strong hands-on experience with pgvector and FastAPI. NeuralSearch project stands out.',
  },
  {
    id: 'app_3',
    jobId: 'job_anthropic_fe',
    studentId: 'student_alex',
    studentName: 'Alex Chen',
    studentEmail: 'hariesh.al23@bitsathy.ac.in',
    appliedDate: '2026-03-27T09:15:00Z',
    status: 'Reviewing',
    matchScore: 84,
    studentReadinessScore: 86,
  },
];

// AI Model Evaluation Metrics (for Admin Dashboard)
export const SEED_MODEL_METRICS: AIModelEvaluationMetrics = {
  totalEmbeddingsComputed: 14280,
  averageLatencyMs: 342,
  semanticMatchAccuracyRate: 94.6,
  cosineDistribution: [
    { bucket: '0.90 - 1.00', count: 184 },
    { bucket: '0.80 - 0.89', count: 642 },
    { bucket: '0.70 - 0.79', count: 420 },
    { bucket: '0.60 - 0.69', count: 195 },
    { bucket: '< 0.60', count: 72 },
  ],
  userFeedbackApprovalRate: 92.4,
  feedbackSampleCount: 312,
};

/**
 * Computes deterministic cosine similarity and hybrid matching scores
 * when Gemini API key is either pending or as a local baseline.
 */
export function calculateLocalSemanticMatch(studentProfile: StudentProfile, job: Job): ExplainableMatchScore {
  const studentSkillNames = new Set(studentProfile.skills.map(s => s.name.toLowerCase()));
  const required = job.requiredSkills.map(s => s.toLowerCase());
  const preferred = job.preferredSkills.map(s => s.toLowerCase());

  let matchedRequired = 0;
  const matchedSkillsList: string[] = [];
  const criticalMissing: string[] = [];

  for (const req of job.requiredSkills) {
    if (studentSkillNames.has(req.toLowerCase())) {
      matchedRequired++;
      matchedSkillsList.push(req);
    } else {
      criticalMissing.push(req);
    }
  }

  let matchedPreferred = 0;
  const importantMissing: string[] = [];
  const optionalMissing: string[] = [];

  for (const pref of job.preferredSkills) {
    if (studentSkillNames.has(pref.toLowerCase())) {
      matchedPreferred++;
      matchedSkillsList.push(pref);
    } else {
      if (importantMissing.length < 2) {
        importantMissing.push(pref);
      } else {
        optionalMissing.push(pref);
      }
    }
  }

  const skillScore = Math.round(
    ((matchedRequired / (required.length || 1)) * 0.7 +
      (matchedPreferred / (preferred.length || 1)) * 0.3) *
      100
  );

  // Experience match
  const hasInternship = studentProfile.experience && studentProfile.experience.length > 0;
  const experienceScore = hasInternship ? 88 : 70;

  // Education match
  const educationScore = studentProfile.cgpa >= 8.0 ? 95 : 85;

  // Project relevance
  let projectRelevanceScore = 80;
  for (const proj of studentProfile.projects) {
    for (const tech of proj.technologies) {
      if (studentSkillNames.has(tech.toLowerCase()) && required.includes(tech.toLowerCase())) {
        projectRelevanceScore = Math.min(98, projectRelevanceScore + 5);
      }
    }
  }

  // Overall match
  const overall = Math.round(
    skillScore * 0.45 +
      projectRelevanceScore * 0.25 +
      experienceScore * 0.15 +
      educationScore * 0.15
  );

  const vectorSim = Number((0.65 + (overall / 100) * 0.33).toFixed(3));

  const whyRecommended: string[] = [
    `Strong direct alignment across core required skills: ${matchedSkillsList.slice(0, 3).join(', ')}.`,
    `Demonstrated hands-on project artifacts (${studentProfile.projects[0]?.title || 'Featured Project'}) validate production competencies.`,
    `High academic performance (CGPA ${studentProfile.cgpa}) exceeds candidate screening thresholds for ${job.companyName}.`,
  ];

  return {
    jobId: job.id,
    overallMatch: Math.min(98, Math.max(50, overall)),
    skillMatch: Math.min(99, Math.max(45, skillScore)),
    experienceMatch: experienceScore,
    educationMatch: educationScore,
    projectRelevance: projectRelevanceScore,
    vectorSimilarity: vectorSim,
    whyRecommended,
    matchedSkills: matchedSkillsList,
    missingSkills: {
      critical: criticalMissing,
      important: importantMissing,
      optional: optionalMissing,
    },
    projectedReadinessBoost: Math.max(2, criticalMissing.length * 3),
  };
}
