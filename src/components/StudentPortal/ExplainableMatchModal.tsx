import React from 'react';
import { Job, ExplainableMatchScore } from '../../types/index.ts';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building,
  MapPin,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface ExplainableMatchModalProps {
  job: Job;
  matchScore: ExplainableMatchScore;
  onClose: () => void;
  onApply: (jobId: string) => void;
  onWithdraw?: (jobId: string) => void;
  isApplied: boolean;
}

export const ExplainableMatchModal: React.FC<ExplainableMatchModalProps> = ({
  job,
  matchScore,
  onClose,
  onApply,
  onWithdraw,
  isApplied,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-start space-x-3.5">
            <img
              src={job.companyLogo}
              alt={job.companyName}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-indigo-600">{job.companyName}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 capitalize">{job.workplaceType}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{job.salaryRange}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Explainable Match Score Hero Box */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/50 rounded-2xl border border-indigo-100 p-5">
            <div className="flex items-center justify-between pb-4 border-b border-indigo-100/60">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Explainable AI Match Breakdown</h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600 leading-none">
                  {matchScore.overallMatch}%
                </span>
                <span className="text-[10px] text-indigo-400 block font-semibold uppercase">Overall Match</span>
              </div>
            </div>

            {/* Sub-dimension Progress Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Skill Match</span>
                  <span className="text-indigo-600">{matchScore.skillMatch}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${matchScore.skillMatch}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Experience</span>
                  <span className="text-cyan-600">{matchScore.experienceMatch}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-600 rounded-full"
                    style={{ width: `${matchScore.experienceMatch}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Education</span>
                  <span className="text-emerald-600">{matchScore.educationMatch}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${matchScore.educationMatch}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Projects</span>
                  <span className="text-violet-600">{matchScore.projectRelevance}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full"
                    style={{ width: `${matchScore.projectRelevance}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Vector similarity: <strong className="font-mono text-slate-700">{typeof matchScore.vectorSimilarity === 'number' ? matchScore.vectorSimilarity.toFixed(2) : 'Not computed'}</strong></span>
            </div>
          </div>

          {/* WHY this job was recommended (prose) */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Why This Role Was Recommended For You
            </h4>
            <div className="space-y-2">
              {matchScore.whyRecommended.map((reason, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Matched vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched Skills */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-2">
                Matched Capabilities ({matchScore.matchedSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchScore.matchedSkills.map(s => (
                  <span
                    key={s}
                    className="px-2 py-0.5 bg-emerald-100/70 border border-emerald-200 text-emerald-800 rounded text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills by Category */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                Targeted Skill Gaps
              </span>

              {matchScore.missingSkills.critical.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase">Critical Blockers:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {matchScore.missingSkills.critical.map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[11px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchScore.missingSkills.important.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Important Gaps:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {matchScore.missingSkills.important.map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[11px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchScore.missingSkills.optional.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Optional / Preferred:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {matchScore.missingSkills.optional.map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Role Description & Key Responsibilities
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">{job.description}</p>
            <ul className="space-y-1.5">
              {job.responsibilities.map((resp, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {job.applicantsCount} active applicants
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            {isApplied ? (
              <div className="flex items-center space-x-2">
                <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  ✓ Application Submitted
                </span>
                {onWithdraw && (
                  <button
                    onClick={() => {
                      onWithdraw(job.id);
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors"
                  >
                    Withdraw Application
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => onApply(job.id)}
                className="px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
