import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Clock, 
  Layers, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Play
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid 
} from 'recharts';
import { api } from '../lib/api';
import { DashboardStats } from '../types';
import { GlassPanel } from '../components/common/GlassPanel';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonCard, SkeletonTable } from '../components/common/LoadingSkeleton';
import { useTheme } from '../context/ThemeContext';

export const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
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

  const isDark = theme === 'dark';
  const failureColors = ['#f43f5e', '#f97316', '#eab308', '#a855f7', '#6366f1'];
  const chartStroke = isDark ? '#94a3b8' : '#64748b';
  const chartGrid = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 skeleton-shimmer rounded-lg" />
            <div className="h-4 w-96 skeleton-shimmer rounded-md" />
          </div>
          <div className="h-10 w-40 skeleton-shimmer rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={4} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <GlassPanel className="p-8 text-center border-rose-500/40">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Failed to load analytics
          </h2>
          <p className="text-rose-600 dark:text-rose-400 text-sm mt-1">
            {error || 'Unknown error occurred while contacting the telemetry server.'}
          </p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Evaluation Overview & Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Deterministic sandbox pass rates, 4-pillar scoring, AI evaluations, and human annotations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/workspace"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Launch Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Problems"
          value={stats.total_problems}
          icon={Layers}
          accentColor="indigo"
          subtitle="Curated library"
        />
        <MetricCard
          title="Submissions"
          value={stats.total_submissions}
          icon={BarChart3}
          accentColor="cyan"
          subtitle="Total runs"
        />
        <MetricCard
          title="Pass Rate"
          value={stats.overall_pass_rate}
          icon={CheckCircle2}
          accentColor="emerald"
          subtitle="Test suite pass %"
          trend={{ value: `${stats.overall_pass_rate}%`, isPositive: stats.overall_pass_rate >= 50 }}
        />
        <MetricCard
          title="Failures"
          value={stats.failed_evaluations}
          icon={XCircle}
          accentColor="rose"
          subtitle="Logic or runtime"
        />
        <MetricCard
          title="AI Evaluations"
          value={stats.ai_evaluations_count}
          icon={Sparkles}
          accentColor="purple"
          subtitle="Gemini 3.8 Flash"
        />
        <MetricCard
          title="Reviews"
          value={stats.human_reviews_count}
          icon={Clock}
          accentColor="amber"
          subtitle="Expert reviews"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pass Rate & Trend Chart */}
        <GlassPanel className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                Evaluation Activity & Submission Trends
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily volume and evaluation progressions
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30">
              Live DB Telemetry
            </span>
          </div>

          <div className="h-64 w-full">
            {stats.evaluation_trends && stats.evaluation_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.evaluation_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                  <XAxis dataKey="date" stroke={chartStroke} fontSize={11} tickLine={false} />
                  <YAxis stroke={chartStroke} fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: tooltipBg, 
                      borderColor: tooltipBorder, 
                      borderRadius: '12px',
                      color: tooltipText,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                    }}
                    labelStyle={{ color: tooltipText, fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="submissions" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSub)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
                <span>No historical evaluations yet. Submit a solution in Workspace!</span>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Common Failure Categories */}
        <GlassPanel className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Failure Categories
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Runtime errors, logic bugs, time limits
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {stats.failure_categories && stats.failure_categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.failure_categories} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} horizontal={false} />
                  <XAxis type="number" stroke={chartStroke} fontSize={11} />
                  <YAxis type="category" dataKey="category" stroke={chartStroke} fontSize={11} width={85} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: tooltipBg, 
                      borderColor: tooltipBorder, 
                      borderRadius: '12px',
                      color: tooltipText 
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {stats.failure_categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={failureColors[index % failureColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-50 text-emerald-500" />
                <span>No failed submissions recorded. All tests passed!</span>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Recent Evaluations Table */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Recent Evaluation Submissions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic sandbox runs, execution times, and 4-pillar composite scores
            </p>
          </div>
          <Link
            to="/workspace"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>New Submission</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recent_activity && stats.recent_activity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Problem</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pass Rate</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Runtime</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60">
                {stats.recent_activity.map((sub) => {
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-200/30 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                        #{sub.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {sub.problem_title}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={sub.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {sub.pass_rate}%
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {sub.total_score}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs">/100</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                        {sub.execution_time_ms} ms
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/submissions/${sub.id}`}
                          className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 px-3 py-1.5 rounded-lg glass-panel hover:border-indigo-500/40 transition-all inline-block"
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
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No submissions recorded yet.</p>
            <p className="text-xs mt-1">Use the Evaluation Workspace to execute your first Python solution.</p>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
