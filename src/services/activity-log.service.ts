import axios, { AxiosError } from 'axios';
import ApiConfig from '../config/api.config';
import {
  UserActivity,
  FeatureUsage,
  UserJourneyStep,
  SessionData,
  EngagementMetric,
  UserSegment
} from '../pages/user-analytics-monitor/types';

/**
 * Interfaz para el activity log del backend (formato de MongoDB)
 */
export interface ActivityLogResponse {
  _id?: string;
  id?: string;
  user_id: string;
  username?: string;
  email?: string;
  action: string;
  type: string;
  description?: string;
  resource_type?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string; // ISO 8601
  metadata?: {
    old_value?: any;
    new_value?: any;
    additional_info?: any;
    [key: string]: any;
  };
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'failed' | 'pending' | 'error';
  created_at?: string; // ISO 8601
  updated_at?: string; // ISO 8601
}

/**
 * Interfaz para la respuesta de la API de activity logs
 */
export interface ActivityLogsApiResponse {
  success: boolean;
  message: string;
  data: ActivityLogResponse[];
  total: number;
  limit: number;
  skip: number;
}

/**
 * Filtros para obtener activity logs
 */
export interface ActivityLogFilters {
  user_id?: string;
  action?: string;
  resource_type?: string;
  severity?: string;
  status?: string;
  start_date?: string; // ISO 8601
  end_date?: string; // ISO 8601
  limit?: number;
  skip?: number;
}

/**
 * Mapea un action a su nombre amigable en español (función helper compartida)
 */
function getActionDisplayName(action: string, description?: string): string {
  const actionToFeatureMap: Record<string, string> = {
    'login': 'Inicio de Sesión',
    'logout': 'Cerrar Sesión',
    'wifi_password_changed': 'Cambio de Contraseña WiFi',
    'device_connected': 'Dispositivo Conectado',
    'router_settings_updated': 'Configuración de Router',
    'settings_updated': 'Configuración Actualizada',
    'network_configured': 'Configuración de Red',
    'data_exported': 'Exportación de Datos',
    'support_contacted': 'Soporte Técnico',
    'connection_established': 'Conexión Establecida',
    'password_changed': 'Cambio de Contraseña',
    'wifi_configured': 'Configuración WiFi',
    'account_status': 'Estado de Cuenta',
    'billing_viewed': 'Facturación'
  };

  // Si hay mapeo, usarlo
  if (actionToFeatureMap[action]) {
    return actionToFeatureMap[action];
  }

  // Si hay una descripción más descriptiva, usarla
  if (description && description.length > action.length) {
    return description;
  }

  // Formatear el action: "settings_updated" -> "Settings Updated"
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase())
    .replace(/\b(wifi|wlan|vpn|ip|dns|dhcp|wan|lan)\b/gi, (match: string) => match.toUpperCase());
}

/**
 * Mapea un ActivityLogResponse del backend a UserActivity del frontend
 */
function mapActivityLogToUserActivity(log: ActivityLogResponse): UserActivity {
  const logId = log._id || log.id || '';
  const userId = log.user_id || '';
  
  // Extraer información del dispositivo desde user_agent
  let deviceType = 'Unknown';
  let deviceModel = 'Unknown';
  
  if (log.user_agent) {
    const ua = log.user_agent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      deviceType = 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'Tablet';
    } else if (ua.includes('desktop') || ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
      deviceType = 'Desktop';
    }
    
    // Intentar extraer modelo del user_agent
    if (ua.includes('iphone')) {
      const match = ua.match(/iphone[^;]*/);
      if (match) deviceModel = match[0].replace('iphone', 'iPhone ').trim();
    } else if (ua.includes('android')) {
      const match = ua.match(/android[^;]*/);
      if (match) deviceModel = match[0].replace('android', 'Android').trim();
    } else {
      deviceModel = log.user_agent.split(' ')[0] || 'Unknown';
    }
  }

  // Determinar el estado basado en el status del log
  let activityStatus: 'active' | 'completed' | 'abandoned' = 'completed';
  if (log.status === 'pending') {
    activityStatus = 'active';
  } else if (log.status === 'failed' || log.status === 'error') {
    activityStatus = 'abandoned';
  }

  // Usar la función helper para obtener el nombre amigable
  const feature = getActionDisplayName(log.action, log.description);

  // Usar IP para determinar ubicación (en producción deberías usar un servicio de geolocalización)
  const location = log.ip_address || 'Unknown';

  // Parsear timestamp correctamente (manejar diferentes formatos)
  // El timestamp puede venir como string ISO o como objeto Date serializado
  let timestamp: Date;
  try {
    if (log.timestamp) {
      // Si es un string ISO, parsearlo directamente
      if (typeof log.timestamp === 'string') {
        timestamp = new Date(log.timestamp);
      } else {
        // Si es un objeto (como ISODate de MongoDB serializado), intentar parsearlo
        timestamp = new Date(log.timestamp as any);
      }
    } else if (log.created_at) {
      timestamp = new Date(log.created_at);
    } else {
      timestamp = new Date();
    }
    
    // Validar que el timestamp sea válido
    if (isNaN(timestamp.getTime())) {
      console.warn('⚠️ Timestamp inválido para log:', log);
      timestamp = new Date();
    }
  } catch (error) {
    console.warn('⚠️ Error parseando timestamp:', error, log);
    timestamp = new Date();
  }

  return {
    id: logId,
    userId: userId,
    userName: log.username || log.email?.split('@')[0] || 'Usuario',
    action: log.action,
    feature: feature,
    timestamp: timestamp,
    deviceType: deviceType,
    deviceModel: deviceModel,
    sessionId: log.metadata?.session_id || `sess_${logId.substring(0, 8)}`,
    location: location,
    duration: 0, // No tenemos duración en activity_log, se calculará después
    status: activityStatus
  };
}

/**
 * Clase de servicio para operaciones con activity logs
 */
class ActivityLogService {
  /**
   * Obtiene los logs de actividad más recientes (para tiempo real)
   */
  async getRecentActivityLogs(filters?: {
    limit?: number;
    since?: string; // ISO timestamp
    last_id?: string; // ID del último log obtenido
    user_id?: string;
  }): Promise<ActivityLogsApiResponse> {
    try {
      const url = ApiConfig.getActivityLogsRecentUrl(filters);
      console.log(`📡 Obteniendo logs recientes:`, url);
      
      const response = await axios.get<ActivityLogsApiResponse | ActivityLogResponse[]>(
        url,
        {
          timeout: ApiConfig.timeoutMs,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      // El backend puede devolver los datos de diferentes formas
      if (response.data) {
        // Si la respuesta es un array directo, envolverlo en el formato esperado
        if (Array.isArray(response.data)) {
          return {
            success: true,
            message: 'Logs recientes obtenidos exitosamente',
            data: response.data,
            total: response.data.length,
            limit: filters?.limit || 100,
            skip: 0
          };
        }
        
        // Si ya tiene el formato correcto, retornarlo
        return response.data as ActivityLogsApiResponse;
      }
      
      // Si no hay datos, retornar estructura vacía
      return {
        success: true,
        message: 'No se encontraron logs recientes',
        data: [],
        total: 0,
        limit: filters?.limit || 100,
        skip: 0
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener logs recientes: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener logs recientes: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene los logs de actividad de un usuario específico
   */
  async getActivityLogsByUser(
    userId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<ActivityLogsApiResponse> {
    try {
      const url = ApiConfig.getActivityLogsByUserUrl(userId, limit, skip);
      console.log(`Obteniendo logs del usuario ${userId}:`, url);
      
      const response = await axios.get<ActivityLogsApiResponse | ActivityLogResponse[]>(
        url,
        {
          timeout: ApiConfig.timeoutMs,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      // El backend puede devolver los datos de diferentes formas
      if (response.data) {
        // Si la respuesta es un array directo, envolverlo en el formato esperado
        if (Array.isArray(response.data)) {
          return {
            success: true,
            message: 'Logs obtenidos exitosamente',
            data: response.data,
            total: response.data.length,
            limit: limit,
            skip: skip
          };
        }
        
        // Si ya tiene el formato correcto, retornarlo
        return response.data as ActivityLogsApiResponse;
      }
      
      // Si no hay datos, retornar estructura vacía
      return {
        success: true,
        message: 'No se encontraron logs',
        data: [],
        total: 0,
        limit: limit,
        skip: skip
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        throw new Error(
          data?.message || 
          data?.error || 
          `Error al obtener logs de actividad del usuario ${userId}: ${status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener logs de actividad: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene los logs de actividad con filtros
   * Si no se proporciona user_id, obtiene logs de todos los usuarios usando el endpoint /user/:userId
   */
  async getActivityLogs(filters?: ActivityLogFilters): Promise<ActivityLogsApiResponse> {
    try {
      // Si se proporciona un user_id específico, usar el endpoint por usuario directamente
      if (filters?.user_id) {
        return await this.getActivityLogsByUser(
          filters.user_id,
          filters.limit || 1000,
          filters.skip || 0
        );
      }

      // Si no se proporciona user_id, necesitamos obtener logs de todos los usuarios
      // Primero obtenemos la lista de usuarios
      const userService = (await import('../services/user.service')).default;
      const users = await userService.getUsers();
      
      if (users.length === 0) {
        return {
          success: true,
          message: 'No hay usuarios disponibles',
          data: [],
          total: 0,
          limit: filters?.limit || 1000,
          skip: filters?.skip || 0
        };
      }
      
      console.log(`Obteniendo logs para ${users.length} usuarios...`);
      
      // Obtener logs de cada usuario (en paralelo con límite de concurrencia)
      // IMPORTANTE: Obtener más logs por usuario para asegurar que tengamos los más recientes
      const allLogs: ActivityLogResponse[] = [];
      const limit = filters?.limit || 1000;
      // Obtener más logs por usuario para asegurar que tengamos los más recientes
      // El backend puede ordenar por fecha ascendente, así que necesitamos más logs
      const perUserLimit = Math.max(500, Math.floor(limit / users.length) * 2); // Obtener más logs por usuario
      
      console.log(`📥 Obteniendo hasta ${perUserLimit} logs por usuario (${users.length} usuarios totales)`);
      
      // Procesar usuarios en lotes para no sobrecargar el servidor
      const batchSize = 10; // Procesar 10 usuarios a la vez
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (user) => {
          try {
            const userLogs = await this.getActivityLogsByUser(
              user.id,
              perUserLimit,
              0
            );
            const logs = userLogs.data || [];
            
            // Debug: verificar si hay logs del 2025-11-06 para este usuario
            if (logs.length > 0) {
              const logsNov6 = logs.filter(log => {
                const logDate = new Date(log.timestamp || log.created_at || '');
                return logDate >= new Date('2025-11-06T00:00:00Z') && 
                       logDate < new Date('2025-11-07T00:00:00Z');
              });
              
              if (logsNov6.length > 0) {
                console.log(`✅ Usuario ${user.id} tiene ${logsNov6.length} logs del 2025-11-06`);
              }
              
              // Mostrar el log más reciente de este usuario
              const sortedUserLogs = [...logs].sort((a, b) => {
                const dateA = new Date(a.timestamp || a.created_at || '').getTime();
                const dateB = new Date(b.timestamp || b.created_at || '').getTime();
                return dateB - dateA;
              });
              
              if (sortedUserLogs.length > 0) {
                const mostRecent = sortedUserLogs[0];
                const mostRecentDate = new Date(mostRecent.timestamp || mostRecent.created_at || '');
                console.log(`📅 Log más reciente del usuario ${user.id}:`, {
                  action: mostRecent.action,
                  timestamp: mostRecent.timestamp || mostRecent.created_at,
                  date: mostRecentDate.toISOString()
                });
              }
            }
            
            return logs;
          } catch (error) {
            console.warn(`Error al obtener logs del usuario ${user.id}:`, error);
            return []; // Continuar con otros usuarios aunque uno falle
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        allLogs.push(...batchResults.flat());
      }
      
      console.log(`📊 Total de logs obtenidos: ${allLogs.length} de ${users.length} usuarios`);
      
      // Aplicar filtros adicionales si están presentes
      let filteredLogs = allLogs;
      
      if (filters?.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      
      if (filters?.resource_type) {
        filteredLogs = filteredLogs.filter(log => log.resource_type === filters.resource_type);
      }
      
      if (filters?.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
      }
      
      if (filters?.status) {
        filteredLogs = filteredLogs.filter(log => log.status === filters.status);
      }
      
      // Filtrar por fechas si están presentes
      if (filters?.start_date || filters?.end_date) {
        filteredLogs = filteredLogs.filter(log => {
          const logDate = new Date(log.timestamp || log.created_at || '');
          if (filters.start_date) {
            const startDate = new Date(filters.start_date);
            if (logDate < startDate) return false;
          }
          if (filters.end_date) {
            const endDate = new Date(filters.end_date);
            endDate.setHours(23, 59, 59, 999); // Incluir todo el día
            if (logDate > endDate) return false;
          }
          return true;
        });
      }
      
      // Ordenar por timestamp (más recientes primero)
      filteredLogs.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created_at || '').getTime();
        const dateB = new Date(b.timestamp || b.created_at || '').getTime();
        return dateB - dateA; // Más recientes primero
      });
      
      // Debug: mostrar los primeros 5 logs ordenados y verificar si hay logs del 2025-11-06
      if (filteredLogs.length > 0) {
        const first5 = filteredLogs.slice(0, 5).map(log => ({
          action: log.action,
          timestamp: log.timestamp || log.created_at,
          parsed: new Date(log.timestamp || log.created_at || '').toISOString(),
          userId: log.user_id
        }));
        console.log('📅 Primeros 5 logs más recientes después de ordenar:', first5);
        
        // Buscar logs del 2025-11-06 específicamente
        const logsNov6 = filteredLogs.filter(log => {
          const logDate = new Date(log.timestamp || log.created_at || '');
          return logDate >= new Date('2025-11-06T00:00:00Z') && 
                 logDate < new Date('2025-11-07T00:00:00Z');
        });
        
        if (logsNov6.length > 0) {
          console.log('✅ Se encontraron logs del 2025-11-06:', logsNov6.length, logsNov6.slice(0, 3).map(l => ({
            action: l.action,
            timestamp: l.timestamp || l.created_at,
            userId: l.user_id
          })));
        } else {
          console.warn('⚠️ NO se encontraron logs del 2025-11-06 en los logs obtenidos');
          // Mostrar el log más reciente que sí tenemos
          const mostRecent = filteredLogs[0];
          if (mostRecent) {
            const mostRecentDate = new Date(mostRecent.timestamp || mostRecent.created_at || '');
            console.log('📅 Log más reciente encontrado:', {
              action: mostRecent.action,
              timestamp: mostRecent.timestamp || mostRecent.created_at,
              date: mostRecentDate.toISOString(),
              userId: mostRecent.user_id
            });
          }
        }
      }
      
      // Aplicar límite final (mantener los más recientes)
      const finalLogs = filteredLogs.slice(0, limit);
      
      console.log(`✅ Logs finales después de filtrar y ordenar: ${finalLogs.length} (límite solicitado: ${limit})`);
      
      console.log(`Se obtuvieron ${finalLogs.length} logs de ${users.length} usuarios`);
      
      return {
        success: true,
        message: 'Logs obtenidos exitosamente',
        data: finalLogs,
        total: finalLogs.length,
        limit: limit,
        skip: filters?.skip || 0
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        // Log detallado del error para debugging
        console.error('Error en activity logs - Detalles completos:', {
          status,
          statusText: axiosError.response.statusText,
          data: data,
          headers: axiosError.response.headers,
          filters: filters
        });
        
        // Intentar extraer el mensaje de error más específico
        let errorMessage = 'Error interno del servidor';
        if (data) {
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.msg) {
            errorMessage = data.msg;
          }
        }
        
        throw new Error(errorMessage);
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener logs de actividad: ${axiosError.message}`);
      }
    }
  }

  /**
   * Convierte los logs de actividad a UserActivity[] para el frontend
   */
  mapLogsToUserActivities(logs: ActivityLogResponse[]): UserActivity[] {
    return logs.map(log => mapActivityLogToUserActivity(log));
  }

  /**
   * Calcula métricas de engagement desde los logs
   */
  calculateEngagementMetrics(logs: ActivityLogResponse[]): EngagementMetric[] {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const last21Days = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
    const last28Days = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const last35Days = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
    
    const recentLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp || log.created_at || '');
      return logDate >= last7Days;
    });
    
    const previousLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp || log.created_at || '');
      return logDate >= last14Days && logDate < last7Days;
    });

    // Usuarios activos diarios (últimos 7 días)
    const uniqueUsersRecent = new Set(recentLogs.map(log => log.user_id));
    const uniqueUsersPrevious = new Set(previousLogs.map(log => log.user_id));
    const dailyActiveUsers = Math.round(uniqueUsersRecent.size / 7);
    const previousDailyActiveUsers = Math.round(uniqueUsersPrevious.size / 7);
    const dauChange = previousDailyActiveUsers > 0 
      ? ((dailyActiveUsers - previousDailyActiveUsers) / previousDailyActiveUsers) * 100 
      : dailyActiveUsers > 0 ? 100 : 0; // Si era 0 y ahora tiene valor, es 100% de aumento

    // Duración promedio de sesión (calcular basándose en tiempo entre login y logout)
    // Agrupar logs por usuario y calcular duración de sesión
    const userSessions = new Map<string, { logins: Date[], logouts: Date[] }>();
    
    logs.forEach(log => {
      const userId = log.user_id;
      if (!userSessions.has(userId)) {
        userSessions.set(userId, { logins: [], logouts: [] });
      }
      const session = userSessions.get(userId)!;
      const logDate = new Date(log.timestamp || log.created_at || '');
      
      if (log.action === 'login' && log.status === 'success') {
        session.logins.push(logDate);
      } else if (log.action === 'logout' && log.status === 'success') {
        session.logouts.push(logDate);
      }
    });
    
    // Calcular duración promedio de sesión
    const sessionDurations: number[] = [];
    userSessions.forEach((session, userId) => {
      session.logins.forEach((login, index) => {
        // Buscar el logout más cercano después del login
        const nextLogout = session.logouts.find(logout => logout > login);
        if (nextLogout) {
          const duration = (nextLogout.getTime() - login.getTime()) / (1000 * 60); // minutos
          sessionDurations.push(duration);
        }
      });
    });
    
    const avgDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length
      : recentLogs.length / (uniqueUsersRecent.size || 1) * 2; // Fallback: estimación
    
    // Calcular duración promedio para período anterior
    const previousSessionDurations: number[] = [];
    previousLogs.forEach(log => {
      const logDate = new Date(log.timestamp || log.created_at || '');
      if (log.action === 'login' && log.status === 'success') {
        // Buscar logout correspondiente en los logs anteriores
        const logout = previousLogs.find(l => 
          l.user_id === log.user_id && 
          l.action === 'logout' && 
          new Date(l.timestamp || l.created_at || '') > logDate
        );
        if (logout) {
          const logoutDate = new Date(logout.timestamp || logout.created_at || '');
          const duration = (logoutDate.getTime() - logDate.getTime()) / (1000 * 60); // minutos
          previousSessionDurations.push(duration);
        }
      }
    });
    
    const previousAvgDuration = previousSessionDurations.length > 0
      ? previousSessionDurations.reduce((sum, d) => sum + d, 0) / previousSessionDurations.length
      : previousLogs.length / (uniqueUsersPrevious.size || 1) * 2; // Fallback
    
    // Calcular cambio porcentual (manejar cuando previousAvgDuration es 0)
    const durationChange = previousAvgDuration > 0
      ? ((avgDuration - previousAvgDuration) / previousAvgDuration) * 100
      : avgDuration > 0 ? 100 : 0; // Si era 0 y ahora tiene valor, es 100% de aumento

    // Tasa de adopción de funciones (porcentaje de usuarios que usaron funciones nuevas)
    // Calcular como: usuarios únicos que usaron funciones en el período reciente
    const uniqueFunctionsRecent = new Set(recentLogs
      .filter(log => log.action !== 'login' && log.action !== 'logout')
      .map(log => log.user_id));
    const uniqueFunctionsPrevious = new Set(previousLogs
      .filter(log => log.action !== 'login' && log.action !== 'logout')
      .map(log => log.user_id));
    
    const featureUsageRate = uniqueUsersRecent.size > 0
      ? (uniqueFunctionsRecent.size / uniqueUsersRecent.size) * 100
      : 0;
    const previousFeatureUsageRate = uniqueUsersPrevious.size > 0
      ? (uniqueFunctionsPrevious.size / uniqueUsersPrevious.size) * 100
      : 0;
    
    const featureChange = previousFeatureUsageRate > 0
      ? ((featureUsageRate - previousFeatureUsageRate) / previousFeatureUsageRate) * 100
      : featureUsageRate > 0 ? 100 : 0; // Si era 0 y ahora tiene valor, es 100% de aumento

    // Tasa de retención (usuarios que regresaron)
    // Usuarios que estuvieron activos en el período anterior y también en el reciente
    const returningUsers = Array.from(uniqueUsersRecent).filter(userId =>
      uniqueUsersPrevious.has(userId)
    ).length;
    
    const retentionRate = uniqueUsersPrevious.size > 0
      ? (returningUsers / uniqueUsersPrevious.size) * 100
      : 0;
    
    // Calcular retención anterior basándose en logs aún más antiguos
    // Usar los períodos ya definidos arriba
    const previousPeriodLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp || log.created_at || '');
      return logDate >= last28Days && logDate < last21Days;
    });
    
    const previousPeriodPreviousLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp || log.created_at || '');
      return logDate >= last35Days && logDate < last28Days;
    });
    
    const previousPeriodUsers = new Set(previousPeriodLogs.map(log => log.user_id));
    const previousPeriodPreviousUsers = new Set(previousPeriodPreviousLogs.map(log => log.user_id));
    const previousPeriodReturning = Array.from(previousPeriodUsers).filter(userId =>
      previousPeriodPreviousUsers.has(userId)
    ).length;
    
    const previousRetentionRate = previousPeriodPreviousUsers.size > 0
      ? (previousPeriodReturning / previousPeriodPreviousUsers.size) * 100
      : 0;
    
    const retentionChange = previousRetentionRate > 0
      ? ((retentionRate - previousRetentionRate) / previousRetentionRate) * 100
      : retentionRate > 0 && previousRetentionRate === 0 ? 100 : 0;

    return [
      {
        id: '1',
        label: 'Usuarios Activos Diarios',
        value: dailyActiveUsers,
        previousValue: previousDailyActiveUsers,
        unit: '',
        trend: dauChange > 0 ? 'up' : dauChange < 0 ? 'down' : 'stable',
        changePercentage: Math.abs(dauChange),
        icon: 'Users',
        color: 'primary'
      },
      {
        id: '2',
        label: 'Duración Promedio de Sesión',
        value: Math.round(avgDuration * 10) / 10,
        previousValue: Math.round(previousAvgDuration * 10) / 10,
        unit: 'min',
        trend: durationChange > 0 ? 'up' : durationChange < 0 ? 'down' : 'stable',
        changePercentage: Math.abs(durationChange),
        icon: 'Clock',
        color: 'accent'
      },
      {
        id: '3',
        label: 'Tasa de Adopción de Funciones',
        value: Math.round(featureUsageRate * 10) / 10,
        previousValue: Math.round(previousFeatureUsageRate * 10) / 10,
        unit: '%',
        trend: featureChange > 0 ? 'up' : featureChange < 0 ? 'down' : 'stable',
        changePercentage: Math.abs(featureChange),
        icon: 'TrendingUp',
        color: 'success'
      },
      {
        id: '4',
        label: 'Tasa de Retención',
        value: Math.round(retentionRate * 10) / 10,
        previousValue: Math.round(previousRetentionRate * 10) / 10,
        unit: '%',
        trend: retentionChange > 0 ? 'up' : retentionChange < 0 ? 'down' : 'stable',
        changePercentage: Math.abs(retentionChange),
        icon: 'UserCheck',
        color: 'warning'
      }
    ];
  }


  /**
   * Calcula uso de funciones desde los logs
   */
  calculateFeatureUsage(logs: ActivityLogResponse[]): FeatureUsage[] {
    // Agrupar logs por acción y guardar también la descripción más común
    const featureMap = new Map<string, {
      usageCount: number;
      uniqueUsers: Set<string>;
      totalTime: number;
      successfulActions: number;
      totalActions: number;
      action: string; // Guardar el action original
      description?: string; // Guardar una descripción representativa
    }>();

    logs.forEach(log => {
      const action = log.action || 'unknown';
      const existing = featureMap.get(action) || {
        usageCount: 0,
        uniqueUsers: new Set<string>(),
        totalTime: 0,
        successfulActions: 0,
        totalActions: 0,
        action: action,
        description: log.description
      };

      existing.usageCount++;
      existing.uniqueUsers.add(log.user_id);
      existing.totalActions++;
      if (log.status === 'success') {
        existing.successfulActions++;
      }
      // Estimación de tiempo: 2 min por acción exitosa
      if (log.status === 'success') {
        existing.totalTime += 2;
      }

      // Guardar la descripción más descriptiva
      if (log.description && (!existing.description || log.description.length > existing.description.length)) {
        existing.description = log.description;
      }

      featureMap.set(action, existing);
    });

    // Log para debugging: mostrar todas las acciones encontradas
    console.log('Acciones encontradas en los logs:', Array.from(featureMap.keys()));

    const featureUsage: FeatureUsage[] = Array.from(featureMap.entries()).map(([actionKey, data]) => {
      const avgTimeSpent = data.uniqueUsers.size > 0 ? data.totalTime / data.uniqueUsers.size : 0;
      const completionRate = data.totalActions > 0 ? (data.successfulActions / data.totalActions) * 100 : 0;
      
      // Categorizar por action
      let category = 'other';
      const actionLower = actionKey.toLowerCase();
      
      // Categorías basadas en las acciones reales
      if (actionLower.includes('network') || actionLower.includes('wifi') || 
          actionLower.includes('router') || actionLower.includes('connection') ||
          actionLower.includes('device_connected') || actionLower.includes('settings')) {
        category = 'configuracion';
      } else if (actionLower.includes('password') || actionLower.includes('login') ||
                 actionLower.includes('logout') || actionLower.includes('wifi_password')) {
        category = 'seguridad';
      } else if (actionLower.includes('support') || actionLower.includes('help')) {
        category = 'soporte';
      } else if (actionLower.includes('account') || actionLower.includes('billing') ||
                 actionLower.includes('data_exported')) {
        category = 'cuenta';
      }

      // Usar la función helper para obtener el nombre amigable
      const formattedName = getActionDisplayName(actionKey, data.description);

      return {
        featureName: formattedName,
        usageCount: data.usageCount,
        uniqueUsers: data.uniqueUsers.size,
        avgTimeSpent: Math.round(avgTimeSpent * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        category: category,
        trend: 0 // Se calcularía comparando con período anterior
      };
    });

    return featureUsage.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Calcula datos de sesión desde los logs
   */
  calculateSessionData(logs: ActivityLogResponse[]): SessionData[] {
    const sessionMap = new Map<string, SessionData>();

    logs.forEach(log => {
      const logDate = new Date(log.timestamp || log.created_at || '');
      const dateKey = logDate.toISOString().split('T')[0];
      const dateFormatted = `${logDate.getDate().toString().padStart(2, '0')}/${(logDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const existing = sessionMap.get(dateKey) || {
        date: dateFormatted,
        sessions: 0,
        avgDuration: 0,
        bounceRate: 0,
        pageViews: 0
      };

      existing.sessions++;
      existing.pageViews++;
      existing.avgDuration += 2; // Estimación: 2 min por acción

      sessionMap.set(dateKey, existing);
    });

    const sessionData: SessionData[] = Array.from(sessionMap.values())
      .map(data => ({
        ...data,
        avgDuration: data.sessions > 0 ? Math.round((data.avgDuration / data.sessions) * 10) / 10 : 0,
        bounceRate: Math.round(Math.random() * 10 + 15 * 10) / 10, // Estimación
        pageViews: data.pageViews
      }))
      .sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return dateA.localeCompare(dateB);
      });

    return sessionData;
  }

  /**
   * Calcula el embudo de usuario desde los logs basándose en acciones reales
   */
  calculateUserJourney(logs: ActivityLogResponse[]): UserJourneyStep[] {
    // Mapear acciones a pasos del embudo
    const actionToStepMap: Record<string, string> = {
      'login': 'Inicio de Sesión',
      'register': 'Registro',
      'verification': 'Verificación',
      'setup': 'Configuración Inicial',
      'first_action': 'Primera Acción',
      'regular_usage': 'Uso Regular'
    };

    // Agrupar logs por usuario y ordenar por fecha
    const userLogsMap = new Map<string, ActivityLogResponse[]>();
    
    logs.forEach(log => {
      const userId = log.user_id;
      if (!userLogsMap.has(userId)) {
        userLogsMap.set(userId, []);
      }
      userLogsMap.get(userId)!.push(log);
    });

    // Ordenar logs de cada usuario por fecha
    userLogsMap.forEach((userLogs) => {
      userLogs.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created_at || '').getTime();
        const dateB = new Date(b.timestamp || b.created_at || '').getTime();
        return dateA - dateB;
      });
    });

    // Contar usuarios en cada paso
    const stepUsers = new Map<string, Set<string>>();
    const stepTimes = new Map<string, number[]>();
    
    userLogsMap.forEach((userLogs, userId) => {
      let hasLogin = false;
      let hasFirstAction = false;
      let hasRegularUsage = false;
      
      // Buscar acción de login
      const loginLog = userLogs.find(log => 
        log.action === 'login' || 
        log.action?.toLowerCase().includes('login') ||
        log.type?.toLowerCase().includes('login')
      );
      
      if (loginLog) {
        hasLogin = true;
        if (!stepUsers.has('Inicio de Sesión')) {
          stepUsers.set('Inicio de Sesión', new Set());
          stepTimes.set('Inicio de Sesión', []);
        }
        stepUsers.get('Inicio de Sesión')!.add(userId);
      }

      // Buscar primera acción (segunda acción después de login)
      if (userLogs.length > 1 || (userLogs.length === 1 && !hasLogin)) {
        hasFirstAction = true;
        if (!stepUsers.has('Primera Acción')) {
          stepUsers.set('Primera Acción', new Set());
          stepTimes.set('Primera Acción', []);
        }
        stepUsers.get('Primera Acción')!.add(userId);
        
        // Calcular tiempo hasta primera acción
        if (hasLogin && loginLog && userLogs.length > 1) {
          const firstActionLog = userLogs[1];
          const loginTime = new Date(loginLog.timestamp || loginLog.created_at || '').getTime();
          const firstActionTime = new Date(firstActionLog.timestamp || firstActionLog.created_at || '').getTime();
          const timeDiff = (firstActionTime - loginTime) / (1000 * 60); // minutos
          stepTimes.get('Primera Acción')!.push(timeDiff);
        }
      }

      // Usuarios con más de 5 acciones (uso regular)
      if (userLogs.length >= 5) {
        hasRegularUsage = true;
        if (!stepUsers.has('Uso Regular')) {
          stepUsers.set('Uso Regular', new Set());
          stepTimes.set('Uso Regular', []);
        }
        stepUsers.get('Uso Regular')!.add(userId);
        
        // Calcular tiempo promedio de uso regular
        const recentLogs = userLogs.slice(-5);
        const timeSpent = recentLogs.length * 2; // Estimación: 2 min por acción
        stepTimes.get('Uso Regular')!.push(timeSpent);
      }
    });

    // Construir pasos del embudo
    const journeySteps: UserJourneyStep[] = [];
    const totalUsers = userLogsMap.size;
    
    // Paso 1: Inicio de Sesión (o Registro si no hay login)
    const loginUsers = stepUsers.get('Inicio de Sesión')?.size || 0;
    if (loginUsers > 0 || totalUsers > 0) {
      journeySteps.push({
        step: 'Inicio de Sesión',
        users: loginUsers || totalUsers,
        completionRate: totalUsers > 0 ? (loginUsers / totalUsers) * 100 : 100,
        dropoffRate: totalUsers > 0 ? ((totalUsers - loginUsers) / totalUsers) * 100 : 0,
        avgTimeSpent: 0.5 // Tiempo para iniciar sesión
      });
    }

    // Paso 2: Primera Acción
    const firstActionUsers = stepUsers.get('Primera Acción')?.size || 0;
    const previousUsers = loginUsers || totalUsers;
    if (firstActionUsers > 0 && previousUsers > 0) {
      const avgTime = stepTimes.get('Primera Acción');
      const avgTimeSpent = avgTime && avgTime.length > 0
        ? avgTime.reduce((a, b) => a + b, 0) / avgTime.length
        : 3.0;
      
      journeySteps.push({
        step: 'Primera Acción',
        users: firstActionUsers,
        completionRate: previousUsers > 0 ? (firstActionUsers / previousUsers) * 100 : 0,
        dropoffRate: previousUsers > 0 ? ((previousUsers - firstActionUsers) / previousUsers) * 100 : 0,
        avgTimeSpent: Math.round(avgTimeSpent * 10) / 10
      });
    }

    // Paso 3: Uso Regular
    const regularUsers = stepUsers.get('Uso Regular')?.size || 0;
    if (regularUsers > 0 && firstActionUsers > 0) {
      const avgTime = stepTimes.get('Uso Regular');
      const avgTimeSpent = avgTime && avgTime.length > 0
        ? avgTime.reduce((a, b) => a + b, 0) / avgTime.length
        : 8.0;
      
      journeySteps.push({
        step: 'Uso Regular',
        users: regularUsers,
        completionRate: firstActionUsers > 0 ? (regularUsers / firstActionUsers) * 100 : 0,
        dropoffRate: firstActionUsers > 0 ? ((firstActionUsers - regularUsers) / firstActionUsers) * 100 : 0,
        avgTimeSpent: Math.round(avgTimeSpent * 10) / 10
      });
    }

    // Si no hay pasos definidos, retornar un embudo básico
    if (journeySteps.length === 0) {
      return [
        {
          step: 'Inicio',
          users: totalUsers,
          completionRate: 100,
          dropoffRate: 0,
          avgTimeSpent: 1.0
        }
      ];
    }

    return journeySteps;
  }

  /**
   * Calcula segmentos de usuario desde los logs
   */
  calculateUserSegments(logs: ActivityLogResponse[]): UserSegment[] {
    const userMap = new Map<string, {
      logs: ActivityLogResponse[];
      deviceTypes: Set<string>;
      features: Map<string, number>;
      lastActivity: Date;
    }>();

    logs.forEach(log => {
      const userId = log.user_id;
      const existing = userMap.get(userId) || {
        logs: [],
        deviceTypes: new Set<string>(),
        features: new Map<string, number>(),
        lastActivity: new Date(0)
      };

      existing.logs.push(log);
      
      if (log.user_agent) {
        const ua = log.user_agent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          existing.deviceTypes.add('Mobile');
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          existing.deviceTypes.add('Tablet');
        } else if (ua.includes('desktop') || ua.includes('windows') || ua.includes('mac')) {
          existing.deviceTypes.add('Desktop');
        }
      }

      const feature = log.action || 'unknown';
      existing.features.set(feature, (existing.features.get(feature) || 0) + 1);

      const logDate = new Date(log.timestamp || log.created_at || '');
      if (logDate > existing.lastActivity) {
        existing.lastActivity = logDate;
      }

      userMap.set(userId, existing);
    });

    // Segmentar usuarios
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const premiumUsers: string[] = [];
    const newUsers: string[] = [];
    const returningUsers: string[] = [];
    const inactiveUsers: string[] = [];

    userMap.forEach((data, userId) => {
      const lastActivity = data.lastActivity;
      const logCount = data.logs.length;
      const daysSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

      if (logCount > 50 && lastActivity >= sevenDaysAgo) {
        premiumUsers.push(userId);
      } else if (lastActivity >= sevenDaysAgo && lastActivity < thirtyDaysAgo) {
        newUsers.push(userId);
      } else if (lastActivity >= sevenDaysAgo) {
        returningUsers.push(userId);
      } else if (daysSinceLastActivity > 7) {
        inactiveUsers.push(userId);
      }
    });

    const segments: UserSegment[] = [];

    if (premiumUsers.length > 0) {
      const premiumData = premiumUsers.map(uid => userMap.get(uid)!).reduce((acc, data) => {
        acc.totalLogs += data.logs.length;
        acc.totalDuration += data.logs.length * 2;
        data.deviceTypes.forEach(dt => acc.deviceTypes.add(dt));
        data.features.forEach((count, feature) => {
          acc.features.set(feature, (acc.features.get(feature) || 0) + count);
        });
        return acc;
      }, {
        totalLogs: 0,
        totalDuration: 0,
        deviceTypes: new Set<string>(),
        features: new Map<string, number>()
      });

      const topFeatures = Array.from(premiumData.features.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

      segments.push({
        id: '1',
        name: 'Usuarios Premium',
        userCount: premiumUsers.length,
        engagementRate: 87.3, // Valor estimado
        avgSessionDuration: premiumData.totalLogs > 0 ? Math.round((premiumData.totalDuration / premiumUsers.length) * 10) / 10 : 0,
        lastActivity: new Date(Math.max(...premiumUsers.map(uid => {
          const data = userMap.get(uid)!;
          return data.lastActivity.getTime();
        }))),
        lifetimeValue: premiumUsers.length * 450000,
        retentionRate: 89.2, // Valor estimado
        deviceTypes: Array.from(premiumData.deviceTypes),
        topFeatures: topFeatures
      });
    }

    // Similar para otros segmentos...
    // Por ahora, retornamos un segmento básico
    return segments.length > 0 ? segments : [
      {
        id: '1',
        name: 'Todos los Usuarios',
        userCount: userMap.size,
        engagementRate: 70,
        avgSessionDuration: 8.4,
        lastActivity: new Date(),
        lifetimeValue: userMap.size * 200000,
        retentionRate: 65,
        deviceTypes: ['Mobile', 'Desktop'],
        topFeatures: []
      }
    ];
  }

  /**
   * Health check del endpoint de Daily Active Users
   */
  async checkDailyActiveUsersHealth(): Promise<{ success: boolean; message: string }> {
    try {
      const url = ApiConfig.getDailyActiveUsersHealthUrl();
      const response = await axios.get(url, {
        timeout: ApiConfig.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return {
        success: response.data.success || false,
        message: response.data.message || 'Health check completado'
      };
    } catch (error) {
      console.error('Error en health check de Daily Active Users:', error);
      throw new Error('No se pudo verificar el estado del servicio');
    }
  }

  /**
   * Obtiene usuarios activos diarios
   */
  async getDailyActiveUsers(
    startDate?: string,
    endDate?: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    success: boolean;
    message: string;
    data: Array<{
      date: string;
      active_users: number;
      new_logins: number;
      returning_users: number;
      total_logins: number;
      total_logouts: number;
      peak_hour?: number;
      avg_session_duration_minutes?: number;
    }>;
    summary: {
      total_days: number;
      average_daily_active_users: number;
      peak_day: string;
      peak_active_users: number;
      total_active_users: number;
    };
  }> {
    try {
      const url = ApiConfig.getDailyActiveUsersUrl(startDate, endDate, groupBy);
      const response = await axios.get(url, {
        timeout: ApiConfig.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const data = axiosError.response.data as any;
        throw new Error(
          data?.message || 
          `Error al obtener usuarios activos diarios: ${axiosError.response.status}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener usuarios activos diarios: ${axiosError.message}`);
      }
    }
  }

  /**
   * Obtiene detalles de usuarios activos para una fecha específica
   */
  async getDailyActiveUsersDetailed(
    date: string,
    includeUserDetails: boolean = true
  ): Promise<{
    success: boolean;
    message: string;
    date: string;
    data: {
      active_users: number;
      users: Array<{
        user_id: string;
        username?: string;
        email?: string;
        first_login: string;
        last_login: string;
        last_logout?: string | null;
        login_count: number;
        logout_count: number;
        session_duration_minutes?: number | null;
        is_active: boolean;
      }>;
    };
  }> {
    try {
      const url = ApiConfig.getDailyActiveUsersDetailedUrl(date, includeUserDetails);
      const response = await axios.get(url, {
        timeout: ApiConfig.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const data = axiosError.response.data as any;
        throw new Error(
          data?.message || 
          `Error al obtener detalles de usuarios activos: ${axiosError.response.status}`
        );
      } else if (axiosError.request) {
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión.');
      } else {
        throw new Error(`Error al obtener detalles de usuarios activos: ${axiosError.message}`);
      }
    }
  }
}

// Exportar una instancia única del servicio
export const activityLogService = new ActivityLogService();
export default activityLogService;

