import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { Notification } from '../types';
import { format } from 'date-fns';

interface NotificationListProps {
  notifications: Notification[];
  onEdit?: (notification: Notification) => void;
  onDelete?: (id: string) => void;
  onView?: (notification: Notification) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onEdit,
  onDelete,
  onView
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const getStatusColor = (status: Notification['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-success/10 text-success border-success/20';
      case 'sending':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'scheduled':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'failed':
        return 'bg-error/10 text-error border-error/20';
      case 'draft':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };


  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    return selectedStatus === 'all' || notif.status === selectedStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'scheduled', label: 'Programado' },
    { value: 'sending', label: 'Enviando' },
    { value: 'sent', label: 'Enviado' },
    { value: 'failed', label: 'Fallido' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Icon name="Bell" size={24} />
            Notificaciones
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredNotifications.length} de {notifications.length}
          </span>
        </div>

        <select
          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-border">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="Inbox" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay notificaciones que mostrar</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div key={notification.id} className="p-6 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon name="Bell" size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="Users" size={14} />
                      {notification.recipients.length} destinatarios
                    </span>
                    <span className={`flex items-center gap-1 ${getPriorityColor(notification.priority)}`}>
                      <Icon name="Flag" size={14} />
                      {notification.priority}
                    </span>
                    {notification.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" size={14} />
                        {format(new Date(notification.scheduledAt), "dd MMM yyyy, HH:mm")}
                      </span>
                    )}
                    {notification.sentAt && (
                      <span className="flex items-center gap-1">
                        <Icon name="Send" size={14} />
                        Enviado: {format(new Date(notification.sentAt), "dd MMM yyyy, HH:mm")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(notification.status)}`}>
                      {notification.status === 'draft' && 'Borrador'}
                      {notification.status === 'scheduled' && 'Programado'}
                      {notification.status === 'sending' && 'Enviando'}
                      {notification.status === 'sent' && 'Enviado'}
                      {notification.status === 'failed' && 'Fallido'}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon name="Smartphone" size={12} />
                      Push
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(notification)}
                      iconName="Eye"
                      title="Ver detalles"
                    />
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(notification)}
                      iconName="Edit"
                      title="Editar"
                    />
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(notification.id)}
                      iconName="Trash2"
                      className="text-destructive hover:text-destructive"
                      title="Eliminar"
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;

