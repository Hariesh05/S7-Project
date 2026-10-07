import React, { useState, useEffect } from 'react';
import { User } from '../../types/index.ts';
import { MarketIntelligenceView } from './MarketIntelligenceView.tsx';
import { AIModelEvalView } from './AIModelEvalView.tsx';
import { PostgresSqlConsole } from './PostgresSqlConsole.tsx';
import {
  ShieldCheck,
  TrendingUp,
  Building,
  GraduationCap,
  Award,
  Layers,
  Database,
  Cpu,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'aimodel' | 'postgres'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
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
                Dean of Placements
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Campus Placement Intelligence & Institutional Analytics Directorate
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
              <span>Class of 2026</span>
              <span>·</span>
              <span>1,240 Enrolled Engineering Candidates</span>
            </div>
          </div>
        </div>

        {/* Sub-tabs selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl overflow-x-auto self-start md:self-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Placement Analytics
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'market'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Market Trends
          </button>
          <button
            onClick={() => setActiveTab('aimodel')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'aimodel'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Evaluation
          </button>
          <button
            onClick={() => setActiveTab('postgres')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'postgres'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Postgres & SQL
          </button>
        </div>
      </div>

      {/* Tab 1: Overview Placement Analytics */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Campus Placement Rate
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {metrics.placementRate}%
              </div>
              <span className="text-[11px] text-slate-500">
                {metrics.placedStudents} of {metrics.totalStudents} placed
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Average Compensation
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {metrics.averageSalaryPackage}
              </div>
              <span className="text-[11px] text-slate-500">Tier-1 full-stack & ML cohorts</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Highest Package
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {metrics.highestSalaryPackage}
              </div>
              <span className="text-[11px] text-slate-500">Frontier AI Research role</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Tech Employers
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {metrics.activeHiringCompanies}
              </div>
              <span className="text-[11px] text-slate-500">Partnered on-campus portals</span>
            </div>
          </div>

          {/* Top Hiring Companies Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Top Recruiting Tech Companies Leaderboard
            </h3>

            <div className="divide-y divide-slate-100">
              {metrics.topHiringCompanies?.map((comp: any, idx: number) => (
                <div
                  key={comp.name}
                  className="py-3.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-slate-400 w-4">#{idx + 1}</span>
                    <span className="font-bold text-slate-900">{comp.name}</span>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Offers Extended
                      </span>
                      <div className="font-bold text-slate-800 text-right">{comp.offersCount}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Avg Package
                      </span>
                      <div className="font-bold text-indigo-600 text-right">{comp.avgPackage}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Market Intelligence */}
      {activeTab === 'market' && <MarketIntelligenceView />}

      {/* Tab 3: AI Model Evaluation */}
      {activeTab === 'aimodel' && <AIModelEvalView />}

      {/* Tab 4: Postgres & SQL */}
      {activeTab === 'postgres' && <PostgresSqlConsole />}
    </div>
  );
};
