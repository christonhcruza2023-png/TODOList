import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ProgressRing from '../components/ProgressRing';
import { StatsSkeleton } from '../components/Skeletons';
import { useStats } from '../hooks/useStats';
import { useTaskStore } from '../context/TaskContext';
import { formatLongDate, greeting } from '../utils/dates';
import { cn } from '../utils/cn';

function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <div
      className="card p-4 transition-colors hover:border-accent/30"
      data-testid={`stat-${stat.key}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            {stat.label}
          </p>
          <p
            className="mt-1.5 text-2xl font-semibold tracking-tight text-ink"
            data-testid={`stat-${stat.key}-value`}
          >
            {stat.value}
          </p>
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', stat.tone)}>
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 truncate text-[11px] text-muted">{stat.hint}</p>
    </div>
  );
}

export default function Dashboard() {
  const { stats, loading, error, retry } = useStats();
  const { openCreate } = useTaskStore();
  const initialLoading = loading && !stats;

  const cards = stats
    ? [
        {
          key: 'total',
          label: 'Total tasks',
          value: stats.total,
          icon: ListTodo,
          tone: 'bg-accent/10 text-accent',
          hint: `${stats.inProgress} in progress`,
        },
        {
          key: 'completed',
          label: 'Completed',
          value: stats.completed,
          icon: CheckCircle2,
          tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          hint: `${stats.completionRate}% completion rate`,
        },
        {
          key: 'pending',
          label: 'Pending',
          value: stats.pending,
          icon: Clock,
          tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          hint: stats.dueToday > 0 ? `${stats.dueToday} due today` : 'Nothing due today',
        },
        {
          key: 'overdue',
          label: 'Overdue',
          value: stats.overdue,
          icon: AlertTriangle,
          tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
          hint: stats.overdue > 0 ? 'Needs attention' : 'All caught up',
        },
      ]
    : [];

  const summary = !stats
    ? ''
    : stats.total === 0
      ? 'Add your first task to start tracking progress.'
      : stats.overdue > 0
        ? `${stats.overdue} task${stats.overdue === 1 ? '' : 's'} overdue — clear those first to get back in flow.`
        : stats.dueToday > 0
          ? `${stats.dueToday} task${stats.dueToday === 1 ? '' : 's'} due today. ${stats.completedToday} completed so far — keep the momentum.`
          : 'Nothing is due today. A good moment to plan ahead.';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, welcome back`}
        description={`${formatLongDate()} · Here's a calm look at your day.`}
      >
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Quick add task
        </button>
      </PageHeader>

      {initialLoading ? <StatsSkeleton /> : null}

      {error && !loading ? <ErrorState message={error} onRetry={retry} /> : null}

      {stats ? (
        <>
          <section
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Task statistics"
          >
            {cards.map((card) => (
              <StatCard key={card.key} stat={card} />
            ))}
          </section>

          {stats.total === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Your board is clear"
              description="TaskFlow is ready when you are. Create your first task and it will show up across your dashboard, views, and categories."
              action={
                <button type="button" className="btn-primary" onClick={openCreate}>
                  <Plus size={16} aria-hidden="true" />
                  Create your first task
                </button>
              }
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <section className="space-y-3" aria-labelledby="recent-tasks-heading">
                  <div className="flex items-center justify-between gap-3">
                    <h2 id="recent-tasks-heading" className="text-sm font-semibold text-ink">
                      Recent tasks
                    </h2>
                    <Link
                      to="/tasks"
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
                    >
                      View all
                      <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                  {stats.recentTasks.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentTasks.map((task) => (
                        <TaskCard key={task._id} task={task} compact />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={ListTodo}
                      title="No recent tasks"
                      description="Tasks you create will show up here."
                      className="py-10"
                    />
                  )}
                </section>

                <section className="space-y-3" aria-labelledby="today-tasks-heading">
                  <div className="flex items-center justify-between gap-3">
                    <h2 id="today-tasks-heading" className="text-sm font-semibold text-ink">
                      Today's tasks
                    </h2>
                    <Link
                      to="/today"
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
                    >
                      Open Today
                      <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                  {stats.todayTasks.length > 0 ? (
                    <div className="space-y-3">
                      {stats.todayTasks.map((task) => (
                        <TaskCard key={task._id} task={task} compact />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={CalendarCheck}
                      title="Nothing due today"
                      description="Your day is clear. Enjoy the breathing room, or plan something small."
                      className="py-10"
                    />
                  )}
                </section>
              </div>

              <section className="card h-fit p-5" aria-labelledby="progress-heading">
                <div className="flex items-center justify-between">
                  <h2 id="progress-heading" className="text-sm font-semibold text-ink">
                    Task completion
                  </h2>
                  <span className="badge bg-accent/10 text-accent">{stats.completionRate}%</span>
                </div>

                <div className="mt-5 flex items-center gap-4">
                  <ProgressRing value={stats.completionRate} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {stats.completed} of {stats.total} done
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {stats.pending} task{stats.pending === 1 ? '' : 's'} remaining
                    </p>
                  </div>
                </div>

                <dl className="mt-5 space-y-2.5 border-t border-line pt-4">
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <dt className="flex items-center gap-2 text-muted">
                      <CalendarCheck size={14} aria-hidden="true" />
                      Due today
                    </dt>
                    <dd className="font-medium text-ink">{stats.dueToday}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <dt className="flex items-center gap-2 text-muted">
                      <AlertTriangle size={14} aria-hidden="true" />
                      Overdue
                    </dt>
                    <dd className={cn('font-medium', stats.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-ink')}>
                      {stats.overdue}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <dt className="flex items-center gap-2 text-muted">
                      <CheckCircle2 size={14} aria-hidden="true" />
                      Completed today
                    </dt>
                    <dd className="font-medium text-ink">{stats.completedToday}</dd>
                  </div>
                </dl>

                <p className="mt-4 rounded-xl bg-elevated/70 px-3 py-2.5 text-[12px] leading-5 text-muted">
                  {summary}
                </p>
              </section>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
