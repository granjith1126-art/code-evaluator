import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

interface FilterOption {
  label: string;
  value: string;
}

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
  }[];
  className?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  search,
  onSearchChange,
  placeholder = 'Search problems, submissions, records...',
  filters = [],
  className = ''
}) => {
  return (
    <GlassPanel className={`p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Selects */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
          {filters.map((filter) => (
            <select
              key={filter.id}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-[var(--border-glass)] text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer transition-all"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}
    </GlassPanel>
  );
};
