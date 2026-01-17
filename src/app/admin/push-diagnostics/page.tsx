'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react'
import { Bell, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function PushDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [browserInfo, setBrowserInfo] = useState<any>({})
  const [localTestStatus, setLocalTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    checkBrowserSupport()
    fetchDiagnostics()
  }, [])

  const testLocalSystemNotification = async () => {
    setLocalTestStatus('sending')
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker no soportado')
      }

      if (!('Notification' in window)) {
        throw new Error('Notification API no soportada')
      }

      if (Notification.permission !== 'granted') {
        throw new Error(`Permiso actual: ${Notification.permission}`)
      }

      // Asegurar que el SW esté registrado con scope '/' (controle toda la app)
      const existing = await navigator.serviceWorker.getRegistration()
      if (!existing) {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
      }

      const ready = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout esperando serviceWorker.ready (recarga la página)')), 3000)
        )
      ])

      const title = '🔔 Prueba local (Sistema)'
      const options: NotificationOptions = {
        body: 'Si ves esto, macOS + navegador SI están mostrando notificaciones del sistema.',
        icon: '/logo/apex.png',
        badge: '/logo/apex.png',
        data: { url: '/admin/push-diagnostics' }
      }

      try {
        await ready.showNotification(title, options)
      } catch (e) {
        // Fallback directo (si showNotification no está disponible por alguna razón)
        const n = new Notification(title, options)
        n.onclick = () => {
          window.focus()
          window.location.href = '/admin/push-diagnostics'
          n.close()
        }
      }

      setLocalTestStatus('sent')
      toast.success('Notificación local disparada')
    } catch (error: any) {
      console.error('Local notification test error:', error)
      setLocalTestStatus('error')
      toast.error(error?.message || 'Error disparando notificación local')
    }
  }

  const checkBrowserSupport = () => {
    const info: any = {
      notificationSupported: 'Notification' in window,
      notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'not-supported',
      serviceWorkerSupported: 'serviceWorker' in navigator,
      pushSupported: 'PushManager' in window,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol
    }

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        info.serviceWorkerRegistrations = registrations.length
        info.serviceWorkerActive = registrations.some(reg => reg.active)
        setBrowserInfo(info)
      })
    } else {
      setBrowserInfo(info)
    }
  }

  const fetchDiagnostics = async () => {
    try {
      const response = await fetch('/api/debug-push')
      const data = await response.json()
      setDiagnostics(data)
    } catch (error) {
      console.error('Error fetching diagnostics:', error)
      toast.error('Error al obtener diagnósticos')
    } finally {
      setLoading(false)
    }
  }

  const requestTestNotification = async () => {
    try {
      const response = await fetch('/api/test-push', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Notificación de prueba enviada')
      } else {
        toast.error(data.error || 'Error al enviar notificación')
      }
    } catch (error) {
      toast.error('Error al enviar notificación de prueba')
    }
  }

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      toast.success(`Permiso: ${permission}`)
      checkBrowserSupport()
      fetchDiagnostics()
    } catch (error) {
      toast.error('Error al solicitar permiso')
    }
  }

  const StatusChip = ({ status, label }: { status: boolean, label: string }) => (
    <div className="flex items-center gap-2">
      {status ? (
        <CheckCircle className="w-5 h-5 text-success" />
      ) : (
        <XCircle className="w-5 h-5 text-danger" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Diagnóstico de Push Notifications
          </h1>
          <p className="text-default-500 text-sm mt-1">
            Verifica el estado de las notificaciones push
          </p>
        </div>
        <Button
          color="primary"
          startContent={<RefreshCw className="w-4 h-4" />}
          onPress={() => {
            setLoading(true)
            checkBrowserSupport()
            fetchDiagnostics()
          }}
        >
          Actualizar
        </Button>
      </div>

      {/* Browser Support */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Soporte del Navegador</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <StatusChip 
            status={browserInfo.notificationSupported} 
            label="API de Notificaciones soportada" 
          />
          <StatusChip 
            status={browserInfo.serviceWorkerSupported} 
            label="Service Workers soportados" 
          />
          <StatusChip 
            status={browserInfo.pushSupported} 
            label="Push API soportada" 
          />
          <StatusChip 
            status={browserInfo.isSecureContext} 
            label="Contexto seguro (HTTPS)" 
          />
          
          <div className="pt-3 border-t border-default-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Permiso de notificaciones:</span>
              <Chip 
                color={
                  browserInfo.notificationPermission === 'granted' ? 'success' :
                  browserInfo.notificationPermission === 'denied' ? 'danger' : 'warning'
                }
                variant="flat"
              >
                {browserInfo.notificationPermission}
              </Chip>
            </div>
            
            {browserInfo.notificationPermission !== 'granted' && (
              <Button
                size="sm"
                color="primary"
                className="mt-2"
                onPress={requestPermission}
              >
                Solicitar permiso
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Service Workers activos:</span>
            <Chip variant="flat">
              {browserInfo.serviceWorkerRegistrations || 0}
            </Chip>
          </div>

          <div className="pt-3 border-t border-default-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">SW controller:</span>
              <Chip size="sm" variant="flat" color={navigator?.serviceWorker?.controller ? 'success' : 'warning'}>
                {navigator?.serviceWorker?.controller ? 'si' : 'no'}
              </Chip>
            </div>

            <Button
              size="sm"
              variant="flat"
              onPress={testLocalSystemNotification}
              isDisabled={browserInfo.notificationPermission !== 'granted' || localTestStatus === 'sending'}
            >
              Probar notificación local (Sistema)
            </Button>
            <p className="text-xs text-default-500">
              Este test NO usa Firebase. Si esto no aparece en tu Mac, el problema es permisos del sistema / navegador.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Server Status */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Estado del Servidor</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p className="text-default-500">Cargando...</p>
          ) : diagnostics?.success ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Usuario:</span>
                <span className="text-sm text-default-600">{diagnostics.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rol:</span>
                <Chip size="sm" variant="flat">{diagnostics.user.role}</Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FCM Tokens registrados:</span>
                <Chip 
                  size="sm" 
                  color={diagnostics.user.fcmTokensCount > 0 ? 'success' : 'warning'}
                  variant="flat"
                >
                  {diagnostics.user.fcmTokensCount}
                </Chip>
              </div>

              {diagnostics.user.fcmTokens.length > 0 && (
                <div className="pt-3 border-t border-default-200">
                  <p className="text-sm font-medium mb-2">Tokens:</p>
                  {diagnostics.user.fcmTokens.map((token: string, idx: number) => (
                    <div key={idx} className="text-xs text-default-500 font-mono bg-default-100 p-2 rounded mb-1 break-all">
                      {token}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-danger">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{diagnostics?.error || 'Error al cargar diagnósticos'}</span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Test Notification */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Prueba de Notificación</h2>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-default-500 mb-4">
            Envía una notificación de prueba para verificar que todo funciona correctamente.
          </p>
          <Button
            color="primary"
            startContent={<Bell className="w-4 h-4" />}
            onPress={requestTestNotification}
            isDisabled={browserInfo.notificationPermission !== 'granted'}
          >
            Enviar notificación de prueba
          </Button>
          
          {browserInfo.notificationPermission !== 'granted' && (
            <p className="text-xs text-warning mt-2">
              Debes otorgar permisos de notificación primero
            </p>
          )}
        </CardBody>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Solución de Problemas</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold mb-2">Si no recibes notificaciones:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-default-600">
              <li>Verifica que el permiso esté en "granted"</li>
              <li>Asegúrate de tener al menos 1 FCM token registrado</li>
              <li>Verifica que el service worker esté activo (F12 → Application → Service Workers)</li>
              <li>Revisa la consola del navegador en busca de errores</li>
              <li>Intenta cerrar y reabrir el navegador</li>
              <li>En producción, verifica que uses HTTPS</li>
            </ol>
          </div>

          <div className="pt-3 border-t border-default-200">
            <h3 className="text-sm font-semibold mb-2">Notificaciones en segundo plano:</h3>
            <p className="text-sm text-default-600">
              Las notificaciones push funcionan incluso cuando el navegador está cerrado (en desktop). 
              En móvil, el navegador debe estar en segundo plano o la PWA debe estar instalada.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
