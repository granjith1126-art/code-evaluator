import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Lock,
  Server
} from 'lucide-react';
import { api } from '../lib/api';
import { SystemConfigStatus } from '../types';

export const SystemStatusPage: React.FC = () => {
  const [config, setConfig] = useState<SystemConfigStatus | null>(null);
  const [health, setHealth] = useState<{ status: string; uptime_seconds: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = () => {
    setLoading(true);
    Promise.all([api.getConfigStatus(), api.getHealth()])
      .then(([cfg, hlth]) => {
        setConfig(cfg);
        setHealth(hlth);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-7 h-7 text-indigo-400" />
            Infrastructure & AI Provider Diagnostics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time status of backend microservices, execution sandboxes, and connected foundation models.
          </p>
        </div>

        <button
          onClick={loadStatus}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Grid: Health & Sandbox Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Core API Backend</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xl font-bold text-white capitalize">{health?.status || 'Online'}</span>
          </div>
          <p className="text-xs text-slate-500 font-mono">Uptime: {health?.uptime_seconds || 0} seconds</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Execution Sandbox</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
            <span className="text-xl font-bold text-white uppercase">{config?.sandbox_mode || 'Auto'}</span>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Docker Daemon: {config?.docker_available ? 'Available' : 'Host Subprocess Isolation'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Database Storage</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
            <span className="text-xl font-bold text-white uppercase">{config?.database_type || 'SQLite'}</span>
          </div>
          <p className="text-xs text-slate-500 font-mono">Environment: {config?.app_env || 'Development'}</p>
        </div>
      </div>

      {/* AI Providers Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Configured AI Model Providers</h3>
            <p className="text-xs text-slate-400">Auto-discovered credentials from developer environment (secrets masked)</p>
          </div>
          <Lock className="w-4 h-4 text-slate-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config?.providers.map((p) => (
            <div
              key={p.provider}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                p.active
                  ? 'bg-slate-950/80 border-slate-800'
                  : 'bg-slate-950/40 border-slate-800/50 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white uppercase text-sm">{p.provider}</span>
                  {p.default && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      DEFAULT
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Model: <span className="text-slate-200">{p.model}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  {p.active ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{p.status_message}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">{p.status_message}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Sandbox Enforcement Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          Execution Security & Isolation Policies
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-white">Docker Isolation Boundary (Primary)</span>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>Disabled container network (`--network none`)</li>
              <li>Dropped all Linux capabilities (`--cap-drop ALL`)</li>
              <li>Read-only filesystem mount with `no-new-privileges`</li>
              <li>Dedicated unprivileged non-root user `sandboxuser`</li>
              <li>Strict hard memory (128MB) and wall-clock timeout bounds</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-white">Subprocess Isolation Boundary (Fallback)</span>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>Isolated subprocess with clean temporary working directory</li>
              <li>AST-level Python syntax validation prior to compilation</li>
              <li>Active psutil memory monitoring with process kill on limit exceed</li>
              <li>Wall-clock timeout watchdog preventing infinite loops</li>
              <li>Output size truncation capping maximum stdout to 64KB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
