import { useState } from 'react';
import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import { CATEGORIES, PRIORITIES, PRIORITY_META, STATUSES } from '../utils/taskMeta';
import { toDateInputValue } from '../utils/dates';
import { useTaskStore } from '../context/TaskContext';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Personal',
  priority: 'Medium',
  status: 'Pending',
  dueDate: '',
};

function initialForm(task) {
  if (!task) return { ...EMPTY_FORM };
  return {
    title: task.title || '',
    description: task.description || '',
    category: task.category || 'Other',
    priority: task.priority || 'Medium',
    status: task.status || 'Pending',
    dueDate: toDateInputValue(task.dueDate),
  };
}

export default function TaskForm({ task, onDone }) {
  const { createTask, updateTask } = useTaskStore();
  const toast = useToast();
  const [form, setForm] = useState(() => initialForm(task));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) {
      next.title = 'Title is required.';
    } else if (form.title.trim().length > 120) {
      next.title = 'Title must be 120 characters or fewer.';
    }
    if (form.description.length > 1000) {
      next.description = 'Description must be 1000 characters or fewer.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);
    setFormError('');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || null,
    };

    try {
      if (task) {
        await updateTask(task._id, payload);
        toast.success('Task updated');
      } else {
        await createTask(payload);
        toast.success('Task created');
      }
      onDone?.();
    } catch (error) {
      setSaving(false);
      setFormError(error.message || 'Unable to save this task.');
      const fieldErrors = {};
      for (const issue of error.errors || []) {
        if (issue.field) fieldErrors[issue.field] = issue.message;
      }
      setErrors((current) => ({ ...current, ...fieldErrors }));
      toast.error(error.message || 'Unable to save this task.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      ) : null}

      <div>
        <label htmlFor="task-title" className="label">
          Title <span className="text-rose-500">*</span>
        </label>
        <input
          id="task-title"
          name="title"
          type="text"
          className={`input ${errors.title ? 'input-error' : ''}`}
          placeholder="e.g. Finish the project proposal"
          value={form.title}
          onChange={(event) => setField('title', event.target.value)}
          maxLength={120}
          autoFocus
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'task-title-error' : undefined}
        />
        {errors.title ? (
          <p id="task-title-error" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="task-description" className="label">
          Description <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="task-description"
          name="description"
          rows={3}
          className={`input resize-none ${errors.description ? 'input-error' : ''}`}
          placeholder="Add a little more detail…"
          value={form.description}
          onChange={(event) => setField('description', event.target.value)}
          maxLength={1000}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'task-description-error' : undefined}
        />
        {errors.description ? (
          <p
            id="task-description-error"
            className="mt-1.5 text-xs text-rose-600 dark:text-rose-400"
          >
            {errors.description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="task-category" className="label">
            Category
          </label>
          <div className="relative">
            <select
              id="task-category"
              name="category"
              className="select"
              value={form.category}
              onChange={(event) => setField('category', event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
          </div>
        </div>

        <div>
          <label htmlFor="task-due-date" className="label">
            Due date <span className="text-muted">(optional)</span>
          </label>
          <input
            id="task-due-date"
            name="dueDate"
            type="date"
            className="input"
            value={form.dueDate}
            onChange={(event) => setField('dueDate', event.target.value)}
          />
        </div>
      </div>

      <fieldset>
        <legend className="label">Priority</legend>
        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map((priority) => {
            const meta = PRIORITY_META[priority];
            const active = form.priority === priority;
            return (
              <button
                key={priority}
                type="button"
                onClick={() => setField('priority', priority)}
                aria-pressed={active}
                className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent/10 text-ink'
                    : 'border-line bg-card text-muted hover:bg-elevated hover:text-ink'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                {priority}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="task-status" className="label">
          Status
        </label>
        <div className="relative">
          <select
            id="task-status"
            name="status"
            className="select"
            value={form.status}
            onChange={(event) => setField('status', event.target.value)}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onDone} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn-primary sm:min-w-[9rem]" disabled={saving}>
          {saving ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
          {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  );
}
