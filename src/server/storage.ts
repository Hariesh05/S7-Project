import pg from 'pg';

export const database = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
  max: 8,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function initializeStorage() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  await database.query('CREATE SCHEMA IF NOT EXISTS career_app');
  await database.query(`
    CREATE TABLE IF NOT EXISTS career_app.users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL CHECK (role IN ('student', 'recruiter', 'admin')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS career_app.student_profiles (
      user_id TEXT PRIMARY KEY REFERENCES career_app.users(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS career_app.jobs (
      id TEXT PRIMARY KEY,
      owner_id TEXT REFERENCES career_app.users(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS jobs_owner_idx ON career_app.jobs(owner_id);
    CREATE TABLE IF NOT EXISTS career_app.applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES career_app.jobs(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES career_app.users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'Applied',
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(job_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS applications_job_idx ON career_app.applications(job_id);
    CREATE INDEX IF NOT EXISTS applications_user_idx ON career_app.applications(user_id);
    CREATE TABLE IF NOT EXISTS career_app.skills (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS career_app.market_trends (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS career_app.feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES career_app.users(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await database.query('ALTER TABLE career_app.jobs ALTER COLUMN owner_id DROP NOT NULL');
}

export async function saveUser(user: { id: string; email: string; name: string; avatarUrl: string; role: string; createdAt: string }) {
  await database.query(
    `INSERT INTO career_app.users (id, email, name, avatar_url, role, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name,
       avatar_url = EXCLUDED.avatar_url, role = EXCLUDED.role`,
    [user.id, user.email, user.name, user.avatarUrl, user.role, user.createdAt]
  );
}

export async function saveStudentProfile(userId: string, profile: unknown) {
  await database.query(
    `INSERT INTO career_app.student_profiles (user_id, data) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [userId, JSON.stringify(profile)]
  );
}

export async function saveJob(id: string, ownerId: string | null, job: unknown) {
  await database.query(
    `INSERT INTO career_app.jobs (id, owner_id, data) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
    [id, ownerId, JSON.stringify(job)]
  );
}

export async function seedDemoJobs() {
  const existing = await database.query(
    "SELECT 1 FROM career_app.jobs WHERE data->>'isDemo' = 'true' LIMIT 1"
  );
  if (existing.rowCount) return;

  const demoJobs = [
    {
      id: 'demo_job_fullstack_001',
      companyId: 'demo_company_northstar',
      companyName: 'Northstar Labs (Demo)',
      companyLogo: '',
      title: 'Junior Full-Stack Developer',
      location: 'Remote',
      workplaceType: 'remote',
      employmentType: 'Full-time',
      salaryRange: '$70,000 - $90,000 (sample)',
      experienceLevel: 'Entry-level',
      description: 'Illustrative sample role for practicing resume matching and applications. Build and maintain web features across a TypeScript frontend and Node.js services.',
      responsibilities: ['Build accessible React interfaces', 'Implement and test REST endpoints', 'Collaborate on code reviews'],
      requiredSkills: ['TypeScript', 'React', 'Node.js', 'REST APIs'],
      preferredSkills: ['PostgreSQL', 'Docker'],
      minEducation: 'Computer science or equivalent experience',
      postedAt: new Date().toISOString(),
      applicantsCount: 0,
      isDemo: true,
    },
    {
      id: 'demo_job_data_analyst_001',
      companyId: 'demo_company_pinecone',
      companyName: 'Pinecone Analytics (Demo)',
      companyLogo: '',
      title: 'Data Analyst Intern',
      location: 'Hybrid',
      workplaceType: 'hybrid',
      employmentType: 'Internship',
      salaryRange: '$25 - $35 per hour (sample)',
      experienceLevel: 'Entry-level',
      description: 'Illustrative sample internship for practicing job matching. Analyze product datasets and communicate findings with clear visualizations.',
      responsibilities: ['Clean and validate datasets', 'Write SQL queries', 'Present findings to product partners'],
      requiredSkills: ['Python', 'SQL', 'Data Visualization'],
      preferredSkills: ['PostgreSQL', 'Machine Learning'],
      minEducation: 'Currently pursuing a related degree',
      postedAt: new Date().toISOString(),
      applicantsCount: 0,
      isDemo: true,
    },
    {
      id: 'demo_job_devops_001',
      companyId: 'demo_company_cedar',
      companyName: 'Cedar Cloud (Demo)',
      companyLogo: '',
      title: 'Cloud Engineering Associate',
      location: 'On-site or Remote',
      workplaceType: 'hybrid',
      employmentType: 'Full-time',
      salaryRange: '$80,000 - $105,000 (sample)',
      experienceLevel: 'Associate',
      description: 'Illustrative sample cloud role. Help automate deployment workflows and improve service observability under senior engineering guidance.',
      responsibilities: ['Maintain CI/CD workflows', 'Support containerized services', 'Document operational runbooks'],
      requiredSkills: ['Linux', 'Docker', 'AWS', 'CI/CD'],
      preferredSkills: ['Kubernetes', 'Python'],
      minEducation: 'Related technical degree or equivalent experience',
      postedAt: new Date().toISOString(),
      applicantsCount: 0,
      isDemo: true,
    },
    {
      id: 'demo_job_mobile_001',
      companyId: 'demo_company_summit',
      companyName: 'Summit Mobile (Demo)',
      companyLogo: '',
      title: 'Mobile App Developer',
      location: 'Remote',
      workplaceType: 'remote',
      employmentType: 'Contract',
      salaryRange: '$50 - $70 per hour (sample)',
      experienceLevel: 'Mid-level',
      description: 'Illustrative sample mobile role for testing profile-based matching. Deliver reliable mobile features and collaborate with design and API teams.',
      responsibilities: ['Implement mobile screens', 'Integrate application APIs', 'Write automated tests'],
      requiredSkills: ['React Native', 'TypeScript', 'REST APIs'],
      preferredSkills: ['PostgreSQL', 'CI/CD'],
      minEducation: 'Not specified',
      postedAt: new Date().toISOString(),
      applicantsCount: 0,
      isDemo: true,
    },
  ];

  await database.query('BEGIN');
  try {
    for (const job of demoJobs) {
      await database.query(
        'INSERT INTO career_app.jobs (id, owner_id, data) VALUES ($1, NULL, $2) ON CONFLICT (id) DO NOTHING',
        [job.id, JSON.stringify(job)]
      );
    }
    await database.query('COMMIT');
  } catch (error) {
    await database.query('ROLLBACK');
    throw error;
  }
}

export async function saveApplication(id: string, jobId: string, userId: string, status: string, application: unknown) {
  await database.query(
    `INSERT INTO career_app.applications (id, job_id, user_id, status, data) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (job_id, user_id) DO UPDATE SET status = EXCLUDED.status, data = EXCLUDED.data`,
    [id, jobId, userId, status, JSON.stringify(application)]
  );
}

export async function deleteApplication(id: string, userId: string) {
  return database.query(
    'DELETE FROM career_app.applications WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
}

export async function saveSkill(id: string, skill: unknown) {
  await database.query(
    `INSERT INTO career_app.skills (id, data) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [id, JSON.stringify(skill)]
  );
}

export async function saveFeedback(id: string, userId: string, feedback: unknown) {
  await database.query(
    'INSERT INTO career_app.feedback (id, user_id, data) VALUES ($1, $2, $3)',
    [id, userId, JSON.stringify(feedback)]
  );
}