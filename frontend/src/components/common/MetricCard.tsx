import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'indigo',
  onClick,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState<string | number>(
    typeof value === 'number' ? 0 : value
  );

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    const duration = 650;
    const steps = 25;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      current += increment;
      if (stepCount >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(
          Number.isInteger(value)
            ? Math.round(current)
            : Number(current.toFixed(1))
        );
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  const colorVariants = {
    indigo: {
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      glow: 'hover:border-indigo-500/40'
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      glow: 'hover:border-cyan-500/40'
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      glow: 'hover:border-emerald-500/40'
    },
    amber: {
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20',
      glow: 'hover:border-amber-500/40'
    },
    rose: {
      iconBg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20',
      glow: 'hover:border-rose-500/40'
    },
    purple: {
      iconBg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20',
      glow: 'hover:border-purple-500/40'
    }
  }[accentColor];

  return (
    <GlassCard
      onClick={onClick}
      className={`relative overflow-hidden group cursor-default transition-all duration-300 ${colorVariants.glow} ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-50">
              {displayValue}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-xl border backdrop-blur-md ${colorVariants.iconBg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-xs">
          <span
            className={`font-medium flex items-center gap-1 ${
              trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.value}
          </span>
          {trend.label && (
            <span className="text-slate-400 dark:text-slate-500">
              {trend.label}
            </span>
          )}
        </div>
      )}
    </GlassCard>
  );
};
