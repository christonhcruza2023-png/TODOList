import { useMemo, useState } from 'react';
import { CalendarCheck, Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SearchSortBar from '../components/SearchSortBar';
import TaskListView from '../components/TaskListView';
import EmptyState from '../components/EmptyState';
import { useTasksQuery } from '../hooks/useTasksQuery';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useTaskStore } from '../context/TaskContext';
import { dayBounds } from '../utils/dates';

export default function Today() {
  const { openCreate } = useTaskStore();
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState('priority');
  const debouncedSearch = useDebouncedValue(searchText, 300);
  const { start, end } = useMemo(() => dayBounds(), []);

  const query = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      sort,
      dueFrom: start.toISOString(),
      dueTo: end.toISOString(),
      includeOverdue: 'true',
    }),
    [debouncedSearch, sort, start, end]
  );

  const { tasks, count, loading, error, retry } = useTasksQuery(query);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Today"
        description="Everything due today, plus anything still waiting on you from earlier."
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
        placeholder="Search today's tasks"
      />

      <p className="px-1 text-[12px] text-muted" aria-live="polite">
        {loading ? 'Loading tasks…' : `${count} ${count === 1 ? 'task' : 'tasks'} on your plate`}
      </p>

      <TaskListView
        tasks={tasks}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyState={
          <EmptyState
            icon={CalendarCheck}
            title="Today looks clear"
            description="Nothing is due today and nothing is overdue. Add a task or enjoy the breathing room."
            action={
              <button type="button" className="btn-primary" onClick={openCreate}>
                <Plus size={16} aria-hidden="true" />
                Add a task for today
              </button>
            }
          />
        }
        skeletonCount={3}
      />
    </div>
  );
}
