import React, { useEffect, useState } from 'react';
import { 
  Database, 
  Download, 
  Plus, 
  FileJson, 
  Layers, 
  Eye, 
  X
} from 'lucide-react';
import { api } from '../lib/api';
import { Dataset } from '../types';
import { GlassPanel } from '../components/common/GlassPanel';
import { SkeletonTable } from '../components/common/LoadingSkeleton';

export const DatasetPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<{ id: number; data: any } | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [minScore, setMinScore] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [creating, setCreating] = useState(false);

  const loadDatasets = () => {
    setLoading(true);
    api.getDatasets()
      .then((res) => {
        setDatasets(res.items);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const filters: any = {};
      if (minScore) filters.min_score = parseFloat(minScore);
      if (statusFilter) filters.status = statusFilter;

      await api.createDataset({
        name,
        description,
        version,
        filters
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setMinScore('');
      setStatusFilter('');
      loadDatasets();
    } catch (err: any) {
      alert(`Dataset creation failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handlePreview = async (id: number) => {
    try {
      const preview = await api.previewDataset(id);
      setSelectedPreview({ id, data: preview });
    } catch (err: any) {
      alert(`Preview failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-7 h-7 text-indigo-500" />
            Dataset Management & AI Training Export
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Export structured, schema-validated training corpora with full cryptographic provenance and human annotation labels.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Dataset</span>
        </button>
      </div>

      {/* Datasets Table */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Generated Datasets ({datasets.length})
          </h3>
          <span className="text-xs font-mono text-slate-500">JSON & JSONL Schemas v1.0.0</span>
        </div>

        {loading ? (
          <SkeletonTable rows={4} />
        ) : datasets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Dataset Name</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Records</th>
                  <th className="py-3 px-4">Filter Criteria</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60">
                {datasets.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-200/30 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{d.name}</div>
                      {d.description && <div className="text-xs text-slate-500 font-normal">{d.description}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      v{d.version}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      {d.record_count} items
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      {d.metadata_json && Object.keys(d.metadata_json).length > 0 ? (
                        JSON.stringify(d.metadata_json)
                      ) : (
                        <span className="text-slate-400">All submissions</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handlePreview(d.id)}
                        className="px-2.5 py-1.5 rounded-lg glass-panel hover:border-indigo-500/40 text-slate-700 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Preview</span>
                      </button>

                      <a
                        href={api.getDatasetExportUrl(d.id, 'jsonl')}
                        download
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/15 dark:bg-indigo-500/20 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>JSONL</span>
                      </a>

                      <a
                        href={api.getDatasetExportUrl(d.id, 'json')}
                        download
                        className="px-2.5 py-1.5 rounded-lg glass-panel hover:border-cyan-500/40 text-slate-700 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileJson className="w-3.5 h-3.5 text-cyan-500" />
                        <span>JSON</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No datasets generated yet.</p>
            <p className="text-xs mt-1">Click "Generate Dataset" to snapshot evaluation records with cryptographic hashes.</p>
          </div>
        )}
      </GlassPanel>

      {/* Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <GlassPanel elevated className="max-w-4xl w-full p-6 space-y-4 my-8 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Dataset Record Schema & Sample Preview</h3>
              </div>
              <button 
                onClick={() => setSelectedPreview(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Standard Export Schema Fields:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPreview.data.schema_fields.map((field: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md glass-panel text-indigo-700 dark:text-indigo-300 font-mono text-[11px] border border-indigo-500/20">
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">Sample Record (with SHA-256 Provenance):</span>
                <pre className="p-4 bg-slate-900/90 text-emerald-400 border border-[var(--border-glass)] rounded-xl font-mono text-xs overflow-x-auto">
                  {JSON.stringify(selectedPreview.data.sample_records[0] || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-glass)] flex justify-end">
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-4 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Create Dataset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <GlassPanel elevated className="max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Generate Structured Dataset</h3>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDataset} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Dataset Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Python Algorithm Evaluation Benchmark v1"
                  className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Version</label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Min Total Score Filter</label>
                  <input
                    type="number"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Submission Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-white">All Statuses (Accepted, Failed, etc.)</option>
                  <option value="Accepted" className="bg-slate-900 text-white">Accepted Only (Gold Standards)</option>
                  <option value="Wrong Answer" className="bg-slate-900 text-white">Wrong Answer Only (Negative Examples)</option>
                  <option value="Runtime Error" className="bg-slate-900 text-white">Runtime Errors (Exception Diagnostics)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Dataset objective, source problem categories, or intended model training usage..."
                  className="w-full bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] rounded-xl p-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-glass)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  {creating ? 'Generating...' : 'Snapshot & Export'}
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
};
