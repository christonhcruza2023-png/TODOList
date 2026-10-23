import { useMemo, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SearchSortBar from '../components/SearchSortBar';
import TaskListView from '../components/TaskListView';
import EmptyState from '../components/EmptyState';
import { useTasksQuery } from '../hooks/useTasksQuery';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useTaskStore } from '../context/TaskContext';
import { dayBounds } from '../utils/dates';

export default function Upcoming() {
  const { openCreate } = useTaskStore();
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState('dueDate');
  const debouncedSearch = useDebouncedValue(searchText, 300);
  const { end } = useMemo(() => dayBounds(), []);

  const query = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      sort,
      dueFrom: end.toISOString(),
      status: 'Pending,In Progress',
    }),
    [debouncedSearch, sort, end]
  );

  const { tasks, count, loading, error, retry } = useTasksQuery(query);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Upcoming"
        description="Open tasks with future due dates, ordered by when they need you."
      >
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          New task
        </button>
      </PageHeader>

      <SearchSortBar
        search={searchText}
        onSearchChange={setSearchText}
        sort={sort}
        onSortChange={setSort}
        placeholder="Search upcoming tasks"
      />

      <p className="px-1 text-[12px] text-muted" aria-live="polite">
        {loading ? 'Loading tasks…' : `${count} upcoming ${count === 1 ? 'task' : 'tasks'}`}
      </p>

      <TaskListView
        tasks={tasks}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyState={
          <EmptyState
            icon={CalendarDays}
            title="Nothing coming up"
            description="No open tasks with a future due date. Set a due date on a task to plan ahead."
            action={
              <button type="button" className="btn-primary" onClick={openCreate}>
                <Plus size={16} aria-hidden="true" />
                Plan a task
              </button>
            }
          />
        }
        skeletonCount={3}
      />
    </div>
  );
}
