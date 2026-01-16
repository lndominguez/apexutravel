# Configuración de Notificaciones Push en Dispositivos Móviles

## 📱 Opciones para recibir notificaciones en el móvil

### Opción 1: Navegador Móvil (Más Simple)

1. **Abre el navegador en tu móvil** (Chrome, Safari, Firefox)
2. **Navega a tu aplicación** (debe estar en HTTPS o ser accesible públicamente)
3. **Inicia sesión** en la aplicación
4. **Ve a Preferencias** (menú lateral)
5. **Habilita las notificaciones push**
6. **Acepta los permisos** cuando el navegador los solicite

**Limitaciones:**
- Safari en iOS tiene soporte limitado para push notifications
- Chrome en Android funciona perfectamente
- Debes tener la pestaña abierta o el navegador en segundo plano

### Opción 2: Progressive Web App (PWA) - Recomendado

Para que funcione como una app nativa:

1. **Abre la app en Chrome (Android) o Safari (iOS)**
2. **Agrega a pantalla de inicio:**
   - **Android (Chrome):** Menú → "Agregar a pantalla de inicio"
   - **iOS (Safari):** Compartir → "Agregar a pantalla de inicio"
3. **Abre la app desde el ícono** en tu pantalla de inicio
4. **Habilita las notificaciones** en Preferencias

**Ventajas:**
- Funciona como app nativa
- Notificaciones incluso con la app cerrada
- Mejor experiencia de usuario

### Opción 3: App Nativa (Futuro)

Para una solución completa, necesitarías desarrollar apps nativas con:
- React Native + Firebase Cloud Messaging
- Flutter + Firebase Cloud Messaging
- Ionic + Firebase Cloud Messaging

## 🔧 Configuración Actual del Sistema

### Para desarrollo local (localhost):

**Problema:** Los dispositivos móviles no pueden acceder a `localhost` de tu computadora.

**Soluciones:**

#### A. Usar ngrok (Temporal para pruebas)

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer tu servidor local
ngrok http 3000
```

Esto te dará una URL pública como: `https://abc123.ngrok.io`

Usa esa URL en tu móvil para acceder a la app.

#### B. Usar tu IP local en la misma red WiFi

1. **Encuentra tu IP local:**
   ```bash
   # En Mac/Linux
   ifconfig | grep "inet "
   
   # En Windows
   ipconfig
   ```

2. **Accede desde el móvil:**
   ```
   http://TU_IP_LOCAL:3000
   ```
   Ejemplo: `http://192.168.1.100:3000`

3. **Problema:** HTTP no funciona para push notifications, necesitas HTTPS

4. **Solución:** Usa un certificado SSL local:
   ```bash
   # Generar certificado autofirmado
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   
   # Modificar package.json
   "dev": "next dev --experimental-https --experimental-https-key ./key.pem --experimental-https-cert ./cert.pem"
   ```

### Para producción:

1. **Despliega tu app** en un servidor con HTTPS:
   - Vercel (recomendado para Next.js)
   - Netlify
   - AWS
   - DigitalOcean
   - Heroku

2. **Configura el dominio** con SSL/TLS (automático en Vercel/Netlify)

3. **Accede desde cualquier dispositivo** usando tu dominio

## 🧪 Probar notificaciones push

### Desde la consola de Firebase:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Cloud Messaging** → **Send your first message**
4. Completa:
   - **Título:** "Prueba de notificación"
   - **Texto:** "Esta es una prueba"
5. Haz clic en **Send test message**
6. **Obtén el token FCM:**
   - Abre DevTools en el navegador (F12)
   - Ve a la consola
   - Busca el log: `✅ FCM token obtained: ...`
   - Copia el token completo
7. Pega el token en Firebase y envía

### Desde el código:

Puedes crear un endpoint de prueba:

```typescript
// src/app/api/test-push/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendPushNotification } from '@/lib/push-notifications'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  await sendPushNotification({
    userId: session.user.id,
    title: '🧪 Prueba de notificación',
    body: 'Esta es una notificación de prueba desde el servidor',
    clickAction: '/dashboard'
  })

  return NextResponse.json({ success: true })
}
```

## 📊 Verificar que todo funciona

### En el navegador (DevTools → Console):

```
✅ Firebase Client initialized
✅ Firebase Messaging initialized
✅ FCM token obtained: eXXXXXXXXXXXXXXXXXXX...
✅ FCM token registered on server
```

### En el servidor (terminal):

```
✅ Firebase Admin initialized successfully
📱 [PUSH] Intentando enviar push notification: { userId: '...', title: '...' }
✅ [PUSH] Firebase Messaging initialized
👤 [PUSH] User found: user@example.com, FCM tokens: 1
✅ Push notification sent: 1 success, 0 failures
```

### En la base de datos:

Verifica que el usuario tenga tokens FCM:

```javascript
// En MongoDB
db.users.findOne({ email: "tu@email.com" }, { fcmTokens: 1 })

// Debería mostrar:
{
  "_id": ObjectId("..."),
  "fcmTokens": ["eXXXXXXXXXXXXXXXXXXX..."]
}
```

## 🐛 Troubleshooting

### "No FCM tokens found"

**Causa:** El token no se registró correctamente.

**Solución:**
1. Abre DevTools → Console
2. Busca errores al obtener el token
3. Verifica que el VAPID key esté correcto en `.env.local`
4. Recarga la página y vuelve a habilitar las notificaciones

### "Firebase Messaging not initialized"

**Causa:** Las credenciales de Firebase Admin no están configuradas.

**Solución:**
1. Verifica que `.env.local` tenga todas las variables de Firebase Admin
2. Reinicia el servidor
3. Verifica los logs del servidor al iniciar

### "InvalidCharacterError" en el VAPID key

**Causa:** El VAPID key tiene saltos de línea o espacios.

**Solución:**
1. Abre `.env.local`
2. Asegúrate de que el VAPID key esté en UNA SOLA LÍNEA
3. No debe tener espacios ni saltos de línea

### Las notificaciones no llegan al móvil

**Causa:** Múltiples posibles causas.

**Solución:**
1. Verifica que estés usando HTTPS (no HTTP)
2. Verifica que el navegador soporte push notifications
3. Verifica que los permisos estén habilitados
4. Verifica que el token se haya registrado correctamente
5. Prueba desde Firebase Console directamente

## 📚 Recursos adicionales

- [Firebase Cloud Messaging Web](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [ngrok Documentation](https://ngrok.com/docs)
