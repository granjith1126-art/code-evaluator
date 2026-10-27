import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Loader2, 
  Cpu
} from 'lucide-react';

export type StatusType = 
  | 'ACCEPTED' 
  | 'WRONG_ANSWER' 
  | 'TIME_LIMIT_EXCEEDED' 
  | 'MEMORY_LIMIT_EXCEEDED' 
  | 'RUNTIME_ERROR' 
  | 'COMPILATION_ERROR' 
  | 'SECURITY_VIOLATION' 
  | 'PENDING' 
  | 'RUNNING' 
  | 'EVALUATED'
  | 'Passed'
  | 'Failed'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const normalized = (status || '').toUpperCase().replace(/\s+/g, '_');

  let config = {
    label: status,
    bg: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-400/30 dark:border-slate-600/40',
    dot: 'bg-slate-400',
    icon: AlertTriangle
  };

  switch (normalized) {
    case 'ACCEPTED':
    case 'PASSED':
      config = {
        label: 'Accepted',
        bg: 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 shadow-emerald-500/10 shadow-sm',
        dot: 'bg-emerald-500',
        icon: CheckCircle2
      };
      break;
    case 'WRONG_ANSWER':
    case 'FAILED':
      config = {
        label: 'Wrong Answer',
        bg: 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/40 shadow-rose-500/10 shadow-sm',
        dot: 'bg-rose-500',
        icon: XCircle
      };
      break;
    case 'TIME_LIMIT_EXCEEDED':
      config = {
        label: 'Time Limit',
        bg: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 shadow-amber-500/10 shadow-sm',
        dot: 'bg-amber-500',
        icon: Clock
      };
      break;
    case 'MEMORY_LIMIT_EXCEEDED':
      config = {
        label: 'Memory Limit',
        bg: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 shadow-amber-500/10 shadow-sm',
        dot: 'bg-amber-500',
        icon: Cpu
      };
      break;
    case 'RUNTIME_ERROR':
      config = {
        label: 'Runtime Error',
        bg: 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-500/40 shadow-orange-500/10 shadow-sm',
        dot: 'bg-orange-500',
        icon: AlertTriangle
      };
      break;
    case 'COMPILATION_ERROR':
      config = {
        label: 'Compile Error',
        bg: 'bg-red-500/15 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-500/40 shadow-red-500/10 shadow-sm',
        dot: 'bg-red-500',
        icon: AlertTriangle
      };
      break;
    case 'SECURITY_VIOLATION':
      config = {
        label: 'Security Blocked',
        bg: 'bg-purple-500/15 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-500/40 shadow-purple-500/10 shadow-sm',
        dot: 'bg-purple-500',
        icon: ShieldAlert
      };
      break;
    case 'PENDING':
      config = {
        label: 'Pending',
        bg: 'bg-sky-500/15 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-500/40',
        dot: 'bg-sky-500',
        icon: Clock
      };
      break;
    case 'RUNNING':
      config = {
        label: 'Executing...',
        bg: 'bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/40 shadow-indigo-500/10 shadow-sm',
        dot: 'bg-indigo-500 animate-ping',
        icon: Loader2
      };
      break;
    case 'EVALUATED':
      config = {
        label: 'Evaluated',
        bg: 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-500/40 shadow-cyan-500/10 shadow-sm',
        dot: 'bg-cyan-500',
        icon: CheckCircle2
      };
      break;
  }

  const Icon = config.icon;
  const isSpinning = normalized === 'RUNNING';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold'
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border backdrop-blur-md transition-all duration-200 ${config.bg} ${sizeClasses} ${className}`}
    >
      {showIcon && (
        <Icon className={`${iconSizes} ${isSpinning ? 'animate-spin' : ''}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};
