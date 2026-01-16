'use client'

import { useEffect } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushNotificationInitializer() {
  const { permission, isSupported } = usePushNotifications()

  useEffect(() => {
    if (isSupported && permission === 'default') {
      console.log('🔔 Push notifications disponibles. Esperando acción del usuario.')
    }
  }, [isSupported, permission])

  return null
}
