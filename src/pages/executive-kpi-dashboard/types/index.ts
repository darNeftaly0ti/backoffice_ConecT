export interface KPIMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  sparklineData: number[];
  description: string;
}

export interface ChartDataPoint {
  date: string;
  userEngagement: number;
  satisfactionScore: number;
  serviceUtilization: number;
}

export interface GeographicData {
  region: string;
  users: number;
  percentage: number;
  growth: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ComparisonMetric {
  metric: string;
  current: number;
  previous: number;
  variance: number;
  varianceType: 'positive' | 'negative' | 'neutral';
  unit: string;
}

export interface DateRangeOption {
  value: string;
  label: string;
}

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'reconnecting';
  lastUpdate: Date;
  nextUpdate: Date;
}

export interface ExportOptions {
  format: 'pdf' | 'excel';
  isExporting: boolean;
}