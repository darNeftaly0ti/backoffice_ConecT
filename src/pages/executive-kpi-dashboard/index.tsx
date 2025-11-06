import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import KPICard from './components/KPICard';
import EngagementChart from './components/EngagementChart';
import GeographicHeatMap from './components/GeographicHeatMap';
import ComparisonTable from './components/ComparisonTable';
import RealTimeStatus from './components/RealTimeStatus';
import {
  KPIMetric,
  ChartDataPoint,
  GeographicData,
  ComparisonMetric,
  ConnectionStatus
} from './types';

const ExecutiveKPIDashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'connected',
    lastUpdate: new Date(),
    nextUpdate: new Date(Date.now() + 5 * 60 * 1000)
  });

  // Mock KPI Data
  const kpiMetrics: KPIMetric[] = [
    {
      id: 'active-users',
      title: 'Usuarios Activos',
      value: '847,293',
      change: 12.5,
      changeType: 'increase',
      icon: 'Users',
      color: 'primary',
      sparklineData: [820000, 825000, 830000, 835000, 840000, 845000, 847293],
      description: 'Usuarios únicos activos en los últimos 30 días'
    },
    {
      id: 'service-utilization',
      title: 'Utilización del Servicio',
      value: '89.2%',
      change: 3.8,
      changeType: 'increase',
      icon: 'Activity',
      color: 'accent',
      sparklineData: [85, 86, 87, 88, 88.5, 89, 89.2],
      description: 'Porcentaje de servicios utilizados vs disponibles'
    },
    {
      id: 'satisfaction-score',
      title: 'Satisfacción del Cliente',
      value: '4.7/5.0',
      change: 2.1,
      changeType: 'increase',
      icon: 'Star',
      color: 'success',
      sparklineData: [4.5, 4.6, 4.6, 4.7, 4.7, 4.7, 4.7],
      description: 'Puntuación promedio de satisfacción basada en encuestas'
    },
    {
      id: 'revenue-impact',
      title: 'Impacto en Ingresos',
      value: '$2.4M COP',
      change: -1.2,
      changeType: 'decrease',
      icon: 'DollarSign',
      color: 'warning',
      sparklineData: [2500000, 2450000, 2420000, 2400000, 2380000, 2390000, 2400000],
      description: 'Correlación entre engagement y utilización de servicios'
    }
  ];

  // Mock Chart Data
  const chartData: ChartDataPoint[] = [
    { date: '01 Nov', userEngagement: 785000, satisfactionScore: 4.5, serviceUtilization: 87 },
    { date: '08 Nov', userEngagement: 798000, satisfactionScore: 4.6, serviceUtilization: 88 },
    { date: '15 Nov', userEngagement: 812000, satisfactionScore: 4.6, serviceUtilization: 88.5 },
    { date: '22 Nov', userEngagement: 825000, satisfactionScore: 4.7, serviceUtilization: 89 },
    { date: '29 Nov', userEngagement: 835000, satisfactionScore: 4.7, serviceUtilization: 89.1 },
    { date: '06 Dic', userEngagement: 842000, satisfactionScore: 4.7, serviceUtilization: 89.2 },
    { date: '13 Dic', userEngagement: 847293, satisfactionScore: 4.7, serviceUtilization: 89.2 }
  ];

  // Mock Geographic Data
  const geographicData: GeographicData[] = [
    {
      region: 'Bogotá D.C.',
      users: 245680,
      percentage: 29.0,
      growth: 15.2,
      coordinates: { lat: 4.7110, lng: -74.0721 }
    },
    {
      region: 'Antioquia',
      users: 186420,
      percentage: 22.0,
      growth: 8.7,
      coordinates: { lat: 6.2442, lng: -75.5812 }
    },
    {
      region: 'Valle del Cauca',
      users: 127850,
      percentage: 15.1,
      growth: 12.3,
      coordinates: { lat: 3.4516, lng: -76.5320 }
    },
    {
      region: 'Atlántico',
      users: 98760,
      percentage: 11.7,
      growth: -2.1,
      coordinates: { lat: 10.9639, lng: -74.7964 }
    },
    {
      region: 'Santander',
      users: 76540,
      percentage: 9.0,
      growth: 6.8,
      coordinates: { lat: 7.1193, lng: -73.1227 }
    },
    {
      region: 'Cundinamarca',
      users: 65890,
      percentage: 7.8,
      growth: 18.5,
      coordinates: { lat: 5.0266, lng: -74.0507 }
    },
    {
      region: 'Otros Departamentos',
      users: 46153,
      percentage: 5.4,
      growth: 4.2,
      coordinates: { lat: 4.5709, lng: -74.2973 }
    }
  ];

  // Mock Comparison Data
  const comparisonData: ComparisonMetric[] = [
    {
      metric: 'Usuarios Activos Diarios',
      current: 847293,
      previous: 753450,
      variance: 12.5,
      varianceType: 'positive',
      unit: 'usuarios'
    },
    {
      metric: 'Sesiones por Usuario',
      current: 4.7,
      previous: 4.2,
      variance: 11.9,
      varianceType: 'positive',
      unit: 'sesiones'
    },
    {
      metric: 'Tiempo Promedio de Sesión',
      current: 8.3,
      previous: 7.9,
      variance: 5.1,
      varianceType: 'positive',
      unit: 'minutos'
    },
    {
      metric: 'Tasa de Retención',
      current: 78.5,
      previous: 82.1,
      variance: -4.4,
      varianceType: 'negative',
      unit: '%'
    },
    {
      metric: 'Funciones Más Utilizadas',
      current: 89.2,
      previous: 85.4,
      variance: 4.5,
      varianceType: 'positive',
      unit: '%'
    },
    {
      metric: 'Soporte Técnico Requerido',
      current: 12.8,
      previous: 15.6,
      variance: -17.9,
      varianceType: 'positive',
      unit: '%'
    },
    {
      metric: 'Notificaciones Entregadas',
      current: 94.7,
      previous: 91.2,
      variance: 3.8,
      varianceType: 'positive',
      unit: '%'
    },
    {
      metric: 'Respuestas a Encuestas',
      current: 23.4,
      previous: 28.9,
      variance: -19.0,
      varianceType: 'negative',
      unit: '%'
    }
  ];

  const handleRefresh = () => {
    setConnectionStatus(prev => ({
      ...prev,
      status: 'reconnecting'
    }));

    setTimeout(() => {
      setConnectionStatus({
        status: 'connected',
        lastUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 5 * 60 * 1000)
      });
    }, 2000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus.status === 'connected') {
        setConnectionStatus(prev => ({
          ...prev,
          lastUpdate: new Date(),
          nextUpdate: new Date(Date.now() + 5 * 60 * 1000)
        }));
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [connectionStatus.status]);

  return (
    <>
      <Helmet>
        <title>Dashboard Ejecutivo KPI - Conect@t Analytics</title>
        <meta name="description" content="Dashboard ejecutivo con KPIs estratégicos y análisis de inteligencia de negocios para Conect@t A&D" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
          <Header
            onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            showMobileMenu={mobileSidebarOpen}
          />

          <main className="p-4 lg:p-6 space-y-6">
            {/* Real-time Status */}
            <RealTimeStatus
              status={connectionStatus}
              onRefresh={handleRefresh}
            />

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {kpiMetrics.map((metric) => (
                <KPICard key={metric.id} metric={metric} />
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Engagement Chart - 8 columns on desktop */}
              <div className="xl:col-span-8">
                <EngagementChart data={chartData} />
              </div>

              {/* Geographic Heat Map - 4 columns on desktop */}
              <div className="xl:col-span-4">
                <GeographicHeatMap data={geographicData} />
              </div>
            </div>

            {/* Comparison Table - Full width */}
            <ComparisonTable data={comparisonData} />
          </main>
        </div>
      </div>
    </>
  );
};

export default ExecutiveKPIDashboard;