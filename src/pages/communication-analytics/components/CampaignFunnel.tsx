import React from 'react';
import { CampaignFunnelData } from '../types';

interface CampaignFunnelProps {
  data: CampaignFunnelData[];
}

const CampaignFunnel: React.FC<CampaignFunnelProps> = ({ data }) => {
  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Campaign Effectiveness Funnel
        </h3>
        <p className="text-sm text-muted-foreground">
          User journey from delivery to conversion
        </p>
      </div>
      
      <div className="space-y-4">
        {data.map((stage, index) => (
          <div key={stage.stage} className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {stage.stage}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {stage.percentage}%
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {stage.value.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out rounded-lg"
                style={{
                  width: `${stage.percentage}%`,
                  backgroundColor: stage.color
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white mix-blend-difference">
                  {stage.percentage}%
                </span>
              </div>
            </div>
            
            {index < data.length - 1 && (
              <div className="flex justify-center mt-2">
                <div className="w-px h-4 bg-border"></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Overall Conversion Rate
          </span>
          <span className="text-lg font-bold text-primary">
            {data.length > 0 ? data[data.length - 1].percentage : 0}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          From initial delivery to final conversion
        </p>
      </div>
    </div>
  );
};

export default CampaignFunnel;