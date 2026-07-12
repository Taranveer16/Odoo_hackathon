import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
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
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';

const allRoles: Role[] = ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'];

const navItems: { path: string; icon: typeof LayoutDashboard; label: string; roles: Role[] }[] = [
  { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: allRoles },
  { path: '/app/fleet', icon: Car, label: 'Fleet', roles: ['fleet_manager'] },
  { path: '/app/drivers', icon: Users, label: 'Drivers', roles: ['fleet_manager', 'safety_officer'] },
  { path: '/app/trips', icon: Navigation, label: 'Trips', roles: ['fleet_manager', 'dispatcher'] },
  { path: '/app/maintenance', icon: Wrench, label: 'Maintenance', roles: ['fleet_manager'] },
  { path: '/app/fuel', icon: Fuel, label: 'Fuel & Expenses', roles: ['fleet_manager', 'financial_analyst'] },
  { path: '/app/analytics', icon: BarChart3, label: 'Analytics', roles: ['fleet_manager', 'financial_analyst'] },
  { path: '/app/settings', icon: Settings, label: 'Settings', roles: allRoles },
];

const pageCtaMap: Record<string, string> = {
  '/app/fleet': '+ Add Vehicle',
  '/app/drivers': '+ Add Driver',
  '/app/trips': '+ Log Trip',
  '/app/maintenance': '+ Log Service',
  '/app/fuel': '+ Log Fuel',
};

const roleLabels: Record<Role, string> = {
  fleet_manager: 'Fleet Manager',
  dispatcher: 'Dispatcher',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
};

const roleColors: Record<Role, string> = {
  fleet_manager: 'text-accent',
  dispatcher: 'text-info',
  safety_officer: 'text-success',
  financial_analyst: 'text-warning',
};

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-border ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Truck style={{ width: 16, height: 16 }} className="text-surface" />
        </div>
        {(!collapsed || mobile) && (
          <span className="text-base font-bold text-primary whitespace-nowrap">
            Transit<span className="text-accent">Ops</span>
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.filter(({ roles }) => !user || roles.includes(user.role)).map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''} ${collapsed && !mobile ? 'justify-center px-2' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-accent' : ''}`} style={{ width: 18, height: 18 }} />
                {(!collapsed || mobile) && (
                  <span className="truncate">{label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className={`px-3 py-3 border-t border-border ${collapsed && !mobile ? 'flex justify-center' : ''}`}>
          {(!collapsed || mobile) ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-subtle border border-accent/30 flex items-center justify-center shrink-0">
                <span className="text-accent text-xs font-bold">{user.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">{user.name}</p>
                <p className={`text-2xs font-semibold ${roleColors[user.role]}`}>
                  {roleLabels[user.role]}
                </p>
              </div>
              <button onClick={handleLogout} className="text-muted hover:text-danger transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="text-muted hover:text-danger transition-colors" title="Sign out">
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
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-panel border-r border-border relative shrink-0"
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-panel border border-border flex items-center justify-center text-muted hover:text-primary hover:border-border-2 transition-colors z-10"
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
              <div className="w-8 h-8 rounded-full bg-accent-subtle border border-accent/30 flex items-center justify-center">
                <span className="text-accent text-xs font-bold">{user.name[0]}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
