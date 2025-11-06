import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import MetricsStrip from './components/MetricsStrip';
import FilterControls from './components/FilterControls';
import AnalyticsTabs from './components/AnalyticsTabs';
import LiveActivityFeed from './components/LiveActivityFeed';
import UserSegmentTable from './components/UserSegmentTable';
import {
  EngagementMetric,
  FilterOptions,
  UserJourneyStep,
  FeatureUsage,
  SessionData,
  UserActivity,
  UserSegment
} from './types';
import activityLogService from '../../services/activity-log.service';
import Icon from '../../components/AppIcon';
import { exportToCSV, exportToExcel, exportToPDF, tableToHTML } from '../../utils/export.utils';

const UserAnalyticsMonitor: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'last-7-days',
    userSegment: 'all',
    deviceType: 'all',
    location: 'all',
    dataType: 'realtime'
  });

  // Estados para los datos
  const [rawLogs, setRawLogs] = useState<any[]>([]); // Logs sin filtrar
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetric[]>([]);
  const [userJourneyData, setUserJourneyData] = useState<UserJourneyStep[]>([]);
  const [featureUsageData, setFeatureUsageData] = useState<FeatureUsage[]>([]);
  const [sessionTimelineData, setSessionTimelineData] = useState<SessionData[]>([]);
  const [liveActivities, setLiveActivities] = useState<UserActivity[]>([]);
  const [lastActivityId, setLastActivityId] = useState<string | null>(null);
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);

  /**
   * Calcula las fechas según el rango seleccionado
   * Formato: YYYY-MM-DD para compatibilidad con el backend
   */
  const getDateRange = (dateRange: string): { start_date?: string; end_date?: string } => {
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'last-7-days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last-30-days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last-90-days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return {};
    }
    
    // Formato YYYY-MM-DD para compatibilidad
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      start_date: formatDate(startDate),
      end_date: formatDate(now)
    };
  };

  /**
   * Filtra los logs según los filtros seleccionados
   */
  const applyFilters = useCallback((logs: any[]): any[] => {
    let filteredLogs = [...logs];

    // Filtrar por rango de fechas (en el cliente porque el backend no acepta fechas)
    if (filters.dateRange) {
      const dateRange = getDateRange(filters.dateRange);
      if (dateRange.start_date && dateRange.end_date) {
        filteredLogs = filteredLogs.filter(log => {
          const logDate = new Date(log.timestamp || log.created_at || '');
          const startDate = new Date(dateRange.start_date!);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(dateRange.end_date!);
          endDate.setHours(23, 59, 59, 999);
          
          return logDate >= startDate && logDate <= endDate;
        });
      }
    }

    // Filtrar por tipo de dispositivo
    if (filters.deviceType && filters.deviceType !== 'all') {
      const deviceTypeMap: Record<string, string> = {
        'mobile': 'Mobile',
        'tablet': 'Tablet',
        'desktop': 'Desktop'
      };
      const targetDeviceType = deviceTypeMap[filters.deviceType];
      
      filteredLogs = filteredLogs.filter(log => {
        const activity = activityLogService.mapLogsToUserActivities([log])[0];
        return activity.deviceType === targetDeviceType;
      });
    }

    // Filtrar por ubicación (por IP)
    if (filters.location && filters.location !== 'all') {
      // Por ahora solo filtramos por IP si hay una forma de mapear ubicación
      // Esto sería mejor con un servicio de geolocalización
      filteredLogs = filteredLogs.filter(log => {
        // Por ahora, todos pasan el filtro de ubicación
        // En producción, usarías un servicio de geolocalización
        return true;
      });
    }

    // Filtrar por segmento de usuario (esto se aplica después de calcular segmentos)
    // Este filtro se aplicará en el cálculo de segmentos

    return filteredLogs;
  }, [filters.dateRange, filters.deviceType, filters.location]);

  /**
   * Procesa los logs y calcula todas las métricas
   */
  const processLogs = useCallback(async (logs: any[]) => {
    if (!logs || logs.length === 0) {
      setEngagementMetrics([]);
      setFeatureUsageData([]);
      setSessionTimelineData([]);
      setUserSegments([]);
      setLiveActivities([]);
      setUserJourneyData([]);
      return;
    }

    // Calcular métricas desde los logs
    let metrics = activityLogService.calculateEngagementMetrics(logs);
    
    // Intentar obtener usuarios activos diarios del endpoint especializado
    // Si falla, usar los datos calculados localmente
    try {
      const dateRange = getDateRange(filters.dateRange);
      if (dateRange.start_date && dateRange.end_date) {
        const dauData = await activityLogService.getDailyActiveUsers(
          dateRange.start_date,
          dateRange.end_date,
          'day'
        );
        
        if (dauData.success && dauData.data.length > 0) {
          // Actualizar métrica de usuarios activos diarios con datos reales del endpoint
          const latestDay = dauData.data[dauData.data.length - 1];
          const previousDay = dauData.data.length > 1 ? dauData.data[dauData.data.length - 2] : null;
          
          const dauMetric = metrics.find(m => m.id === '1');
          if (dauMetric) {
            dauMetric.value = latestDay.active_users;
            if (previousDay) {
              dauMetric.previousValue = previousDay.active_users;
              const change = previousDay.active_users > 0 
                ? ((latestDay.active_users - previousDay.active_users) / previousDay.active_users) * 100
                : 0;
              dauMetric.changePercentage = Math.abs(change);
              dauMetric.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
            }
          }
          
          console.log('✅ Usuarios activos diarios obtenidos del endpoint:', latestDay.active_users);
        }
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener usuarios activos diarios del endpoint, usando datos calculados:', error);
      // Continuar con los datos calculados localmente
    }
    
    setEngagementMetrics(metrics);
    
    // Calcular uso de funciones
    const features = activityLogService.calculateFeatureUsage(logs);
    setFeatureUsageData(features);
    
    // Calcular datos de sesión
    const sessions = activityLogService.calculateSessionData(logs);
    setSessionTimelineData(sessions);
    
    // Calcular segmentos de usuario
    let segments = activityLogService.calculateUserSegments(logs);
    
    // Aplicar filtro de segmento de usuario
    if (filters.userSegment && filters.userSegment !== 'all') {
      // Filtrar segmentos según el filtro seleccionado
      // Esto es una aproximación ya que los segmentos ya están calculados
      // En producción, podrías recalcular segmentos con filtros específicos
      segments = segments.filter(segment => {
        const segmentNameLower = segment.name.toLowerCase();
        switch (filters.userSegment) {
          case 'new':
            return segmentNameLower.includes('nuevo') || segmentNameLower.includes('new');
          case 'returning':
            return segmentNameLower.includes('recurrente') || segmentNameLower.includes('returning');
          case 'premium':
            return segmentNameLower.includes('premium');
          case 'inactive':
            return segmentNameLower.includes('inactivo') || segmentNameLower.includes('inactive');
          default:
            return true;
        }
      });
    }
    
    setUserSegments(segments);
    
    // Mapear logs a actividades en vivo (últimas 10 actividades más recientes)
    // Usar el endpoint de logs recientes para obtener los más actuales
    let activitiesToShow: UserActivity[] = [];
    
    try {
      // Intentar obtener logs recientes usando el endpoint especializado
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Si tenemos un lastActivityId, usar polling con last_id
      // Si no, obtener desde las últimas 24 horas
      const filters: any = {
        limit: 50, // Obtener más logs recientes
      };
      
      if (lastActivityId) {
        // Polling: obtener solo logs nuevos desde el último ID
        filters.last_id = lastActivityId;
      } else {
        // Primera carga: obtener desde las últimas 24 horas
        filters.since = last24Hours.toISOString();
      }
      
      const recentLogsResponse = await activityLogService.getRecentActivityLogs(filters);
      
      if (recentLogsResponse.success && recentLogsResponse.data && recentLogsResponse.data.length > 0) {
        // Mapear y ordenar los logs recientes
        const recentActivities = activityLogService.mapLogsToUserActivities(recentLogsResponse.data)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10);
        
        // Actualizar el último ID para el próximo polling
        const mostRecentLog = recentLogsResponse.data[0];
        if (mostRecentLog._id || mostRecentLog.id) {
          setLastActivityId(mostRecentLog._id || mostRecentLog.id || null);
        }
        
        activitiesToShow = recentActivities;
        console.log('✅ Logs recientes obtenidos del endpoint /recent:', recentActivities.length);
      } else {
        // Si no hay logs recientes del endpoint, usar los logs disponibles
        console.log('⚠️ No hay logs recientes del endpoint /recent, usando logs disponibles');
        const allActivities = activityLogService.mapLogsToUserActivities(logs);
        const sortedActivities = [...allActivities].sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );
        activitiesToShow = sortedActivities.slice(0, 10);
        
        // Guardar el último ID si hay logs disponibles
        if (logs.length > 0 && (logs[0]._id || logs[0].id)) {
          setLastActivityId(logs[0]._id || logs[0].id || null);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error al obtener logs recientes, usando logs disponibles:', error);
      // Fallback: usar los logs disponibles
      const allActivities = activityLogService.mapLogsToUserActivities(logs);
      const sortedActivities = [...allActivities].sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
      activitiesToShow = sortedActivities.slice(0, 10);
    }
    
    // Debug: mostrar información de los primeros logs para verificar
    if (activitiesToShow.length > 0) {
      const debugNow = new Date();
      const debugLast24Hours = new Date(debugNow.getTime() - 24 * 60 * 60 * 1000);
      const firstActivity = activitiesToShow[0];
      
      console.log('📊 Debug Actividades en vivo - DETALLADO:', {
        totalLogs: logs.length,
        activitiesToShow: activitiesToShow.length,
        now: {
          ISO: debugNow.toISOString(),
          local: debugNow.toString(),
          timestamp: debugNow.getTime()
        },
        last24Hours: {
          ISO: debugLast24Hours.toISOString(),
          local: debugLast24Hours.toString(),
          timestamp: debugLast24Hours.getTime()
        },
        firstActivity: firstActivity ? {
          action: firstActivity.action,
          timestamp: {
            ISO: firstActivity.timestamp.toISOString(),
            local: firstActivity.timestamp.toString(),
            timestamp: firstActivity.timestamp.getTime()
          },
          diffMs: debugNow.getTime() - firstActivity.timestamp.getTime(),
          diffMinutes: Math.floor((debugNow.getTime() - firstActivity.timestamp.getTime()) / 60000),
          diffHours: Math.floor((debugNow.getTime() - firstActivity.timestamp.getTime()) / (60000 * 60)),
          diffDays: Math.floor((debugNow.getTime() - firstActivity.timestamp.getTime()) / (60000 * 60 * 24)),
          isRecent: firstActivity.timestamp.getTime() >= debugLast24Hours.getTime()
        } : null,
        activitiesFirst5: activitiesToShow.slice(0, 5).map((a: UserActivity) => ({
          action: a.action,
          timestamp: a.timestamp.toISOString(),
          diffHours: Math.floor((debugNow.getTime() - a.timestamp.getTime()) / (60000 * 60)),
          diffDays: Math.floor((debugNow.getTime() - a.timestamp.getTime()) / (60000 * 60 * 24))
        }))
      });
    }
    
    setLiveActivities(activitiesToShow);
    
    // Calcular datos del embudo de usuario desde los logs reales
    const journeySteps = activityLogService.calculateUserJourney(logs);
    setUserJourneyData(journeySteps);
  }, [filters.userSegment]);

  /**
   * Carga los datos desde la API
   */
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener logs usando el endpoint correcto (/users/activity-logs/user/:userId)
      // El servicio obtendrá todos los usuarios y luego sus logs
      // El backend no acepta parámetros de fecha en el endpoint /user/:userId
      // Por lo tanto, obtenemos todos los logs y filtramos en el cliente
      // IMPORTANTE: Aumentar el límite para asegurar que obtengamos los logs más recientes
      const apiFilters: any = {
        limit: 10000, // Obtener más logs para asegurar que tengamos los más recientes
        skip: 0
      };
      
      console.log('🔄 Cargando logs de actividad (límite: 10000)...');
      
      // NO enviar fechas al backend ya que no las acepta
      // Las fechas se filtrarán en el cliente después de obtener los datos
      
      const response = await activityLogService.getActivityLogs(apiFilters);
      
      if (response.success && response.data && response.data.length > 0) {
        // Guardar logs sin filtrar
        setRawLogs(response.data);
        
        // Aplicar filtros y procesar
        const filteredLogs = applyFilters(response.data);
        processLogs(filteredLogs);
      } else if (response.success && (!response.data || response.data.length === 0)) {
        // No hay datos pero la respuesta fue exitosa
        setRawLogs([]);
        processLogs([]);
        setError('No se encontraron registros de actividad para el período seleccionado');
      } else {
        setError(response.message || 'No se pudieron obtener los datos de actividad');
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los datos';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'csv' || format === 'excel') {
      // Exportar todos los datos combinados
      const exportData = [
        ...featureUsageData.map((item, index) => ({
          '#': index + 1,
          'Acción': item.featureName,
          'Categoría': item.category,
          'Usos': item.usageCount,
          'Usuarios Únicos': item.uniqueUsers,
          'Tasa de Éxito (%)': item.completionRate,
          'Tiempo Promedio (min)': item.avgTimeSpent
        })),
        ...userJourneyData.map((item, index) => ({
          '#': index + 1,
          'Paso': item.step,
          'Usuarios': item.users,
          'Tasa de Finalización (%)': item.completionRate,
          'Tasa de Abandono (%)': item.dropoffRate,
          'Tiempo Promedio (min)': item.avgTimeSpent
        })),
        ...userSegments.map((item, index) => ({
          '#': index + 1,
          'Segmento': item.name,
          'Usuarios': item.userCount,
          'Tasa de Engagement (%)': item.engagementRate,
          'Tasa de Retención (%)': item.retentionRate,
          'Duración Promedio (min)': item.avgSessionDuration,
          'Valor de Vida': item.lifetimeValue
        }))
      ];

      if (exportData.length === 0) {
        alert('No hay datos para exportar');
        return;
      }

      const filename = `analisis-usuario-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        exportToCSV(exportData, filename);
      } else {
        exportToExcel(exportData, filename);
      }
    } else if (format === 'pdf') {
      // Exportar a PDF
      const sections = [];
      
      // Sección: Top Acciones
      if (featureUsageData.length > 0) {
        const topActions = featureUsageData
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 10);
        sections.push(`
          <h2>Top 10 Acciones Más Usadas</h2>
          ${tableToHTML(
            topActions,
            ['featureName', 'category', 'usageCount', 'uniqueUsers', 'completionRate', 'avgTimeSpent'],
            ['Acción', 'Categoría', 'Usos', 'Usuarios Únicos', 'Tasa de Éxito (%)', 'Tiempo Promedio (min)']
          )}
        `);
      }

      // Sección: Embudo de Usuario
      if (userJourneyData.length > 0) {
        sections.push(`
          <h2>Embudo de Usuario</h2>
          ${tableToHTML(
            userJourneyData,
            ['step', 'users', 'completionRate', 'dropoffRate', 'avgTimeSpent'],
            ['Paso', 'Usuarios', 'Tasa de Finalización (%)', 'Tasa de Abandono (%)', 'Tiempo Promedio (min)']
          )}
        `);
      }

      // Sección: Segmentos de Usuario
      if (userSegments.length > 0) {
        sections.push(`
          <h2>Segmentos de Usuario</h2>
          ${tableToHTML(
            userSegments,
            ['name', 'userCount', 'engagementRate', 'retentionRate', 'avgSessionDuration', 'lifetimeValue'],
            ['Segmento', 'Usuarios', 'Tasa de Engagement (%)', 'Tasa de Retención (%)', 'Duración Promedio (min)', 'Valor de Vida']
          )}
        `);
      }

      if (sections.length === 0) {
        alert('No hay datos para exportar');
        return;
      }

      const content = sections.join('<br/><br/>');
      const filename = `analisis-usuario-${new Date().toISOString().split('T')[0]}`;
      exportToPDF('Monitor de Análisis de Usuario', content, filename);
    }
  };

  // Cargar datos inicialmente
  useEffect(() => {
    loadData();
  }, []); // Solo cargar una vez al montar el componente

  // Polling automático para actualizar actividades en tiempo real
  useEffect(() => {
    if (!isPollingActive) return;
    
    // Función para actualizar actividades en vivo
    const updateLiveActivities = async () => {
      try {
        const filters: any = {
          limit: 50,
        };
        
        if (lastActivityId) {
          // Polling: obtener solo logs nuevos desde el último ID
          filters.last_id = lastActivityId;
        } else {
          // Si no hay last_id, obtener desde las últimas 24 horas
          const now = new Date();
          const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          filters.since = last24Hours.toISOString();
        }
        
        const recentLogsResponse = await activityLogService.getRecentActivityLogs(filters);
        
        if (recentLogsResponse.success && recentLogsResponse.data && recentLogsResponse.data.length > 0) {
          // Mapear y ordenar los logs recientes
          const recentActivities = activityLogService.mapLogsToUserActivities(recentLogsResponse.data)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);
          
          // Actualizar el último ID para el próximo polling
          const mostRecentLog = recentLogsResponse.data[0];
          if (mostRecentLog._id || mostRecentLog.id) {
            setLastActivityId(mostRecentLog._id || mostRecentLog.id || null);
          }
          
          // Actualizar actividades en vivo
          setLiveActivities(recentActivities);
          console.log('🔄 Actividades actualizadas en tiempo real:', recentActivities.length);
        }
      } catch (error) {
        console.warn('⚠️ Error en polling de actividades:', error);
      }
    };
    
    // Actualizar inmediatamente y luego cada 10 segundos
    updateLiveActivities();
    const interval = setInterval(updateLiveActivities, 10000); // 10 segundos
    
    return () => clearInterval(interval);
  }, [isPollingActive, lastActivityId]);

  // Reaplicar filtros cuando cambien los filtros (sin recargar de la API)
  // Esto incluye el rango de fechas que ahora se filtra en el cliente
  useEffect(() => {
    if (rawLogs.length > 0) {
      const filteredLogs = applyFilters(rawLogs);
      processLogs(filteredLogs).catch(error => {
        console.error('Error al procesar logs:', error);
      });
    }
  }, [rawLogs, applyFilters, processLogs, filters.dateRange, filters.dataType]);

  return (
    <>
      <Helmet>
        <title>Monitor de Análisis de Usuario - Conect@t Analytics</title>
        <meta 
          name="description" 
          content="Análisis detallado del comportamiento y engagement de usuarios para gestores de servicio al cliente y analistas de negocio" 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header 
          onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          showMobileMenu={mobileSidebarOpen}
        />
        
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <main 
          className={`
            transition-all duration-300 ease-in-out pt-16
            ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
          `}
        >
          <div className="p-4 lg:p-6 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Monitor de Análisis de Usuario
                </h1>
                <p className="text-muted-foreground mt-1">
                  Análisis detallado del comportamiento y engagement de usuarios para optimización de estrategias
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Cargando datos...</span>
                  </>
                ) : error ? (
                  <>
                    <Icon name="AlertCircle" size={16} className="text-error" />
                    <span className="text-error">Error al cargar</span>
                  </>
                ) : (
                  <>
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span>Datos actualizados</span>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-center gap-3">
                <Icon name="AlertCircle" size={20} className="text-error" />
                <div className="flex-1">
                  <p className="text-error font-medium">{error}</p>
                  <button
                    onClick={loadData}
                    className="text-error hover:underline text-sm mt-1"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* Metrics Strip */}
            {engagementMetrics.length > 0 && (
            <MetricsStrip metrics={engagementMetrics} />
            )}

            {/* Filter Controls */}
            <FilterControls
              filters={filters}
              onFiltersChange={setFilters}
              onRefresh={handleRefresh}
              onExport={handleExport}
              onClearFilters={() => {
                setFilters({
                  dateRange: 'last-7-days',
                  userSegment: 'all',
                  deviceType: 'all',
                  location: 'all',
                  dataType: 'realtime'
                });
              }}
              isLoading={isLoading}
            />

            {/* Main Content Grid */}
            {!isLoading && !error && (
              <>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Analytics Tabs - Main Content */}
              <div className="xl:col-span-3">
                <AnalyticsTabs
                  journeyData={userJourneyData}
                  featureData={featureUsageData}
                  sessionData={sessionTimelineData}
                />
              </div>

              {/* Live Activity Feed - Right Panel */}
              <div className="xl:col-span-1">
                    <LiveActivityFeed 
                      activities={liveActivities} 
                      onTogglePolling={setIsPollingActive}
                      isPollingActive={isPollingActive}
                    />
              </div>
            </div>

            {/* User Segment Table */}
            <UserSegmentTable segments={userSegments} />
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default UserAnalyticsMonitor;