import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import CreateUserForm from './components/CreateUserForm';
import UserList from './components/UserList';
import { MobileAppUser } from './types';
import userService from '../../services/user.service';
import { exportToPDF, exportToExcel, tableToHTML } from '../../utils/export.utils';

const UserManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<MobileAppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Datos de usuarios - se cargan desde la API
  const [users, setUsers] = useState<MobileAppUser[]>([]);

  useEffect(() => {
    document.title = 'Gestión de Usuarios - Conect@t Analytics';
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los usuarios';
      setError(errorMessage);
      console.error('Error al cargar usuarios:', err);
      // Mantener usuarios vacíos en caso de error
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleCreateUser = async (userData: Partial<MobileAppUser>) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (editingUser) {
        // TODO: Implementar actualización de usuario cuando esté disponible en la API
        // Por ahora, actualizamos localmente
        const updatedUser: MobileAppUser = {
          ...userData as MobileAppUser,
          id: editingUser.id,
          fullName: `${userData.firstName} ${userData.lastName}`.trim(),
          createdAt: editingUser.createdAt,
          updatedAt: new Date(),
          providerId: editingUser.providerId
        };
        setUsers(prev => prev.map(u =>
          u.id === editingUser.id ? updatedUser : u
        ));
        setSuccessMessage('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario usando la API
        const newUser = await userService.createUserFromMobileAppUser(userData);
        setUsers(prev => [newUser, ...prev]);
        setSuccessMessage('Usuario creado correctamente');
      }

      setShowCreateForm(false);
      setEditingUser(null);
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Recargar la lista de usuarios para asegurar que está actualizada
      await loadUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el usuario';
      setError(errorMessage);
      console.error('Error al crear usuario:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: MobileAppUser) => {
    setEditingUser(user);
    setShowCreateForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleView = (user: MobileAppUser) => {
    // Aquí podrías abrir un modal o navegar a una página de detalles
    console.log('Ver detalles del usuario:', user);
    // Por ahora, simplemente editamos el usuario
    handleEdit(user);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingUser(null);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    try {
      const filename = `gestion-usuarios-${new Date().toISOString().split('T')[0]}`;
      
      // Preparar datos para exportar
      const exportData = users.map(user => ({
        'Nombre Completo': user.fullName,
        'Email': user.email,
        'Teléfono': user.phone || 'N/A',
        'Estado': user.status,
        'Rol': user.role,
        'Segmento': user.segment || 'N/A',
        'Usuario': user.username || 'N/A',
        'ONU Serial': user.onuSn || 'N/A',
        'Empresa': user.metadata?.company || 'N/A',
        'Dirección': user.metadata?.address || 'N/A',
        'Etiquetas': user.metadata?.tags ? user.metadata.tags.join(', ') : 'N/A',
        'Fecha de Creación': user.createdAt.toISOString().split('T')[0],
        'Última Actualización': user.updatedAt.toISOString().split('T')[0],
        'Último Acceso': user.lastLoginAt ? user.lastLoginAt.toISOString().split('T')[0] : 'N/A'
      }));
      
      if (exportData.length === 0) {
        alert('No hay usuarios para exportar');
        return;
      }
      
      if (format === 'excel') {
        exportToExcel(exportData, filename);
      } else if (format === 'pdf') {
        // Preparar contenido HTML para PDF
        const sections: string[] = [];
        
        // Sección: Resumen
        sections.push(`
          <h2>Resumen</h2>
          <p>Total de usuarios: ${users.length}</p>
          <p>Usuarios activos: ${users.filter(u => u.status === 'active').length}</p>
          <p>Usuarios inactivos: ${users.filter(u => u.status === 'inactive').length}</p>
        `);
        
        // Sección: Lista de Usuarios
        sections.push(`
          <h2>Lista de Usuarios</h2>
          ${tableToHTML(exportData, Object.keys(exportData[0]), Object.keys(exportData[0]))}
        `);
        
        const content = sections.join('<br/><br/>');
        exportToPDF('Gestión de Usuarios', content, filename);
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

  return (
    <>
      <Helmet>
        <title>Gestión de Usuarios - Conect@t Analytics Dashboard</title>
        <meta name="description" content="Gestión de usuarios para la aplicación móvil" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleSidebarToggle}
          isMobileOpen={mobileMenuOpen}
          onMobileClose={handleMobileMenuClose}
        />
        
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
          <Header
            onMenuToggle={handleMobileMenuToggle}
            showMobileMenu={mobileMenuOpen}
            onExport={handleExport}
          />
          
          <main className="p-4 lg:p-6 space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Gestión de Usuarios
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Crea y gestiona usuarios para la aplicación móvil
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!showCreateForm && (
                    <Button
                      onClick={() => {
                        setShowCreateForm(true);
                        setEditingUser(null);
                      }}
                      iconName="Plus"
                    >
                      Nuevo Usuario
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Mensajes de error y éxito */}
            {error && (
              <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="AlertCircle" size={20} />
                  <span>{error}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setError(null)}
                  iconName="X"
                />
              </div>
            )}

            {successMessage && (
              <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="CheckCircle" size={20} />
                  <span>{successMessage}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSuccessMessage(null)}
                  iconName="X"
                />
              </div>
            )}

            {/* Indicador de carga */}
            {loading && (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">
                    {editingUser ? 'Actualizando usuario...' : 'Creando usuario...'}
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            {!loading && showCreateForm && (
              <CreateUserForm
                onSubmit={handleCreateUser}
                onCancel={handleCancelForm}
                initialData={editingUser || undefined}
                isLoading={loading}
              />
            )}

            {!loading && !showCreateForm && (
              <>
                {loadingUsers ? (
                  <div className="bg-card border border-border rounded-lg p-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="text-muted-foreground">Cargando usuarios...</span>
                    </div>
                  </div>
                ) : (
                  <UserList
                    users={users}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default UserManagement;

