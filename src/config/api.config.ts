/**
 * Configuración de la API
 * Base URL y endpoints de la API backend
 */
class ApiConfig {
  // URL base de la API - cámbiala según tu configuración
  static readonly baseUrl: string = 'http://18.191.163.61:3005/api';

  // Endpoints de usuarios
  static readonly usersEndpoint = '/users';
  static readonly createUserEndpoint = '/users/create';
  static readonly createUserMinimalEndpoint = '/users/create-minimal';
  static readonly createUserHealthEndpoint = '/users/create/health';

  // URL completa para obtener lista de usuarios
  static get usersUrl(): string {
    return `${this.baseUrl}${this.usersEndpoint}`;
  }

  // URL completa para crear usuario completo
  static get createUserUrl(): string {
    return `${this.baseUrl}${this.createUserEndpoint}`;
  }

  // URL completa para crear usuario con datos mínimos
  static get createUserMinimalUrl(): string {
    return `${this.baseUrl}${this.createUserMinimalEndpoint}`;
  }

  // URL completa para health check del controlador de creación
  static get createUserHealthUrl(): string {
    return `${this.baseUrl}${this.createUserHealthEndpoint}`;
  }

  // Endpoints de notificaciones/alerts
  static readonly alertsEndpoint = '/users/alerts';
  static readonly alertsHealthEndpoint = '/users/alerts/health';

  // URL completa para crear notificación
  static get createAlertUrl(): string {
    return `${this.baseUrl}${this.alertsEndpoint}`;
  }

  // URL completa para obtener estadísticas generales
  static get getAlertsStatsUrl(): string {
    return `${this.baseUrl}${this.alertsEndpoint}/stats`;
  }

  // URL completa para obtener todas las notificaciones (sin filtrar por usuario)
  static getAllAlertsUrl(type?: string, priority?: string, limit?: number, skip?: number): string {
    let url = `${this.baseUrl}${this.alertsEndpoint}`;
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (priority) params.append('priority', priority);
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return url;
  }

  // URL completa para obtener notificaciones de un usuario
  static getAlertUrl(userId: string): string {
    return `${this.baseUrl}${this.alertsEndpoint}/${userId}`;
  }

  // URL completa para contador de no leídas
  static getUnreadCountUrl(userId: string): string {
    return `${this.baseUrl}${this.alertsEndpoint}/${userId}/unread-count`;
  }

  // URL completa para marcar como leída
  static getMarkReadUrl(alertId: string): string {
    return `${this.baseUrl}${this.alertsEndpoint}/${alertId}/mark-read`;
  }

  // URL completa para marcar todas como leídas
  static get markAllReadUrl(): string {
    return `${this.baseUrl}${this.alertsEndpoint}/mark-all-read`;
  }

  // URL completa para eliminar notificación
  static getDeleteAlertUrl(alertId: string): string {
    return `${this.baseUrl}${this.alertsEndpoint}/${alertId}`;
  }

  // URL completa para health check de alerts
  static get alertsHealthUrl(): string {
    return `${this.baseUrl}${this.alertsHealthEndpoint}`;
  }

  // Endpoints de respuestas de encuestas (survey-responses)
  static readonly surveyResponsesEndpoint = '/users/survey-responses';
  static readonly surveyResponsesHealthEndpoint = '/users/survey-responses/health';

  // URL completa para crear respuesta de encuesta
  static get createSurveyResponseUrl(): string {
    return `${this.baseUrl}${this.surveyResponsesEndpoint}`;
  }

  // URL completa para health check de survey-responses
  static get surveyResponsesHealthUrl(): string {
    return `${this.baseUrl}${this.surveyResponsesHealthEndpoint}`;
  }

  // URL completa para verificar si un usuario ya respondió
  static getCheckSurveyResponseUrl(surveyId: string, userId: string): string {
    return `${this.baseUrl}${this.surveyResponsesEndpoint}/${surveyId}/check/${userId}`;
  }

  // URL completa para obtener respuesta de un usuario a una encuesta
  static getSurveyResponseByUserUrl(surveyId: string, userId: string): string {
    return `${this.baseUrl}${this.surveyResponsesEndpoint}/${surveyId}/user/${userId}`;
  }

  // URL completa para obtener estadísticas de una encuesta
  static getSurveyStatsUrl(surveyId: string): string {
    return `${this.baseUrl}${this.surveyResponsesEndpoint}/${surveyId}/stats`;
  }

  // URL completa para obtener estadísticas detalladas de una encuesta
  static getSurveyDetailedStatsUrl(surveyId: string): string {
    return `${this.baseUrl}${this.surveyResponsesEndpoint}/${surveyId}/stats/detailed`;
  }

  // URL completa para obtener estadísticas de todas las encuestas
  static get allSurveysStatsUrl(): string {
    return `${this.baseUrl}${this.surveyResponsesEndpoint}/stats/all`;
  }

  // URL completa para obtener respuestas con información de usuarios
  static getSurveyResponsesWithUsersUrl(surveyId: string, limit?: number, skip?: number): string {
    let url = `${this.baseUrl}${this.surveyResponsesEndpoint}/${surveyId}/responses-with-users`;
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return url;
  }

  // URL completa para obtener análisis de respuestas por tipo de pregunta
  static getSurveyAnalysisUrl(surveyId: string): string {
    return `${this.baseUrl}${this.surveyResponsesEndpoint}/${surveyId}/analysis`;
  }

  // URL completa para obtener todas las respuestas de un usuario
  static getUserSurveyResponsesUrl(userId: string): string {
    return `${this.baseUrl}${this.surveyResponsesEndpoint}/user/${userId}`;
  }

  // URL completa para obtener todas las respuestas de una encuesta
  static getSurveyResponsesUrl(surveyId: string, limit?: number, skip?: number): string {
    let url = `${this.baseUrl}${this.surveyResponsesEndpoint}/${surveyId}`;
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return url;
  }

  // URL completa para eliminar respuesta de encuesta
  static getDeleteSurveyResponseUrl(responseId: string): string {
    return `${this.baseUrl}${this.surveyResponsesEndpoint}/${responseId}`;
  }

  // Endpoints de respuestas de notificaciones (notification-responses)
  static readonly notificationResponsesEndpoint = '/users/notification-responses';

  // URL completa para obtener respuestas de notificación de un usuario
  static getNotificationResponsesByUserUrl(userId: string, read?: boolean, limit?: number, skip?: number): string {
    let url = `${this.baseUrl}${this.notificationResponsesEndpoint}/${userId}`;
    const params = new URLSearchParams();
    if (read !== undefined) params.append('read', read.toString());
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return url;
  }

  // URL completa para obtener respuestas de notificación por alert
  static getNotificationResponsesByAlertUrl(alertId: string, read?: boolean, limit?: number, skip?: number): string {
    let url = `${this.baseUrl}${this.notificationResponsesEndpoint}/alert/${alertId}`;
    const params = new URLSearchParams();
    if (read !== undefined) params.append('read', read.toString());
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return url;
  }

  // Endpoints de activity logs
  static readonly activityLogsEndpoint = '/users/activity-logs';
  static readonly activityLogsRecentEndpoint = '/users/activity-logs/recent';
  static readonly dailyActiveUsersEndpoint = '/users/activity-logs/daily-active-users';

  // URL completa para obtener logs de un usuario específico
  static getActivityLogsByUserUrl(userId: string, limit?: number, skip?: number): string {
    let url = `${this.baseUrl}${this.activityLogsEndpoint}/user/${userId}`;
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return url;
  }

  // URL completa para obtener logs con filtros
  static getActivityLogsUrl(filters?: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    severity?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    skip?: number;
  }): string {
    let url = `${this.baseUrl}${this.activityLogsEndpoint}`;
    const params = new URLSearchParams();
    
    // Solo agregar parámetros que estén definidos y no sean undefined/null
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.resource_type) params.append('resource_type', filters.resource_type);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit !== undefined && filters?.limit !== null) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.skip !== undefined && filters?.skip !== null) {
      params.append('skip', filters.skip.toString());
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return url;
  }

  // URL completa para obtener logs recientes (tiempo real)
  static getActivityLogsRecentUrl(filters?: {
    limit?: number;
    since?: string; // ISO timestamp
    last_id?: string; // ID del último log obtenido
    user_id?: string;
  }): string {
    let url = `${this.baseUrl}${this.activityLogsRecentEndpoint}`;
    const params = new URLSearchParams();
    
    if (filters?.limit !== undefined && filters?.limit !== null) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.since) {
      params.append('since', filters.since);
    }
    if (filters?.last_id) {
      params.append('last_id', filters.last_id);
    }
    if (filters?.user_id) {
      params.append('user_id', filters.user_id);
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return url;
  }

  // URL completa para Daily Active Users
  static getDailyActiveUsersUrl(startDate?: string, endDate?: string, groupBy?: string): string {
    let url = `${this.baseUrl}${this.dailyActiveUsersEndpoint}`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (groupBy) params.append('group_by', groupBy);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return url;
  }

  // URL completa para detalles de usuarios activos
  static getDailyActiveUsersDetailedUrl(date: string, includeUserDetails: boolean = true): string {
    const params = new URLSearchParams();
    params.append('date', date);
    if (!includeUserDetails) {
      params.append('include_user_details', 'false');
    }
    return `${this.baseUrl}${this.dailyActiveUsersEndpoint}/detailed?${params.toString()}`;
  }

  // URL para health check
  static getDailyActiveUsersHealthUrl(): string {
    return `${this.baseUrl}${this.dailyActiveUsersEndpoint}/health`;
  }

  // Configuración de timeout (en milisegundos)
  static readonly timeoutMs: number = 30000; // 30 segundos
}

export default ApiConfig;

