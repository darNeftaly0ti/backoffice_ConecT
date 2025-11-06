import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { GeographicData } from '../types';

interface GeographicHeatMapProps {
  data: GeographicData[];
}

const GeographicHeatMap: React.FC<GeographicHeatMapProps> = ({ data }) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'users' | 'growth'>('users');

  const maxUsers = Math.max(...data.map(d => d.users));
  const maxGrowth = Math.max(...data.map(d => Math.abs(d.growth)));

  const getIntensityColor = (region: GeographicData) => {
    if (viewMode === 'users') {
      const intensity = region.users / maxUsers;
      return `rgba(30, 64, 175, ${0.2 + intensity * 0.8})`;
    } else {
      const intensity = Math.abs(region.growth) / maxGrowth;
      const color = region.growth >= 0 ? '16, 185, 129' : '239, 68, 68';
      return `rgba(${color}, ${0.2 + intensity * 0.8})`;
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return 'TrendingUp';
    if (growth < 0) return 'TrendingDown';
    return 'Minus';
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-success';
    if (growth < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  return (
    <div className="card-elevation bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Distribución Geográfica
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Actividad de usuarios por región colombiana
          </p>
        </div>

        <div className="flex items-center bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'users' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('users')}
            className="text-xs"
          >
            Usuarios
          </Button>
          <Button
            variant={viewMode === 'growth' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('growth')}
            className="text-xs"
          >
            Crecimiento
          </Button>
        </div>
      </div>

      {/* Interactive Map Placeholder */}
      <div className="relative mb-6">
        <div className="w-full h-64 bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
          <div className="text-center">
            <Icon name="Map" size={48} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Mapa interactivo de Colombia
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Visualización de datos por departamento
            </p>
          </div>
        </div>

        {/* Map Legend */}
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 border border-border">
          <div className="text-xs font-medium text-foreground mb-2">
            {viewMode === 'users' ? 'Usuarios Activos' : 'Crecimiento (%)'}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary/20"></div>
              <span className="text-muted-foreground">Bajo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary/60"></div>
              <span className="text-muted-foreground">Alto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Data List */}
      <div className="space-y-3">
        {data.map((region) => (
          <div
            key={region.region}
            className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
              selectedRegion === region.region
                ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
            style={{ backgroundColor: selectedRegion === region.region ? undefined : getIntensityColor(region) }}
            onClick={() => setSelectedRegion(selectedRegion === region.region ? null : region.region)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                  <Icon name="MapPin" size={16} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{region.region}</h4>
                  <p className="text-sm text-muted-foreground">
                    {region.users.toLocaleString('es-CO')} usuarios activos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {region.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    del total
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Icon 
                    name={getGrowthIcon(region.growth)} 
                    size={16} 
                    className={getGrowthColor(region.growth)}
                  />
                  <span className={`text-sm font-medium ${getGrowthColor(region.growth)}`}>
                    {Math.abs(region.growth).toFixed(1)}%
                  </span>
                </div>

                <Icon 
                  name={selectedRegion === region.region ? 'ChevronUp' : 'ChevronDown'} 
                  size={16} 
                  className="text-muted-foreground"
                />
              </div>
            </div>

            {selectedRegion === region.region && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-bold text-foreground">
                      {region.users.toLocaleString('es-CO')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Usuarios Totales
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className={`text-lg font-bold ${getGrowthColor(region.growth)}`}>
                      {region.growth > 0 ? '+' : ''}{region.growth.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Crecimiento Mensual
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="MapPin" size={14} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Ubicación</span>
                  </div>
                  <iframe
                    width="100%"
                    height="120"
                    loading="lazy"
                    title={region.region}
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${region.coordinates.lat},${region.coordinates.lng}&z=8&output=embed`}
                    className="rounded border border-border"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="Users" size={16} className="text-primary" />
          <span>Total: {data.reduce((sum, region) => sum + region.users, 0).toLocaleString('es-CO')} usuarios</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon name="RefreshCw" size={14} />
          <span>Actualizado cada 5 min</span>
        </div>
      </div>
    </div>
  );
};

export default GeographicHeatMap;