import React from 'react';
import Icon from '../../../components/AppIcon';
import { Notification } from '../types';

interface NotificationPreviewProps {
  notification: Partial<Notification>;
}

const NotificationPreview: React.FC<NotificationPreviewProps> = ({ notification }) => {
  const renderPreview = () => {
    if (!notification.title && !notification.message) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Icon name="Bell" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Completa el formulario para ver la vista previa</p>
        </div>
      );
    }

    return (
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-start gap-3">
              {notification.metadata?.imageUrl && (
                <img
                  src={notification.metadata.imageUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground text-sm">
                    {notification.title || 'Título de la notificación'}
                  </h4>
                  <Icon name="Bell" size={16} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.message || 'Mensaje de la notificación aparecerá aquí...'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Ahora</span>
                  {notification.metadata?.deepLink && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Icon name="Link" size={12} />
                        Deep Link
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
  };

  return (
    <div className="bg-muted/30 rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon name="Eye" size={20} />
        Vista Previa
      </h3>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground mb-4">
          Así se verá la notificación en la app móvil
        </p>
        {renderPreview()}
      </div>
    </div>
  );
};

export default NotificationPreview;

