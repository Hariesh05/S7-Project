import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, FileSearch, RefreshCw } from 'lucide-react';

type EvidenceStatus = 'demonstrated' | 'listed' | 'gap';
type EvidenceItem = {
  name: string;
  status: EvidenceStatus;
  proficiency: number | null;
  verifiedBy: string | null;
  requiredByCount: number;
  preferredByCount: number;
  jobTitles: string[];
  experienceEvidence: string[];
  projectEvidence: string[];
  mentionedInResumeSkills: boolean;
};

interface EvidenceMapResponse {
  resumeFileName: string | null;
  resumeLastUpdated: string | null;
  activeJobCount: number;
  summary: { demonstrated: number; listed: number; gaps: number };
  skills: EvidenceItem[];
}

interface ResumeEvidenceMapProps {
  onOpenResume: () => void;
}

const statusLabels: Record<EvidenceStatus, string> = {
  demonstrated: 'Evidence found',
  listed: 'Listed only',
  gap: 'Not on profile',
};

export const ResumeEvidenceMap: React.FC<ResumeEvidenceMapProps> = ({ onOpenResume }) => {
  const [data, setData] = useState<EvidenceMapResponse | null>(null);
  const [filter, setFilter] = useState<'all' | EvidenceStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadEvidence();
  }, []);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/student/evidence-map');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not build evidence map');
      setData(result);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not build evidence map');
    } finally {
      setLoading(false);
    }
  };

  const visibleSkills = (data?.skills || []).filter(item => filter === 'all' || item.status === filter);

  return (
    <div className="space-y-5">
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <FileSearch className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Resume Evidence Map</h2>
              <p className="text-xs text-slate-500 mt-1">See which job skills your experience and projects actually demonstrate.</p>
            </div>
          </div>
          <button onClick={() => void loadEvidence()} disabled={loading} title="Refresh evidence map" aria-label="Refresh evidence map" className="p-2 rounded-md border border-slate-300 text-slate-600 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {data?.resumeFileName && <p className="text-xs text-slate-500 mt-3">Source resume: {data.resumeFileName}{data.resumeLastUpdated ? ` · Updated ${new Date(data.resumeLastUpdated).toLocaleDateString()}` : ''}</p>}
        {error && <p role="alert" className="text-sm text-rose-700 mt-4">{error}</p>}

        {loading ? <p className="py-10 text-center text-sm text-slate-500">Comparing profile evidence with active job requirements...</p> : !data?.resumeFileName ? (
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-slate-800">Upload a resume to build your evidence map.</p>
            <p className="text-xs text-slate-500 mt-1">Your profile skills can still be compared with active job requirements.</p>
            <button onClick={onOpenResume} className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Open resume upload <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3"><p className="text-[10px] font-bold uppercase text-emerald-700">Demonstrated</p><p className="text-xl font-bold text-emerald-800 mt-1">{data.summary.demonstrated}</p></div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3"><p className="text-[10px] font-bold uppercase text-amber-700">Listed only</p><p className="text-xl font-bold text-amber-800 mt-1">{data.summary.listed}</p></div>
              <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3"><p className="text-[10px] font-bold uppercase text-rose-700">Required skill gaps</p><p className="text-xl font-bold text-rose-800 mt-1">{data.summary.gaps}</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-4" role="group" aria-label="Filter evidence status">
              {(['all', 'demonstrated', 'listed', 'gap'] as const).map(status => (
                <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 text-xs border rounded-md capitalize ${filter === status ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-600'}`}>
                  {status === 'all' ? 'All skills' : statusLabels[status]}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {!loading && data?.resumeFileName && (
        visibleSkills.length ? <div className="space-y-3">
          {visibleSkills.map(item => (
            <article key={item.name} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  {item.status === 'demonstrated' && <BadgeCheck className="w-4 h-4 text-emerald-600" />}
                  <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${item.status === 'demonstrated' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : item.status === 'listed' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>{statusLabels[item.status]}</span>
                </div>
                <p className="text-xs text-slate-500">Required by {item.requiredByCount} job(s){item.preferredByCount ? ` · preferred in ${item.preferredByCount}` : ''}{item.proficiency ? ` · Profile level ${item.proficiency}/5` : ''}</p>
              </div>
              {item.jobTitles.length > 0 && <p className="text-xs text-slate-500 mt-2">Jobs: {item.jobTitles.join(', ')}</p>}
              {[...item.experienceEvidence, ...item.projectEvidence].length > 0 ? (
                <div className="space-y-1.5 mt-3">
                  {[...item.experienceEvidence, ...item.projectEvidence].map((line, index) => <blockquote key={`${item.name}_${index}`} className="border-l-2 border-emerald-300 pl-3 text-xs text-slate-700">“{line}”</blockquote>)}
                </div>
              ) : item.status === 'listed' ? <p className="text-xs text-amber-800 mt-3">This skill appears in your profile or skills section, but no matching experience/project line was found.</p> : <p className="text-xs text-slate-500 mt-3">Add the skill to your profile or include evidence in an experience/project description.</p>}
            </article>
          ))}
        </div> : <p className="py-8 text-center text-sm text-slate-500">No skills match this filter.</p>
      )}
    </div>
  );
};