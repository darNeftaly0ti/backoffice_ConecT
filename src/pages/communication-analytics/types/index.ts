export interface CampaignMetrics {
  id: string;
  name: string;
  type: 'push' | 'sms' | 'email';
  status: 'active' | 'completed' | 'paused' | 'draft';
  deliveryRate: number;
  openRate: number;
  responseRate: number;
  sentimentScore: number;
  totalSent: number;
  delivered: number;
  opened: number;
  responded: number;
  roi: number;
  createdAt: Date;
  lastUpdated: Date;
}

export interface NotificationQueueItem {
  id: string;
  type: 'push' | 'sms' | 'email';
  recipient: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  scheduledAt: Date;
  priority: 'high' | 'medium' | 'low';
  campaign: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  surveyTitle: string;
  respondent: string;
  completedAt: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  rating: number;
  feedback: string;
  demographics: {
    age: string;
    location: string;
    segment: string;
  };
}

export interface DeliveryMetric {
  date: string;
  push: number;
  sms: number;
  email: number;
  total: number;
}

export interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface CampaignFunnelData {
  stage: string;
  value: number;
  percentage: number;
  color: string;
}

export interface KPICardData {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  benchmark: number;
  icon: string;
  color: string;
}

export interface FilterOptions {
  dateRange: string;
  campaignType: string[];
  notificationType: string[];
  status: string[];
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}