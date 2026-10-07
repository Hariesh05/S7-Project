import React, { useState, useEffect } from 'react';
import { AIModelEvaluationMetrics } from '../../types/index.ts';
import { Cpu, Zap, Activity, ThumbsUp, BarChart2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AIModelEvalView: React.FC = () => {
  const [metrics, setMetrics] = useState<AIModelEvaluationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/ai-model-eval');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching AI metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Banner & Metric Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              AI Recommendation Model Evaluation & Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Performance metrics, embedding distributions, and student feedback validation loop.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Embeddings
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalEmbeddingsComputed.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">pgvector cosine vectors</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Avg Model Latency
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {metrics.averageLatencyMs} ms
            </div>
            <span className="text-[11px] text-slate-500">Gemini 3.8 Flash p50 inference</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Semantic Accuracy
            </span>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {metrics.semanticMatchAccuracyRate}%
            </div>
            <span className="text-[11px] text-slate-500">Benchmark vs human recruiter</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Student Approval Rate
            </span>
            <div className="text-2xl font-black text-violet-600 mt-1">
              {metrics.userFeedbackApprovalRate}%
            </div>
            <span className="text-[11px] text-slate-500">Based on {metrics.feedbackSampleCount} reviews</span>
          </div>
        </div>
      </div>

      {/* Cosine Similarity Distribution Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Vector Cosine Similarity Score Distribution
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.cosineDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl">
                        <p className="font-bold">Bucket: {d.bucket}</p>
                        <p className="text-indigo-300">Matches: {d.count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
