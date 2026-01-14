'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button, 
  Input,
  Textarea,
  Avatar,
  Chip
} from '@heroui/react'
import { 
  User,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  Briefcase,
  Shield
} from 'lucide-react'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { ProfileSkeleton } from '@/components/ContentSkeleton'

export default function ProfilePage() {
  const { user, isLoading, updateProfile, refreshSession, isAuthenticated } = useAuth()
  const router = useRouter()
  const notification = useNotification()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})

  // Verificar autenticación
  useEffect(() => {
    if (isLoading) return
    
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }
  }, [isAuthenticated, isLoading, router])

  // Inicializar formData cuando el usuario cambie
  useEffect(() => {
    if (user && user.id) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        department: (user as any).department || '',
        position: (user as any).position || '',
        notes: (user as any).notes || ''
      })
    }
  }, [user?.id, user?.firstName, user?.lastName, user?.email])

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  // Guardar cambios
  const handleSave = async () => {
    try {
      const response = await fetch('/api/account/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar usuario')
      }

      // Refrescar sesión para obtener datos actualizados
      await refreshSession()
      
      setIsEditing(false)
      console.log('✅ Profile updated and data invalidated')
      notification.success('Perfil actualizado', 'Los cambios se guardaron correctamente')
    } catch (error) {
      console.error('Error updating profile:', error)
      notification.error('Error al actualizar', 'No se pudo actualizar el perfil')
    }
  }

  // Cancelar edición
  const handleCancel = () => {
    if (user && user.id) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        department: (user as any).department || '',
        position: (user as any).position || '',
        notes: (user as any).notes || ''
      })
    }
    setIsEditing(false)
  }

  // Obtener color del rol
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'danger'
      case 'admin': return 'warning'
      case 'manager': return 'primary'
      case 'agent': return 'success'
      case 'viewer': return 'default'
      default: return 'default'
    }
  }

  // Obtener label del rol
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'manager': return 'Manager'
      case 'agent': return 'Agent'
      case 'viewer': return 'Viewer'
      default: return role
    }
  }

  if (isLoading) {
    return (
      <CRMLayout>
        <ProfileSkeleton />
      </CRMLayout>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <CRMLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Editando información personal' : 'Información personal y configuración'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="bordered"
                startContent={<X size={16} />}
                onPress={handleCancel}
                isDisabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                startContent={<Save size={16} />}
                onPress={handleSave}
                isLoading={isLoading}
              >
                Guardar
              </Button>
            </>
          ) : (
            <Button
              color="primary"
              startContent={<Edit size={16} />}
              onPress={() => setIsEditing(true)}
            >
              Editar Perfil
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User size={20} />
                Información Personal
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={isEditing ? formData.firstName : user.firstName}
                  onValueChange={(value) => handleInputChange('firstName', value)}
                  isReadOnly={!isEditing}
                  variant={isEditing ? 'bordered' : 'flat'}
                />
                <Input
                  label="Apellido"
                  value={isEditing ? formData.lastName : user.lastName}
                  onValueChange={(value) => handleInputChange('lastName', value)}
                  isReadOnly={!isEditing}
                  variant={isEditing ? 'bordered' : 'flat'}
                />
              </div>
              
              <Input
                label="Email"
                value={isEditing ? formData.email : user.email}
                onValueChange={(value) => handleInputChange('email', value)}
                isReadOnly={!isEditing}
                variant={isEditing ? 'bordered' : 'flat'}
                startContent={<Mail size={16} />}
              />
              
              <Input
                label="Teléfono"
                value={isEditing ? formData.phone : (user as any).phone || ''}
                onValueChange={(value) => handleInputChange('phone', value)}
                isReadOnly={!isEditing}
                variant={isEditing ? 'bordered' : 'flat'}
                startContent={<Phone size={16} />}
                placeholder="Ej: +1 234 567 8900"
              />
            </CardBody>
          </Card>

          {/* Información Profesional */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase size={20} />
                Información Profesional
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Departamento"
                  value={isEditing ? formData.department : (user as any).department || ''}
                  onValueChange={(value) => handleInputChange('department', value)}
                  isReadOnly={!isEditing}
                  variant={isEditing ? 'bordered' : 'flat'}
                  placeholder="Ej: Ventas, Marketing"
                />
                <Input
                  label="Posición"
                  value={isEditing ? formData.position : (user as any).position || ''}
                  onValueChange={(value) => handleInputChange('position', value)}
                  isReadOnly={!isEditing}
                  variant={isEditing ? 'bordered' : 'flat'}
                  placeholder="Ej: Gerente de Ventas"
                />
              </div>
              
              <Textarea
                label="Notas"
                value={isEditing ? formData.notes : (user as any).notes || ''}
                onValueChange={(value) => handleInputChange('notes', value)}
                isReadOnly={!isEditing}
                variant={isEditing ? 'bordered' : 'flat'}
                placeholder="Información adicional..."
                minRows={3}
              />
            </CardBody>
          </Card>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Avatar y Rol */}
          <Card>
            <CardBody className="text-center space-y-4">
              <div className="relative inline-block">
                <Avatar
                  src={(user as any).avatar}
                  name={`${user.firstName} ${user.lastName}`}
                  size="lg"
                  className="w-24 h-24"
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              
              <Chip
                color={getRoleColor(user.role) as any}
                variant="flat"
                startContent={<Shield size={14} />}
              >
                {getRoleLabel(user.role)}
              </Chip>
            </CardBody>
          </Card>

          {/* Estadísticas */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Estadísticas</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comisión:</span>
                <span className="font-medium">{user.commissionRate}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <Chip
                  color={(user as any).isActive ? 'success' : 'danger'}
                  variant="flat"
                  size="sm"
                >
                  {(user as any).isActive ? 'Activo' : 'Inactivo'}
                </Chip>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
