import React from 'react';
import Icon from '../../../components/AppIcon';
import { SurveyResponse } from '../types';

interface SurveyResponsesProps {
  responses: SurveyResponse[];
}

const SurveyResponses: React.FC<SurveyResponsesProps> = ({ responses }) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'ThumbsUp';
      case 'negative':
        return 'ThumbsDown';
      default:
        return 'Minus';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-success bg-success/10';
      case 'negative':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted/30';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="Star"
        size={12}
        className={i < rating ? 'text-warning fill-current' : 'text-muted-foreground'}
      />
    ));
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Recent Survey Responses
        </h3>
        <p className="text-sm text-muted-foreground">
          Latest customer feedback and ratings
        </p>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {responses.map((response) => (
          <div
            key={response.id}
            className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground mb-1">
                  {response.surveyTitle}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {response.respondent} • {response.completedAt.toLocaleDateString()}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${getSentimentColor(response.sentiment)}`}>
                <Icon name={getSentimentIcon(response.sentiment)} size={16} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {getRatingStars(response.rating)}
              </div>
              <span className="text-sm font-medium text-foreground">
                {response.rating}/5
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {response.feedback}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{response.demographics.age}</span>
              <span>{response.demographics.location}</span>
              <span>{response.demographics.segment}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-success">
              {responses.filter(r => r.sentiment === 'positive').length}
            </p>
            <p className="text-xs text-muted-foreground">Positive</p>
          </div>
          <div>
            <p className="text-lg font-bold text-muted-foreground">
              {responses.filter(r => r.sentiment === 'neutral').length}
            </p>
            <p className="text-xs text-muted-foreground">Neutral</p>
          </div>
          <div>
            <p className="text-lg font-bold text-error">
              {responses.filter(r => r.sentiment === 'negative').length}
            </p>
            <p className="text-xs text-muted-foreground">Negative</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyResponses;