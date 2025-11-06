import axios, { AxiosError } from 'axios';
import ApiConfig from '../config/api.config';

/**
 * Tipos de notificación según el backend
 */
export type AlertType = 'survey' | 'message' | 'reminder' | 'announcement' | 'warning';

/**
 * Prioridades según el backend
 */
export type AlertPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Tipo de pregunta para encuestas (formato del backend)
 */
export type BackendQuestionType = 'rating' | 'text' | 'yes_no' | 'multiple_choice' | 'single_choice';

/**
 * Interfaz para pregunta de encuesta (formato del backend)
 */
export interface BackendSurveyQuestion {
  question: string;
  type: BackendQuestionType;
  required: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
}

/**
 * Interfaz para crear notificación/alert (formato del backend)
 * Solo se puede usar una opción de destinatario a la vez: user_id, user_ids o send_to_all
 */
export interface CreateAlertRequest {
  // Solo una de estas opciones debe usarse:
  user_id?: string; // ObjectId de MongoDB o string - para un solo usuario
  user_ids?: string[]; // Array de IDs - para múltiples usuarios
  send_to_all?: boolean; // true - para todos los usuarios activos
  
  type: AlertType;
  title: string; // Máximo 200 caracteres
  message: string; // Máximo 1000 caracteres
  priority?: AlertPriority;
  category?: string;
  data?: {
    survey_id?: string;
    survey_questions?: BackendSurveyQuestion[];
    survey_expires_at?: string; // ISO 8601
    sender_id?: string;
    sender_name?: string;
    reminder_date?: string; // ISO 8601
    reminder_repeat?: string;
    action_url?: string;
    [key: string]: any;
  };
  icon?: string;
  color?: string;
  image_url?: string;
  action_button?: {
    text: string;
    url: string;
  };
  expires_at?: string; // ISO 8601
  metadata?: {
    source?: string;
    created_by?: string;
    tags?: string[];
    [key: string]: any;
  };
}

/**
 * Interfaz para respuesta de alert
 */
export interface AlertResponse {
  id?: string;
  _id?: string;
  user_id: string;
  type: AlertType;
  title: string;
  message: string;
  priority?: AlertPriority;
  category?: string;
  read?: boolean;
  read_at?: string;
  created_at?: string;
  expires_at?: string;
  data?: any;
  icon?: string;
  color?: string;
  image_url?: string;
  action_button?: {
    text: string;
    url: string;
  };
  metadata?: any;
}

/**
 * Interfaz para respuesta de notificación (notification_responses)
 */
export interface NotificationResponse {
  _id?: string;
  id?: string;
  user_id: string;
  alert_id: string;
  created_at: string; // ISO 8601
  read: boolean;
  read_at?: string; // ISO 8601
  updated_at?: string; // ISO 8601
}

/**
 * Interfaz para respuesta de creación de alert (puede ser singular o múltiple)
 */
export interface CreateAlertResponse {
  success: boolean;
  message: string;
  total_created: number;
  alert?: AlertResponse; // Para un solo usuario
  alerts?: AlertResponse[]; // Para múltiples usuarios
}

/**
 * Interfaz para respuesta de obtener todas las notificaciones
 */
export interface GetAllAlertsResponse {
  success: boolean;
  message: string;
  alerts: AlertResponse[];
  total: number;
  filters?: {
    type?: string;
    priority?: string;
    limit?: number;
    skip?: number;
  };
}

/**
 * Interfaz para estadísticas generales de notificaciones
 */
export interface AlertsStats {
  delivery_rate: number;        // Tasa de entrega (%)
  open_rate: number;            // Tasa de apertura (%)
  response_rate: number;        // Tasa de respuesta (%)
  total_alerts: number;         // Total de alerts enviados
  total_notification_responses: number;  // Total de notification_responses creados
  total_read: number;           // Total leídas
  total_survey_alerts: number;  // Total de alerts tipo "survey"
  total_survey_responses: number; // Total de survey_responses
}

/**
 * Interfaz para período de tiempo
 */
export interface PeriodRange {
  startDate: string;  // ISO 8601
  endDate: string;    // ISO 8601
}

/**
 * Interfaz para estadísticas con período
 */
export interface PeriodStats {
  period: PeriodRange;
  stats: AlertsStats;
}

/**
 * Interfaz para cambios porcentuales
 */
export interface StatsChanges {
  delivery_rate: number;    // Cambio porcentual en tasa de entrega
  open_rate: number;        // Cambio porcentual en tasa de apertura
  response_rate: number;    // Cambio porcentual en tasa de respuesta
}

/**
 * Interfaz para respuesta de estadísticas generales (sin comparación)
 */
export interface AlertsStatsResponse {
  success: boolean;
  message: string;
  stats: AlertsStats;
}

/**
 * Interfaz para respuesta de comparación de estadísticas
 */
export interface AlertsStatsComparisonResponse {
  success: boolean;
  message: string;
  current: PeriodStats;
  previous: PeriodStats;
  changes: StatsChanges;
}

/**
 * Interfaz para filtros de búsqueda
 */
export interface AlertFilters {
  read?: boolean;
  type?: AlertType;
  priority?: AlertPriority;
  limit?: number;
  skip?: number;
}

/**
 * Interfaz para marcar como leída
 */
export interface MarkReadRequest {
  userId: string;
}

/**
 * Servicio para manejar notificaciones/alerts
 */
class NotificationService {
  /**
   * Health check del servicio de alerts
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(ApiConfig.alertsHealthUrl, {
        timeout: ApiConfig.timeoutMs
      });
      return response.status === 200;
    } catch (error) {
      console.error('Error en health check de alerts:', error);
      return false;
    }
  }

  /**
   * Crea una nueva notificación/encuesta
   * Puede crear para un usuario, múltiples usuarios o todos los usuarios activos
   */
  async createAlert(alertData: CreateAlertRequest): Promise<CreateAlertResponse> {
    try {
      // Validar que solo se use una opción de destinatario
      const recipientOptions = [
        alertData.user_id ? 'user_id' : null,
        alertData.user_ids ? 'user_ids' : null,
        alertData.send_to_all ? 'send_to_all' : null
      ].filter(Boolean);

      if (recipientOptions.length === 0) {
        throw new Error('Debe especificar al menos una opción de destinatario: user_id, user_ids o send_to_all');
      }

      if (recipientOptions.length > 1) {
        throw new Error('Solo se puede usar una opción de destinatario a la vez: user_id, user_ids o send_to_all');
      }

      const response = await axios.post<CreateAlertResponse>(
        ApiConfig.createAlertUrl,
        alertData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // El servidor respondió con un código de error
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al crear notificación: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        // La petición se hizo pero no hubo respuesta
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        // Algo pasó al configurar la petición
        throw new Error(`Error al crear notificación: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene estadísticas generales de notificaciones
   * Calcula las 3 tasas principales:
   * - Tasa de Entrega: notification_responses / alerts × 100
   * - Tasa de Apertura: read: true / notification_responses × 100
   * - Tasa de Respuesta: survey_responses / alerts tipo "survey" × 100
   * 
   * @param period Opcional: '7d', '30d', '90d' para obtener comparación con período anterior
   * @returns Si period está presente, retorna comparación. Si no, retorna estadísticas generales.
   */
  async getStats(period?: '7d' | '30d' | '90d'): Promise<AlertsStatsResponse | AlertsStatsComparisonResponse> {
    try {
      let url = ApiConfig.getAlertsStatsUrl;
      if (period) {
        url += `?period=${period}`;
      }
      
      const response = await axios.get<AlertsStatsResponse | AlertsStatsComparisonResponse>(
        url,
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener estadísticas: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener estadísticas: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene todas las notificaciones sin filtrar por usuario
   * Excluye notificaciones expiradas automáticamente
   */
  async getAllAlerts(
    type?: AlertType,
    priority?: AlertPriority,
    limit?: number,
    skip?: number
  ): Promise<GetAllAlertsResponse> {
    try {
      const response = await axios.get<GetAllAlertsResponse>(
        ApiConfig.getAllAlertsUrl(type, priority, limit, skip),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener notificaciones: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener notificaciones: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene todas las notificaciones de un usuario
   */
  async getUserAlerts(userId: string, filters?: AlertFilters): Promise<AlertResponse[]> {
    try {
      let url = ApiConfig.getAlertUrl(userId);
      
      // Agregar filtros como query parameters
      if (filters) {
        const params = new URLSearchParams();
        if (filters.read !== undefined) params.append('read', filters.read.toString());
        if (filters.type) params.append('type', filters.type);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.skip) params.append('skip', filters.skip.toString());
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await axios.get<AlertResponse[]>(url, {
        timeout: ApiConfig.timeoutMs
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener notificaciones: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener notificaciones: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene el contador de notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await axios.get<{ count: number }>(
        ApiConfig.getUnreadCountUrl(userId),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data.count || 0;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener contador: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener contador: ${axiosError.message}`);
      }
    }
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(alertId: string, userId: string): Promise<AlertResponse> {
    try {
      const response = await axios.patch<AlertResponse>(
        ApiConfig.getMarkReadUrl(alertId),
        { userId },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al marcar como leída: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al marcar como leída: ${axiosError.message}`);
      }
    }
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    try {
      const response = await axios.patch<{ count: number }>(
        ApiConfig.markAllReadUrl,
        { userId },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al marcar todas como leídas: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al marcar todas como leídas: ${axiosError.message}`);
      }
    }
  }

  /**
   * Elimina una notificación
   */
  async deleteAlert(alertId: string, userId: string): Promise<void> {
    try {
      await axios.delete(
        ApiConfig.getDeleteAlertUrl(alertId),
        {
          data: { userId },
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.timeoutMs
        }
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al eliminar notificación: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al eliminar notificación: ${axiosError.message}`);
      }
    }
  }

  /**
   * Mapea un tipo de pregunta del frontend al formato del backend
   */
  mapQuestionTypeToBackend(frontendType: string): BackendQuestionType {
    const typeMap: Record<string, BackendQuestionType> = {
      'single-choice': 'single_choice',
      'multiple-choice': 'multiple_choice',
      'text': 'text',
      'rating': 'rating',
      'yes-no': 'yes_no'
    };

    return typeMap[frontendType] || 'text';
  }

  /**
   * Mapea un tipo de pregunta del backend al formato del frontend
   */
  mapQuestionTypeFromBackend(backendType: BackendQuestionType): string {
    const typeMap: Record<BackendQuestionType, string> = {
      'single_choice': 'single-choice',
      'multiple_choice': 'multiple-choice',
      'text': 'text',
      'rating': 'rating',
      'yes_no': 'yes-no'
    };

    return typeMap[backendType] || 'text';
  }
}

/**
 * Interfaz para respuesta individual de una pregunta
 */
export interface SurveyAnswer {
  question_id?: string;
  question: string;
  answer: string | number | boolean | string[]; // Puede ser texto, número, booleano o array
  question_type: BackendQuestionType;
}

/**
 * Interfaz para crear respuesta de encuesta (formato del backend)
 */
export interface CreateSurveyResponseRequest {
  survey_id: string;
  alert_id: string;
  user_id: string;
  answers: SurveyAnswer[];
  metadata?: {
    source?: string;
    device_info?: string;
    ip_address?: string;
    [key: string]: any;
  };
}

/**
 * Interfaz para respuesta de encuesta del backend
 */
export interface SurveyResponseResponse {
  id?: string;
  _id?: string;
  survey_id: string;
  alert_id: string;
  user_id: string;
  answers: SurveyAnswer[];
  created_at?: string;
  completed_at?: string; // Fecha de finalización de la encuesta
  updated_at?: string;
  metadata?: any;
}

/**
 * Interfaz para estadísticas de encuesta
 * Nota: El backend puede devolver diferentes campos según la implementación
 */
export interface SurveyStats {
  total_responses: number;
  unique_users?: number; // Campo que el backend devuelve actualmente
  completion_rate?: number; // Opcional - el backend puede no calcularlo inicialmente
  average_completion_time?: number; // Opcional - el backend puede no calcularlo inicialmente
  responses_by_date?: {
    [date: string]: number;
  } | Array<{ date: string; count: number }>; // Puede ser objeto o array
  first_response_date?: string;
  last_response_date?: string;
  [key: string]: any; // Permite campos adicionales que el backend pueda devolver
}

/**
 * Interfaz para estadísticas detalladas de encuesta
 */
export interface DetailedSurveyStats extends SurveyStats {
  completion_rate: number; // Ahora es requerido en estadísticas detalladas
  average_completion_time: number; // Ahora es requerido en estadísticas detalladas
  responses_by_date: Array<{ date: string; count: number }>;
  first_response_date: string;
  last_response_date: string;
}

/**
 * Interfaz para respuesta de estadísticas detalladas
 */
export interface DetailedSurveyStatsResponse {
  success: boolean;
  message: string;
  stats: DetailedSurveyStats;
}

/**
 * Interfaz para estadísticas de una encuesta en el resumen de todas
 */
export interface SurveySummaryItem {
  survey_id: string;
  total_responses: number;
  unique_users: number;
  completion_rate: number;
  average_completion_time: number;
  last_response_date: string;
}

/**
 * Interfaz para respuesta de estadísticas de todas las encuestas
 */
export interface AllSurveysStatsResponse {
  success: boolean;
  message: string;
  summary: {
    total_surveys: number;
    total_responses: number;
    total_unique_users: number;
  };
  surveys: SurveySummaryItem[];
}

/**
 * Interfaz para información de usuario en respuesta de encuesta
 */
export interface UserInfo {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
}

/**
 * Interfaz para respuesta de encuesta con información de usuario
 */
export interface SurveyResponseWithUser extends SurveyResponseResponse {
  user_info: UserInfo;
}

/**
 * Interfaz para respuesta de respuestas con usuarios
 */
export interface SurveyResponsesWithUsersResponse {
  success: boolean;
  message: string;
  surveyResponses: SurveyResponseWithUser[];
  total: number;
  limit: number;
  skip: number;
}

/**
 * Interfaz para análisis de una pregunta
 */
export interface QuestionAnalysis {
  question_id: string;
  question: string;
  question_type: BackendQuestionType;
  total_responses: number;
  answer_distribution: {
    [key: string]: any; // Puede ser diferente según el tipo de pregunta
    total_unique_responses?: number;
    sample_responses?: string[];
    min?: number;
    max?: number;
    average?: number;
    yes?: number;
    no?: number;
    yes_percentage?: number;
  };
  text_responses?: string[]; // Solo para tipo text
  average_rating?: number; // Solo para tipo rating
}

/**
 * Interfaz para respuesta de análisis de encuesta
 */
export interface SurveyAnalysisResponse {
  success: boolean;
  message: string;
  question_analysis: QuestionAnalysis[];
}

/**
 * Interfaz para respuesta de estadísticas de encuesta del API
 */
export interface SurveyStatsResponse {
  success: boolean;
  message: string;
  stats: SurveyStats;
}

/**
 * Interfaz para respuesta de todas las respuestas de una encuesta del API
 */
export interface GetSurveyResponsesResponse {
  success: boolean;
  message: string;
  surveyResponses: SurveyResponseResponse[];
  total: number;
  filters?: {
    limit?: number;
    skip?: number;
  };
}

/**
 * Interfaz para respuesta de respuestas de un usuario del API
 */
export interface GetUserSurveyResponsesResponse {
  success: boolean;
  message: string;
  surveyResponses: SurveyResponseResponse[];
  total: number;
  filters?: {
    limit?: number;
    skip?: number;
  };
}

/**
 * Métodos extendidos para respuestas de encuestas
 */
class SurveyResponseService {
  /**
   * Health check del servicio de respuestas de encuestas
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(ApiConfig.surveyResponsesHealthUrl, {
        timeout: ApiConfig.timeoutMs
      });
      return response.status === 200;
    } catch (error) {
      console.error('Error en health check de survey-responses:', error);
      return false;
    }
  }

  /**
   * Guarda la respuesta del usuario a una encuesta
   */
  async createSurveyResponse(responseData: CreateSurveyResponseRequest): Promise<SurveyResponseResponse> {
    try {
      const response = await axios.post<{ success: boolean; message: string; surveyResponse: SurveyResponseResponse }>(
        ApiConfig.createSurveyResponseUrl,
        responseData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data.surveyResponse;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al guardar respuesta: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al guardar respuesta: ${axiosError.message}`);
      }
    }
  }

  /**
   * Verifica si un usuario ya respondió una encuesta específica
   */
  async checkUserResponse(surveyId: string, userId: string): Promise<boolean> {
    try {
      const response = await axios.get<{ success: boolean; message: string; has_responded: boolean }>(
        ApiConfig.getCheckSurveyResponseUrl(surveyId, userId),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data.has_responded || false;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al verificar respuesta: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al verificar respuesta: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene la respuesta de un usuario a una encuesta específica
   */
  async getUserSurveyResponse(surveyId: string, userId: string): Promise<SurveyResponseResponse> {
    try {
      const response = await axios.get<{ success: boolean; message: string; surveyResponse: SurveyResponseResponse }>(
        ApiConfig.getSurveyResponseByUserUrl(surveyId, userId),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data.surveyResponse;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener respuesta: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener respuesta: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene estadísticas de una encuesta
   */
  async getSurveyStats(surveyId: string): Promise<SurveyStats> {
    try {
      const response = await axios.get<SurveyStatsResponse>(
        ApiConfig.getSurveyStatsUrl(surveyId),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data.stats;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener estadísticas: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener estadísticas: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene todas las respuestas de un usuario a diferentes encuestas
   */
  async getUserSurveyResponses(userId: string, limit?: number, skip?: number): Promise<GetUserSurveyResponsesResponse> {
    try {
      let url = ApiConfig.getUserSurveyResponsesUrl(userId);
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (skip) params.append('skip', skip.toString());
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await axios.get<GetUserSurveyResponsesResponse>(
        url,
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener respuestas: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener respuestas: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene todas las respuestas de una encuesta
   */
  async getSurveyResponses(surveyId: string, limit?: number, skip?: number): Promise<GetSurveyResponsesResponse> {
    try {
      const response = await axios.get<GetSurveyResponsesResponse>(
        ApiConfig.getSurveyResponsesUrl(surveyId, limit, skip),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener respuestas: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener respuestas: ${axiosError.message}`);
      }
    }
  }

  /**
   * Elimina una respuesta de encuesta
   */
  async deleteSurveyResponse(responseId: string, userId: string): Promise<void> {
    try {
      await axios.delete(
        ApiConfig.getDeleteSurveyResponseUrl(responseId),
        {
          data: { userId },
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.timeoutMs
        }
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al eliminar respuesta: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al eliminar respuesta: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene estadísticas detalladas de una encuesta
   */
  async getSurveyDetailedStats(surveyId: string): Promise<DetailedSurveyStats> {
    try {
      const response = await axios.get<DetailedSurveyStatsResponse>(
        ApiConfig.getSurveyDetailedStatsUrl(surveyId),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data.stats;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener estadísticas detalladas: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener estadísticas detalladas: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene estadísticas de todas las encuestas
   */
  async getAllSurveysStats(): Promise<AllSurveysStatsResponse> {
    try {
      const response = await axios.get<AllSurveysStatsResponse>(
        ApiConfig.allSurveysStatsUrl,
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener estadísticas de todas las encuestas: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener estadísticas de todas las encuestas: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene respuestas de una encuesta con información completa de cada usuario
   */
  async getSurveyResponsesWithUsers(surveyId: string, limit?: number, skip?: number): Promise<SurveyResponsesWithUsersResponse> {
    try {
      const response = await axios.get<SurveyResponsesWithUsersResponse>(
        ApiConfig.getSurveyResponsesWithUsersUrl(surveyId, limit, skip),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener respuestas con usuarios: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener respuestas con usuarios: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene análisis detallado de respuestas agrupadas por tipo de pregunta
   */
  async getSurveyAnalysis(surveyId: string): Promise<SurveyAnalysisResponse> {
    try {
      const response = await axios.get<SurveyAnalysisResponse>(
        ApiConfig.getSurveyAnalysisUrl(surveyId),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener análisis de encuesta: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener análisis de encuesta: ${axiosError.message}`);
      }
    }
  }
}

/**
 * Interfaz para respuesta de la API de notification-responses
 */
export interface NotificationResponsesApiResponse {
  success: boolean;
  message: string;
  responses: NotificationResponse[];
  total: number;
}

/**
 * Filtros para obtener respuestas de notificación
 */
export interface NotificationResponseFilters {
  read?: boolean;
  limit?: number;
  skip?: number;
}

/**
 * Métodos extendidos para respuestas de notificaciones
 */
class NotificationResponseService {
  /**
   * Obtiene todas las respuestas de notificación de un usuario
   */
  async getUserNotificationResponses(
    userId: string, 
    filters?: NotificationResponseFilters
  ): Promise<NotificationResponsesApiResponse> {
    try {
      const response = await axios.get<NotificationResponsesApiResponse>(
        ApiConfig.getNotificationResponsesByUserUrl(
          userId,
          filters?.read,
          filters?.limit,
          filters?.skip
        ),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener respuestas de notificación: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener respuestas de notificación: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene todas las respuestas de notificación por alert (quién leyó una notificación)
   */
  async getAlertNotificationResponses(
    alertId: string, 
    filters?: NotificationResponseFilters
  ): Promise<NotificationResponsesApiResponse> {
    try {
      const response = await axios.get<NotificationResponsesApiResponse>(
        ApiConfig.getNotificationResponsesByAlertUrl(
          alertId,
          filters?.read,
          filters?.limit,
          filters?.skip
        ),
        {
          timeout: ApiConfig.timeoutMs
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener respuestas de alert: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener respuestas de alert: ${axiosError.message}`);
      }
    }
  }
}

// Exportar una instancia única del servicio de respuestas de encuestas
const surveyResponseService = new SurveyResponseService();
export { surveyResponseService };

// Exportar una instancia única del servicio de respuestas de notificaciones
const notificationResponseService = new NotificationResponseService();
export { notificationResponseService };

// Exportar una instancia única del servicio de notificaciones
const notificationService = new NotificationService();
export default notificationService;

