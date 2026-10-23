import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import TaskModal from './TaskModal';
import { useTaskStore } from '../context/TaskContext';

const SIDEBAR_KEY = 'taskflow.sidebar';

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

export default function AppLayout() {
  const location = useLocation();
  const { modal } = useTaskStore();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? 'collapsed' : 'expanded');
    } catch {
      /* storage may be unavailable */
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-bg">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-card transition-[width] duration-200 lg:block ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />
      </aside>

      <div className="lg:hidden">
        <div className={`fixed inset-0 z-50 ${mobileOpen ? '' : 'pointer-events-none'}`}>
          <div
            className={`absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 ${
              mobileOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-card shadow-pop transition-transform duration-200 ${
              mobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            {...(mobileOpen
              ? { role: 'dialog', 'aria-modal': true, 'aria-label': 'Navigation' }
              : { 'aria-hidden': true })}
          >
            {mobileOpen ? <Sidebar mobile onClose={() => setMobileOpen(false)} /> : null}
          </aside>
        </div>
      </div>

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <TaskModal
        key={modal ? `${modal.type}-${modal.task?._id || 'new'}` : 'closed'}
        open={Boolean(modal)}
        task={modal?.task}
      />
    </div>
  );
}
