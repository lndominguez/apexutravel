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
  Divider
} from '@heroui/react'
import { useSuppliers } from '@/swr'

interface TransportFormData {
  supplier: string
  type: 'private_car' | 'shared_shuttle' | 'luxury_van' | 'bus' | 'limousine' | 'helicopter'
  name: string
  description: string
  route: {
    origin: string
    destination: string
    distance: number
    estimatedDuration: number
  }
  capacity: {
    passengers: number
    luggage: number
  }
  features: string[]
  pricing: {
    cost: number
    price: number
    currency: string
  }
  availability: {
    schedule: string
    daysAvailable: string[]
  }
  policies: {
    cancellation: string
    waitTime: number
  }
  status: 'active' | 'inactive' | 'maintenance'
}

interface TransportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TransportFormData) => Promise<void>
  transport?: any
  isLoading?: boolean
}

const TRANSPORT_TYPES = [
  { value: 'private_car', label: 'Auto Privado' },
  { value: 'shared_shuttle', label: 'Shuttle Compartido' },
  { value: 'luxury_van', label: 'Van de Lujo' },
  { value: 'bus', label: 'Autobús' },
  { value: 'limousine', label: 'Limusina' },
  { value: 'helicopter', label: 'Helicóptero' }
]

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
]

export default function TransportModal({ isOpen, onClose, onSubmit, transport, isLoading }: TransportModalProps) {
  const { suppliers } = useSuppliers({ type: 'transport' })

  const [formData, setFormData] = useState<TransportFormData>({
    supplier: '',
    type: 'private_car',
    name: '',
    description: '',
    route: {
      origin: '',
      destination: '',
      distance: 0,
      estimatedDuration: 0
    },
    capacity: {
      passengers: 4,
      luggage: 4
    },
    features: [],
    pricing: {
      cost: 0,
      price: 0,
      currency: 'MXN'
    },
    availability: {
      schedule: '24/7',
      daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    policies: {
      cancellation: '',
      waitTime: 15
    },
    status: 'active'
  })

  useEffect(() => {
    if (transport) {
      setFormData(transport)
    } else {
      // Reset form
      setFormData({
        supplier: '',
        type: 'private_car',
        name: '',
        description: '',
        route: {
          origin: '',
          destination: '',
          distance: 0,
          estimatedDuration: 0
        },
        capacity: {
          passengers: 4,
          luggage: 4
        },
        features: [],
        pricing: {
          cost: 0,
          price: 0,
          currency: 'MXN'
        },
        availability: {
          schedule: '24/7',
          daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        policies: {
          cancellation: '',
          waitTime: 15
        },
        status: 'active'
      })
    }
  }, [transport, isOpen])

  const handleSubmit = async () => {
    await onSubmit(formData)
  }

  const handleCostChange = (cost: number) => {
    const markup = 30 // 30% markup por defecto
    const price = cost * (1 + markup / 100)
    setFormData({
      ...formData,
      pricing: {
        ...formData.pricing,
        cost,
        price
      }
    })
  }

  const calculateProfit = () => {
    const profit = formData.pricing.price - formData.pricing.cost
    const percentage = formData.pricing.cost > 0 
      ? ((profit / formData.pricing.cost) * 100).toFixed(1)
      : '0'
    return { profit, percentage }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          {transport ? 'Editar Transporte' : 'Nuevo Transporte'}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>
              
              <Select
                label="Proveedor"
                placeholder="Selecciona un proveedor"
                selectedKeys={formData.supplier ? [formData.supplier] : []}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                isRequired
              >
                {suppliers?.map((supplier: any) => (
                  <SelectItem key={supplier._id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Tipo de Transporte"
                selectedKeys={[formData.type]}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                isRequired
              >
                {TRANSPORT_TYPES.map((type) => (
                  <SelectItem key={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>

              <Input
                label="Nombre del Servicio"
                placeholder="Ej: Traslado Aeropuerto-Hotel"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />

              <Textarea
                label="Descripción"
                placeholder="Describe el servicio de transporte..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                minRows={3}
              />
            </div>

            <Divider />

            {/* Ruta */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ruta</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Origen"
                  placeholder="Ej: Aeropuerto Internacional"
                  value={formData.route.origin}
                  onChange={(e) => setFormData({
                    ...formData,
                    route: { ...formData.route, origin: e.target.value }
                  })}
                  isRequired
                />
                <Input
                  label="Destino"
                  placeholder="Ej: Hotel Zona Hotelera"
                  value={formData.route.destination}
                  onChange={(e) => setFormData({
                    ...formData,
                    route: { ...formData.route, destination: e.target.value }
                  })}
                  isRequired
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Distancia (km)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.route.distance.toString()}
                  onChange={(e) => setFormData({
                    ...formData,
                    route: { ...formData.route, distance: parseFloat(e.target.value) || 0 }
                  })}
                />
                <Input
                  label="Duración Estimada (minutos)"
                  type="number"
                  min="0"
                  value={formData.route.estimatedDuration.toString()}
                  onChange={(e) => setFormData({
                    ...formData,
                    route: { ...formData.route, estimatedDuration: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>

            <Divider />

            {/* Capacidad */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Capacidad</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Pasajeros"
                  type="number"
                  min="1"
                  value={formData.capacity.passengers.toString()}
                  onChange={(e) => setFormData({
                    ...formData,
                    capacity: { ...formData.capacity, passengers: parseInt(e.target.value) || 1 }
                  })}
                  isRequired
                />
                <Input
                  label="Equipaje (piezas)"
                  type="number"
                  min="0"
                  value={formData.capacity.luggage.toString()}
                  onChange={(e) => setFormData({
                    ...formData,
                    capacity: { ...formData.capacity, luggage: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>

            <Divider />

            {/* Precios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Precios</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Costo del Proveedor"
                  type="number"
                  step="0.01"
                  min="0"
                  startContent="$"
                  value={formData.pricing.cost.toString()}
                  onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
                  isRequired
                />
                <Input
                  label="Precio de Venta"
                  type="number"
                  step="0.01"
                  min="0"
                  startContent="$"
                  value={formData.pricing.price.toString()}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, price: parseFloat(e.target.value) || 0 }
                  })}
                  isRequired
                />
              </div>

              {formData.pricing.cost > 0 && (
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">Ganancia:</span> ${calculateProfit().profit.toFixed(2)} MXN
                    ({calculateProfit().percentage}% markup)
                  </p>
                </div>
              )}
            </div>

            <Divider />

            {/* Disponibilidad */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Disponibilidad</h3>
              
              <Input
                label="Horario"
                placeholder="Ej: 24/7 o 06:00 - 22:00"
                value={formData.availability.schedule}
                onChange={(e) => setFormData({
                  ...formData,
                  availability: { ...formData.availability, schedule: e.target.value }
                })}
              />

              <div>
                <p className="text-sm mb-2">Días Disponibles</p>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      size="sm"
                      variant={formData.availability.daysAvailable.includes(day.value) ? 'solid' : 'bordered'}
                      color={formData.availability.daysAvailable.includes(day.value) ? 'primary' : 'default'}
                      onPress={() => {
                        const days = formData.availability.daysAvailable.includes(day.value)
                          ? formData.availability.daysAvailable.filter(d => d !== day.value)
                          : [...formData.availability.daysAvailable, day.value]
                        setFormData({
                          ...formData,
                          availability: { ...formData.availability, daysAvailable: days }
                        })
                      }}
                    >
                      {day.label.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Divider />

            {/* Políticas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Políticas</h3>
              
              <Input
                label="Tiempo de Espera (minutos)"
                type="number"
                min="0"
                value={formData.policies.waitTime.toString()}
                onChange={(e) => setFormData({
                  ...formData,
                  policies: { ...formData.policies, waitTime: parseInt(e.target.value) || 0 }
                })}
              />

              <Textarea
                label="Política de Cancelación"
                placeholder="Describe las condiciones de cancelación..."
                value={formData.policies.cancellation}
                onChange={(e) => setFormData({
                  ...formData,
                  policies: { ...formData.policies, cancellation: e.target.value }
                })}
                minRows={3}
              />

              <Select
                label="Estado"
                selectedKeys={[formData.status]}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <SelectItem key="active">Activo</SelectItem>
                <SelectItem key="inactive">Inactivo</SelectItem>
                <SelectItem key="maintenance">Mantenimiento</SelectItem>
              </Select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!formData.supplier || !formData.name || !formData.route.origin || !formData.route.destination}
          >
            {transport ? 'Actualizar' : 'Crear'} Transporte
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
