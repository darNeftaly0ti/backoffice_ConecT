# Propuesta: Endpoint para Usuarios Activos Diarios (DAU)

## 📊 Objetivo
Calcular usuarios activos diarios basándose en los logs de `login` y `logout` del `activity_log`.

## 📋 Datos Necesarios del `activity_log`

### Campos Requeridos:
```javascript
{
  user_id: ObjectId,        // ID del usuario
  action: "login" | "logout", // Tipo de acción
  timestamp: ISODate,       // Fecha y hora del evento
  status: "success" | "failed", // Estado del evento
  created_at: ISODate       // Fecha de creación (backup)
}
```

### Filtros Necesarios:
- `action IN ["login", "logout"]` - Solo acciones de login/logout
- `status = "success"` - Solo logins/logouts exitosos
- `timestamp >= startDate AND timestamp <= endDate` - Rango de fechas

## 🔌 Endpoint Propuesto

### Opción 1: Endpoint Simple (Recomendado)
```
GET /api/users/activity-logs/daily-active-users
```

**Query Parameters:**
- `start_date` (opcional): YYYY-MM-DD - Fecha de inicio
- `end_date` (opcional): YYYY-MM-DD - Fecha de fin
- `group_by` (opcional): "day" | "week" | "month" - Agrupar por período

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuarios activos diarios obtenidos exitosamente",
  "data": [
    {
      "date": "2025-11-01",
      "active_users": 45,
      "new_logins": 12,
      "returning_users": 33,
      "total_logins": 67,
      "total_logouts": 62
    },
    {
      "date": "2025-11-02",
      "active_users": 52,
      "new_logins": 8,
      "returning_users": 44,
      "total_logins": 89,
      "total_logouts": 85
    }
  ],
  "summary": {
    "total_days": 30,
    "average_daily_active_users": 48.5,
    "peak_day": "2025-11-05",
    "peak_active_users": 67
  }
}
```

### Opción 2: Endpoint con Detalles por Usuario
```
GET /api/users/activity-logs/daily-active-users/detailed
```

**Query Parameters:**
- `date` (requerido): YYYY-MM-DD - Fecha específica
- `include_user_details` (opcional): boolean - Incluir detalles de usuarios

**Respuesta:**
```json
{
  "success": true,
  "message": "Detalles de usuarios activos obtenidos exitosamente",
  "date": "2025-11-01",
  "data": {
    "active_users": 45,
    "users": [
      {
        "user_id": "68f850a198afdd6a2a196edd",
        "username": "admin",
        "email": "admin@example.com",
        "first_login": "2025-11-01T08:30:00Z",
        "last_login": "2025-11-01T18:45:00Z",
        "last_logout": "2025-11-01T19:20:00Z",
        "login_count": 3,
        "session_duration_minutes": 125,
        "is_active": true // Último login > último logout
      }
    ]
  }
}
```

## 🧮 Lógica de Cálculo

### Usuario Activo Diario (DAU):
Un usuario se considera **activo en un día** si:
1. **Tiene al menos un login exitoso ese día** (más simple)
   - O si:
2. **Su último login del día es más reciente que su último logout** (sesión activa)
   - Esto indica que el usuario estaba activo al final del día

### Cálculo Recomendado:
```javascript
// Para cada día:
1. Filtrar logs donde action = "login" y status = "success"
2. Agrupar por fecha (día)
3. Contar usuarios únicos (user_id) por día
4. Esto da el número de usuarios activos diarios (DAU)
```

### Métricas Adicionales:
- **New Logins**: Usuarios que hicieron login por primera vez (o después de X días)
- **Returning Users**: Usuarios que ya habían hecho login antes
- **Session Duration**: Diferencia entre último login y último logout del día
- **Peak Hours**: Horas del día con más logins

## 🔧 Implementación Backend (Pseudocódigo)

```javascript
// Endpoint: GET /api/users/activity-logs/daily-active-users
async function getDailyActiveUsers(startDate, endDate) {
  // 1. Obtener logs de login y logout
  const logs = await ActivityLog.find({
    action: { $in: ['login', 'logout'] },
    status: 'success',
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ timestamp: 1 });

  // 2. Agrupar por fecha
  const dailyData = {};
  
  logs.forEach(log => {
    const dateKey = log.timestamp.toISOString().split('T')[0];
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        users: new Set(),
        logins: [],
        logouts: []
      };
    }
    
    if (log.action === 'login') {
      dailyData[dateKey].users.add(log.user_id.toString());
      dailyData[dateKey].logins.push({
        user_id: log.user_id,
        timestamp: log.timestamp
      });
    } else if (log.action === 'logout') {
      dailyData[dateKey].logouts.push({
        user_id: log.user_id,
        timestamp: log.timestamp
      });
    }
  });

  // 3. Calcular métricas por día
  const result = Object.values(dailyData).map(day => {
    const activeUsers = day.users.size;
    const totalLogins = day.logins.length;
    const totalLogouts = day.logouts.length;
    
    // Calcular usuarios nuevos vs recurrentes
    // (requiere verificar si el usuario hizo login antes)
    
    return {
      date: day.date,
      active_users: activeUsers,
      total_logins: totalLogins,
      total_logouts: totalLogouts
    };
  });

  return result;
}
```

## 📈 Consulta MongoDB Optimizada

```javascript
// Agregación optimizada para MongoDB
db.activity_log.aggregate([
  {
    $match: {
      action: { $in: ["login", "logout"] },
      status: "success",
      timestamp: {
        $gte: ISODate("2025-11-01T00:00:00Z"),
        $lte: ISODate("2025-11-30T23:59:59Z")
      }
    }
  },
  {
    $project: {
      date: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$timestamp"
        }
      },
      user_id: 1,
      action: 1,
      timestamp: 1
    }
  },
  {
    $group: {
      _id: {
        date: "$date",
        user_id: "$user_id"
      },
      logins: {
        $sum: { $cond: [{ $eq: ["$action", "login"] }, 1, 0] }
      },
      logouts: {
        $sum: { $cond: [{ $eq: ["$action", "logout"] }, 1, 0] }
      },
      first_login: {
        $min: {
          $cond: [{ $eq: ["$action", "login"] }, "$timestamp", null]
        }
      },
      last_login: {
        $max: {
          $cond: [{ $eq: ["$action", "login"] }, "$timestamp", null]
        }
      },
      last_logout: {
        $max: {
          $cond: [{ $eq: ["$action", "logout"] }, "$timestamp", null]
        }
      }
    }
  },
  {
    $group: {
      _id: "$_id.date",
      active_users: { $sum: 1 },
      total_logins: { $sum: "$logins" },
      total_logouts: { $sum: "$logouts" },
      users: {
        $push: {
          user_id: "$_id.user_id",
          logins: "$logins",
          logouts: "$logouts"
        }
      }
    }
  },
  {
    $sort: { _id: 1 }
  },
  {
    $project: {
      date: "$_id",
      active_users: 1,
      total_logins: 1,
      total_logouts: 1,
      users: 1
    }
  }
])
```

## ✅ Ventajas de este Enfoque

1. **Precisión**: Basado en datos reales de login/logout
2. **Eficiencia**: Puede ser optimizado con índices en MongoDB
3. **Flexibilidad**: Puede calcular diferentes períodos (día, semana, mes)
4. **Métricas Adicionales**: Puede incluir duración de sesión, horas pico, etc.

## 🚀 Implementación en Frontend

Una vez que tengas el endpoint, podrías usarlo así:

```typescript
// En activity-log.service.ts
async getDailyActiveUsers(startDate?: string, endDate?: string): Promise<DailyActiveUsersResponse> {
  const url = ApiConfig.getDailyActiveUsersUrl(startDate, endDate);
  // ... implementación
}
```

## 📝 Notas Importantes

1. **Índices Recomendados en MongoDB:**
   - `{ action: 1, timestamp: 1 }`
   - `{ user_id: 1, timestamp: 1 }`
   - `{ action: 1, status: 1, timestamp: 1 }`

2. **Consideraciones:**
   - Solo contar logins exitosos (`status: "success"`)
   - Manejar casos donde el usuario no tiene logout (sesión aún activa)
   - Considerar timezone al agrupar por día

3. **Optimización:**
   - Cachear resultados para reducir carga en la base de datos
   - Usar agregación de MongoDB en lugar de procesar en Node.js

