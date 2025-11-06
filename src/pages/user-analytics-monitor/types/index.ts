export interface UserSegment {
  id: string;
  name: string;
  userCount: number;
  engagementRate: number;
  avgSessionDuration: number;
  lastActivity: Date;
  lifetimeValue: number;
  retentionRate: number;
  deviceTypes: string[];
  topFeatures: string[];
}

export interface EngagementMetric {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  icon: string;
  color: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  feature: string;
  timestamp: Date;
  deviceType: string;
  deviceModel: string;
  sessionId: string;
  location: string;
  duration: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface FeatureUsage {
  featureName: string;
  usageCount: number;
  uniqueUsers: number;
  avgTimeSpent: number;
  completionRate: number;
  category: string;
  trend: number;
}

export interface UserJourneyStep {
  step: string;
  users: number;
  completionRate: number;
  dropoffRate: number;
  avgTimeSpent: number;
}

export interface SessionData {
  date: string;
  sessions: number;
  avgDuration: number;
  bounceRate: number;
  pageViews: number;
}

export interface FilterOptions {
  dateRange: string;
  userSegment: string;
  deviceType: string;
  location: string;
  dataType: 'realtime' | 'historical';
}

export interface TabData {
  id: string;
  label: string;
  icon: string;
  count?: number;
}