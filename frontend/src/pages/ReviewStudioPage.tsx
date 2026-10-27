import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  CheckSquare, 
  Sparkles, 
  Save
} from 'lucide-react';
import { api } from '../lib/api';
import { Submission, Rubric, HumanReview, AIEvaluation } from '../types';
import { useTheme } from '../context/ThemeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { GlassCard } from '../components/common/GlassCard';

export const ReviewStudioPage: React.FC = () => {
  const { monacoTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const subIdParam = searchParams.get('submission_id');

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(subIdParam ? parseInt(subIdParam) : null);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubricId, setSelectedRubricId] = useState<number | null>(null);
  const [aiEval, setAiEval] = useState<AIEvaluation | null>(null);

  // Review form state
  const [correctness, setCorrectness] = useState(80);
  const [efficiency, setEfficiency] = useState(75);
  const [readability, setReadability] = useState(85);
  const [maintainability, setMaintainability] = useState(80);
  const [security, setSecurity] = useState(90);
  const [failureCategory, setFailureCategory] = useState('');
  const [rationale, setRationale] = useState('');
  const [ambiguityReported, setAmbiguityReported] = useState(false);
  const [existingReview, setExistingReview] = useState<HumanReview | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load rubrics
    api.getRubrics().then((r) => {
      setRubrics(r);
      if (r.length > 0) setSelectedRubricId(r[0].id);
    });

    // Load recent submissions for review queue
    api.getSubmissions({ page_size: 50 }).then((res) => {
      setSubmissions(res.items);
      if (!selectedSubId && res.items.length > 0) {
        setSelectedSubId(res.items[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedSubId) {
      api.getSubmission(selectedSubId).then((sub) => {
        setCurrentSubmission(sub);
      });

      api.getReviews(selectedSubId).then((res) => {
        if (res.items && res.items.length > 0) {
          const rev = res.items[0];
          setExistingReview(rev);
          setCorrectness(rev.correctness_score);
          setEfficiency(rev.efficiency_score);
          setReadability(rev.readability_score);
          setMaintainability(rev.maintainability_score);
          setSecurity(rev.security_score);
          setFailureCategory(rev.failure_category || '');
          setRationale(rev.rationale);
          setAmbiguityReported(rev.ambiguity_reported);
        } else {
          setExistingReview(null);
          setRationale('');
          setChangeReason('');
        }
      });

      api.getAIEvaluation(selectedSubId)
        .then(setAiEval)
        .catch(() => setAiEval(null));
    }
  }, [selectedSubId]);

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId || saving || !rationale.trim()) return;
    setSaving(true);

    try {
      if (existingReview) {
        if (!changeReason.trim()) {
          alert('Please provide a reason for modifying an existing review.');
          setSaving(false);
          return;
        }
        const updated = await api.updateReview(existingReview.id, {
          correctness_score: correctness,
          efficiency_score: efficiency,
          readability_score: readability,
          maintainability_score: maintainability,
          security_score: security,
          failure_category: failureCategory,
          rationale: rationale,
          ambiguity_reported: ambiguityReported,
          change_reason: changeReason
        });
        setExistingReview(updated);
        setChangeReason('');
        alert('Review updated and revision history recorded!');
      } else {
        const created = await api.createReview({
          submission_id: selectedSubId,
          rubric_id: selectedRubricId || undefined,
          correctness_score: correctness,
          efficiency_score: efficiency,
          readability_score: readability,
          maintainability_score: maintainability,
          security_score: security,
          failure_category: failureCategory || undefined,
          rationale: rationale,
          ambiguity_reported: ambiguityReported
        });
        setExistingReview(created);
        alert('Human review saved successfully!');
      }
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const disagreementDelta = (aiEval && existingReview) ? Math.abs(existingReview.correctness_score - aiEval.correctness_score) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-7 h-7 text-indigo-500" />
          Annotation & Review Studio
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Review candidate code, grade against standardized rubrics, label failure causes, and track human-AI alignment.
        </p>
      </div>

      {/* Select Submission Bar */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Review Queue:</span>
          <select
            value={selectedSubId || ''}
            onChange={(e) => setSelectedSubId(parseInt(e.target.value))}
            className="bg-slate-100/80 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-xl px-3 py-1.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            {submissions.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                Submission #{s.id} - {s.status} ({s.total_score} pts)
              </option>
            ))}
          </select>
        </div>

        {existingReview ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            Reviewed by Human
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            Pending Review
          </span>
        )}
      </GlassPanel>

      {/* Main Split: Left Code & Evidence, Right Rubric Scoring Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Code & Execution Evidence (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <GlassPanel className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Candidate Solution #{selectedSubId}</span>
              {currentSubmission && (
                <span className="text-xs font-mono text-slate-500">
                  Pass Rate: {currentSubmission.pass_rate}% ({currentSubmission.tests_passed}/{currentSubmission.tests_total})
                </span>
              )}
            </h3>

            <div className="h-80 border border-[var(--border-glass)] rounded-xl overflow-hidden">
              <Editor
                height="100%"
                language="python"
                theme={monacoTheme}
                value={currentSubmission?.code || '# Loading submission code...'}
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

          {/* AI vs Human Disagreement Card */}
          {aiEval && (
            <GlassPanel className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  AI Model Assessment ({aiEval.provider.toUpperCase()} {aiEval.model})
                </h4>
                {disagreementDelta !== null && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    disagreementDelta > 15 ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  }`}>
                    Disagreement Delta: {Math.round(disagreementDelta)} pts
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed glass-panel p-3 rounded-xl border border-[var(--border-glass)]">
                {aiEval.overall_assessment}
              </p>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <GlassCard className="p-2">
                  <span className="text-[10px] text-slate-500 block">AI Correct</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{aiEval.correctness_score}</span>
                </GlassCard>
                <GlassCard className="p-2">
                  <span className="text-[10px] text-slate-500 block">AI Effic.</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{aiEval.efficiency_score}</span>
                </GlassCard>
                <GlassCard className="p-2">
                  <span className="text-[10px] text-slate-500 block">AI Read.</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{aiEval.readability_score}</span>
                </GlassCard>
                <GlassCard className="p-2">
                  <span className="text-[10px] text-slate-500 block">AI Sec.</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{aiEval.security_score}</span>
                </GlassCard>
              </div>
            </GlassPanel>
          )}
        </div>

        {/* Right: Rubric Scoring Form (6 Cols) */}
        <GlassPanel elevated className="lg:col-span-6 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Review Rubric Scoring</h3>
            {rubrics.length > 0 && (
              <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/30">
                {rubrics[0].name} (v{rubrics[0].version})
              </span>
            )}
          </div>

          <form onSubmit={handleSaveReview} className="space-y-5 text-sm">
            {/* 5 Scoring Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Functional Correctness (35% weight)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{correctness}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={correctness}
                  onChange={(e) => setCorrectness(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Time & Space Efficiency (20% weight)</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{efficiency}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={efficiency}
                  onChange={(e) => setEfficiency(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Code Readability & Style (20% weight)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{readability}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={readability}
                  onChange={(e) => setReadability(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Maintainability & Modularity (15% weight)</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{maintainability}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={maintainability}
                  onChange={(e) => setMaintainability(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Security Safeguards (10% weight)</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{security}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={security}
                  onChange={(e) => setSecurity(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>

            {/* Failure Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Failure Category Label
              </label>
              <select
                value={failureCategory}
                onChange={(e) => setFailureCategory(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">None / Clean Solution</option>
                <option value="Off-by-one" className="bg-slate-900 text-white">Off-by-one Error</option>
                <option value="Boundary Condition Missed" className="bg-slate-900 text-white">Boundary Condition Missed</option>
                <option value="Time Limit Exceeded" className="bg-slate-900 text-white">Time Limit Exceeded (Inefficient Complexity)</option>
                <option value="Memory Limit Exceeded" className="bg-slate-900 text-white">Memory Limit Exceeded</option>
                <option value="Null / None Pointer Error" className="bg-slate-900 text-white">Null / None Pointer Exception</option>
                <option value="Incorrect Problem Interpretation" className="bg-slate-900 text-white">Incorrect Problem Interpretation</option>
              </select>
            </div>

            {/* Written Rationale */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Human-Authored Rationale (Preserved Provenance)
              </label>
              <textarea
                required
                rows={3}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Explain the technical evidence behind your evaluation..."
                className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Ambiguity Flag */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ambiguity"
                checked={ambiguityReported}
                onChange={(e) => setAmbiguityReported(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="ambiguity" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Flag problem or test suite as ambiguous / underspecified
              </label>
            </div>

            {/* If Updating Existing Review: Change Reason */}
            {existingReview && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-amber-700 dark:text-amber-300">
                  Revision Reason (Required for Audit Trail)
                </label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Adjusted efficiency score after inspecting memory allocations..."
                  className="w-full bg-slate-100/80 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{existingReview ? 'Update Human Review with Revision History' : 'Save Completed Review'}</span>
            </button>
          </form>
        </GlassPanel>
      </div>
    </div>
  );
};
