import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCheck, ChevronRight, Menu, Plus, Search, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTaskStore } from '../context/TaskContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tasks': 'All Tasks',
  '/today': 'Today',
  '/upcoming': 'Upcoming',
  '/completed': 'Completed',
  '/categories': 'Categories',
  '/settings': 'Settings',
};

function titleFor(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES).find((path) => pathname.startsWith(`${path}/`));
  return match ? PAGE_TITLES[match] : 'TaskFlow';
}

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { openCreate } = useTaskStore();
  const [search, setSearch] = useState('');
  const pageTitle = titleFor(location.pathname);

  useEffect(() => {
    if (location.pathname === '/tasks') {
      const query = new URLSearchParams(location.search);
      setSearch(query.get('search') || '');
    }
  }, [location.pathname, location.search]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/tasks?search=${encodeURIComponent(term)}` : '/tasks');
  };

  const clearSearch = () => {
    setSearch('');
    if (location.pathname === '/tasks' && location.search) navigate('/tasks');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="icon-btn h-9 w-9 rounded-xl border border-line bg-card lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <Link
          to="/dashboard"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-ink transition-opacity hover:opacity-90"
          aria-label="TaskFlow home"
        >
          <CheckCheck size={16} strokeWidth={2.6} aria-hidden="true" />
        </Link>

        <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <span className="hidden text-muted sm:inline">Workspace</span>
          <ChevronRight size={13} className="hidden text-muted/60 sm:inline" aria-hidden="true" />
          <span className="truncate font-medium text-ink">{pageTitle}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <form onSubmit={handleSubmit} role="search" className="relative hidden md:block">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks…"
              aria-label="Search all tasks"
              className="input h-9 w-48 pl-9 pr-8 text-[13px] lg:w-64"
            />
            {search ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-ink"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            ) : null}
          </form>

          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="icon-btn h-9 w-9 rounded-xl border border-line bg-card md:hidden"
            aria-label="Search tasks"
          >
            <Search size={17} />
          </button>

          <ThemeToggle />

          <button
            type="button"
            className="btn-primary h-9"
            onClick={openCreate}
            aria-label="Create a new task"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New task</span>
          </button>
        </div>
      </div>
    </header>
  );
}
