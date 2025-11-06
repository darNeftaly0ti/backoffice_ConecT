import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';
import { ServiceUtilization } from '../types';

interface ServiceUtilizationChartProps {
  services: ServiceUtilization[];
  height?: number;
}

const ServiceUtilizationChart: React.FC<ServiceUtilizationChartProps> = ({ services, height = 400 }) => {
  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return '#EF4444'; // red-500
    if (percentage >= 75) return '#F59E0B'; // amber-500
    if (percentage >= 50) return '#0EA5E9'; // sky-500
    return '#10B981'; // emerald-500
  };

  const getTrendIcon = (trend: ServiceUtilization['trend']) => {
    switch (trend) {
      case 'up':
        return 'TrendingUp';
      case 'down':
        return 'TrendingDown';
      case 'stable':
        return 'Minus';
      default:
        return 'Minus';
    }
  };

  const getTrendColor = (trend: ServiceUtilization['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      case 'stable':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Icon name={data.icon} size={16} className="text-primary" />
            <p className="font-medium text-foreground">{data.name}</p>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{data.description}</p>
          <div className="space-y-1 text-sm">
            <p>Usage: <span className="font-medium">{data.usage.toLocaleString()}</span></p>
            <p>Capacity: <span className="font-medium">{data.maxCapacity.toLocaleString()}</span></p>
            <p>Utilization: <span className="font-medium">{data.utilizationPercentage}%</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Service Utilization</h3>
          <p className="text-sm text-muted-foreground">Most-used functions and capacity analysis</p>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success"></div>
            <span className="text-muted-foreground">&lt;50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-accent"></div>
            <span className="text-muted-foreground">50-75%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning"></div>
            <span className="text-muted-foreground">75-90%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-error"></div>
            <span className="text-muted-foreground">&gt;90%</span>
          </div>
        </div>
      </div>

      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={services}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="name"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="utilizationPercentage" radius={[4, 4, 0, 0]}>
              {services.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getUtilizationColor(entry.utilizationPercentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service.id} className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name={service.icon} size={16} className="text-primary" />
                <span className="font-medium text-sm text-foreground">{service.name}</span>
              </div>
              <div className={`flex items-center gap-1 ${getTrendColor(service.trend)}`}>
                <Icon name={getTrendIcon(service.trend)} size={14} />
              </div>
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Usage:</span>
                <span className="font-medium">{service.usage.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="font-medium">{service.maxCapacity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Utilization:</span>
                <span 
                  className="font-medium"
                  style={{ color: getUtilizationColor(service.utilizationPercentage) }}
                >
                  {service.utilizationPercentage}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceUtilizationChart;