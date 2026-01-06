'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Link
} from '@heroui/react'
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-success/20 bg-success/5">
          <CardBody className="text-center py-12">
            <div className="p-4 bg-success/20 rounded-2xl inline-block mb-4">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-success mb-4">¡Email Enviado!</h1>
            <p className="text-muted-foreground mb-6">
              Si tu email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Revisa tu bandeja de entrada y la carpeta de spam.
            </p>
            <Button
              color="primary"
              variant="bordered"
              onPress={() => router.push('/auth/login')}
              startContent={<ArrowLeft size={16} />}
            >
              Volver al Login
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/20 rounded-2xl">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recuperar Contraseña</h1>
              <p className="text-muted-foreground mt-1">
                Ingresa tu email para recibir un enlace de recuperación
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              placeholder="tu-email@ejemplo.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              startContent={<Mail size={16} />}
              isRequired
              isInvalid={!!error}
              errorMessage={error}
            />

            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              className="w-full"
              startContent={!loading && <Mail size={16} />}
            >
              {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </Button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                ← Volver al login
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
