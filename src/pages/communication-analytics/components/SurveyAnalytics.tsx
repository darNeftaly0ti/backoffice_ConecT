import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '../../../components/AppIcon';
import { 
  surveyResponseService, 
  SurveyStats,
  DetailedSurveyStats,
  SurveyResponseWithUser 
} from '../../../services/notification.service';

interface SurveyAnalyticsProps {
  surveyIds: string[];
  surveyTitles: { [surveyId: string]: string };
}

interface SurveyAnalyticsData {
  surveyId: string;
  surveyTitle: string;
  stats: SurveyStats;
}

const SurveyAnalytics: React.FC<SurveyAnalyticsProps> = ({ surveyIds, surveyTitles }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<SurveyAnalyticsData[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string | 'all'>('all');
  const [showResponses, setShowResponses] = useState(false);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponseWithUser[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const data: SurveyAnalyticsData[] = [];

        for (const surveyId of surveyIds) {
          try {
            // Intentar obtener estadísticas detalladas primero
            let stats: SurveyStats | DetailedSurveyStats;
            try {
              const detailedStats = await surveyResponseService.getSurveyDetailedStats(surveyId);
              stats = detailedStats;
            } catch (detailedError) {
              // Si falla, intentar con estadísticas básicas
              console.warn(`No se pudieron obtener estadísticas detalladas para ${surveyId}, intentando básicas:`, detailedError);
              stats = await surveyResponseService.getSurveyStats(surveyId);
            }
            
            // Log para debugging
            console.log(`Estadísticas de encuesta ${surveyId}:`, stats);
            data.push({
              surveyId,
              surveyTitle: surveyTitles[surveyId] || surveyId,
              stats
            });
          } catch (err) {
            console.warn(`Error al cargar estadísticas de encuesta ${surveyId}:`, err);
            // Agregar datos básicos aunque falle obtener estadísticas
            // Esto permite mostrar al menos el total de respuestas si está disponible
            data.push({
              surveyId,
              surveyTitle: surveyTitles[surveyId] || surveyId,
              stats: {
                total_responses: 0,
                completion_rate: undefined as number | undefined,
                average_completion_time: undefined,
                responses_by_date: []
              }
            });
          }
        }

        setAnalyticsData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar analíticas';
        setError(errorMessage);
        console.error('Error al cargar analíticas:', err);
      } finally {
        setLoading(false);
      }
    };

    if (surveyIds.length > 0) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [surveyIds, surveyTitles]);

  // Preparar datos para el gráfico de respuestas por fecha
  const prepareResponsesByDateData = () => {
    const dateMap: { [date: string]: number } = {};

    analyticsData.forEach(item => {
      if (item.stats.responses_by_date) {
        // Manejar tanto objeto como array
        if (Array.isArray(item.stats.responses_by_date)) {
          // Si es un array de objetos { date, count }
          item.stats.responses_by_date.forEach((entry: { date: string; count: number }) => {
            if (selectedSurvey === 'all' || selectedSurvey === item.surveyId) {
              const dateKey = entry.date.split('T')[0]; // Solo la fecha sin hora
              dateMap[dateKey] = (dateMap[dateKey] || 0) + entry.count;
            }
          });
        } else {
          // Si es un objeto { [date]: count }
          Object.entries(item.stats.responses_by_date).forEach(([date, count]) => {
            if (selectedSurvey === 'all' || selectedSurvey === item.surveyId) {
              const dateKey = date.split('T')[0]; // Solo la fecha sin hora
              dateMap[dateKey] = (dateMap[dateKey] || 0) + (count as number);
            }
          });
        }
      }
    });

    return Object.entries(dateMap)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        responses: count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Función auxiliar para normalizar completion_rate a decimal (0-1)
  const normalizeCompletionRate = (rate: number): number => {
    // Si el valor es mayor que 1, asumimos que ya está en porcentaje y lo convertimos a decimal
    // Si es menor o igual a 1, asumimos que ya es decimal
    return rate > 1 ? rate / 100 : rate;
  };

  // Calcular métricas agregadas
  const calculateAggregatedMetrics = () => {
    let totalResponses = 0;
    let totalCompletionRate = 0;
    let totalCompletionTime = 0;
    let countWithCompletionRate = 0;
    let countWithCompletionTime = 0;

    analyticsData.forEach(item => {
      if (selectedSurvey === 'all' || selectedSurvey === item.surveyId) {
        totalResponses += item.stats.total_responses || 0;
        
        // Solo contar completion_rate si existe y es mayor a 0
        if (item.stats.completion_rate !== undefined && item.stats.completion_rate !== null) {
          // Normalizar a decimal antes de sumar
          const normalizedRate = normalizeCompletionRate(item.stats.completion_rate);
          totalCompletionRate += normalizedRate;
          countWithCompletionRate++;
        }
        
        // Solo contar completion_time si existe y es mayor a 0
        if (item.stats.average_completion_time !== undefined && 
            item.stats.average_completion_time !== null && 
            item.stats.average_completion_time > 0) {
          totalCompletionTime += item.stats.average_completion_time;
          countWithCompletionTime++;
        }
      }
    });

    return {
      totalResponses,
      averageCompletionRate: countWithCompletionRate > 0 ? totalCompletionRate / countWithCompletionRate : null,
      averageCompletionTime: countWithCompletionTime > 0 ? totalCompletionTime / countWithCompletionTime : null
    };
  };

  const responsesByDateData = prepareResponsesByDateData();
  const aggregatedMetrics = calculateAggregatedMetrics();

  const filteredData = selectedSurvey === 'all' 
    ? analyticsData 
    : analyticsData.filter(item => item.surveyId === selectedSurvey);

  // Cargar respuestas con usuarios cuando se selecciona una encuesta específica o todas
  useEffect(() => {
    const loadSurveyResponses = async () => {
      if (!showResponses) {
        setSurveyResponses([]);
        return;
      }

      try {
        setResponsesLoading(true);
        
        if (selectedSurvey === 'all') {
          // Cargar respuestas de todas las encuestas
          const allResponses: SurveyResponseWithUser[] = [];
          
          for (const surveyId of surveyIds) {
            try {
              const response = await surveyResponseService.getSurveyResponsesWithUsers(surveyId);
              allResponses.push(...(response.surveyResponses || []));
            } catch (err) {
              console.warn(`Error al cargar respuestas de encuesta ${surveyId}:`, err);
            }
          }
          
          setSurveyResponses(allResponses);
        } else {
          // Cargar respuestas de una encuesta específica
          const response = await surveyResponseService.getSurveyResponsesWithUsers(selectedSurvey);
          setSurveyResponses(response.surveyResponses || []);
        }
      } catch (err) {
        console.error('Error al cargar respuestas de usuarios:', err);
        setSurveyResponses([]);
      } finally {
        setResponsesLoading(false);
      }
    };

    loadSurveyResponses();
  }, [selectedSurvey, showResponses, surveyIds]);

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando analíticas de encuestas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="text-center py-8">
          <p className="text-error">Error al cargar analíticas</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (analyticsData.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="text-center py-8">
          <Icon name="FileQuestion" size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay analíticas de encuestas disponibles</p>
          <p className="text-xs text-muted-foreground mt-2">
            Las estadísticas se mostrarán cuando haya respuestas de encuestas disponibles
          </p>
        </div>
      </div>
    );
  }

  // Verificar si hay datos incompletos
  const hasIncompleteData = analyticsData.some(item => 
    item.stats.completion_rate === undefined || 
    item.stats.completion_rate === null ||
    item.stats.average_completion_time === undefined ||
    item.stats.average_completion_time === null
  );

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Analíticas de Respuestas de Encuestas
            </h3>
            <p className="text-sm text-muted-foreground">
              Estadísticas detalladas de respuestas y rendimiento
            </p>
          </div>
          <div className="flex items-center gap-3">
            {surveyIds.length > 1 && (
              <select
                value={selectedSurvey}
                onChange={(e) => {
                  setSelectedSurvey(e.target.value);
                  setShowResponses(false);
                }}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
              >
                <option value="all">Todas las encuestas</option>
                {analyticsData.map(item => (
                  <option key={item.surveyId} value={item.surveyId}>
                    {item.surveyTitle}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowResponses(!showResponses)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Icon name={showResponses ? "EyeOff" : "Eye"} size={16} />
              {showResponses 
                ? 'Ocultar Respuestas' 
                : selectedSurvey === 'all' 
                  ? 'Ver Respuestas de Todas las Encuestas' 
                  : 'Ver Respuestas de Usuarios'}
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje informativo si hay datos incompletos */}
      {hasIncompleteData && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-warning">
            <Icon name="AlertCircle" size={16} className="mt-0.5" />
            <div>
              <p className="font-medium mb-1">Datos limitados disponibles</p>
              <p className="text-xs text-muted-foreground">
                El backend actualmente solo devuelve respuestas totales. Los campos de tasa de finalización, 
                tiempo promedio y respuestas por fecha no están disponibles en la respuesta del API.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="MessageSquare" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Respuestas</p>
              <p className="text-2xl font-bold text-foreground">
                {aggregatedMetrics.totalResponses.toLocaleString()}
              </p>
              {analyticsData.some(item => item.stats.unique_users) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {analyticsData
                    .filter(item => selectedSurvey === 'all' || selectedSurvey === item.surveyId)
                    .reduce((sum, item) => sum + (item.stats.unique_users || 0), 0)
                    .toLocaleString()} usuarios únicos
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <Icon name="CheckCircle" size={20} className="text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tasa de Finalización</p>
              <p className="text-2xl font-bold text-foreground">
                {aggregatedMetrics.averageCompletionRate !== null
                  ? `${(aggregatedMetrics.averageCompletionRate * 100).toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Icon name="Clock" size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-foreground">
                {aggregatedMetrics.averageCompletionTime !== null && aggregatedMetrics.averageCompletionTime > 0
                  ? `${Math.round(aggregatedMetrics.averageCompletionTime)}s`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de respuestas por fecha */}
      {responsesByDateData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-4">
            Respuestas por Fecha
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responsesByDateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-foreground)'
                  }}
                />
                <Bar 
                  dataKey="responses" 
                  fill="var(--color-primary)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla de estadísticas por encuesta */}
      {filteredData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">
            Estadísticas por Encuesta
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Encuesta</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Respuestas</th>
                  {analyticsData.some(item => item.stats.unique_users) && (
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Usuarios Únicos</th>
                  )}
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Tasa Finalización</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Tiempo Promedio</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.surveyId} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-foreground font-medium">
                      {item.surveyTitle}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {item.stats.total_responses?.toLocaleString() || 0}
                    </td>
                    {analyticsData.some(item => item.stats.unique_users) && (
                      <td className="py-3 px-4 text-right text-foreground">
                        {item.stats.unique_users?.toLocaleString() || 0}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right text-foreground">
                      {item.stats.completion_rate !== undefined && item.stats.completion_rate !== null
                        ? (() => {
                            // Normalizar a decimal y luego mostrar como porcentaje
                            const normalizedRate = normalizeCompletionRate(item.stats.completion_rate);
                            // Limitar a máximo 100% para evitar valores absurdos
                            const cappedPercentage = Math.min(normalizedRate * 100, 100);
                            return `${cappedPercentage.toFixed(1)}%`;
                          })()
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {item.stats.average_completion_time !== undefined && 
                       item.stats.average_completion_time !== null && 
                       item.stats.average_completion_time > 0
                        ? `${Math.round(item.stats.average_completion_time)}s`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Información adicional: Fechas de primera y última respuesta */}
      {analyticsData.some(item => item.stats.first_response_date || item.stats.last_response_date) && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-4">
            Información Temporal
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredData.map((item) => (
              <div key={item.surveyId} className="bg-background rounded-lg p-4 border border-border">
                <h5 className="text-sm font-medium text-foreground mb-3">{item.surveyTitle}</h5>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {item.stats.first_response_date && (
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={14} />
                      <span>Primera respuesta: {new Date(item.stats.first_response_date).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}
                  {item.stats.last_response_date && (
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={14} />
                      <span>Última respuesta: {new Date(item.stats.last_response_date).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección de respuestas de usuarios */}
      {showResponses && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-4">
            {selectedSurvey === 'all' 
              ? 'Respuestas Detalladas de Todas las Encuestas' 
              : 'Respuestas Detalladas de Usuarios'}
          </h4>
          
          {responsesLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando respuestas...</p>
            </div>
          ) : surveyResponses.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="FileQuestion" size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay respuestas disponibles para esta encuesta</p>
            </div>
          ) : (
            <div className="space-y-4">
              {surveyResponses.map((response) => {
                // Obtener el título de la encuesta
                const surveyTitle = surveyTitles[response.survey_id] || response.survey_id;
                
                return (
                <div
                  key={response._id || response.id}
                  className="bg-background rounded-lg p-4 border border-border"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {selectedSurvey === 'all' && (
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                            {surveyTitle}
                          </span>
                        </div>
                      )}
                      <h5 className="text-sm font-semibold text-foreground mb-1">
                        {response.user_info?.first_name || response.user_info?.username || 'Usuario'} {' '}
                        {response.user_info?.last_name || ''}
                      </h5>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                        {response.user_info?.email && (
                          <span className="flex items-center gap-1">
                            <Icon name="Mail" size={12} />
                            {response.user_info.email}
                          </span>
                        )}
                        {response.user_info?.phone_number && (
                          <span className="flex items-center gap-1">
                            <Icon name="Phone" size={12} />
                            {response.user_info.phone_number}
                          </span>
                        )}
                        {(response.completed_at || response.created_at) && (
                          <span className="flex items-center gap-1">
                            <Icon name="Calendar" size={12} />
                            {new Date(response.completed_at || response.created_at || '').toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {response.answers && response.answers.length > 0 ? (
                      response.answers.map((answer, index) => (
                        <div
                          key={answer.question_id || index}
                          className="p-3 bg-card rounded-lg border border-border"
                        >
                          <p className="text-sm font-medium text-foreground mb-2">
                            {answer.question || `Pregunta ${index + 1}`}
                          </p>
                          <div className="text-sm text-muted-foreground">
                            {answer.question_type === 'rating' && typeof answer.answer === 'number' ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }, (_, i) => {
                                    const rating = answer.answer as number;
                                    return (
                                      <Icon
                                        key={i}
                                        name="Star"
                                        size={16}
                                        className={i < rating ? 'text-warning fill-current' : 'text-muted-foreground'}
                                      />
                                    );
                                  })}
                                </div>
                                <span className="font-medium text-foreground">{answer.answer}/5</span>
                              </div>
                            ) : answer.question_type === 'yes_no' && typeof answer.answer === 'boolean' ? (
                              <div className="flex items-center gap-2">
                                <Icon 
                                  name={answer.answer ? "CheckCircle" : "XCircle"} 
                                  size={16} 
                                  className={answer.answer ? "text-success" : "text-error"} 
                                />
                                <span className="font-medium text-foreground">
                                  {answer.answer ? 'Sí' : 'No'}
                                </span>
                              </div>
                            ) : Array.isArray(answer.answer) ? (
                              <div className="flex flex-wrap gap-2">
                                {answer.answer.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                                  >
                                    {String(item)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-foreground">{String(answer.answer)}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay respuestas disponibles</p>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveyAnalytics;

