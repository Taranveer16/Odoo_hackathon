import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
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
  Search,
  Truck,
  User,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { USE_MOCK } from '../mocks/mockStore';
import { getTrips } from '../services/tripService';
import { getVehicles } from '../services/vehicleService';
import { getDrivers } from '../services/driverService';
import type { Role, Trip, Vehicle, Driver } from '../types';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  roles: Role[];
  badge?: string;
}

const navItems: NavItem[] = [
  {
    path: '/app/trips',
    icon: Navigation,
    label: 'Trip Dispatcher',
    roles: ['fleet_manager', 'dispatcher', 'safety_officer'],
  },
  {
    path: '/app/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['fleet_manager', 'dispatcher', 'financial_analyst'],
  },
  {
    path: '/app/fleet',
    icon: Car,
    label: 'Fleet Management',
    roles: ['fleet_manager', 'dispatcher', 'financial_analyst'],
  },
  {
    path: '/app/drivers',
    icon: Users,
    label: 'Drivers',
    roles: ['fleet_manager', 'dispatcher'],
  },
  {
    path: '/app/maintenance',
    icon: Wrench,
    label: 'Maintenance',
    roles: ['fleet_manager'],
  },
  {
    path: '/app/fuel',
    icon: Fuel,
    label: 'Fuel & Expense',
    roles: ['fleet_manager', 'financial_analyst'],
  },
  {
    path: '/app/analytics',
    icon: BarChart3,
    label: 'Analytics',
    roles: ['fleet_manager', 'financial_analyst'],
  },
  {
    path: '/app/settings',
    icon: Settings,
    label: 'Settings',
    roles: ['fleet_manager'],
  },
];

const roleLabels: Record<Role, string> = {
  fleet_manager: 'Fleet Manager',
  dispatcher: 'Dispatcher',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
  cargo_control_officer: 'Cargo Control Officer',
};

const roleInitials: Record<Role, string> = {
  fleet_manager: 'FM',
  dispatcher: 'DS',
  safety_officer: 'SO',
  financial_analyst: 'FA',
  cargo_control_officer: 'CCO',
};

const roleColors: Record<Role, string> = {
  fleet_manager: 'text-accent',
  dispatcher: 'text-info',
  safety_officer: 'text-success',
  financial_analyst: 'text-warning',
  cargo_control_officer: 'text-purple-400',
};

const STATUS_COLORS: Record<string, string> = {
  delivered: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  trip_closed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  in_transit: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  en_route: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  dispatched: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  departed: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  delayed: 'text-red-400 bg-red-400/10 border-red-400/30',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/30',
  waiting: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  draft: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  out_for_delivery: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

function humanStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AppLayout() {
  const { user, logout, switchRole, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTripSearch, setActiveTripSearch] = useState('');
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
    enabled: !!user,
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
    enabled: !!user,
  });
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: getDrivers,
    enabled: !!user,
  });

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const driverMap = Object.fromEntries(drivers.map(d => [d.id, d]));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeTrips = trips.filter(t => !['delivered', 'trip_closed', 'cancelled', 'draft'].includes(t.status));
  const filteredActiveTrips = activeTrips.filter(t => {
    const v = vehicleMap[t.vehicleId];
    const d = driverMap[t.driverId];
    const query = activeTripSearch.toLowerCase();
    return (
      t.id.toLowerCase().includes(query) ||
      t.source.toLowerCase().includes(query) ||
      t.destination.toLowerCase().includes(query) ||
      (v && v.registrationNumber.toLowerCase().includes(query)) ||
      (d && d.name.toLowerCase().includes(query))
    );
  });

  const selectedTripId = searchParams.get('id');

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full bg-[#09090e] border-r border-white/5">
      {/* Header / Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <Link
          to="/"
          className="w-8 h-8 rounded-xl bg-accent text-surface flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-lg shadow-accent/20"
          title="Back to Landing Page"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-surface stroke-[2.5]" />
        </Link>
        {(!collapsed || mobile) && (
          <span className="text-base font-black text-white tracking-tight">
            Transit<span className="text-accent">Ops</span>
          </span>
        )}
      </div>

      {/* Dynamic Profile Widget */}
      {user && (
        <div className={`px-3 py-3 border-b border-white/5 ${collapsed && !mobile ? 'flex justify-center' : ''}`}>
          {(!collapsed || mobile) ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/3 border border-white/5 shadow-inner">
              <div className="w-10 h-10 rounded-lg bg-accent text-surface flex items-center justify-center shrink-0 font-black text-sm select-none shadow-md shadow-accent/15">
                {roleInitials[user.role] || 'US'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate leading-tight select-none">
                  {roleLabels[user.role]}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 select-none">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-lg bg-accent text-surface flex items-center justify-center font-black text-xs select-none hover:scale-105 transition-transform cursor-pointer shadow-md shadow-accent/15"
              title={`${roleLabels[user.role]} (${user.email})`}
            >
              {roleInitials[user.role] || 'US'}
            </div>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav className={`px-2.5 py-3 space-y-1 overflow-y-auto ${(!collapsed || mobile) ? 'h-[36vh]' : 'flex-1'}`}>
        {navItems
          .filter((item) => !user || item.roles.includes(user.role))
          .map(({ path, icon: Icon, label }) => {
            const isItemActive = location.pathname === path;
            const badgeValue = label === 'Alerts' ? '3' : undefined;

            return (
              <NavLink
                key={path}
                to={path}
                onClick={() => mobile && setMobileOpen(false)}
                className={`sidebar-item flex items-center gap-3 py-2 px-3 rounded-lg font-bold text-xs transition-all duration-200 ${
                  isItemActive
                    ? 'bg-accent/15 text-accent border border-accent/20 font-bold shadow-sm shadow-accent/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/3 border border-transparent'
                } ${collapsed && !mobile ? 'justify-center px-2' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isItemActive ? 'text-accent' : 'text-slate-400'}`} />
                {(!collapsed || mobile) && (
                  <span className="truncate flex-1">{label}</span>
                )}
                {badgeValue && (!collapsed || mobile) && (
                  <span className="bg-accent/25 border border-accent/40 text-accent font-black text-[9px] px-1.5 py-0.5 rounded-full">
                    {badgeValue}
                  </span>
                )}
              </NavLink>
            );
          })}
      </nav>

      {/* Active Trips Widget (Dispatcher / Fleet Manager only) */}
      {(!collapsed || mobile) && (user?.role === 'dispatcher' || user?.role === 'fleet_manager') && (
        <div className="flex-1 border-t border-white/5 flex flex-col min-h-0 overflow-hidden bg-black/10">
          <div className="px-4 pt-3.5 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Trips ({activeTrips.length})</span>
              <button
                onClick={() => navigate('/app/trips')}
                className="text-[10px] font-black text-accent hover:text-accent-light"
              >
                View All
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input
                type="text"
                placeholder="Search active trips..."
                value={activeTripSearch}
                onChange={(e) => setActiveTripSearch(e.target.value)}
                className="w-full bg-[#14141c] border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-accent/40"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin">
            {filteredActiveTrips.length === 0 ? (
              <p className="text-[10px] text-slate-600 text-center py-4">No active trips match</p>
            ) : (
              filteredActiveTrips.map((trip) => {
                const isSelected = location.pathname.startsWith('/app/trips') && selectedTripId === trip.id;
                const v = vehicleMap[trip.vehicleId];
                const d = driverMap[trip.driverId];

                return (
                  <button
                    key={trip.id}
                    onClick={() => navigate(`/app/trips?id=${trip.id}`)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all duration-150 flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-accent/8 border-accent/30 shadow-lg shadow-accent/5'
                        : 'bg-[#0f0f16]/40 border-white/4 hover:bg-[#0f0f16]/80 hover:border-white/8'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className={`text-[10px] font-bold truncate leading-tight ${isSelected ? 'text-accent' : 'text-slate-200'}`}>
                          {trip.source.split(',')[0]} → {trip.destination.split(',')[0]}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{trip.id}</p>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${STATUS_COLORS[trip.status] ?? 'text-slate-400 bg-white/5 border-white/10'}`}>
                        {humanStatus(trip.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium"><Truck className="w-2.5 h-2.5 text-slate-600" />{v?.registrationNumber ?? '—'}</span>
                      <span className="flex items-center gap-1 font-medium"><User className="w-2.5 h-2.5 text-slate-600" />{d?.name?.split(' ')[0] ?? '—'}</span>
                      {trip.progressPercent && <span>{trip.progressPercent}%</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Dev role switcher */}
      {USE_MOCK && (!collapsed || mobile) && user && (
        <div className="px-3.5 py-3.5 border-t border-white/5 bg-[#0a0a0f] shrink-0">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2 px-0.5">
            Demo: Switch Role
          </p>
          <div className="grid grid-cols-2 gap-1">
            {(Object.keys(roleLabels) as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  switchRole(r);
                  if (r === 'cargo_control_officer') {
                    const updatedUser = { ...user!, role: r, assignedWarehouseId: user?.assignedWarehouseId || 'wh-001' };
                    setUser(updatedUser);
                    navigate('/cco/dashboard');
                  }
                }}
                className={`text-[9px] font-black px-1.5 py-1 rounded border transition-all duration-200 truncate text-center ${
                  user.role === r
                    ? `bg-accent/15 border-accent/30 text-accent`
                    : 'bg-white/2 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'
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
        <div className={`px-3 py-2.5 border-t border-white/5 shrink-0 ${collapsed && !mobile ? 'flex justify-center' : ''}`}>
          {(!collapsed || mobile) ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white/4 border border-white/6 flex items-center justify-center text-slate-400 text-[10px] font-black select-none">
                  {user.name[0]}
                </div>
                <span className="text-[10px] font-black text-slate-400 truncate max-w-[80px] select-none">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors flex items-center gap-1 text-[10px] font-bold"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
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
    <div className="flex h-screen bg-[#07070c] overflow-hidden text-slate-200">
      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-[#09090e] border-r border-white/5 relative shrink-0"
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-[#0d0d12] border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/10 transition-colors z-10 shadow-lg shadow-black/40"
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
              className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#09090e] border-r border-white/5 flex flex-col"
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-white/5 bg-[#0d0d12]/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/3"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Logo text for mobile */}
            <span className="lg:hidden text-sm font-black text-white">
              Transit<span className="text-accent">Ops</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/3 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} /> : <Moon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />}
            </button>

            {/* Notification bell */}
            <button className="text-slate-400 hover:text-white p-2 relative rounded-lg hover:bg-white/3" aria-label="Notifications">
              <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-accent" />
            </button>
            {/* User avatar */}
            {user && (
              <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center font-black text-xs text-accent select-none">
                {user.name[0]}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#08080d]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
