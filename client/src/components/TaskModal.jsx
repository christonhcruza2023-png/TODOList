import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import TaskForm from './TaskForm';
import { useTaskStore } from '../context/TaskContext';

export default function TaskModal({ open, task }) {
  const { closeModal } = useTaskStore();
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, closeModal]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:px-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
        onClick={closeModal}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-card p-5 shadow-pop animate-slide-up sm:max-w-xl sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="task-modal-title" className="text-base font-semibold tracking-tight text-ink">
              {task ? 'Edit task' : 'New task'}
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              {task ? 'Update the details and save your changes.' : 'Capture what needs to get done.'}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn -mr-1 -mt-1 shrink-0"
            onClick={closeModal}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <TaskForm task={task} onDone={closeModal} />
      </div>
    </div>,
    document.body
  );
}
