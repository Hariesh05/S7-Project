import React, { useEffect, useRef, useState } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const autoAnalyzeRef = useRef(false);

  const processFile = (file: File) => {
    setIsError(false);
    setStatusMsg('');

    if (file.size > 18 * 1024 * 1024) {
      setIsError(true);
      setStatusMsg('Resume files must be 18 MB or smaller.');
      return;
    }

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
        autoAnalyzeRef.current = true;
        setResumeText('');
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
        autoAnalyzeRef.current = true;
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
    e.target.value = '';
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
    setStatusMsg('Extracting document text and updating your saved profile...');

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
      if (data.profile.resumeRawText) {
        setResumeText(data.profile.resumeRawText);
      }
      setIsError(!data.profile.skills?.length);
      setStatusMsg(`${data.parsingMessage || 'Resume processed.'} Found ${data.profile.skills?.length || 0} skills.`);
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err: any) {
      setIsError(true);
      setStatusMsg(`Parsing Error: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  useEffect(() => {
    if (!autoAnalyzeRef.current || !selectedFile) return;
    autoAnalyzeRef.current = false;
    void handleParse();
  }, [selectedFile]);

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
                Accepts PDF (.pdf), Word (.docx), or Text (.txt) up to 18 MB
              </p>

              {/* Selected File Status Pill */}
              {selectedFile && (
                <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{selectedFile.name}</span>
                  <span className="text-emerald-600/70">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              )}
              <label className="mt-3 inline-block px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                {selectedFile ? 'Replace Resume File' : 'Choose Resume File'}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
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
                  <span>Re-run AI Extraction & Recalculate Profile</span>
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

              {(profile.github?.username || profile.leetcode?.username) && (
                <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-2 text-xs">
                  {profile.github?.username && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium">
                      GitHub: @{profile.github.username} {profile.github.publicRepos ? `(${profile.github.publicRepos} repos)` : ''}
                    </span>
                  )}
                  {profile.leetcode?.username && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                      LeetCode: @{profile.leetcode.username} {profile.leetcode.totalSolved ? `(${profile.leetcode.totalSolved} solved)` : ''}
                    </span>
                  )}
                </div>
              )}
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
