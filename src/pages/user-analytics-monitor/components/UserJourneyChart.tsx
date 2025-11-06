import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserJourneyStep } from '../types';

interface UserJourneyChartProps {
  data: UserJourneyStep[];
}

const UserJourneyChart: React.FC<UserJourneyChartProps> = ({ data }) => {
  const colors = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-muted-foreground">
              Usuarios: <span className="font-medium text-foreground">{data.users.toLocaleString('es-CO')}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Tasa de finalización: <span className="font-medium text-success">{data.completionRate}%</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Tasa de abandono: <span className="font-medium text-error">{data.dropoffRate}%</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Tiempo promedio: <span className="font-medium text-foreground">{data.avgTimeSpent}min</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Embudo de Conversión de Usuario</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span>Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-error rounded-full"></div>
            <span>Abandonado</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="step" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="users" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {data.map((step, index) => (
          <div key={step.step} className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <h4 className="font-medium text-foreground">{step.step}</h4>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Usuarios: <span className="font-medium text-foreground">{step.users.toLocaleString('es-CO')}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Finalización: <span className="font-medium text-success">{step.completionRate}%</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserJourneyChart;