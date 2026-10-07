import React, { useState } from 'react';
import { ATSAnalysisResult, StudentProfile } from '../../types/index.ts';
import {
  FileSearch,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  FileCheck,
} from 'lucide-react';

interface ATSScannerProps {
  profile: StudentProfile;
}

export const ATSScanner: React.FC<ATSScannerProps> = ({ profile }) => {
  const [jobDescription, setJobDescription] = useState(
    `Looking for a Full Stack Engineer proficient in TypeScript, React, Node.js, PostgreSQL, Docker, Kafka, and Kubernetes. Must have experience building scalable REST microservices and unit testing with Jest.`
  );
  const [resumeText, setResumeText] = useState(profile.resumeRawText || '');
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<ATSAnalysisResult | null>({
    atsScore: 84,
    formatHealthScore: 92,
    keywordMatchScore: 78,
    matchedKeywords: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'RESTful APIs', 'CI/CD'],
    missingKeywords: ['Kubernetes', 'Apache Kafka', 'Unit Testing (Jest/Vitest)', 'Agile/Scrum', 'Microservices'],
    weakBulletPoints: [
      {
        original: 'Built microservices in Node.js and TypeScript handling daily events.',
        critique: 'Missing concrete scale measurements and latency benchmarks.',
        suggestion:
          'Engineered high-throughput REST microservices in TypeScript, processing 1.2M daily events with sub-45ms p99 latency.',
      },
      {
        original: 'Worked on database queries and improved speed.',
        critique: 'Passive verb ("worked on") and unspecified optimization mechanism.',
        suggestion:
          'Optimized PostgreSQL query execution and instituted Redis multi-tier caching, reducing median response latency by 38%.',
      },
    ],
    formatCritique: [
      'Clean single-column layout correctly parsed by ATS crawlers.',
      'Clear standard section headers (Education, Experience, Projects, Skills).',
      'Recommend standardizing date formats to "MMM YYYY" throughout.',
    ],
    summaryStrengths: [
      'Strong quantifiable impact metrics in work experience and featured projects.',
      'High density of high-demand modern full-stack technologies.',
    ],
  });

  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/student/ats-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error('ATS scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileSearch className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Resume ATS Analyzer & Impact Optimizer
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Test your resume against target job descriptions, discover missing ATS keywords, and rewrite bullets using Google's XYZ formula.
            </p>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running ATS Engine...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Resume ATS Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Job Description / Requirements
            </label>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Paste job posting here..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Resume Text to Compare
            </label>
            <textarea
              rows={5}
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              placeholder="Paste resume text..."
            />
          </div>
        </div>
      </div>

      {/* Analysis Results View */}
      {analysis && (
        <div className="space-y-6">
          {/* Score Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall ATS Score</span>
                <div className="text-2xl font-black text-indigo-600 mt-1">{analysis.atsScore}/100</div>
                <span className="text-[11px] text-slate-500">Above 80 passes 95% of scanners</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-base">
                {analysis.atsScore}%
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Format Health Score</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{analysis.formatHealthScore}/100</div>
                <span className="text-[11px] text-slate-500">Single-column parse readability</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-base">
                {analysis.formatHealthScore}%
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keyword Density Match</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{analysis.keywordMatchScore}/100</div>
                <span className="text-[11px] text-slate-500">Coverage of core job keywords</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-black text-base">
                {analysis.keywordMatchScore}%
              </div>
            </div>
          </div>

          {/* Keywords breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Keywords */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Detected Matching Keywords ({analysis.matchedKeywords.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.matchedKeywords.map(k => (
                  <span
                    key={k}
                    className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-700 uppercase tracking-wider mb-3">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Missing ATS Keywords ({analysis.missingKeywords.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingKeywords.map(k => (
                  <span
                    key={k}
                    className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
                  >
                    + {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Bullet Point Optimizer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  AI Resume Optimizer (Google XYZ Impact Formula)
                </h3>
                <p className="text-xs text-slate-500">
                  Rewrites weak, passive bullet points into high-impact accomplishment statements without hallucinating credentials.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {analysis.weakBulletPoints.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Original Bullet Point:</span>
                    <p className="text-xs text-slate-600 line-through mt-0.5">{item.original}</p>
                    <span className="text-[11px] text-amber-700 font-medium block mt-1">
                      Critique: {item.critique}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        Optimized Recommendation (Accomplished [X] measured by [Y] via [Z]):
                      </span>
                      <button
                        onClick={() => copyToClipboard(item.suggestion, idx)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center space-x-1"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Bullet</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-medium text-emerald-950">{item.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
