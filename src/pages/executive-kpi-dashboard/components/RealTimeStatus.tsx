import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { ConnectionStatus } from '../types';

interface RealTimeStatusProps {
  status: ConnectionStatus;
  onRefresh?: () => void;
}

const RealTimeStatus: React.FC<RealTimeStatusProps> = ({ status, onRefresh }) => {
  const [timeUntilUpdate, setTimeUntilUpdate] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeLeft = Math.max(0, Math.floor((status.nextUpdate.getTime() - now.getTime()) / 1000));
      setTimeUntilUpdate(timeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [status.nextUpdate]);

  const getStatusColor = () => {
    switch (status.status) {
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

  const getStatusIcon = () => {
    switch (status.status) {
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

  const getStatusText = () => {
    switch (status.status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'reconnecting':
        return 'Reconectando';
      default:
        return 'Desconocido';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          status.status === 'connected' ? 'bg-success/10' :
          status.status === 'disconnected'? 'bg-error/10' : 'bg-warning/10'
        }`}>
          <Icon 
            name={getStatusIcon()} 
            size={20} 
            className={`${getStatusColor()} ${
              status.status === 'reconnecting' ? 'animate-spin' : ''
            }`}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              Estado de Conexión
            </span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span>
              Última actualización: {status.lastUpdate.toLocaleTimeString('es-CO')}
            </span>
            {status.status === 'connected' && timeUntilUpdate > 0 && (
              <span className="flex items-center gap-1">
                <Icon name="Clock" size={12} />
                Próxima en: {formatTime(timeUntilUpdate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {status.status === 'connected' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-success/10 rounded-full">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-success">
              Datos en vivo
            </span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          iconName="RefreshCw"
          iconPosition="left"
          iconSize={16}
          className="button-press"
          disabled={status.status === 'reconnecting'}
        >
          Actualizar
        </Button>
      </div>
    </div>
  );
};

export default RealTimeStatus;