import React, { useState, useEffect } from 'react';
import { SkillGapItem, RoadmapStep, CourseRecommendation, ProjectRecommendation } from '../../types/index.ts';
import {
  Compass,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  FolderGit2,
  ExternalLink,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const SkillGapRoadmap: React.FC = () => {
  const [gaps, setGaps] = useState<SkillGapItem[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gapsRes, roadmapRes] = await Promise.all([
        fetch('/api/student/skill-gap'),
        fetch('/api/student/roadmap'),
      ]);
      const gapsData = await gapsRes.json();
      const roadmapData = await roadmapRes.json();
      setGaps(gapsData);
      setRoadmap(roadmapData);
    } catch (err) {
      console.error('Error fetching roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'critical':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertOctagon className="w-3 h-3" />
            <span>Critical Blocker</span>
          </span>
        );
      case 'important':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            <span>Important Gap</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
            <span>Optional / Preferred</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Personalized Learning Roadmap & Skill-Gap Analysis
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic prerequisite ordering and targeted capstone projects designed to eliminate interview screening rejections.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-600">
            {gaps.length} required skill gaps across active listings
          </div>
        </div>

        {/* Missing Skills Grid (Critical, Important, Optional) */}
        <div className="pt-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Identified Capability Gaps for Target Roles
          </h3>

          {gaps.length ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gaps.map(gap => (
              <div key={gap.skillName} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    {getImportanceBadge(gap.importance)}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {gap.estimatedHours ? `~${gap.estimatedHours} hrs` : 'Hours not estimated'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{gap.skillName}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5 capitalize">
                    {gap.category} · {gap.learningDifficulty} Level
                  </div>

                  <div className="mt-3 text-xs text-slate-600">
                    <span className="text-[11px] text-slate-400 block font-medium">Current vs Target:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${(gap.studentCurrentLevel / gap.requiredLevel) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800">
                        {gap.studentCurrentLevel}/{gap.requiredLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 text-[11px] text-emerald-700 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{!gap.prerequisitesKnown ? 'Prerequisites not configured' : gap.prerequisitesMet ? 'No missing prerequisites' : `Missing: ${gap.missingPrerequisites.join(', ')}`}</span>
                </div>
              </div>
            ))}
          </div> : <p className="py-8 text-center text-sm text-slate-500">Add a resume and browse active job listings to generate skill gaps.</p>}
        </div>
      </div>

      {/* Week-by-Week Trajectory Phases */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 pb-6 border-b border-slate-100">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Personalized Learning Order & Gap-Closing Sprints
            </h3>
            <p className="text-xs text-slate-500">
              Structured sequence driven by the Skill Knowledge Graph DAG prerequisites.
            </p>
          </div>
        </div>

        <div className="space-y-6 pt-6">
          {roadmap.length ? roadmap.map(step => (
            <div
              key={step.stepNumber}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-indigo-200 transition-colors"
            >
              {/* Phase header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/60 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {step.stepNumber}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{step.phase}</h4>
                    <span className="text-xs font-semibold text-indigo-600">{step.skillName}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{step.estimatedWeeks ? `Est. ${step.estimatedWeeks} weeks` : 'Time estimate unavailable'}</span>
                  </span>
                  {getImportanceBadge(step.importance)}
                </div>
              </div>

              <p className="text-xs text-slate-600 my-3">{step.whyThisSkill}</p>

              {/* Recommended Course & Hands-on Project Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Course Recommendation */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Recommended Course</span>
                  </div>
                  {step.recommendedCourses?.map((c, i) => (
                    <div key={i}>
                      <h5 className="text-xs font-bold text-slate-900">{c.title}</h5>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                        <span className="font-medium text-slate-700">{c.platform}</span>
                        <span>·</span>
                        <span>{c.duration}</span>
                        <span>·</span>
                        <span className="text-amber-600 font-semibold">★ {c.rating}</span>
                      </div>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-indigo-600 font-semibold mt-2 hover:underline"
                      >
                        <span>Start Course</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>

                {/* Practical Project Recommendation */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2">
                    <FolderGit2 className="w-3.5 h-3.5" />
                    <span>Gap-Closing Capstone Project</span>
                  </div>
                  {step.recommendedProject && (
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">
                        {step.recommendedProject.title}
                      </h5>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {step.recommendedProject.description}
                      </p>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-2">
                        <span className="font-semibold text-slate-700">
                          {step.recommendedProject.estimatedHours} hrs build time
                        </span>
                        <span>·</span>
                        <span className="text-emerald-700 font-medium">
                          {step.recommendedProject.portfolioImpact}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : <p className="py-8 text-center text-sm text-slate-500">A learning roadmap will appear when active jobs identify skill requirements.</p>}
        </div>
      </div>
    </div>
  );
};
