import React, { useEffect, useState } from 'react';
import { Check, Plus, Save, Trash2, UserRound } from 'lucide-react';
import {
  Certification,
  Education,
  StudentProfile,
  StudentProject,
  StudentSkill,
  WorkExperience,
} from '../../types/index.ts';

interface StudentProfileEditorProps {
  profile: StudentProfile;
  onProfileUpdated: (profile: StudentProfile) => void;
  onOpenResume: () => void;
}

const fieldClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';
const newSkill = (): StudentSkill => ({
  id: `manual_${crypto.randomUUID()}`,
  skillId: '',
  name: '',
  category: 'core_cs',
  proficiency: 3,
  verifiedBy: 'self',
  yearsExperience: 0,
});

export const StudentProfileEditor: React.FC<StudentProfileEditorProps> = ({ profile, onProfileUpdated, onOpenResume }) => {
  const [draft, setDraft] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(profile), [profile]);

  const update = <K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const updateEducation = (index: number, patch: Partial<Education>) =>
    update('education', draft.education.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateExperience = (index: number, patch: Partial<WorkExperience>) =>
    update('experience', draft.experience.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateProject = (index: number, patch: Partial<StudentProject>) =>
    update('projects', draft.projects.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateCertification = (index: number, patch: Partial<Certification>) =>
    update('certifications', draft.certifications.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateSkill = (index: number, patch: Partial<StudentSkill>) =>
    update('skills', draft.skills.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch, verifiedBy: 'self' } : item));

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const normalized = {
        ...draft,
        skills: draft.skills.filter(skill => skill.name.trim()).map(skill => ({
          ...skill,
          name: skill.name.trim(),
          skillId: `s_${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        })),
        targetRoles: draft.targetRoles.map(role => role.trim()).filter(Boolean),
      };
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save profile');
      setDraft(result);
      onProfileUpdated(result);
      setSaved(true);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-5">
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Profile</h2>
              <p className="text-xs text-slate-500 mt-1">Profile information shared with recruiters when you apply.</p>
            </div>
            <button type="button" onClick={() => { setDraft(profile); setSaved(false); setIsEditing(true); }} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Update Profile
            </button>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Headline</p><p className="text-sm text-slate-800 mt-1">{profile.headline || 'Not provided'}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Target roles</p><p className="text-sm text-slate-800 mt-1">{profile.targetRoles.join(', ') || 'Not provided'}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Education</p><p className="text-sm text-slate-800 mt-1">{[profile.degree, profile.university].filter(Boolean).join(' · ') || 'Not provided'}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Graduation / GPA</p><p className="text-sm text-slate-800 mt-1">{[profile.graduationYear || null, profile.cgpa || null].filter(Boolean).join(' · ') || 'Not provided'}</p></div>
            <div className="sm:col-span-2"><p className="text-[10px] font-bold uppercase text-slate-400">About</p><p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{profile.bio || 'Not provided'}</p></div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div><h3 className="text-sm font-bold text-slate-900">Skills</h3><p className="text-xs text-slate-500 mt-1">Self-entered skills remain saved alongside resume-extracted skills.</p></div>
          {profile.skills.length ? <div className="flex flex-wrap gap-2">{profile.skills.map(skill => (
            <span key={skill.id} className="inline-flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-md px-2.5 py-1.5 text-xs text-slate-700">
              <span>{skill.name}</span><span className="font-semibold text-indigo-700">{skill.proficiency}/5</span><span className="text-slate-400">{skill.verifiedBy === 'self' ? 'self' : 'resume'}</span>
            </span>
          ))}</div> : <p className="text-sm text-slate-500">No skills saved yet.</p>}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Education</h3>
            {profile.education.length ? profile.education.map((item, index) => <div key={`education_${index}`} className="border-t border-slate-100 pt-3 text-sm"><p className="font-semibold text-slate-800">{item.degree || 'Degree'}{item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ''}</p><p className="text-xs text-slate-600">{item.institution} {[item.startYear || null, item.endYear || null].filter(Boolean).join(' - ')}</p>{item.grade && <p className="text-xs text-slate-500">{item.grade}</p>}</div>) : <p className="text-sm text-slate-500">No education entries.</p>}
          </section>
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Experience</h3>
            {profile.experience.length ? profile.experience.map((item, index) => <div key={`experience_${index}`} className="border-t border-slate-100 pt-3"><p className="text-sm font-semibold text-slate-800">{item.role}{item.company ? ` · ${item.company}` : ''}</p><p className="text-xs text-slate-500">{item.startDate}{item.endDate ? ` - ${item.endDate}` : item.isCurrent ? ' - Present' : ''}</p>{item.description && <p className="text-xs text-slate-700 mt-2 whitespace-pre-wrap">{item.description}</p>}</div>) : <p className="text-sm text-slate-500">No experience entries.</p>}
          </section>
        </div>

        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Projects & Certifications</h3>
          {profile.projects.map((item, index) => <div key={`project_${index}`} className="border-t border-slate-100 pt-3"><p className="text-sm font-semibold text-slate-800">{item.title}</p><p className="text-xs text-slate-700 mt-1">{item.description}</p>{item.technologies.length > 0 && <p className="text-xs text-slate-500 mt-1">{item.technologies.join(', ')}</p>}</div>)}
          {profile.certifications.map((item, index) => <p key={`certification_${index}`} className="border-t border-slate-100 pt-3 text-xs text-slate-700">{item.name}{item.issuer ? ` · ${item.issuer}` : ''}{item.issueDate ? ` · ${item.issueDate}` : ''}</p>)}
          {!profile.projects.length && !profile.certifications.length && <p className="text-sm text-slate-500">No projects or certifications.</p>}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h3 className="text-sm font-bold text-slate-900">Resume</h3><p className="text-xs text-slate-600 mt-1">{profile.resumeFileName || 'No resume uploaded'}{profile.resumeLastUpdated ? ` · Updated ${new Date(profile.resumeLastUpdated).toLocaleDateString()}` : ''}</p></div>
          <button type="button" onClick={onOpenResume} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">{profile.resumeFileName ? 'Update Resume' : 'Upload Resume'}</button>
        </section>
      </div>
    );
  }

  return (
    <form onSubmit={saveProfile} className="space-y-5">
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <header className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <UserRound className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Update Profile</h2>
            <p className="text-xs text-slate-500">Change the details and skills you want recruiters to see when you apply.</p>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-700">Professional headline
            <input className={fieldClass} value={draft.headline} onChange={event => update('headline', event.target.value)} placeholder="e.g. Computer science student interested in backend engineering" />
          </label>
          <label className="text-xs font-semibold text-slate-700">University or institution
            <input className={fieldClass} value={draft.university} onChange={event => update('university', event.target.value)} />
          </label>
          <label className="text-xs font-semibold text-slate-700">Degree
            <input className={fieldClass} value={draft.degree} onChange={event => update('degree', event.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-700">Graduation year
              <input type="number" min="1900" max="2100" className={fieldClass} value={draft.graduationYear || ''} onChange={event => update('graduationYear', Number(event.target.value) || 0)} />
            </label>
            <label className="text-xs font-semibold text-slate-700">CGPA / GPA
              <input type="number" min="0" max="100" step="0.01" className={fieldClass} value={draft.cgpa || ''} onChange={event => update('cgpa', Number(event.target.value) || 0)} />
            </label>
          </div>
          <label className="text-xs font-semibold text-slate-700 md:col-span-2">About
            <textarea rows={4} className={fieldClass} value={draft.bio} onChange={event => update('bio', event.target.value)} placeholder="Summarize your interests, strengths, and goals." />
          </label>
          <label className="text-xs font-semibold text-slate-700 md:col-span-2">Target roles (comma-separated)
            <input className={fieldClass} value={draft.targetRoles.join(', ')} onChange={event => update('targetRoles', event.target.value.split(',').map(role => role.trim()).filter(Boolean))} placeholder="Backend Developer, Data Analyst" />
          </label>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <header className="flex justify-between items-center">
          <div><h2 className="text-sm font-bold text-slate-900">Skills</h2><p className="text-xs text-slate-500">Enter a skill and your proficiency. Saved skills are kept when you upload or parse a resume.</p></div>
          <button type="button" onClick={() => update('skills', [...draft.skills, newSkill()])} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700"><Plus className="w-4 h-4" />Add skill</button>
        </header>
        {draft.skills.length ? draft.skills.map((skill, index) => (
          <div key={skill.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_160px_auto] gap-2 items-end border-t border-slate-100 pt-3">
            <label className="text-xs text-slate-600">Skill<input className={fieldClass} value={skill.name} onChange={event => updateSkill(index, { name: event.target.value })} placeholder="Skill name" /></label>
            <label className="text-xs text-slate-600">Proficiency<select className={fieldClass} value={skill.proficiency} onChange={event => updateSkill(index, { proficiency: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>{level}/5</option>)}</select></label>
            <button type="button" onClick={() => update('skills', draft.skills.filter((_, itemIndex) => itemIndex !== index))} title="Remove skill" aria-label="Remove skill" className="p-2 text-rose-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        )) : <p className="text-xs text-slate-500">No skills added yet.</p>}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <header className="flex justify-between items-center"><div><h2 className="text-sm font-bold text-slate-900">Education</h2></div><button type="button" onClick={() => update('education', [...draft.education, { institution: '', degree: '', fieldOfStudy: '', startYear: 0, endYear: 0, grade: '' }])} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700"><Plus className="w-4 h-4" />Add education</button></header>
        {draft.education.map((item, index) => <div key={`education_${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          <input aria-label="Institution" className={fieldClass} placeholder="Institution" value={item.institution} onChange={event => updateEducation(index, { institution: event.target.value })} />
          <input aria-label="Degree" className={fieldClass} placeholder="Degree" value={item.degree} onChange={event => updateEducation(index, { degree: event.target.value })} />
          <input aria-label="Field of study" className={fieldClass} placeholder="Field of study" value={item.fieldOfStudy} onChange={event => updateEducation(index, { fieldOfStudy: event.target.value })} />
          <input aria-label="Grade" className={fieldClass} placeholder="Grade / GPA" value={item.grade} onChange={event => updateEducation(index, { grade: event.target.value })} />
          <div className="flex gap-2"><input aria-label="Start year" type="number" className={fieldClass} placeholder="Start year" value={item.startYear || ''} onChange={event => updateEducation(index, { startYear: Number(event.target.value) || 0 })} /><input aria-label="End year" type="number" className={fieldClass} placeholder="End year" value={item.endYear || ''} onChange={event => updateEducation(index, { endYear: Number(event.target.value) || 0 })} /></div>
          <button type="button" onClick={() => update('education', draft.education.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-rose-600 text-left">Remove education</button>
        </div>)}
        {!draft.education.length && <p className="text-xs text-slate-500">No education entries yet.</p>}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <header className="flex justify-between items-center"><div><h2 className="text-sm font-bold text-slate-900">Experience</h2></div><button type="button" onClick={() => update('experience', [...draft.experience, { company: '', role: '', startDate: '', endDate: '', isCurrent: false, description: '', skillsUsed: [] }])} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700"><Plus className="w-4 h-4" />Add experience</button></header>
        {draft.experience.map((item, index) => <div key={`experience_${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          <input aria-label="Company" className={fieldClass} placeholder="Company" value={item.company} onChange={event => updateExperience(index, { company: event.target.value })} />
          <input aria-label="Role" className={fieldClass} placeholder="Role" value={item.role} onChange={event => updateExperience(index, { role: event.target.value })} />
          <input aria-label="Start date" className={fieldClass} placeholder="Start date" value={item.startDate} onChange={event => updateExperience(index, { startDate: event.target.value })} />
          <input aria-label="End date" className={fieldClass} placeholder="End date" value={item.endDate} onChange={event => updateExperience(index, { endDate: event.target.value })} />
          <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={item.isCurrent} onChange={event => updateExperience(index, { isCurrent: event.target.checked })} />Current role</label>
          <input aria-label="Skills used" className={fieldClass} placeholder="Skills used, comma-separated" value={item.skillsUsed.join(', ')} onChange={event => updateExperience(index, { skillsUsed: event.target.value.split(',').map(skill => skill.trim()).filter(Boolean) })} />
          <textarea aria-label="Experience description" rows={3} className={`${fieldClass} md:col-span-2`} placeholder="What did you work on?" value={item.description} onChange={event => updateExperience(index, { description: event.target.value })} />
          <button type="button" onClick={() => update('experience', draft.experience.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-rose-600 text-left">Remove experience</button>
        </div>)}
        {!draft.experience.length && <p className="text-xs text-slate-500">No experience entries yet.</p>}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <header className="flex justify-between items-center"><div><h2 className="text-sm font-bold text-slate-900">Projects & Certifications</h2></div><div className="flex gap-4"><button type="button" onClick={() => update('projects', [...draft.projects, { title: '', description: '', technologies: [] }])} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700"><Plus className="w-4 h-4" />Project</button><button type="button" onClick={() => update('certifications', [...draft.certifications, { name: '', issuer: '', issueDate: '' }])} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700"><Plus className="w-4 h-4" />Certification</button></div></header>
        {draft.projects.map((item, index) => <div key={`project_${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          <input aria-label="Project title" className={fieldClass} placeholder="Project title" value={item.title} onChange={event => updateProject(index, { title: event.target.value })} />
          <input aria-label="Project technologies" className={fieldClass} placeholder="Technologies, comma-separated" value={item.technologies.join(', ')} onChange={event => updateProject(index, { technologies: event.target.value.split(',').map(skill => skill.trim()).filter(Boolean) })} />
          <textarea aria-label="Project description" rows={3} className={`${fieldClass} md:col-span-2`} placeholder="Project description" value={item.description} onChange={event => updateProject(index, { description: event.target.value })} />
          <input aria-label="Project repository URL" className={fieldClass} placeholder="Repository URL" value={item.repoUrl || ''} onChange={event => updateProject(index, { repoUrl: event.target.value })} />
          <input aria-label="Project impact" className={fieldClass} placeholder="Impact or result" value={item.impactMetric || ''} onChange={event => updateProject(index, { impactMetric: event.target.value })} />
          <button type="button" onClick={() => update('projects', draft.projects.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-rose-600 text-left">Remove project</button>
        </div>)}
        {draft.certifications.map((item, index) => <div key={`certification_${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
          <input aria-label="Certification name" className={fieldClass} placeholder="Certification" value={item.name} onChange={event => updateCertification(index, { name: event.target.value })} />
          <input aria-label="Certification issuer" className={fieldClass} placeholder="Issuer" value={item.issuer} onChange={event => updateCertification(index, { issuer: event.target.value })} />
          <div className="flex gap-2"><input aria-label="Certification date" className={fieldClass} placeholder="Date" value={item.issueDate} onChange={event => updateCertification(index, { issueDate: event.target.value })} /><button type="button" onClick={() => update('certifications', draft.certifications.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-rose-600">Remove</button></div>
        </div>)}
        {!draft.projects.length && !draft.certifications.length && <p className="text-xs text-slate-500">No projects or certifications added yet.</p>}
      </section>

      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {saved && <p role="status" className="inline-flex items-center gap-2 text-sm text-emerald-700"><Check className="w-4 h-4" />Profile saved</p>}
      <div className="flex justify-end">
        <button type="button" onClick={() => { setDraft(profile); setError(''); setIsEditing(false); }} className="mr-3 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">
          Cancel
        </button>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save profile'}
        </button>
      </div>
    </form>
  );
};