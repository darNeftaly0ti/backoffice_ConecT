import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { Notification, NotificationPriority } from '../types';
import notificationService, { CreateAlertRequest, AlertType, AlertPriority } from '../../../services/notification.service';
import userService from '../../../services/user.service';
import { MobileAppUser } from '../../user-management/types';

interface CreateNotificationFormProps {
  onSubmit: (notification: Partial<Notification>) => void;
  onCancel: () => void;
  initialData?: Partial<Notification>;
  onPreviewChange?: (notification: Partial<Notification>) => void;
}

const CreateNotificationForm: React.FC<CreateNotificationFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  onPreviewChange
}) => {
  const [formData, setFormData] = useState<Partial<Notification>>({
    title: initialData?.title || '',
    message: initialData?.message || '',
    priority: initialData?.priority || 'medium',
    recipientType: initialData?.recipientType || 'specific',
    recipients: initialData?.recipients || [],
    scheduledAt: initialData?.scheduledAt,
    metadata: {
      imageUrl: initialData?.metadata?.imageUrl || '',
      actionUrl: initialData?.metadata?.actionUrl || '',
      deepLink: initialData?.metadata?.deepLink || '',
      sound: initialData?.metadata?.sound || 'default'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<MobileAppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [notificationType, setNotificationType] = useState<AlertType>('message');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersList = await userService.getUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setErrors(prev => ({ ...prev, users: 'Error al cargar usuarios' }));
    } finally {
      setLoadingUsers(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];

  const notificationTypeOptions = [
    { value: 'message', label: 'Mensaje' },
    { value: 'reminder', label: 'Recordatorio' },
    { value: 'announcement', label: 'Anuncio' },
    { value: 'warning', label: 'Advertencia' }
  ];

  const recipientTypeOptions = [
    { value: 'all', label: 'Todos los usuarios' },
    { value: 'specific', label: 'Usuarios específicos' }
    // Nota: El backend requiere un user_id específico, por lo que "all" enviará a todos los usuarios obtenidos de la API
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.message?.trim()) {
      newErrors.message = 'El mensaje es requerido';
    }

    if (formData.message && formData.message.length > 1000) {
      newErrors.message = 'El mensaje no debe exceder 1000 caracteres';
    }

    if (formData.title && formData.title.length > 200) {
      newErrors.title = 'El título no debe exceder 200 caracteres';
    }

    if (formData.recipientType === 'specific' && 
        (!selectedUserIds || selectedUserIds.length === 0) && 
        (!formData.recipients || formData.recipients.length === 0)) {
      newErrors.recipients = 'Debe seleccionar al menos un usuario o ingresar IDs manualmente';
    }
    
    // Si es "all", no necesitamos validar usuarios específicos

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let allUserIds: string[] = [];
      
      // Si se selecciona "Todos los usuarios", obtener todos los usuarios de la API
      // Si es "all", no necesitamos obtener usuarios ya que el backend lo hará con send_to_all
      // Solo obtenemos usuarios si es "specific" para la validación
      if (formData.recipientType === 'all') {
        // No necesitamos obtener usuarios, el backend los obtendrá automáticamente
        // send_to_all solo envía a usuarios con account_status: "ACTIVE"
        allUserIds = []; // Vacío porque usaremos send_to_all
      } else {
        // Combinar usuarios seleccionados con IDs ingresados manualmente
        allUserIds = [...new Set([...selectedUserIds, ...(formData.recipients || [])])];
        
        if (allUserIds.length === 0) {
          throw new Error('Debe seleccionar al menos un usuario o ingresar IDs manualmente');
        }
      }

      // Mapear los datos del formulario al formato del backend
      const baseAlertData: Omit<CreateAlertRequest, 'user_id' | 'user_ids' | 'send_to_all'> = {
        type: notificationType,
        title: formData.title || '',
        message: formData.message || '',
        priority: formData.priority as AlertPriority || 'medium',
        icon: notificationType === 'reminder' ? 'calendar' : 
              notificationType === 'announcement' ? 'announcement' : 
              notificationType === 'warning' ? 'warning' : 'info',
        color: notificationType === 'reminder' ? '#FF9800' : 
               notificationType === 'announcement' ? '#9C27B0' : 
               notificationType === 'warning' ? '#F44336' : '#2196F3',
        image_url: formData.metadata?.imageUrl || undefined,
        action_button: formData.metadata?.actionUrl ? {
          text: 'Ver más',
          url: formData.metadata.actionUrl
        } : formData.metadata?.deepLink ? {
          text: 'Abrir',
          url: formData.metadata.deepLink
        } : undefined,
        expires_at: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
        metadata: {
          source: 'web',
          created_by: 'current-user', // TODO: Obtener del contexto de autenticación
          deepLink: formData.metadata?.deepLink || undefined,
          sound: formData.metadata?.sound || undefined
        },
        data: notificationType === 'reminder' ? {
          reminder_date: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
          reminder_repeat: 'none',
          action_url: formData.metadata?.actionUrl || formData.metadata?.deepLink
        } : notificationType === 'message' ? {
          sender_id: 'system',
          sender_name: 'Sistema'
        } : undefined
      };

      // Determinar qué opción de destinatario usar según el tipo seleccionado
      let alertData: CreateAlertRequest;
      
      if (formData.recipientType === 'all') {
        // Usar send_to_all para todos los usuarios activos
        alertData = {
          ...baseAlertData,
          send_to_all: true
        };
      } else if (allUserIds.length === 1) {
        // Un solo usuario: usar user_id
        alertData = {
          ...baseAlertData,
          user_id: allUserIds[0]
        };
      } else {
        // Múltiples usuarios: usar user_ids
        alertData = {
          ...baseAlertData,
          user_ids: allUserIds
        };
      }

      // Crear notificación/es (una sola llamada para todos los casos)
      const response = await notificationService.createAlert(alertData);
      
      // Mostrar mensaje de éxito
      console.log(`Notificaciones creadas: ${response.total_created} usuario(s)`);

      // Llamar al callback del componente padre
      onSubmit({
        ...formData,
        status: 'draft',
        createdAt: new Date(),
        createdBy: 'current-user'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear notificación';
      setErrors(prev => ({ ...prev, submit: errorMessage }));
      console.error('Error al crear notificación:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    const updatedData = {
      ...formData,
      [field]: value
    };
    setFormData(updatedData);
    // Actualizar preview en tiempo real
    if (onPreviewChange) {
      onPreviewChange(updatedData);
    }
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMetadataChange = (field: string, value: string) => {
    const updatedData = {
      ...formData,
      metadata: {
        ...formData.metadata,
        [field]: value
      }
    };
    setFormData(updatedData);
    // Actualizar preview en tiempo real
    if (onPreviewChange) {
      onPreviewChange(updatedData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        {/* Información básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="Bell" size={20} />
            Información Básica
          </h3>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
            <Icon name="Smartphone" size={24} className="text-primary" />
            <div>
              <p className="font-medium text-foreground">Notificación Push</p>
              <p className="text-sm text-muted-foreground">Esta notificación se enviará a la aplicación móvil</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              options={notificationTypeOptions}
              value={notificationType}
              onChange={(value) => setNotificationType(value as AlertType)}
              placeholder="Tipo de notificación"
              label="Tipo"
              required
            />

            <Select
              options={priorityOptions}
              value={formData.priority}
              onChange={(value) => handleChange('priority', value as NotificationPriority)}
              placeholder="Prioridad"
              label="Prioridad"
              required
            />
          </div>

          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Ej: Nueva oferta especial"
            required
            error={errors.title}
          />

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Mensaje
              <span className="text-destructive ml-1">*</span>
            </label>
            <textarea
              className={`flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.message ? 'border-destructive' : ''
              }`}
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Escribe el mensaje de la notificación..."
              maxLength={1000}
            />
            <div className="flex justify-between mt-1">
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message}</p>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formData.message?.length || 0} / 1000 caracteres
              </span>
            </div>
          </div>
        </div>

        {/* Destinatarios */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="Users" size={20} />
            Destinatarios
          </h3>

          <Select
            options={recipientTypeOptions}
            value={formData.recipientType}
            onChange={(value) => {
              // Actualizar el estado directamente
              setFormData(prev => ({
                ...prev,
                recipientType: value as 'all' | 'specific'
              }));
              // Limpiar selección de usuarios cuando cambia el tipo
              if (value === 'all') {
                setSelectedUserIds([]);
                setFormData(prev => ({
                  ...prev,
                  recipients: []
                }));
              }
            }}
            placeholder="Tipo de destinatarios"
            label="Enviar a"
            required
          />

          {formData.recipientType === 'all' && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Icon name="Users" size={24} className="text-primary" />
                <div>
                  <p className="font-medium text-foreground">Enviar a todos los usuarios activos</p>
                  <p className="text-sm text-muted-foreground">
                    La notificación se enviará a todos los usuarios con estado ACTIVO en el sistema
                    {users.length > 0 && ` (${users.length} usuarios encontrados en la lista)`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nota: Solo se enviará a usuarios con account_status: "ACTIVE"
                  </p>
                </div>
              </div>
            </div>
          )}

          {formData.recipientType === 'specific' && (
            <div className="space-y-3">
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
              ) : (
                <>
                  <div className="max-h-60 overflow-y-auto border border-input rounded-lg p-3 space-y-2 bg-background">
                    {users.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay usuarios disponibles
                      </p>
                    ) : (
                      users.map((user) => (
                        <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border border-input"
                            checked={selectedUserIds.includes(user.id || '')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds([...selectedUserIds, user.id || '']);
                              } else {
                                setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <span className="text-sm text-foreground font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({user.email})
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ID: {user.id?.substring(0, 8)}...
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedUserIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedUserIds.length} usuario(s) seleccionado(s)
                    </p>
                  )}
                  {errors.recipients && (
                    <p className="text-sm text-destructive">{errors.recipients}</p>
                  )}
                  <Input
                    label="O ingresar IDs manualmente (separados por comas)"
                    value={formData.recipients?.join(', ') || ''}
                    onChange={(e) => {
                      const ids = e.target.value.split(',').map(id => id.trim()).filter(Boolean);
                      handleChange('recipients', ids);
                      // También actualizar selectedUserIds si los IDs son válidos
                      const validIds = ids.filter(id => users.some(u => u.id === id));
                      if (validIds.length > 0) {
                        setSelectedUserIds([...new Set([...selectedUserIds, ...validIds])]);
                      }
                    }}
                    placeholder="Ej: 6907cff1f33982c5d9b3c992, 6907cff1f33982c5d9b3c993"
                    description="Ingresa los IDs de los usuarios separados por comas"
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Programación */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="Calendar" size={20} />
            Programación
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="schedule"
              className="h-4 w-4 rounded border border-input"
              checked={!!formData.scheduledAt}
              onChange={(e) => {
                if (e.target.checked) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  handleChange('scheduledAt', tomorrow);
                } else {
                  handleChange('scheduledAt', undefined);
                }
              }}
            />
            <label htmlFor="schedule" className="text-sm text-foreground cursor-pointer">
              Programar envío para más tarde
            </label>
          </div>

          {formData.scheduledAt && (
            <Input
              type="datetime-local"
              label="Fecha y hora de envío"
              value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleChange('scheduledAt', new Date(e.target.value))}
            />
          )}
        </div>

        {/* Opciones avanzadas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="Settings" size={20} />
            Opciones Avanzadas
          </h3>

            <Input
              label="URL de imagen"
              value={formData.metadata?.imageUrl || ''}
              onChange={(e) => handleMetadataChange('imageUrl', e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              type="url"
            />

            <Input
              label="Deep Link"
              value={formData.metadata?.deepLink || ''}
              onChange={(e) => handleMetadataChange('deepLink', e.target.value)}
              placeholder="app://pantalla/123"
              description="URL que se abrirá al hacer clic en la notificación"
            />

            <Input
              label="Action URL"
              value={formData.metadata?.actionUrl || ''}
              onChange={(e) => handleMetadataChange('actionUrl', e.target.value)}
              placeholder="https://ejemplo.com/accion"
              description="URL de acción alternativa"
            />
          </div>

          {errors.submit && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}
        </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          iconName="X"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          iconName="Send"
          disabled={loading}
        >
          {loading ? 'Enviando...' : formData.scheduledAt ? 'Programar Envío' : 'Enviar Ahora'}
        </Button>
      </div>
    </form>
  );
};

export default CreateNotificationForm;

