'use client'

import { useState } from 'react'
import { Button, Switch } from '@heroui/react'
import { Bell, BellOff } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { toast } from 'sonner'

export function PushNotificationToggle() {
  const {
    permission,
    isSupported,
    isSecureContext,
    pushEnabled,
    enablePush,
    disablePush
  } = usePushNotifications()
  const [isLoading, setIsLoading] = useState(false)

  if (!isSecureContext) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-default-100 rounded-lg w-full">
        <BellOff className="w-5 h-5 text-default-400 flex-shrink-0" />
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-medium text-default-700">
            Notificaciones push no disponibles en esta URL
          </p>
          <p className="text-xs text-default-500 break-words">
            Se requiere HTTPS. En móvil no funciona por IP/HTTP. Usa el dominio en producción.
          </p>
        </div>
        <div className="flex-shrink-0 flex justify-center sm:justify-end">
          <Button
            size="sm"
            variant="flat"
            onPress={() => {
              window.open('https://travel.apexucode.com', '_blank')
            }}
          >
            Abrir
          </Button>
        </div>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-default-100 rounded-lg w-full">
        <BellOff className="w-5 h-5 text-default-400 flex-shrink-0" />
        <div className="flex-1 min-w-0 overflow-hidden">
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

  const isDenied = permission === 'denied'

  const handleToggle = async (nextValue: boolean) => {
    setIsLoading(true)
    try {
      if (nextValue) {
        await enablePush()
      } else {
        await disablePush()
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error)
      toast.error('Error actualizando notificaciones push')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-default-50 rounded-lg w-full">
      <div className="flex items-center gap-3 w-full sm:flex-1 min-w-0 overflow-hidden">
        <Bell className={`w-5 h-5 flex-shrink-0 ${pushEnabled ? 'text-success' : 'text-default-400'}`} />
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-medium text-default-700">
            Notificaciones push
          </p>
          <p className="text-xs text-default-500 truncate">
            {pushEnabled && 'Activas - Recibirás notificaciones en tiempo real'}
            {permission === 'default' && 'Habilita para recibir notificaciones'}
            {isDenied && 'Denegadas - Habilítalas en la configuración del navegador'}
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-end">
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
            isSelected={pushEnabled}
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
