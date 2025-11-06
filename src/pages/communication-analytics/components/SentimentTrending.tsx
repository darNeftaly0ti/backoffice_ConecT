import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SentimentDistribution } from '../types';

interface SentimentTrendingProps {
  data: SentimentDistribution;
}

const SentimentTrending: React.FC<SentimentTrendingProps> = ({ data }) => {
  const chartData = [
    { name: 'Positivo', value: data.positive, color: 'var(--color-success)' },
    { name: 'Neutral', value: data.neutral, color: 'var(--color-muted-foreground)' },
    { name: 'Negativo', value: data.negative, color: 'var(--color-error)' }
  ];

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / data.payload.total) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">
            {data.name}: {data.value}
          </p>
          <p className="text-xs text-muted-foreground">
            {percentage}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Análisis de Sentimientos
        </h3>
        <p className="text-sm text-muted-foreground">
          Distribución de feedback de clientes
        </p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={renderCustomTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-3">
        {chartData.map((item, index) => {
          const percentage = ((item.value / data.total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-foreground">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {item.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {percentage}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {data.total.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Total de respuestas analizadas
          </p>
        </div>
      </div>
    </div>
  );
};

export default SentimentTrending;