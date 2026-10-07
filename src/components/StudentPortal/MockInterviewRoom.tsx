import React, { useState } from 'react';
import { StudentProfile, MockInterviewQuestion, InterviewEvaluation } from '../../types/index.ts';
import {
  Mic,
  Volume2,
  Sparkles,
  Send,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface MockInterviewRoomProps {
  profile: StudentProfile;
}

export const MockInterviewRoom: React.FC<MockInterviewRoomProps> = ({ profile }) => {
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [questionType, setQuestionType] = useState('technical');
  const [questions, setQuestions] = useState<MockInterviewQuestion[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Load questions
  const handleStartInterview = async () => {
    setLoadingQuestions(true);
    setEvaluation(null);
    setUserAnswer('');
    try {
      const res = await fetch('/api/student/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, questionType }),
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setActiveQuestionIdx(0);
    } catch (err) {
      console.error('Failed to start interview:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return;
    setEvaluating(true);
    try {
      const currentQ = questions[activeQuestionIdx];
      const res = await fetch('/api/student/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          expectedConcepts: currentQ.expectedKeyConcepts,
          studentAnswer: userAnswer,
          targetRole,
        }),
      });
      const data = await res.json();
      setEvaluation(data);
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const playQuestionAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentQ = questions[activeQuestionIdx];

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                AI Mock Interview & Answer Intelligence
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time simulated technical screens with multi-rubric evaluation powered by Gemini.
            </p>
          </div>

          <button
            onClick={handleStartInterview}
            disabled={loadingQuestions}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors disabled:opacity-50"
          >
            {loadingQuestions ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Tailored Questions...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start New Mock Session</span>
              </>
            )}
          </button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Interview Role
            </label>
            <select
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="AI/ML Platform Engineer">AI/ML Platform Engineer</option>
              <option value="Backend Systems Engineer">Backend Systems Engineer</option>
              <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Question Domain Focus
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setQuestionType('technical')}
                className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                  questionType === 'technical'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Technical
              </button>
              <button
                type="button"
                onClick={() => setQuestionType('system_design')}
                className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                  questionType === 'system_design'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                System Design
              </button>
              <button
                type="button"
                onClick={() => setQuestionType('behavioral')}
                className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                  questionType === 'behavioral'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Behavioral
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Question & Answer Terminal */}
      {currentQ ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Question Box */}
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                  Question {activeQuestionIdx + 1} of {questions.length}
                </span>
                <span className="text-xs text-indigo-700 font-semibold">{currentQ.category}</span>
              </div>

              <button
                onClick={() => playQuestionAudio(currentQ.question)}
                title="Listen to question"
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition-colors shadow-2xs"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Read Out Loud</span>
              </button>
            </div>

            <p className="text-sm font-bold text-slate-900 leading-relaxed">
              "{currentQ.question}"
            </p>

            <div className="text-[11px] text-indigo-800/80 pt-2 border-t border-indigo-200/50 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold">Key Concepts Being Tested:</span>
              {currentQ.expectedKeyConcepts?.map((c, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-white text-indigo-900 font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Answer Input Area */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Your Spoken or Written Response:
              </label>
              <button
                type="button"
                onClick={() =>
                  setUserAnswer(
                    'To prevent double payment charging, we issue an Idempotency-Key from the client. The backend uses a Redis SET key NX lock to acquire a 30s exclusive execution window. Inside a PostgreSQL atomic transaction, we insert into idempotent_requests with a UNIQUE constraint, mutate account balances, record the receipt, and commit. Finally, we cache the success response so duplicate retries return immediately without executing state changes.'
                  )
                }
                className="text-[11px] text-indigo-600 font-semibold hover:underline"
              >
                Insert Sample Answer
              </button>
            </div>

            <textarea
              rows={6}
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Structure your answer clearly: state architectural mechanism, failure edge cases, and concrete technologies..."
              className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveQuestionIdx(idx);
                    setEvaluation(null);
                    setUserAnswer('');
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    activeQuestionIdx === idx
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleEvaluate}
              disabled={evaluating || !userAnswer.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center space-x-2 shadow-xs transition-colors disabled:opacity-50"
            >
              {evaluating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating 5-Dimension Rubric...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit Answer for AI Evaluation</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time 5-Dimension Evaluation Results */}
          {evaluation && (
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-6 animate-in fade-in duration-300">
              {/* Overall Score Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                    {evaluation.score}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Comprehensive Answer Score</h4>
                    <span className="text-xs text-slate-500">Benchmark: 80+ qualifies for onsite rounds</span>
                  </div>
                </div>

                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                  Strong Candidate Candidate Performance
                </div>
              </div>

              {/* 4 Rubric Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-600 block">Technical Correctness</span>
                  <div className="text-base font-bold text-indigo-600 mt-0.5">{evaluation.technicalCorrectness}%</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${evaluation.technicalCorrectness}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-600 block">Completeness</span>
                  <div className="text-base font-bold text-cyan-600 mt-0.5">{evaluation.completeness}%</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-cyan-600 h-full rounded-full" style={{ width: `${evaluation.completeness}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-600 block">Communication</span>
                  <div className="text-base font-bold text-emerald-600 mt-0.5">{evaluation.communication}%</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${evaluation.communication}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-600 block">Clarity</span>
                  <div className="text-base font-bold text-violet-600 mt-0.5">{evaluation.clarity}%</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-violet-600 h-full rounded-full" style={{ width: `${evaluation.clarity}%` }} />
                  </div>
                </div>
              </div>

              {/* Missing Concepts & Actionable Coaching */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-2">
                    Missing Nuances / Concepts
                  </span>
                  <ul className="space-y-1.5">
                    {evaluation.missingConcepts?.map((c, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-2">
                    Actionable Interviewer Coaching
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {evaluation.actionableFeedback}
                  </p>
                </div>
              </div>

              {/* Gold-Standard Exemplary Answer */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  100/100 Gold-Standard Model Answer
                </span>
                <p className="text-xs text-emerald-950 leading-relaxed mt-1">
                  "{evaluation.exemplaryAnswer}"
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Active Interview Session</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Select your target role and click "Start New Mock Session" to begin answering tailored technical questions.
          </p>
          <button
            onClick={handleStartInterview}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs inline-flex items-center space-x-2 shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Generate Interview Questions</span>
          </button>
        </div>
      )}
    </div>
  );
};
