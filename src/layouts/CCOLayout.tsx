import { useState } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, Package, History, Warehouse, Bell, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { mockStore, USE_MOCK } from '../mocks/mockStore';
import type { Role } from '../types';

export default function CCOLayout() {
  const { user, logout, switchRole, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showInfo, setShowInfo] = useState(false);

  const warehouse = user?.assignedWarehouseId
    ? mockStore.getWarehouse(user.assignedWarehouseId)
    : null;

  const handleLogout = () => {
    logout();
    navigate('/cco/login');
  };

  const tabs = [
    { path: '/cco/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/cco/trips', icon: Package, label: 'My Trips' },
    { path: '/cco/history', icon: History, label: 'History' },
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-[#07070c] text-slate-200 relative">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-[#0d0d18]/95 backdrop-blur border-b border-white/5 px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent text-black flex items-center justify-center font-black text-sm shadow-lg shadow-accent/30">
              T
            </div>
            <div>
              <span className="text-sm font-black text-white">Transit<span className="text-accent">Ops</span></span>
              <span className="text-[10px] text-slate-500 block">CCO Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
              <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent" />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center font-black text-xs text-accent">
                {user?.name?.[0] ?? 'C'}
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showInfo ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Warehouse banner */}
        {warehouse && (
          <div className="flex items-center gap-2 pb-2.5 -mt-1">
            <Warehouse className="w-3.5 h-3.5 text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">{warehouse.name}</p>
              <p className="text-[9px] text-slate-500 truncate">{warehouse.location}</p>
            </div>
          </div>
        )}
      </header>

      {/* User dropdown */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-[88px] right-4 z-50 w-56 bg-[#14141f] border border-white/10 rounded-2xl shadow-2xl p-3 space-y-2"
          >
            <div className="px-1">
              <p className="text-xs font-black text-white">{user?.name}</p>
              <p className="text-[10px] text-slate-500">{user?.email}</p>
              <p className="text-[10px] text-accent mt-0.5">Cargo Control Officer</p>
            </div>
            <div className="border-t border-white/5 pt-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-2 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
            {USE_MOCK && (
              <div className="border-t border-white/5 pt-2 mt-2">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                  Demo: Switch Role
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {(['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'cargo_control_officer'] as Role[]).map((r) => {
                    const initials: Record<string, string> = {
                      fleet_manager: 'FM',
                      dispatcher: 'DS',
                      safety_officer: 'SO',
                      financial_analyst: 'FA',
                      cargo_control_officer: 'CCO',
                    };
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          if (r !== 'cargo_control_officer') {
                            navigate('/app/dashboard');
                          } else {
                            const updatedUser = { ...user!, role: r, assignedWarehouseId: user?.assignedWarehouseId || 'wh-001' };
                            setUser(updatedUser);
                          }
                          setShowInfo(false);
                        }}
                        className={`text-[8px] font-black py-1 px-0.5 rounded border transition-all truncate text-center ${
                          user?.role === r
                            ? `bg-accent/15 border-accent/30 text-accent`
                            : 'bg-white/2 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'
                        }`}
                      >
                        {initials[r]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdown */}
      {showInfo && (
        <div className="fixed inset-0 z-40" onClick={() => setShowInfo(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-[#0d0d18]/95 backdrop-blur border-t border-white/5 px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {tabs.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <NavLink
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-accent'
                    : 'text-slate-600 hover:text-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-accent/15' : ''
                }`}>
                  <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </div>
                <span className="text-[9px] font-black tracking-wide">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
