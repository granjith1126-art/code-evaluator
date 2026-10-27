import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemePreference = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';
type MotionPreference = 'full' | 'reduced';

interface ThemeContextType {
  theme: ResolvedTheme;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  motionPreference: MotionPreference;
  setMotionPreference: (pref: MotionPreference) => void;
  monacoTheme: 'vs-dark' | 'vs';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    return (localStorage.getItem('ce_theme') as ThemePreference) || 'dark';
  });

  const [motionPreference, setMotionPreferenceState] = useState<MotionPreference>(() => {
    return (localStorage.getItem('ce_motion') as MotionPreference) || 'full';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  // Resolve theme based on preference and system query
  useEffect(() => {
    const updateTheme = () => {
      let active: ResolvedTheme = 'dark';
      if (themePreference === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = systemDark ? 'dark' : 'light';
      } else {
        active = themePreference;
      }

      setResolvedTheme(active);
      const root = document.documentElement;
      if (active === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    updateTheme();

    if (themePreference === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [themePreference]);

  // Motion preference effect
  useEffect(() => {
    const root = document.documentElement;
    if (motionPreference === 'reduced') {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [motionPreference]);

  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    localStorage.setItem('ce_theme', pref);
  };

  const setMotionPreference = (pref: MotionPreference) => {
    setMotionPreferenceState(pref);
    localStorage.setItem('ce_motion', pref);
  };

  const monacoTheme: 'vs-dark' | 'vs' = resolvedTheme === 'dark' ? 'vs-dark' : 'vs';

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themePreference,
        setThemePreference,
        motionPreference,
        setMotionPreference,
        monacoTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
