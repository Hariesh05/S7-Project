import React, { useEffect, useState } from 'react';
import { Briefcase, RefreshCw } from 'lucide-react';
import { Job } from '../../types/index.ts';

export const AdminJobListings: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/jobs');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load job listings');
      setJobs(data);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load job listings');
    } finally {
      setLoading(false);
    }
  };

  const demoCount = jobs.filter(job => job.isDemo).length;

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Job Listings</h2>
            <p className="text-xs text-slate-500">{jobs.length} listings · {demoCount} illustrative demo listings</p>
          </div>
        </div>
        <button onClick={() => void loadJobs()} disabled={loading} title="Refresh listings" aria-label="Refresh listings" className="p-2 border border-slate-300 rounded-md text-slate-600 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {error && <p role="alert" className="px-5 py-3 text-xs text-rose-700">{error}</p>}
      {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading listings...</p> : jobs.length ? (
        <div className="divide-y divide-slate-100">
          {jobs.map(job => (
            <article key={job.id} className="px-5 py-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{job.title}</h3>
                  {job.isDemo && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800">DEMO DATA</span>}
                </div>
                <p className="text-xs text-slate-600 mt-1">{job.companyName} · {job.location} · {job.workplaceType} · {job.employmentType}</p>
                <p className="text-xs text-slate-500 mt-1">{job.salaryRange} · {job.experienceLevel}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {job.requiredSkills.map(skill => <span key={skill} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded">{skill}</span>)}
                </div>
              </div>
              <div className="text-xs text-slate-500 lg:text-right">{job.applicantsCount} application(s)</div>
            </article>
          ))}
        </div>
      ) : <p className="p-10 text-center text-sm text-slate-500">No listings found.</p>}
    </section>
  );
};