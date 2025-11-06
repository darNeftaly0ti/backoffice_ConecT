import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { MobileAppUser, UserFormData, UserStatus, UserRole, UserSegment } from '../types';

interface CreateUserFormProps {
  onSubmit: (user: Partial<MobileAppUser>) => void;
  onCancel: () => void;
  initialData?: Partial<MobileAppUser>;
  isLoading?: boolean;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<UserFormData>>({
    username: initialData?.username || initialData?.email?.split('@')[0] || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    password: '', // No se prellena por seguridad
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    onuSn: initialData?.onuSn || '',
    status: initialData?.status || 'active',
    role: initialData?.role || 'client',
    segment: initialData?.segment || 'standard',
    metadata: {
      avatar: initialData?.metadata?.avatar || '',
      company: initialData?.metadata?.company || '',
      address: initialData?.metadata?.address || '',
      notes: initialData?.metadata?.notes || '',
      tags: initialData?.metadata?.tags || []
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'suspended', label: 'Suspendido' }
  ];

  const roleOptions = [
    { value: 'client', label: 'Cliente' },
    { value: 'admin', label: 'Administrador' },
    { value: 'provider', label: 'Proveedor' },
    { value: 'viewer', label: 'Visualizador' }
  ];

  const segmentOptions = [
    { value: 'premium', label: 'Premium' },
    { value: 'standard', label: 'Estándar' },
    { value: 'basic', label: 'Básico' },
    { value: 'trial', label: 'Prueba' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar username (obligatorio)
    if (!formData.username?.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
    }

    // Validar email (obligatorio)
    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'El email no es válido';
    }

    // Validar nombre (obligatorio)
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar apellido (obligatorio)
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    // Validar ONU Serial Number (opcional en creación mínima)
    if (formData.onuSn && formData.onuSn.trim() && formData.onuSn.trim().length < 3) {
      newErrors.onuSn = 'El número de serie ONU debe tener al menos 3 caracteres';
    }

    // Validar teléfono (obligatorio según el backend)
    if (!formData.phone?.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else {
      // Permitir formato internacional: +57 300 123 4567 o (300) 123-4567
      const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'El teléfono no es válido. Use formato: +502 42158057';
      }
    }

    // Validar password (obligatorio según el backend)
    if (!formData.password?.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.trim().length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar status
    if (!formData.status) {
      newErrors.status = 'El estado es requerido';
    }

    // Validar role
    if (!formData.role) {
      newErrors.role = 'El rol es requerido';
    }

    // Validar URL de avatar si se proporciona
    if (formData.metadata?.avatar && formData.metadata.avatar.trim()) {
      try {
        new URL(formData.metadata.avatar.trim());
      } catch {
        newErrors.avatar = 'La URL del avatar no es válida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Asegurar que todos los campos requeridos están presentes
      if (!formData.username || !formData.email || !formData.firstName || !formData.lastName || !formData.phone || !formData.password || !formData.status || !formData.role) {
        return;
      }

      // Asegurar que metadata siempre existe
      const metadata = formData.metadata || {};
      
      // Preparar los datos del usuario sin fechas ni IDs
      // Las fechas y el ID serán manejados por el componente padre
      // IMPORTANTE: Si onuSn está vacío o solo espacios, no incluirlo (undefined)
      const onuSnValue = formData.onuSn?.trim();
      const cleanOnuSn = onuSnValue && onuSnValue.length > 0 ? onuSnValue : undefined;
      
      // Limpiar metadata: solo incluir campos que tengan valor
      const cleanMetadata: any = {};
      if (metadata.avatar?.trim()) {
        cleanMetadata.avatar = metadata.avatar.trim();
      }
      if (metadata.company?.trim()) {
        cleanMetadata.company = metadata.company.trim();
      }
      if (metadata.address?.trim()) {
        cleanMetadata.address = metadata.address.trim();
      }
      if (metadata.notes?.trim()) {
        cleanMetadata.notes = metadata.notes.trim();
      }
      if (metadata.tags && metadata.tags.length > 0) {
        const filteredTags = metadata.tags.filter(tag => tag.trim().length > 0);
        if (filteredTags.length > 0) {
          cleanMetadata.tags = filteredTags;
        }
      }
      
      const userData: Partial<MobileAppUser> & { username?: string; onuSn?: string; password?: string; phone?: string } = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(), // Obligatorio
        password: formData.password, // Obligatorio (no se trimea por seguridad)
        onuSn: cleanOnuSn, // Opcional - solo se incluye si tiene valor
        status: formData.status,
        role: formData.role,
        segment: formData.segment,
        metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : undefined
      };

      // Solo incluir createdAt si estamos editando
      if (initialData?.createdAt) {
        userData.createdAt = initialData.createdAt;
      }

      onSubmit(userData);
    }
  };

  const handleChange = (
    field: 'username' | 'email' | 'phone' | 'password' | 'firstName' | 'lastName' | 'onuSn' | 'status' | 'role' | 'segment',
    value: string | UserStatus | UserRole | UserSegment | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMetadataChange = (field: keyof NonNullable<UserFormData['metadata']>, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...(prev.metadata || {}),
        [field]: value
      }
    }));
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...(prev.metadata || {}),
        tags
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Procesando...</span>
          </div>
        </div>
      )}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        {/* Información básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="User" size={20} />
            Información Básica
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de Usuario"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Ej: elmer"
              required
              error={errors.username}
              disabled={isLoading}
              description="Solo letras, números y guiones bajos"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
              error={errors.email}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="Ej: Juan"
              required
              error={errors.firstName}
              disabled={isLoading}
            />

            <Input
              label="Apellido"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Ej: Pérez"
              required
              error={errors.lastName}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+502 42158057"
              required
              error={errors.phone}
              description="Número de teléfono con código de país"
              disabled={isLoading}
            />

            <Input
              label="Contraseña"
              type="password"
              value={formData.password || ''}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              error={errors.password}
              description="Mínimo 6 caracteres"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Número de Serie ONU"
              value={formData.onuSn || ''}
              onChange={(e) => handleChange('onuSn', e.target.value)}
              placeholder="Ej: GPON001FCFD0"
              error={errors.onuSn}
              disabled={isLoading}
              description="Opcional - Número de serie del dispositivo ONU"
            />
          </div>
        </div>

        {/* Configuración de cuenta */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="Settings" size={20} />
            Configuración de Cuenta
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              options={statusOptions}
              value={formData.status}
              onChange={(value) => handleChange('status', value as UserStatus)}
              placeholder="Estado"
              label="Estado"
              required
              error={errors.status}
              disabled={isLoading}
            />

            <Select
              options={roleOptions}
              value={formData.role}
              onChange={(value) => handleChange('role', value as UserRole)}
              placeholder="Rol"
              label="Rol"
              required
              error={errors.role}
              disabled={isLoading}
            />

            <Select
              options={segmentOptions}
              value={formData.segment}
              onChange={(value) => handleChange('segment', value as UserSegment)}
              placeholder="Segmento"
              label="Segmento"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Información adicional */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="Info" size={20} />
            Información Adicional
          </h3>

          <Input
            label="URL de Avatar"
            type="url"
            value={formData.metadata?.avatar || ''}
            onChange={(e) => handleMetadataChange('avatar', e.target.value)}
            placeholder="https://ejemplo.com/avatar.jpg"
            description="URL de la imagen de perfil del usuario"
            error={errors.avatar}
            disabled={isLoading}
          />

          <Input
            label="Empresa"
            value={formData.metadata?.company || ''}
            onChange={(e) => handleMetadataChange('company', e.target.value)}
            placeholder="Nombre de la empresa"
            disabled={isLoading}
          />

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Dirección
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.metadata?.address || ''}
              onChange={(e) => handleMetadataChange('address', e.target.value)}
              placeholder="Dirección completa del usuario"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Notas
            </label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.metadata?.notes || ''}
              onChange={(e) => handleMetadataChange('notes', e.target.value)}
              placeholder="Notas adicionales sobre el usuario..."
              disabled={isLoading}
            />
          </div>

          <Input
            label="Etiquetas (separadas por comas)"
            value={formData.metadata?.tags?.join(', ') || ''}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="VIP, Cliente recurrente, etc."
            description="Etiquetas para organizar y filtrar usuarios"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          iconName="X"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          iconName="Save"
          disabled={isLoading}
        >
          {isLoading 
            ? (initialData ? 'Actualizando...' : 'Creando...') 
            : (initialData ? 'Actualizar Usuario' : 'Crear Usuario')
          }
        </Button>
      </div>
    </form>
  );
};

export default CreateUserForm;

