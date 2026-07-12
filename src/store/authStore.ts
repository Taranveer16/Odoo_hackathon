import { create } from 'zustand';
import type { User, Role } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  // Dev convenience
  switchRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('transit_token'),
  user: (() => {
    try {
      const raw = localStorage.getItem('transit_user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('transit_token'),

  login: (token, user) => {
    localStorage.setItem('transit_token', token);
    localStorage.setItem('transit_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('transit_token');
    localStorage.removeItem('transit_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    localStorage.setItem('transit_user', JSON.stringify(user));
    set({ user });
  },

  // Dev mode: switch roles without re-logging in
  switchRole: (role) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, role };
    localStorage.setItem('transit_user', JSON.stringify(updated));
    set({ user: updated });
  },
}));
