import React, { useState, useEffect } from 'react';
import { MarketTrendItem } from '../../types/index.ts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const MarketIntelligenceView: React.FC = () => {
  const [trends, setTrends] = useState<MarketTrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      const res = await fetch('/api/admin/market-intelligence');
      const data = await res.json();
      setTrends(data.trends || []);
    } catch (err) {
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = trends.map(t => ({
    name: t.skill.split(' ')[0],
    fullName: t.skill,
    demand: t.demandIndex,
    growth: t.growthYoY,
    positions: t.openPositionsCount,
  }));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Market Intelligence & Technology Trends (2024-2026)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time campus placement demand analytics vs national tech hiring indexes.
            </p>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-700">
            <Info className="w-4 h-4 shrink-0" />
            <span>Seed & Verified Aggregated Market Data</span>
          </div>
        </div>

        {/* Recharts Bar Chart: Most Demanded Skills */}
        <div className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hiring Demand Index by Technology
            </h3>
            <span className="text-xs text-slate-500">Scale: 0 - 100</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl space-y-1">
                          <p className="font-bold">{data.fullName}</p>
                          <p className="text-indigo-300">Demand Index: {data.demand}/100</p>
                          <p className="text-emerald-400">Growth YoY: +{data.growth}%</p>
                          <p className="text-slate-400">Open Postings: {data.positions.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="demand" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.growth > 0 ? '#4f46e5' : '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rising vs Declining Trends Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Skill Trajectory & YoY Momentum
        </h3>

        <div className="divide-y divide-slate-100">
          {trends.map(t => (
            <div key={t.skill} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    t.trendDirection === 'up'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {t.trendDirection === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.skill}</h4>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {t.category} · {t.openPositionsCount.toLocaleString()} Open Roles
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Demand Index</span>
                  <span className="font-bold text-slate-800">{t.demandIndex}/100</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">YoY Growth</span>
                  <span
                    className={`font-bold ${
                      t.growthYoY > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {t.growthYoY > 0 ? `+${t.growthYoY}%` : `${t.growthYoY}%`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
