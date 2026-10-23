import {
  Briefcase,
  FolderKanban,
  GraduationCap,
  HeartPulse,
  ShoppingCart,
  Tag,
  User,
} from 'lucide-react';

export const CATEGORIES = ['Personal', 'School', 'Work', 'Health', 'Shopping', 'Projects', 'Other'];
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['Pending', 'In Progress', 'Completed'];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'alpha', label: 'Alphabetical' },
];

export const CATEGORY_META = {
  Personal: {
    icon: User,
    badge:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300',
    iconClass: 'text-violet-500 dark:text-violet-300',
    tint: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  School: {
    icon: GraduationCap,
    badge:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300',
    iconClass: 'text-sky-500 dark:text-sky-300',
    tint: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  Work: {
    icon: Briefcase,
    badge:
      'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300',
    iconClass: 'text-indigo-500 dark:text-indigo-300',
    tint: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  Health: {
    icon: HeartPulse,
    badge:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300',
    iconClass: 'text-rose-500 dark:text-rose-300',
    tint: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  Shopping: {
    icon: ShoppingCart,
    badge:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300',
    iconClass: 'text-amber-500 dark:text-amber-300',
    tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  Projects: {
    icon: FolderKanban,
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300',
    iconClass: 'text-emerald-500 dark:text-emerald-300',
    tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  Other: {
    icon: Tag,
    badge:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/25 dark:bg-slate-500/10 dark:text-slate-300',
    iconClass: 'text-slate-500 dark:text-slate-300',
    tint: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
};

export const PRIORITY_META = {
  High: {
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
  },
  Medium: {
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
  },
  Low: {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
  },
};

export const STATUS_META = {
  Pending: {
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  'In Progress': {
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  Completed: {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
};

export function categoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.Other;
}

export function priorityMeta(priority) {
  return PRIORITY_META[priority] || PRIORITY_META.Medium;
}

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.Pending;
}
