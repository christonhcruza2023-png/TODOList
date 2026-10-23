import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Inbox, Plus, SearchX, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import TaskListView from '../components/TaskListView';
import EmptyState from '../components/EmptyState';
import { useTasksQuery } from '../hooks/useTasksQuery';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useTaskStore } from '../context/TaskContext';
import { usePreferences } from '../context/PreferencesContext';
import { dayBounds } from '../utils/dates';

const EMPTY_FILTERS = { status: '', priority: '', category: '', due: '' };

function dueFilterParams(due, start, end) {
  if (due === 'today') {
    return { dueFrom: start.toISOString(), dueTo: end.toISOString() };
  }
  if (due === 'overdue') {
    return { dueFrom: start.toISOString(), overdue: 'true' };
  }
  if (due === 'upcoming') {
    return { dueFrom: end.toISOString() };
  }
  return {};
}

export default function AllTasks() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const { preferences } = usePreferences();
  const { openCreate } = useTaskStore();

  const [searchText, setSearchText] = useState(urlSearch);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState(preferences.defaultSort);
  const debouncedSearch = useDebouncedValue(searchText, 300);
  const { start, end } = useMemo(() => dayBounds(), []);

  useEffect(() => {
    setSearchText(urlSearch);
  }, [urlSearch]);

  const query = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      status: filters.status,
      priority: filters.priority,
      category: filters.category,
      sort,
      ...dueFilterParams(filters.due, start, end),
    }),
    [debouncedSearch, filters, sort, start, end]
  );

  const { tasks, count, loading, error, retry } = useTasksQuery(query);

  const hasFilters = Boolean(
    debouncedSearch.trim() || filters.status || filters.priority || filters.category || filters.due
  );

  const updateFilters = (patch) => setFilters((current) => ({ ...current, ...patch }));

  const clearFilters = () => {
    setSearchText('');
    setFilters(EMPTY_FILTERS);
  };

  const emptyState = hasFilters ? (
    <EmptyState
      icon={SearchX}
      title="No tasks match these filters"
      description="Try a different search term, or clear your filters to see everything again."
      action={
        <button type="button" className="btn-secondary" onClick={clearFilters}>
          <X size={15} aria-hidden="true" />
          Clear filters
        </button>
      }
    />
  ) : (
    <EmptyState
      icon={Inbox}
      title="No tasks yet"
      description="Create your first task and it will appear here, ready to organize."
      action={
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Create task
        </button>
      }
    />
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="All Tasks"
        description="Every task in one place. Search, filter, and sort to find exactly what matters."
      >
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          New task
        </button>
      </PageHeader>

      <FilterBar
        filters={{ ...filters, search: searchText }}
        onChange={(patch) => {
          if ('search' in patch) setSearchText(patch.search);
          else updateFilters(patch);
        }}
        onClear={clearFilters}
        sort={sort}
        onSortChange={setSort}
      />

      <p className="px-1 text-[12px] text-muted" aria-live="polite">
        {loading
          ? 'Loading tasks…'
          : `${count} ${count === 1 ? 'task' : 'tasks'}${hasFilters ? ' matching your filters' : ' in total'}`}
      </p>

      <TaskListView
        tasks={tasks}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyState={emptyState}
        skeletonCount={5}
      />
    </div>
  );
}
