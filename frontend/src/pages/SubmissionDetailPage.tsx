import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  Layers, 
  ArrowLeft,
  AlertTriangle,
  Lightbulb,
  Bug,
  Zap,
  Code
} from 'lucide-react';
import { api } from '../lib/api';
import { Submission, AIEvaluation } from '../types';

export const SubmissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluatingAI, setEvaluatingAI] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'mock'>('gemini');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const sub = await api.getSubmission(parseInt(id));
      setSubmission(sub);
      try {
        const ai = await api.getAIEvaluation(parseInt(id));
        setAiEvaluation(ai);
      } catch {
        // AI evaluation might not exist yet
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleTriggerAIEval = async () => {
    if (!submission || evaluatingAI) return;
    setEvaluatingAI(true);
    try {
      const res = await api.evaluateWithAI(submission.id, selectedProvider);
      setAiEvaluation(res);
    } catch (err: any) {
      alert(`AI Evaluation failed: ${err.message}`);
    } finally {
      setEvaluatingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (errorMsg || !submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Submission Not Found</h2>
        <p className="text-slate-400 text-sm mt-1">{errorMsg}</p>
        <Link to="/workspace" className="mt-4 inline-flex items-center gap-2 text-indigo-400 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Workspace</span>
        </Link>
      </div>
    );
  }

  const isAccepted = submission.status === 'Accepted';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back and Title */}
      <div className="flex items-center justify-between">
        <Link to="/workspace" className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Submission ID: #{submission.id}</span>
          <span>•</span>
          <span>Timestamp: {new Date(submission.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Main Status & Score Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl ${
              isAccepted ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-400' : 'bg-rose-950/80 border border-rose-800/80 text-rose-400'
            }`}>
              {isAccepted ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{submission.status}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {submission.language.toUpperCase()}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Sandbox: {submission.sandbox_mode}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Passed {submission.tests_passed} of {submission.tests_total} test cases ({submission.pass_rate}% success rate)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Total Score</span>
              <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                {submission.total_score}
              </span>
              <span className="text-slate-500 text-xs font-bold"> / 100</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium">Runtime</span>
              <span className="text-2xl font-bold text-slate-200">{submission.execution_time_ms}</span>
              <span className="text-slate-500 text-xs"> ms</span>
            </div>
          </div>
        </div>

        {/* 4-Pillar Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Functional Correctness</span>
              <span className="font-bold text-white">{submission.functional_score}/60</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(submission.functional_score / 60) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Edge Cases</span>
              <span className="font-bold text-white">{submission.edge_cases_score}/20</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(submission.edge_cases_score / 20) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Code Quality (AST)</span>
              <span className="font-bold text-white">{submission.quality_score}/10</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(submission.quality_score / 10) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Efficiency</span>
              <span className="font-bold text-white">{submission.efficiency_score}/10</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(submission.efficiency_score / 10) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Source Code & Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Source Code (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-400" />
              Submitted Python Solution
            </h3>
            <span className="text-xs font-mono text-slate-500">{submission.code.split('\n').length} lines</span>
          </div>

          <div className="h-96 border border-slate-800 rounded-xl overflow-hidden">
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
              value={submission.code}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 }
              }}
            />
          </div>
        </div>

        {/* Test Suite Outcomes (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Test Suite Outcomes
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {submission.test_results?.map((tr, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs font-mono transition-colors ${
                    tr.passed
                      ? 'bg-slate-950 border-slate-800 text-slate-300'
                      : 'bg-rose-950/20 border-rose-900/60 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5">
                      {tr.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                      Test Case {idx + 1}
                      {tr.is_hidden && <span className="text-[10px] text-indigo-400 font-sans font-semibold ml-1">(Hidden)</span>}
                    </span>
                    <span className="text-slate-500 text-[11px]">{tr.execution_time_ms} ms</span>
                  </div>

                  {!tr.is_hidden ? (
                    <div className="space-y-1 text-slate-400 text-[11px]">
                      <div><span className="text-slate-600">Expected: </span>{tr.expected_output}</div>
                      <div><span className="text-slate-600">Actual: </span>{tr.actual_output}</div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      Hidden test input/output protected by evaluation security policy.
                    </div>
                  )}

                  {tr.error_message && (
                    <div className="mt-1.5 pt-1.5 border-t border-rose-900/40 text-rose-400 text-[11px]">
                      {tr.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <Link
              to={`/reviews?submission_id=${submission.id}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <span>Conduct Human Rubric Review</span>
            </Link>
          </div>
        </div>
      </div>

      {/* AI Evaluation Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Evaluation & Quality Analysis</h3>
              <p className="text-xs text-slate-400">Deep structural feedback, code smell identification, and algorithmic optimization</p>
            </div>
          </div>

          {/* AI Trigger Form */}
          <div className="flex items-center gap-2">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
            >
              <option value="gemini">Google Gemini 3.8 Flash</option>
              <option value="openai">OpenAI GPT-4o</option>
              <option value="mock">Deterministic Test Double (Mock)</option>
            </select>

            <button
              onClick={handleTriggerAIEval}
              disabled={evaluatingAI}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {evaluatingAI ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{aiEvaluation ? 'Re-Evaluate with AI' : 'Run AI Evaluation'}</span>
            </button>
          </div>
        </div>

        {aiEvaluation ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span>Provider: <strong className="text-white uppercase">{aiEvaluation.provider}</strong></span>
              <span>•</span>
              <span>Model: <strong className="text-white">{aiEvaluation.model}</strong></span>
              <span>•</span>
              <span>Confidence: <strong className="text-emerald-400">{Math.round(aiEvaluation.confidence * 100)}%</strong></span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Executive Assessment</h4>
              <p className="text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
                {aiEvaluation.overall_assessment}
              </p>
            </div>

            {/* AI Multi-Dimensional Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Readability</span>
                <span className="text-xl font-bold text-indigo-400">{aiEvaluation.readability_score}</span>
                <span className="text-slate-600 text-xs">/100</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Maintainability</span>
                <span className="text-xl font-bold text-cyan-400">{aiEvaluation.maintainability_score}</span>
                <span className="text-slate-600 text-xs">/100</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Security & Safety</span>
                <span className="text-xl font-bold text-emerald-400">{aiEvaluation.security_score}</span>
                <span className="text-slate-600 text-xs">/100</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Instruction Adherence</span>
                <span className="text-xl font-bold text-amber-400">{aiEvaluation.instruction_following_score}</span>
                <span className="text-slate-600 text-xs">/100</span>
              </div>
            </div>

            {/* Bugs & Optimization Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bugs Identified */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5 text-rose-400" />
                  Identified Bugs & Anomalies
                </h4>
                {aiEvaluation.bugs_identified && aiEvaluation.bugs_identified.length > 0 ? (
                  <div className="space-y-2">
                    {aiEvaluation.bugs_identified.map((bug, bidx) => (
                      <div key={bidx} className="bg-rose-950/20 border border-rose-900/60 p-3 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between text-rose-300 font-semibold">
                          <span>{bug.title}</span>
                          <span className="capitalize text-[10px] px-2 py-0.5 rounded bg-rose-900/50">{bug.severity}</span>
                        </div>
                        <p className="text-slate-400">{bug.description}</p>
                        <div className="mt-1 pt-1 border-t border-rose-900/40 text-emerald-300 text-[11px]">
                          <strong>Fix: </strong>{bug.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs text-center">
                    No critical bugs or logic defects identified by AI analysis.
                  </div>
                )}
              </div>

              {/* Optimization Suggestions */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Optimization Opportunities
                </h4>
                {aiEvaluation.optimization_suggestions && aiEvaluation.optimization_suggestions.length > 0 ? (
                  <div className="space-y-2">
                    {aiEvaluation.optimization_suggestions.map((opt, oidx) => (
                      <div key={oidx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 text-xs">
                        <div className="font-semibold text-indigo-300 capitalize">{opt.category.replace('_', ' ')}</div>
                        <div className="text-slate-400"><strong className="text-slate-500">Proposed: </strong>{opt.improved_state}</div>
                        <div className="text-slate-500 italic text-[11px]">{opt.rationale}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs text-center">
                    No performance optimizations necessary.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
            <p>Click "Run AI Evaluation" to generate automated LLM review, defect diagnostics, and optimization reports.</p>
          </div>
        )}
      </div>
    </div>
  );
};
