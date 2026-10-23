import { useState } from 'react';
import {
  ChevronDown,
  Database,
  Eraser,
  Monitor,
  Moon,
  Palette,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import { useTheme } from '../context/ThemeContext';
import { usePreferences, VIEW_OPTIONS } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';
import { SORT_OPTIONS } from '../utils/taskMeta';
import { cn } from '../utils/cn';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-line'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

function SettingRow({ title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-[12px] leading-5 text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SelectControl({ id, value, onChange, options }) {
  return (
    <div className="relative w-full sm:w-52">
      <select
        id={id}
        className="select text-[13px]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
  );
}

export default function Settings() {
  const { mode, setMode, reset: resetTheme } = useTheme();
  const { preferences, updatePreference, resetPreferences } = usePreferences();
  const toast = useToast();
  const [resetOpen, setResetOpen] = useState(false);

  const handleResetPreferences = () => {
    resetPreferences();
    resetTheme();
    try {
      localStorage.removeItem('taskflow.sidebar');
    } catch {
      /* ignore */
    }
    setResetOpen(false);
    toast.success('Local preferences cleared');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Tune TaskFlow to fit the way you work. Preferences stay in this browser."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="appearance-heading">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-muted" aria-hidden="true" />
            <h2 id="appearance-heading" className="text-sm font-semibold text-ink">
              Appearance
            </h2>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-muted">
            Choose a theme. System follows your device setting and updates automatically.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = mode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-3 text-[12px] font-medium transition-colors',
                    active
                      ? 'border-accent bg-accent/10 text-ink'
                      : 'border-line text-muted hover:bg-elevated hover:text-ink'
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card p-5" aria-labelledby="defaults-heading">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-muted" aria-hidden="true" />
            <h2 id="defaults-heading" className="text-sm font-semibold text-ink">
              Task defaults
            </h2>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-muted">
            Set where you land and how task lists are ordered by default.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="default-view" className="label">
                Default view
              </label>
              <SelectControl
                id="default-view"
                value={preferences.defaultView}
                onChange={(value) => updatePreference('defaultView', value)}
                options={VIEW_OPTIONS}
              />
              <p className="mt-1.5 text-[11px] text-muted">
                Where TaskFlow opens when you visit the app.
              </p>
            </div>
            <div>
              <label htmlFor="default-sort" className="label">
                Default sorting
              </label>
              <SelectControl
                id="default-sort"
                value={preferences.defaultSort}
                onChange={(value) => updatePreference('defaultSort', value)}
                options={SORT_OPTIONS}
              />
              <p className="mt-1.5 text-[11px] text-muted">
                Used by All Tasks and Categories when you open them.
              </p>
            </div>
          </div>
        </section>

        <section className="card p-5" aria-labelledby="display-heading">
          <h2 id="display-heading" className="text-sm font-semibold text-ink">
            Task display
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-muted">
            Make lists quieter or more detailed — whichever helps you focus.
          </p>
          <div className="mt-2 divide-y divide-line">
            <SettingRow
              title="Show descriptions"
              description="Display a two-line preview of each task description."
            >
              <Toggle
                label="Show task descriptions"
                checked={preferences.showDescriptions}
                onChange={(value) => updatePreference('showDescriptions', value)}
              />
            </SettingRow>
            <SettingRow
              title="Compact tasks"
              description="Reduce padding so more tasks fit on screen."
            >
              <Toggle
                label="Use compact task cards"
                checked={preferences.compactTasks}
                onChange={(value) => updatePreference('compactTasks', value)}
              />
            </SettingRow>
          </div>
        </section>

        <section className="card p-5" aria-labelledby="data-heading">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-muted" aria-hidden="true" />
            <h2 id="data-heading" className="text-sm font-semibold text-ink">
              Data & storage
            </h2>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-muted">
            Tasks are stored in MongoDB through the TaskFlow API, so they survive refreshes and
            restarts. Theme and display preferences live in this browser's localStorage.
          </p>
          <div className="mt-4 rounded-xl border border-line bg-bg px-3 py-2.5 text-[12px] leading-5 text-muted">
            This is a single-user demo. There is no account system or sign-in.
          </div>
          <button
            type="button"
            className="btn-secondary mt-4"
            onClick={() => setResetOpen(true)}
          >
            <Eraser size={15} aria-hidden="true" />
            Clear local preferences
          </button>
        </section>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Clear local preferences?"
        description="This resets your theme, default view, sorting, and display preferences in this browser. Your tasks in MongoDB are not affected."
        confirmLabel="Clear preferences"
        busy={false}
        onCancel={() => setResetOpen(false)}
        onConfirm={handleResetPreferences}
      />
    </div>
  );
}
