import { ChevronDown, Search } from 'lucide-react';
import { SORT_OPTIONS } from '../utils/taskMeta';

export default function SearchSortBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  placeholder = 'Search tasks',
  sortOptions = SORT_OPTIONS,
}) {
  return (
    <div className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          className="input pl-9 text-[13px]"
          placeholder={placeholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search tasks"
        />
      </div>

      {onSortChange ? (
        <div className="relative sm:w-48">
          <select
            className="select text-[13px]"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label="Sort tasks"
          >
            {sortOptions.map((option) => (
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
      ) : null}
    </div>
  );
}
