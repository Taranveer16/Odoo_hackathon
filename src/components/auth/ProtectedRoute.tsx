import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { ReactNode } from 'react';
import type { Role } from '../../types';
import { ShieldX } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-danger-bg border border-danger-border mb-4">
            <ShieldX className="w-8 h-8 text-danger" />
          </div>
          <h1 className="text-xl font-bold text-primary mb-2">Access Denied</h1>
          <p className="text-secondary text-sm mb-6">
            Your role (<span className="text-accent font-semibold">{user.role.replace(/_/g, ' ')}</span>) does not have permission to view this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
