import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Car,
  Users,
  Navigation,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { USE_MOCK } from '../mocks/mockStore';
import type { Role } from '../types';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    path: '/app/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard & KPIs',
    roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'],
  },
  {
    path: '/app/fleet',
    icon: Car,
    label: 'Vehicle Registry',
    roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'],
  },
  {
    path: '/app/drivers',
    icon: Users,
    label: 'Driver & Safety Profiles',
    roles: ['fleet_manager', 'dispatcher', 'safety_officer'],
  },
  {
    path: '/app/trips',
    icon: Navigation,
    label: 'Trip Dispatcher',
    roles: ['fleet_manager', 'dispatcher', 'safety_officer'],
  },
  {
    path: '/app/maintenance',
    icon: Wrench,
    label: 'Maintenance Workflow',
    roles: ['fleet_manager'],
  },
  {
    path: '/app/fuel',
    icon: Fuel,
    label: 'Fuel & Expense Tracking',
    roles: ['fleet_manager', 'financial_analyst'],
  },
  {
    path: '/app/analytics',
    icon: BarChart3,
    label: 'Reports & Analytics',
    roles: ['fleet_manager', 'financial_analyst'],
  },
  {
    path: '/app/settings',
    icon: Settings,
    label: 'RBAC & Settings',
    roles: ['fleet_manager'],
  },
];

const roleLabels: Record<Role, string> = {
  fleet_manager: 'Fleet Manager',
  dispatcher: 'Dispatcher',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
};

const roleInitials: Record<Role, string> = {
  fleet_manager: 'FM',
  dispatcher: 'DS',
  safety_officer: 'SO',
  financial_analyst: 'FA',
};

const roleColors: Record<Role, string> = {
  fleet_manager: 'text-accent',
  dispatcher: 'text-info',
  safety_officer: 'text-success',
  financial_analyst: 'text-warning',
};

export default function AppLayout() {
  const { user, logout, switchRole } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Header / Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-border ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <Link
          to="/"
          className="w-9 h-9 rounded-xl bg-accent text-surface flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-lg shadow-accent/20"
          title="Back to Landing Page"
        >
          <ArrowLeft className="w-5 h-5 text-surface stroke-[2.5]" />
        </Link>
        {(!collapsed || mobile) && (
          <span className="text-lg font-black text-primary tracking-tight">
            Transit<span className="text-accent">Ops</span>
          </span>
        )}
      </div>

      {/* Dynamic Profile Widget */}
      {user && (
        <div className={`px-4 py-4 border-b border-border ${collapsed && !mobile ? 'flex justify-center' : ''}`}>
          {(!collapsed || mobile) ? (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border/80 shadow-inner">
              <div className="w-12 h-12 rounded-xl bg-accent text-surface flex items-center justify-center shrink-0 font-black text-base select-none shadow-md shadow-accent/15">
                {roleInitials[user.role] || 'US'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-primary truncate leading-tight select-none">
                  {roleLabels[user.role]}
                </p>
                <p className="text-2xs text-muted truncate mt-1 font-medium select-none">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-xl bg-accent text-surface flex items-center justify-center font-black text-sm select-none hover:scale-105 transition-transform cursor-pointer shadow-md shadow-accent/15"
              title={`${roleLabels[user.role]} (${user.email})`}
            >
              {roleInitials[user.role] || 'US'}
            </div>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems
          .filter((item) => !user || item.roles.includes(user.role))
          .map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => mobile && setMobileOpen(false)}
              className={({ isActive }) =>
                `sidebar-item flex items-center gap-3 py-3 px-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-accent/15 text-accent border border-accent/20 font-bold shadow-sm shadow-accent/5'
                    : 'text-secondary hover:text-primary hover:bg-panel-2 border border-transparent'
                } ${collapsed && !mobile ? 'justify-center px-2' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-accent' : 'text-secondary'}`} />
                  {(!collapsed || mobile) && (
                    <span className="truncate">{label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
      </nav>

      {/* Dev role switcher */}
      {USE_MOCK && (!collapsed || mobile) && user && (
        <div className="px-4 py-3.5 border-t border-border bg-panel-2/40">
          <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-2 px-1">
            Demo: Switch Role
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(roleLabels) as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`text-[10px] px-2 py-1.5 rounded-lg text-left border transition-all duration-200 truncate ${
                  user.role === r
                    ? `bg-accent/15 border-accent/30 text-accent font-bold`
                    : 'bg-surface border-border text-muted hover:border-border-2 hover:text-secondary'
                }`}
              >
                {roleInitials[r]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User section / Logout */}
      {user && (
        <div className={`px-4 py-3 border-t border-border ${collapsed && !mobile ? 'flex justify-center' : ''}`}>
          {(!collapsed || mobile) ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-panel-2 border border-border flex items-center justify-center text-primary text-xs font-bold select-none">
                  {user.name[0]}
                </div>
                <span className="text-xs font-bold text-secondary truncate max-w-[100px] select-none">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger/10 transition-colors flex items-center gap-1.5 text-xs font-bold"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-muted hover:text-danger p-2.5 rounded-xl hover:bg-danger/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-panel border-r border-border relative shrink-0"
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-panel border border-border flex items-center justify-center text-muted hover:text-primary hover:border-border-2 transition-colors z-10 shadow-sm"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* ── Mobile Sidebar ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-panel border-r border-border flex flex-col"
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-border bg-panel/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden btn-ghost p-1.5"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Search */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search fleet, drivers, trips…"
                className="input text-sm py-1.5 pl-3 pr-4 w-56 bg-surface border-border/60"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button className="btn-ghost p-2 relative" aria-label="Notifications">
              <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>
            {/* User avatar */}
            {user && (
              <div className="w-8 h-8 rounded-full bg-accent-subtle border border-accent/30 flex items-center justify-center font-bold text-xs text-accent select-none">
                {user.name[0]}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
