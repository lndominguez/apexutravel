'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Spinner
} from '@heroui/react'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Key
} from 'lucide-react'

interface UserData {
  firstName: string
  lastName: string
  email: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no válido')
      setLoading(false)
      return
    }

    // Verificar token
    fetch(`/api/auth/reset-password?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserData(data.user)
        } else {
          setError(data.error || 'Token inválido o expirado')
        }
      })
      .catch(() => {
        setError('Error al verificar el token')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.password) {
      errors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'Error al restablecer la contraseña')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="flex items-center justify-center py-12">
            <Spinner size="lg" color="primary" />
            <p className="mt-4 text-muted-foreground">Verificando token...</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-danger/5 via-background to-danger/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-danger/20">
          <CardBody className="text-center py-12">
            <div className="p-4 bg-danger/10 rounded-2xl inline-block mb-4">
              <AlertCircle className="h-12 w-12 text-danger" />
            </div>
            <h1 className="text-2xl font-bold text-danger mb-2">Token Inválido</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button
              color="primary"
              variant="bordered"
              onPress={() => router.push('/auth/forgot-password')}
            >
              Solicitar Nuevo Enlace
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success/5 via-background to-success/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-success/20 bg-success/5">
          <CardBody className="text-center py-12">
            <div className="p-4 bg-success/20 rounded-2xl inline-block mb-4">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-success mb-4">¡Contraseña Restablecida!</h1>
            <p className="text-muted-foreground mb-6">
              Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Button
              color="primary"
              onPress={() => router.push('/auth/login')}
            >
              Ir al Login
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
              <Key className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Restablecer Contraseña</h1>
              <p className="text-muted-foreground mt-1">
                Hola {userData.firstName}, crea tu nueva contraseña
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              value={userData.email}
              isReadOnly
              variant="bordered"
              startContent={<Lock size={16} />}
            />

            <Input
              label="Nueva Contraseña"
              placeholder="Ingresa tu nueva contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              startContent={<Lock size={16} />}
              endContent={
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              }
              isInvalid={!!formErrors.password}
              errorMessage={formErrors.password}
              isRequired
            />

            <Input
              label="Confirmar Contraseña"
              placeholder="Repite tu nueva contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              startContent={<Lock size={16} />}
              endContent={
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              }
              isInvalid={!!formErrors.confirmPassword}
              errorMessage={formErrors.confirmPassword}
              isRequired
            />

            {error && (
              <div className="p-4 bg-danger/10 rounded-lg border border-danger/20">
                <p className="text-danger text-sm font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              color="primary"
              isLoading={submitting}
              className="w-full"
              startContent={!submitting && <CheckCircle size={16} />}
            >
              {submitting ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
