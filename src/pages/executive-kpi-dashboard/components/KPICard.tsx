import React from 'react';
import Icon from '../../../components/AppIcon';
import { KPIMetric } from '../types';

interface KPICardProps {
  metric: KPIMetric;
}

const KPICard: React.FC<KPICardProps> = ({ metric }) => {
  const getChangeColor = () => {
    switch (metric.changeType) {
      case 'increase':
        return 'text-success';
      case 'decrease':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeIcon = () => {
    switch (metric.changeType) {
      case 'increase':
        return 'TrendingUp';
      case 'decrease':
        return 'TrendingDown';
      default:
        return 'Minus';
    }
  };

  const renderSparkline = () => {
    const max = Math.max(...metric.sparklineData);
    const min = Math.min(...metric.sparklineData);
    const range = max - min || 1;

    return (
      <svg width="80" height="24" className="ml-auto">
        <polyline
          fill="none"
          stroke={`var(--color-${metric.color})`}
          strokeWidth="2"
          points={metric.sparklineData
            .map((value, index) => {
              const x = (index / (metric.sparklineData.length - 1)) * 80;
              const y = 24 - ((value - min) / range) * 24;
              return `${x},${y}`;
            })
            .join(' ')}
        />
      </svg>
    );
  };

  return (
    <div className="card-elevation bg-card rounded-lg p-6 border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${metric.color}/10`}>
            <Icon 
              name={metric.icon} 
              size={20} 
              className={`text-${metric.color}`}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </h3>
            <p className="text-2xl font-bold text-foreground mt-1">
              {metric.value}
            </p>
          </div>
        </div>
        {renderSparkline()}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon 
            name={getChangeIcon()} 
            size={16} 
            className={getChangeColor()}
          />
          <span className={`text-sm font-medium ${getChangeColor()}`}>
            {Math.abs(metric.change)}%
          </span>
          <span className="text-sm text-muted-foreground">
            vs período anterior
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {metric.description}
      </p>
    </div>
  );
};

export default KPICard;