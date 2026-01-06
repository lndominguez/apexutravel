'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Switch,
  Avatar,
  Divider
} from '@heroui/react'
import { User, Mail, Phone, Building, Briefcase, Percent, FileText } from 'lucide-react'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: any) => Promise<void>
  user?: any | null
  mode: 'create' | 'edit'
}

const roles = [
  { key: 'super_admin', label: 'Super Administrador' },
  { key: 'admin', label: 'Administrador' },
  { key: 'manager', label: 'Manager' },
  { key: 'agent', label: 'Agente' },
  { key: 'viewer', label: 'Solo Lectura' }
]

const departments = [
  { key: 'ventas', label: 'Ventas' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'operaciones', label: 'Operaciones' },
  { key: 'finanzas', label: 'Finanzas' },
  { key: 'rrhh', label: 'Recursos Humanos' },
  { key: 'it', label: 'Tecnología' }
]

export function UserModal({ isOpen, onClose, onSave, user, mode }: UserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'agent',
    phone: '',
    department: '',
    position: '',
    commissionRate: 5,
    notes: '',
    isActive: true,
    isEmailVerified: false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        role: user.role || 'agent',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
        commissionRate: user.commissionRate || 5,
        notes: user.notes || '',
        isActive: user.isActive ?? true,
        isEmailVerified: user.isEmailVerified ?? false
      })
    } else {
      // Reset form for create mode
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'agent',
        phone: '',
        department: '',
        position: '',
        commissionRate: 5,
        notes: '',
        isActive: true,
        isEmailVerified: false
      })
    }
    setErrors({})
  }, [user, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida'
    }
    if (mode === 'create' && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }
    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      newErrors.commissionRate = 'La comisión debe estar entre 0 y 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      
      const dataToSend: any = { ...formData }
      
      // No enviar password vacío en modo edición
      if (mode === 'edit' && !dataToSend.password) {
        delete dataToSend.password
      }

      await onSave(dataToSend)
      onClose()
    } catch (error) {
      console.error('Error al guardar usuario:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-background",
        header: "border-b border-divider",
        footer: "border-t border-divider"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {mode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === 'create' 
                  ? 'Completa la información para crear un nuevo usuario'
                  : 'Modifica la información del usuario'
                }
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="gap-6">
          {/* Avatar Preview */}
          {mode === 'edit' && (
            <div className="flex justify-center">
              <Avatar
                src={user?.avatar}
                name={`${formData.firstName} ${formData.lastName}`}
                size="lg"
                className="w-20 h-20"
              />
            </div>
          )}

          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User size={18} />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Ingresa el nombre"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                isInvalid={!!errors.firstName}
                errorMessage={errors.firstName}
                isRequired
              />
              
              <Input
                label="Apellido"
                placeholder="Ingresa el apellido"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                isInvalid={!!errors.lastName}
                errorMessage={errors.lastName}
                isRequired
              />
            </div>

            <Input
              label="Email"
              placeholder="usuario@empresa.com"
              type="email"
              startContent={<Mail size={16} />}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              isInvalid={!!errors.email}
              errorMessage={errors.email}
              isRequired
            />

            {mode === 'create' && (
              <Input
                label="Contraseña"
                placeholder="Mínimo 6 caracteres"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                isInvalid={!!errors.password}
                errorMessage={errors.password}
                isRequired
              />
            )}

            <Input
              label="Teléfono"
              placeholder="+1 234 567 8900"
              startContent={<Phone size={16} />}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <Divider />

          {/* Información Laboral */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase size={18} />
              Información Laboral
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Rol"
                placeholder="Selecciona un rol"
                selectedKeys={[formData.role]}
                onSelectionChange={(keys) => handleInputChange('role', Array.from(keys)[0])}
                isRequired
              >
                {roles.map((role) => (
                  <SelectItem key={role.key}>
                    {role.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Departamento"
                placeholder="Selecciona departamento"
                selectedKeys={formData.department ? [formData.department] : []}
                onSelectionChange={(keys) => handleInputChange('department', Array.from(keys)[0] || '')}
              >
                {departments.map((dept) => (
                  <SelectItem key={dept.key}>
                    {dept.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Input
              label="Posición/Cargo"
              placeholder="Ej: Agente Senior, Manager de Ventas"
              startContent={<Building size={16} />}
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
            />

            <Input
              label="Tasa de Comisión (%)"
              placeholder="5"
              type="number"
              min="0"
              max="100"
              startContent={<Percent size={16} />}
              value={formData.commissionRate.toString()}
              onChange={(e) => handleInputChange('commissionRate', parseFloat(e.target.value) || 0)}
              isInvalid={!!errors.commissionRate}
              errorMessage={errors.commissionRate}
            />
          </div>

          <Divider />

          {/* Configuración */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuración</h3>

            <div className="flex flex-col gap-4">
              <Switch
                isSelected={formData.isActive}
                onValueChange={(value) => handleInputChange('isActive', value)}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Usuario Activo</span>
                  <span className="text-xs text-muted-foreground">
                    El usuario puede acceder al sistema
                  </span>
                </div>
              </Switch>

              <Switch
                isSelected={formData.isEmailVerified}
                onValueChange={(value) => handleInputChange('isEmailVerified', value)}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Email Verificado</span>
                  <span className="text-xs text-muted-foreground">
                    El email del usuario ha sido verificado
                  </span>
                </div>
              </Switch>
            </div>

            <Textarea
              label="Notas Administrativas"
              placeholder="Notas internas sobre el usuario..."
              startContent={<FileText size={16} />}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              minRows={3}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="light" 
            onPress={onClose}
            isDisabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={loading}
          >
            {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
