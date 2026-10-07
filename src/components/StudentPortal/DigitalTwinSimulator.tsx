import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, Zap, Target } from 'lucide-react';

interface DigitalTwinSimulatorProps {
  currentScore: number;
  onSimulate: (skills: string[]) => void;
}

export const DigitalTwinSimulator: React.FC<DigitalTwinSimulatorProps> = ({
  currentScore,
  onSimulate,
}) => {
  const availableSimSkills = [
    { name: 'Apache Kafka', category: 'Backend Streaming', boost: 4 },
    { name: 'Kubernetes', category: 'DevOps & SRE', boost: 4.5 },
    { name: 'GraphQL', category: 'API Architecture', boost: 2 },
    { name: 'System Design', category: 'Concurrency & Scaling', boost: 3.5 },
    { name: 'PyTorch', category: 'Deep Learning', boost: 3 },
  ];

  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Apache Kafka', 'Kubernetes']);
  const [simulatedData, setSimulatedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (name: string) => {
    setSelectedSkills(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/digital-twin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSkills: selectedSkills }),
      });
      const data = await res.json();
      setSimulatedData(data);
      onSimulate(selectedSkills);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-300">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white">AI Career Digital Twin Simulator</h3>
          </div>
          <p className="text-xs text-indigo-200/80 mt-1">
            Simulate "What-If" career trajectory scenarios: model how acquiring specific skills impacts readiness & qualification.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading || selectedSkills.length === 0}
          className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Trajectory</span>
            </>
          )}
        </button>
      </div>

      {/* Selectable Skill Chips */}
      <div className="py-4">
        <label className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block mb-2.5">
          Select Target Capabilities to Model Learning:
        </label>
        <div className="flex flex-wrap gap-2">
          {availableSimSkills.map(s => {
            const isSelected = selectedSkills.includes(s.name);
            return (
              <button
                key={s.name}
                onClick={() => toggleSkill(s.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-indigo-600/80 border-indigo-400 text-white shadow-xs'
                    : 'bg-white/5 border-white/10 text-indigo-200 hover:bg-white/10'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[10px] text-indigo-300/80">+{s.boost} pts</span>
                {isSelected && <Check className="w-3 h-3 text-cyan-300 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulation Result Preview */}
      {simulatedData && (
        <div className="mt-2 p-4 rounded-xl bg-white/5 border border-white/10 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-[11px] text-indigo-300 font-medium block">Current Readiness</span>
                <span className="text-xl font-bold text-white">{simulatedData.currentScore}/100</span>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[11px] text-cyan-300 font-medium block">Projected Readiness</span>
                <span className="text-2xl font-black text-cyan-300">{simulatedData.simulatedScore}/100</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">
                +{simulatedData.boost} Points Lift
              </span>
              <span className="text-[11px] text-indigo-200 block mt-1">
                Cohort Percentile: {simulatedData.simulatedPercentile}th
              </span>
            </div>
          </div>

          <p className="text-xs text-indigo-200/90 mt-3 pt-3 border-t border-white/10">
            {simulatedData.impactAnalysis}
          </p>
        </div>
      )}
    </div>
  );
};
