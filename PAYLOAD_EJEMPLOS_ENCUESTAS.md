# Payload de Encuestas - Ejemplos Completos

## Respuesta a tus preguntas:

✅ **SÍ, desde la web puedes crear encuestas con múltiples tipos de preguntas mezcladas**

El formulario web permite agregar múltiples preguntas de diferentes tipos en una misma encuesta. Cada pregunta se mapea correctamente al formato del backend.

---

## Estructura del Payload que Recibe la App

Cuando la app recibe una notificación de tipo "survey", el payload tiene la siguiente estructura:

### Estructura General del Alert (Notification)

```json
{
  "id": "alert_id_123",
  "_id": "alert_id_123",
  "user_id": "user_id_456",
  "type": "survey",
  "title": "Encuesta de satisfacción",
  "message": "Ayúdanos a mejorar nuestro servicio respondiendo esta breve encuesta",
  "priority": "medium",
  "created_at": "2025-01-15T10:30:00.000Z",
  "expires_at": "2025-01-30T23:59:59.000Z",
  "data": {
    "survey_id": "survey_1705320600000",
    "survey_questions": [
      // Array de preguntas aquí
    ],
    "survey_expires_at": "2025-01-30T23:59:59.000Z"
  },
  "icon": "survey",
  "color": "#4CAF50",
  "action_button": {
    "text": "Responder encuesta",
    "url": "/survey/encuesta-de-satisfaccion"
  },
  "metadata": {
    "source": "web",
    "created_by": "current-user",
    "tags": ["survey", "feedback"]
  }
}
```

---

## Ejemplos de Payload por Tipo de Pregunta

### 1. Encuesta con SOLO Preguntas de Opción Única (single-choice)

```json
{
  "type": "survey",
  "title": "¿Cuál es tu color favorito?",
  "message": "Selecciona tu color favorito",
  "priority": "medium",
  "data": {
    "survey_id": "survey_123",
    "survey_questions": [
      {
        "question": "¿Cuál es tu color favorito?",
        "type": "single_choice",
        "required": true,
        "options": ["Rojo", "Azul", "Verde", "Amarillo"]
      },
      {
        "question": "¿Qué género de música prefieres?",
        "type": "single_choice",
        "required": false,
        "options": ["Rock", "Pop", "Jazz", "Clásica"]
      }
    ]
  }
}
```

### 2. Encuesta con SOLO Preguntas de Opción Múltiple (multiple-choice)

```json
{
  "type": "survey",
  "title": "Preferencias de entretenimiento",
  "message": "Selecciona todas las opciones que te gusten",
  "priority": "medium",
  "data": {
    "survey_id": "survey_456",
    "survey_questions": [
      {
        "question": "¿Qué plataformas de streaming usas?",
        "type": "multiple_choice",
        "required": true,
        "options": ["Netflix", "Disney+", "Amazon Prime", "HBO Max"]
      },
      {
        "question": "¿Qué dispositivos usas para ver contenido?",
        "type": "multiple_choice",
        "required": false,
        "options": ["TV", "Tablet", "Smartphone", "Laptop"]
      }
    ]
  }
}
```

### 3. Encuesta con SOLO Preguntas de Texto Libre (text)

```json
{
  "type": "survey",
  "title": "Feedback abierto",
  "message": "Comparte tus comentarios",
  "priority": "medium",
  "data": {
    "survey_id": "survey_789",
    "survey_questions": [
      {
        "question": "¿Qué te gusta de nuestra app?",
        "type": "text",
        "required": true
      },
      {
        "question": "¿Qué mejoras sugerirías?",
        "type": "text",
        "required": false
      }
    ]
  }
}
```

### 4. Encuesta con SOLO Preguntas de Calificación (rating)

```json
{
  "type": "survey",
  "title": "Calificación de servicio",
  "message": "Califica nuestro servicio",
  "priority": "medium",
  "data": {
    "survey_id": "survey_101",
    "survey_questions": [
      {
        "question": "¿Cómo calificarías nuestro servicio?",
        "type": "rating",
        "required": true,
        "minRating": 1,
        "maxRating": 5
      },
      {
        "question": "¿Qué tan satisfecho estás?",
        "type": "rating",
        "required": false,
        "minRating": 1,
        "maxRating": 10
      }
    ]
  }
}
```

### 5. Encuesta con SOLO Preguntas Sí/No (yes_no)

```json
{
  "type": "survey",
  "title": "Encuesta rápida",
  "message": "Responde con sí o no",
  "priority": "medium",
  "data": {
    "survey_id": "survey_202",
    "survey_questions": [
      {
        "question": "¿Te gusta nuestra app?",
        "type": "yes_no",
        "required": true
      },
      {
        "question": "¿Recomendarías nuestra app?",
        "type": "yes_no",
        "required": false
      }
    ]
  }
}
```

---

## Ejemplo Completo: Encuesta con TODOS los Tipos Mezclados

Este es el caso más complejo que tu app debe poder manejar:

```json
{
  "type": "survey",
  "title": "Encuesta completa de satisfacción",
  "message": "Ayúdanos a mejorar respondiendo todas las preguntas",
  "priority": "medium",
  "data": {
    "survey_id": "survey_1705320600000",
    "survey_questions": [
      {
        "question": "¿Cómo calificarías nuestro servicio?",
        "type": "rating",
        "required": true,
        "minRating": 1,
        "maxRating": 5
      },
      {
        "question": "¿Qué plataforma prefieres?",
        "type": "single_choice",
        "required": true,
        "options": ["Android", "iOS", "Web"]
      },
      {
        "question": "¿Qué funcionalidades usas más?",
        "type": "multiple_choice",
        "required": false,
        "options": ["Notificaciones", "Encuestas", "Chat", "Perfil"]
      },
      {
        "question": "¿Te gusta nuestra app?",
        "type": "yes_no",
        "required": true
      },
      {
        "question": "Comparte tus comentarios adicionales",
        "type": "text",
        "required": false
      },
      {
        "question": "¿Qué tan rápido es el servicio?",
        "type": "rating",
        "required": false,
        "minRating": 1,
        "maxRating": 10
      }
    ],
    "survey_expires_at": "2025-01-30T23:59:59.000Z"
  },
  "icon": "survey",
  "color": "#4CAF50",
  "action_button": {
    "text": "Responder encuesta",
    "url": "/survey/encuesta-completa-de-satisfaccion"
  },
  "metadata": {
    "source": "web",
    "created_by": "current-user",
    "tags": ["survey", "feedback"]
  }
}
```

---

## Mapeo de Tipos de Preguntas

### Frontend (Web) → Backend (API/App)

| Frontend | Backend |
|----------|---------|
| `single-choice` | `single_choice` |
| `multiple-choice` | `multiple_choice` |
| `text` | `text` |
| `rating` | `rating` |
| `yes-no` | `yes_no` |

---

## Campos por Tipo de Pregunta

### Todos los tipos tienen:
- `question`: string (texto de la pregunta)
- `type`: string (tipo de pregunta)
- `required`: boolean (si es obligatoria)

### Campos adicionales según el tipo:

#### `single_choice` y `multiple_choice`:
- `options`: string[] (array de opciones)

#### `rating`:
- `minRating`: number (valor mínimo, por defecto 1)
- `maxRating`: number (valor máximo, por defecto 5)

#### `text` y `yes_no`:
- No tienen campos adicionales

---

## Notas Importantes para la App

1. **El array `survey_questions` puede contener cualquier combinación de tipos**
2. **Cada pregunta tiene su propio objeto con sus campos específicos**
3. **Algunos campos son opcionales según el tipo**:
   - `options` solo está presente en `single_choice` y `multiple_choice`
   - `minRating` y `maxRating` solo están presentes en `rating`
4. **La app debe validar el tipo antes de acceder a campos específicos**
5. **El orden de las preguntas se mantiene en el array**

---

## Ejemplo de Validación en la App (Pseudocódigo)

```javascript
survey_questions.forEach((question, index) => {
  switch(question.type) {
    case 'single_choice':
      // Renderizar radio buttons con question.options
      break;
    case 'multiple_choice':
      // Renderizar checkboxes con question.options
      break;
    case 'text':
      // Renderizar input de texto
      break;
    case 'rating':
      // Renderizar rating con question.minRating y question.maxRating
      break;
    case 'yes_no':
      // Renderizar botones Sí/No
      break;
  }
});
```

