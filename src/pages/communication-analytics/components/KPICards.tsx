import React from 'react';
import Icon from '../../../components/AppIcon';
import { KPICardData } from '../types';

interface KPICardsProps {
  kpiData: KPICardData[];
}

const KPICards: React.FC<KPICardsProps> = ({ kpiData }) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'TrendingUp';
      case 'down':
        return 'TrendingDown';
      default:
        return 'Minus';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {kpiData.map((kpi, index) => (
        <div
          key={index}
          className="card-elevation bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${kpi.color}`}>
              <Icon name={kpi.icon} size={24} color="white" />
            </div>
            {kpi.change !== 0 ? (
              <div className={`flex items-center gap-1 ${getTrendColor(kpi.trend)}`}>
                <Icon name={getTrendIcon(kpi.trend)} size={16} />
                <span className="text-sm font-medium">
                  {kpi.change > 0 ? '+' : ''}{kpi.change}%
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-sm font-medium">
                  N/A
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </h3>
            <p className="text-2xl font-bold text-foreground">
              {kpi.value}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Benchmark: {kpi.benchmark}%
              </span>
              <div className={`px-2 py-1 rounded-full ${
                parseFloat(kpi.value.replace('%', '')) >= kpi.benchmark ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}>
                {parseFloat(kpi.value.replace('%', '')) >= kpi.benchmark ? 'Above' : 'Below'} target
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;