import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'taskflow.theme';
const ThemeContext = createContext(null);

const isMode = (value) => value === 'light' || value === 'dark' || value === 'system';

function systemPrefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStoredMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isMode(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(readStoredMode);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setSystemDark(event.matches);
    if (query.addEventListener) query.addEventListener('change', onChange);
    else query.addListener(onChange);
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', onChange);
      else query.removeListener(onChange);
    };
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0F172A' : '#F8FAFC');
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* storage may be unavailable */
    }
  }, [mode, isDark]);

  const setMode = useCallback((next) => {
    if (isMode(next)) setModeState(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((current) => {
      const currentlyDark = current === 'dark' || (current === 'system' && systemPrefersDark());
      return currentlyDark ? 'light' : 'dark';
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setModeState('system');
  }, []);

  const value = useMemo(
    () => ({ mode, isDark, setMode, toggle, reset }),
    [mode, isDark, setMode, toggle, reset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
