# Sistema de Notificaciones Automáticas - Integración con Reservas

## 🎯 Notificaciones Implementadas

El sistema ahora crea notificaciones automáticas en los siguientes eventos:

### 1. **Nueva Reserva Creada**
**Cuándo**: Al crear una reserva en `/api/bookings/create`

**Para el Cliente** (si está registrado):
- 🎉 Título: "Reserva creada exitosamente"
- Mensaje: Incluye número de reserva, nombre del item y total
- Prioridad: Alta
- Acción: Botón "Ver reserva" que lleva a `/bookings/{id}`
- **Pinned**: Sí (aparece al inicio)

**Para Administradores**:
- 🔔 Título: "Nueva reserva recibida"
- Mensaje: Incluye nombre del cliente, número de reserva y total
- Prioridad: Alta
- Acción: Botón "Revisar reserva" que lleva a `/admin/bookings/{id}`
- **Pinned**: Sí
- **Destinatarios**: Todos los usuarios con rol `admin` o `super_admin` activos

### 2. **Reserva Confirmada**
**Cuándo**: Al cambiar el estado de `pending` → `confirmed` en `/api/bookings/[id]`

**Para el Cliente**:
- ✅ Título: "Reserva confirmada"
- Mensaje: "Tu reserva {número} para {item} ha sido confirmada. ¡Prepárate para tu viaje!"
- Prioridad: Alta
- Acción: Botón "Ver detalles"
- **Pinned**: Sí

### 3. **Reserva Cancelada**
**Cuándo**: Al cambiar el estado a `cancelled` en `/api/bookings/[id]`

**Para el Cliente**:
- ⚠️ Título: "Reserva cancelada"
- Mensaje: Incluye número de reserva, item y motivo (si se proporciona)
- Prioridad: Alta
- Acción: Botón "Ver detalles"
- **Pinned**: Sí

### 4. **Pago Recibido**
**Cuándo**: Al cambiar `paymentStatus` de cualquier estado → `paid` en `/api/bookings/[id]`

**Para el Cliente**:
- 💳 Título: "Pago recibido"
- Mensaje: "Hemos recibido tu pago de {currency} {amount} para la reserva {número}"
- Prioridad: Media
- Acción: Botón "Ver recibo"

---

## 🔄 Flujo de Notificaciones

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENTO DE RESERVA                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              1. Crear/Actualizar Reserva en DB              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              2. Enviar Emails (si configurado)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         3. Buscar Usuario por Email de Contacto             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│    4. Crear Notificación In-App (si usuario existe)         │
│       - Se guarda en MongoDB                                │
│       - Aparece en NotificationCenter                       │
│       - Se actualiza automáticamente vía SWR (30s)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│    5. Notificar Administradores (solo en nueva reserva)     │
│       - Busca todos los admin/super_admin activos           │
│       - Crea notificación para cada uno                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Condiciones Importantes

### Para que un cliente reciba notificaciones:
1. ✅ Debe estar **registrado** en el sistema
2. ✅ El **email de contacto** de la reserva debe coincidir con su email de usuario
3. ✅ El usuario debe estar **activo** (`isActive: true`)

### Para que un admin reciba notificaciones:
1. ✅ Debe tener rol `admin` o `super_admin`
2. ✅ Debe estar **activo** (`isActive: true`)

---

## 🛠️ Archivos Modificados

### Nuevos Archivos:
- **`/src/lib/notifications.ts`**: Helper functions para crear notificaciones
  - `notifyNewBooking()` - Nueva reserva
  - `notifyBookingConfirmed()` - Reserva confirmada
  - `notifyBookingCancelled()` - Reserva cancelada
  - `notifyPaymentReceived()` - Pago recibido
  - `notifyAdminNewBooking()` - Notificación para admins
  - `notifyPaymentReminder()` - Recordatorio de pago (futuro)
  - `notifySystem()` - Notificación genérica

### Archivos Modificados:
- **`/src/app/api/bookings/create/route.ts`**:
  - Importa funciones de notificaciones
  - Busca usuario por email
  - Crea notificación para cliente (si existe)
  - Crea notificaciones para todos los admins

- **`/src/app/api/bookings/[id]/route.ts`**:
  - Importa funciones de notificaciones
  - Compara estado anterior vs nuevo
  - Crea notificaciones según cambios detectados
  - Maneja errores sin fallar la operación principal

---

## 🧪 Cómo Probar

### 1. Crear una Reserva
```bash
# Como usuario registrado, crear una reserva desde el frontend
# Deberías ver:
# - Email de confirmación
# - Notificación in-app (campana con badge)
# - Los admins también reciben notificación
```

### 2. Confirmar una Reserva
```bash
# Como admin, cambiar estado a "confirmed"
PATCH /api/bookings/{id}
{
  "status": "confirmed"
}
# El cliente recibe notificación de confirmación
```

### 3. Marcar Pago como Recibido
```bash
# Como admin, cambiar paymentStatus
PATCH /api/bookings/{id}
{
  "paymentStatus": "paid",
  "paymentMethod": "credit_card",
  "transactionId": "TXN123456"
}
# El cliente recibe notificación de pago recibido
```

### 4. Cancelar una Reserva
```bash
# Como admin, cancelar reserva
PATCH /api/bookings/{id}
{
  "status": "cancelled",
  "cancellationReason": "Solicitado por el cliente"
}
# El cliente recibe notificación de cancelación
```

---

## 🔍 Logs y Debugging

El sistema registra logs en consola:

```javascript
// Éxito
✅ Notificación de reserva enviada al cliente
✅ Notificaciones enviadas a 3 administradores
✅ Notificación de confirmación enviada
✅ Notificación de pago recibido enviada

// Errores (no fallan la operación)
❌ Error creando notificación para cliente: [error]
❌ Error creando notificaciones para admins: [error]
```

---

## 📊 Visualización de Notificaciones

### En el TopBar:
- 🔔 Icono de campana con badge (contador de no leídas)
- Dropdown con últimas notificaciones
- Acciones rápidas: marcar leída, pin, eliminar
- Auto-actualización cada 30 segundos

### En `/dashboard/notifications`:
- Vista completa de todas las notificaciones
- Filtros: todas / sin leer
- Estadísticas
- Acciones masivas

---

## 🚀 Próximas Mejoras

### Notificaciones Adicionales a Implementar:
1. **Recordatorio de pago pendiente** (X días antes del vencimiento)
2. **Recordatorio de viaje próximo** (X días antes de la fecha)
3. **Cambios en ofertas** (precio, disponibilidad)
4. **Mensajes del agente asignado**
5. **Documentos listos** (vouchers, tickets)
6. **Cambios en itinerario**

### Mejoras Técnicas:
1. **Push Notifications** con FCM (ya preparado)
2. **Email notifications** automáticas (ya tiene Nodemailer)
3. **WebSockets** para notificaciones en tiempo real
4. **Notificaciones programadas** con cron jobs
5. **Preferencias de notificación** por usuario

---

## 💡 Casos de Uso Especiales

### Cliente no registrado:
- ❌ No recibe notificaciones in-app
- ✅ Recibe email de confirmación
- 💡 Sugerencia: Invitar a registrarse para recibir notificaciones

### Múltiples admins:
- ✅ Todos los admins activos reciben notificación de nueva reserva
- ✅ Pueden marcar como leída individualmente
- ✅ No hay duplicados

### Cambios múltiples simultáneos:
- ✅ Solo se envía una notificación por tipo de cambio
- ✅ Se compara estado anterior vs nuevo
- ✅ No se envían notificaciones redundantes

---

## 🔐 Seguridad

- ✅ Solo usuarios autenticados pueden crear reservas
- ✅ Las notificaciones solo se crean para usuarios existentes
- ✅ Los errores de notificación no fallan la operación principal
- ✅ Los datos sensibles no se exponen en notificaciones
- ✅ Las URLs de acción son relativas (no absolutas)

---

## 📚 Documentación Relacionada

- `NOTIFICATIONS_SETUP.md` - Configuración general del sistema
- `/src/lib/notifications.ts` - Funciones helper
- `/src/types/notification.ts` - Tipos TypeScript
- `/src/models/Notification.ts` - Modelo MongoDB

---

**Última actualización**: Enero 2026  
**Estado**: ✅ Implementado y funcionando
