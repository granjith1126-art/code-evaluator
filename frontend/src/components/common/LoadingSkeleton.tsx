import React from 'react';
import { GlassPanel } from './GlassPanel';

interface SkeletonProps {
  className?: string;
}

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg skeleton-shimmer w-full"
          style={{ width: lines > 1 && i === lines - 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <GlassPanel className={`p-5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded-md skeleton-shimmer" />
        <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
      </div>
      <div className="h-8 w-20 rounded-md skeleton-shimmer" />
      <div className="h-3 w-36 rounded-md skeleton-shimmer" />
    </GlassPanel>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = ''
}) => {
  return (
    <GlassPanel className={`p-4 space-y-3 ${className}`}>
      <div className="h-6 w-48 rounded-md skeleton-shimmer mb-4" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-2 border-b border-slate-200/40 dark:border-slate-800/40 last:border-none">
            <div className="h-4 w-12 rounded skeleton-shimmer" />
            <div className="h-4 w-1/3 rounded skeleton-shimmer" />
            <div className="h-4 w-1/4 rounded skeleton-shimmer" />
            <div className="h-4 w-16 rounded skeleton-shimmer ml-auto" />
          </div>
        ))}
      </div>
    </GlassPanel>
  );
};
