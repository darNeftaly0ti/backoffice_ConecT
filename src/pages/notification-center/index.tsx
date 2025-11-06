import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import CreateNotificationForm from './components/CreateNotificationForm';
import CreateSurveyForm from './components/CreateSurveyForm';
import NotificationList from './components/NotificationList';
import SurveyList from './components/SurveyList';
import NotificationPreview from './components/NotificationPreview';
import { Notification, Survey, Question } from './types';
import notificationService, { AlertResponse, AlertType } from '../../services/notification.service';
import { surveyResponseService, notificationResponseService } from '../../services/notification.service';
import { exportToPDF, exportToExcel, tableToHTML } from '../../utils/export.utils';

const NotificationCenter: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'surveys'>('notifications');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Notification | Survey | null>(null);
  const [previewData, setPreviewData] = useState<Partial<Notification>>({});

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [errorNotifications, setErrorNotifications] = useState<string | null>(null);

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [errorSurveys, setErrorSurveys] = useState<string | null>(null);

  /**
   * Mapea un AlertResponse de la API a un Notification del frontend
   */
  const mapAlertToNotification = async (alert: AlertResponse): Promise<Notification> => {
    const notificationId = alert.id || alert._id || '';
    
    // Determinar destinatarios
    let recipients: string[] = [];
    let recipientType: 'all' | 'segment' | 'specific' = 'specific';
    
    if (alert.user_id) {
      recipients = [alert.user_id];
      recipientType = 'specific';
    }

    // Obtener el número de destinatarios desde notification_responses
    let recipientsCount = recipients.length;
    try {
      const notificationResponses = await notificationResponseService.getAlertNotificationResponses(notificationId);
      if (notificationResponses.success && notificationResponses.responses) {
        recipientsCount = notificationResponses.total || notificationResponses.responses.length;
        // Si tenemos respuestas, extraer los user_ids reales
        if (notificationResponses.responses.length > 0) {
          const userIds = notificationResponses.responses.map(r => r.user_id).filter(Boolean);
          if (userIds.length > 0) {
            recipients = [...new Set(userIds)];
          }
        }
      }
    } catch (error) {
      console.warn('No se pudieron obtener respuestas de notificación:', error);
    }

    // Determinar el estado
    let status: Notification['status'] = 'sent';
    const now = new Date();
    
    // Si tiene fecha de creación pero no tiene fecha de envío, podría ser draft
    if (alert.created_at && !alert.read_at) {
      // Verificar si tiene fecha programada
      if (alert.data?.reminder_date) {
        const reminderDate = new Date(alert.data.reminder_date);
        if (reminderDate > now) {
          status = 'scheduled';
        }
      }
    }

    // Si está expirada, podría ser 'sent' o 'failed'
    if (alert.expires_at) {
      const expiresAt = new Date(alert.expires_at);
      if (expiresAt < now && status === 'scheduled') {
        status = 'sent';
      }
    }

    // Mapear prioridad del backend al frontend
    const priorityMap: Record<string, Notification['priority']> = {
      'urgent': 'high',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    const priority = priorityMap[alert.priority || 'medium'] || 'medium';

    // Determinar fecha de envío
    let sentAt: Date | undefined;
    if (alert.read_at) {
      sentAt = new Date(alert.read_at);
    } else if (alert.created_at && status === 'sent') {
      sentAt = new Date(alert.created_at);
    }

    // Determinar fecha programada
    let scheduledAt: Date | undefined;
    if (alert.data?.reminder_date) {
      scheduledAt = new Date(alert.data.reminder_date);
    }

    return {
      id: notificationId,
      title: alert.title || '',
      message: alert.message || '',
      priority,
      status,
      recipients: recipients.length > 0 ? recipients : (recipientsCount > 0 ? Array(recipientsCount).fill('').map((_, i) => `user-${i}`) : []),
      recipientType,
      scheduledAt,
      sentAt,
      createdAt: alert.created_at ? new Date(alert.created_at) : new Date(),
      createdBy: alert.metadata?.created_by || 'system',
      metadata: {
        imageUrl: alert.image_url,
        actionUrl: alert.action_button?.url,
        deepLink: alert.data?.action_url || alert.action_button?.url,
        sound: alert.data?.sound
      }
    };
  };

  /**
   * Mapea un AlertResponse de la API a un Survey del frontend
   */
  const mapAlertToSurvey = async (alert: AlertResponse): Promise<Survey> => {
    const surveyId = alert.id || alert._id || '';
    const questions: Question[] = [];
    
    // Extraer preguntas de data.survey_questions
    if (alert.data?.survey_questions && Array.isArray(alert.data.survey_questions)) {
      questions.push(...alert.data.survey_questions.map((q: any, index: number) => {
        const frontendType = notificationService.mapQuestionTypeFromBackend(q.type);
        return {
          id: `q-${index}`,
          type: frontendType as Question['type'],
          question: q.question || '',
          required: q.required || false,
          options: q.options || [],
          minRating: q.minRating,
          maxRating: q.maxRating
        };
      }));
    }

    // Determinar destinatarios
    let recipients: string[] = [];
    let recipientType: 'all' | 'segment' | 'specific' = 'specific';
    
    // Si tiene user_id, es un usuario específico
    if (alert.user_id) {
      recipients = [alert.user_id];
      recipientType = 'specific';
    }

    // Obtener estadísticas de la encuesta
    let responsesCount = 0;
    let completionRate = 0;
    
    try {
      // Intentar obtener estadísticas usando el alert_id como survey_id
      // El backend puede usar el alert_id para identificar la encuesta
      if (surveyId) {
        try {
          const stats = await surveyResponseService.getSurveyStats(surveyId);
          responsesCount = stats.total_responses || 0;
          completionRate = stats.completion_rate || 0;
        } catch (statsError) {
          // Si falla con el alert_id, intentar con el survey_id del data
          const surveyIdFromData = alert.data?.survey_id;
          if (surveyIdFromData && surveyIdFromData !== surveyId) {
            try {
              const stats = await surveyResponseService.getSurveyStats(surveyIdFromData);
              responsesCount = stats.total_responses || 0;
              completionRate = stats.completion_rate || 0;
            } catch (error2) {
              console.warn('No se pudieron obtener estadísticas de la encuesta:', error2);
            }
          } else {
            console.warn('No se pudieron obtener estadísticas de la encuesta:', statsError);
          }
        }
      }
    } catch (error) {
      console.warn('Error al obtener estadísticas de la encuesta:', error);
    }

    // Determinar el estado basado en la fecha de expiración
    let status: Survey['status'] = 'active';
    const now = new Date();
    if (alert.expires_at) {
      const expiresAt = new Date(alert.expires_at);
      if (expiresAt < now) {
        status = 'completed';
      }
    }

    return {
      id: surveyId,
      title: alert.title || '',
      description: alert.message || '',
      status,
      questions,
      recipients,
      recipientType,
      scheduledAt: alert.created_at ? new Date(alert.created_at) : undefined,
      expiresAt: alert.expires_at ? new Date(alert.expires_at) : undefined,
      createdAt: alert.created_at ? new Date(alert.created_at) : new Date(),
      createdBy: alert.metadata?.created_by || 'system',
      responsesCount,
      completionRate
    };
  };

  /**
   * Carga las encuestas desde la API
   */
  const loadSurveys = async () => {
    setLoadingSurveys(true);
    setErrorSurveys(null);
    try {
      const response = await notificationService.getAllAlerts('survey');
      
      if (response.success && response.alerts) {
        // Mapear cada alert a Survey
        const mappedSurveys = await Promise.all(
          response.alerts.map(alert => mapAlertToSurvey(alert))
        );
        setSurveys(mappedSurveys);
      } else {
        setSurveys([]);
      }
    } catch (error) {
      console.error('Error al cargar encuestas:', error);
      setErrorSurveys(error instanceof Error ? error.message : 'Error al cargar encuestas');
      // Mantener array vacío en caso de error
      setSurveys([]);
    } finally {
      setLoadingSurveys(false);
    }
  };

  /**
   * Carga las notificaciones desde la API (excluyendo surveys)
   */
  const loadNotifications = async () => {
    setLoadingNotifications(true);
    setErrorNotifications(null);
    try {
      // Obtener todos los alerts excepto surveys
      const allTypes: AlertType[] = ['message', 'reminder', 'announcement', 'warning'];
      const allNotifications: Notification[] = [];

      // Obtener notificaciones de cada tipo
      for (const type of allTypes) {
        try {
          const response = await notificationService.getAllAlerts(type);
          if (response.success && response.alerts) {
            const mapped = await Promise.all(
              response.alerts.map(alert => mapAlertToNotification(alert))
            );
            allNotifications.push(...mapped);
          }
        } catch (error) {
          console.warn(`Error al cargar notificaciones de tipo ${type}:`, error);
        }
      }

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      setErrorNotifications(error instanceof Error ? error.message : 'Error al cargar notificaciones');
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    document.title = 'Centro de Notificaciones - Conect@t Analytics';
    loadSurveys();
    loadNotifications();
  }, []);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleCreateNotification = async (notificationData: Partial<Notification>) => {
    // El formulario ya envió la notificación a la API
    // Solo recargamos la lista de notificaciones
    await loadNotifications();
    setShowCreateForm(false);
    setEditingItem(null);
    setPreviewData({});
  };

  const handleCreateSurvey = async (surveyData: Partial<Survey>) => {
    // El formulario ya envió la encuesta a la API
    // Solo recargamos la lista de encuestas
    await loadSurveys();
    setShowCreateForm(false);
  };

  const handleEdit = (item: Notification | Survey) => {
    setEditingItem(item);
    setShowCreateForm(true);
    if ('priority' in item && 'status' in item) {
      setPreviewData(item as Partial<Notification>);
    } else {
      setPreviewData({});
    }
  };

  const handleDelete = async (id: string) => {
    if (activeTab === 'notifications') {
      // TODO: Implementar eliminación de notificaciones desde la API
      // Por ahora, recargamos la lista desde la API
      await loadNotifications();
    } else {
      // TODO: Implementar eliminación de encuestas desde la API
      // Por ahora, recargamos la lista desde la API
      await loadSurveys();
    }
  };

  const handleView = (item: Notification | Survey) => {
    // Aquí podrías abrir un modal o navegar a una página de detalles
    console.log('Ver detalles:', item);
  };

  const handleActivate = (id: string) => {
    setSurveys(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'active' } : s
    ));
  };

  const handlePause = (id: string) => {
    setSurveys(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'paused' } : s
    ));
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingItem(null);
    setPreviewData({});
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    try {
      const filename = `centro-notificaciones-${new Date().toISOString().split('T')[0]}`;
      
      // Preparar datos para exportar según el tab activo
      let exportData: any[] = [];
      let title = '';
      
      if (activeTab === 'notifications') {
        title = 'Notificaciones';
        // Exportar notificaciones
        exportData = notifications.map(notif => ({
          'Título': notif.title,
          'Mensaje': notif.message,
          'Prioridad': notif.priority,
          'Estado': notif.status,
          'Destinatarios': notif.recipients.length,
          'Tipo de Destinatario': notif.recipientType,
          'Fecha de Creación': notif.createdAt.toISOString().split('T')[0],
          'Fecha de Envío': notif.sentAt ? notif.sentAt.toISOString().split('T')[0] : 'N/A',
          'Fecha Programada': notif.scheduledAt ? notif.scheduledAt.toISOString().split('T')[0] : 'N/A',
          'Creado por': notif.createdBy
        }));
      } else {
        title = 'Encuestas';
        // Exportar encuestas
        exportData = surveys.map(survey => ({
          'Título': survey.title,
          'Descripción': survey.description,
          'Estado': survey.status,
          'Preguntas': survey.questions.length,
          'Destinatarios': survey.recipients.length,
          'Tipo de Destinatario': survey.recipientType,
          'Respuestas': survey.responsesCount,
          'Tasa de Completación (%)': `${survey.completionRate.toFixed(1)}%`,
          'Fecha de Creación': survey.createdAt.toISOString().split('T')[0],
          'Fecha Programada': survey.scheduledAt ? survey.scheduledAt.toISOString().split('T')[0] : 'N/A',
          'Fecha de Expiración': survey.expiresAt ? survey.expiresAt.toISOString().split('T')[0] : 'N/A',
          'Creado por': survey.createdBy
        }));
      }
      
      if (exportData.length === 0) {
        alert(`No hay ${activeTab === 'notifications' ? 'notificaciones' : 'encuestas'} para exportar`);
        return;
      }
      
      if (format === 'excel') {
        exportToExcel(exportData, filename);
      } else if (format === 'pdf') {
        // Preparar contenido HTML para PDF
        const sections: string[] = [];
        
        // Sección principal
        sections.push(`
          <h2>${title}</h2>
          ${tableToHTML(exportData, Object.keys(exportData[0]), Object.keys(exportData[0]))}
        `);
        
        // Si hay encuestas, agregar detalles de preguntas
        if (activeTab === 'surveys' && surveys.length > 0) {
          const questionsSection: string[] = [];
          surveys.forEach(survey => {
            if (survey.questions.length > 0) {
              const questionsData = survey.questions.map((q, index) => ({
                'Encuesta': survey.title,
                'Pregunta #': index + 1,
                'Pregunta': q.question,
                'Tipo': q.type,
                'Requerida': q.required ? 'Sí' : 'No',
                'Opciones': q.options ? q.options.join(', ') : 'N/A'
              }));
              questionsSection.push(tableToHTML(questionsData, Object.keys(questionsData[0]), Object.keys(questionsData[0])));
            }
          });
          
          if (questionsSection.length > 0) {
            sections.push(`
              <h2>Preguntas de Encuestas</h2>
              ${questionsSection.join('<br/>')}
            `);
          }
        }
        
        const content = sections.join('<br/><br/>');
        exportToPDF(`Centro de Notificaciones - ${title}`, content, filename);
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

  return (
    <>
      <Helmet>
        <title>Centro de Notificaciones - Conect@t Analytics Dashboard</title>
        <meta name="description" content="Gestión de notificaciones y encuestas para aplicación móvil" />
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
                    Centro de Notificaciones
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Crea y gestiona notificaciones y encuestas para la aplicación móvil
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!showCreateForm && (
                    <Button
                      onClick={() => {
                        setShowCreateForm(true);
                        setEditingItem(null);
                        setPreviewData({
                          title: '',
                          message: ''
                        });
                      }}
                      iconName="Plus"
                    >
                      {activeTab === 'notifications' ? 'Nueva Notificación' : 'Nueva Encuesta'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {!showCreateForm ? (
              <>
                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-border">
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                      activeTab === 'notifications'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon name="Bell" size={18} />
                      Notificaciones
                      <span className="bg-muted px-2 py-0.5 rounded-full text-xs">
                        {notifications.length}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('surveys')}
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                      activeTab === 'surveys'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon name="FileText" size={18} />
                      Encuestas
                      <span className="bg-muted px-2 py-0.5 rounded-full text-xs">
                        {surveys.length}
                      </span>
                    </span>
                  </button>
                </div>

                {/* Content */}
                {activeTab === 'notifications' ? (
                  <>
                    {loadingNotifications ? (
                      <div className="bg-card rounded-lg border border-border p-12 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        <p className="text-muted-foreground">Cargando notificaciones...</p>
                      </div>
                    ) : errorNotifications ? (
                      <div className="bg-card rounded-lg border border-border p-12 text-center">
                        <Icon name="AlertCircle" size={48} className="mx-auto text-destructive mb-4" />
                        <p className="text-destructive mb-4">{errorNotifications}</p>
                        <Button onClick={loadNotifications} iconName="RefreshCw">
                          Reintentar
                        </Button>
                      </div>
                    ) : (
                      <NotificationList
                        notifications={notifications}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {loadingSurveys ? (
                      <div className="bg-card rounded-lg border border-border p-12 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        <p className="text-muted-foreground">Cargando encuestas...</p>
                      </div>
                    ) : errorSurveys ? (
                      <div className="bg-card rounded-lg border border-border p-12 text-center">
                        <Icon name="AlertCircle" size={48} className="mx-auto text-destructive mb-4" />
                        <p className="text-destructive mb-4">{errorSurveys}</p>
                        <Button onClick={loadSurveys} iconName="RefreshCw">
                          Reintentar
                        </Button>
                      </div>
                    ) : (
                      <SurveyList
                        surveys={surveys}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                        onActivate={handleActivate}
                        onPause={handlePause}
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {activeTab === 'notifications' ? (
                    <CreateNotificationForm
                      onSubmit={handleCreateNotification}
                      onCancel={handleCancelForm}
                      initialData={editingItem as Partial<Notification>}
                      onPreviewChange={setPreviewData}
                    />
                  ) : (
                    <CreateSurveyForm
                      onSubmit={handleCreateSurvey}
                      onCancel={handleCancelForm}
                      initialData={editingItem as Partial<Survey>}
                    />
                  )}
                </div>
                {activeTab === 'notifications' && (
                  <div className="lg:col-span-1">
                    <NotificationPreview notification={previewData} />
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;

