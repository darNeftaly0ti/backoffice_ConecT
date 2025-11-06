import React from 'react';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { FilterOptions } from '../types';

interface FilterControlsProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFiltersChange }) => {
  const dateRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last-7-days', label: 'Últimos 7 días' },
    { value: 'last-30-days', label: 'Últimos 30 días' },
    { value: 'last-90-days', label: 'Últimos 90 días' },
    { value: 'custom', label: 'Rango personalizado' }
  ];

  const campaignTypeOptions = [
    { value: 'promotional', label: 'Promocional' },
    { value: 'transactional', label: 'Transaccional' },
    { value: 'informational', label: 'Informativo' },
    { value: 'survey', label: 'Encuesta' }
  ];

  const notificationTypeOptions = [
    { value: 'push', label: 'Push Notifications' }
    // Nota: Solo usamos notificaciones push nativas de la app
  ];

  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'completed', label: 'Completado' },
    { value: 'paused', label: 'Pausado' },
    { value: 'draft', label: 'Borrador' }
  ];

  const handleDateRangeChange = (value: string) => {
    onFiltersChange({ ...filters, dateRange: value });
  };

  const handleCampaignTypeChange = (value: string) => {
    const newTypes = filters.campaignType.includes(value)
      ? filters.campaignType.filter(type => type !== value)
      : [...filters.campaignType, value];
    onFiltersChange({ ...filters, campaignType: newTypes });
  };

  const handleNotificationTypeChange = (value: string) => {
    const newTypes = filters.notificationType.includes(value)
      ? filters.notificationType.filter(type => type !== value)
      : [...filters.notificationType, value];
    onFiltersChange({ ...filters, notificationType: newTypes });
  };

  const handleStatusChange = (value: string) => {
    const newStatuses = filters.status.includes(value)
      ? filters.status.filter(status => status !== value)
      : [...filters.status, value];
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: 'last-7-days',
      campaignType: [],
      notificationType: [],
      status: []
    });
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Filtros de Análisis
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          iconName="X"
          iconPosition="left"
        >
          Limpiar filtros
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Select
            label="Rango de fechas"
            options={dateRangeOptions}
            value={filters.dateRange}
            onChange={handleDateRangeChange}
            placeholder="Seleccionar período"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tipo de campaña
          </label>
          <div className="space-y-2">
            {campaignTypeOptions.map(option => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.campaignType.includes(option.value)}
                  onChange={() => handleCampaignTypeChange(option.value)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Canal de notificación
          </label>
          <div className="space-y-2">
            {notificationTypeOptions.map(option => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.notificationType.includes(option.value)}
                  onChange={() => handleNotificationTypeChange(option.value)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Estado
          </label>
          <div className="space-y-2">
            {statusOptions.map(option => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.status.includes(option.value)}
                  onChange={() => handleStatusChange(option.value)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Filtros activos:</span>
          {filters.campaignType.length > 0 && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
              {filters.campaignType.length} tipos de campaña
            </span>
          )}
          {filters.notificationType.length > 0 && (
            <span className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs">
              {filters.notificationType.length} canales
            </span>
          )}
          {filters.status.length > 0 && (
            <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs">
              {filters.status.length} estados
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterControls;