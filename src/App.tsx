import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/Dashboard/DashboardPage';
import FleetPage from './pages/Fleet/FleetPage';
import DriversPage from './pages/Drivers/DriversPage';
import TripsPage from './pages/Trips/TripsPage';
import MaintenancePage from './pages/Maintenance/MaintenancePage';
import FuelPage from './pages/Fuel/FuelPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ToastProvider from './components/common/ToastProvider';
import { useAuthStore } from './store/authStore';
import { getRoleDashboardPath } from './lib/roleDashboard';

function RoleDashboardRedirect() {
  const user = useAuthStore((state) => state.user);
  return <Navigate to={user ? getRoleDashboardPath(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <>
      <ToastProvider />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Role-specific protected dashboards */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="fleet" element={<ProtectedRoute roles={['fleet_manager']}><DashboardPage /></ProtectedRoute>} />
          <Route path="dispatch" element={<ProtectedRoute roles={['dispatcher']}><TripsPage /></ProtectedRoute>} />
          <Route path="safety" element={<ProtectedRoute roles={['safety_officer']}><DriversPage /></ProtectedRoute>} />
          <Route path="finance" element={<ProtectedRoute roles={['financial_analyst']}><FuelPage /></ProtectedRoute>} />
        </Route>

        {/* Protected app routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleDashboardRedirect />} />
          <Route path="dashboard" element={<RoleDashboardRedirect />} />
          <Route path="fleet" element={<ProtectedRoute roles={['fleet_manager']}><FleetPage /></ProtectedRoute>} />
          <Route path="drivers" element={<ProtectedRoute roles={['fleet_manager', 'safety_officer']}><DriversPage /></ProtectedRoute>} />
          <Route path="trips" element={<ProtectedRoute roles={['fleet_manager', 'dispatcher']}><TripsPage /></ProtectedRoute>} />
          <Route path="maintenance" element={<ProtectedRoute roles={['fleet_manager']}><MaintenancePage /></ProtectedRoute>} />
          <Route path="fuel" element={<ProtectedRoute roles={['fleet_manager', 'financial_analyst']}><FuelPage /></ProtectedRoute>} />
          <Route path="analytics" element={<ProtectedRoute roles={['fleet_manager', 'financial_analyst']}><AnalyticsPage /></ProtectedRoute>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
