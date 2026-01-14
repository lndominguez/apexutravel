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
  Tabs,
  Tab
} from '@heroui/react'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  FileText,
  Percent,
  User
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
  { key: 'pending_approval', label: 'Pendiente de Aprobación' },
  { key: 'active', label: 'Activo' },
  { key: 'inactive', label: 'Inactivo' },
  { key: 'suspended', label: 'Suspendido' }
]

const currencies = [
  { key: 'USD', label: 'USD - Dólar' },
  { key: 'MXN', label: 'MXN - Peso Mexicano' },
  { key: 'EUR', label: 'EUR - Euro' },
  { key: 'CAD', label: 'CAD - Dólar Canadiense' }
]

export function SupplierModal({ isOpen, onClose, onSave, supplier, mode }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    // Información básica
    name: '',
    legalName: '',
    type: 'airline',
    
    // Contacto
    email: '',
    phone: '',
    website: '',
    
    // Dirección
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    
    // Información legal
    taxId: '',
    
    // Términos de pago
    paymentTerms: {
      method: 'prepaid',
      creditDays: 0,
      currency: 'USD'
    },
    
    // Comisiones
    defaultCommission: 0,
    defaultMarkup: 15,
    
    // Políticas
    cancellationPolicy: '',
    refundPolicy: '',
    
    // Estado
    status: 'pending_approval',
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (supplier && mode === 'edit') {
      setFormData({
        name: supplier.name || '',
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
        cancellationPolicy: supplier.cancellationPolicy || '',
        refundPolicy: supplier.refundPolicy || '',
        status: supplier.status || 'pending_approval',
        notes: supplier.notes || ''
      })
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
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
        cancellationPolicy: '',
        refundPolicy: '',
        status: 'pending_approval',
        notes: ''
      })
    }
    setErrors({})
  }, [supplier, mode, isOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.legalName.trim()) newErrors.legalName = 'La razón social es requerida'
    if (!formData.email.trim()) newErrors.email = 'El email es requerido'
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido'
    if (!formData.taxId.trim()) newErrors.taxId = 'El RFC/NIT es requerido'
    if (!formData.address.street.trim()) newErrors.street = 'La dirección es requerida'
    if (!formData.address.city.trim()) newErrors.city = 'La ciudad es requerida'
    if (!formData.address.country.trim()) newErrors.country = 'El país es requerido'

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
      size="3xl"
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
            {mode === 'create' 
              ? 'Registra un nuevo proveedor de servicios turísticos' 
              : 'Actualiza la información del proveedor'}
          </p>
        </ModalHeader>

        <ModalBody>
          <Tabs aria-label="Información del proveedor" variant="underlined">
            {/* Tab 1: Información Básica */}
            <Tab key="basic" title="Información Básica">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre Comercial"
                    placeholder="Ej: Aeroméxico"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    startContent={<Building2 size={18} className="text-muted-foreground" />}
                    isRequired
                    isInvalid={!!errors.name}
                    errorMessage={errors.name}
                  />

                  <Select
                    label="Tipo de Proveedor"
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
                  label="Razón Social"
                  placeholder="Nombre legal de la empresa"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  startContent={<FileText size={18} className="text-muted-foreground" />}
                  isRequired
                  isInvalid={!!errors.legalName}
                  errorMessage={errors.legalName}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="RFC / NIT"
                    placeholder="Identificación fiscal"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    isRequired
                    isInvalid={!!errors.taxId}
                    errorMessage={errors.taxId}
                  />

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

                <Divider className="my-4" />

                <div className="grid grid-cols-2 gap-4">
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
            </Tab>

            {/* Tab 2: Dirección */}
            <Tab key="address" title="Dirección">
              <div className="space-y-4 py-4">
                <Input
                  label="Calle y Número"
                  placeholder="Av. Reforma 123"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
                  })}
                  startContent={<MapPin size={18} className="text-muted-foreground" />}
                  isRequired
                  isInvalid={!!errors.street}
                  errorMessage={errors.street}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ciudad"
                    placeholder="Ciudad de México"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })}
                    isRequired
                    isInvalid={!!errors.city}
                    errorMessage={errors.city}
                  />

                  <Input
                    label="Estado / Provincia"
                    placeholder="CDMX"
                    value={formData.address.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="País"
                    placeholder="México"
                    value={formData.address.country}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, country: e.target.value }
                    })}
                    isRequired
                    isInvalid={!!errors.country}
                    errorMessage={errors.country}
                  />

                  <Input
                    label="Código Postal"
                    placeholder="01000"
                    value={formData.address.postalCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, postalCode: e.target.value }
                    })}
                  />
                </div>
              </div>
            </Tab>

            {/* Tab 3: Términos Comerciales */}
            <Tab key="terms" title="Términos Comerciales">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Método de Pago"
                    selectedKeys={[formData.paymentTerms.method]}
                    onChange={(e) => setFormData({
                      ...formData,
                      paymentTerms: { ...formData.paymentTerms, method: e.target.value as any }
                    })}
                    startContent={<CreditCard size={18} />}
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
                </div>

                <Input
                  label="Días de Crédito"
                  type="number"
                  placeholder="0"
                  value={formData.paymentTerms.creditDays.toString()}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentTerms: { ...formData.paymentTerms, creditDays: parseInt(e.target.value) || 0 }
                  })}
                  description="Días de crédito otorgados por el proveedor"
                />

                <Divider className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Comisión del Proveedor (%)"
                    type="number"
                    placeholder="0"
                    value={formData.defaultCommission.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      defaultCommission: parseFloat(e.target.value) || 0
                    })}
                    startContent={<Percent size={18} className="text-muted-foreground" />}
                    description="% que nos otorga el proveedor"
                  />

                  <Input
                    label="Markup por Defecto (%)"
                    type="number"
                    placeholder="15"
                    value={formData.defaultMarkup.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      defaultMarkup: parseFloat(e.target.value) || 0
                    })}
                    startContent={<Percent size={18} className="text-muted-foreground" />}
                    description="% de ganancia que aplicamos"
                  />
                </div>
              </div>
            </Tab>

            {/* Tab 4: Políticas y Notas */}
            <Tab key="policies" title="Políticas y Notas">
              <div className="space-y-4 py-4">
                <Textarea
                  label="Política de Cancelación"
                  placeholder="Describe la política de cancelación del proveedor..."
                  value={formData.cancellationPolicy}
                  onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                  minRows={3}
                />

                <Textarea
                  label="Política de Reembolso"
                  placeholder="Describe la política de reembolso del proveedor..."
                  value={formData.refundPolicy}
                  onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
                  minRows={3}
                />

                <Textarea
                  label="Notas Internas"
                  placeholder="Notas adicionales sobre el proveedor..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  minRows={4}
                  description="Estas notas son solo para uso interno"
                />
              </div>
            </Tab>
          </Tabs>

          {errors.submit && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
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
            {mode === 'create' ? 'Crear Proveedor' : 'Guardar Cambios'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
