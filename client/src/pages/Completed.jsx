import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SearchSortBar from '../components/SearchSortBar';
import TaskListView from '../components/TaskListView';
import EmptyState from '../components/EmptyState';
import { useTasksQuery } from '../hooks/useTasksQuery';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export default function Completed() {
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, 300);

  const query = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      status: 'Completed',
      sort: 'updated',
    }),
    [debouncedSearch]
  );

  const { tasks, count, loading, error, retry } = useTasksQuery(query);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Completed"
        description="Everything you've finished — recently completed tasks first. Reopen any task at any time."
      />

      <SearchSortBar
        search={searchText}
        onSearchChange={setSearchText}
        placeholder="Search completed tasks"
      />

      <p className="px-1 text-[12px] text-muted" aria-live="polite">
        {loading ? 'Loading tasks…' : `${count} completed ${count === 1 ? 'task' : 'tasks'}`}
      </p>

      <TaskListView
        tasks={tasks}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyState={
          <EmptyState
            icon={CheckCircle2}
            title="No completed tasks yet"
            description="Check off a task and it will land here. Completed tasks can always be reopened."
          />
        }
        skeletonCount={3}
      />
    </div>
  );
}
