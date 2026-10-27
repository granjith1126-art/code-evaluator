import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Sparkles, 
  ArrowLeft, 
  AlertTriangle, 
  Lightbulb, 
  Bug, 
  Code
} from 'lucide-react';
import { api } from '../lib/api';
import { Submission, AIEvaluation } from '../types';
import { useTheme } from '../context/ThemeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { GlassCard } from '../components/common/GlassCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const SubmissionDetailPage: React.FC = () => {
  const { monacoTheme } = useTheme();
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
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (errorMsg || !submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fade-in">
        <GlassPanel className="p-8">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Submission Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{errorMsg}</p>
          <Link to="/workspace" className="mt-4 inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workspace</span>
          </Link>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back and Title */}
      <div className="flex items-center justify-between">
        <Link 
          to="/workspace" 
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>Submission ID: #{submission.id}</span>
          <span>•</span>
          <span>{new Date(submission.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Main Status & Score Banner */}
      <GlassPanel elevated className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3">
              <StatusBadge status={submission.status} size="lg" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {submission.status}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold glass-panel border border-[var(--border-glass)] text-slate-700 dark:text-slate-300">
                  {submission.language.toUpperCase()}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono glass-panel border border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
                  Sandbox: {submission.sandbox_mode}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Passed {submission.tests_passed} of {submission.tests_total} test cases ({submission.pass_rate}% success rate)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-slate-800 pt-4 md:pt-0 md:pl-8">
            <div>
              <span className="text-xs text-slate-500 block font-medium">Total Score</span>
              <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 font-mono">
                {submission.total_score}
              </span>
              <span className="text-slate-400 text-xs font-bold"> / 100</span>
            </div>

            <div>
              <span className="text-xs text-slate-500 block font-medium">Runtime</span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{submission.execution_time_ms}</span>
              <span className="text-slate-400 text-xs"> ms</span>
            </div>
          </div>
        </div>

        {/* 4-Pillar Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/80">
          <div className="glass-panel p-3.5 rounded-xl border border-[var(--border-glass)]">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
              <span className="font-medium">Functional Correctness</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{submission.functional_score}/60</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(submission.functional_score / 60) * 100}%` }}
              />
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-[var(--border-glass)]">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
              <span className="font-medium">Edge Cases</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{submission.edge_cases_score}/20</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(submission.edge_cases_score / 20) * 100}%` }}
              />
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-[var(--border-glass)]">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
              <span className="font-medium">Code Quality (AST)</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{submission.quality_score}/10</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(submission.quality_score / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-[var(--border-glass)]">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
              <span className="font-medium">Efficiency</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{submission.efficiency_score}/10</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(submission.efficiency_score / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Grid: Source Code & Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Source Code (7 cols) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" />
              Submitted Python Solution
            </h3>
            <span className="text-xs font-mono text-slate-500">{submission.code.split('\n').length} lines</span>
          </div>

          <div className="h-96 border border-[var(--border-glass)] rounded-xl overflow-hidden">
            <Editor
              height="100%"
              language="python"
              theme={monacoTheme}
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
        </GlassPanel>

        {/* Test Suite Outcomes (5 cols) */}
        <GlassPanel className="lg:col-span-5 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <StatusBadge status="ACCEPTED" size="sm" />
              <span>Test Suite Outcomes</span>
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {submission.test_results?.map((tr, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs font-mono transition-colors ${
                    tr.passed
                      ? 'glass-panel border-emerald-500/20 text-slate-800 dark:text-slate-200'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${tr.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      Test Case {idx + 1}
                      {tr.is_hidden && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-sans font-semibold ml-1">
                          (Hidden)
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500 text-[11px]">{tr.execution_time_ms} ms</span>
                  </div>

                  {!tr.is_hidden ? (
                    <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                      <div><span className="text-slate-400">Expected: </span>{tr.expected_output}</div>
                      <div><span className="text-slate-400">Actual: </span>{tr.actual_output}</div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      Hidden test input/output protected by evaluation security policy.
                    </div>
                  )}

                  {tr.error_message && (
                    <div className="mt-1.5 pt-1.5 border-t border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px]">
                      {tr.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800">
            <Link
              to={`/reviews?submission_id=${submission.id}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all cursor-pointer"
            >
              <span>Conduct Human Rubric Review</span>
            </Link>
          </div>
        </GlassPanel>
      </div>

      {/* AI Evaluation Section */}
      <GlassPanel className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Evaluation & Quality Analysis</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-dimensional structural feedback, bug identification, and algorithmic optimization
              </p>
            </div>
          </div>

          {/* AI Trigger Form */}
          <div className="flex items-center gap-2">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
              className="bg-slate-100/80 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="gemini" className="bg-slate-900 text-white">Google Gemini 3.8 Flash</option>
              <option value="openai" className="bg-slate-900 text-white">OpenAI GPT-4o</option>
              <option value="mock" className="bg-slate-900 text-white">Deterministic Test Double (Mock)</option>
            </select>

            <button
              onClick={handleTriggerAIEval}
              disabled={evaluatingAI}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
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
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 glass-panel p-3 rounded-xl border border-[var(--border-glass)]">
              <span>Provider: <strong className="text-slate-900 dark:text-white uppercase">{aiEvaluation.provider}</strong></span>
              <span>•</span>
              <span>Model: <strong className="text-slate-900 dark:text-white">{aiEvaluation.model}</strong></span>
              <span>•</span>
              <span>Confidence: <strong className="text-emerald-600 dark:text-emerald-400">{Math.round(aiEvaluation.confidence * 100)}%</strong></span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Executive Assessment
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 glass-panel p-4 rounded-xl border border-[var(--border-glass)] leading-relaxed">
                {aiEvaluation.overall_assessment}
              </p>
            </div>

            {/* AI Multi-Dimensional Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <GlassCard className="p-3 text-center">
                <span className="text-[11px] text-slate-500 block">Readability</span>
                <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{aiEvaluation.readability_score}</span>
                <span className="text-slate-400 text-xs">/100</span>
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <span className="text-[11px] text-slate-500 block">Maintainability</span>
                <span className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">{aiEvaluation.maintainability_score}</span>
                <span className="text-slate-400 text-xs">/100</span>
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <span className="text-[11px] text-slate-500 block">Security & Safety</span>
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{aiEvaluation.security_score}</span>
                <span className="text-slate-400 text-xs">/100</span>
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <span className="text-[11px] text-slate-500 block">Instruction Adherence</span>
                <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{aiEvaluation.instruction_following_score}</span>
                <span className="text-slate-400 text-xs">/100</span>
              </GlassCard>
            </div>

            {/* Bugs & Optimization Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bugs Identified */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5 text-rose-500" />
                  Identified Bugs & Anomalies
                </h4>
                {aiEvaluation.bugs_identified && aiEvaluation.bugs_identified.length > 0 ? (
                  <div className="space-y-2">
                    {aiEvaluation.bugs_identified.map((bug, bidx) => (
                      <div key={bidx} className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 font-semibold">
                          <span>{bug.title}</span>
                          <span className="capitalize text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 font-bold">{bug.severity}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">{bug.description}</p>
                        <div className="mt-1 pt-1 border-t border-rose-500/20 text-emerald-700 dark:text-emerald-400 text-[11px]">
                          <strong>Fix: </strong>{bug.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <GlassPanel className="p-4 text-slate-500 text-xs text-center">
                    No critical bugs or logic defects identified by AI analysis.
                  </GlassPanel>
                )}
              </div>

              {/* Optimization Suggestions */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Optimization Opportunities
                </h4>
                {aiEvaluation.optimization_suggestions && aiEvaluation.optimization_suggestions.length > 0 ? (
                  <div className="space-y-2">
                    {aiEvaluation.optimization_suggestions.map((opt, oidx) => (
                      <GlassPanel key={oidx} className="p-3 space-y-1 text-xs">
                        <div className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                          {opt.category.replace('_', ' ')}
                        </div>
                        <div className="text-slate-700 dark:text-slate-300">
                          <strong className="text-slate-500">Proposed: </strong>{opt.improved_state}
                        </div>
                        <div className="text-slate-500 italic text-[11px]">{opt.rationale}</div>
                      </GlassPanel>
                    ))}
                  </div>
                ) : (
                  <GlassPanel className="p-4 text-slate-500 text-xs text-center">
                    No performance optimizations necessary.
                  </GlassPanel>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
            <p>Click "Run AI Evaluation" to generate automated LLM review, defect diagnostics, and optimization reports.</p>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
