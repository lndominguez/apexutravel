import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { 
  getFCMToken, 
  registerFCMToken, 
  onMessageListener,
  requestNotificationPermission,
  unregisterFCMToken,
  deleteFCMToken
} from '@/lib/firebase-client'
import { toast } from 'sonner'

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isSecureContext, setIsSecureContext] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const secure = window.isSecureContext
    setIsSecureContext(secure)

    const supported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      secure

    setIsSupported(supported)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    try {
      const stored = window.localStorage.getItem('pushNotificationsEnabled')
      setPushEnabled(stored === 'true')
    } catch {
      setPushEnabled(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    // Registrar el listener siempre (si el navegador lo soporta), pero solo mostrar
    // notificación del sistema cuando el usuario habilitó push.
    if (!isSupported) return

    if (pushEnabled && permission === 'granted') {
      getFCMToken()
        .then((token) => {
          if (token) return registerFCMToken(token)
        })
        .catch((error) => {
          console.error('Error initializing push notifications:', error)
        })
    }

    const unsubscribe = onMessageListener((payload) => {
      console.log('📬 Mensaje recibido en primer plano:', payload)

      if (!pushEnabled) return
      
      // Mostrar notificación del sistema en primer plano.
      // En macOS es más confiable usar showNotification() desde el Service Worker.
      const show = async () => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return

        const title = payload.notification?.title || 'Nueva notificación'
        const body = payload.notification?.body || ''
        const clickAction = payload?.fcmOptions?.link || payload?.data?.clickAction || '/'

        const options: NotificationOptions = {
          body,
          icon: '/logo/apex.png',
          badge: '/logo/apex.png',
          data: {
            url: clickAction,
            ...(payload.data || {})
          }
        }

        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready
            await reg.showNotification(title, options)
            return
          }
        } catch (e) {
          console.warn('⚠️ No se pudo usar serviceWorker.showNotification, fallback a Notification()', e)
        }

        try {
          const n = new Notification(title, options)
          n.onclick = () => {
            window.focus()
            if (clickAction) window.location.href = clickAction
            n.close()
          }
        } catch (e) {
          console.error('❌ Notification() falló:', e)
        }
      }

      void show()
    })

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [user, isSupported, pushEnabled, permission])

  const enablePush = async () => {
    if (!isSupported) {
      toast.error('Notificaciones push no disponibles en este dispositivo')
      return 'denied' as NotificationPermission
    }

    console.log('🟢 Activando push notifications...')
    const result = await requestNotificationPermission()
    setPermission(result)

    if (result === 'granted') {
      setPushEnabled(true)
      try {
        window.localStorage.setItem('pushNotificationsEnabled', 'true')
      } catch {}

      console.log('📲 Obteniendo token FCM...')
      const token = await getFCMToken()
      if (token) {
        console.log('📤 Registrando token en servidor...')
        const registered = await registerFCMToken(token)
        console.log('📥 Token registrado:', registered)
      } else {
        console.warn('⚠️ No se pudo obtener token FCM')
      }

      toast.success('Notificaciones push habilitadas')
    } else {
      toast.error('Permisos de notificación denegados')
    }

    return result
  }

  const disablePush = async () => {
    console.log('🔴 Desactivando push notifications...')
    setPushEnabled(false)
    try {
      window.localStorage.setItem('pushNotificationsEnabled', 'false')
    } catch {}

    try {
      let token: string | null = null
      try {
        token = window.localStorage.getItem('fcmToken')
        console.log('🔍 Token obtenido de localStorage:', token ? `${token.substring(0, 20)}...` : 'null')
      } catch {}

      if (token) {
        console.log('📤 Enviando solicitud de unregister al servidor...')
        const result = await unregisterFCMToken(token)
        console.log('📥 Resultado de unregister:', result)
      } else {
        console.warn('⚠️ No se encontró token en localStorage para eliminar')
      }
      
      console.log('🗑️ Eliminando token de Firebase...')
      await deleteFCMToken()
      console.log('✅ Token eliminado de Firebase')
      
      toast.success('Notificaciones push desactivadas')
    } catch (error) {
      console.error('❌ Error disabling push notifications:', error)
      toast.error('Error al desactivar notificaciones push')
    }
  }

  return {
    permission,
    isSupported,
    isSecureContext,
    pushEnabled,
    enablePush,
    disablePush
  }
}
