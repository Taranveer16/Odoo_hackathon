import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import AppLayout from './layouts/AppLayout';
import CCOLayout from './layouts/CCOLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CCOProtectedRoute from './components/auth/CCOProtectedRoute';
import DashboardPage from './pages/Dashboard/DashboardPage';
import FleetPage from './pages/Fleet/FleetPage';
import DriversPage from './pages/Drivers/DriversPage';
import TripsPage from './pages/Trips/TripsPage';
import MaintenancePage from './pages/Maintenance/MaintenancePage';
import FuelPage from './pages/Fuel/FuelPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import CCOLoginPage from './pages/CCO/CCOLoginPage';
import CCODashboardPage from './pages/CCO/CCODashboardPage';
import CCOTripDetailPage from './pages/CCO/CCOTripDetailPage';
import CCOVerificationPage from './pages/CCO/CCOVerificationPage';
import CCOHistoryPage from './pages/CCO/CCOHistoryPage';
import ToastProvider from './components/common/ToastProvider';

export default function App() {
  return (
    <>
      <ToastProvider />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ── CCO Mobile App ─────────────────────────────── */}
        <Route path="/cco/login" element={<CCOLoginPage />} />
        <Route
          path="/cco"
          element={
            <CCOProtectedRoute>
              <CCOLayout />
            </CCOProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/cco/dashboard" replace />} />
          <Route path="dashboard" element={<CCODashboardPage />} />
          <Route path="trips" element={<CCODashboardPage />} />
          <Route path="history" element={<CCOHistoryPage />} />
          <Route path="trip/:tripId" element={<CCOTripDetailPage />} />
          <Route path="verify/:tripId/:checkpointId" element={<CCOVerificationPage />} />
        </Route>

        {/* ── Main Platform ──────────────────────────────── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="fuel" element={<FuelPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
