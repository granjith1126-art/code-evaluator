import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Plus, 
  ArrowRight, 
  Trash2, 
  Clock, 
  Layers, 
  Tag, 
  X,
  CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api';
import { Problem, Difficulty } from '../types';

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
    api.getProblems({ search: search || undefined, difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined })
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProblems();
  };

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
      // Reset form
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
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      case 'medium':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      case 'hard':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            Problem Library
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Standard algorithmic challenges with public examples and isolated hidden evaluation suites.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Problem</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search problems by title, keywords, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {['all', 'easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                difficultyFilter === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : problems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div
              key={p.id}
              className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-sm group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize border ${getDifficultyBadge(p.difficulty)}`}>
                    {p.difficulty}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{p.time_limit_seconds}s limit</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {p.title}
                </h3>

                <p className="text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                  {p.description}
                </p>

                {p.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {p.tags.split(',').map((t, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-700/40 px-2 py-0.5 rounded border border-slate-600/40"
                      >
                        <Tag className="w-2.5 h-2.5 text-indigo-400" />
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-700/60">
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-700/40 transition-colors"
                  title="Delete problem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link
                  to={`/workspace?problem=${p.slug}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all"
                >
                  <span>Solve Problem</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-800/30 border border-slate-800 rounded-2xl">
          <Layers className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No problems found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or create a new problem.</p>
        </div>
      )}

      {/* Modal: Create Problem */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Create New Coding Problem</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProblem} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Reverse Linked List"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as Difficulty)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Problem Description</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe problem requirements, input/output specifications, and constraints..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Function Name (Optional)</label>
                  <input
                    type="text"
                    value={newFunctionName}
                    onChange={(e) => setNewFunctionName(e.target.value)}
                    placeholder="e.g. solve"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. String, Recursion"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Starter Code Template</label>
                <textarea
                  rows={3}
                  value={newStarterCode}
                  onChange={(e) => setNewStarterCode(e.target.value)}
                  placeholder="def solve(x):&#10;    # Write solution here&#10;    pass"
                  className="w-full font-mono text-xs bg-slate-800 border border-slate-700 rounded-lg p-3 text-emerald-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Test Cases Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400">Test Cases (Public & Hidden)</label>
                  <button
                    type="button"
                    onClick={() => setTestCases([...testCases, { input_data: '', expected_output: '', is_hidden: true, explanation: '' }])}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    + Add Test Case
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {testCases.map((tc, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <input
                        type="text"
                        placeholder="Input (e.g. [1, 2])"
                        value={tc.input_data}
                        onChange={(e) => {
                          const copy = [...testCases];
                          copy[idx].input_data = e.target.value;
                          setTestCases(copy);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
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
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                      <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
                >
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
