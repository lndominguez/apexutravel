'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Divider,
  Chip,
  Avatar,
  Spinner
} from '@heroui/react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Building,
  Shield
} from 'lucide-react'

interface InvitationData {
  _id: string
  email: string
  role: string
  department?: string
  position?: string
  invitedBy: {
    firstName: string
    lastName: string
    email: string
  }
  expiresAt: string
  isUsed: boolean
}

export default function InvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido')
      setLoading(false)
      return
    }

    // Verificar el token de invitación
    fetch(`/api/account/users/invitations/verify?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInvitation(data.invitation)
        } else {
          setError(data.message || 'Invitación no válida o expirada')
        }
      })
      .catch(() => {
        setError('Error al verificar la invitación')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es requerido'
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido'
    }

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
      const response = await fetch('/api/account/users/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        // Redirigir al login con mensaje de éxito
        router.push(`/auth/login?message=Cuenta creada exitosamente. Puedes iniciar sesión con tu email: ${invitation?.email}`)
      } else {
        setError(data.message || 'Error al crear la cuenta')
      }
    } catch (error) {
      setError('Error al procesar la invitación')
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Administrador',
      admin: 'Administrador',
      manager: 'Manager',
      agent: 'Agente',
      viewer: 'Solo Lectura'
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, any> = {
      super_admin: 'danger',
      admin: 'primary',
      manager: 'secondary',
      agent: 'success',
      viewer: 'default'
    }
    return colors[role] || 'default'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="flex items-center justify-center py-12">
            <Spinner size="lg" color="primary" />
            <p className="mt-4 text-muted-foreground">Verificando invitación...</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-danger/5 via-background to-danger/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-danger/20">
          <CardBody className="text-center py-12">
            <div className="p-4 bg-danger/10 rounded-2xl inline-block mb-4">
              <AlertCircle className="h-12 w-12 text-danger" />
            </div>
            <h1 className="text-2xl font-bold text-danger mb-2">Invitación No Válida</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button
              color="primary"
              variant="bordered"
              onPress={() => router.push('/auth/login')}
              startContent={<ArrowRight size={16} />}
            >
              Ir al Login
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  const isExpired = new Date(invitation.expiresAt) < new Date()

  if (isExpired || invitation.isUsed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warning/5 via-background to-warning/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-warning/20">
          <CardBody className="text-center py-12">
            <div className="p-4 bg-warning/10 rounded-2xl inline-block mb-4">
              <AlertCircle className="h-12 w-12 text-warning" />
            </div>
            <h1 className="text-2xl font-bold text-warning mb-2">
              {invitation.isUsed ? 'Invitación Ya Utilizada' : 'Invitación Expirada'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {invitation.isUsed 
                ? 'Esta invitación ya ha sido utilizada para crear una cuenta.'
                : 'Esta invitación ha expirado y ya no es válida.'
              }
            </p>
            <Button
              color="primary"
              variant="bordered"
              onPress={() => router.push('/auth/login')}
              startContent={<ArrowRight size={16} />}
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
      <div className="w-full max-w-2xl space-y-6">
        {/* Header de Invitación */}
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="text-center pb-4">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-success/20 rounded-2xl">
                <UserPlus className="h-8 w-8 text-success" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-success">¡Has sido invitado!</h1>
                <p className="text-success/80 mt-1">
                  Completa tu registro para unirte al equipo
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardBody className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email asignado:</p>
                    <p className="font-medium">{invitation.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Rol asignado:</p>
                    <Chip size="sm" color={getRoleColor(invitation.role)} variant="flat">
                      {getRoleLabel(invitation.role)}
                    </Chip>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {invitation.department && (
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Departamento:</p>
                      <p className="font-medium capitalize">{invitation.department}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Avatar
                    name={`${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`}
                    size="sm"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">Invitado por:</p>
                    <p className="font-medium">
                      {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Formulario de Registro */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Completa tu Registro</h2>
            <p className="text-muted-foreground">
              Proporciona tus datos para crear tu cuenta
            </p>
          </CardHeader>
          
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  placeholder="Tu nombre"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  isInvalid={!!formErrors.firstName}
                  errorMessage={formErrors.firstName}
                  isRequired
                />
                
                <Input
                  label="Apellido"
                  placeholder="Tu apellido"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  isInvalid={!!formErrors.lastName}
                  errorMessage={formErrors.lastName}
                  isRequired
                />
              </div>

              <Input
                label="Email"
                value={invitation.email}
                isReadOnly
                variant="bordered"
                startContent={<Mail size={16} />}
                description="Este email será tu usuario para iniciar sesión"
              />

              <Input
                label="Contraseña"
                placeholder="Crea una contraseña segura"
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
                placeholder="Repite tu contraseña"
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

              <Divider />

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="bordered"
                  onPress={() => router.push('/auth/login')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  color="primary"
                  isLoading={submitting}
                  startContent={!submitting && <CheckCircle size={16} />}
                  className="flex-1"
                >
                  {submitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
