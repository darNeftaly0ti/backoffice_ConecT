import React, { useState } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { ChartDataPoint } from '../types';

interface EngagementChartProps {
  data: ChartDataPoint[];
}

const EngagementChart: React.FC<EngagementChartProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'combined' | 'engagement' | 'satisfaction'>('combined');
  const [comparisonMode, setComparisonMode] = useState<'current' | 'comparison'>('current');

  const formatTooltipValue = (value: number, name: string) => {
    switch (name) {
      case 'userEngagement':
        return [`${value.toLocaleString('es-CO')} usuarios`, 'Engagement de Usuarios'];
      case 'satisfactionScore':
        return [`${value}%`, 'Puntuación de Satisfacción'];
      case 'serviceUtilization':
        return [`${value}%`, 'Utilización del Servicio'];
      default:
        return [value, name];
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {formatTooltipValue(entry.value, entry.dataKey)[1]}:
              </span>
              <span className="font-medium text-foreground">
                {formatTooltipValue(entry.value, entry.dataKey)[0]}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-elevation bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Tendencias de Engagement y Satisfacción
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis comparativo de métricas clave de rendimiento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'combined' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('combined')}
              className="text-xs"
            >
              Combinado
            </Button>
            <Button
              variant={viewMode === 'engagement' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('engagement')}
              className="text-xs"
            >
              Engagement
            </Button>
            <Button
              variant={viewMode === 'satisfaction' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('satisfaction')}
              className="text-xs"
            >
              Satisfacción
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setComparisonMode(comparisonMode === 'current' ? 'comparison' : 'current')}
            iconName="GitCompare"
            iconPosition="left"
            iconSize={16}
          >
            {comparisonMode === 'current' ? 'Comparar' : 'Actual'}
          </Button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {(viewMode === 'combined' || viewMode === 'engagement') && (
              <Bar
                yAxisId="left"
                dataKey="userEngagement"
                fill="var(--color-primary)"
                name="Engagement de Usuarios"
                radius={[2, 2, 0, 0]}
              />
            )}

            {(viewMode === 'combined' || viewMode === 'satisfaction') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="satisfactionScore"
                stroke="var(--color-success)"
                strokeWidth={3}
                dot={{ fill: 'var(--color-success)', strokeWidth: 2, r: 4 }}
                name="Puntuación de Satisfacción"
              />
            )}

            {viewMode === 'combined' && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="serviceUtilization"
                stroke="var(--color-accent)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'var(--color-accent)', strokeWidth: 2, r: 3 }}
                name="Utilización del Servicio"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Icon name="TrendingUp" size={16} className="text-success" />
            <span>Tendencia positiva en engagement</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Users" size={16} className="text-primary" />
            <span>Usuarios activos en crecimiento</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon name="Clock" size={14} />
          <span>Actualizado hace 2 min</span>
        </div>
      </div>
    </div>
  );
};

export default EngagementChart;