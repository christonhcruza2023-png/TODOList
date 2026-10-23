import { ChevronDown, Search, X } from 'lucide-react';
import { CATEGORIES, PRIORITIES, SORT_OPTIONS, STATUSES } from '../utils/taskMeta';

const DUE_OPTIONS = [
  { value: 'today', label: 'Due today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
];

function SelectField({ label, value, options, placeholder, onChange }) {
  return (
    <div className="relative min-w-0">
      <select
        className="select truncate text-[13px]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
  );
}

export default function FilterBar({
  filters,
  onChange,
  onClear,
  sort,
  onSortChange,
  showDueFilter = true,
}) {
  const active =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.priority) ||
    Boolean(filters.category) ||
    Boolean(filters.due);

  const selectOptions = [
    {
      label: 'Filter by status',
      placeholder: 'All statuses',
      value: filters.status || '',
      key: 'status',
      options: STATUSES.map((status) => ({ value: status, label: status })),
    },
    {
      label: 'Filter by priority',
      placeholder: 'All priorities',
      value: filters.priority || '',
      key: 'priority',
      options: PRIORITIES.map((priority) => ({ value: priority, label: priority })),
    },
    {
      label: 'Filter by category',
      placeholder: 'All categories',
      value: filters.category || '',
      key: 'category',
      options: CATEGORIES.map((category) => ({ value: category, label: category })),
    },
    ...(showDueFilter
      ? [
          {
            label: 'Filter by due date',
            placeholder: 'Any due date',
            value: filters.due || '',
            key: 'due',
            options: DUE_OPTIONS,
          },
        ]
      : []),
  ];

  return (
    <div className="card p-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-7">
        <div className="relative col-span-2 min-w-0">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            className="input pl-9 text-[13px]"
            placeholder="Search tasks by title or description"
            value={filters.search || ''}
            onChange={(event) => onChange({ search: event.target.value })}
            aria-label="Search tasks"
          />
        </div>

        {selectOptions.map((field) => (
          <SelectField
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={field.value}
            options={field.options}
            onChange={(value) => onChange({ [field.key]: value })}
          />
        ))}

        <SelectField
          label="Sort tasks"
          placeholder="Newest first"
          value={sort}
          options={SORT_OPTIONS}
          onChange={onSortChange}
        />
      </div>

      {active ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <X size={13} aria-hidden="true" />
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
