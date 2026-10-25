import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  GitCompare, 
  Sparkles, 
  Trophy, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  ArrowRight,
  UserCheck,
  Scale
} from 'lucide-react';
import { api } from '../lib/api';
import { Problem, Submission, SolutionComparison } from '../types';

export const ComparisonStudioPage: React.FC = () => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <GitCompare className="w-7 h-7 text-indigo-400" />
          AI Solution Comparison Studio
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Perform rigorous pairwise evaluation between competing models, code variants, and algorithmic approaches.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Problem</label>
            <select
              value={selectedProblemId || ''}
              onChange={(e) => setSelectedProblemId(parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
            >
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Solution A (Candidate 1)</label>
            <select
              value={subAId || ''}
              onChange={(e) => setSubAId(parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
            >
              {submissions.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} - {s.status} ({s.total_score} pts, {s.execution_time_ms}ms)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Solution B (Candidate 2)</label>
            <select
              value={subBId || ''}
              onChange={(e) => setSubBId(parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
            >
              {submissions.map((s) => (
                <option key={s.id} value={s.id}>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {comparing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Scale className="w-4 h-4" />
            )}
            <span>Execute Pairwise AI Comparison</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Code Viewers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Solution A Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Candidate A</span>
              <h3 className="text-sm font-bold text-white">Submission #{subAId}</h3>
            </div>
            {subA && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className={subA.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}>{subA.status}</span>
                <span className="text-slate-400">{subA.total_score} pts</span>
                <span className="text-slate-500">{subA.execution_time_ms} ms</span>
              </div>
            )}
          </div>

          <div className="h-72 border border-slate-800 rounded-xl overflow-hidden">
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
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
        </div>

        {/* Solution B Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Candidate B</span>
              <h3 className="text-sm font-bold text-white">Submission #{subBId}</h3>
            </div>
            {subB && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className={subB.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}>{subB.status}</span>
                <span className="text-slate-400">{subB.total_score} pts</span>
                <span className="text-slate-500">{subB.execution_time_ms} ms</span>
              </div>
            )}
          </div>

          <div className="h-72 border border-slate-800 rounded-xl overflow-hidden">
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
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
        </div>
      </div>

      {/* Comparison Outcome */}
      {comparison && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Winner Banner */}
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">AI Evaluator Judgement</span>
                <h3 className="text-lg font-bold text-white">
                  Preferred Winner: <span className="text-amber-400 uppercase">Solution {comparison.preferred_solution}</span>
                </h3>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400 text-right">
              <div>Evaluated with: <strong className="text-white">{comparison.provider.toUpperCase()} ({comparison.model})</strong></div>
              <div>Confidence: <strong className="text-emerald-400">{Math.round(comparison.confidence * 100)}%</strong></div>
            </div>
          </div>

          {/* Detailed Criteria Comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-indigo-400 uppercase">Functional Correctness</span>
              <p className="text-slate-300 leading-relaxed">{comparison.functional_comparison}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-cyan-400 uppercase">Efficiency & Complexity</span>
              <p className="text-slate-300 leading-relaxed">{comparison.efficiency_comparison}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 uppercase">Readability & Style</span>
              <p className="text-slate-300 leading-relaxed">{comparison.readability_comparison}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 uppercase">Edge Case Handling</span>
              <p className="text-slate-300 leading-relaxed">{comparison.edge_case_comparison}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Written Justification</h4>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed">
              {comparison.written_justification}
            </div>
          </div>

          {/* Human Override Section */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Human Override & Audit Verification</h3>
            </div>
            <p className="text-xs text-slate-400">
              Senior human evaluators can override the automated preference label. An explicit, documented rationale is required.
            </p>

            {comparison.human_override_preferred ? (
              <div className="p-4 bg-indigo-950/40 border border-indigo-800 rounded-xl text-xs space-y-1">
                <span className="font-bold text-indigo-300">
                  Override Active: Human Selected Solution {comparison.human_override_preferred}
                </span>
                <p className="text-slate-300"><strong>Reason: </strong>{comparison.human_override_reason}</p>
              </div>
            ) : null}

            <form onSubmit={handleSaveOverride} className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-300 font-semibold">Human Selection:</span>
                {(['A', 'B', 'tie'] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="submit"
                disabled={submittingOverride || !overrideReason.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50"
              >
                {submittingOverride ? 'Saving...' : 'Apply Human Override'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
