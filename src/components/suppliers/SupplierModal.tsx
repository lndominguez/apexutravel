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
  Divider,
  Chip
} from '@heroui/react'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Percent,
  Image as ImageIcon
} from 'lucide-react'

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (supplierData: any) => Promise<void>
  supplier?: any | null
  mode: 'create' | 'edit'
}

const supplierTypes = [
  { key: 'airline', label: 'Aerolínea' },
  { key: 'hotel_chain', label: 'Cadena Hotelera' },
  { key: 'tour_operator', label: 'Operador Turístico' },
  { key: 'transport_company', label: 'Empresa de Transporte' },
  { key: 'activity_provider', label: 'Proveedor de Actividades' },
  { key: 'insurance_company', label: 'Aseguradora' },
  { key: 'other_agency', label: 'Otra Agencia' }
]

const paymentMethods = [
  { key: 'prepaid', label: 'Prepago' },
  { key: 'credit', label: 'Crédito' },
  { key: 'cash', label: 'Efectivo' },
  { key: 'mixed', label: 'Mixto' }
]

const statuses = [
  { key: 'pending_approval', label: 'Pendiente' },
  { key: 'active', label: 'Activo' },
  { key: 'inactive', label: 'Inactivo' },
  { key: 'suspended', label: 'Suspendido' }
]

const currencies = [
  { key: 'USD', label: 'USD' },
  { key: 'MXN', label: 'MXN' },
  { key: 'EUR', label: 'EUR' },
  { key: 'CAD', label: 'CAD' }
]

export function SupplierModal({ isOpen, onClose, onSave, supplier, mode }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    legalName: '',
    type: 'airline',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    taxId: '',
    paymentTerms: {
      method: 'prepaid',
      creditDays: 0,
      currency: 'USD'
    },
    defaultCommission: 0,
    defaultMarkup: 15,
    status: 'active',
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (supplier && mode === 'edit') {
      setFormData({
        name: supplier.name || '',
        logo: supplier.logo || '',
        legalName: supplier.legalName || '',
        type: supplier.type || 'airline',
        email: supplier.email || '',
        phone: supplier.phone || '',
        website: supplier.website || '',
        address: {
          street: supplier.address?.street || '',
          city: supplier.address?.city || '',
          state: supplier.address?.state || '',
          country: supplier.address?.country || '',
          postalCode: supplier.address?.postalCode || ''
        },
        taxId: supplier.taxId || '',
        paymentTerms: {
          method: supplier.paymentTerms?.method || 'prepaid',
          creditDays: supplier.paymentTerms?.creditDays || 0,
          currency: supplier.paymentTerms?.currency || 'USD'
        },
        defaultCommission: supplier.defaultCommission || 0,
        defaultMarkup: supplier.defaultMarkup || 15,
        status: supplier.status || 'active',
        notes: supplier.notes || ''
      })
    } else {
      setFormData({
        name: '',
        logo: '',
        legalName: '',
        type: 'airline',
        email: '',
        phone: '',
        website: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        },
        taxId: '',
        paymentTerms: {
          method: 'prepaid',
          creditDays: 0,
          currency: 'USD'
        },
        defaultCommission: 0,
        defaultMarkup: 15,
        status: 'active',
        notes: ''
      })
    }
    setErrors({})
  }, [supplier, mode, isOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.email.trim()) newErrors.email = 'El email es requerido'
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error: any) {
      console.error('Error saving supplier:', error)
      setErrors({ submit: error.message || 'Error al guardar proveedor' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
          </h2>
          <p className="text-sm text-muted-foreground font-normal">
            Completa solo la información básica necesaria
          </p>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Información Básica */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Building2 size={16} />
                Información Básica
              </h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Nombre Comercial"
                    placeholder="Ej: Aeroméxico"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isRequired
                    isInvalid={!!errors.name}
                    errorMessage={errors.name}
                  />

                  <Select
                    label="Tipo"
                    selectedKeys={[formData.type]}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    isRequired
                  >
                    {supplierTypes.map((type) => (
                      <SelectItem key={type.key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <Input
                  label="Logo (URL)"
                  placeholder="https://ejemplo.com/logo.png"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  startContent={<ImageIcon size={18} className="text-muted-foreground" />}
                  description="URL del logo del proveedor"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Razón Social"
                    placeholder="Opcional"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    startContent={<FileText size={18} className="text-muted-foreground" />}
                  />

                  <Input
                    label="RFC / NIT"
                    placeholder="Opcional"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>

                <Select
                  label="Estado"
                  selectedKeys={[formData.status]}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {statuses.map((status) => (
                    <SelectItem key={status.key}>
                      {status.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            <Divider />

            {/* Contacto */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Mail size={16} />
                Contacto
              </h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="contacto@proveedor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    startContent={<Mail size={18} className="text-muted-foreground" />}
                    isRequired
                    isInvalid={!!errors.email}
                    errorMessage={errors.email}
                  />

                  <Input
                    label="Teléfono"
                    placeholder="+52 55 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    startContent={<Phone size={18} className="text-muted-foreground" />}
                    isRequired
                    isInvalid={!!errors.phone}
                    errorMessage={errors.phone}
                  />
                </div>

                <Input
                  label="Sitio Web"
                  placeholder="https://www.proveedor.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  startContent={<Globe size={18} className="text-muted-foreground" />}
                />
              </div>
            </div>

            <Divider />

            {/* Ubicación (Opcional) */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin size={16} />
                Ubicación <Chip size="sm" variant="flat">Opcional</Chip>
              </h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Ciudad"
                    placeholder="Ciudad de México"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })}
                  />

                  <Input
                    label="País"
                    placeholder="México"
                    value={formData.address.country}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, country: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            <Divider />

            {/* Términos Comerciales */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Percent size={16} />
                Términos Comerciales
              </h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Select
                    label="Método de Pago"
                    selectedKeys={[formData.paymentTerms.method]}
                    onChange={(e) => setFormData({
                      ...formData,
                      paymentTerms: { ...formData.paymentTerms, method: e.target.value as any }
                    })}
                  >
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.key}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Moneda"
                    selectedKeys={[formData.paymentTerms.currency]}
                    onChange={(e) => setFormData({
                      ...formData,
                      paymentTerms: { ...formData.paymentTerms, currency: e.target.value }
                    })}
                  >
                    {currencies.map((currency) => (
                      <SelectItem key={currency.key}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    label="Días Crédito"
                    type="number"
                    placeholder="0"
                    value={formData.paymentTerms.creditDays.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      paymentTerms: { ...formData.paymentTerms, creditDays: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Comisión (%)"
                    type="number"
                    placeholder="0"
                    value={formData.defaultCommission.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      defaultCommission: parseFloat(e.target.value) || 0
                    })}
                    description="% que nos da"
                  />

                  <Input
                    label="Markup (%)"
                    type="number"
                    placeholder="15"
                    value={formData.defaultMarkup.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      defaultMarkup: parseFloat(e.target.value) || 0
                    })}
                    description="% que aplicamos"
                  />
                </div>
              </div>
            </div>

            <Divider />

            {/* Notas */}
            <Textarea
              label="Notas Internas"
              placeholder="Notas adicionales..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              minRows={3}
            />
          </div>

          {errors.submit && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg mt-4">
              <p className="text-sm text-danger">{errors.submit}</p>
            </div>
          )}
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
            {mode === 'create' ? 'Crear' : 'Guardar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
