import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Warehouse, Eye, EyeOff, Loader2, ArrowRight, Shield } from 'lucide-react';
import { login } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';

export default function CCOLoginPage() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      if (user.role !== 'cargo_control_officer') {
        toast.error('Access Denied', 'This portal is for Cargo Control Officers only. Please use the main platform.');
        setLoading(false);
        return;
      }
      storeLogin(token, user);
      navigate('/cco/dashboard', { replace: true });
    } catch (err: any) {
      toast.error('Login failed', err.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { name: 'Jordan Mills', email: 'jordan.m@transitops.io', warehouse: 'Rockford Hub' },
    { name: 'Priya Nair', email: 'priya.n@transitops.io', warehouse: 'Madison Center' },
    { name: 'Sam Torres', email: 'sam.t@transitops.io', warehouse: 'La Crosse Hub' },
  ];

  return (
    <div className="min-h-screen bg-[#06060a] flex flex-col">
      {/* Top gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-20 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative z-10 max-w-sm mx-auto w-full">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-accent/10">
            <Warehouse className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-black text-white">CCO Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Cargo Control Officer Access</p>
          <div className="flex items-center justify-center gap-1.5 mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mx-auto w-fit">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400">Warehouse-Restricted Access</span>
          </div>
        </motion.div>

        {/* Login form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleLogin}
          className="w-full space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email / Username</label>
            <input
              type="email"
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-accent/50 focus:bg-white/6 transition-all"
              placeholder="officer@transitops.io"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-accent/50 focus:bg-white/6 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-accent hover:bg-accent/90 text-black font-black text-sm rounded-xl transition-all shadow-lg shadow-accent/25 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </motion.form>

        {/* Demo accounts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 w-full"
        >
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center mb-3">
            Demo Accounts (any password ≥ 3 chars)
          </p>
          <div className="space-y-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                onClick={() => { setEmail(acc.email); setPassword('demo'); }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white/3 border border-white/6 hover:border-accent/25 hover:bg-accent/5 rounded-xl transition-all group"
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-white group-hover:text-accent transition-colors">{acc.name}</p>
                  <p className="text-[10px] text-slate-500">{acc.warehouse}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-accent transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Back to main platform */}
        <p className="mt-8 text-[10px] text-slate-600 text-center">
          Dispatcher or Fleet Manager?{' '}
          <Link to="/login" className="text-accent font-bold hover:underline">
            Use the main platform →
          </Link>
        </p>
      </div>
    </div>
  );
}
