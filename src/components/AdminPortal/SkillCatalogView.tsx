import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, Network } from 'lucide-react';
import { SkillNode } from '../../types/index.ts';

export const SkillCatalogView: React.FC = () => {
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkillNode['category']>('backend');
  const [level, setLevel] = useState<SkillNode['level']>('fundamental');
  const [prerequisites, setPrerequisites] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/skills');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load skill catalog');
      setSkills(data);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load skill catalog');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          level,
          prerequisites: prerequisites.split(',').map(value => value.trim()).filter(Boolean),
        }),
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error || 'Could not save skill');
      setSkills(current => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setPrerequisites('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save skill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <Network className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Skill Catalog</h2>
            <p className="text-xs text-slate-500">Skills and prerequisite links used in student gap analysis.</p>
          </div>
        </div>

        <form onSubmit={addSkill} className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-5 items-end">
          <label className="text-xs text-slate-600">
            Skill name
            <input required value={name} onChange={event => setName(event.target.value)} className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            Category
            <select value={category} onChange={event => setCategory(event.target.value as SkillNode['category'])} className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
              {['frontend', 'backend', 'ai_ml', 'devops', 'database', 'mobile', 'core_cs'].map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Level
            <select value={level} onChange={event => setLevel(event.target.value as SkillNode['level'])} className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
              {['fundamental', 'intermediate', 'advanced'].map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Prerequisites
            <input value={prerequisites} onChange={event => setPrerequisites(event.target.value)} placeholder="Comma-separated skill names" className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
          </label>
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add skill
          </button>
        </form>
        {error && <p role="alert" className="text-xs text-rose-700 mt-3">{error}</p>}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500">{skills.length} skills</div>
        {loading ? <p className="p-6 text-sm text-slate-500">Loading catalog...</p> : skills.length ? (
          <div className="divide-y divide-slate-100">
            {skills.map(skill => (
              <div key={skill.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{skill.name}</p>
                  <p className="text-xs text-slate-500">{skill.category} · {skill.level}</p>
                </div>
                <p className="text-xs text-slate-500 text-right">{skill.prerequisites.join(', ') || 'No prerequisites'}</p>
              </div>
            ))}
          </div>
        ) : <p className="p-8 text-center text-sm text-slate-500">No skills have been added yet.</p>}
      </section>
    </div>
  );
};