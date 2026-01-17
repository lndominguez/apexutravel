'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardBody,
  Button,
  Input,
  Link
} from '@heroui/react'
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('El email es requerido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'Error al enviar el email')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 50%, #0c3f5b 100%)'
      }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#ec9c12]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f1c203]/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
          <CardBody className="text-center py-12 px-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6" style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            }}>
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: '#22c55e' }}>
              ¡Email Enviado!
            </h1>
            <p className="text-gray-600 mb-4">
              Si tu email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Revisa tu bandeja de entrada y la carpeta de spam.
            </p>
            <Button
              size="lg"
              variant="bordered"
              className="font-semibold"
              style={{
                borderColor: '#0c3f5b',
                color: '#0c3f5b'
              }}
              onPress={() => router.push('/auth/login')}
              startContent={<ArrowLeft size={18} />}
            >
              Volver al Login
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 50%, #0c3f5b 100%)'
    }}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#ec9c12]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f1c203]/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
        <CardBody className="p-8 sm:p-10">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{
              background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 100%)'
            }}>
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#0c3f5b' }}>
              Recuperar Contraseña
            </h1>
            <p className="text-gray-600">
              Ingresa tu email para recibir un enlace de recuperación
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              placeholder="tu-email@ejemplo.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              startContent={<Mail className="w-4 h-4 text-gray-400" />}
              variant="bordered"
              size="lg"
              isRequired
              isDisabled={loading}
              isInvalid={!!error}
              errorMessage={error}
              classNames={{
                input: 'text-base',
                inputWrapper: 'border-gray-300 hover:border-[#0c3f5b] focus-within:!border-[#0c3f5b]'
              }}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 100%)'
              }}
              isLoading={loading}
              endContent={!loading && <Send className="w-5 h-5" />}
            >
              {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </Button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm font-medium inline-flex items-center gap-2"
                style={{ color: '#ec9c12' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al login
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              © 2024 ApexuTravel. Todos los derechos reservados.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
