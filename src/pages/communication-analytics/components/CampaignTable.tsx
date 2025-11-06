import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { CampaignMetrics } from '../types';

interface CampaignTableProps {
  campaigns: CampaignMetrics[];
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns }) => {
  const [sortField, setSortField] = useState<keyof CampaignMetrics>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: keyof CampaignMetrics) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCampaigns = [...campaigns].sort((a, b) => {
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

  const paginatedCampaigns = sortedCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(campaigns.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/10';
      case 'completed':
        return 'text-primary bg-primary/10';
      case 'paused':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'push':
        return 'Bell';
      case 'sms':
        return 'MessageSquare';
      case 'email':
        return 'Mail';
      default:
        return 'Send';
    }
  };

  const SortableHeader: React.FC<{ field: keyof CampaignMetrics; children: React.ReactNode }> = ({ field, children }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <Icon
          name={sortField === field ? (sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'}
          size={14}
          className={sortField === field ? 'text-primary' : 'text-muted-foreground'}
        />
      </div>
    </th>
  );

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Rendimiento de Campañas
            </h3>
            <p className="text-sm text-muted-foreground">
              Métricas detalladas por campaña de comunicación
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" iconName="Filter" iconPosition="left">
              Filtrar
            </Button>
            <Button variant="outline" size="sm" iconName="Download" iconPosition="left">
              Exportar
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <SortableHeader field="name">Campaña</SortableHeader>
              <SortableHeader field="type">Tipo</SortableHeader>
              <SortableHeader field="status">Estado</SortableHeader>
              <SortableHeader field="deliveryRate">Entrega</SortableHeader>
              <SortableHeader field="openRate">Apertura</SortableHeader>
              <SortableHeader field="responseRate">Respuesta</SortableHeader>
              <SortableHeader field="sentimentScore">Sentimiento</SortableHeader>
              <SortableHeader field="roi">ROI</SortableHeader>
              <SortableHeader field="lastUpdated">Actualizado</SortableHeader>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {paginatedCampaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <Icon name={getTypeIcon(campaign.type)} size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.totalSent.toLocaleString()} enviados
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-foreground capitalize">
                    {campaign.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {campaign.deliveryRate}%
                    </span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${campaign.deliveryRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {campaign.openRate}%
                    </span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${campaign.openRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {campaign.responseRate}%
                    </span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success transition-all duration-300"
                        style={{ width: `${campaign.responseRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      campaign.sentimentScore >= 70 ? 'text-success' :
                      campaign.sentimentScore >= 40 ? 'text-warning' : 'text-error'
                    }`}>
                      {campaign.sentimentScore}%
                    </span>
                    <Icon
                      name={campaign.sentimentScore >= 70 ? 'TrendingUp' : 
                            campaign.sentimentScore >= 40 ? 'Minus' : 'TrendingDown'}
                      size={14}
                      className={
                        campaign.sentimentScore >= 70 ? 'text-success' :
                        campaign.sentimentScore >= 40 ? 'text-warning' : 'text-error'
                      }
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${
                    campaign.roi >= 0 ? 'text-success' : 'text-error'
                  }`}>
                    {campaign.roi >= 0 ? '+' : ''}{campaign.roi}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {campaign.lastUpdated.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Icon name="Eye" size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Icon name="Edit" size={14} />
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
      
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, campaigns.length)} de {campaigns.length} campañas
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                iconName="ChevronLeft"
                iconPosition="left"
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                iconName="ChevronRight"
                iconPosition="right"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignTable;