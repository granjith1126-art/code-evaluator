import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Clock, 
  Layers, 
  Cpu, 
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { api } from '../lib/api';
import { DashboardStats } from '../types';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboardStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading evaluation analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-white">Failed to load analytics</h2>
          <p className="text-red-300 text-sm mt-1">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Problems',
      value: stats.total_problems,
      icon: Layers,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-400'
    },
    {
      label: 'Total Submissions',
      value: stats.total_submissions,
      icon: BarChart3,
      color: 'from-indigo-500 to-purple-600',
      textColor: 'text-indigo-400'
    },
    {
      label: 'Overall Pass Rate',
      value: `${stats.overall_pass_rate}%`,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400'
    },
    {
      label: 'Failed Evaluations',
      value: stats.failed_evaluations,
      icon: XCircle,
      color: 'from-rose-500 to-orange-600',
      textColor: 'text-rose-400'
    },
    {
      label: 'AI Evaluations',
      value: stats.ai_evaluations_count,
      icon: Sparkles,
      color: 'from-amber-500 to-yellow-600',
      textColor: 'text-amber-400'
    },
    {
      label: 'Human Reviews',
      value: stats.human_reviews_count,
      icon: Clock,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400'
    }
  ];

  const failureColors = ['#f43f5e', '#f97316', '#eab308', '#a855f7', '#6366f1'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Evaluation Overview & Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time telemetry on code execution, test pass rates, AI scoring, and human annotations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/workspace"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
          >
            <span>Open Code Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-600/80 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pass Rate & Trend Chart */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Evaluation Activity & Pass Rates
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Submissions volume and test pass rate progression</p>
            </div>
            <span className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded-md bg-slate-700/40 border border-slate-600/40">
              Live DB Telemetry
            </span>
          </div>

          <div className="h-64 w-full">
            {stats.evaluation_trends && stats.evaluation_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.evaluation_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="submissions" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSub)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
                <span>No historical evaluations yet. Submit a solution to see real trends!</span>
              </div>
            )}
          </div>
        </div>

        {/* Common Failure Categories */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Failure Categories
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Common runtime and logic defect patterns</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {stats.failure_categories && stats.failure_categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.failure_categories} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {stats.failure_categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={failureColors[index % failureColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-50 text-emerald-400" />
                <span>No failed submissions recorded. High code quality!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Evaluations Table */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Evaluation Submissions</h2>
            <p className="text-xs text-slate-400">Traceable records of deterministic test runs and scores</p>
          </div>
          <Link to="/workspace" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <span>New Submission</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recent_activity && stats.recent_activity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Problem</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pass Rate</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Runtime</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {stats.recent_activity.map((sub) => {
                  const isAccepted = sub.status === 'Accepted';
                  return (
                    <tr key={sub.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 text-xs">#{sub.id}</td>
                      <td className="py-3 px-4 font-medium text-white">{sub.problem_title}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            isAccepted
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {isAccepted ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{sub.pass_rate}%</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-indigo-400">{sub.total_score}</span>
                        <span className="text-slate-500 text-xs">/100</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-xs">{sub.execution_time_ms} ms</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/submissions/${sub.id}`}
                          className="text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-700/50 hover:bg-slate-700"
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No submissions recorded yet.</p>
            <p className="text-xs text-slate-600 mt-1">Use the Code Workspace to execute your first Python solution.</p>
          </div>
        )}
      </div>
    </div>
  );
};
