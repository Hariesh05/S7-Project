import React from 'react';
import { PlacementReadinessScore } from '../../types/index.ts';
import { Award, TrendingUp, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface PlacementReadinessCardProps {
  scoreData: PlacementReadinessScore;
  onOpenMockInterview?: () => void;
  onOpenATSScanner?: () => void;
}

export const PlacementReadinessCard: React.FC<PlacementReadinessCardProps> = ({
  scoreData,
  onOpenMockInterview,
  onOpenATSScanner,
}) => {
  const { overall, breakdown, percentileRank, strengths, improvementAreas } = scoreData;

  // Determine color scheme
  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 70) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900">Placement Readiness Score</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {overall ? 'Based on your saved profile' : 'Add profile data to establish a baseline'}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Composite readiness evaluation index · Not guaranteed hiring probability</span>
          </div>
        </div>

        {/* Big Score Gauge */}
        <div className="flex items-center space-x-4">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600 transition-all duration-1000 stroke-current"
                strokeDasharray={`${overall}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-900 leading-none">{overall}</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">/100</span>
            </div>
          </div>

          <div className="text-left">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</div>
            <div className={`text-sm font-bold flex items-center space-x-1 ${overall ? 'text-emerald-600' : 'text-slate-500'}`}>
              <Award className="w-4 h-4" />
              <span>{overall ? 'Profile baseline available' : 'Profile incomplete'}</span>
            </div>
            <div className="text-xs text-slate-500">Not a hiring probability</div>
          </div>
        </div>
      </div>

      {/* 5-Dimensional Breakdown */}
      <div className="py-6 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Score Breakdown Weights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Tech Skills */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Technical Skills</span>
              <span className="text-xs font-bold text-slate-900">{breakdown.technicalSkills}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${breakdown.technicalSkills}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1.5">Weight: 35%</span>
          </div>

          {/* Projects */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Projects & Proof</span>
              <span className="text-xs font-bold text-slate-900">{breakdown.projectsPortfolio}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${breakdown.projectsPortfolio}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1.5">Weight: 25%</span>
          </div>

          {/* Resume ATS */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={onOpenATSScanner}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Resume & ATS</span>
              <span className="text-xs font-bold text-slate-900">{breakdown.resumeAtsQuality}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${breakdown.resumeAtsQuality}%` }}
              />
            </div>
            <span className="text-[10px] text-indigo-600 hover:underline block mt-1.5">Weight: 20% · View Scan</span>
          </div>

          {/* Mock Interview */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={onOpenMockInterview}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Interview Practice</span>
              <span className="text-xs font-bold text-slate-900">{breakdown.mockInterviewPerformance}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-violet-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${breakdown.mockInterviewPerformance}%` }}
              />
            </div>
            <span className="text-[10px] text-indigo-600 hover:underline block mt-1.5">Weight: 15% · Practice</span>
          </div>

          {/* Market Alignment */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Market Alignment</span>
              <span className="text-xs font-bold text-slate-900">{breakdown.marketAlignment}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${breakdown.marketAlignment}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1.5">Weight: 5%</span>
          </div>
        </div>
      </div>

      {/* Strengths & Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Demonstrated Competitive Strengths</span>
          </div>
          <ul className="space-y-2">
            {strengths.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-600 flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2.5">
            <AlertCircle className="w-4 h-4 text-indigo-600" />
            <span>High-Priority Improvement Actions</span>
          </div>
          <ul className="space-y-2">
            {improvementAreas.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-600 flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
