import React from 'react';
import Icon from '../../../components/AppIcon';
import { NotificationQueueItem } from '../types';

interface NotificationQueueProps {
  queueItems: NotificationQueueItem[];
}

const NotificationQueue: React.FC<NotificationQueueProps> = ({ queueItems }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-success bg-success/10';
      case 'processing':
        return 'text-warning bg-warning/10';
      case 'failed':
        return 'text-error bg-error/10';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Notification Queue
          </h3>
          <p className="text-sm text-muted-foreground">
            Real-time processing status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {queueItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="p-2 rounded-lg bg-muted/50">
                <Icon name={getTypeIcon(item.type)} size={16} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground truncate">
                  {item.recipient}
                </span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {item.campaign}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.scheduledAt.toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex-shrink-0">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">
              {queueItems.filter(item => item.status === 'pending').length}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {queueItems.filter(item => item.status === 'processing').length}
            </p>
            <p className="text-xs text-muted-foreground">Processing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationQueue;