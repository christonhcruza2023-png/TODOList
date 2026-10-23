import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const TONES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-500 dark:text-rose-400',
    bar: 'bg-rose-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-accent',
    bar: 'bg-accent',
  },
};

export default function Toast({ toast, onDismiss }) {
  const tone = TONES[toast.type] || TONES.info;
  const Icon = tone.icon;

  return (
    <div
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-line bg-card px-3.5 py-3 shadow-soft animate-toast-in"
      role="status"
    >
      <span className={`mt-0.5 h-5 w-1 shrink-0 rounded-full ${tone.bar}`} aria-hidden="true" />
      <Icon size={17} className={`mt-0.5 shrink-0 ${tone.iconClass}`} aria-hidden="true" />
      <p className="min-w-0 flex-1 text-[13px] leading-5 text-ink">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="-mr-1 -mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
