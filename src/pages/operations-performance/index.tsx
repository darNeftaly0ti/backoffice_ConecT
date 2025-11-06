import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import SystemHealthCard from './components/SystemHealthCard';
import AlertsBanner from './components/AlertsBanner';
import PerformanceChart from './components/PerformanceChart';
import ServiceUtilizationChart from './components/ServiceUtilizationChart';
import AuditTrail from './components/AuditTrail';
import ConnectionStatusIndicator from './components/ConnectionStatusIndicator';
import {
  SystemMetric,
  AlertItem,
  PerformanceChart as PerformanceChartType,
  ServiceUtilization,
  AuditLogEntry,
  ConnectionStatus,
  RefreshInterval,
  ExportOptions
} from './types';

const OperationsPerformance: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>({ value: 60, label: '1m' });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: true,
    lastUpdate: new Date(),
    latency: 245,
    reconnectAttempts: 0
  });
  const [isExporting, setIsExporting] = useState(false);

  // Mock data for system health metrics
  const systemMetrics: SystemMetric[] = [
    {
      id: 'uptime',
      name: 'System Uptime',
      value: 99.97,
      unit: '%',
      status: 'healthy',
      threshold: 99.5,
      change: 0.02,
      changeType: 'increase',
      lastUpdated: new Date(Date.now() - 120000)
    },
    {
      id: 'response-time',
      name: 'API Response Time',
      value: 245,
      unit: 'ms',
      status: 'healthy',
      threshold: 500,
      change: 12,
      changeType: 'decrease',
      lastUpdated: new Date(Date.now() - 60000)
    },
    {
      id: 'error-rate',
      name: 'Error Rate',
      value: 0.03,
      unit: '%',
      status: 'healthy',
      threshold: 1.0,
      change: 0.01,
      changeType: 'decrease',
      lastUpdated: new Date(Date.now() - 90000)
    },
    {
      id: 'concurrent-users',
      name: 'Concurrent Users',
      value: 2847,
      unit: '',
      status: 'warning',
      threshold: 3000,
      change: 8.5,
      changeType: 'increase',
      lastUpdated: new Date(Date.now() - 30000)
    }
  ];

  // Mock data for alerts
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'alert-1',
      severity: 'medium',
      title: 'High Memory Usage Detected',
      description: 'Server cluster memoria-prod-02 is experiencing elevated memory consumption at 87% capacity.',
      timestamp: new Date(Date.now() - 300000),
      status: 'active',
      source: 'Infrastructure Monitor',
      affectedServices: ['User Authentication', 'Data Processing']
    },
    {
      id: 'alert-2',
      severity: 'low',
      title: 'Scheduled Maintenance Window',
      description: 'Routine database optimization scheduled for tonight at 02:00 COT. Expected duration: 30 minutes.',
      timestamp: new Date(Date.now() - 600000),
      status: 'active',
      source: 'Maintenance Scheduler',
      affectedServices: ['Database Services']
    }
  ]);

  // Mock data for performance charts
  const generatePerformanceData = (hours: number = 24) => {
    const data = [];
    const now = new Date();
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseValue = Math.random() * 100 + 200;
      const anomaly = Math.random() < 0.05; // 5% chance of anomaly
      data.push({
        timestamp,
        value: anomaly ? baseValue * 1.5 : baseValue,
        anomaly
      });
    }
    return data;
  };

  const performanceCharts: PerformanceChartType[] = [
    {
      id: 'cpu-usage',
      title: 'CPU Usage',
      unit: '%',
      data: generatePerformanceData(),
      color: '#0EA5E9',
      threshold: 80
    },
    {
      id: 'memory-usage',
      title: 'Memory Usage',
      unit: '%',
      data: generatePerformanceData(),
      color: '#10B981',
      threshold: 85
    },
    {
      id: 'network-throughput',
      title: 'Network Throughput',
      unit: 'Mbps',
      data: generatePerformanceData(),
      color: '#F59E0B',
      threshold: 1000
    },
    {
      id: 'database-connections',
      title: 'Database Connections',
      unit: '',
      data: generatePerformanceData(),
      color: '#8B5CF6',
      threshold: 500
    }
  ];

  // Mock data for service utilization
  const serviceUtilization: ServiceUtilization[] = [
    {
      id: 'password-reset',
      name: 'Password Reset',
      description: 'User password reset functionality',
      usage: 1247,
      maxCapacity: 2000,
      utilizationPercentage: 62,
      trend: 'up',
      icon: 'Key'
    },
    {
      id: 'device-restart',
      name: 'Device Restart',
      description: 'Remote device restart commands',
      usage: 856,
      maxCapacity: 1000,
      utilizationPercentage: 86,
      trend: 'stable',
      icon: 'RotateCcw'
    },
    {
      id: 'config-changes',
      name: 'Configuration Changes',
      description: 'Device configuration updates',
      usage: 423,
      maxCapacity: 800,
      utilizationPercentage: 53,
      trend: 'down',
      icon: 'Settings'
    },
    {
      id: 'data-sync',
      name: 'Data Synchronization',
      description: 'User data synchronization processes',
      usage: 1834,
      maxCapacity: 2500,
      utilizationPercentage: 73,
      trend: 'up',
      icon: 'RefreshCw'
    },
    {
      id: 'notifications',
      name: 'Push Notifications',
      description: 'Mobile push notification delivery',
      usage: 3421,
      maxCapacity: 5000,
      utilizationPercentage: 68,
      trend: 'stable',
      icon: 'Bell'
    }
  ];

  // Mock data for audit trail
  const auditLogs: AuditLogEntry[] = [
    {
      id: 'audit-1',
      timestamp: new Date(Date.now() - 120000),
      user: 'Carlos Rodriguez',
      userRole: 'System Administrator',
      action: 'Server Configuration Update',
      resource: '/api/config/server-cluster-01',
      details: 'Updated memory allocation limits from 8GB to 12GB for improved performance',
      ipAddress: '192.168.1.45',
      status: 'success',
      severity: 'info'
    },
    {
      id: 'audit-2',
      timestamp: new Date(Date.now() - 300000),
      user: 'Maria Gonzalez',
      userRole: 'Operations Manager',
      action: 'Alert Threshold Modification',
      resource: '/monitoring/alerts/cpu-usage',
      details: 'Modified CPU usage alert threshold from 75% to 80% to reduce false positives',
      ipAddress: '192.168.1.67',
      status: 'success',
      severity: 'warning'
    },
    {
      id: 'audit-3',
      timestamp: new Date(Date.now() - 450000),
      user: 'System Scheduler',
      userRole: 'Automated Process',
      action: 'Database Backup Initiated',
      resource: '/database/backup/daily-backup-20241201',
      details: 'Automated daily backup process started for production database',
      ipAddress: '10.0.0.1',
      status: 'success',
      severity: 'info'
    },
    {
      id: 'audit-4',
      timestamp: new Date(Date.now() - 600000),
      user: 'Luis Martinez',
      userRole: 'Security Administrator',
      action: 'Failed Login Attempt',
      resource: '/auth/admin-login',
      details: 'Multiple failed login attempts detected from suspicious IP address',
      ipAddress: '203.45.67.89',
      status: 'failed',
      severity: 'error'
    },
    {
      id: 'audit-5',
      timestamp: new Date(Date.now() - 750000),
      user: 'Ana Herrera',
      userRole: 'Network Administrator',
      action: 'Firewall Rule Update',
      resource: '/network/firewall/rules',
      details: 'Added new firewall rule to block suspicious traffic patterns',
      ipAddress: '192.168.1.89',
      status: 'success',
      severity: 'warning'
    }
  ];

  // Handle alert actions
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' as const } : alert
    ));
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
    ));
  };

  // Handle connection status
  const handleManualRefresh = () => {
    setConnectionStatus(prev => ({
      ...prev,
      lastUpdate: new Date(),
      latency: Math.floor(Math.random() * 300) + 150
    }));
  };

  const handleReconnect = () => {
    setConnectionStatus(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));
    
    setTimeout(() => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        reconnectAttempts: 0,
        lastUpdate: new Date(),
        latency: Math.floor(Math.random() * 300) + 150
      }));
    }, 2000);
  };

  // Handle export functionality
  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Exporting operations performance data:', options);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus.isConnected) {
        handleManualRefresh();
      }
    }, refreshInterval.value * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval.value, connectionStatus.isConnected]);

  return (
    <>
      <Helmet>
        <title>Operations Performance - Conect@t Analytics Dashboard</title>
        <meta name="description" content="Real-time system monitoring and technical analytics for administrators and operations managers" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header 
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          showMobileMenu={mobileMenuOpen}
        />
        
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
          <div className="p-4 lg:p-6 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Operations Performance</h1>
                <p className="text-muted-foreground mt-1">
                  Real-time system monitoring and technical analytics dashboard
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleExport({ format: 'pdf', dateRange: 'last-24-hours', includeCharts: true })}
                  loading={isExporting}
                  iconName="FileText"
                  iconSize={16}
                >
                  Export Report
                </Button>
                <Button
                  variant="default"
                  onClick={handleManualRefresh}
                  iconName="RefreshCw"
                  iconSize={16}
                  className="button-press"
                >
                  Refresh Data
                </Button>
              </div>
            </div>

            {/* Connection Status */}
            <ConnectionStatusIndicator
              status={connectionStatus}
              refreshInterval={refreshInterval}
              onRefreshIntervalChange={setRefreshInterval}
              onManualRefresh={handleManualRefresh}
              onReconnect={handleReconnect}
            />

            {/* Alerts Banner */}
            <AlertsBanner
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onResolve={handleResolveAlert}
            />

            {/* System Health Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {systemMetrics.map((metric) => (
                <SystemHealthCard
                  key={metric.id}
                  metric={metric}
                  onClick={() => console.log('Drill down into metric:', metric.name)}
                />
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Performance Charts - Takes 2/3 width on desktop */}
              <div className="xl:col-span-2 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {performanceCharts.map((chart) => (
                    <PerformanceChart
                      key={chart.id}
                      chart={chart}
                      height={250}
                    />
                  ))}
                </div>

                {/* Service Utilization */}
                <ServiceUtilizationChart
                  services={serviceUtilization}
                  height={350}
                />
              </div>

              {/* Audit Trail Sidebar - Takes 1/3 width on desktop */}
              <div className="xl:col-span-1">
                <AuditTrail
                  logs={auditLogs}
                  onLoadMore={() => console.log('Load more audit logs')}
                  hasMore={true}
                />
              </div>
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-muted/30 rounded-lg border border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">99.97%</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">&lt;250ms</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">2,847</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default OperationsPerformance;