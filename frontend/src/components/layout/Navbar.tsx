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
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import { SystemConfigStatus } from '../../types';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { AnimationToggle } from '../common/AnimationToggle';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [config, setConfig] = useState<SystemConfigStatus | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.getConfigStatus()
      .then(setConfig)
      .catch(() => {});
  }, []);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: BarChart3 },
    { to: '/problems', label: 'Problems', icon: BookOpen },
    { to: '/workspace', label: 'Workspace', icon: Play },
    { to: '/compare', label: 'Comparison', icon: GitCompare },
    { to: '/reviews', label: 'Reviews', icon: CheckSquare },
    { to: '/datasets', label: 'Datasets', icon: Database },
    { to: '/status', label: 'Status', icon: Cpu },
  ];

  const activeProvider = config?.providers.find(p => p.active && p.default) || config?.providers.find(p => p.active);

  return (
    <header className="glass-panel border-b border-[var(--border-glass)] sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group focus-ring rounded-xl p-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                AI Code Evaluator
              </span>
              <span className="block text-[10px] font-mono tracking-wider text-slate-500 dark:text-cyan-400 uppercase">
                Production Sandbox
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 focus-ring ${
                    isActive
                      ? 'bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls & Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Model Badge */}
            {activeProvider ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-panel border border-emerald-500/30 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {activeProvider.model}
                </span>
              </div>
            ) : null}

            {/* Sandbox Isolation Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-panel border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Hardened</span>
            </div>

            {/* Reduced Motion Toggle */}
            <AnimationToggle />

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 focus-ring cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-[var(--border-glass)] space-y-1 animate-slide-up">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
