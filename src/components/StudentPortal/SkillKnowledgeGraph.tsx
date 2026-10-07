import React, { useState } from 'react';
import { SkillNode, SkillKnowledgeEdge, StudentProfile } from '../../types/index.ts';
import {
  Network,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Compass,
} from 'lucide-react';

interface SkillKnowledgeGraphProps {
  skills: SkillNode[];
  edges: SkillKnowledgeEdge[];
  studentProfile: StudentProfile;
}

export const SkillKnowledgeGraph: React.FC<SkillKnowledgeGraphProps> = ({
  skills,
  edges,
  studentProfile,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<'ai_ml' | 'backend' | 'frontend' | 'devops'>('backend');
  const [activeSkill, setActiveSkill] = useState<SkillNode | null>(null);

  const studentSkillNames = new Set(studentProfile.skills.map(s => s.name.toLowerCase()));

  // Curated knowledge graph tracks showcasing the prompt's explicit prerequisite chains
  const tracks = [
    {
      id: 'backend',
      label: 'Java & Distributed Backend',
      description: 'Java → Spring Framework → Spring Boot → Spring Security → Apache Kafka',
      chain: ['Java', 'Spring Framework', 'Spring Boot', 'Spring Security', 'Apache Kafka'],
    },
    {
      id: 'ai_ml',
      label: 'Python AI & Data Intelligence',
      description: 'Python → NumPy → Pandas → Machine Learning → Deep Learning → LLM & Generative AI',
      chain: ['Python', 'NumPy', 'Pandas', 'Machine Learning', 'Deep Learning', 'LLM & Generative AI'],
    },
    {
      id: 'frontend',
      label: 'Modern Full-Stack & TypeScript',
      description: 'JavaScript → TypeScript → React → Next.js',
      chain: ['JavaScript', 'TypeScript', 'React', 'Next.js'],
    },
    {
      id: 'devops',
      label: 'Cloud Infrastructure & DevOps',
      description: 'Docker → Kubernetes → CI/CD Pipelines → AWS Cloud',
      chain: ['Docker', 'Kubernetes', 'CI/CD Pipelines', 'AWS Cloud'],
    },
  ];

  const currentTrack = tracks.find(t => t.id === selectedTrack) || tracks[0];

  const getSkillStatus = (skillName: string, index: number, chain: string[]) => {
    const isMastered = studentSkillNames.has(skillName.toLowerCase());
    if (isMastered) return 'mastered';

    // If previous skill in chain was mastered, this is ready to learn
    if (index === 0) return 'ready';
    const prevSkill = chain[index - 1];
    const prevMastered = studentSkillNames.has(prevSkill.toLowerCase());
    return prevMastered ? 'ready' : 'locked';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Skill Knowledge Graph & DAG Trajectory</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prerequisite dependency trees determining optimal foundational learning order.
          </p>
        </div>

        {/* Track selector tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {tracks.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTrack(t.id as any);
                setActiveSkill(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
                selectedTrack === t.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Track Description Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
            Prerequisite Progression Chain:
          </span>
          <span className="text-xs font-semibold text-indigo-800 font-mono mt-0.5 block">
            {currentTrack.description}
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs font-medium">
          <span className="flex items-center space-x-1 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Mastered</span>
          </span>
          <span className="flex items-center space-x-1 text-indigo-700">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Next to Learn</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span>Locked (Needs Prereqs)</span>
          </span>
        </div>
      </div>

      {/* Visual DAG Interactive Flow */}
      <div className="py-6 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] px-4">
          {currentTrack.chain.map((skillName, idx) => {
            const status = getSkillStatus(skillName, idx, currentTrack.chain);
            const isLast = idx === currentTrack.chain.length - 1;
            const skillObj = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase()) || {
              name: skillName,
              demandGrowthRate: 25,
              averageSalary: '$140,000',
              level: 'intermediate',
            };

            return (
              <React.Fragment key={skillName}>
                <div
                  onClick={() => setActiveSkill(skillObj as any)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer w-48 text-center shrink-0 ${
                    status === 'mastered'
                      ? 'border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50'
                      : status === 'ready'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {status === 'mastered' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : status === 'ready' ? (
                      <Compass className="w-5 h-5 text-indigo-600 animate-pulse" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{skillName}</h4>
                  <div className="text-[10px] text-slate-500 capitalize mt-1">
                    {status === 'mastered'
                      ? 'Verified on Profile'
                      : status === 'ready'
                      ? 'Prerequisites Satisfied'
                      : 'Prerequisites Incomplete'}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600">
                    <span className="flex items-center text-emerald-600 font-bold">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      +{skillObj.demandGrowthRate}%
                    </span>
                    <span className="font-semibold text-slate-700">{skillObj.averageSalary}</span>
                  </div>
                </div>

                {!isLast && (
                  <div className="flex items-center justify-center px-2">
                    <ArrowRight className="w-5 h-5 text-indigo-300" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Skill Details Box */}
      {activeSkill && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 animate-in fade-in duration-200">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{activeSkill.name}</h4>
              <p className="text-xs text-slate-500 capitalize">
                Complexity: {activeSkill.level} · Demand YoY: +{activeSkill.demandGrowthRate}%
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded text-indigo-600">
              Avg Market Comp: {activeSkill.averageSalary}
            </span>
          </div>

          <p className="text-xs text-slate-600 mt-2">
            This capability represents an essential milestone along the engineering maturity curve. Mastering this unlocks advanced roles in high-performance cloud architectures.
          </p>
        </div>
      )}
    </div>
  );
};
