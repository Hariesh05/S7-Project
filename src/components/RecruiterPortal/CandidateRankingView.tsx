import React, { useState, useEffect } from 'react';
import { Job } from '../../types/index.ts';
import {
  Users,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronRight,
  UserCheck,
  Mail,
  GraduationCap,
} from 'lucide-react';

interface CandidateRankingViewProps {
  selectedJob: Job;
}

export const CandidateRankingView: React.FC<CandidateRankingViewProps> = ({ selectedJob }) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [minMatch, setMinMatch] = useState(70);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  useEffect(() => {
    fetchCandidates();
  }, [selectedJob]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recruiter/jobs/${selectedJob.id}/candidates`);
      const data = await res.json();
      setCandidates(data.candidates || []);
      if (data.candidates && data.candidates.length > 0) {
        setSelectedCandidate(data.candidates[0]);
      }
    } catch (err) {
      console.error('Candidate fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (candidateId: string, newStatus: string) => {
    const candidate = candidates.find(item => item.id === candidateId);
    if (!candidate?.applicationId) return;
    try {
      const response = await fetch(`/api/recruiter/applications/${candidate.applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update applicant status');
      setCandidates(prev => prev.map(item => item.id === candidateId ? { ...item, status: newStatus } : item));
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Application status update failed:', error);
    }
  };

  const filtered = candidates.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.degree.toLowerCase().includes(q) ||
      c.skills.some((s: any) => s.name?.toLowerCase().includes(q));
    const matchesScore = c.matchScore >= minMatch;
    return matchesSearch && matchesScore;
  });

  return (
    <div className="space-y-6">
      {/* Banner & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">
                Applicant Profiles & Skills Match
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Job: <strong className="text-slate-800">{selectedJob.title}</strong> at {selectedJob.companyName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidates or skills..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <span>Min Match:</span>
              <select
                value={minMatch}
                onChange={e => setMinMatch(parseInt(e.target.value))}
                className="bg-transparent font-bold text-slate-900 focus:outline-none"
              >
                <option value={60}>60%</option>
                <option value={70}>70%</option>
                <option value={80}>80%</option>
                <option value={85}>85%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Candidate List & Detailed Drawer */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading applicant profiles and comparing documented skills...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {candidates.length ? 'No applicants match this screening threshold.' : 'No applications have been submitted for this job yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
            {/* Candidate List (Left 7 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              {filtered.map((cand, idx) => {
                const isSelected = selectedCandidate?.id === cand.id;
                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <span className="text-xs font-black text-slate-400 w-4 text-center">
                        #{idx + 1}
                      </span>
                      <img
                        src={cand.avatarUrl}
                        alt={cand.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900">{cand.name}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                              cand.status === 'Shortlisted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cand.status === 'Interview'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {cand.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{cand.degree}</div>
                        <div className="text-[10px] text-slate-400">
                          {cand.university} · CGPA: <strong className="text-slate-700">{cand.cgpa}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-indigo-600 leading-none">
                        {cand.matchScore}%
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Match Score
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Candidate Detailed Drawer (Right 5 Cols) */}
            {selectedCandidate && (
              <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-5 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedCandidate.avatarUrl}
                      alt={selectedCandidate.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{selectedCandidate.name}</h3>
                      <p className="text-xs text-slate-500">{selectedCandidate.email}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-indigo-600 block">
                      {selectedCandidate.matchScore}%
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Profile Match</span>
                  </div>
                </div>

                {selectedCandidate.profile?.headline && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Headline</span>
                    <p className="text-xs text-slate-700 mt-1">{selectedCandidate.profile.headline}</p>
                  </div>
                )}
                {selectedCandidate.profile?.bio && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">About</span>
                    <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">{selectedCandidate.profile.bio}</p>
                  </div>
                )}
                {selectedCandidate.profile?.targetRoles?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Target roles</span>
                    <p className="text-xs text-slate-700 mt-1">{selectedCandidate.profile.targetRoles.join(', ')}</p>
                  </div>
                )}
                {selectedCandidate.profile?.education?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Education</span>
                    <div className="space-y-2 mt-1">
                      {selectedCandidate.profile.education.map((education: any, index: number) => (
                        <div key={`education_${index}`} className="text-xs text-slate-700">
                          <p className="font-semibold">{education.degree || 'Degree not specified'}{education.fieldOfStudy ? ` · ${education.fieldOfStudy}` : ''}</p>
                          <p>{education.institution}{education.endYear ? ` · ${education.endYear}` : ''}{education.grade ? ` · ${education.grade}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCandidate.profile?.experience?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Experience</span>
                    <div className="space-y-3 mt-1">
                      {selectedCandidate.profile.experience.map((experience: any, index: number) => (
                        <div key={`experience_${index}`} className="text-xs text-slate-700 border-l-2 border-indigo-200 pl-3">
                          <p className="font-semibold">{experience.role}{experience.company ? ` · ${experience.company}` : ''}</p>
                          <p className="text-slate-500">{experience.startDate}{experience.endDate ? ` - ${experience.endDate}` : experience.isCurrent ? ' - Present' : ''}</p>
                          {experience.description && <p className="mt-1 whitespace-pre-wrap">{experience.description}</p>}
                          {experience.skillsUsed?.length > 0 && <p className="mt-1 text-slate-500">Skills: {experience.skillsUsed.join(', ')}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCandidate.profile?.projects?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Projects</span>
                    <div className="space-y-3 mt-1">
                      {selectedCandidate.profile.projects.map((project: any, index: number) => (
                        <div key={`project_${index}`} className="text-xs text-slate-700">
                          <p className="font-semibold">{project.title}</p>
                          {project.description && <p className="mt-1 whitespace-pre-wrap">{project.description}</p>}
                          {project.technologies?.length > 0 && <p className="mt-1 text-slate-500">Technologies: {project.technologies.join(', ')}</p>}
                          {project.repoUrl && <a className="mt-1 inline-block text-indigo-600 underline" href={project.repoUrl} target="_blank" rel="noreferrer">Repository</a>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCandidate.profile?.certifications?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Certifications</span>
                    <ul className="list-disc pl-5 mt-1 text-xs text-slate-700">
                      {selectedCandidate.profile.certifications.map((certification: any, index: number) => (
                        <li key={`certification_${index}`}>{certification.name}{certification.issuer ? ` · ${certification.issuer}` : ''}{certification.issueDate ? ` · ${certification.issueDate}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedCandidate.profile?.resumeRawText && (
                  <details className="border-t border-slate-200 pt-3">
                    <summary className="cursor-pointer text-xs font-semibold text-indigo-700">View applicant-shared resume text</summary>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 text-[11px] text-slate-700">{selectedCandidate.profile.resumeRawText}</pre>
                  </details>
                )}

                {/* Readiness & ATS Indices */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Readiness Index</span>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedCandidate.readinessScore}/100
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Resume ATS Score</span>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedCandidate.atsScore}/100
                    </div>
                  </div>
                </div>

                {/* Matched Skills */}
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1.5">
                    Matched Required Skills ({selectedCandidate.matchedSkills?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCandidate.matchedSkills?.map((sk: string) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px] font-medium"
                      >
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Candidate Skill Gaps */}
                {selectedCandidate.missingCriticalSkills?.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-1.5">
                      Critical Gaps Against Job Posting
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedCandidate.missingCriticalSkills.map((sk: string) => (
                        <span
                          key={sk}
                          className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[11px] font-medium"
                        >
                          Missing: {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recruiter Action Buttons */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Candidate Workflow Action:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedCandidate.id, 'Shortlisted')}
                      className="py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedCandidate.id, 'Interview')}
                      className="py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    >
                      Schedule Screen
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedCandidate.id, 'Rejected')}
                      className="py-2 px-3 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
