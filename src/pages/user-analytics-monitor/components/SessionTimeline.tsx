import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SessionData } from '../types';

interface SessionTimelineProps {
  data: SessionData[];
}

const SessionTimeline: React.FC<SessionTimelineProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-muted-foreground">
              Sesiones: <span className="font-medium text-primary">{data.sessions.toLocaleString('es-CO')}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Duración promedio: <span className="font-medium text-accent">{data.avgDuration}min</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Tasa de rebote: <span className="font-medium text-warning">{data.bounceRate}%</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Vistas de página: <span className="font-medium text-success">{data.pageViews.toLocaleString('es-CO')}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Línea de Tiempo de Sesiones</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Sesiones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-full"></div>
            <span>Duración</span>
          </div>
        </div>
      </div>

      {/* Sessions Chart */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-4">Volumen de Sesiones</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="var(--color-primary)"
                fillOpacity={1}
                fill="url(#sessionsGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Duration and Bounce Rate Chart */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-4">Duración y Tasa de Rebote</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <YAxis 
                yAxisId="duration"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <YAxis 
                yAxisId="bounce"
                orientation="right"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                yAxisId="duration"
                type="monotone"
                dataKey="avgDuration"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-accent)', strokeWidth: 2, r: 4 }}
              />
              <Line
                yAxisId="bounce"
                type="monotone"
                dataKey="bounceRate"
                stroke="var(--color-warning)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-warning)', strokeWidth: 2, r: 4 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total de Sesiones',
            value: data.reduce((sum, item) => sum + item.sessions, 0),
            unit: '',
            color: 'primary'
          },
          {
            label: 'Duración Promedio',
            value: data.reduce((sum, item) => sum + item.avgDuration, 0) / data.length,
            unit: 'min',
            color: 'accent'
          },
          {
            label: 'Tasa de Rebote Promedio',
            value: data.reduce((sum, item) => sum + item.bounceRate, 0) / data.length,
            unit: '%',
            color: 'warning'
          },
          {
            label: 'Total Vistas de Página',
            value: data.reduce((sum, item) => sum + item.pageViews, 0),
            unit: '',
            color: 'success'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-4 text-center">
            <h5 className="text-sm text-muted-foreground mb-1">{stat.label}</h5>
            <p className={`text-2xl font-bold text-${stat.color}`}>
              {stat.value.toLocaleString('es-CO', { maximumFractionDigits: 1 })}
              <span className="text-sm font-normal ml-1">{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionTimeline;