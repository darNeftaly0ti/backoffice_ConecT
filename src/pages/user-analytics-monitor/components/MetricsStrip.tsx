import React from 'react';
import Icon from '../../../components/AppIcon';
import { EngagementMetric } from '../types';

interface MetricsStripProps {
  metrics: EngagementMetric[];
}

const MetricsStrip: React.FC<MetricsStripProps> = ({ metrics }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'TrendingUp';
      case 'down':
        return 'TrendingDown';
      default:
        return 'Minus';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="bg-card rounded-lg border border-border p-6 card-elevation"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg bg-${metric.color}/10`}>
              <Icon 
                name={metric.icon} 
                size={24} 
                className={`text-${metric.color}`}
              />
            </div>
            <div className={`flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
              <Icon name={getTrendIcon(metric.trend)} size={16} />
              <span className="text-sm font-medium">
                {Math.abs(metric.changePercentage)}%
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-foreground">
              {metric.value.toLocaleString('es-CO')}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {metric.unit}
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-xs text-muted-foreground">
              Anterior: {metric.previousValue.toLocaleString('es-CO')} {metric.unit}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsStrip;