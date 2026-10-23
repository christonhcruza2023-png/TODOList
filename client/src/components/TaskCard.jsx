import { useState } from 'react';
import { Check, Loader2, Pencil, Trash2 } from 'lucide-react';
import { CategoryBadge, DueDateBadge, PriorityBadge, StatusBadge } from './TaskBadges';
import ConfirmDialog from './ConfirmDialog';
import { useTaskStore } from '../context/TaskContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';
import { priorityMeta } from '../utils/taskMeta';
import { cn } from '../utils/cn';

export default function TaskCard({ task, compact = false }) {
  const { toggleStatus, deleteTask, openEdit, refresh } = useTaskStore();
  const { preferences } = usePreferences();
  const toast = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const completed = task.status === 'Completed';
  const priority = priorityMeta(task.priority);
  const showDescription =
    !compact && preferences.showDescriptions && Boolean(task.description);
  const padding = preferences.compactTasks || compact ? 'p-3.5' : 'p-4';

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await toggleStatus(task);
      toast.success(completed ? 'Task reopened' : 'Task completed');
    } catch (error) {
      toast.error(error.message);
      refresh();
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteTask(task._id);
      setConfirmOpen(false);
      toast.success('Task deleted');
    } catch (error) {
      setDeleting(false);
      setConfirmOpen(false);
      toast.error(error.message);
      refresh();
    }
  };

  return (
    <>
      <article
        className={cn(
          'group card relative overflow-hidden transition-colors hover:border-accent/30',
          padding,
          completed && 'opacity-80'
        )}
      >
        <span
          className={cn('absolute inset-y-4 left-0 w-[3px] rounded-r-full', priority.bar)}
          aria-hidden="true"
        />
        <div className="flex gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={completed}
            aria-label={`Mark "${task.title}" as ${completed ? 'pending' : 'complete'}`}
            onClick={handleToggle}
            disabled={toggling}
            className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
              completed
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-line bg-card text-transparent hover:border-accent hover:text-accent/40'
            )}
          >
            {toggling ? (
              <Loader2 size={11} className="animate-spin text-muted" aria-hidden="true" />
            ) : (
              <Check size={12} strokeWidth={3} className={completed ? 'animate-pop' : ''} aria-hidden="true" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  'min-w-0 break-words text-sm font-medium leading-6 text-ink',
                  completed && 'text-muted line-through decoration-muted/60'
                )}
              >
                {task.title}
              </h3>
              <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <button
                  type="button"
                  className="icon-btn h-7 w-7"
                  onClick={() => openEdit(task)}
                  aria-label={`Edit "${task.title}"`}
                  title="Edit task"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="icon-btn h-7 w-7 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                  onClick={() => setConfirmOpen(true)}
                  aria-label={`Delete "${task.title}"`}
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {showDescription ? (
              <p className="mt-1 line-clamp-2 break-words text-[13px] leading-5 text-muted">
                {task.description}
              </p>
            ) : null}

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <CategoryBadge category={task.category} />
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              <DueDateBadge dueDate={task.dueDate} status={task.status} className="ml-auto" />
            </div>
          </div>
        </div>
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this task?"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete task"
        busy={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
