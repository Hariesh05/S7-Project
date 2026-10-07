import React, { useState } from 'react';
import { StudentProfile } from '../../types/index.ts';
import {
  FileText,
  UploadCloud,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Cpu,
  Layers,
  Briefcase,
  GraduationCap,
  Award,
  FileCheck,
  AlertCircle,
  Check,
} from 'lucide-react';

interface ResumeUploaderProps {
  profile: StudentProfile;
  onProfileUpdated: (updatedProfile: StudentProfile) => void;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  profile,
  onProfileUpdated,
}) => {
  const [resumeText, setResumeText] = useState(profile.resumeRawText || '');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    base64?: string;
    type: string;
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [parsedViaAi, setParsedViaAi] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const sampleResumes = {
    alex: {
      name: 'Alex Chen (B.Tech AI & Data Science - 2026)',
      fileName: 'Alex_Chen_Tech_Resume_2026.pdf',
      text: `Alex Chen
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
    },
    priya: {
      name: 'Priya Patel (B.S. CS & Machine Learning - 2026)',
      fileName: 'Priya_Patel_ML_Resume_2026.pdf',
      text: `Priya Patel
Email: priya.patel@stanford.edu | GitHub: github.com/priyapatel
Education: B.S. in Computer Science & AI, Stanford University, CGPA: 9.15/10 (2026)

Technical Skills:
- Machine Learning & AI: PyTorch, TensorFlow, Scikit-learn, HuggingFace, RAG, pgvector, LangChain
- Backend & Big Data: Python, FastAPI, Apache Spark, Kafka, PostgreSQL, DuckDB
- Cloud & Infrastructure: AWS, Docker, Kubernetes, Weights & Biases

Experience:
Research Assistant | Stanford AI Lab (Jan 2025 - Present)
- Fine-tuned transformer models for biomedical document extraction, achieving 92.4% F1-score on token classification.
- Deployed distributed vector embedding pipeline with pgvector and FastAPI processing 500k text passages.

Projects:
1. AgenticWorkflow: Multi-agent planning framework for automated code verification with LLMs.
2. TensorStream: Real-time fraud detection pipeline on financial transaction streams using Kafka and PyTorch.

Certifications:
- DeepLearning.AI Generative AI with LLMs
- TensorFlow Developer Certificate`,
    },
  };

  const processFile = (file: File) => {
    setIsError(false);
    setStatusMsg('');

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.name.toLowerCase().endsWith('.docx');
    const isTxt = file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt');

    if (!isPdf && !isDocx && !isTxt) {
      setIsError(true);
      setStatusMsg('Please select a valid PDF, DOCX, or TXT document.');
      return;
    }

    if (isPdf || isDocx) {
      // Correct binary handling: Read as Data URL (Base64)
      const reader = new FileReader();
      reader.onload = e => {
        const base64 = e.target?.result as string;
        setSelectedFile({
          name: file.name,
          size: file.size,
          base64,
          type: file.type || 'application/pdf',
        });
        setStatusMsg(`✓ File "${file.name}" loaded (${(file.size / 1024).toFixed(1)} KB). Ready for AI extraction.`);
      };
      reader.onerror = () => {
        setIsError(true);
        setStatusMsg('Error reading PDF file. Please try again.');
      };
      reader.readAsDataURL(file);
    } else {
      // Plain text file
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        setResumeText(text);
        setSelectedFile({
          name: file.name,
          size: file.size,
          type: 'text/plain',
        });
        setStatusMsg(`✓ Text file "${file.name}" loaded.`);
      };
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleParse = async () => {
    setIsParsing(true);
    setIsError(false);
    setStatusMsg('Parsing resume with PyMuPDF & Gemini 3.8 Flash NLP...');

    try {
      const payload: any = {};

      if (selectedFile?.base64) {
        payload.fileBase64 = selectedFile.base64;
        payload.mimeType = selectedFile.type;
        payload.fileName = selectedFile.name;
        if (resumeText) payload.resumeText = resumeText;
      } else if (resumeText.trim()) {
        payload.resumeText = resumeText;
        payload.fileName = selectedFile?.name || 'resume.txt';
      } else {
        throw new Error('Please upload a resume file or paste plain resume text.');
      }

      const res = await fetch('/api/student/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parsing failed');

      onProfileUpdated(data.profile);
      setParsedViaAi(data.parsedViaGemini);
      if (data.profile.resumeRawText) {
        setResumeText(data.profile.resumeRawText);
      }
      setStatusMsg(`Success! Extracted ${data.profile.skills?.length || 0} skills and updated your student profile.`);
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err: any) {
      setIsError(true);
      setStatusMsg(`Parsing Error: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const loadSample = (preset: typeof sampleResumes.alex) => {
    setSelectedFile({
      name: preset.fileName,
      size: 42000,
      type: 'application/pdf',
    });
    setResumeText(preset.text);
    setIsError(false);
    setStatusMsg(`Loaded ${preset.name}. Click "Run AI Extraction" to parse.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Student Resume Upload & AI Parser</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supports PDF, DOCX, and text formats. Powered by Gemini multimodal document understanding and entity extraction.
            </p>
          </div>

          {/* Quick Presets for Students */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Student Sample Presets:</span>
            <button
              onClick={() => loadSample(sampleResumes.alex)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Alex (Full Stack & AI)
            </button>
            <button
              onClick={() => loadSample(sampleResumes.priya)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Priya (ML & Data)
            </button>
          </div>
        </div>

        {/* Input area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
          {/* File Upload / Paste text */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Upload Resume File (PDF / DOCX)
            </label>

            {/* Dropzone with drag/drop handlers */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/70'
                  : 'border-slate-200 bg-slate-50/50 hover:border-indigo-400'
              }`}
            >
              <UploadCloud className="w-9 h-9 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Drag & Drop your Resume here or click to browse
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Accepts PDF (.pdf), Word (.docx), or Text (.txt) up to 25MB
              </p>

              {/* Selected File Status Pill */}
              {selectedFile ? (
                <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{selectedFile.name}</span>
                  <span className="text-emerald-600/70">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <label className="mt-3 inline-block px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                  Choose Resume File
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Resume text / manual edit */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-500 font-medium">Extracted Plain Text Content</span>
                <span className="text-[11px] text-slate-400">{resumeText.length} characters</span>
              </div>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                rows={7}
                placeholder="Resume text will appear here when a document is uploaded, or you can paste text directly..."
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleParse}
              disabled={isParsing || (!selectedFile && !resumeText.trim())}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Skills & Entities with Gemini NLP...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Resume Extraction & Recalculate Profile</span>
                </>
              )}
            </button>

            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  isError
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{statusMsg}</span>
              </div>
            )}
          </div>

          {/* Extracted Profile Highlights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Live Extracted Student Profile
              </label>
              <span className="text-xs font-medium text-emerald-600 flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Synchronized with PostgreSQL</span>
              </span>
            </div>

            {/* Extracted Overview Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Headline</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{profile.headline}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">University</span>
                  <p className="text-xs font-semibold text-slate-800">{profile.university}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Degree & CGPA</span>
                  <p className="text-xs font-semibold text-slate-800">
                    {profile.degree} (CGPA: {profile.cgpa})
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Roles</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {profile.targetRoles.map(role => (
                    <span key={role} className="text-xs px-2 py-0.5 rounded bg-white border border-slate-200 font-medium text-slate-700">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Resume File:</span>
                <span className="font-semibold text-indigo-700">{profile.resumeFileName}</span>
              </div>
            </div>

            {/* Extracted Skills Matrix */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Extracted Skills ({profile.skills.length})
                </span>
                <span className="text-[11px] text-slate-500">Categorized by Proficiency</span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {profile.skills.map(skill => (
                  <div
                    key={skill.id}
                    className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{skill.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{skill.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-indigo-600">{skill.proficiency}/5</div>
                      <div className="text-[9px] text-slate-400">{skill.yearsExperience} yrs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects and Work Experience Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Extracted Work Experience */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Extracted Work Experience & Internships</h3>
          </div>
          <div className="space-y-4">
            {profile.experience?.map((exp, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-slate-900">{exp.role}</h4>
                  <span className="text-[10px] text-slate-500">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                <div className="text-xs text-indigo-600 font-medium mb-1.5">{exp.company}</div>
                <p className="text-xs text-slate-600">{exp.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {exp.skillsUsed?.map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extracted Projects */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Extracted Technical Projects</h3>
          </div>
          <div className="space-y-4">
            {profile.projects?.map((proj, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-900">{proj.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{proj.description}</p>
                {proj.impactMetric && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    Impact: {proj.impactMetric}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {proj.technologies?.map(tech => (
                    <span key={tech} className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
