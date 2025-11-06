import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { MobileAppUser, UserFilters } from '../types';
import { format } from 'date-fns';

interface UserListProps {
  users: MobileAppUser[];
  onEdit?: (user: MobileAppUser) => void;
  onDelete?: (id: string) => void;
  onView?: (user: MobileAppUser) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  onEdit,
  onDelete,
  onView
}) => {
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: undefined,
    role: undefined,
    segment: undefined
  });

  const getStatusColor = (status: MobileAppUser['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'suspended':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRoleColor = (role: MobileAppUser['role']) => {
    switch (role) {
      case 'admin':
        return 'text-error';
      case 'provider':
        return 'text-primary';
      case 'client':
        return 'text-success';
      case 'viewer':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  const filteredUsers = users.filter(user => {
    const searchMatch = !filters.search || 
      user.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      (user.phone && user.phone.includes(filters.search)) ||
      (user.metadata?.company && user.metadata.company.toLowerCase().includes(filters.search.toLowerCase()));

    const statusMatch = !filters.status || user.status === filters.status;
    const roleMatch = !filters.role || user.role === filters.role;
    const segmentMatch = !filters.segment || user.segment === filters.segment;

    return searchMatch && statusMatch && roleMatch && segmentMatch;
  });

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'suspended', label: 'Suspendido' }
  ];

  const roleOptions = [
    { value: '', label: 'Todos los roles' },
    { value: 'client', label: 'Cliente' },
    { value: 'admin', label: 'Administrador' },
    { value: 'provider', label: 'Proveedor' },
    { value: 'viewer', label: 'Visualizador' }
  ];

  const segmentOptions = [
    { value: '', label: 'Todos los segmentos' },
    { value: 'premium', label: 'Premium' },
    { value: 'standard', label: 'Estándar' },
    { value: 'basic', label: 'Básico' },
    { value: 'trial', label: 'Prueba' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Icon name="Users" size={24} />
            Usuarios de la App Móvil
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredUsers.length} de {users.length} usuarios
          </span>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono o empresa..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            options={statusOptions}
            value={filters.status || ''}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value ? value as MobileAppUser['status'] : undefined }))}
            placeholder="Filtrar por estado"
            label="Estado"
          />

          <Select
            options={roleOptions}
            value={filters.role || ''}
            onChange={(value) => setFilters(prev => ({ ...prev, role: value ? value as MobileAppUser['role'] : undefined }))}
            placeholder="Filtrar por rol"
            label="Rol"
          />

          <Select
            options={segmentOptions}
            value={filters.segment || ''}
            onChange={(value) => setFilters(prev => ({ ...prev, segment: value ? value as MobileAppUser['segment'] : undefined }))}
            placeholder="Filtrar por segmento"
            label="Segmento"
          />
        </div>
      </div>

      <div className="divide-y divide-border">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="UserX" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filters.search || filters.status || filters.role || filters.segment
                ? 'No se encontraron usuarios con los filtros aplicados'
                : 'No hay usuarios registrados'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="p-6 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="relative">
                    {user.metadata?.avatar ? (
                      <img
                        src={user.metadata.avatar}
                        alt={user.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                        <Icon name="User" size={24} className="text-primary" />
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                      user.status === 'active' ? 'bg-success' : 
                      user.status === 'pending' ? 'bg-warning' : 
                      user.status === 'suspended' ? 'bg-error' : 'bg-muted'
                    }`} />
                  </div>

                  {/* Información del usuario */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">{user.fullName}</h3>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(user.status)}`}>
                        {user.status === 'active' && 'Activo'}
                        {user.status === 'inactive' && 'Inactivo'}
                        {user.status === 'pending' && 'Pendiente'}
                        {user.status === 'suspended' && 'Suspendido'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="Mail" size={14} />
                        {user.email}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Icon name="Phone" size={14} />
                          {user.phone}
                        </span>
                      )}
                      {user.metadata?.company && (
                        <span className="flex items-center gap-1">
                          <Icon name="Building" size={14} />
                          {user.metadata.company}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={`font-medium capitalize ${getRoleColor(user.role)}`}>
                        {user.role === 'client' && 'Cliente'}
                        {user.role === 'admin' && 'Administrador'}
                        {user.role === 'provider' && 'Proveedor'}
                        {user.role === 'viewer' && 'Visualizador'}
                      </span>
                      {user.segment && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground capitalize">
                            {user.segment}
                          </span>
                        </>
                      )}
                      {user.metadata?.tags && user.metadata.tags.length > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1">
                            {user.metadata.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-muted text-xs">
                                {tag}
                              </span>
                            ))}
                            {user.metadata.tags.length > 3 && (
                              <span className="text-muted-foreground">
                                +{user.metadata.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" size={12} />
                        Creado: {format(new Date(user.createdAt), "dd MMM yyyy")}
                      </span>
                      {user.lastLoginAt && (
                        <span className="flex items-center gap-1">
                          <Icon name="Clock" size={12} />
                          Último acceso: {format(new Date(user.lastLoginAt), "dd MMM yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(user)}
                      iconName="Eye"
                      title="Ver detalles"
                    />
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(user)}
                      iconName="Edit"
                      title="Editar"
                    />
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(user.id)}
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

export default UserList;

