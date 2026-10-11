import React, { useState } from 'react';
import { Job } from '../../types/index.ts';
import {
  X,
  Send,
  Building,
  MapPin,
  DollarSign,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ApplyConfirmationModalProps {
  job: Job | null;
  matchScore: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (jobId: string) => Promise<void>;
  studentName: string;
  studentDegree: string;
  resumeFileName: string;
  readinessScore: number;
}

export const ApplyConfirmationModal: React.FC<ApplyConfirmationModalProps> = ({
  job,
  matchScore,
  isOpen,
  onClose,
  onConfirm,
  studentName,
  studentDegree,
  resumeFileName,
  readinessScore,
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !job) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(job.id);
      // Trigger celebratory confetti on successful application
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.65 },
        });
      } catch (e) {
        // ignore if not supported
      }
      onClose();
    } catch (err) {
      console.error('Error confirming application:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Confirm Application Submission</h3>
              <p className="text-xs text-slate-500">Review submission details before applying</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Target Job Summary Box */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700">{job.companyName}</span>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-indigo-600 text-white">
                {matchScore}% Match
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">{job.title}</h4>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.location}</span>
              </span>
              <span className="flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{job.salaryRange}</span>
              </span>
            </div>
          </div>

          {/* Profile & Resume Snapshot Being Submitted */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Candidate Profile Being Submitted:
            </span>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Applicant:</span>
                <span className="font-bold text-slate-900">{studentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Degree:</span>
                <span className="font-semibold text-slate-800">{studentDegree}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Attached Resume:</span>
                <span className="font-semibold text-indigo-600 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{resumeFileName}</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Placement Readiness Score:</span>
                <span className="font-bold text-emerald-600">{readinessScore}/100</span>
              </div>
            </div>
          </div>

          {/* Reassurance Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Your application will be directly forwarded to the verified university recruiting team. You can cancel or withdraw this application at any time from your pipeline tracker.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel / Go Back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-xs transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Submit Application</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
