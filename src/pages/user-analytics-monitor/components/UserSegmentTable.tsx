import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { UserSegment } from '../types';

interface UserSegmentTableProps {
  segments: UserSegment[];
}

const UserSegmentTable: React.FC<UserSegmentTableProps> = ({ segments }) => {
  const [sortField, setSortField] = useState<keyof UserSegment>('userCount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: keyof UserSegment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedSegments = [...segments].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc' 
        ? aValue.getTime() - bValue.getTime() 
        : bValue.getTime() - aValue.getTime();
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortDirection === 'asc' 
      ? aStr.localeCompare(bStr) 
      : bStr.localeCompare(aStr);
  });

  const paginatedSegments = sortedSegments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(segments.length / itemsPerPage);

  const getSortIcon = (field: keyof UserSegment) => {
    if (sortField !== field) return 'ArrowUpDown';
    return sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-error';
  };

  const getRetentionColor = (rate: number) => {
    if (rate >= 70) return 'text-success';
    if (rate >= 50) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Segmentos de Usuario</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconName="Filter" iconPosition="left">
            Filtros
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            iconName="Download" 
            iconPosition="left"
            onClick={() => {
              import('../../../utils/export.utils').then(({ exportToCSV }) => {
                const exportData = segments.map((segment, index) => ({
                  '#': index + 1,
                  'Segmento': segment.name,
                  'Usuarios': segment.userCount,
                  'Tasa de Engagement (%)': segment.engagementRate,
                  'Tasa de Retención (%)': segment.retentionRate,
                  'Duración Promedio (min)': segment.avgSessionDuration,
                  'Valor de Vida': segment.lifetimeValue,
                  'Dispositivos': segment.deviceTypes.join(', '),
                  'Top Funciones': segment.topFeatures.join(', ')
                }));
                exportToCSV(exportData, `segmentos-usuario-${new Date().toISOString().split('T')[0]}`);
              });
            }}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              {[
                { key: 'name', label: 'Segmento' },
                { key: 'userCount', label: 'Usuarios' },
                { key: 'engagementRate', label: 'Engagement' },
                { key: 'avgSessionDuration', label: 'Duración Sesión' },
                { key: 'retentionRate', label: 'Retención' },
                { key: 'lifetimeValue', label: 'Valor de Vida' },
                { key: 'lastActivity', label: 'Última Actividad' }
              ].map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort(column.key as keyof UserSegment)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    <Icon 
                      name={getSortIcon(column.key as keyof UserSegment)} 
                      size={14} 
                    />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedSegments.map((segment) => (
              <tr key={segment.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{segment.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {segment.deviceTypes.join(', ')}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">
                    {segment.userCount.toLocaleString('es-CO')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${getEngagementColor(segment.engagementRate)}`}>
                    {segment.engagementRate}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-foreground">
                    {segment.avgSessionDuration}min
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${getRetentionColor(segment.retentionRate)}`}>
                    {segment.retentionRate}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">
                    {formatCurrency(segment.lifetimeValue)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(segment.lastActivity)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Icon name="Eye" size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Icon name="MoreHorizontal" size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, segments.length)} de{' '}
            {segments.length} segmentos
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              iconName="ChevronLeft"
              iconPosition="left"
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              iconName="ChevronRight"
              iconPosition="right"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSegmentTable;