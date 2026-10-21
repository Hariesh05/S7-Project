import React from 'react';
import { X, ExternalLink, Download, FileText, Image as ImageIcon, Award, Calendar, CheckCircle2 } from 'lucide-react';
import { Certification } from '../../types/index.ts';

interface CertificateInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certification | null;
  candidateName?: string;
}

export const CertificateInspectModal: React.FC<CertificateInspectModalProps> = ({
  isOpen,
  onClose,
  certificate,
  candidateName,
}) => {
  if (!isOpen || !certificate) return null;

  const isImage = certificate.fileType?.startsWith('image/') ||
    certificate.fileUrl?.startsWith('data:image/') ||
    /\.(png|jpe?g|webp|gif)$/i.test(certificate.fileName || '');

  const isPdf = certificate.fileType === 'application/pdf' ||
    certificate.fileUrl?.startsWith('data:application/pdf') ||
    /\.pdf$/i.test(certificate.fileName || '');

  const driveUrl = certificate.driveLink || certificate.credentialUrl;

  const handleDownload = () => {
    if (!certificate.fileUrl) return;
    const a = document.createElement('a');
    a.href = certificate.fileUrl;
    a.download = certificate.fileName || `${certificate.name.replace(/\s+/g, '_')}_Certificate`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{certificate.name}</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified Credential
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Issued by <strong className="text-slate-800">{certificate.issuer}</strong>
                {certificate.issueDate ? ` · ${certificate.issueDate}` : ''}
                {candidateName ? ` · Candidate: ${candidateName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {certificate.fileUrl && (
              <button
                onClick={handleDownload}
                title="Download Document"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-100/50">
          {/* Document Viewer */}
          {certificate.fileUrl ? (
            <div className="bg-white rounded-xl border border-slate-200 p-2 overflow-hidden shadow-xs">
              {isImage && (
                <div className="max-h-[62vh] overflow-auto flex items-center justify-center bg-slate-950/5 rounded-lg p-2">
                  <img
                    src={certificate.fileUrl}
                    alt={certificate.name}
                    className="max-h-[58vh] max-w-full rounded object-contain shadow-sm"
                  />
                </div>
              )}

              {isPdf && (
                <div className="w-full h-[60vh] rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <iframe
                    src={certificate.fileUrl}
                    title={certificate.name}
                    className="w-full h-full"
                  />
                </div>
              )}

              {!isImage && !isPdf && (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-12 h-12 text-indigo-600 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{certificate.fileName || 'Certificate Document'}</h4>
                    <p className="text-xs text-slate-500 mt-1">Uploaded document file attached to profile.</p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Document
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <Award className="w-12 h-12 text-amber-500 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Online Credential Verification</h4>
                <p className="text-xs text-slate-500 mt-1">
                  This candidate linked an external credential / Google Drive document for inspection.
                </p>
              </div>
              {driveUrl && (
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-100 transition-colors"
                >
                  <span>Open Verification Link / Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Metadata Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Issuer</span>
                <span className="font-semibold text-slate-800">{certificate.issuer}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Issue Date</span>
                <span className="font-semibold text-slate-800">{certificate.issueDate || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Expiry Date</span>
                <span className="font-semibold text-slate-800">{certificate.expiryDate || 'No expiration'}</span>
              </div>
            </div>

            {driveUrl && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Drive / Verification Link:</span>
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 max-w-[280px] sm:max-w-md truncate"
                >
                  <span className="truncate">{driveUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}

            {certificate.skillsCovered && certificate.skillsCovered.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Validated Competencies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {certificate.skillsCovered.map(skill => (
                    <span
                      key={skill}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {certificate.description && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description</span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{certificate.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-white text-xs text-slate-500">
          <span>Inspection verified for candidate placement dossier.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
