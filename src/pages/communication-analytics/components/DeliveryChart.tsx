import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DeliveryMetric } from '../types';

interface DeliveryChartProps {
  data: DeliveryMetric[];
}

const DeliveryChart: React.FC<DeliveryChartProps> = ({ data }) => {
  const formatTooltip = (value: number, name: string) => {
    return [`${value.toLocaleString()}`, 'Push Notifications'];
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Tendencia de Entrega de Notificaciones
          </h3>
          <p className="text-sm text-muted-foreground">
            Rendimiento diario de notificaciones push
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-sm text-muted-foreground">Push Notifications</span>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-foreground)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="push" 
              name="Push Notifications"
              stroke="var(--color-primary)" 
              strokeWidth={2}
              dot={{ fill: 'var(--color-primary)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--color-primary)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DeliveryChart;