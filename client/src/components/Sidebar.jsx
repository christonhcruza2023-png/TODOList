import { NavLink } from 'react-router-dom';
import {
  CalendarCheck,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  LayoutDashboard,
  ListTodo,
  Settings,
  Shapes,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'All Tasks', icon: ListTodo },
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/upcoming', label: 'Upcoming', icon: CalendarDays },
  { to: '/completed', label: 'Completed', icon: CheckCircle2 },
  { to: '/categories', label: 'Categories', icon: Shapes },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed = false, mobile = false, onToggleCollapse, onClose }) {
  const showLabels = mobile || !collapsed;

  return (
    <nav className="flex h-full flex-col" aria-label="Main navigation">
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-4',
          !showLabels && 'justify-center px-0'
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-ink">
          <CheckCheck size={18} strokeWidth={2.6} aria-hidden="true" />
        </span>
        {showLabels ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-ink">ToDoList</p>
            <p className="truncate text-[11px] text-muted">Plan. Focus. Finish.</p>
          </div>
        ) : null}
        {mobile ? (
          <button
            type="button"
            className="icon-btn ml-auto"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {showLabels ? (
          <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">
            Workspace
          </p>
        ) : null}
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={mobile ? onClose : undefined}
                  title={showLabels ? undefined : item.label}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-colors',
                      showLabels ? 'justify-start gap-3 px-3' : 'justify-center px-0',
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted hover:bg-elevated hover:text-ink'
                    )
                  }
                >
                  <Icon size={18} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                  {showLabels ? <span className="truncate">{item.label}</span> : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="shrink-0 border-t border-line p-3">
        {showLabels ? (
          <div className="mb-3 rounded-xl border border-line bg-bg p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
              <Database size={12} aria-hidden="true" />
              Single-user demo
            </p>
            <p className="mt-1 text-[11px] leading-4 text-muted/80">
              Tasks are saved in MongoDB, not just this browser.
            </p>
          </div>
        ) : null}
        {!mobile ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium text-muted transition-colors hover:bg-elevated hover:text-ink',
              collapsed && 'justify-center px-0'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            {!collapsed ? <span>Collapse sidebar</span> : null}
          </button>
        ) : null}
      </div>
    </nav>
  );
}
