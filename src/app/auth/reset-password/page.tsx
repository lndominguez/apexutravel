'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardBody,
  Button,
  Input,
  Spinner,
  Progress
} from '@heroui/react'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Key,
  ArrowRight
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

  // Password strength calculator
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 6) strength += 25
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 15
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10
    return Math.min(strength, 100)
  }

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 40) return '#ef4444'
    if (strength < 70) return '#f59e0b'
    return '#22c55e'
  }

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength < 40) return 'Débil'
    if (strength < 70) return 'Media'
    return 'Fuerte'
  }

  const passwordStrength = calculatePasswordStrength(formData.password)

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
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 50%, #0c3f5b 100%)'
      }}>
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardBody className="flex items-center justify-center py-12">
            <Spinner size="lg" style={{ color: '#0c3f5b' }} />
            <p className="mt-4 text-gray-600">Verificando token...</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (error || !userData) {
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
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            }}>
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: '#ef4444' }}>
              Token Inválido
            </h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Button
              size="lg"
              variant="bordered"
              className="font-semibold"
              style={{
                borderColor: '#0c3f5b',
                color: '#0c3f5b'
              }}
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
              ¡Contraseña Restablecida!
            </h1>
            <p className="text-gray-600 mb-8">
              Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Button
              size="lg"
              className="font-semibold text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 100%)'
              }}
              onPress={() => router.push('/auth/login')}
              endContent={<ArrowRight className="w-5 h-5" />}
            >
              Ir al Login
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
              <Key className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#0c3f5b' }}>
              Restablecer Contraseña
            </h1>
            <p className="text-gray-600">
              Hola {userData.firstName}, crea tu nueva contraseña
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              value={userData.email}
              isReadOnly
              variant="bordered"
              size="lg"
              startContent={<Lock className="w-4 h-4 text-gray-400" />}
              classNames={{
                input: 'text-base',
                inputWrapper: 'bg-gray-50'
              }}
            />

            <div className="space-y-2">
              <Input
                label="Nueva Contraseña"
                placeholder="Ingresa tu nueva contraseña"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                startContent={<Lock className="w-4 h-4 text-gray-400" />}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                }
                variant="bordered"
                size="lg"
                isRequired
                isDisabled={submitting}
                isInvalid={!!formErrors.password}
                errorMessage={formErrors.password}
                classNames={{
                  input: 'text-base',
                  inputWrapper: 'border-gray-300 hover:border-[#0c3f5b] focus-within:!border-[#0c3f5b]'
                }}
              />
              
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Seguridad de contraseña:</span>
                    <span className="font-medium" style={{ color: getPasswordStrengthColor(passwordStrength) }}>
                      {getPasswordStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                  <Progress 
                    value={passwordStrength} 
                    className="h-1.5"
                    style={{
                      '--progress-color': getPasswordStrengthColor(passwordStrength)
                    } as React.CSSProperties}
                  />
                </div>
              )}
            </div>

            <Input
              label="Confirmar Contraseña"
              placeholder="Repite tu nueva contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              startContent={<Lock className="w-4 h-4 text-gray-400" />}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              }
              variant="bordered"
              size="lg"
              isRequired
              isDisabled={submitting}
              isInvalid={!!formErrors.confirmPassword}
              errorMessage={formErrors.confirmPassword}
              classNames={{
                input: 'text-base',
                inputWrapper: 'border-gray-300 hover:border-[#0c3f5b] focus-within:!border-[#0c3f5b]'
              }}
            />

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">
                  {error}
                </span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 100%)'
              }}
              isLoading={submitting}
              endContent={!submitting && <CheckCircle className="w-5 h-5" />}
            >
              {submitting ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </Button>
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
