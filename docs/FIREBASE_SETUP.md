# Configuración de Firebase Cloud Messaging (FCM)

Este documento explica cómo configurar Firebase Cloud Messaging para habilitar las notificaciones push en el sistema.

## 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Cloud Messaging** en el proyecto

## 2. Obtener credenciales

### Para el Backend (Firebase Admin SDK)

1. Ve a **Project Settings** > **Service Accounts**
2. Haz clic en **Generate new private key**
3. Descarga el archivo JSON con las credenciales
4. Extrae los siguientes valores del archivo JSON:
   - `project_id`
   - `client_email`
   - `private_key`

### Para el Frontend (Firebase Client SDK)

1. Ve a **Project Settings** > **General**
2. En la sección **Your apps**, agrega una aplicación web
3. Copia la configuración de Firebase (firebaseConfig)
4. Ve a **Project Settings** > **Cloud Messaging**
5. En **Web Push certificates**, genera un nuevo par de claves VAPID
6. Copia la **Key pair** (VAPID key)

## 3. Configurar variables de entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# Firebase Admin SDK (Backend)
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANTE:** 
- El `FIREBASE_PRIVATE_KEY` debe incluir los saltos de línea `\n`
- Asegúrate de que la private key esté entre comillas dobles

## 4. Actualizar el Service Worker

Edita el archivo `public/firebase-messaging-sw.js` y reemplaza los valores de configuración:

```javascript
const firebaseConfig = {
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_AUTH_DOMAIN',
  projectId: 'TU_PROJECT_ID',
  storageBucket: 'TU_STORAGE_BUCKET',
  messagingSenderId: 'TU_MESSAGING_SENDER_ID',
  appId: 'TU_APP_ID'
}
```

## 5. Registrar el Service Worker

El service worker se registra automáticamente cuando el usuario habilita las notificaciones push.

## 6. Probar las notificaciones

### Desde el código

Las notificaciones se envían automáticamente cuando se crea una notificación con `sendPush: true`:

```typescript
await createNotification({
  userId: 'user-id',
  type: NotificationType.INFO,
  priority: NotificationPriority.HIGH,
  title: 'Título de la notificación',
  message: 'Mensaje de la notificación',
  sendPush: true, // ← Esto enviará la push notification
  action: {
    label: 'Ver detalles',
    url: '/ruta/destino'
  }
})
```

### Desde Firebase Console

1. Ve a **Cloud Messaging** > **Send your first message**
2. Ingresa el título y mensaje
3. Haz clic en **Send test message**
4. Ingresa el FCM token de un usuario (puedes verlo en los logs del navegador)
5. Envía el mensaje de prueba

## 7. Habilitar notificaciones para usuarios

Los usuarios pueden habilitar las notificaciones push desde:

1. **Configuración de usuario** - Componente `PushNotificationToggle`
2. **Automáticamente** - El hook `usePushNotifications` solicita permisos al iniciar sesión

## 8. Verificar que funciona

1. Inicia sesión en la aplicación
2. Acepta los permisos de notificación cuando se soliciten
3. Verifica en la consola del navegador que se obtuvo el FCM token
4. Crea una reserva o realiza una acción que genere una notificación
5. Deberías recibir la notificación push

## Troubleshooting

### No se solicitan permisos de notificación

- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de estar usando HTTPS (las notificaciones push requieren HTTPS)
- En desarrollo, `localhost` funciona sin HTTPS

### El service worker no se registra

- Verifica que el archivo `firebase-messaging-sw.js` esté en la carpeta `public`
- Limpia la caché del navegador y recarga
- Verifica en DevTools > Application > Service Workers

### No se reciben notificaciones

- Verifica que el usuario tenga un FCM token registrado en la base de datos
- Revisa los logs del servidor para ver si hay errores al enviar
- Verifica que Firebase Cloud Messaging esté habilitado en el proyecto
- Asegúrate de que el navegador tenga permisos de notificación

### Errores de credenciales

- Verifica que el `FIREBASE_PRIVATE_KEY` tenga los saltos de línea correctos
- Asegúrate de que el service account tenga los permisos necesarios
- Regenera las credenciales si es necesario

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│                                                              │
│  ┌──────────────────┐      ┌─────────────────────────┐     │
│  │ usePushNotif()   │─────▶│ firebase-client.ts      │     │
│  │ Hook             │      │ - getFCMToken()         │     │
│  └──────────────────┘      │ - registerFCMToken()    │     │
│                            │ - onMessageListener()   │     │
│                            └─────────────────────────┘     │
│                                      │                       │
│                                      ▼                       │
│                            ┌─────────────────────────┐     │
│                            │ Service Worker          │     │
│                            │ firebase-messaging-sw.js│     │
│                            └─────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                                      │
                                      │ FCM Token
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                        SERVIDOR                              │
│                                                              │
│  ┌──────────────────┐      ┌─────────────────────────┐     │
│  │ notifications.ts │─────▶│ push-notifications.ts   │     │
│  │ createNotif()    │      │ sendPushNotification()  │     │
│  └──────────────────┘      └─────────────────────────┘     │
│                                      │                       │
│                                      ▼                       │
│                            ┌─────────────────────────┐     │
│                            │ firebase-admin.ts       │     │
│                            │ Firebase Admin SDK      │     │
│                            └─────────────────────────┘     │
│                                      │                       │
│                                      ▼                       │
│                            ┌─────────────────────────┐     │
│                            │ User Model              │     │
│                            │ fcmTokens: []           │     │
│                            └─────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────────┐
                            │   Firebase Cloud        │
                            │   Messaging (FCM)       │
                            └─────────────────────────┘
```

## Recursos adicionales

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
