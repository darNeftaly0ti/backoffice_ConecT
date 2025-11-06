import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { Survey, Question, QuestionType } from '../types';
import notificationService, { CreateAlertRequest, BackendSurveyQuestion } from '../../../services/notification.service';
import userService from '../../../services/user.service';
import { MobileAppUser } from '../../user-management/types';

interface CreateSurveyFormProps {
  onSubmit: (survey: Partial<Survey>) => void;
  onCancel: () => void;
  initialData?: Partial<Survey>;
}

const CreateSurveyForm: React.FC<CreateSurveyFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState<Partial<Survey>>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    recipientType: initialData?.recipientType || 'specific',
    recipients: initialData?.recipients || [],
    questions: initialData?.questions || [],
    scheduledAt: initialData?.scheduledAt,
    expiresAt: initialData?.expiresAt,
    status: 'draft'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<MobileAppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const questionTypeOptions = [
    { value: 'single-choice', label: 'Opción única' },
    { value: 'multiple-choice', label: 'Opción múltiple' },
    { value: 'text', label: 'Texto libre' },
    { value: 'rating', label: 'Calificación' },
    { value: 'yes-no', label: 'Sí/No' }
  ];

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersList = await userService.getUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setErrors(prev => ({ ...prev, users: 'Error al cargar usuarios' }));
    } finally {
      setLoadingUsers(false);
    }
  };

  const recipientTypeOptions = [
    { value: 'all', label: 'Todos los usuarios' },
    { value: 'specific', label: 'Usuarios específicos' }
    // Nota: El backend requiere un user_id específico, por lo que "all" enviará a todos los usuarios obtenidos de la API
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.questions || formData.questions.length === 0) {
      newErrors.questions = 'Debe agregar al menos una pregunta';
    }

    // Validar que todas las preguntas tengan texto
    formData.questions?.forEach((q, index) => {
      if (!q.question?.trim()) {
        newErrors[`question_${index}`] = `La pregunta ${index + 1} debe tener texto`;
      }
      if ((q.type === 'single-choice' || q.type === 'multiple-choice') && (!q.options || q.options.length < 2)) {
        newErrors[`question_${index}_options`] = `La pregunta ${index + 1} debe tener al menos 2 opciones`;
      }
    });

    if (formData.recipientType === 'specific' && 
        (!selectedUserIds || selectedUserIds.length === 0) && 
        (!formData.recipients || formData.recipients.length === 0)) {
      newErrors.recipients = 'Debe seleccionar al menos un usuario o ingresar IDs manualmente';
    }
    
    // Si es "all", no necesitamos validar usuarios específicos

    if (formData.title && formData.title.length > 200) {
      newErrors.title = 'El título no debe exceder 200 caracteres';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'La descripción no debe exceder 1000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let allUserIds: string[] = [];
      
      // Si es "all", no necesitamos obtener usuarios ya que el backend lo hará con send_to_all
      // Solo obtenemos usuarios si es "specific" para la validación
      if (formData.recipientType === 'all') {
        // No necesitamos obtener usuarios, el backend los obtendrá automáticamente
        // send_to_all solo envía a usuarios con account_status: "ACTIVE"
        allUserIds = []; // Vacío porque usaremos send_to_all
      } else {
        // Combinar usuarios seleccionados con IDs ingresados manualmente
        allUserIds = [...new Set([...selectedUserIds, ...(formData.recipients || [])])];
        
        if (allUserIds.length === 0) {
          throw new Error('Debe seleccionar al menos un usuario o ingresar IDs manualmente');
        }
      }

      // Mapear preguntas al formato del backend
      const backendQuestions: BackendSurveyQuestion[] = (formData.questions || []).map(q => {
        const backendType = notificationService.mapQuestionTypeToBackend(q.type);
        const question: BackendSurveyQuestion = {
          question: q.question || '',
          type: backendType,
          required: q.required || false
        };

        // Agregar opciones para tipos de selección
        if (backendType === 'multiple_choice' || backendType === 'single_choice') {
          question.options = q.options || [];
        }

        // Agregar rangos para rating
        if (backendType === 'rating') {
          question.minRating = q.minRating || 1;
          question.maxRating = q.maxRating || 5;
        }

        return question;
      });

      // Mapear los datos de la encuesta al formato del backend
      const baseAlertData: Omit<CreateAlertRequest, 'user_id' | 'user_ids' | 'send_to_all'> = {
        type: 'survey',
        title: formData.title || '',
        message: formData.description || '',
        priority: 'medium',
        icon: 'survey',
        color: '#4CAF50',
        action_button: {
          text: 'Responder encuesta',
          url: `/survey/${formData.title?.toLowerCase().replace(/\s+/g, '-') || 'survey'}`
        },
        expires_at: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        metadata: {
          source: 'web',
          created_by: 'current-user', // TODO: Obtener del contexto de autenticación
          tags: ['survey', 'feedback']
        },
        data: {
          survey_id: `survey_${Date.now()}`,
          survey_questions: backendQuestions,
          survey_expires_at: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined
        }
      };

      // Determinar qué opción de destinatario usar según el tipo seleccionado
      let alertData: CreateAlertRequest;
      
      if (formData.recipientType === 'all') {
        // Usar send_to_all para todos los usuarios activos
        alertData = {
          ...baseAlertData,
          send_to_all: true
        };
      } else if (allUserIds.length === 1) {
        // Un solo usuario: usar user_id
        alertData = {
          ...baseAlertData,
          user_id: allUserIds[0]
        };
      } else {
        // Múltiples usuarios: usar user_ids
        alertData = {
          ...baseAlertData,
          user_ids: allUserIds
        };
      }

      // Crear encuesta/s (una sola llamada para todos los casos)
      const response = await notificationService.createAlert(alertData);
      
      // Mostrar mensaje de éxito
      console.log(`Encuestas creadas: ${response.total_created} usuario(s)`);

      // Llamar al callback del componente padre
      onSubmit({
        ...formData,
        createdAt: new Date(),
        createdBy: 'current-user',
        responsesCount: 0,
        completionRate: 0
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear encuesta';
      setErrors(prev => ({ ...prev, submit: errorMessage }));
      console.error('Error al crear encuesta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: 'single-choice',
      question: '',
      required: false,
      options: ['Opción 1', 'Opción 2']
    };
    setFormData(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions?.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions?.filter(q => q.id !== questionId)
    }));
  };

  const addOption = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions?.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [...(q.options || []), `Opción ${(q.options?.length || 0) + 1}`]
          };
        }
        return q;
      })
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions?.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options?.filter((_, idx) => idx !== optionIndex)
          };
        }
        return q;
      })
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        {/* Información básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="FileText" size={20} />
            Información Básica
          </h3>

          <Input
            label="Título de la encuesta"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Ej: Encuesta de satisfacción"
            required
            error={errors.title}
          />

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Descripción
              <span className="text-destructive ml-1">*</span>
            </label>
            <textarea
              className={`flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.description ? 'border-destructive' : ''
              }`}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe el propósito de esta encuesta..."
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Preguntas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Icon name="HelpCircle" size={20} />
              Preguntas
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addQuestion}
              iconName="Plus"
            >
              Agregar Pregunta
            </Button>
          </div>

          {errors.questions && (
            <p className="text-sm text-destructive">{errors.questions}</p>
          )}

          <div className="space-y-4">
            {formData.questions?.map((question, index) => (
              <div key={question.id} className="bg-muted/30 rounded-lg p-4 space-y-4 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Pregunta {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(question.id)}
                    iconName="Trash2"
                    className="text-destructive hover:text-destructive"
                  />
                </div>

                <Select
                  options={questionTypeOptions}
                  value={question.type}
                  onChange={(value) => updateQuestion(question.id, 'type', value as QuestionType)}
                  label="Tipo de pregunta"
                />

                <Input
                  label="Pregunta"
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                  placeholder="Escribe tu pregunta aquí..."
                  required
                />

                {(question.type === 'multiple-choice' || question.type === 'single-choice') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Opciones</label>
                    {question.options?.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(question.options || [])];
                            newOptions[optIndex] = e.target.value;
                            updateQuestion(question.id, 'options', newOptions);
                          }}
                          placeholder={`Opción ${optIndex + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(question.id, optIndex)}
                          iconName="X"
                          className="text-destructive"
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(question.id)}
                      iconName="Plus"
                    >
                      Agregar Opción
                    </Button>
                  </div>
                )}

                {question.type === 'rating' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Calificación mínima"
                      type="number"
                      value={question.minRating || 1}
                      onChange={(e) => updateQuestion(question.id, 'minRating', parseInt(e.target.value))}
                    />
                    <Input
                      label="Calificación máxima"
                      type="number"
                      value={question.maxRating || 5}
                      onChange={(e) => updateQuestion(question.id, 'maxRating', parseInt(e.target.value))}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`required-${question.id}`}
                    className="h-4 w-4 rounded border border-input"
                    checked={question.required}
                    onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                  />
                  <label htmlFor={`required-${question.id}`} className="text-sm text-foreground cursor-pointer">
                    Pregunta obligatoria
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Destinatarios */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="Users" size={20} />
            Destinatarios
          </h3>

          <Select
            options={recipientTypeOptions}
            value={formData.recipientType}
            onChange={(value) => {
              // Actualizar el estado directamente
              setFormData(prev => ({
                ...prev,
                recipientType: value as 'all' | 'specific'
              }));
              // Limpiar selección de usuarios cuando cambia el tipo
              if (value === 'all') {
                setSelectedUserIds([]);
                setFormData(prev => ({
                  ...prev,
                  recipients: []
                }));
              }
            }}
            placeholder="Tipo de destinatarios"
            label="Enviar a"
            required
          />

          {formData.recipientType === 'all' && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Icon name="Users" size={24} className="text-primary" />
                <div>
                  <p className="font-medium text-foreground">Enviar a todos los usuarios activos</p>
                  <p className="text-sm text-muted-foreground">
                    La encuesta se enviará a todos los usuarios con estado ACTIVO en el sistema
                    {users.length > 0 && ` (${users.length} usuarios encontrados en la lista)`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nota: Solo se enviará a usuarios con account_status: "ACTIVE"
                  </p>
                </div>
              </div>
            </div>
          )}

          {formData.recipientType === 'specific' && (
            <div className="space-y-3">
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
              ) : (
                <>
                  <div className="max-h-60 overflow-y-auto border border-input rounded-lg p-3 space-y-2 bg-background">
                    {users.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay usuarios disponibles
                      </p>
                    ) : (
                      users.map((user) => (
                        <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border border-input"
                            checked={selectedUserIds.includes(user.id || '')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds([...selectedUserIds, user.id || '']);
                              } else {
                                setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <span className="text-sm text-foreground font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({user.email})
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ID: {user.id?.substring(0, 8)}...
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedUserIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedUserIds.length} usuario(s) seleccionado(s)
                    </p>
                  )}
                  {errors.recipients && (
                    <p className="text-sm text-destructive">{errors.recipients}</p>
                  )}
                  <Input
                    label="O ingresar IDs manualmente (separados por comas)"
                    value={formData.recipients?.join(', ') || ''}
                    onChange={(e) => {
                      const ids = e.target.value.split(',').map(id => id.trim()).filter(Boolean);
                      handleChange('recipients', ids);
                      // También actualizar selectedUserIds si los IDs son válidos
                      const validIds = ids.filter(id => users.some(u => u.id === id));
                      if (validIds.length > 0) {
                        setSelectedUserIds([...new Set([...selectedUserIds, ...validIds])]);
                      }
                    }}
                    placeholder="Ej: 6907cff1f33982c5d9b3c992, 6907cff1f33982c5d9b3c993"
                    description="Ingresa los IDs de los usuarios separados por comas"
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Programación */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="Calendar" size={20} />
            Programación
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Fecha de inicio"
              value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleChange('scheduledAt', new Date(e.target.value))}
              description="Cuándo se enviará la encuesta"
            />

            <Input
              type="datetime-local"
              label="Fecha de expiración"
              value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleChange('expiresAt', new Date(e.target.value))}
              description="Cuándo dejará de estar disponible"
            />
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          iconName="X"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          iconName="Save"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Encuesta'}
        </Button>
      </div>
    </form>
  );
};

export default CreateSurveyForm;

