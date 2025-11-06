import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { AlertItem } from '../types';

interface AlertsBannerProps {
  alerts: AlertItem[];
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

const AlertsBanner: React.FC<AlertsBannerProps> = ({ alerts, onAcknowledge, onResolve }) => {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const getSeverityColor = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-error text-error-foreground border-error';
      case 'high':
        return 'bg-warning text-warning-foreground border-warning';
      case 'medium':
        return 'bg-accent text-accent-foreground border-accent';
      case 'low':
        return 'bg-muted text-muted-foreground border-muted';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getSeverityIcon = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'AlertCircle';
      case 'high':
        return 'AlertTriangle';
      case 'medium':
        return 'Info';
      case 'low':
        return 'Bell';
      default:
        return 'Bell';
    }
  };

  const activeAlerts = alerts.filter(alert => alert.status === 'active');

  if (activeAlerts.length === 0) {
    return (
      <div className="w-full p-4 bg-success/10 border border-success/20 rounded-lg mb-6">
        <div className="flex items-center gap-3">
          <Icon name="CheckCircle" size={20} className="text-success" />
          <span className="text-success font-medium">All systems operational - No active alerts</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 mb-6">
      {activeAlerts.slice(0, 3).map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Icon name={getSeverityIcon(alert.severity)} size={20} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-background/20 uppercase font-medium">
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm opacity-90 mb-2">{alert.description}</p>
                
                {expandedAlert === alert.id && (
                  <div className="space-y-2 text-xs opacity-80">
                    <div className="flex flex-wrap gap-4">
                      <span>Source: {alert.source}</span>
                      <span>Time: {alert.timestamp.toLocaleString()}</span>
                    </div>
                    <div>
                      <span>Affected Services: </span>
                      <span className="font-medium">{alert.affectedServices.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                iconName={expandedAlert === alert.id ? 'ChevronUp' : 'ChevronDown'}
                iconSize={16}
                className="text-current hover:bg-background/20"
              >
                Details
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAcknowledge(alert.id)}
                iconName="Check"
                iconSize={16}
                className="text-current hover:bg-background/20"
              >
                Acknowledge
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResolve(alert.id)}
                iconName="X"
                iconSize={16}
                className="text-current hover:bg-background/20"
              >
                Resolve
              </Button>
            </div>
          </div>
        </div>
      ))}
      
      {activeAlerts.length > 3 && (
        <div className="text-center py-2">
          <Button variant="outline" size="sm">
            View {activeAlerts.length - 3} more alerts
          </Button>
        </div>
      )}
    </div>
  );
};

export default AlertsBanner;