import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import KPICards from './components/KPICards';
import DeliveryChart from './components/DeliveryChart';
import CampaignFunnel from './components/CampaignFunnel';
import SurveyResponses from './components/SurveyResponses';
import SurveyAnalytics from './components/SurveyAnalytics';
import SentimentTrending from './components/SentimentTrending';
import FilterControls from './components/FilterControls';
import notificationService, { 
  surveyResponseService, 
  notificationResponseService,
  AlertsStatsComparisonResponse,
  AlertsStatsResponse,
  StatsChanges,
  AlertsStats,
  AlertType,
  AlertResponse
} from '../../services/notification.service';
import userService from '../../services/user.service';
import {
  KPICardData,
  DeliveryMetric,
  CampaignFunnelData,
  SurveyResponse,
  SentimentDistribution,
  FilterOptions
} from './types';
import { exportToPDF, exportToExcel, tableToHTML } from '../../utils/export.utils';

const CommunicationAnalytics: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'last-7-days',
    campaignType: [],
    notificationType: [],
    status: []
  });

  // Estados para datos reales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<KPICardData[]>([]);
  const [deliveryData, setDeliveryData] = useState<DeliveryMetric[]>([]);
  const [funnelData, setFunnelData] = useState<CampaignFunnelData[]>([]);
  const [surveyData, setSurveyData] = useState<SurveyResponse[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentDistribution>({
    positive: 0,
    negative: 0,
    neutral: 0,
    total: 0
  });
  const [surveyIds, setSurveyIds] = useState<string[]>([]);
  const [surveyTitles, setSurveyTitles] = useState<{ [surveyId: string]: string }>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Función para mapear dateRange a period
  const mapDateRangeToPeriod = (dateRange: string): '7d' | '30d' | '90d' | undefined => {
    switch (dateRange) {
      case 'last-7-days':
        return '7d';
      case 'last-30-days':
        return '30d';
      case 'last-90-days':
        return '90d';
      default:
        return undefined; // Sin comparación para otros rangos
    }
  };

  // Función para cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el período del filtro seleccionado
      const period = mapDateRangeToPeriod(filters.dateRange);

      // Cargar estadísticas (con o sin comparación según el período)
      const statsResponse = await notificationService.getStats(period);
      
      // Verificar si es una respuesta de comparación o estadísticas generales
      const isComparison = 'current' in statsResponse && 'previous' in statsResponse && 'changes' in statsResponse;
      
      let stats: AlertsStats;
      let changes: StatsChanges | null = null;
      
      if (isComparison) {
        const comparisonResponse = statsResponse as AlertsStatsComparisonResponse;
        stats = comparisonResponse.current.stats;
        changes = comparisonResponse.changes;
      } else {
        const generalResponse = statsResponse as AlertsStatsResponse;
        stats = generalResponse.stats;
      }

      // Calcular KPIs con datos reales
      const newKpiData: KPICardData[] = [
        {
          title: 'Tasa de Entrega',
          value: `${stats.delivery_rate.toFixed(1)}%`,
          change: changes ? changes.delivery_rate : 0,
          trend: changes ? (changes.delivery_rate >= 0 ? 'up' : 'down') : (stats.delivery_rate >= 90 ? 'up' : 'down'),
          benchmark: 90,
          icon: 'Send',
          color: 'bg-primary'
        },
        {
          title: 'Tasa de Apertura',
          value: `${stats.open_rate.toFixed(1)}%`,
          change: changes ? changes.open_rate : 0,
          trend: changes ? (changes.open_rate >= 0 ? 'up' : 'down') : (stats.open_rate >= 70 ? 'up' : 'down'),
          benchmark: 70,
          icon: 'Eye',
          color: 'bg-accent'
        },
        {
          title: 'Tasa de Respuesta',
          value: `${stats.response_rate.toFixed(1)}%`,
          change: changes ? changes.response_rate : 0,
          trend: changes ? (changes.response_rate >= 0 ? 'up' : 'down') : (stats.response_rate >= 20 ? 'up' : 'down'),
          benchmark: 20,
          icon: 'MessageCircle',
          color: 'bg-success'
        }
      ];
      setKpiData(newKpiData);

      // Calcular funnel data
      const newFunnelData: CampaignFunnelData[] = [
        { 
          stage: 'Mensajes Enviados', 
          value: stats.total_alerts, 
          percentage: 100, 
          color: 'var(--color-primary)' 
        },
        { 
          stage: 'Entregados', 
          value: stats.total_notification_responses, 
          percentage: stats.delivery_rate, 
          color: 'var(--color-accent)' 
        },
        { 
          stage: 'Abiertos', 
          value: stats.total_read, 
          percentage: stats.open_rate, 
          color: 'var(--color-success)' 
        },
        { 
          stage: 'Interacciones', 
          value: stats.total_read, 
          percentage: stats.open_rate, 
          color: 'var(--color-warning)' 
        },
        { 
          stage: 'Conversiones', 
          value: stats.total_survey_responses, 
          percentage: stats.response_rate, 
          color: 'var(--color-error)' 
        }
      ];
      setFunnelData(newFunnelData);

      // Función para calcular rango de fechas según el filtro
      const getDateRange = (dateRange: string): { start: Date; end: Date } => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        
        switch (dateRange) {
          case 'today':
            start.setHours(0, 0, 0, 0);
            break;
          case 'yesterday':
            start.setDate(start.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end.setDate(end.getDate() - 1);
            end.setHours(23, 59, 59, 999);
            break;
          case 'last-7-days':
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            break;
          case 'last-30-days':
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            break;
          case 'last-90-days':
            start.setDate(start.getDate() - 90);
            start.setHours(0, 0, 0, 0);
            break;
          default:
            // Por defecto, últimos 7 días
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
        }
        
        return { start, end };
      };

      // Mapear tipos de campaña del frontend a tipos de alert del backend
      const mapCampaignTypeToAlertType = (campaignType: string): AlertType | undefined => {
        const typeMap: Record<string, AlertType> = {
          'promotional': 'message',
          'transactional': 'message',
          'informational': 'message',
          'survey': 'survey'
        };
        return typeMap[campaignType];
      };

      // Obtener todos los alerts (aplicar filtros de tipo si hay)
      let filteredAlerts: AlertResponse[] = [];
      
      // Si hay filtros de tipo de campaña, obtener cada tipo por separado
      if (filters.campaignType.length > 0) {
        const alertTypes = filters.campaignType
          .map(mapCampaignTypeToAlertType)
          .filter((type): type is AlertType => type !== undefined);
        
        // Obtener alerts de cada tipo
        for (const alertType of alertTypes) {
          try {
            const response = await notificationService.getAllAlerts(alertType);
            filteredAlerts = [...filteredAlerts, ...response.alerts];
          } catch (error) {
            console.warn(`Error al obtener alerts de tipo ${alertType}:`, error);
          }
        }
      } else {
        // Si no hay filtros de tipo, obtener todos
        const alertsResponse = await notificationService.getAllAlerts();
        filteredAlerts = alertsResponse.alerts;
      }

      // Aplicar filtro de fecha
      const dateRange = getDateRange(filters.dateRange);
      filteredAlerts = filteredAlerts.filter(alert => {
        if (!alert.created_at) return false;
        const alertDate = new Date(alert.created_at);
        return alertDate >= dateRange.start && alertDate <= dateRange.end;
      });

      // Aplicar filtro de estado (si está disponible en el alert)
      // Nota: El backend no tiene campo "status", así que esto se puede aplicar en el futuro
      // Por ahora, solo filtramos por tipo y fecha

      // Calcular delivery data agrupando por fecha (si hay datos)
      // Nota: Solo usamos notificaciones push nativas de la app, no email ni SMS
      if (filteredAlerts.length > 0) {
        const deliveryDataByDate: { [key: string]: { push: number; sms: number; email: number; total: number } } = {};
        
        filteredAlerts.forEach(alert => {
          const date = alert.created_at ? new Date(alert.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          if (!deliveryDataByDate[date]) {
            deliveryDataByDate[date] = { push: 0, sms: 0, email: 0, total: 0 };
          }
          
          // Todas las notificaciones son push nativas de la app
          deliveryDataByDate[date].push += 1;
          deliveryDataByDate[date].total += 1;
        });
        
        const deliveryDataArray: DeliveryMetric[] = Object.entries(deliveryDataByDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, data]) => ({
            date,
            push: data.push,
            sms: 0, // No usamos SMS
            email: 0, // No usamos Email
            total: data.total
          }));
        
        setDeliveryData(deliveryDataArray);
      } else {
        setDeliveryData([]);
      }

      // Cargar respuestas de encuestas
      const surveyAlerts = filteredAlerts.filter(a => a.type === 'survey');
      const surveyResponsesData: SurveyResponse[] = [];
      const allRatings: number[] = []; // Para calcular sentimiento de todas las respuestas
      const surveyIdsList: string[] = [];
      const surveyTitlesMap: { [surveyId: string]: string } = {};
      
      // Cargar todas las respuestas de todas las encuestas para calcular sentimiento
      for (const surveyAlert of surveyAlerts) {
        try {
          const surveyId = surveyAlert.data?.survey_id || surveyAlert._id || surveyAlert.id || '';
          
          // Recopilar IDs y títulos de encuestas para el componente de analíticas
          if (surveyId && !surveyIdsList.includes(surveyId)) {
            surveyIdsList.push(surveyId);
            surveyTitlesMap[surveyId] = surveyAlert.title || surveyId;
          }
          // Cargar todas las respuestas (sin límite) para calcular sentimiento
          const responsesResult = await surveyResponseService.getSurveyResponses(surveyId);
          const allResponses = responsesResult.surveyResponses || [];
          
          // Extraer ratings de todas las respuestas
          allResponses.forEach(response => {
            const answer = response.answers?.[0];
            if (answer && typeof answer.answer === 'number') {
              allRatings.push(answer.answer);
            }
          });
          
          // Solo cargar las primeras 4 para mostrar en el componente
          const responses = allResponses.slice(0, 4);
          for (const response of responses) {
            // Obtener información del usuario
            try {
              const users = await userService.getUsers();
              const user = users.find(u => u.id === response.user_id);
              if (!user) continue;
              const answer = response.answers?.[0];
              
              surveyResponsesData.push({
                id: response._id || response.id || '',
                surveyId: surveyId,
                surveyTitle: surveyAlert.title,
                respondent: `${user.firstName} ${user.lastName}`,
                completedAt: new Date(response.created_at || new Date()),
                sentiment: typeof answer?.answer === 'number' && answer.answer >= 4 ? 'positive' : 
                          typeof answer?.answer === 'number' && answer.answer <= 2 ? 'negative' : 'neutral',
                rating: typeof answer?.answer === 'number' ? answer.answer : 3,
                feedback: typeof answer?.answer === 'string' ? answer.answer : 'Sin comentarios',
                demographics: {
                  age: 'N/A',
                  location: user.metadata?.address || 'N/A',
                  segment: user.segment || 'N/A'
                }
              });
            } catch (userError) {
              console.warn('No se pudo obtener información del usuario:', userError);
            }
          }
        } catch (error) {
          console.warn('Error al obtener respuestas de encuesta:', error);
        }
      }
      setSurveyData(surveyResponsesData);
      setSurveyIds(surveyIdsList);
      setSurveyTitles(surveyTitlesMap);

      // Calcular distribución de sentimiento desde todas las respuestas cargadas
      const positive = surveyResponsesData.filter(r => r.sentiment === 'positive').length;
      const negative = surveyResponsesData.filter(r => r.sentiment === 'negative').length;
      const neutral = surveyResponsesData.filter(r => r.sentiment === 'neutral').length;
      setSentimentData({
        positive,
        negative,
        neutral,
        total: surveyResponsesData.length
      });

      // Nota: La puntuación de sentimiento se eliminó porque no hay suficientes datos
      // Si en el futuro hay suficientes respuestas de encuestas, se puede agregar de nuevo

      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(errorMessage);
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Análisis de Comunicación - Conect@t Analytics';
    loadData();
  }, [filters]); // Recargar cuando cambien los filtros

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    try {
      const filename = `analisis-comunicacion-${new Date().toISOString().split('T')[0]}`;
      
      // Preparar datos para exportar
      const exportData: any[] = [];
      
      // Agregar KPIs
      kpiData.forEach(kpi => {
        exportData.push({
          'Tipo': 'KPI',
          'Métrica': kpi.title,
          'Valor': kpi.value,
          'Cambio (%)': `${kpi.change >= 0 ? '+' : ''}${kpi.change.toFixed(1)}%`,
          'Benchmark': `${kpi.benchmark}%`,
          'Tendencia': kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'
        });
      });
      
      // Agregar datos de entrega
      deliveryData.forEach(delivery => {
        exportData.push({
          'Tipo': 'Entrega',
          'Fecha': delivery.date,
          'Push': delivery.push,
          'SMS': delivery.sms,
          'Email': delivery.email,
          'Total': delivery.total
        });
      });
      
      // Agregar datos del embudo
      funnelData.forEach(funnel => {
        exportData.push({
          'Tipo': 'Embudo',
          'Etapa': funnel.stage,
          'Valor': funnel.value,
          'Porcentaje (%)': `${funnel.percentage.toFixed(1)}%`
        });
      });
      
      // Agregar respuestas de encuestas
      surveyData.forEach(survey => {
        exportData.push({
          'Tipo': 'Encuesta',
          'Título': survey.surveyTitle,
          'Respondente': survey.respondent,
          'Fecha': survey.completedAt.toISOString().split('T')[0],
          'Sentimiento': survey.sentiment,
          'Rating': survey.rating,
          'Feedback': survey.feedback
        });
      });
      
      // Agregar datos de sentimiento
      exportData.push({
        'Tipo': 'Sentimiento',
        'Métrica': 'Distribución',
        'Positivo': sentimentData.positive,
        'Negativo': sentimentData.negative,
        'Neutro': sentimentData.neutral,
        'Total': sentimentData.total
      });
      
      if (exportData.length === 0) {
        alert('No hay datos para exportar');
        return;
      }
      
      if (format === 'excel') {
        exportToExcel(exportData, filename);
      } else if (format === 'pdf') {
        // Preparar contenido HTML para PDF
        const sections: string[] = [];
        
        // Sección: KPIs
        if (kpiData.length > 0) {
          const kpiTableData = kpiData.map(kpi => ({
            'Métrica': kpi.title,
            'Valor': kpi.value,
            'Cambio (%)': `${kpi.change >= 0 ? '+' : ''}${kpi.change.toFixed(1)}%`,
            'Benchmark': `${kpi.benchmark}%`,
            'Tendencia': kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'
          }));
          sections.push(`
            <h2>KPIs</h2>
            ${tableToHTML(kpiTableData, ['Métrica', 'Valor', 'Cambio (%)', 'Benchmark', 'Tendencia'], ['Métrica', 'Valor', 'Cambio (%)', 'Benchmark', 'Tendencia'])}
          `);
        }
        
        // Sección: Datos de Entrega
        if (deliveryData.length > 0) {
          sections.push(`
            <h2>Datos de Entrega</h2>
            ${tableToHTML(deliveryData, ['date', 'push', 'sms', 'email', 'total'], ['Fecha', 'Push', 'SMS', 'Email', 'Total'])}
          `);
        }
        
        // Sección: Embudo de Campaña
        if (funnelData.length > 0) {
          const funnelTableData = funnelData.map(f => ({
            'Etapa': f.stage,
            'Valor': f.value,
            'Porcentaje (%)': `${f.percentage.toFixed(1)}%`
          }));
          sections.push(`
            <h2>Embudo de Campaña</h2>
            ${tableToHTML(funnelTableData, ['Etapa', 'Valor', 'Porcentaje (%)'], ['Etapa', 'Valor', 'Porcentaje (%)'])}
          `);
        }
        
        // Sección: Respuestas de Encuestas
        if (surveyData.length > 0) {
          const surveyTableData = surveyData.map(s => ({
            'Título': s.surveyTitle,
            'Respondente': s.respondent,
            'Fecha': s.completedAt.toISOString().split('T')[0],
            'Sentimiento': s.sentiment,
            'Rating': s.rating,
            'Feedback': s.feedback
          }));
          sections.push(`
            <h2>Respuestas de Encuestas</h2>
            ${tableToHTML(surveyTableData, ['Título', 'Respondente', 'Fecha', 'Sentimiento', 'Rating', 'Feedback'], ['Título', 'Respondente', 'Fecha', 'Sentimiento', 'Rating', 'Feedback'])}
          `);
        }
        
        // Sección: Análisis de Sentimiento
        if (sentimentData.total > 0) {
          const sentimentTableData = [{
            'Positivo': sentimentData.positive,
            'Negativo': sentimentData.negative,
            'Neutro': sentimentData.neutral,
            'Total': sentimentData.total
          }];
          sections.push(`
            <h2>Análisis de Sentimiento</h2>
            ${tableToHTML(sentimentTableData, ['Positivo', 'Negativo', 'Neutro', 'Total'], ['Positivo', 'Negativo', 'Neutro', 'Total'])}
          `);
        }
        
        if (sections.length === 0) {
          alert('No hay datos para exportar');
          return;
        }
        
        const content = sections.join('<br/><br/>');
        exportToPDF('Análisis de Comunicación', content, filename);
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

  return (
    <>
      <Helmet>
        <title>Análisis de Comunicación - Conect@t Analytics Dashboard</title>
        <meta name="description" content="Dashboard de análisis de comunicación para seguimiento de campañas, notificaciones y engagement de clientes en tiempo real" />
        <meta name="keywords" content="análisis comunicación, campañas marketing, notificaciones push, engagement clientes, métricas comunicación" />
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Análisis de Comunicación
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Seguimiento de campañas, notificaciones y efectividad de comunicación con clientes
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${loading ? 'bg-warning animate-pulse' : 'bg-success'}`}></div>
                  <span>
                    {loading ? 'Cargando...' : 
                     `Actualizado hace ${Math.floor((Date.now() - lastUpdated.getTime()) / 60000)} minuto(s)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <FilterControls
              filters={filters}
              onFiltersChange={setFilters}
            />

            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
                <p className="font-medium">Error al cargar datos</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && !error && (
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <p className="text-muted-foreground">Cargando datos...</p>
              </div>
            )}

            {/* KPI Cards */}
            {!loading && <KPICards kpiData={kpiData} />}

            {/* Main Content Grid */}
            {!loading && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Charts */}
                <div className="lg:col-span-9 space-y-6">
                  {/* Delivery Trends Chart - Solo mostrar si hay datos */}
                  {deliveryData.length > 0 && (
                    <DeliveryChart data={deliveryData} />
                  )}
                </div>

                {/* Right Column - Side Panels */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Campaign Funnel */}
                  {funnelData.length > 0 && <CampaignFunnel data={funnelData} />}
                </div>
              </div>
            )}

            {/* Bottom Row */}
            {!loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Survey Responses - Solo mostrar si hay datos */}
                {surveyData.length > 0 && (
                  <SurveyResponses responses={surveyData} />
                )}
                
                {/* Sentiment Analysis - Solo mostrar si hay datos */}
                {sentimentData.total > 0 && (
                  <SentimentTrending data={sentimentData} />
                )}
              </div>
            )}

            {/* Survey Analytics Section */}
            {!loading && surveyIds.length > 0 && (
              <div className="mt-6">
                <SurveyAnalytics 
                  surveyIds={surveyIds} 
                  surveyTitles={surveyTitles}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default CommunicationAnalytics;