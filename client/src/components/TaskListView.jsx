import TaskCard from './TaskCard';
import { TaskSkeletonList } from './Skeletons';
import ErrorState from './ErrorState';

export default function TaskListView({ tasks, loading, error, onRetry, emptyState, skeletonCount = 4 }) {
  if (loading) return <TaskSkeletonList count={skeletonCount} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!tasks || tasks.length === 0) return emptyState;

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task._id} task={task} />
      ))}
    </div>
  );
}
