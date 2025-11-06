import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { ComparisonMetric } from '../types';

interface ComparisonTableProps {
  data: ComparisonMetric[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  const [sortBy, setSortBy] = useState<'metric' | 'variance'>('variance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'negative'>('all');

  const handleSort = (column: 'metric' | 'variance') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedData = data
    .filter(item => {
      if (filterType === 'positive') return item.varianceType === 'positive';
      if (filterType === 'negative') return item.varianceType === 'negative';
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'metric') {
        comparison = a.metric.localeCompare(b.metric);
      } else {
        comparison = Math.abs(a.variance) - Math.abs(b.variance);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getVarianceColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getVarianceIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return 'TrendingUp';
      case 'negative':
        return 'TrendingDown';
      default:
        return 'Minus';
    }
  };

  const getVarianceBgColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-success/10';
      case 'negative':
        return 'bg-error/10';
      default:
        return 'bg-muted/30';
    }
  };

  return (
    <div className="card-elevation bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Análisis Comparativo de KPIs
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Comparación período actual vs período anterior
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={filterType === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('all')}
              className="text-xs"
            >
              Todos
            </Button>
            <Button
              variant={filterType === 'positive' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('positive')}
              className="text-xs"
            >
              Positivos
            </Button>
            <Button
              variant={filterType === 'negative' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('negative')}
              className="text-xs"
            >
              Negativos
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th 
                className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('metric')}
              >
                <div className="flex items-center gap-2">
                  <span>Métrica</span>
                  {sortBy === 'metric' && (
                    <Icon 
                      name={sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                      size={16} 
                    />
                  )}
                </div>
              </th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                Período Actual
              </th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                Período Anterior
              </th>
              <th 
                className="text-right py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('variance')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Variación</span>
                  {sortBy === 'variance' && (
                    <Icon 
                      name={sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                      size={16} 
                    />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((item, index) => (
              <tr 
                key={item.metric}
                className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                  index % 2 === 0 ? 'bg-muted/10' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-foreground">
                    {item.metric}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="font-semibold text-foreground">
                    {item.current.toLocaleString('es-CO')}
                    <span className="text-xs text-muted-foreground ml-1">
                      {item.unit}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="text-muted-foreground">
                    {item.previous.toLocaleString('es-CO')}
                    <span className="text-xs ml-1">
                      {item.unit}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getVarianceBgColor(item.varianceType)}`}>
                    <Icon 
                      name={getVarianceIcon(item.varianceType)} 
                      size={14} 
                      className={getVarianceColor(item.varianceType)}
                    />
                    <span className={`font-medium text-sm ${getVarianceColor(item.varianceType)}`}>
                      {item.variance > 0 ? '+' : ''}{item.variance.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedData.length === 0 && (
        <div className="text-center py-8">
          <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No se encontraron métricas con los filtros aplicados
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success/20 border-2 border-success"></div>
            <span className="text-muted-foreground">
              Mejoras: {data.filter(item => item.varianceType === 'positive').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-error/20 border-2 border-error"></div>
            <span className="text-muted-foreground">
              Declives: {data.filter(item => item.varianceType === 'negative').length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon name="Calendar" size={14} />
          <span>Comparación últimos 30 días</span>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;