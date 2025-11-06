import React from 'react';
import Icon from '../../../components/AppIcon';
import { FeatureUsage } from '../types';

interface FeatureHeatmapProps {
  data: FeatureUsage[];
}

const FeatureHeatmap: React.FC<FeatureHeatmapProps> = ({ data }) => {
  const getIntensityColor = (usageCount: number, maxUsage: number) => {
    const intensity = usageCount / maxUsage;
    if (intensity >= 0.8) return 'bg-primary text-primary-foreground';
    if (intensity >= 0.6) return 'bg-primary/80 text-primary-foreground';
    if (intensity >= 0.4) return 'bg-primary/60 text-foreground';
    if (intensity >= 0.2) return 'bg-primary/40 text-foreground';
    return 'bg-primary/20 text-foreground';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return 'TrendingUp';
    if (trend < 0) return 'TrendingDown';
    return 'Minus';
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-success';
    if (trend < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  // Validar que haya datos
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="Grid3X3" size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay datos de funciones disponibles</p>
        <p className="text-xs text-muted-foreground mt-2">
          Verifica que los logs de actividad se estén cargando correctamente
        </p>
      </div>
    );
  }

  const maxUsage = Math.max(...data.map(item => item.usageCount), 1); // Mínimo 1 para evitar división por 0
  const categories = [...new Set(data.map(item => item.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Mapa de Calor de Funciones</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Menos usado</span>
          <div className="flex gap-1">
            {[0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
              <div
                key={intensity}
                className={`w-4 h-4 rounded ${getIntensityColor(intensity * maxUsage, maxUsage)}`}
              ></div>
            ))}
          </div>
          <span>Más usado</span>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h4 className="text-md font-medium text-foreground capitalize">{category}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {data
              .filter(item => item.category === category)
              .map((feature) => (
                <div
                  key={feature.featureName}
                  className={`
                    p-4 rounded-lg border border-border transition-all duration-200 cursor-pointer
                    ${getIntensityColor(feature.usageCount, maxUsage)}
                    hover:scale-105 hover:shadow-md
                  `}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm truncate">{feature.featureName}</h5>
                      <Icon 
                        name={getTrendIcon(feature.trend)} 
                        size={14} 
                        className={getTrendColor(feature.trend)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs opacity-90">
                        Usos: {feature.usageCount.toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs opacity-90">
                        Usuarios: {feature.uniqueUsers.toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs opacity-90">
                        Tiempo: {feature.avgTimeSpent}min
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs opacity-90">Finalización:</span>
                        <span className="text-xs font-medium">{feature.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-3">Resumen de Categorías</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((category) => {
            const categoryData = data.filter(item => item.category === category);
            const totalUsage = categoryData.reduce((sum, item) => sum + item.usageCount, 0);
            const avgCompletion = categoryData.reduce((sum, item) => sum + item.completionRate, 0) / categoryData.length;
            
            return (
              <div key={category} className="text-center">
                <h5 className="font-medium text-foreground capitalize">{category}</h5>
                <p className="text-sm text-muted-foreground">
                  {totalUsage.toLocaleString('es-CO')} usos totales
                </p>
                <p className="text-sm text-muted-foreground">
                  {avgCompletion.toFixed(1)}% finalización promedio
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeatureHeatmap;