'use client'

import { useState } from 'react'
import { Button, Switch } from '@heroui/react'
import { Bell, BellOff } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { unregisterFCMToken } from '@/lib/firebase-client'
import { toast } from 'sonner'

export function PushNotificationToggle() {
  const { permission, isSupported, requestPermission } = usePushNotifications()
  const [isLoading, setIsLoading] = useState(false)

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-3 bg-default-100 rounded-lg">
        <BellOff className="w-5 h-5 text-default-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-default-700">
            Notificaciones push no disponibles
          </p>
          <p className="text-xs text-default-500">
            Tu navegador no soporta notificaciones push
          </p>
        </div>
      </div>
    )
  }

  const isEnabled = permission === 'granted'
  const isDenied = permission === 'denied'

  const handleToggle = async () => {
    if (isEnabled) {
      // Desactivar notificaciones
      setIsLoading(true)
      try {
        // Obtener el token actual antes de desregistrarlo
        const { getFCMToken } = await import('@/lib/firebase-client')
        const token = await getFCMToken()
        if (token) {
          await unregisterFCMToken(token)
          toast.success('Notificaciones push desactivadas')
          // Recargar para actualizar el estado
          setTimeout(() => window.location.reload(), 500)
        }
      } catch (error) {
        toast.error('Error al desactivar notificaciones')
      } finally {
        setIsLoading(false)
      }
    } else {
      // Activar notificaciones
      setIsLoading(true)
      try {
        await requestPermission()
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-default-50 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <Bell className={`w-5 h-5 flex-shrink-0 ${isEnabled ? 'text-success' : 'text-default-400'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-default-700">
            Notificaciones push
          </p>
          <p className="text-xs text-default-500 truncate">
            {isEnabled && 'Activas - Recibirás notificaciones en tiempo real'}
            {permission === 'default' && 'Habilita para recibir notificaciones'}
            {isDenied && 'Denegadas - Habilítalas en la configuración del navegador'}
          </p>
        </div>
      </div>

      <div className="flex-shrink-0">
        {isDenied ? (
          <Button
            size="sm"
            variant="flat"
            onPress={() => {
              window.open('https://support.google.com/chrome/answer/3220216', '_blank')
            }}
          >
            Ayuda
          </Button>
        ) : (
          <Switch
            isSelected={isEnabled}
            onValueChange={handleToggle}
            isDisabled={isLoading}
            size="sm"
            color="success"
          />
        )}
      </div>
    </div>
  )
}
