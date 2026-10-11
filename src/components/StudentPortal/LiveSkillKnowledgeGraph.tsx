import React, { useState } from 'react';
import { CheckCircle2, Lock, Network } from 'lucide-react';
import { SkillKnowledgeEdge, SkillNode, StudentProfile } from '../../types/index.ts';

interface LiveSkillKnowledgeGraphProps {
  skills: SkillNode[];
  edges: SkillKnowledgeEdge[];
  studentProfile: StudentProfile;
}

export const LiveSkillKnowledgeGraph: React.FC<LiveSkillKnowledgeGraphProps> = ({
  skills,
  edges,
  studentProfile,
}) => {
  const categories = [...new Set(skills.map(skill => skill.category))];
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const studentSkills = new Map(studentProfile.skills.map(skill => [skill.name.toLowerCase(), skill]));
  const visibleSkills = skills.filter(skill => activeCategory === 'all' || skill.category === activeCategory);
  const selectedSkill = skills.find(skill => skill.id === selectedSkillId) || null;

  const prerequisitesFor = (skill: SkillNode) => edges
    .filter(edge => edge.target.toLowerCase() === skill.name.toLowerCase())
    .map(edge => edge.source);

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <header className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <Network className="w-5 h-5 text-indigo-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Skill Knowledge Graph</h2>
          <p className="text-xs text-slate-500">Catalog skills, declared prerequisites, and your documented proficiency.</p>
        </div>
      </header>

      {skills.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">The skill catalog is empty. An administrator must add skills before a graph can be shown.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter skill category">
            {['all', ...categories].map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1.5 text-xs font-semibold border rounded-md capitalize ${activeCategory === category ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300'}`}
              >
                {category === 'all' ? 'All categories' : category.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {visibleSkills.map(skill => {
              const studentSkill = studentSkills.get(skill.name.toLowerCase());
              const prerequisites = prerequisitesFor(skill);
              const missingPrerequisites = prerequisites.filter(name => !studentSkills.has(name.toLowerCase()));
              const mastered = Boolean(studentSkill && studentSkill.proficiency >= 3);
              const ready = !mastered && missingPrerequisites.length === 0;

              return (
                <button
                  key={skill.id}
                  onClick={() => setSelectedSkillId(skill.id)}
                  className={`text-left border rounded-lg p-4 transition-colors ${selectedSkillId === skill.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-400'}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{skill.name}</h3>
                      <p className="text-xs text-slate-500 capitalize mt-1">{skill.category.replace('_', ' ')} · {skill.level}</p>
                    </div>
                    {mastered ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : ready ? <Network className="w-4 h-4 text-indigo-600 shrink-0" /> : <Lock className="w-4 h-4 text-slate-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-600 mt-3">
                    {mastered ? `Documented at ${studentSkill?.proficiency}/5` : ready ? 'No catalog prerequisites missing' : `Needs: ${missingPrerequisites.join(', ')}`}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {prerequisites.length ? `Prerequisites: ${prerequisites.join(', ')}` : 'No prerequisites recorded'}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedSkill && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">{selectedSkill.name}</h3>
              <p className="text-xs text-slate-600 mt-1">Catalog level: {selectedSkill.level}. Compensation and market growth are not configured.</p>
              <p className="text-xs text-slate-500 mt-1">Prerequisites: {prerequisitesFor(selectedSkill).join(', ') || 'None recorded'}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
};