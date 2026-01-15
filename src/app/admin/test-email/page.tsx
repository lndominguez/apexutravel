'use client'

import { useState } from 'react'
import { Card, CardBody, Button, Input } from '@heroui/react'
import { Mail, Send, CheckCircle2, XCircle } from 'lucide-react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTestEmail = async () => {
    if (!email) {
      alert('Por favor ingresa un email')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Prueba de Configuración de Email
          </h1>
          <p className="text-gray-600">
            Envía un email de prueba para verificar que la configuración SMTP está funcionando correctamente.
          </p>
        </div>

        <Card>
          <CardBody className="p-6">
            <div className="space-y-6">
              {/* Configuración actual */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Mail size={18} />
                  Configuración Actual
                </h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Host:</strong> {process.env.NEXT_PUBLIC_EMAIL_HOST || 'smtp.gmail.com'}</p>
                  <p><strong>Port:</strong> {process.env.NEXT_PUBLIC_EMAIL_PORT || '587'}</p>
                  <p><strong>User:</strong> {process.env.NEXT_PUBLIC_EMAIL_USER || 'Configurado en .env'}</p>
                </div>
              </div>

              {/* Input de email */}
              <div>
                <Input
                  type="email"
                  label="Email de prueba"
                  placeholder="tu-email@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startContent={<Mail size={18} className="text-gray-400" />}
                  size="lg"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Ingresa el email donde quieres recibir el mensaje de prueba
                </p>
              </div>

              {/* Botón de envío */}
              <Button
                color="primary"
                size="lg"
                className="w-full"
                onPress={handleTestEmail}
                isLoading={isLoading}
                startContent={!isLoading && <Send size={20} />}
              >
                {isLoading ? 'Enviando...' : 'Enviar Email de Prueba'}
              </Button>

              {/* Resultado */}
              {result && (
                <div className={`rounded-lg p-4 ${
                  result.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    ) : (
                      <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 ${
                        result.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {result.success ? '✅ Email Enviado' : '❌ Error al Enviar'}
                      </h4>
                      <p className={`text-sm ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.message || result.error}
                      </p>
                      
                      {result.details && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-medium">
                            Ver detalles técnicos
                          </summary>
                          <pre className="mt-2 text-xs bg-white/50 p-3 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Instrucciones */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">
                  ⚠️ Problemas Comunes con Gmail
                </h4>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li>
                    <strong>1. App Password:</strong> Si tienes autenticación de 2 factores en Gmail, 
                    necesitas generar una "App Password" en lugar de usar tu contraseña normal.
                  </li>
                  <li>
                    <strong>2. Acceso de Apps Menos Seguras:</strong> Si no usas 2FA, debes habilitar 
                    "Acceso de apps menos seguras" en tu cuenta de Gmail.
                  </li>
                  <li>
                    <strong>3. Variables de Entorno:</strong> Verifica que EMAIL_USER, EMAIL_PASS, 
                    y EMAIL_FROM estén correctamente configuradas en tu archivo .env
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
