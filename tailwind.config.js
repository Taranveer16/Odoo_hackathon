/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Backgrounds ──────────────────────────────
        surface: 'var(--bg-surface)',
        'surface-2': 'var(--bg-surface-2)',
        panel: 'var(--bg-panel)',
        'panel-2': 'var(--bg-panel-2)',
        border: 'var(--border)',
        'border-2': 'var(--border-2)',

        // ── Accent (Amber) ───────────────────────────
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
          muted: '#92400E',
          subtle: 'var(--accent-subtle)',
        },

        // ── Text ─────────────────────────────────────
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        disabled: '#4B5563',

        // ── Status Colors ─────────────────────────────
        success: {
          DEFAULT: '#22C55E',
          bg: 'var(--success-bg)',
          border: '#166534',
          text: 'var(--success-text)',
        },
        info: {
          DEFAULT: '#3B82F6',
          bg: 'var(--info-bg)',
          border: '#1E40AF',
          text: 'var(--info-text)',
        },
        warning: {
          DEFAULT: '#F97316',
          bg: 'var(--warning-bg)',
          border: '#9A3412',
          text: 'var(--warning-text)',
        },
        danger: {
          DEFAULT: '#EF4444',
          bg: 'var(--danger-bg)',
          border: '#991B1B',
          text: 'var(--danger-text)',
        },
        neutral: {
          DEFAULT: '#6B7280',
          bg: 'var(--neutral-bg)',
          border: '#374151',
          text: 'var(--neutral-text)',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },

      letterSpacing: {
        widest: '0.2em',
        'extra-wide': '0.15em',
      },

      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5)',
        glow: '0 0 20px rgba(245,158,11,0.15)',
        'glow-lg': '0 0 40px rgba(245,158,11,0.2)',
        modal: '0 25px 50px rgba(0,0,0,0.7)',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'accent-glow':
          'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.15) 0%, transparent 70%)',
        'hero-grid':
          'linear-gradient(rgba(42,43,46,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,43,46,0.4) 1px, transparent 1px)',
      },

      backgroundSize: {
        grid: '40px 40px',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      borderRadius: {
        DEFAULT: '0.5rem',
      },
    },
  },
  plugins: [],
};
