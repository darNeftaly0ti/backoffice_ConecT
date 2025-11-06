import React from 'react';
import Icon from '../../../components/AppIcon';
import { FeatureUsage } from '../types';

interface TopActionsProps {
  data: FeatureUsage[];
}

const TopActions: React.FC<TopActionsProps> = ({ data }) => {
  // Debug: Ver qué datos estamos recibiendo
  console.log('=== TopActions: Datos recibidos ===');
  console.log('Cantidad de datos:', data.length);
  console.log('Datos completos:', data);
  console.log('=== FIN DEBUG TopActions ===');
  
  // Validar que haya datos
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="Activity" size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay datos de acciones disponibles</p>
        <p className="text-xs text-muted-foreground mt-2">
          Verifica que los logs de actividad se estén cargando correctamente
        </p>
      </div>
    );
  }

  // Ordenar por uso y tomar top 10
  const topActions = [...data].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10);
  
  console.log('Top 10 acciones calculadas:', topActions);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-warning';
    if (rank === 2) return 'text-muted-foreground';
    if (rank === 3) return 'text-accent';
    return 'text-muted-foreground';
  };

  const getCategoryIcon = (category: string) => {
    const categoryIcons: Record<string, string> = {
      'configuracion': 'Settings',
      'seguridad': 'Shield',
      'soporte': 'Headphones',
      'cuenta': 'User',
      'other': 'Activity'
    };
    return categoryIcons[category] || 'Activity';
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      'configuracion': 'text-primary',
      'seguridad': 'text-success',
      'soporte': 'text-accent',
      'cuenta': 'text-warning',
      'other': 'text-muted-foreground'
    };
    return categoryColors[category] || 'text-muted-foreground';
  };

  if (topActions.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="Activity" size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">No hay datos de acciones disponibles</p>
        <p className="text-xs text-muted-foreground">
          Datos recibidos: {data.length} | Top actions calculadas: {topActions.length}
        </p>
      </div>
    );
  }

  const totalUsage = topActions.reduce((sum, action) => sum + action.usageCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Top 10 Acciones Más Usadas</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ranking de las acciones más populares entre los usuarios
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{totalUsage.toLocaleString('es-CO')}</p>
          <p className="text-xs text-muted-foreground">Total de usos</p>
        </div>
      </div>

      {/* Ranking List */}
      <div className="space-y-3">
        {topActions.map((action, index) => {
          const rank = index + 1;
          const percentage = totalUsage > 0 ? (action.usageCount / totalUsage) * 100 : 0;
          
          return (
            <div
              key={action.featureName}
              className={`
                bg-card border border-border rounded-lg p-4 transition-all duration-200
                hover:shadow-md hover:border-primary/50
                ${rank <= 3 ? 'bg-gradient-to-r from-primary/5 to-transparent' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                  ${rank === 1 ? 'bg-warning text-warning-foreground' : ''}
                  ${rank === 2 ? 'bg-muted text-muted-foreground' : ''}
                  ${rank === 3 ? 'bg-accent text-accent-foreground' : ''}
                  ${rank > 3 ? 'bg-muted/30 text-muted-foreground' : ''}
                `}>
                  {getRankIcon(rank)}
                </div>

                {/* Action Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon 
                      name={getCategoryIcon(action.category)} 
                      size={18} 
                      className={getCategoryColor(action.category)}
                    />
                    <h4 className="font-semibold text-foreground truncate">{action.featureName}</h4>
                    <span className={`
                      px-2 py-0.5 text-xs rounded-full capitalize
                      bg-muted text-muted-foreground
                    `}>
                      {action.category}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div
                      className={`
                        h-2 rounded-full transition-all duration-300
                        ${rank === 1 ? 'bg-warning' : ''}
                        ${rank === 2 ? 'bg-muted-foreground' : ''}
                        ${rank === 3 ? 'bg-accent' : ''}
                        ${rank > 3 ? 'bg-primary' : ''}
                      `}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Usos</p>
                      <p className="text-sm font-semibold text-foreground">
                        {action.usageCount.toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% del total
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Usuarios únicos</p>
                      <p className="text-sm font-semibold text-foreground">
                        {action.uniqueUsers.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tasa de éxito</p>
                      <p className="text-sm font-semibold text-success">
                        {action.completionRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tiempo promedio</p>
                      <p className="text-sm font-semibold text-foreground">
                        {action.avgTimeSpent}min
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-3">Resumen General</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{topActions.length}</p>
            <p className="text-sm text-muted-foreground">Acciones destacadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {((topActions.reduce((sum, a) => sum + a.completionRate, 0) / topActions.length)).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Tasa de éxito promedio</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">
              {((topActions.reduce((sum, a) => sum + a.uniqueUsers, 0) / topActions.length)).toFixed(0)}
            </p>
            <p className="text-sm text-muted-foreground">Usuarios únicos promedio</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopActions;

