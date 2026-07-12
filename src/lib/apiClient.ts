import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// ─── Axios Instance ───────────────────────────────────────────
// All API calls go through this client.
// To switch from mock → real backend, set VITE_USE_MOCK=false and VITE_API_BASE_URL=<your server URL>
// Expected REST API base: POST /auth/login, GET /auth/me,
// GET|POST|PUT /vehicles, GET|POST|PUT /drivers,
// GET|POST /trips, PATCH /trips/:id/dispatch, PATCH /trips/:id/complete, PATCH /trips/:id/cancel
// GET|POST|PATCH /maintenance, GET|POST /fuel-logs, GET|POST /expenses, GET /analytics/summary

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach JWT ─────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token =
      useAuthStore.getState().token || localStorage.getItem('transit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 ────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — log out user
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
