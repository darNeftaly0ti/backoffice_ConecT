import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { UserActivity } from '../types';

interface LiveActivityFeedProps {
  activities: UserActivity[];
  onTogglePolling?: (active: boolean) => void;
  isPollingActive?: boolean;
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ 
  activities, 
  onTogglePolling,
  isPollingActive = true 
}) => {
  const [isLive, setIsLive] = useState(isPollingActive);
  const [displayActivities, setDisplayActivities] = useState(activities.slice(0, 10));

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        // Simulate new activities
        setDisplayActivities(prev => activities.slice(0, 10));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive, activities]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success';
      case 'completed':
        return 'text-primary';
      case 'abandoned':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'Play';
      case 'completed':
        return 'CheckCircle';
      case 'abandoned':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return 'Smartphone';
      case 'tablet':
        return 'Tablet';
      case 'desktop':
        return 'Monitor';
      default:
        return 'Device';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    // Manejar casos donde el timestamp es futuro (por diferencias de zona horaria)
    if (diff < 0) {
      // Si es menos de 1 minuto en el futuro, considerar como "Ahora mismo"
      if (Math.abs(diff) < 60000) {
        return 'Ahora mismo';
      }
      // Si es más, mostrar como futuro (aunque no debería pasar)
      return 'En el futuro';
    }
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    
    if (seconds < 10) return 'Ahora mismo';
    if (seconds < 60) return `Hace ${seconds}s`;
    if (minutes < 60) return `Hace ${minutes}min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    if (weeks < 4) return `Hace ${weeks}sem`;
    return `Hace ${Math.floor(days / 30)}mes`;
  };

  return (
    <div className="bg-card rounded-lg border border-border h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`}></div>
          <h3 className="font-semibold text-foreground">Actividad en Vivo</h3>
        </div>
        <button
          onClick={() => {
            const newState = !isLive;
            setIsLive(newState);
            if (onTogglePolling) {
              onTogglePolling(newState);
            }
          }}
          className={`
            px-3 py-1 text-xs rounded-full transition-colors
            ${isLive 
              ? 'bg-success/10 text-success border border-success/20' :'bg-muted text-muted-foreground border border-border'
            }
          `}
        >
          {isLive ? 'En vivo' : 'Pausado'}
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {displayActivities.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="Activity" size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
              <p className="text-xs text-muted-foreground mt-1">
                Las actividades más recientes aparecerán aquí
              </p>
            </div>
          ) : (
            displayActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className={`p-1 rounded-full ${getStatusColor(activity.status)}`}>
                <Icon name={getStatusIcon(activity.status)} size={12} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground text-sm truncate">
                    {activity.userName}
                  </span>
                  <Icon 
                    name={getDeviceIcon(activity.deviceType)} 
                    size={12} 
                    className="text-muted-foreground flex-shrink-0"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground mb-1">
                  {activity.action} en <span className="font-medium">{activity.feature}</span>
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{activity.location}</span>
                  <span>{formatTimeAgo(activity.timestamp)}</span>
                </div>
                
                {activity.duration > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Icon name="Clock" size={10} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {activity.duration}min
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-border p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-success">
              {activities.filter(a => a.status === 'active').length}
            </p>
            <p className="text-xs text-muted-foreground">Activos ahora</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">
              {activities.filter(a => a.status === 'completed').length}
            </p>
            <p className="text-xs text-muted-foreground">Completados hoy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveActivityFeed;