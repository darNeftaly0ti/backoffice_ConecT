import React, { useState } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import Select from './Select';
import { exportToPDF, exportToExcel, tableToHTML } from '../../utils/export.utils';

interface HeaderProps {
  onMenuToggle?: () => void;
  showMobileMenu?: boolean;
  onExport?: (format: 'pdf' | 'excel') => void;
  exportData?: any;
}

const Header = ({ onMenuToggle, showMobileMenu = false, onExport, exportData }: HeaderProps) => {
  const [dateRange, setDateRange] = useState('last-7-days');
  const [isExporting, setIsExporting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'last-90-days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      // Si hay una función onExport personalizada, usarla
      if (onExport) {
        onExport(format);
        setIsExporting(false);
        return;
      }
      
      // Si no hay onExport pero hay datos, exportar directamente
      if (exportData) {
        const filename = `analisis-comunicacion-${new Date().toISOString().split('T')[0]}`;
        
        if (format === 'excel') {
          exportToExcel(exportData, filename);
        } else if (format === 'pdf') {
          const content = tableToHTML(exportData, Object.keys(exportData[0] || {}), Object.keys(exportData[0] || {}));
          exportToPDF('Análisis de Comunicación', content, filename);
        }
      } else {
        console.warn('No hay datos para exportar');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-success';
      case 'disconnected':
        return 'text-error';
      case 'reconnecting':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Wifi';
      case 'disconnected':
        return 'WifiOff';
      case 'reconnecting':
        return 'RotateCw';
      default:
        return 'Wifi';
    }
  };

  return (
    <header className="sticky-nav sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="button-press"
            aria-label="Toggle navigation menu"
          >
            <Icon name={showMobileMenu ? 'X' : 'Menu'} size={20} />
          </Button>
        </div>

        {/* Logo - Desktop */}
        <div className="hidden lg:flex items-center">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Icon name="BarChart3" size={20} color="white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-foreground">Conect@t</span>
              <span className="text-xs text-muted-foreground -mt-1">Analytics Dashboard</span>
            </div>
          </div>
        </div>

        {/* Center Controls - Date Range Picker */}
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-xs">
            <Select
              options={dateRangeOptions}
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select date range"
              className="w-full"
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Export Controls */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              loading={isExporting}
              iconName="FileText"
              iconPosition="left"
              iconSize={16}
              className="button-press"
            >
              <span className="hidden md:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              loading={isExporting}
              iconName="FileSpreadsheet"
              iconPosition="left"
              iconSize={16}
              className="button-press"
            >
              <span className="hidden md:inline">Excel</span>
            </Button>
          </div>

          {/* Mobile Export Menu */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleExport('pdf')}
              loading={isExporting}
              className="button-press"
              aria-label="Export data"
            >
              <Icon name="Download" size={16} />
            </Button>
          </div>

          {/* Real-time Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50">
            <Icon 
              name={getConnectionStatusIcon()} 
              size={16} 
              className={`${getConnectionStatusColor()} ${connectionStatus === 'reconnecting' ? 'animate-spin' : ''}`}
            />
            <div className="hidden lg:flex flex-col">
              <span className="text-xs font-medium text-foreground capitalize">
                {connectionStatus}
              </span>
              <span className="text-xs text-muted-foreground">
                {connectionStatus === 'connected' ? 'Live data' : 'Offline'}
              </span>
            </div>
          </div>

          {/* User Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="button-press rounded-full"
            aria-label="User menu"
          >
            <Icon name="User" size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;