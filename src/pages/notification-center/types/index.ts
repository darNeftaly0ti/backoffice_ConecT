// Tipos para notificaciones push nativas de la app móvil
export type NotificationPriority = 'low' | 'medium' | 'high';
export type NotificationStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  recipients: string[]; // IDs de usuarios o segmentos
  recipientType: 'all' | 'segment' | 'specific';
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  createdBy: string;
  metadata?: {
    imageUrl?: string;
    actionUrl?: string;
    deepLink?: string;
    sound?: string;
  };
}

// Tipos para encuestas
export type QuestionType = 'multiple-choice' | 'single-choice' | 'text' | 'rating' | 'yes-no';
export type SurveyStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  options?: string[]; // Para multiple-choice y single-choice
  minRating?: number;
  maxRating?: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  questions: Question[];
  recipients: string[]; // IDs de usuarios o segmentos
  recipientType: 'all' | 'segment' | 'specific';
  scheduledAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
  responsesCount: number;
  completionRate: number;
}

// Tipos para destinatarios
export interface UserSegment {
  id: string;
  name: string;
  description: string;
  userCount: number;
}

export interface RecipientOption {
  id: string;
  label: string;
  type: 'user' | 'segment';
  count?: number;
}

