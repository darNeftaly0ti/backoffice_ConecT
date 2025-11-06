import React from 'react';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { FilterOptions } from '../types';

interface FilterControlsProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onRefresh: () => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  onClearFilters?: () => void;
  isLoading: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  onClearFilters,
  isLoading
}) => {
  // Verificar si hay filtros activos (no todos en 'all')
  const hasActiveFilters = 
    filters.dateRange !== 'last-7-days' ||
    filters.userSegment !== 'all' ||
    filters.deviceType !== 'all' ||
    filters.location !== 'all' ||
    filters.dataType !== 'realtime';

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      onFiltersChange({
        dateRange: 'last-7-days',
        userSegment: 'all',
        deviceType: 'all',
        location: 'all',
        dataType: 'realtime'
      });
    }
  };
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);
  const dateRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last-7-days', label: 'Últimos 7 días' },
    { value: 'last-30-days', label: 'Últimos 30 días' },
    { value: 'last-90-days', label: 'Últimos 90 días' },
    { value: 'custom', label: 'Rango personalizado' }
  ];

  const userSegmentOptions = [
    { value: 'all', label: 'Todos los usuarios' },
    { value: 'new', label: 'Usuarios nuevos' },
    { value: 'returning', label: 'Usuarios recurrentes' },
    { value: 'premium', label: 'Usuarios premium' },
    { value: 'inactive', label: 'Usuarios inactivos' }
  ];

  const deviceTypeOptions = [
    { value: 'all', label: 'Todos los dispositivos' },
    { value: 'mobile', label: 'Móvil' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'desktop', label: 'Escritorio' }
  ];

  const locationOptions = [
    { value: 'all', label: 'Todas las ubicaciones' },
    { value: 'bogota', label: 'Bogotá' },
    { value: 'medellin', label: 'Medellín' },
    { value: 'cali', label: 'Cali' },
    { value: 'barranquilla', label: 'Barranquilla' },
    { value: 'other', label: 'Otras ciudades' }
  ];

  const dataTypeOptions = [
    { value: 'realtime', label: 'Tiempo real' },
    { value: 'historical', label: 'Histórico' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
          <Select
            label="Rango de fechas"
            options={dateRangeOptions}
            value={filters.dateRange}
            onChange={(value) => onFiltersChange({ ...filters, dateRange: value as string })}
          />
          
          <Select
            label="Segmento de usuario"
            options={userSegmentOptions}
            value={filters.userSegment}
            onChange={(value) => onFiltersChange({ ...filters, userSegment: value as string })}
          />
          
          <Select
            label="Tipo de dispositivo"
            options={deviceTypeOptions}
            value={filters.deviceType}
            onChange={(value) => onFiltersChange({ ...filters, deviceType: value as string })}
          />
          
          <Select
            label="Ubicación"
            options={locationOptions}
            value={filters.location}
            onChange={(value) => onFiltersChange({ ...filters, location: value as string })}
          />
          
          <Select
            label="Tipo de datos"
            options={dataTypeOptions}
            value={filters.dataType}
            onChange={(value) => onFiltersChange({ ...filters, dataType: value as 'realtime' | 'historical' })}
          />
        </div>
        
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              iconName="X"
              iconPosition="left"
              onClick={handleClearFilters}
              className="button-press"
              size="sm"
            >
              Limpiar Filtros
            </Button>
          )}
          
          <Button
            variant="outline"
            iconName="RotateCcw"
            iconPosition="left"
            onClick={onRefresh}
            loading={isLoading}
            className="button-press"
          >
            Actualizar
          </Button>
          
          <div className="relative" ref={menuRef}>
            <Button
              variant="outline"
              iconName="Download"
              iconPosition="left"
              className="button-press"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Exportar
            </Button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onExport?.('csv');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Icon name="FileText" size={16} />
                    Exportar a CSV
                  </button>
                  <button
                    onClick={() => {
                      onExport?.('excel');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Icon name="FileSpreadsheet" size={16} />
                    Exportar a Excel
                  </button>
                  <button
                    onClick={() => {
                      onExport?.('pdf');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Icon name="FileText" size={16} />
                    Exportar a PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;