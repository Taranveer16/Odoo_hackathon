import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Truck, Eye, EyeOff, AlertCircle, ChevronDown } from 'lucide-react';
import { signup } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../types';
import { getRoleDashboardPath } from '../../lib/roleDashboard';

const schema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(80),
        email: z.string().email('Enter a valid email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Include at least one uppercase letter')
            .regex(/[a-z]/, 'Include at least one lowercase letter')
            .regex(/[0-9]/, 'Include at least one number')
            .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
        confirmPassword: z.string(),
        role: z.enum(['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'], {
            message: 'Please select a role',
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type FormData = z.infer<typeof schema>;

const roleLabels: Record<Role, string> = {
    fleet_manager: 'Fleet Manager',
    dispatcher: 'Dispatcher',
    safety_officer: 'Safety Officer',
    financial_analyst: 'Financial Analyst',
    cargo_control_officer: 'Cargo Officer',
};

const roleDescriptions: Record<Role, string> = {
    fleet_manager: 'Full fleet control & all modules',
    dispatcher: 'Create & dispatch trips',
    safety_officer: 'Driver safety & license monitoring',
    financial_analyst: 'Costs, fuel & financial reports',
    cargo_control_officer: 'Checkpoint cargo verification',
};


export default function SignupPage() {
    const navigate = useNavigate();
    const authLogin = useAuthStore((s) => s.login);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await signup(data.name, data.email, data.password, data.role as Role);
            authLogin(res.access_token || res.token, res.user);
            navigate(getRoleDashboardPath(res.user.role));

        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface flex">
            {/* ── Left: Brand Panel ─────────────────────────────────── */}
            <motion.div
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden border-r border-border"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                <div className="hero-grid-bg absolute inset-0 opacity-30" />

                <div className="relative">
                    <div className="flex items-center gap-2.5 mb-16">
                        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                            <Truck className="w-5 h-5 text-surface" />
                        </div>
                        <span className="text-xl font-bold">Transit<span className="text-accent">Ops</span></span>
                    </div>

                    <h2 className="text-4xl font-black leading-tight mb-4">
                        Join the platform
                        <br />
                        <span className="text-gradient-amber">built for fleets</span>
                    </h2>
                    <p className="text-secondary text-sm leading-relaxed max-w-sm mb-12">
                        Create your account and pick the role that matches your responsibilities — your dashboard adapts automatically.
                    </p>

                    <div className="space-y-3">
                        <p className="text-2xs font-bold text-muted uppercase tracking-widest mb-4">Platform Roles</p>
                        {(Object.keys(roleLabels) as Role[]).map((role, i) => (
                            <motion.div
                                key={role}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex items-start gap-3 p-3 rounded-lg bg-panel/60 border border-border/50"
                            >
                                <div className="w-7 h-7 rounded-lg bg-accent-subtle border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-accent text-xs font-bold">{roleLabels[role][0]}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-primary">{roleLabels[role]}</p>
                                    <p className="text-xs text-muted">{roleDescriptions[role]}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="relative text-xs text-muted">
                    © 2025 TransitOps · Built for fleet operators
                </div>
            </motion.div>

            {/* ── Right: Signup Form ─────────────────────────────────── */}
            <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="flex-1 flex items-center justify-center p-6"
            >
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                            <Truck className="w-4 h-4 text-surface" />
                        </div>
                        <span className="text-lg font-bold">Transit<span className="text-accent">Ops</span></span>
                    </div>

                    <h1 className="text-2xl font-black text-primary mb-1">Create your account</h1>
                    <p className="text-secondary text-sm mb-8">Get set up with your fleet dashboard</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-danger-bg border border-danger-border text-danger text-sm mb-6"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="label">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                {...register('name')}
                                className={`input ${errors.name ? 'input-error' : ''}`}
                                placeholder="Jane Doe"
                                autoComplete="name"
                            />
                            {errors.name && (
                                <p className="field-error">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="label">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                {...register('email')}
                                className={`input ${errors.email ? 'input-error' : ''}`}
                                placeholder="you@company.com"
                                autoComplete="email"
                            />
                            {errors.email && (
                                <p className="field-error">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="role" className="label">Your Role</label>
                            <div className="relative">
                                <select
                                    id="role"
                                    {...register('role')}
                                    defaultValue=""
                                    className={`input appearance-none pr-10 ${errors.role ? 'input-error' : ''}`}
                                >
                                    <option value="" disabled>Select a role</option>
                                    {(Object.keys(roleLabels) as Role[]).map((role) => (
                                        <option key={role} value={role}>{roleLabels[role]}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            {errors.role && (
                                <p className="field-error">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.role.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="label">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="field-error">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    {...register('confirmPassword')}
                                    className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                                    aria-label="Toggle confirm password visibility"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="field-error">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
                            id="signup-submit"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
                                    Creating account…
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-muted mt-8">
                        Already have an account?{' '}
                        <Link to="/login" className="text-accent hover:text-accent-light transition-colors">
                            Sign in →
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
