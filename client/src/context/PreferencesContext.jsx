import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'taskflow.prefs';

export const DEFAULT_PREFERENCES = Object.freeze({
  defaultView: '/dashboard',
  defaultSort: 'newest',
  showDescriptions: true,
  compactTasks: false,
});

export const VIEW_OPTIONS = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/tasks', label: 'All Tasks' },
  { value: '/today', label: 'Today' },
  { value: '/upcoming', label: 'Upcoming' },
  { value: '/completed', label: 'Completed' },
];

const VIEW_PATHS = VIEW_OPTIONS.map((view) => view.value);
const SORT_VALUES = ['newest', 'oldest', 'dueDate', 'priority', 'alpha'];

const PreferencesContext = createContext(null);

function sanitize(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    defaultView: VIEW_PATHS.includes(input.defaultView)
      ? input.defaultView
      : DEFAULT_PREFERENCES.defaultView,
    defaultSort: SORT_VALUES.includes(input.defaultSort)
      ? input.defaultSort
      : DEFAULT_PREFERENCES.defaultSort,
    showDescriptions:
      typeof input.showDescriptions === 'boolean'
        ? input.showDescriptions
        : DEFAULT_PREFERENCES.showDescriptions,
    compactTasks:
      typeof input.compactTasks === 'boolean'
        ? input.compactTasks
        : DEFAULT_PREFERENCES.compactTasks,
  };
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function persist(preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    /* storage may be unavailable */
  }
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(loadPreferences);

  const updatePreference = useCallback((key, value) => {
    setPreferences((current) => {
      const next = sanitize({ ...current, [key]: value });
      persist(next);
      return next;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    const next = { ...DEFAULT_PREFERENCES };
    setPreferences(next);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return next;
  }, []);

  const value = useMemo(
    () => ({ preferences, updatePreference, resetPreferences }),
    [preferences, updatePreference, resetPreferences]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within a PreferencesProvider');
  return context;
}
