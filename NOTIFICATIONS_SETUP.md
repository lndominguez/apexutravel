# Sistema de Notificaciones - Guía de Configuración

## 📋 Resumen

Sistema completo de notificaciones implementado con:
- ✅ **In-App Notifications**: Notificaciones en tiempo real dentro de la plataforma
- ✅ **MongoDB**: Almacenamiento persistente
- ✅ **SWR**: Actualización automática cada 30 segundos
- ✅ **HeroUI**: Componentes UI modernos y responsivos
- 🔄 **Push Notifications**: Preparado para FCM (requiere configuración)

---

## 🎯 Características Implementadas

### 1. Modelo de Datos
- **Ubicación**: `/src/models/Notification.ts`
- **Tipos**: info, success, warning, error, booking, payment, system
- **Prioridades**: low, medium, high, urgent
- **Campos**:
  - Título y mensaje
  - Icono personalizable (Lucide icons)
  - Acción con botón y URL
  - Pin para destacar
  - Fecha de expiración
  - Metadata adicional
  - Control de envío (in-app, push, email)

### 2. API Routes
- `GET /api/notifications` - Listar notificaciones
- `POST /api/notifications` - Crear notificación
- `PATCH /api/notifications/[id]` - Actualizar (marcar leída, pin)
- `DELETE /api/notifications/[id]` - Eliminar
- `POST /api/notifications/mark-all-read` - Marcar todas como leídas
- `GET /api/notifications/unread-count` - Contador de no leídas

### 3. Componentes UI

#### NotificationCenter (TopBar)
- Icono de campana con badge de contador
- Dropdown con lista de notificaciones
- Acciones rápidas: marcar leída, pin, eliminar
- Auto-actualización cada 30 segundos

#### Página de Notificaciones (`/dashboard/notifications`)
- Vista completa de todas las notificaciones
- Filtros: todas / sin leer
- Estadísticas
- Envío de notificaciones (admins)

#### NotificationSender (Modal)
- Formulario completo para crear notificaciones
- Selección de tipo y prioridad
- Acción personalizable
- Opciones de envío (in-app, push, email)

### 4. Hook SWR
- `useNotifications()` - Gestión completa de notificaciones
- `useUnreadCount()` - Solo contador
- Auto-revalidación y cache inteligente

---

## 🚀 Uso Básico

### Enviar una notificación desde código

```typescript
// En cualquier API route o server action
const response = await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'USER_ID', // ObjectId del usuario
    type: 'booking',
    priority: 'high',
    title: 'Nueva reserva confirmada',
    message: 'Tu reserva #12345 ha sido confirmada exitosamente',
    action: {
      label: 'Ver reserva',
      url: '/dashboard/bookings/12345'
    },
    metadata: {
      bookingId: '12345',
      amount: 1500
    },
    sentVia: {
      inApp: true,
      push: true,
      email: false
    }
  })
})
```

### Usar en componentes

```typescript
import { useNotifications } from '@/swr'

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    deleteNotification 
  } = useNotifications()

  return (
    <div>
      <p>Tienes {unreadCount} notificaciones sin leer</p>
      {notifications.map(notif => (
        <div key={notif._id}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          <button onClick={() => markAsRead(notif._id)}>
            Marcar como leída
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## 🔔 Configuración de Push Notifications (FCM)

### Paso 1: Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Project Settings** → **Cloud Messaging**
4. Copia el **Server Key** y **Sender ID**

### Paso 2: Instalar dependencias

```bash
npm install firebase firebase-admin
```

### Paso 3: Configurar variables de entorno

Agrega a tu `.env`:

```env
# Firebase Cloud Messaging
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Server-side
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key"
```

### Paso 4: Crear configuración de Firebase

**`/src/lib/firebase/config.ts`**:
```typescript
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null

export { app, messaging }
```

### Paso 5: Crear Service Worker

**`/public/firebase-messaging-sw.js`**:
```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload)
  
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
```

### Paso 6: Solicitar permiso y obtener token

**`/src/hooks/usePushNotifications.ts`**:
```typescript
import { useEffect, useState } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from '@/lib/firebase/config'

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (!messaging) return

    // Solicitar permiso
    Notification.requestPermission().then((perm) => {
      setPermission(perm)
      
      if (perm === 'granted') {
        // Obtener token
        getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        }).then((currentToken) => {
          if (currentToken) {
            setToken(currentToken)
            // Guardar token en el backend
            saveTokenToBackend(currentToken)
          }
        })
      }
    })

    // Escuchar mensajes en foreground
    onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload)
      // Mostrar notificación con toast
      toast.info(payload.notification?.title || 'Nueva notificación')
    })
  }, [])

  return { token, permission }
}

async function saveTokenToBackend(token: string) {
  await fetch('/api/users/fcm-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
}
```

### Paso 7: Enviar push desde el servidor

**`/src/lib/firebase/admin.ts`**:
```typescript
import admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const message = {
      notification: { title, body },
      data,
      token
    }

    const response = await admin.messaging().send(message)
    console.log('Push notification sent:', response)
    return response
  } catch (error) {
    console.error('Error sending push:', error)
    throw error
  }
}
```

---

## 📧 Integración con Email (Opcional)

Ya tienes Nodemailer configurado. Para enviar notificaciones por email:

```typescript
import { sendEmail } from '@/lib/email'

// Al crear notificación con sendVia.email = true
if (sentVia.email) {
  await sendEmail({
    to: user.email,
    subject: notification.title,
    html: `
      <h2>${notification.title}</h2>
      <p>${notification.message}</p>
      ${notification.action ? `
        <a href="${notification.action.url}">
          ${notification.action.label}
        </a>
      ` : ''}
    `
  })
}
```

---

## 🎨 Personalización

### Iconos disponibles (Lucide)
- Bell, Info, CheckCircle, AlertTriangle, AlertCircle
- Package, CreditCard, Settings, User, Mail
- Calendar, Clock, MapPin, Phone, etc.

### Colores por tipo
- **info**: Azul (primary)
- **success**: Verde (success)
- **warning**: Amarillo (warning)
- **error**: Rojo (danger)
- **booking**: Azul (primary)
- **payment**: Verde (success)
- **system**: Gris (default)

---

## 🔒 Seguridad

- ✅ Todas las rutas requieren autenticación
- ✅ Los usuarios solo ven sus propias notificaciones
- ✅ Validación de permisos en el servidor
- ✅ Sanitización de inputs
- ✅ Rate limiting recomendado para producción

---

## 📊 Monitoreo

### Métricas a trackear
- Tasa de apertura de notificaciones
- Tiempo promedio de lectura
- Notificaciones por tipo/prioridad
- Engagement con acciones

### Logs
Todos los eventos importantes se registran en console:
- Creación de notificaciones
- Errores de envío
- Actualizaciones de estado

---

## 🚀 Próximos Pasos

1. **Configurar FCM** siguiendo los pasos anteriores
2. **Agregar campo `fcmToken`** al modelo User
3. **Implementar lógica de envío** en las API routes
4. **Crear notificaciones automáticas** para eventos del sistema:
   - Nueva reserva
   - Pago recibido
   - Cambios en ofertas
   - Recordatorios
5. **Agregar analytics** para medir engagement
6. **Implementar rate limiting** para evitar spam

---

## 📝 Notas Importantes

- Las notificaciones se auto-eliminan después de 30 días (TTL index)
- El contador de no leídas se actualiza automáticamente
- Las notificaciones pinned aparecen primero
- El sistema soporta notificaciones masivas (broadcast)
- Compatible con PWA para notificaciones offline

---

## 🐛 Troubleshooting

### Las notificaciones no aparecen
- Verificar que el usuario esté autenticado
- Revisar que el `userId` sea correcto
- Comprobar logs del servidor

### El contador no se actualiza
- SWR revalida cada 30s automáticamente
- Forzar actualización con `mutate()`

### Push notifications no funcionan
- Verificar permisos del navegador
- Comprobar configuración de FCM
- Revisar service worker en DevTools

---

## 📚 Recursos

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [HeroUI Dropdown](https://heroui.com/docs/components/dropdown)
- [SWR Documentation](https://swr.vercel.app/)
- [Lucide Icons](https://lucide.dev/)

---

**Sistema implementado por**: Cascade AI  
**Fecha**: Enero 2026  
**Versión**: 1.0.0
