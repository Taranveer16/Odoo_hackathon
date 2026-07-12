import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function CCOProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/cco/login" replace />;
  }

  if (user.role !== 'cargo_control_officer') {
    // Regular platform users trying to access CCO app → send to main app
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}
