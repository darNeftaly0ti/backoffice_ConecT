import React from 'react';
import Icon from '../../../components/AppIcon';
import { SystemMetric } from '../types';

interface SystemHealthCardProps {
  metric: SystemMetric;
  onClick?: () => void;
}

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ metric, onClick }) => {
  const getStatusColor = () => {
    switch (metric.status) {
      case 'healthy':
        return 'text-success border-success/20 bg-success/5';
      case 'warning':
        return 'text-warning border-warning/20 bg-warning/5';
      case 'critical':
        return 'text-error border-error/20 bg-error/5';
      default:
        return 'text-muted-foreground border-border bg-card';
    }
  };

  const getStatusIcon = () => {
    switch (metric.status) {
      case 'healthy':
        return 'CheckCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'critical':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const getChangeIcon = () => {
    return metric.changeType === 'increase' ? 'TrendingUp' : 'TrendingDown';
  };

  const getChangeColor = () => {
    if (metric.name.toLowerCase().includes('error') || metric.name.toLowerCase().includes('latency')) {
      return metric.changeType === 'increase' ? 'text-error' : 'text-success';
    }
    return metric.changeType === 'increase' ? 'text-success' : 'text-error';
  };

  return (
    <div 
      className={`card-elevation p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${getStatusColor()}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon 
            name={getStatusIcon()} 
            size={24} 
            className={metric.status === 'healthy' ? 'text-success' : metric.status === 'warning' ? 'text-warning' : 'text-error'}
          />
          <div>
            <h3 className="font-semibold text-foreground text-lg">{metric.name}</h3>
            <p className="text-sm text-muted-foreground">
              Threshold: {metric.threshold}{metric.unit}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">
            {metric.value.toLocaleString()}
          </span>
          <span className="text-lg text-muted-foreground">{metric.unit}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1 ${getChangeColor()}`}>
            <Icon name={getChangeIcon()} size={16} />
            <span className="text-sm font-medium">
              {Math.abs(metric.change)}% from last hour
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Updated {metric.lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCard;