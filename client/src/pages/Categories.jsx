import { useMemo, useState } from 'react';
import { Plus, Shapes } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import TaskListView from '../components/TaskListView';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { StatsSkeleton } from '../components/Skeletons';
import { useStats } from '../hooks/useStats';
import { useTasksQuery } from '../hooks/useTasksQuery';
import { usePreferences } from '../context/PreferencesContext';
import { useTaskStore } from '../context/TaskContext';
import { CATEGORIES, categoryMeta } from '../utils/taskMeta';
import { cn } from '../utils/cn';

export default function Categories() {
  const { stats, loading: statsLoading, error: statsError, retry: retryStats } = useStats();
  const { preferences } = usePreferences();
  const { openCreate } = useTaskStore();
  const [selected, setSelected] = useState('');

  const query = useMemo(
    () => ({ category: selected, sort: preferences.defaultSort }),
    [selected, preferences.defaultSort]
  );
  const { tasks, count, loading, error, retry } = useTasksQuery(query);

  const rows =
    stats?.byCategory ||
    CATEGORIES.map((category) => ({ category, total: 0, completed: 0 }));

  const selectedMeta = selected ? categoryMeta(selected) : null;

  const emptyState = selected ? (
    <EmptyState
      icon={selectedMeta?.icon || Shapes}
      title={`No tasks in ${selected}`}
      description="This category is empty. Create a task and choose this category, or browse another area."
      action={
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Create a task
        </button>
      }
    />
  ) : (
    <EmptyState
      icon={Shapes}
      title="No tasks yet"
      description="Once you add tasks, their categories will show up here with live counts."
      action={
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Create your first task
        </button>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Browse your tasks by area of life. Select a category to focus on it."
      >
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          New task
        </button>
      </PageHeader>

      {statsError ? <ErrorState message={statsError} onRetry={retryStats} /> : null}
      {statsLoading && !stats ? <StatsSkeleton /> : null}

      {stats ? (
        <section
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
          aria-label="Task categories"
        >
          {rows.map((row) => {
            const meta = categoryMeta(row.category);
            const Icon = meta.icon;
            const percent = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
            const isSelected = selected === row.category;

            return (
              <button
                key={row.category}
                type="button"
                onClick={() => setSelected((current) => (current === row.category ? '' : row.category))}
                aria-pressed={isSelected}
                className={cn(
                  'card group p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-soft',
                  isSelected && 'border-accent/60 ring-1 ring-accent/20'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl',
                      meta.tint
                    )}
                  >
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className="text-base font-semibold tabular-nums text-ink">{row.total}</span>
                </div>
                <p className="mt-3 text-[13px] font-medium text-ink">{row.category}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted">
                    {row.completed}/{row.total}
                  </span>
                </div>
              </button>
            );
          })}
        </section>
      ) : null}

      <section className="space-y-3" aria-labelledby="category-tasks-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="category-tasks-heading" className="text-sm font-semibold text-ink">
              {selected ? `${selected} tasks` : 'All tasks'}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted" aria-live="polite">
              {loading
                ? 'Loading tasks…'
                : `${count} ${count === 1 ? 'task' : 'tasks'}${selected ? ` in ${selected}` : ' across all categories'}`}
            </p>
          </div>
          {selected ? (
            <button type="button" className="btn-ghost btn-sm" onClick={() => setSelected('')}>
              Show all categories
            </button>
          ) : null}
        </div>

        <TaskListView
          tasks={tasks}
          loading={loading}
          error={error}
          onRetry={retry}
          emptyState={emptyState}
          skeletonCount={4}
        />
      </section>
    </div>
  );
}
