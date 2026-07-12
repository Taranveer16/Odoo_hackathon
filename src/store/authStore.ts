import { create } from 'zustand';
import type { AuthUser } from '../services/authService';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

const storedToken = localStorage.getItem('transit_token');
const validStoredToken = storedToken && !isTokenExpired(storedToken) ? storedToken : null;

if (storedToken && !validStoredToken) {
  // Stale/expired token left over from a previous session — clear it
  localStorage.removeItem('transit_token');
  localStorage.removeItem('transit_user');
}

export const useAuthStore = create<AuthState>((set) => ({
  token: validStoredToken,
  user: (() => {
    if (!validStoredToken) return null;
    try {
      const raw = localStorage.getItem('transit_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!validStoredToken,

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
}));
