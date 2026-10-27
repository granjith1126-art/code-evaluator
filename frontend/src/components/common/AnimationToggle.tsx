import React from 'react';
import { Sparkles, MinusCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const AnimationToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { motionPreference, setMotionPreference } = useTheme();
  const isReduced = motionPreference === 'reduced';

  return (
    <button
      onClick={() => setMotionPreference(isReduced ? 'full' : 'reduced')}
      aria-label={isReduced ? 'Enable motion animations' : 'Reduce motion animations'}
      title={isReduced ? 'Animations: Reduced (Click to enable)' : 'Animations: Full (Click to reduce)'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-panel border border-[var(--border-glass)] text-xs font-medium transition-all duration-200 cursor-pointer ${
        isReduced
          ? 'text-amber-600 dark:text-amber-400 border-amber-500/30'
          : 'text-indigo-600 dark:text-indigo-400 hover:border-indigo-500/40'
      } ${className}`}
    >
      {isReduced ? (
        <>
          <MinusCircle className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Reduced Motion</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Motion Active</span>
        </>
      )}
    </button>
  );
};
