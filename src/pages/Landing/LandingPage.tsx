import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import {
  Truck,
  LayoutDashboard,
  Car,
  Users,
  Navigation,
  Wrench,
  Fuel,
  BarChart3,
  Shield,
  CheckCircle,
  ArrowRight,
  Zap,
  Clock,
  TrendingUp,
  MapPin,
  ChevronRight,
} from 'lucide-react';

// ─── Animated Count ─────────────────────────────────────────
function AnimatedCount({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 });
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) motionValue.set(target);
  }, [inView, motionValue, target]);

  useEffect(() => {
    return spring.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = prefix + Math.round(v).toLocaleString() + suffix;
      }
    });
  }, [spring, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// ─── Hero Route Animation ────────────────────────────────────
function HeroRouteAnimation() {
  return (
    <div className="relative w-full max-w-2xl mx-auto h-64 lg:h-80">
      <svg viewBox="0 0 600 240" className="w-full h-full" fill="none">
        {/* Grid dots */}
        {[...Array(6)].map((_, row) =>
          [...Array(10)].map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={col * 60 + 30}
              cy={row * 40 + 20}
              r="1.5"
              fill="#2A2B2E"
            />
          ))
        )}

        {/* Route path - dashed */}
        <path
          d="M 80 160 C 150 160 150 80 240 80 C 330 80 330 160 420 160 C 480 160 500 120 520 100"
          stroke="#2A2B2E"
          strokeWidth="2"
          strokeDasharray="8 6"
          fill="none"
        />
        {/* Animated dashed overlay */}
        <path
          d="M 80 160 C 150 160 150 80 240 80 C 330 80 330 160 420 160 C 480 160 500 120 520 100"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="8 6"
          fill="none"
          className="route-path"
          opacity="0.7"
        />

        {/* Origin pin */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
        >
          <circle cx="80" cy="160" r="10" fill="#052E16" stroke="#22C55E" strokeWidth="1.5" />
          <circle cx="80" cy="160" r="4" fill="#22C55E" />
          <motion.circle
            cx="80" cy="160" r="10"
            fill="none" stroke="#22C55E" strokeWidth="1"
            animate={{ r: [10, 18, 10], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        </motion.g>

        {/* Destination pin */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
        >
          <circle cx="520" cy="100" r="10" fill="#1C0D00" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="520" cy="100" r="4" fill="#F59E0B" />
          <motion.circle
            cx="520" cy="100" r="10"
            fill="none" stroke="#F59E0B" strokeWidth="1"
            animate={{ r: [10, 18, 10], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 1 }}
          />
        </motion.g>

        {/* Truck animating along path */}
        <motion.g
          animate={{
            offsetDistance: ['0%', '100%'],
          }}
          style={{ offsetPath: "path('M 80 160 C 150 160 150 80 240 80 C 330 80 330 160 420 160 C 480 160 500 120 520 100')" } as any}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
        >
          <rect x="-16" y="-10" width="28" height="18" rx="4" fill="#F59E0B" />
          <rect x="12" y="-8" width="12" height="16" rx="3" fill="#D97706" />
          <circle cx="-8" cy="8" r="4" fill="#0E0F11" />
          <circle cx="16" cy="8" r="4" fill="#0E0F11" />
          <rect x="14" y="-6" width="4" height="7" rx="1" fill="#FCD34D" opacity="0.6" />
        </motion.g>

        {/* Waypoint labels */}
        <text x="55" y="185" fill="#6B7280" fontSize="9" fontFamily="Inter, sans-serif">Atlanta, GA</text>
        <text x="498" y="120" fill="#6B7280" fontSize="9" fontFamily="Inter, sans-serif">Miami, FL</text>

        {/* Speed/KPI floating chips */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <rect x="200" y="30" width="90" height="28" rx="8" fill="#1A1B1E" stroke="#2A2B2E" strokeWidth="1" />
          <text x="216" y="48" fill="#22C55E" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600">● On Time</text>
        </motion.g>
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <rect x="320" y="175" width="100" height="28" rx="8" fill="#1A1B1E" stroke="#2A2B2E" strokeWidth="1" />
          <text x="336" y="193" fill="#F59E0B" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600">660 km route</text>
        </motion.g>
      </svg>
    </div>
  );
}

// ─── Feature Card ────────────────────────────────────────────
const features = [
  { icon: LayoutDashboard, title: 'Live Dashboard', desc: 'Real-time KPIs, fleet status overview, and trend analytics at a glance.' },
  { icon: Car, title: 'Vehicle Registry', desc: 'Centralized hub for all vehicle specs, odometer, and lifecycle status.' },
  { icon: Users, title: 'Driver Profiles', desc: 'Safety scores, license tracking with expiry alerts, and status management.' },
  { icon: Navigation, title: 'Trip Dispatcher', desc: 'Smart dispatch with built-in cargo capacity and eligibility validation.' },
  { icon: Wrench, title: 'Maintenance Workflow', desc: 'Log service records, track open jobs, auto-update vehicle availability.' },
  { icon: Fuel, title: 'Fuel & Expenses', desc: 'Per-vehicle cost tracking with automatic operational cost roll-ups.' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Fuel efficiency, vehicle ROI, cost charts with one-click CSV export.' },
  { icon: Shield, title: 'RBAC & Settings', desc: 'Role-based access for Fleet Managers, Dispatchers, Safety Officers, and Finance.' },
];

// ─── Role Cards ──────────────────────────────────────────────
const roles = [
  {
    role: 'Fleet Manager',
    color: 'border-accent/40 bg-accent-subtle',
    iconColor: 'text-accent',
    permissions: ['Full system access', 'Add/retire vehicles', 'Manage drivers', 'View all reports'],
  },
  {
    role: 'Dispatcher',
    color: 'border-info-border bg-info-bg',
    iconColor: 'text-info',
    permissions: ['Create & dispatch trips', 'View vehicle availability', 'Track active trips', 'Update trip status'],
  },
  {
    role: 'Safety Officer',
    color: 'border-success-border bg-success-bg',
    iconColor: 'text-success',
    permissions: ['View driver profiles', 'Monitor safety scores', 'License expiry alerts', 'Maintenance reports'],
  },
  {
    role: 'Financial Analyst',
    color: 'border-warning-border bg-warning-bg',
    iconColor: 'text-warning',
    permissions: ['Fuel & expense reports', 'Vehicle ROI analysis', 'CSV data export', 'Cost trend analytics'],
  },
];

// ─── How It Works Steps ──────────────────────────────────────
const steps = [
  { n: '01', title: 'Register Vehicle', desc: 'Add your fleet with full specs, capacity, and acquisition data.' },
  { n: '02', title: 'Onboard Drivers', desc: 'Create driver profiles with license tracking and safety scores.' },
  { n: '03', title: 'Dispatch Trip', desc: 'Smart form validates eligibility, capacity, and availability live.' },
  { n: '04', title: 'Track & Report', desc: 'Monitor in real-time and export analytics to drive decisions.' },
];

// ─── Problems ────────────────────────────────────────────────
const problems = [
  { before: 'Spreadsheets causing scheduling conflicts', after: 'Live availability status prevents double-booking' },
  { before: 'Missed maintenance = breakdowns', after: 'Automated service tracking and in-shop flags' },
  { before: 'Expired driver licenses go unnoticed', after: 'License expiry alerts and dispatch blocks' },
  { before: 'No visibility into operational costs', after: 'Per-vehicle cost roll-ups and ROI dashboards' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-primary overflow-x-hidden">

      {/* ── Navbar ────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-surface/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Truck className="w-4.5 h-4.5 text-surface" style={{ width: 18, height: 18 }} />
            </div>
            <span className="text-lg font-bold text-primary">Transit<span className="text-accent">Ops</span></span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-secondary">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#roles" className="hover:text-primary transition-colors">Roles</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/login" className="btn-primary text-sm px-4 py-2">Get Started →</Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 hero-grid-bg opacity-40" />
        {/* Amber glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent-subtle text-accent text-xs font-semibold mb-6"
            >
              <Zap className="w-3.5 h-3.5" />
              Hackathon MVP — Fleet Operations Reimagined
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight mb-6"
            >
              Run your fleet
              <br />
              <span className="text-gradient-amber">like clockwork</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed mb-10"
            >
              Replace spreadsheets and manual logbooks with a unified platform.
              Dispatch smarter, track costs effortlessly, and keep your fleet running at peak efficiency.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/login"
                className="btn-primary text-base px-8 py-3 flex items-center gap-2 shadow-glow"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="btn-secondary text-base px-8 py-3"
              >
                Explore Features
              </a>
            </motion.div>
          </div>

          {/* Hero Animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="card p-6 mx-auto max-w-3xl glow-amber">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-danger" />
                <div className="w-3 h-3 rounded-full bg-warning" />
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-xs text-muted ml-2 font-mono">Live Fleet View — Atlanta Hub</span>
              </div>
              <HeroRouteAnimation />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Strip ───────────────────────────────────────── */}
      <section className="border-y border-border bg-panel/50 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { target: 2400, suffix: '+', label: 'Trips Dispatched' },
            { target: 98, suffix: '%', label: 'On-Time Rate' },
            { target: 40, suffix: '%', label: 'Less Admin Time' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-4xl font-black text-accent tabular mb-1">
                <AnimatedCount target={stat.target} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-secondary font-medium uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Problem → Solution ────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold text-accent uppercase tracking-widest">Why TransitOps</span>
            <h2 className="text-4xl font-black mt-3 mb-4">Stop fighting spreadsheets</h2>
            <p className="text-secondary max-w-xl mx-auto">Manual processes aren't just slow — they're actively costing you money and safety incidents.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {problems.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="card p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-5 h-5 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center text-danger text-xs shrink-0 mt-0.5">✕</span>
                  <p className="text-secondary text-sm">{p.before}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <p className="text-primary text-sm font-medium">{p.after}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 bg-panel/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold text-accent uppercase tracking-widest">Platform Modules</span>
            <h2 className="text-4xl font-black mt-3 mb-4">Everything your fleet needs</h2>
            <p className="text-secondary max-w-xl mx-auto">8 integrated modules, one coherent platform. No more juggling 6 different tools.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="card p-5 cursor-default group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-subtle border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-bold text-primary mb-1.5">{f.title}</h3>
                <p className="text-xs text-secondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles Section ─────────────────────────────────────── */}
      <section id="roles" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold text-accent uppercase tracking-widest">Role-Based Access</span>
            <h2 className="text-4xl font-black mt-3 mb-4">The right access for every role</h2>
            <p className="text-secondary max-w-xl mx-auto">TransitOps adapts to your team structure with purpose-built views for each role.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((r, i) => (
              <motion.div
                key={r.role}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ rotateY: 3, rotateX: -2, scale: 1.02, transition: { duration: 0.2 } }}
                className={`card p-5 border ${r.color} cursor-default`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <h3 className="font-bold text-primary mb-3">{r.role}</h3>
                <ul className="space-y-2">
                  {r.permissions.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-secondary">
                      <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 bg-panel/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold text-accent uppercase tracking-widest">Simple Workflow</span>
            <h2 className="text-4xl font-black mt-3 mb-4">Up and running in minutes</h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-border z-0">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute inset-0 bg-gradient-to-r from-success via-accent to-accent origin-left"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
              {steps.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-surface font-black text-sm mb-4 shadow-glow">
                    {s.n}
                  </div>
                  <h3 className="font-bold text-primary mb-2">{s.title}</h3>
                  <p className="text-xs text-secondary leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-accent-glow" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6 shadow-glow-lg">
                <Truck className="w-7 h-7 text-surface" />
              </div>
              <h2 className="text-3xl font-black mb-4">Ready to take control?</h2>
              <p className="text-secondary mb-8 max-w-md mx-auto">
                Join forward-thinking fleet operators using TransitOps to eliminate admin overhead and maximize uptime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login" className="btn-primary px-8 py-3 flex items-center justify-center gap-2 shadow-glow-lg">
                  Start Free — No Credit Card
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="btn-secondary px-8 py-3">
                  View Demo
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Truck style={{ width: 14, height: 14 }} className="text-surface" />
            </div>
            <span className="font-bold text-primary">Transit<span className="text-accent">Ops</span></span>
            <span className="text-muted text-sm ml-2">© 2025</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-secondary">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="btn-ghost p-2" aria-label="GitHub">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="btn-ghost p-2" aria-label="Twitter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="btn-ghost p-2" aria-label="LinkedIn">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
