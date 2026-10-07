import React, { useState, useEffect } from 'react';
import { JobApplication } from '../../types/index.ts';
import { CancelApplicationModal } from './CancelApplicationModal.tsx';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  MapPin,
  Award,
  Trash2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const ApplicationsView: React.FC = () => {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingApp, setWithdrawingApp] = useState<JobApplication | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/student/applications');
      const data = await res.json();
      setApps(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawConfirm = async () => {
    if (!withdrawingApp) return;
    try {
      const res = await fetch(`/api/student/applications/${withdrawingApp.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setApps(prev => prev.filter(a => a.id !== withdrawingApp.id));
        showToast('Application successfully withdrawn and removed from recruiter queue.');
      }
    } catch (err) {
      console.error('Error withdrawing application:', err);
    } finally {
      setWithdrawingApp(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Shortlisted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Interview':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Reviewing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Offer':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-2xl flex items-center space-x-2.5 animate-in slide-in-from-bottom-5 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Job Application Tracking Pipeline</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status updates and notes directly from university recruiter partners.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-auto">
          {apps.length} Active Submissions
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading applications...</div>
      ) : apps.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">No active applications currently in flight.</p>
          <p className="text-slate-400">
            Browse the Recommended Jobs tab to discover matched opportunities and fast apply with 1 click.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map(app => (
            <div
              key={app.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-indigo-600">Application #{app.id}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] text-slate-500">
                    Submitted on {new Date(app.appliedDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  <div className="text-xs text-slate-700 font-medium">
                    Semantic Match Score: <strong className="text-indigo-600">{app.matchScore}%</strong>
                  </div>
                  <span className="text-slate-300">·</span>
                  <div className="text-xs text-slate-700 font-medium">
                    Readiness Index: <strong className="text-emerald-600">{app.studentReadinessScore}/100</strong>
                  </div>
                  <span className="text-slate-300">·</span>
                  <div className="text-[11px] text-slate-500">Job Reference: {app.jobId}</div>
                </div>

                {app.recruiterNotes && (
                  <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 mt-2">
                    <span className="font-bold">Recruiter Note:</span> {app.recruiterNotes}
                  </div>
                )}
              </div>

              {/* Status & Cancel Action Cluster */}
              <div className="flex items-center space-x-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusBadge(app.status)}`}>
                  {app.status}
                </span>

                {/* Cancel / Withdraw Application Button */}
                <button
                  onClick={() => setWithdrawingApp(app)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  title="Withdraw this application"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {withdrawingApp && (
        <CancelApplicationModal
          isOpen={Boolean(withdrawingApp)}
          onClose={() => setWithdrawingApp(null)}
          jobTitle={`Application #${withdrawingApp.id}`}
          companyName={`Job Ref: ${withdrawingApp.jobId}`}
          onConfirm={handleWithdrawConfirm}
        />
      )}
    </div>
  );
};
