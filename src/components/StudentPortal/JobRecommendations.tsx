import React, { useState, useEffect } from 'react';
import { Job, JobRecommendation } from '../../types/index.ts';
import { ExplainableMatchModal } from './ExplainableMatchModal.tsx';
import { ApplyConfirmationModal } from './ApplyConfirmationModal.tsx';
import { CancelApplicationModal } from './CancelApplicationModal.tsx';
import {
  Sparkles,
  Search,
  Filter,
  MapPin,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  ArrowUpRight,
  CheckCircle,
  Trash2,
  Check,
} from 'lucide-react';

interface JobRecommendationsProps {
  onOpenATSWithJob?: (jobDescription: string) => void;
}

export const JobRecommendations: React.FC<JobRecommendationsProps> = ({ onOpenATSWithJob }) => {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobRec, setSelectedJobRec] = useState<JobRecommendation | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  // Confirmation Modal States
  const [confirmJob, setConfirmJob] = useState<{ job: Job; matchScore: number } | null>(null);
  const [withdrawJob, setWithdrawJob] = useState<{ job: Job } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
    fetchApplications();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/student/job-matches');
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/student/applications');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppliedJobIds(data.map((a: any) => a.jobId));
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const executeApply = async (jobId: string) => {
    try {
      const res = await fetch('/api/student/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedJobIds(prev => [...prev, jobId]);
        // Update local applicant count
        setRecommendations(prev =>
          prev.map(r =>
            r.job.id === jobId
              ? { ...r, job: { ...r.job, applicantsCount: r.job.applicantsCount + 1 } }
              : r
          )
        );
        showToast('Application successfully submitted! Recruiter will review your profile.');
      }
    } catch (err) {
      console.error('Apply error:', err);
    }
  };

  const executeWithdraw = async (jobId: string) => {
    try {
      const res = await fetch(`/api/student/applications/${jobId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAppliedJobIds(prev => prev.filter(id => id !== jobId));
        // Update local applicant count
        setRecommendations(prev =>
          prev.map(r =>
            r.job.id === jobId
              ? { ...r, job: { ...r.job, applicantsCount: Math.max(0, r.job.applicantsCount - 1) } }
              : r
          )
        );
        showToast('Application withdrawn successfully. You can re-apply anytime.');
      }
    } catch (err) {
      console.error('Withdraw error:', err);
    }
  };

  const handleFeedback = async (jobId: string, isHelpful: boolean) => {
    try {
      await fetch('/api/student/recommendation-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          rating: isHelpful ? 5 : 2,
          isHelpful,
          comments: isHelpful ? 'High alignment with candidate background' : 'Skill mismatch',
        }),
      });
      setFeedbackGiven(prev => ({ ...prev, [jobId]: true }));
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const filtered = recommendations.filter(r => {
    const q = searchTerm.toLowerCase();
    return (
      r.job.title.toLowerCase().includes(q) ||
      r.job.companyName.toLowerCase().includes(q) ||
      r.job.requiredSkills.some(s => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-2xl flex items-center space-x-2.5 animate-in slide-in-from-bottom-5 border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Semantic Resume-to-Job Matching Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Neural vector similarity + explainable multidimensional ranking against live postings.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by role, company, or tech stack..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Computing vector embeddings & ranking postings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No matching job recommendations found. Try broadening your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pt-6">
            {filtered.map(rec => {
              const { job, matchScore } = rec;
              const isApplied = appliedJobIds.includes(job.id);
              const hasGivenFeedback = feedbackGiven[job.id];

              return (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all bg-white hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left Info */}
                  <div className="flex items-start space-x-4">
                    <img
                      src={job.companyLogo}
                      alt={job.companyName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-indigo-600">{job.companyName}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500 capitalize">{job.workplaceType}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{job.experienceLevel}</span>
                      </div>

                      <h3
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                        onClick={() => setSelectedJobRec(rec)}
                      >
                        {job.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.location}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{job.salaryRange}</span>
                        </span>
                      </div>

                      {/* Overlapping skills badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Required:</span>
                        {job.requiredSkills.map(sk => {
                          const isMatched = matchScore.matchedSkills.includes(sk);
                          return (
                            <span
                              key={sk}
                              className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                                isMatched
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {sk}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Match Scores & Action Cluster */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between lg:justify-center shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 gap-4">
                    {/* Big Match Score */}
                    <div className="text-right">
                      <div className="flex items-baseline space-x-1.5 justify-end">
                        <span className="text-2xl font-black text-indigo-600 leading-none">
                          {matchScore.overallMatch}%
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">Match</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Cosine Sim: <span className="font-mono text-slate-700 font-bold">{matchScore.vectorSimilarity}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Thumbs up/down feedback loop */}
                      {!hasGivenFeedback ? (
                        <div className="flex items-center space-x-1 pr-2 border-r border-slate-200">
                          <button
                            title="Helpful recommendation"
                            onClick={() => handleFeedback(job.id, true)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Poor match"
                            onClick={() => handleFeedback(job.id, false)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium pr-2 border-r border-slate-200">
                          Feedback Logged
                        </span>
                      )}

                      <button
                        onClick={() => setSelectedJobRec(rec)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        Explain Score
                      </button>

                      {/* Apply & Cancel/Withdraw Button Controls */}
                      {isApplied ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Applied</span>
                          </span>
                          <button
                            onClick={() => setWithdrawJob({ job })}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-medium transition-colors"
                            title="Cancel / Withdraw application"
                          >
                            Withdraw
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmJob({ job, matchScore: matchScore.overallMatch })}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Job Explainable Modal */}
      {selectedJobRec && (
        <ExplainableMatchModal
          job={selectedJobRec.job}
          matchScore={selectedJobRec.matchScore}
          onClose={() => setSelectedJobRec(null)}
          onApply={jobId => {
            setSelectedJobRec(null);
            setConfirmJob({ job: selectedJobRec.job, matchScore: selectedJobRec.matchScore.overallMatch });
          }}
          onWithdraw={jobId => {
            setSelectedJobRec(null);
            setWithdrawJob({ job: selectedJobRec.job });
          }}
          isApplied={appliedJobIds.includes(selectedJobRec.job.id)}
        />
      )}

      {/* Application Confirmation Modal */}
      {confirmJob && (
        <ApplyConfirmationModal
          job={confirmJob.job}
          matchScore={confirmJob.matchScore}
          isOpen={Boolean(confirmJob)}
          onClose={() => setConfirmJob(null)}
          onConfirm={async jobId => {
            await executeApply(jobId);
          }}
        />
      )}

      {/* Cancel / Withdraw Application Modal */}
      {withdrawJob && (
        <CancelApplicationModal
          isOpen={Boolean(withdrawJob)}
          onClose={() => setWithdrawJob(null)}
          jobTitle={withdrawJob.job.title}
          companyName={withdrawJob.job.companyName}
          onConfirm={async () => {
            await executeWithdraw(withdrawJob.job.id);
          }}
        />
      )}
    </div>
  );
};
