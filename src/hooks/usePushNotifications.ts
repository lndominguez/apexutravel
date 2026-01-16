import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { 
  getFCMToken, 
  registerFCMToken, 
  onMessageListener,
  requestNotificationPermission 
} from '@/lib/firebase-client'
import { toast } from 'sonner'

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (!user || !isSupported) return

    const initializePushNotifications = async () => {
      try {
        const token = await getFCMToken()
        if (token) {
          await registerFCMToken(token)
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error)
      }
    }

    initializePushNotifications()

    onMessageListener((payload) => {
      const title = payload.notification?.title || 'Nueva notificación'
      const body = payload.notification?.body || ''
      
      toast(title, {
        description: body,
        duration: 5000,
        action: payload.data?.clickAction ? {
          label: 'Ver',
          onClick: () => {
            window.location.href = payload.data.clickAction
          }
        } : undefined
      })
    })
  }, [user, isSupported])

  const requestPermission = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    
    if (result === 'granted') {
      const token = await getFCMToken()
      if (token) {
        await registerFCMToken(token)
        toast.success('Notificaciones push habilitadas')
      }
    } else {
      toast.error('Permisos de notificación denegados')
    }
    
    return result
  }

  return {
    permission,
    isSupported,
    requestPermission
  }
}
