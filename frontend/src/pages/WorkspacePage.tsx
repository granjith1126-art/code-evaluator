import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Cpu, 
  Terminal, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';
import { Problem, Submission } from '../types';
import { useTheme } from '../context/ThemeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';

export const WorkspacePage: React.FC = () => {
  const { monacoTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const slugParam = searchParams.get('problem');

  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'stdout'>('tests');
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load all problems
  useEffect(() => {
    api.getProblems({ page_size: 100 })
      .then((res) => {
        setProblems(res.items);
        if (res.items.length > 0) {
          const matched = slugParam ? res.items.find(p => p.slug === slugParam) : res.items[0];
          const initialProblem = matched || res.items[0];
          loadProblemDetails(initialProblem.slug);
        }
      })
      .catch((err) => setErrorMsg(err.message));
  }, []);

  const loadProblemDetails = async (slug: string) => {
    try {
      const fullProblem = await api.getProblem(slug);
      setSelectedProblem(fullProblem);
      setCode(fullProblem.starter_code || 'def solution():\n    pass\n');
      setLastSubmission(null);
      setSearchParams({ problem: slug });
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRunCode = async (runOnlyPublic: boolean) => {
    if (!selectedProblem || isRunning) return;
    setIsRunning(true);
    setErrorMsg(null);

    try {
      const res = await api.createSubmission({
        problem_id: selectedProblem.id,
        code: code,
        language: 'python',
        run_only_public: runOnlyPublic
      });
      setLastSubmission(res);
      setActiveTab('tests');
      setActiveTestCaseIndex(0);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetCode = () => {
    if (selectedProblem && confirm('Reset code editor to starter template?')) {
      setCode(selectedProblem.starter_code || '');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden animate-fade-in">
      {/* Top Action Bar */}
      <div className="h-14 glass-panel border-b border-[var(--border-glass)] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <select
              value={selectedProblem?.slug || ''}
              onChange={(e) => loadProblemDetails(e.target.value)}
              className="bg-slate-100/80 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {problems.map((p) => (
                <option key={p.id} value={p.slug} className="bg-slate-900 text-white">
                  {p.title} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>

          {selectedProblem && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
              selectedProblem.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
              selectedProblem.difficulty === 'medium' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' :
              'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
            }`}>
              {selectedProblem.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetCode}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            title="Reset code template"
            aria-label="Reset code template"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleRunCode(true)}
            disabled={isRunning}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-[var(--border-glass)] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Run Tests</span>
          </button>

          <button
            onClick={() => handleRunCode(false)}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isRunning ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Submit Solution</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Problem Statement, Right Editor & Terminal */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: Problem Details (5 Cols) */}
        <div className="lg:col-span-5 glass-panel border-r border-[var(--border-glass)] overflow-y-auto p-6 space-y-6">
          {selectedProblem ? (
            <>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {selectedProblem.title}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Time Limit: {selectedProblem.time_limit_seconds}s</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Memory: {selectedProblem.memory_limit_mb}MB</span>
                  </div>
                </div>
              </div>

              <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {selectedProblem.description}
              </div>

              {selectedProblem.function_signature && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Target Signature
                  </h4>
                  <pre className="p-3 bg-slate-900/90 text-cyan-300 border border-[var(--border-glass)] rounded-xl font-mono text-xs overflow-x-auto">
                    {selectedProblem.function_signature}
                  </pre>
                </div>
              )}

              {/* Public Examples */}
              {selectedProblem.test_cases && selectedProblem.test_cases.filter(t => !t.is_hidden).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Public Examples
                  </h4>
                  {selectedProblem.test_cases.filter(t => !t.is_hidden).map((tc, idx) => (
                    <div key={idx} className="glass-panel p-3.5 rounded-xl text-xs space-y-1.5 border border-[var(--border-glass)]">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Example {idx + 1}</span>
                        {tc.explanation && <span className="italic">{tc.explanation}</span>}
                      </div>
                      <div className="font-mono text-slate-800 dark:text-slate-200">
                        <span className="text-slate-500">Input: </span>{tc.input_data}
                      </div>
                      <div className="font-mono text-slate-800 dark:text-slate-200">
                        <span className="text-slate-500">Output: </span>{tc.expected_output}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-500 text-sm">Select a problem to begin.</div>
          )}
        </div>

        {/* Right: Monaco Editor & Output Terminal (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
          {/* Top Half: Monaco Editor with Theme Synchronization */}
          <div className="h-[58%] border-b border-[var(--border-glass)] relative">
            <Editor
              height="100%"
              language="python"
              theme={monacoTheme}
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 }
              }}
            />
          </div>

          {/* Bottom Half: Execution Results & Output */}
          <div className="h-[42%] flex flex-col glass-panel overflow-hidden">
            {/* Terminal Tab Bar */}
            <div className="h-10 border-b border-[var(--border-glass)] px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'tests'
                      ? 'bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Test Results</span>
                  {lastSubmission && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                      {lastSubmission.tests_passed}/{lastSubmission.tests_total}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('stdout')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'stdout'
                      ? 'bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Console Logs</span>
                </button>
              </div>

              {lastSubmission && (
                <div className="flex items-center gap-3">
                  <StatusBadge status={lastSubmission.status} size="sm" />
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    Score: {lastSubmission.total_score}/100
                  </span>
                  <Link
                    to={`/submissions/${lastSubmission.id}`}
                    className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Full Analysis</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Terminal Content Body */}
            <div className="flex-1 p-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {lastSubmission ? (
                activeTab === 'tests' ? (
                  <div className="space-y-3">
                    {/* Test case tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {lastSubmission.test_results?.map((tr, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveTestCaseIndex(idx)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
                            activeTestCaseIndex === idx
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-[var(--border-glass)] shadow-sm'
                              : 'text-slate-500 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${tr.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>Case {idx + 1}</span>
                          {tr.is_hidden && <span className="text-[10px] text-slate-400">(hidden)</span>}
                        </button>
                      ))}
                    </div>

                    {/* Selected test details */}
                    {lastSubmission.test_results && lastSubmission.test_results[activeTestCaseIndex] && (
                      <div className="glass-panel p-3.5 rounded-xl space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>
                            Status: <strong className={lastSubmission.test_results[activeTestCaseIndex].passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {lastSubmission.test_results[activeTestCaseIndex].status}
                            </strong>
                          </span>
                          <span>{lastSubmission.test_results[activeTestCaseIndex].execution_time_ms} ms</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block mb-0.5">Expected Output:</span>
                          <div className="p-2 bg-slate-100/80 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-lg text-slate-900 dark:text-slate-200">
                            {lastSubmission.test_results[activeTestCaseIndex].expected_output}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-500 block mb-0.5">Actual Output:</span>
                          <div className={`p-2 bg-slate-100/80 dark:bg-slate-900/80 border rounded-lg ${
                            lastSubmission.test_results[activeTestCaseIndex].passed
                              ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                              : 'border-rose-500/30 text-rose-700 dark:text-rose-300'
                          }`}>
                            {lastSubmission.test_results[activeTestCaseIndex].actual_output || '<no output>'}
                          </div>
                        </div>

                        {lastSubmission.test_results[activeTestCaseIndex].error_message && (
                          <div>
                            <span className="text-rose-500 block mb-0.5">Error Diagnostics:</span>
                            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-700 dark:text-rose-300">
                              {lastSubmission.test_results[activeTestCaseIndex].error_message}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs">
                    {lastSubmission.stdout && (
                      <div>
                        <span className="text-slate-500 font-semibold block mb-1">Standard Output:</span>
                        <pre className="p-3 bg-slate-900/90 border border-[var(--border-glass)] rounded-xl text-slate-100 overflow-x-auto whitespace-pre-wrap">
                          {lastSubmission.stdout}
                        </pre>
                      </div>
                    )}
                    {lastSubmission.stderr && (
                      <div>
                        <span className="text-rose-500 font-semibold block mb-1">Standard Error:</span>
                        <pre className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 overflow-x-auto whitespace-pre-wrap">
                          {lastSubmission.stderr}
                        </pre>
                      </div>
                    )}
                    {!lastSubmission.stdout && !lastSubmission.stderr && (
                      <p className="text-slate-400 italic">No console output generated by this execution.</p>
                    )}
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Play className="w-8 h-8 mb-2 opacity-30 text-indigo-500" />
                  <span>Click "Run Tests" or "Submit Solution" to trigger deterministic sandbox execution.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
