import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Code2, 
  BarChart3, 
  BookOpen, 
  Play, 
  GitCompare, 
  CheckSquare, 
  Database, 
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../lib/api';
import { SystemConfigStatus } from '../../types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [config, setConfig] = useState<SystemConfigStatus | null>(null);

  useEffect(() => {
    api.getConfigStatus()
      .then(setConfig)
      .catch(() => {});
  }, []);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: BarChart3 },
    { to: '/problems', label: 'Problem Library', icon: BookOpen },
    { to: '/workspace', label: 'Evaluation Workspace', icon: Play },
    { to: '/compare', label: 'Comparison Studio', icon: GitCompare },
    { to: '/reviews', label: 'Review & Annotation', icon: CheckSquare },
    { to: '/datasets', label: 'Dataset Management', icon: Database },
    { to: '/status', label: 'System Status', icon: Cpu },
  ];

  const activeProvider = config?.providers.find(p => p.active && p.default) || config?.providers.find(p => p.active);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AI Code Evaluator
              </span>
              <span className="block text-xs font-mono text-cyan-400">Enterprise Benchmarking</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Provider / Sandbox Status Badge */}
          <div className="flex items-center gap-3">
            {activeProvider ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-semibold">{activeProvider.provider.toUpperCase()}</span>
                <span className="text-slate-500">({activeProvider.model})</span>
              </div>
            ) : null}

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-indigo-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Isolated Sandbox</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
