import React, { useState } from 'react';
import { Job } from '../../types/index.ts';
import { X, Sparkles, Plus, Trash2 } from 'lucide-react';

interface JobManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (newJob: Job) => void;
}

export const JobManagerModal: React.FC<JobManagerModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
}) => {
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [workplaceType, setWorkplaceType] = useState<Job['workplaceType'] | ''>('');
  const [salaryRange, setSalaryRange] = useState('');
  const [employmentType, setEmploymentType] = useState<Job['employmentType'] | ''>('');
  const [experienceLevel, setExperienceLevel] = useState<Job['experienceLevel'] | ''>('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);

  const [newReqSkill, setNewReqSkill] = useState('');
  const [newPrefSkill, setNewPrefSkill] = useState('');
  const [newResp, setNewResp] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleAnalyzeJD = async () => {
    if (!description.trim()) return;
    setIsAnalyzing(true);
    setFormError('');
    try {
      const res = await fetch('/api/recruiter/jobs/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, companyName, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not analyze job description');
      if (data.requiredSkills) setRequiredSkills(data.requiredSkills);
      if (data.preferredSkills) setPreferredSkills(data.preferredSkills);
      if (data.responsibilities) setResponsibilities(data.responsibilities);
      if (data.experienceLevel) setExperienceLevel(data.experienceLevel);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not analyze job description');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/recruiter/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          title,
          location,
          workplaceType,
          employmentType,
          salaryRange,
          experienceLevel,
          description,
          requiredSkills,
          preferredSkills,
          responsibilities,
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || 'Could not create job posting');
      onJobCreated(created);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create job posting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Create New Job Posting</h3>
            <p className="text-xs text-slate-500">
              Powered by AI job-description parsing & automated skill extraction
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {formError && <p role="alert" className="text-xs text-rose-700">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Job Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Full Stack Engineer"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location & Workplace</label>
              <input
                type="text"
                required
                placeholder="Enter a location or specify remote"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Salary Range</label>
              <input
                type="text"
                value={salaryRange}
                onChange={e => setSalaryRange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value as Job['experienceLevel'] | '')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                <option value="">Select experience level</option>
                <option value="Entry-level">Entry-level</option>
                <option value="Mid-level">Mid-level</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Employment Type</label>
              <select required value={employmentType} onChange={e => setEmploymentType(e.target.value as Job['employmentType'] | '')} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
                <option value="">Select employment type</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Workplace Type</label>
              <select required value={workplaceType} onChange={e => setWorkplaceType(e.target.value as Job['workplaceType'] | '')} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
                <option value="">Select workplace type</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
              </select>
            </div>
          </div>

          {/* Description & Auto AI Extract */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Job Description</label>
              <button
                type="button"
                onClick={handleAnalyzeJD}
                disabled={isAnalyzing || !description.trim()}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center space-x-1 disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzing ? 'Extracting with Gemini...' : 'AI Auto-Extract Skills'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              required
              placeholder="Paste raw job description here... Then click 'AI Auto-Extract Skills' to automatically infer required and preferred skills."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Required Hard Skills (Prerequisites)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {requiredSkills.map(sk => (
                <span
                  key={sk}
                  className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium flex items-center space-x-1"
                >
                  <span>{sk}</span>
                  <button
                    type="button"
                    onClick={() => setRequiredSkills(prev => prev.filter(s => s !== sk))}
                    className="text-indigo-400 hover:text-indigo-700 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add required skill..."
                value={newReqSkill}
                onChange={e => setNewReqSkill(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (newReqSkill.trim()) {
                    setRequiredSkills(prev => [...prev, newReqSkill.trim()]);
                    setNewReqSkill('');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Preferred Skills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Preferred Bonus Skills
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {preferredSkills.map(sk => (
                <span
                  key={sk}
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center space-x-1"
                >
                  <span>{sk}</span>
                  <button
                    type="button"
                    onClick={() => setPreferredSkills(prev => prev.filter(s => s !== sk))}
                    className="text-slate-400 hover:text-slate-700 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add preferred skill..."
                value={newPrefSkill}
                onChange={e => setNewPrefSkill(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (newPrefSkill.trim()) {
                    setPreferredSkills(prev => [...prev, newPrefSkill.trim()]);
                    setNewPrefSkill('');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Add
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs"
            >
              Publish Job Posting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
