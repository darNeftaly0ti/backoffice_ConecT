import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { ConnectionStatus, RefreshInterval } from '../types';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  refreshInterval: RefreshInterval;
  onRefreshIntervalChange: (interval: RefreshInterval) => void;
  onManualRefresh: () => void;
  onReconnect: () => void;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  refreshInterval,
  onRefreshIntervalChange,
  onManualRefresh,
  onReconnect
}) => {
  const refreshIntervals: RefreshInterval[] = [
    { value: 30, label: '30s' },
    { value: 60, label: '1m' },
    { value: 120, label: '2m' },
    { value: 300, label: '5m' }
  ];

  const getConnectionColor = () => {
    if (!status.isConnected) return 'text-error';
    if (status.latency > 1000) return 'text-warning';
    return 'text-success';
  };

  const getConnectionIcon = () => {
    if (!status.isConnected) return 'WifiOff';
    if (status.reconnectAttempts > 0) return 'RotateCw';
    return 'Wifi';
  };

  const getConnectionText = () => {
    if (!status.isConnected) return 'Disconnected';
    if (status.reconnectAttempts > 0) return 'Reconnecting...';
    return 'Connected';
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <Icon 
          name={getConnectionIcon()} 
          size={20} 
          className={`${getConnectionColor()} ${status.reconnectAttempts > 0 ? 'animate-spin' : ''}`}
        />
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${getConnectionColor()}`}>
            {getConnectionText()}
          </span>
          <span className="text-xs text-muted-foreground">
            {status.isConnected ? `${status.latency}ms latency` : 'No connection'}
          </span>
        </div>
      </div>

      {/* Refresh Interval Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Refresh:</span>
        <div className="flex items-center gap-1">
          {refreshIntervals.map((interval) => (
            <Button
              key={interval.value}
              variant={refreshInterval.value === interval.value ? "default" : "outline"}
              size="sm"
              onClick={() => onRefreshIntervalChange(interval)}
              className="px-2 py-1 text-xs"
            >
              {interval.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Manual Controls */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onManualRefresh}
          iconName="RefreshCw"
          iconSize={14}
          className="button-press"
        >
          Refresh
        </Button>
        
        {!status.isConnected && (
          <Button
            variant="default"
            size="sm"
            onClick={onReconnect}
            iconName="Wifi"
            iconSize={14}
            className="button-press"
          >
            Reconnect
          </Button>
        )}
      </div>

      {/* Last Update */}
      <div className="text-xs text-muted-foreground">
        <div>Last update:</div>
        <div className="font-mono">{status.lastUpdate.toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

export default ConnectionStatusIndicator;