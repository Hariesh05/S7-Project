import React, { useState } from 'react';
import {
  Award,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Save,
  Link as LinkIcon,
  Sparkles,
  Calendar,
  Building,
} from 'lucide-react';
import { Certification, StudentProfile } from '../../types/index.ts';
import { CertificateInspectModal } from './CertificateInspectModal.tsx';

interface CertificationsManagerProps {
  profile: StudentProfile;
  onProfileUpdated: (updatedProfile: StudentProfile) => void;
  onNavigateToJobs?: () => void;
}

const emptyCert = (index: number): Certification => ({
  id: `top_cert_${Date.now()}_${index}`,
  name: '',
  issuer: '',
  issueDate: '',
  expiryDate: '',
  credentialUrl: '',
  driveLink: '',
  fileUrl: '',
  fileName: '',
  fileType: '',
  fileSize: 0,
  skillsCovered: [],
  description: '',
});

export const CertificationsManager: React.FC<CertificationsManagerProps> = ({
  profile,
  onProfileUpdated,
  onNavigateToJobs,
}) => {
  const [certs, setCerts] = useState<Certification[]>(() => {
    const existing = profile.topCertifications && profile.topCertifications.length > 0
      ? profile.topCertifications
      : (profile.certifications || []).slice(0, 3).map((c, idx) => ({
          id: `top_cert_${idx + 1}`,
          ...c,
          driveLink: c.credentialUrl || '',
          skillsCovered: c.skillsCovered || [],
        }));
    return existing.slice(0, 3);
  });

  const [inspectCert, setInspectCert] = useState<Certification | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});

  const updateCert = (index: number, patch: Partial<Certification>) => {
    setCerts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
    setSaveSuccess(false);
  };

  const addSlot = () => {
    if (certs.length >= 3) return;
    setCerts(prev => [...prev, emptyCert(prev.length)]);
    setSaveSuccess(false);
  };

  const removeSlot = (index: number) => {
    setCerts(prev => prev.filter((_, idx) => idx !== index));
    setSaveSuccess(false);
  };

  const handleFileUpload = (index: number, file: File) => {
    setUploadErrors(prev => ({ ...prev, [index]: '' }));

    if (file.size > 15 * 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, [index]: 'File must be 15 MB or smaller.' }));
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setUploadErrors(prev => ({ ...prev, [index]: 'Please upload an image (PNG, JPG, WebP) or PDF file.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      updateCert(index, {
        fileUrl: base64Url,
        fileName: file.name,
        fileType: file.type || (isPdf ? 'application/pdf' : 'image/png'),
        fileSize: file.size,
      });
    };
    reader.onerror = () => {
      setUploadErrors(prev => ({ ...prev, [index]: 'Failed to read file. Please try again.' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const validCerts = certs.filter(c => c.name.trim().length > 0);
      const res = await fetch('/api/student/certifications/top', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topCertifications: validCerts }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save certifications');

      onProfileUpdated(data.profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not save certifications');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">Top 3 Verified Certifications</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {certs.length}/3 Slots
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Upload your top industry certifications as images, PDFs, or Google Drive links. Recruiters reviewing your job applications can directly inspect these verified credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {certs.length < 3 && (
              <button
                type="button"
                onClick={addSlot}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                Add Certification
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Certifications'}
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Your top certifications have been saved to your profile and are now inspectable by recruiters!</span>
            </div>
            {onNavigateToJobs && (
              <button
                onClick={onNavigateToJobs}
                className="text-xs font-bold text-emerald-800 underline hover:text-emerald-900"
              >
                Apply to Jobs →
              </button>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 3 Certification Slots */}
        <div className="grid grid-cols-1 gap-6 pt-6">
          {certs.map((cert, index) => {
            const hasDocument = Boolean(cert.fileUrl);
            const hasDriveLink = Boolean(cert.driveLink || cert.credentialUrl);
            const isPdf = cert.fileType === 'application/pdf' || /\.pdf$/i.test(cert.fileName || '');
            const isImage = cert.fileType?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(cert.fileName || '');

            return (
              <div
                key={cert.id || index}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {cert.name || `Certification Slot #${index + 1}`}
                    </h3>
                    {(hasDocument || hasDriveLink) && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Document Ready
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {(hasDocument || hasDriveLink) && (
                      <button
                        type="button"
                        onClick={() => setInspectCert(cert)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:text-indigo-700 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Preview</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      title="Remove Slot"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="lg:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">
                      Certification Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AWS Certified Solutions Architect - Associate"
                      value={cert.name}
                      onChange={e => updateCert(index, { name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Issuing Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Amazon Web Services, Coursera"
                      value={cert.issuer}
                      onChange={e => updateCert(index, { issuer: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Issue Date</label>
                    <input
                      type="text"
                      placeholder="e.g. Oct 2025 or 2025-10"
                      value={cert.issueDate}
                      onChange={e => updateCert(index, { issueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Drive Link & Verification URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                        Google Drive or Credential Verification URL
                      </span>
                      {hasDriveLink && (
                        <a
                          href={cert.driveLink || cert.credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 text-[11px] font-semibold"
                        >
                          Open link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/... or https://www.credly.com/badges/..."
                      value={cert.driveLink || cert.credentialUrl || ''}
                      onChange={e => {
                        const val = e.target.value;
                        updateCert(index, { driveLink: val, credentialUrl: val });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Validated Skills / Competencies (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cloud Architecture, Docker, Kubernetes"
                      value={cert.skillsCovered?.join(', ') || ''}
                      onChange={e =>
                        updateCert(index, {
                          skillsCovered: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* File Upload Box (Image or PDF) */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Attach Certificate Image (PNG/JPG) or PDF Document
                  </span>

                  {hasDocument ? (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                          {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                            {cert.fileName || 'Attached Certificate'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {cert.fileSize ? `${Math.round(cert.fileSize / 1024)} KB` : 'Uploaded'} · {isPdf ? 'PDF Document' : 'Image'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setInspectCert(cert)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCert(index, { fileUrl: '', fileName: '', fileSize: 0, fileType: '' })}
                          className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white rounded-xl p-4 text-center transition-colors">
                      <input
                        type="file"
                        id={`file_upload_${index}`}
                        accept="application/pdf,image/png,image/jpeg,image/webp"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(index, file);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor={`file_upload_${index}`}
                        className="cursor-pointer flex flex-col items-center justify-center space-y-1"
                      >
                        <UploadCloud className="w-6 h-6 text-indigo-600" />
                        <span className="text-xs font-semibold text-slate-800">
                          Click to select or drag certificate image (PNG, JPG, WebP) or PDF
                        </span>
                        <span className="text-[10px] text-slate-400">Max file size: 15 MB</span>
                      </label>
                    </div>
                  )}

                  {uploadErrors[index] && (
                    <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {uploadErrors[index]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {certs.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-white">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">No Top Certifications Configured</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add up to 3 of your best industry certifications to stand out to recruiters when you apply.
                </p>
              </div>
              <button
                type="button"
                onClick={addSlot}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Certification
              </button>
            </div>
          )}
        </div>

        {/* Footer save reminder */}
        {certs.length > 0 && (
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Certifications are verified and made inspectable upon job application submission.
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Top Certifications'}
            </button>
          </div>
        )}
      </div>

      {/* Recruiter Inspection Inspector Modal */}
      <CertificateInspectModal
        isOpen={Boolean(inspectCert)}
        onClose={() => setInspectCert(null)}
        certificate={inspectCert}
        candidateName={profile.headline.split('·')[0].trim()}
      />
    </div>
  );
};
