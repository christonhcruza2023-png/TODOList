export function TaskSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <div className="skeleton h-5 w-5 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="skeleton h-3.5 w-2/5" />
          <div className="skeleton h-3 w-4/5" />
          <div className="flex gap-2 pt-1">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskSkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <TaskSkeleton key={index} />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-6 w-12" />
            </div>
            <div className="skeleton h-9 w-9 rounded-xl" />
          </div>
          <div className="skeleton mt-3 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-line p-3">
          <div className="skeleton h-4 w-4 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
