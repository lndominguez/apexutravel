'use client'

import { useState } from 'react'
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
  Card,
  CardBody,
  Chip,
  Code,
  Divider
} from '@heroui/react'
import { Mail, Link, Copy, Calendar, User, Building, Briefcase, Check, Send, AlertCircle, CheckCircle } from 'lucide-react'

interface InvitationModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (invitationData: any) => Promise<any>
}

const roles = [
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

export function InvitationModal({ isOpen, onClose, onGenerate }: InvitationModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'agent',
    department: '',
    position: '',
    expiresInDays: 7
  })
  const [loading, setLoading] = useState(false)
  const [generatedInvitation, setGeneratedInvitation] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (formData.expiresInDays < 1 || formData.expiresInDays > 30) {
      newErrors.expiresInDays = 'Los días de expiración deben estar entre 1 y 30'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerate = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      const invitation = await onGenerate(formData)
      setGeneratedInvitation(invitation)
    } catch (error) {
      console.error('Error al generar invitación:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (generatedInvitation?.invitationUrl) {
      try {
        await navigator.clipboard.writeText(generatedInvitation.invitationUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Error al copiar:', error)
      }
    }
  }

  const handleClose = () => {
    setFormData({
      email: '',
      role: 'agent',
      department: '',
      position: '',
      expiresInDays: 7
    })
    setGeneratedInvitation(null)
    setErrors({})
    setCopied(false)
    onClose()
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="xl"
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
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Invitar Nuevo Usuario</h2>
              <p className="text-sm text-muted-foreground">
                Crea y envía una invitación por email automáticamente
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="gap-6">
          {!generatedInvitation ? (
            // Formulario de invitación
            <>
              <div className="space-y-4">
                <Input
                  label="Email del Invitado"
                  placeholder="usuario@empresa.com"
                  type="email"
                  startContent={<Mail size={16} />}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email}
                  isRequired
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Rol Asignado"
                    placeholder="Selecciona un rol"
                    selectedKeys={[formData.role]}
                    onSelectionChange={(keys) => handleInputChange('role', Array.from(keys)[0])}
                    startContent={<User size={16} />}
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
                    startContent={<Building size={16} />}
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
                  startContent={<Briefcase size={16} />}
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                />

                <Input
                  label="Días hasta Expiración"
                  placeholder="7"
                  type="number"
                  min="1"
                  max="30"
                  startContent={<Calendar size={16} />}
                  value={formData.expiresInDays.toString()}
                  onChange={(e) => handleInputChange('expiresInDays', parseInt(e.target.value) || 7)}
                  isInvalid={!!errors.expiresInDays}
                  errorMessage={errors.expiresInDays}
                  description="La invitación expirará después de este número de días"
                />
              </div>
            </>
          ) : (
            // Invitación generada
            <div className="space-y-6">
              <Card className="border-success/20 bg-success/5">
                <CardBody className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-success/10 rounded-lg">
                      {generatedInvitation.emailSent ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-success">¡Invitación Generada!</h3>
                      <p className="text-sm text-success/80">
                        {generatedInvitation.emailSent 
                          ? '✅ Email enviado exitosamente al usuario'
                          : '⚠️ Invitación creada, pero el email no pudo enviarse'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{generatedInvitation.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rol:</span>
                        <Chip size="sm" variant="flat" color="primary">
                          {roles.find(r => r.key === generatedInvitation.role)?.label}
                        </Chip>
                      </div>
                      {generatedInvitation.department && (
                        <div>
                          <span className="text-muted-foreground">Departamento:</span>
                          <p className="font-medium">
                            {departments.find(d => d.key === generatedInvitation.department)?.label}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Expira:</span>
                        <p className="font-medium">
                          {new Date(generatedInvitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Link de Invitación:
                      </label>
                      <div className="flex gap-2">
                        <Code className="flex-1 p-3 text-xs break-all">
                          {generatedInvitation.invitationUrl}
                        </Code>
                        <Button
                          isIconOnly
                          variant="bordered"
                          onPress={handleCopyLink}
                          color={copied ? "success" : "default"}
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </Button>
                      </div>
                      {copied && (
                        <p className="text-xs text-success mt-1">¡Link copiado al portapapeles!</p>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Estado del Email */}
              {generatedInvitation.emailSent ? (
                <Card className="border-success/20 bg-success/5">
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-success/10 rounded">
                        <Send className="h-4 w-4 text-success" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-success mb-1">✅ Email Enviado</p>
                        <p className="text-success/80 text-xs">
                          El usuario recibirá un email con el enlace de invitación y las instrucciones para completar su registro.
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                <Card className="border-warning/20 bg-warning/5">
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-warning/10 rounded">
                        <AlertCircle className="h-4 w-4 text-warning" />
                      </div>
                      <div className="text-sm flex-1">
                        <p className="font-medium text-warning mb-1">⚠️ Email No Enviado</p>
                        <p className="text-warning/80 text-xs mb-2">
                          {generatedInvitation.emailError || 'No se pudo enviar el email automáticamente.'}
                        </p>
                        <p className="text-warning/80 text-xs">
                          <strong>Opciones:</strong> Copia el enlace de abajo y envíalo manualmente al usuario por email o mensaje.
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              <Card className="border-default/20">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-default/10 rounded">
                      <Link className="h-4 w-4 text-default-600" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-default-700 mb-1">Instrucciones:</p>
                      <ul className="text-default-600 space-y-1 text-xs">
                        <li>• El usuario deberá completar su registro usando este link</li>
                        <li>• La invitación expirará automáticamente en la fecha indicada</li>
                        <li>• Solo se puede usar una vez por invitación</li>
                        <li>• Si el email no se envió, comparte el link manualmente</li>
                      </ul>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="light" 
            onPress={handleClose}
            isDisabled={loading}
          >
            {generatedInvitation ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!generatedInvitation && (
            <Button 
              color="primary" 
              onPress={handleGenerate}
              isLoading={loading}
              startContent={<Send size={16} />}
            >
              {loading ? 'Enviando...' : 'Crear y Enviar Invitación'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
