# Sistema de Notificaciones por Rol

## Descripción General

El sistema de notificaciones implementa un filtrado basado en roles que permite controlar qué usuarios pueden ver cada tipo de notificación.

## Campo `targetRoles`

Cada notificación puede tener un campo opcional `targetRoles` que especifica qué roles pueden verla:

- **Si `targetRoles` está vacío/null/undefined**: La notificación es visible para TODOS los roles
- **Si `targetRoles` tiene valores**: Solo los usuarios con esos roles específicos pueden ver la notificación

## Tipos de Notificaciones por Rol

### 1. Notificaciones de Nueva Reserva (Admin)
**Función:** `notifyAdminNewBooking()`
**Roles permitidos:** `['super_admin', 'admin']`
**Descripción:** Notificaciones cuando un cliente crea una nueva reserva
**Ejemplo:** "🔔 Nueva reserva recibida - Juan Pérez ha creado una reserva..."

### 2. Notificaciones de Actualización de Reserva
**Función:** `notifyAdminBookingUpdate()`
**Roles permitidos:** `['super_admin', 'admin', 'manager']`
**Descripción:** Notificaciones cuando un admin actualiza una reserva
**Ejemplo:** "✅ Reserva actualizada - Has actualizado la reserva..."

### 3. Notificaciones de Cliente
**Función:** `notifyNewBooking()`, `notifyBookingConfirmed()`, etc.
**Roles permitidos:** Sin restricción (todos los roles)
**Descripción:** Notificaciones para clientes sobre sus propias reservas

### 4. Notificaciones del Sistema
**Función:** `notifySystem()`
**Roles permitidos:** Configurable según necesidad
**Descripción:** Notificaciones genéricas del sistema

## Cómo Funciona el Filtrado

### En la API (`/api/notifications`)

```typescript
const query = { 
  userId: session.user.id,
  $or: [
    { targetRoles: { $exists: false } },  // Sin restricción
    { targetRoles: null },                 // Sin restricción
    { targetRoles: [] },                   // Sin restricción
    { targetRoles: userRole }              // Incluye el rol del usuario
  ]
}
```

### En el Modelo (Notification.ts)

```typescript
targetRoles: {
  type: [String],
  default: undefined,
  index: true
}
```

## Ejemplos de Uso

### Crear notificación solo para admins:

```typescript
await createNotification({
  userId: adminId,
  type: NotificationType.BOOKING,
  priority: NotificationPriority.HIGH,
  title: 'Nueva reserva',
  message: 'Se ha creado una nueva reserva',
  targetRoles: ['super_admin', 'admin']
})
```

### Crear notificación para todos:

```typescript
await createNotification({
  userId: userId,
  type: NotificationType.INFO,
  priority: NotificationPriority.MEDIUM,
  title: 'Actualización del sistema',
  message: 'El sistema se actualizará esta noche',
  // targetRoles no especificado = visible para todos
})
```

### Crear notificación para managers y agents:

```typescript
await createNotification({
  userId: userId,
  type: NotificationType.SYSTEM,
  priority: NotificationPriority.MEDIUM,
  title: 'Nuevo reporte disponible',
  message: 'El reporte mensual está listo',
  targetRoles: ['manager', 'agent']
})
```

## Roles Disponibles

- `super_admin`: Acceso total al sistema
- `admin`: Administrador con permisos elevados
- `manager`: Gerente con permisos de gestión
- `agent`: Agente de ventas
- `viewer`: Solo lectura

## Componente Bell

El componente `NotificationCenter` (bell/campana) es **visible para TODOS los usuarios autenticados**, pero cada usuario solo ve las notificaciones que le corresponden según:

1. Su `userId` (destinatario)
2. Su `role` (filtrado por `targetRoles`)

## Migración de Notificaciones Existentes

Las notificaciones existentes sin `targetRoles` seguirán siendo visibles para todos los usuarios (comportamiento por defecto).

## Mejores Prácticas

1. **Especificar `targetRoles` para notificaciones administrativas**: Siempre define roles para notificaciones que solo deben ver ciertos usuarios
2. **Omitir `targetRoles` para notificaciones generales**: Si la notificación es para todos, no especifiques el campo
3. **Usar arrays de roles**: Puedes especificar múltiples roles: `['admin', 'manager', 'agent']`
4. **Documentar nuevos tipos**: Si creas nuevos tipos de notificaciones, documenta qué roles deben verlas

## Extensión Futura

Para agregar más granularidad, se puede implementar:

- Notificaciones por departamento
- Notificaciones por equipo
- Notificaciones por ubicación geográfica
- Permisos personalizados por usuario (override de rol)
