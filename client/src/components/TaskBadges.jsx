import { CalendarDays } from 'lucide-react';
import { categoryMeta, priorityMeta, statusMeta } from '../utils/taskMeta';
import { dueMeta } from '../utils/dates';

export function CategoryBadge({ category }) {
  const meta = categoryMeta(category);
  const Icon = meta.icon;
  return (
    <span className={`badge-outline ${meta.badge}`}>
      <Icon size={11} strokeWidth={2.2} aria-hidden="true" />
      {category}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const meta = priorityMeta(priority);
  return (
    <span className={`badge ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span className={`badge ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}

export function DueDateBadge({ dueDate, status, className = '' }) {
  if (!dueDate) return null;
  const meta = dueMeta(dueDate, status);
  const tone =
    meta.state === 'overdue'
      ? 'text-rose-600 dark:text-rose-400'
      : meta.state === 'today'
        ? 'text-accent'
        : 'text-muted';

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${tone} ${className}`}>
      <CalendarDays size={12} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
