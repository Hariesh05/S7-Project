import React, { useState, useEffect } from 'react';
import { Job, User } from '../../types/index.ts';
import { JobManagerModal } from './JobManagerModal.tsx';
import { CandidateRankingView } from './CandidateRankingView.tsx';
import {
  Briefcase,
  Plus,
  Users,
  Building,
  MapPin,
  Trash2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface RecruiterDashboardProps {
  currentUser: User;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ currentUser }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/recruiter/jobs');
      const data = await res.json();
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
    setSelectedJob(newJob);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Recruiter Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{currentUser.name}</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                Verified Recruiter
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Senior Technical Talent Acquisition · CloudScale Technologies
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
              <span>San Francisco HQ</span>
              <span>·</span>
              <span>{jobs.length} Active Job Listings</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-2 shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Job (with AI JD Assistant)</span>
        </button>
      </div>

      {/* Active Job Postings Horizontal Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Job Requisitions ({jobs.length})
          </h3>
          <span className="text-xs text-slate-500">Select a job to view AI candidate ranking</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {jobs.map(j => {
            const isSelected = selectedJob?.id === j.id;
            return (
              <div
                key={j.id}
                onClick={() => setSelectedJob(j)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">
                      {j.companyName}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">
                      {j.applicantsCount} Applicants
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{j.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{j.location}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600">
                  <span>{j.salaryRange}</span>
                  <span className="text-indigo-600 font-semibold flex items-center">
                    <span>Rank</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Ranking View for the Selected Job */}
      {selectedJob && <CandidateRankingView selectedJob={selectedJob} />}

      {/* Create Job Modal */}
      <JobManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onJobCreated={handleJobCreated}
      />
    </div>
  );
};
