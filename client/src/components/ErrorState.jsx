import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-12 text-center dark:border-rose-500/20 dark:bg-rose-500/5">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
        <AlertTriangle size={20} aria-hidden="true" />
      </span>
      <h2 className="text-sm font-semibold text-ink">Something went wrong</h2>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-muted">{message}</p>
      {onRetry ? (
        <button type="button" className="btn-secondary mt-5" onClick={onRetry}>
          <RotateCcw size={15} />
          Try again
        </button>
      ) : null}
    </div>
  );
}
