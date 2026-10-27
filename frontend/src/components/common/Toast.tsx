import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const configs = {
    success: {
      border: 'border-emerald-500/40',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      glow: 'shadow-emerald-500/10'
    },
    error: {
      border: 'border-rose-500/40',
      icon: AlertCircle,
      iconColor: 'text-rose-500',
      glow: 'shadow-rose-500/10'
    },
    warning: {
      border: 'border-amber-500/40',
      icon: AlertCircle,
      iconColor: 'text-amber-500',
      glow: 'shadow-amber-500/10'
    },
    info: {
      border: 'border-indigo-500/40',
      icon: Info,
      iconColor: 'text-indigo-500',
      glow: 'shadow-indigo-500/10'
    }
  }[toast.type];

  const Icon = configs.icon;

  return (
    <div
      role="status"
      className={`glass-panel-elevated flex items-start gap-3 p-4 rounded-xl border ${configs.border} ${configs.glow} shadow-lg animate-slide-up max-w-sm w-full`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${configs.iconColor}`} />
      <div className="flex-1 text-sm">
        {toast.title && (
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-slate-600 dark:text-slate-300">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
