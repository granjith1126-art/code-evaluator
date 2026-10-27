import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  ArrowRight, 
  Trash2, 
  Clock, 
  Layers, 
  Tag, 
  X
} from 'lucide-react';
import { api } from '../lib/api';
import { Problem, Difficulty } from '../types';
import { GlassPanel } from '../components/common/GlassPanel';
import { GlassCard } from '../components/common/GlassCard';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { SkeletonCard } from '../components/common/LoadingSkeleton';

export const ProblemLibraryPage: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for creating problem
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>('easy');
  const [newDesc, setNewDesc] = useState('');
  const [newFunctionName, setNewFunctionName] = useState('');
  const [newSignature, setNewSignature] = useState('');
  const [newStarterCode, setNewStarterCode] = useState('');
  const [newTags, setNewTags] = useState('');
  const [testCases, setTestCases] = useState<Array<{ input_data: string; expected_output: string; is_hidden: boolean; explanation: string }>>([
    { input_data: '[1, 2]', expected_output: '3', is_hidden: false, explanation: 'Basic example' },
    { input_data: '[0, 0]', expected_output: '0', is_hidden: true, explanation: 'Hidden boundary test' }
  ]);

  const loadProblems = () => {
    setLoading(true);
    api.getProblems({ 
      search: search || undefined, 
      difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined 
    })
      .then((res) => {
        setProblems(res.items);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProblems();
  }, [difficultyFilter]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this problem?')) {
      try {
        await api.deleteProblem(id);
        loadProblems();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProblem({
        title: newTitle,
        slug: newSlug || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        difficulty: newDifficulty,
        description: newDesc,
        function_name: newFunctionName,
        function_signature: newSignature,
        starter_code: newStarterCode,
        tags: newTags,
        time_limit_seconds: 2.0,
        memory_limit_mb: 128,
        test_cases: testCases as any
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewSlug('');
      setNewDesc('');
      setNewFunctionName('');
      setNewSignature('');
      setNewStarterCode('');
      setNewTags('');
      loadProblems();
    } catch (err: any) {
      alert(`Creation failed: ${err.message}`);
    }
  };

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'hard':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-500" />
            Problem Library
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Standard algorithmic challenges with public examples and hardened hidden test suites.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Problem</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          // auto filter after small debounce or direct call
          setTimeout(loadProblems, 200);
        }}
        placeholder="Search problems by title, keywords, or tags..."
        filters={[
          {
            id: 'difficulty',
            label: 'Difficulty',
            value: difficultyFilter,
            onChange: (val) => setDifficultyFilter(val),
            options: [
              { label: 'All Difficulties', value: 'all' },
              { label: 'Easy', value: 'easy' },
              { label: 'Medium', value: 'medium' },
              { label: 'Hard', value: 'hard' },
            ]
          }
        ]}
      />

      {/* Problem Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : problems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((p) => (
            <GlassCard
              key={p.id}
              className="flex flex-col justify-between group transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${getDifficultyBadge(p.difficulty)}`}>
                    {p.difficulty}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{p.time_limit_seconds}s limit</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {p.title}
                </h3>

                <p className="text-slate-600 dark:text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                  {p.description}
                </p>

                {p.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {p.tags.split(',').map((t, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-[var(--border-glass)]"
                      >
                        <Tag className="w-2.5 h-2.5 text-indigo-500" />
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-200/50 dark:border-slate-800/60">
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete problem"
                  aria-label="Delete problem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link
                  to={`/workspace?problem=${p.slug}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>Solve Problem</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassPanel className="text-center py-20">
          <Layers className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No problems found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or create a new problem.</p>
        </GlassPanel>
      )}

      {/* Modal: Create Problem */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in">
          <GlassPanel elevated className="max-w-2xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Coding Problem</h2>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProblem} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Reverse Linked List"
                    className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as Difficulty)}
                    className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="easy" className="bg-slate-900 text-white">Easy</option>
                    <option value="medium" className="bg-slate-900 text-white">Medium</option>
                    <option value="hard" className="bg-slate-900 text-white">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Problem Description</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe problem requirements, input/output specifications, and constraints..."
                  className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Function Name (Optional)</label>
                  <input
                    type="text"
                    value={newFunctionName}
                    onChange={(e) => setNewFunctionName(e.target.value)}
                    placeholder="e.g. solve"
                    className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. String, Recursion"
                    className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Starter Code Template</label>
                <textarea
                  rows={3}
                  value={newStarterCode}
                  onChange={(e) => setNewStarterCode(e.target.value)}
                  placeholder="def solve(x):&#10;    # Write solution here&#10;    pass"
                  className="w-full font-mono text-xs bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl p-3 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Test Cases Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Test Cases (Public & Hidden)</label>
                  <button
                    type="button"
                    onClick={() => setTestCases([...testCases, { input_data: '', expected_output: '', is_hidden: true, explanation: '' }])}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    + Add Test Case
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {testCases.map((tc, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-200/50 dark:bg-slate-800/80 p-2 rounded-xl border border-[var(--border-glass)]">
                      <input
                        type="text"
                        placeholder="Input (e.g. [1, 2])"
                        value={tc.input_data}
                        onChange={(e) => {
                          const copy = [...testCases];
                          copy[idx].input_data = e.target.value;
                          setTestCases(copy);
                        }}
                        className="flex-1 bg-white/70 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Expected Output (e.g. 3)"
                        value={tc.expected_output}
                        onChange={(e) => {
                          const copy = [...testCases];
                          copy[idx].expected_output = e.target.value;
                          setTestCases(copy);
                        }}
                        className="flex-1 bg-white/70 dark:bg-slate-900/80 border border-[var(--border-glass)] rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tc.is_hidden}
                          onChange={(e) => {
                            const copy = [...testCases];
                            copy[idx].is_hidden = e.target.checked;
                            setTestCases(copy);
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span>Hidden</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-glass)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Save Problem
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
};
