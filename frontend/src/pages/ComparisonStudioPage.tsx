import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  GitCompare, 
  Trophy, 
  UserCheck, 
  Scale
} from 'lucide-react';
import { api } from '../lib/api';
import { Problem, Submission, SolutionComparison } from '../types';
import { useTheme } from '../context/ThemeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { GlassCard } from '../components/common/GlassCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const ComparisonStudioPage: React.FC = () => {
  const { monacoTheme } = useTheme();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subAId, setSubAId] = useState<number | null>(null);
  const [subBId, setSubBId] = useState<number | null>(null);

  const [comparison, setComparison] = useState<SolutionComparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [overridePreferred, setOverridePreferred] = useState<'A' | 'B' | 'tie'>('A');
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  useEffect(() => {
    api.getProblems({ page_size: 50 }).then((res) => {
      setProblems(res.items);
      if (res.items.length > 0) {
        setSelectedProblemId(res.items[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedProblemId) {
      api.getSubmissions({ problem_id: selectedProblemId, page_size: 50 }).then((res) => {
        setSubmissions(res.items);
        if (res.items.length >= 2) {
          setSubAId(res.items[0].id);
          setSubBId(res.items[1].id);
        } else if (res.items.length === 1) {
          setSubAId(res.items[0].id);
          setSubBId(res.items[0].id);
        }
      });
    }
  }, [selectedProblemId]);

  const handleRunComparison = async () => {
    if (!selectedProblemId || !subAId || !subBId || comparing) return;
    setComparing(true);
    try {
      const res = await api.compareSolutions(selectedProblemId, subAId, subBId, 'gemini');
      setComparison(res);
      setOverridePreferred(res.preferred_solution);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setComparing(false);
    }
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comparison || !overrideReason.trim()) return;
    setSubmittingOverride(true);
    try {
      const res = await api.overrideComparison(comparison.id, overridePreferred, overrideReason);
      setComparison(res);
      alert('Human override saved successfully!');
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    } finally {
      setSubmittingOverride(false);
    }
  };

  const subA = submissions.find(s => s.id === subAId);
  const subB = submissions.find(s => s.id === subBId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <GitCompare className="w-7 h-7 text-indigo-500" />
          AI Solution Comparison Studio
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Perform rigorous pairwise evaluation between competing models, code variants, and algorithmic approaches.
        </p>
      </div>

      {/* Selectors Bar */}
      <GlassPanel className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Target Problem
            </label>
            <select
              value={selectedProblemId || ''}
              onChange={(e) => setSelectedProblemId(parseInt(e.target.value))}
              className="w-full bg-slate-100/80 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {problems.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.title} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Solution A (Candidate 1)
            </label>
            <select
              value={subAId || ''}
              onChange={(e) => setSubAId(parseInt(e.target.value))}
              className="w-full bg-slate-100/80 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {submissions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  #{s.id} - {s.status} ({s.total_score} pts, {s.execution_time_ms}ms)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Solution B (Candidate 2)
            </label>
            <select
              value={subBId || ''}
              onChange={(e) => setSubBId(parseInt(e.target.value))}
              className="w-full bg-slate-100/80 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {submissions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  #{s.id} - {s.status} ({s.total_score} pts, {s.execution_time_ms}ms)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            onClick={handleRunComparison}
            disabled={!subAId || !subBId || comparing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {comparing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Scale className="w-4 h-4" />
            )}
            <span>Execute Pairwise AI Comparison</span>
          </button>
        </div>
      </GlassPanel>

      {/* Side-by-Side Code Viewers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Solution A Box */}
        <GlassPanel className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Candidate A</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Submission #{subAId}</h3>
            </div>
            {subA && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <StatusBadge status={subA.status} size="sm" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{subA.total_score} pts</span>
                <span className="text-slate-400">{subA.execution_time_ms} ms</span>
              </div>
            )}
          </div>

          <div className="h-72 border border-[var(--border-glass)] rounded-xl overflow-hidden">
            <Editor
              height="100%"
              language="python"
              theme={monacoTheme}
              value={subA?.code || '# No solution selected'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false
              }}
            />
          </div>
        </GlassPanel>

        {/* Solution B Box */}
        <GlassPanel className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Candidate B</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Submission #{subBId}</h3>
            </div>
            {subB && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <StatusBadge status={subB.status} size="sm" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{subB.total_score} pts</span>
                <span className="text-slate-400">{subB.execution_time_ms} ms</span>
              </div>
            )}
          </div>

          <div className="h-72 border border-[var(--border-glass)] rounded-xl overflow-hidden">
            <Editor
              height="100%"
              language="python"
              theme={monacoTheme}
              value={subB?.code || '# No solution selected'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false
              }}
            />
          </div>
        </GlassPanel>
      </div>

      {/* Comparison Outcome */}
      {comparison && (
        <GlassPanel elevated className="p-6 space-y-6 shadow-xl animate-slide-up">
          {/* Winner Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-4 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-md shadow-amber-500/10">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">AI Evaluator Judgement</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Preferred Winner: <span className="text-amber-500 uppercase font-mono">Solution {comparison.preferred_solution}</span>
                </h3>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-500 text-left sm:text-right">
              <div>Evaluated with: <strong className="text-slate-900 dark:text-white">{comparison.provider.toUpperCase()} ({comparison.model})</strong></div>
              <div>Confidence: <strong className="text-emerald-600 dark:text-emerald-400">{Math.round(comparison.confidence * 100)}%</strong></div>
            </div>
          </div>

          {/* Detailed Criteria Comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <GlassCard className="p-4 space-y-1">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Functional Correctness</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{comparison.functional_comparison}</p>
            </GlassCard>
            <GlassCard className="p-4 space-y-1">
              <span className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Efficiency & Complexity</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{comparison.efficiency_comparison}</p>
            </GlassCard>
            <GlassCard className="p-4 space-y-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Readability & Style</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{comparison.readability_comparison}</p>
            </GlassCard>
            <GlassCard className="p-4 space-y-1">
              <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Edge Case Handling</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{comparison.edge_case_comparison}</p>
            </GlassCard>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Written Justification</h4>
            <div className="p-4 glass-panel rounded-xl text-sm text-slate-800 dark:text-slate-200 leading-relaxed border border-[var(--border-glass)]">
              {comparison.written_justification}
            </div>
          </div>

          {/* Human Override Section */}
          <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Human Override & Audit Verification</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Senior human evaluators can override the automated preference label. An explicit, documented rationale is required.
            </p>

            {comparison.human_override_preferred ? (
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs space-y-1">
                <span className="font-bold text-indigo-700 dark:text-indigo-300">
                  Override Active: Human Selected Solution {comparison.human_override_preferred}
                </span>
                <p className="text-slate-700 dark:text-slate-300"><strong>Reason: </strong>{comparison.human_override_reason}</p>
              </div>
            ) : null}

            <form onSubmit={handleSaveOverride} className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Human Selection:</span>
                {(['A', 'B', 'tie'] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="override"
                      value={opt}
                      checked={overridePreferred === opt}
                      onChange={() => setOverridePreferred(opt)}
                      className="text-indigo-600"
                    />
                    <span>Solution {opt}</span>
                  </label>
                ))}
              </div>

              <textarea
                required
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Document your technical justification for this override (minimum 10 characters)..."
                className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />

              <button
                type="submit"
                disabled={submittingOverride || !overrideReason.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {submittingOverride ? 'Saving...' : 'Apply Human Override'}
              </button>
            </form>
          </div>
        </GlassPanel>
      )}
    </div>
  );
};
