import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { PerformanceChart as PerformanceChartType } from '../types';

interface PerformanceChartProps {
  chart: PerformanceChartType;
  height?: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ chart, height = 300 }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showAnomalies, setShowAnomalies] = useState(true);

  const formatXAxisLabel = (tickItem: any) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTooltipLabel = (label: any) => {
    const date = new Date(label);
    return date.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">
            {formatTooltipLabel(label)}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium" style={{ color: chart.color }}>
              {chart.title}: {payload[0].value} {chart.unit}
            </span>
          </p>
          {data.anomaly && (
            <p className="text-xs text-warning mt-1 flex items-center gap-1">
              <Icon name="AlertTriangle" size={12} />
              Anomaly detected
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.anomaly && showAnomalies) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill="#F59E0B"
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{chart.title}</h3>
          <p className="text-sm text-muted-foreground">Real-time monitoring with anomaly detection</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={showAnomalies ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAnomalies(!showAnomalies)}
            iconName="AlertTriangle"
            iconSize={14}
          >
            Anomalies
          </Button>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
              iconName="ZoomOut"
              iconSize={14}
              disabled={zoomLevel <= 0.5}
            />
            <span className="text-xs text-muted-foreground px-2">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
              iconName="ZoomIn"
              iconSize={14}
              disabled={zoomLevel >= 2}
            />
          </div>
        </div>
      </div>

      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chart.data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisLabel}
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `${value}${chart.unit}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {chart.threshold && (
              <ReferenceLine
                y={chart.threshold}
                stroke="#F59E0B"
                strokeDasharray="5 5"
                label={{ value: `Threshold: ${chart.threshold}${chart.unit}`, position: "topRight" }}
              />
            )}
            
            <Line
              type="monotone"
              dataKey="value"
              stroke={chart.color}
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 6, stroke: chart.color, strokeWidth: 2, fill: '#FFFFFF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chart.color }}></div>
            <span>Current Value</span>
          </div>
          {showAnomalies && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span>Anomaly</span>
            </div>
          )}
          {chart.threshold && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-warning"></div>
              <span>Threshold</span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;