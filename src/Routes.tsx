import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import ExecutiveKPIDashboard from './pages/executive-kpi-dashboard';
import CommunicationAnalytics from './pages/communication-analytics';
import OperationsPerformance from './pages/operations-performance';
import UserAnalyticsMonitor from './pages/user-analytics-monitor';
import NotificationCenter from './pages/notification-center';
import UserManagement from './pages/user-management';

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Define your routes here */}
        <Route path="/" element={<ExecutiveKPIDashboard />} />
        <Route path="/executive-kpi-dashboard" element={<ExecutiveKPIDashboard />} />
        <Route path="/communication-analytics" element={<CommunicationAnalytics />} />
        <Route path="/operations-performance" element={<OperationsPerformance />} />
        <Route path="/user-analytics-monitor" element={<UserAnalyticsMonitor />} />
        <Route path="/notification-center" element={<NotificationCenter />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
