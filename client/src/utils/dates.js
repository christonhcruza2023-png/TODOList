export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfToday() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

export function dayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatLongDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function dueMeta(iso, status) {
  if (!iso) return { label: 'No due date', state: 'none' };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { label: 'No due date', state: 'none' };

  const start = startOfToday();
  const end = endOfToday();
  const tomorrowEnd = addDays(end, 1);

  if (date >= start && date < end) return { label: 'Today', state: 'today' };
  if (date >= end && date < tomorrowEnd) return { label: 'Tomorrow', state: 'soon' };
  if (date < start) {
    return {
      label: status === 'Completed' ? formatDate(iso) : `Overdue · ${formatDate(iso)}`,
      state: status === 'Completed' ? 'past' : 'overdue',
    };
  }
  return { label: formatDate(iso), state: 'future' };
}

export function isOverdue(task) {
  if (!task?.dueDate || task.status === 'Completed') return false;
  return new Date(task.dueDate) < startOfToday();
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
