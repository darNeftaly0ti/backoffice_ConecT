import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import UserJourneyChart from './UserJourneyChart';
import FeatureHeatmap from './FeatureHeatmap';
import SessionTimeline from './SessionTimeline';
import TopActions from './TopActions';
import { TabData, UserJourneyStep, FeatureUsage, SessionData } from '../types';

interface AnalyticsTabsProps {
  journeyData: UserJourneyStep[];
  featureData: FeatureUsage[];
  sessionData: SessionData[];
}

const AnalyticsTabs: React.FC<AnalyticsTabsProps> = ({
  journeyData,
  featureData,
  sessionData
}) => {
  const [activeTab, setActiveTab] = useState('journey');

  const tabs: TabData[] = [
    {
      id: 'journey',
      label: 'Embudo de Usuario',
      icon: 'GitBranch',
      count: journeyData.length
    },
    {
      id: 'top-actions',
      label: 'Top Acciones',
      icon: 'Award',
      count: Math.min(10, featureData.length)
    },
    {
      id: 'features',
      label: 'Mapa de Funciones',
      icon: 'Grid3X3',
      count: featureData.length
    },
    {
      id: 'sessions',
      label: 'Línea de Tiempo',
      icon: 'Clock',
      count: sessionData.length
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'journey':
        return <UserJourneyChart data={journeyData} />;
      case 'top-actions':
        return <TopActions data={featureData} />;
      case 'features':
        return <FeatureHeatmap data={featureData} />;
      case 'sessions':
        return <SessionTimeline data={sessionData} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Tab Headers */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }
              `}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
              {tab.count && (
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AnalyticsTabs;