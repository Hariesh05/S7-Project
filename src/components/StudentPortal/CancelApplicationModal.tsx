import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface CancelApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  jobTitle: string;
  companyName: string;
}

export const CancelApplicationModal: React.FC<CancelApplicationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  jobTitle,
  companyName,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Error withdrawing application:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Withdraw Application</h3>
              <p className="text-xs text-slate-500">Cancel submitted job application</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Role</span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">{jobTitle}</span>
            <span className="text-indigo-600 font-semibold">{companyName}</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to withdraw your application? This will remove your resume and profile from the recruiter's active review queue. You can re-apply at any time before the application deadline.
          </p>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Keep Application
          </button>
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Withdraw Application</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
