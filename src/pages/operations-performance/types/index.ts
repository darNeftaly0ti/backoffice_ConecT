export interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: number;
  change: number;
  changeType: 'increase' | 'decrease';
  lastUpdated: Date;
}

export interface AlertItem {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  source: string;
  affectedServices: string[];
}

export interface PerformanceDataPoint {
  timestamp: Date;
  value: number;
  anomaly?: boolean;
}

export interface PerformanceChart {
  id: string;
  title: string;
  unit: string;
  data: PerformanceDataPoint[];
  color: string;
  threshold?: number;
}

export interface ServiceUtilization {
  id: string;
  name: string;
  description: string;
  usage: number;
  maxCapacity: number;
  utilizationPercentage: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user: string;
  userRole: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'failed' | 'pending';
  severity: 'info' | 'warning' | 'error';
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastUpdate: Date;
  latency: number;
  reconnectAttempts: number;
}

export interface RefreshInterval {
  value: number;
  label: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  dateRange: string;
  includeCharts: boolean;
}