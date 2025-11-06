import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import { AuthProvider } from "contexts/AuthContext";
import NotFound from "pages/NotFound";
import Login from "pages/Login";
import ExecutiveKPIDashboard from './pages/executive-kpi-dashboard';
import CommunicationAnalytics from './pages/communication-analytics';
import OperationsPerformance from './pages/operations-performance';
import UserAnalyticsMonitor from './pages/user-analytics-monitor';
import NotificationCenter from './pages/notification-center';
import UserManagement from './pages/user-management';

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <RouterRoutes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <ExecutiveKPIDashboard />
            </ProtectedRoute>
          } />
          <Route path="/executive-kpi-dashboard" element={
            <ProtectedRoute>
              <ExecutiveKPIDashboard />
            </ProtectedRoute>
          } />
          <Route path="/communication-analytics" element={
            <ProtectedRoute>
              <CommunicationAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/operations-performance" element={
            <ProtectedRoute>
              <OperationsPerformance />
            </ProtectedRoute>
          } />
          <Route path="/user-analytics-monitor" element={
            <ProtectedRoute>
              <UserAnalyticsMonitor />
            </ProtectedRoute>
          } />
          <Route path="/notification-center" element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          } />
          <Route path="/user-management" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
