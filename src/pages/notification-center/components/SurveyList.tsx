import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { Survey } from '../types';
import { format } from 'date-fns';

interface SurveyListProps {
  surveys: Survey[];
  onEdit?: (survey: Survey) => void;
  onDelete?: (id: string) => void;
  onView?: (survey: Survey) => void;
  onActivate?: (id: string) => void;
  onPause?: (id: string) => void;
}

const SurveyList: React.FC<SurveyListProps> = ({
  surveys,
  onEdit,
  onDelete,
  onView,
  onActivate,
  onPause
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const getStatusColor = (status: Survey['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'paused':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'draft':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredSurveys = surveys.filter(survey => {
    return selectedStatus === 'all' || survey.status === selectedStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'active', label: 'Activa' },
    { value: 'paused', label: 'Pausada' },
    { value: 'completed', label: 'Completada' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Icon name="FileText" size={24} />
            Encuestas
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredSurveys.length} de {surveys.length}
          </span>
        </div>

        <select
          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-border">
        {filteredSurveys.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="Inbox" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay encuestas que mostrar</p>
          </div>
        ) : (
          filteredSurveys.map((survey) => (
            <div key={survey.id} className="p-6 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <Icon name="FileText" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{survey.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {survey.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="HelpCircle" size={14} />
                      {survey.questions.length} preguntas
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Users" size={14} />
                      {survey.recipients.length} destinatarios
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="CheckCircle" size={14} />
                      {survey.responsesCount} respuestas
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="TrendingUp" size={14} />
                      {survey.completionRate.toFixed(1)}% completado
                    </span>
                    {survey.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" size={14} />
                        Inicio: {format(new Date(survey.scheduledAt), "dd MMM yyyy")}
                      </span>
                    )}
                    {survey.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        Expira: {format(new Date(survey.expiresAt), "dd MMM yyyy")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(survey.status)}`}>
                      {survey.status === 'draft' && 'Borrador'}
                      {survey.status === 'active' && 'Activa'}
                      {survey.status === 'paused' && 'Pausada'}
                      {survey.status === 'completed' && 'Completada'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(survey)}
                      iconName="Eye"
                      title="Ver detalles"
                    />
                  )}
                  {survey.status === 'active' && onPause && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPause(survey.id)}
                      iconName="Pause"
                      title="Pausar"
                    />
                  )}
                  {survey.status === 'paused' && onActivate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onActivate(survey.id)}
                      iconName="Play"
                      title="Activar"
                    />
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(survey)}
                      iconName="Edit"
                      title="Editar"
                    />
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(survey.id)}
                      iconName="Trash2"
                      className="text-destructive hover:text-destructive"
                      title="Eliminar"
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SurveyList;

