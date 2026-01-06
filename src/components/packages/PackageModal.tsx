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
  Tabs,
  Tab,
  Card,
  CardBody,
  Chip,
  Divider
} from '@heroui/react'
import { useFlights, useHotels, useTransports } from '@/swr'

interface PackageFormData {
  name: string
  code: string
  description: string
  destination: string
  duration: {
    days: number
    nights: number
  }
  flights: {
    flight: string
    type: 'outbound' | 'return'
    class: string
    costPrice: number
    sellingPrice: number
  }[]
  hotels: {
    hotel: string
    roomType: string
    plan: string
    nights: number
    costPrice: number
    sellingPrice: number
  }[]
  transports: {
    transport: string
    type: string
    costPrice: number
    sellingPrice: number
  }[]
  inclusions: string[]
  exclusions: string[]
  pricing: {
    costPerPerson: {
      double: number
      single: number
      triple: number
      child: number
    }
    sellingPricePerPerson: {
      double: number
      single: number
      triple: number
      child: number
    }
    currency: string
    markup: number
  }
  itinerary: {
    day: number
    title: string
    description: string
    activities: string[]
  }[]
  policies: {
    cancellation: string
    changes: string
    payment: string
  }
  status: 'draft' | 'active' | 'inactive'
}

interface PackageModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PackageFormData) => Promise<void>
  packageData?: any
  isLoading?: boolean
}

export default function PackageModal({ isOpen, onClose, onSubmit, packageData, isLoading }: PackageModalProps) {
  const { flights } = useFlights({ status: 'active' })
  const { hotels } = useHotels({ status: 'active' })
  const { transports } = useTransports({ status: 'active' })

  const [activeTab, setActiveTab] = useState('basic')
  const [newInclusion, setNewInclusion] = useState('')
  const [newExclusion, setNewExclusion] = useState('')

  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    code: '',
    description: '',
    destination: '',
    duration: {
      days: 3,
      nights: 2
    },
    flights: [],
    hotels: [],
    transports: [],
    inclusions: [],
    exclusions: [],
    pricing: {
      costPerPerson: { double: 0, single: 0, triple: 0, child: 0 },
      sellingPricePerPerson: { double: 0, single: 0, triple: 0, child: 0 },
      currency: 'USD',
      markup: 0
    },
    itinerary: [],
    policies: {
      cancellation: '',
      changes: '',
      payment: ''
    },
    status: 'draft'
  })

  useEffect(() => {
    if (packageData) {
      // Transformar datos de la base de datos al formato del formulario
      const transformedData = {
        name: packageData.name || '',
        code: packageData.code || '',
        description: packageData.description || '',
        destination: typeof packageData.destination === 'string' 
          ? packageData.destination 
          : `${packageData.destination?.city || ''}, ${packageData.destination?.country || ''}`,
        duration: packageData.duration || { days: 3, nights: 2 },
        flights: packageData.components?.flights || packageData.flights || [],
        hotels: packageData.components?.hotels || packageData.hotels || [],
        transports: packageData.components?.transports || packageData.transports || [],
        inclusions: packageData.included || packageData.inclusions || [],
        exclusions: packageData.notIncluded || packageData.exclusions || [],
        pricing: packageData.pricing || {
          costPerPerson: { double: 0, single: 0, triple: 0, child: 0 },
          sellingPricePerPerson: { double: 0, single: 0, triple: 0, child: 0 },
          currency: 'USD',
          markup: 0
        },
        itinerary: packageData.itinerary || [],
        policies: {
          cancellation: packageData.cancellationPolicy || packageData.policies?.cancellation || '',
          changes: packageData.policies?.changes || '',
          payment: packageData.paymentPolicy || packageData.policies?.payment || ''
        },
        status: packageData.status || 'draft'
      }
      setFormData(transformedData)
    } else {
      // Reset form
      setFormData({
        name: '',
        code: '',
        description: '',
        destination: '',
        duration: {
          days: 3,
          nights: 2
        },
        flights: [],
        hotels: [],
        transports: [],
        inclusions: [],
        exclusions: [],
        pricing: {
          costPerPerson: { double: 0, single: 0, triple: 0, child: 0 },
          sellingPricePerPerson: { double: 0, single: 0, triple: 0, child: 0 },
          currency: 'USD',
          markup: 0
        },
        itinerary: [],
        policies: {
          cancellation: '',
          changes: '',
          payment: ''
        },
        status: 'draft'
      })
    }
  }, [packageData, isOpen])

  // Calcular precios por persona automáticamente
  useEffect(() => {
    let baseCost = 0
    let basePrice = 0

    // Sumar vuelos
    formData.flights.forEach(f => {
      baseCost += f.costPrice || 0
      basePrice += f.sellingPrice || 0
    })

    // Sumar hoteles
    formData.hotels.forEach(h => {
      baseCost += (h.costPrice || 0) * h.nights
      basePrice += (h.sellingPrice || 0) * h.nights
    })

    // Sumar transportes
    formData.transports.forEach(t => {
      baseCost += t.costPrice || 0
      basePrice += t.sellingPrice || 0
    })

    // Calcular precios por tipo de ocupación (asumiendo doble como base)
    const markup = formData.pricing.markup || 0
    
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        costPerPerson: {
          double: baseCost,
          single: Math.round(baseCost * 1.5), // Single paga 50% más
          triple: Math.round(baseCost * 0.85), // Triple paga 15% menos
          child: Math.round(baseCost * 0.65) // Niño paga 35% menos
        },
        sellingPricePerPerson: {
          double: basePrice,
          single: Math.round(basePrice * 1.5),
          triple: Math.round(basePrice * 0.85),
          child: Math.round(basePrice * 0.65)
        }
      }
    }))
  }, [formData.flights, formData.hotels, formData.transports, formData.pricing.markup])

  const handleSubmit = async () => {
    // Transformar datos del formulario al formato de la base de datos
    const submitData = {
      ...formData,
      components: {
        flights: formData.flights,
        hotels: formData.hotels,
        transports: formData.transports
      },
      included: formData.inclusions,
      notIncluded: formData.exclusions,
      cancellationPolicy: formData.policies.cancellation,
      paymentPolicy: formData.policies.payment
    }
    
    await onSubmit(submitData)
  }

  const addFlight = () => {
    if (!flights || flights.length === 0) return
    
    const firstFlight = flights[0]
    const defaultClass = firstFlight.classes?.[0]
    
    setFormData({
      ...formData,
      flights: [
        ...formData.flights,
        {
          flight: firstFlight._id,
          type: 'outbound',
          class: defaultClass?.type || 'economy',
          costPrice: defaultClass?.pricing?.adult?.cost || defaultClass?.costPrice || 0,
          sellingPrice: defaultClass?.pricing?.adult?.selling || defaultClass?.sellingPrice || 0
        }
      ]
    })
  }

  const updateFlight = (index: number, field: string, value: any) => {
    const updatedFlights = [...formData.flights]
    
    if (field === 'flight') {
      // Cuando cambia el vuelo, actualizar precios
      const selectedFlight = flights?.find((f: any) => f._id === value)
      if (selectedFlight) {
        const defaultClass = selectedFlight.classes?.[0]
        updatedFlights[index] = {
          ...updatedFlights[index],
          flight: value,
          class: defaultClass?.type || 'economy',
          costPrice: defaultClass?.pricing?.adult?.cost || defaultClass?.costPrice || 0,
          sellingPrice: defaultClass?.pricing?.adult?.selling || defaultClass?.sellingPrice || 0
        }
      }
    } else if (field === 'class') {
      // Cuando cambia la clase, actualizar precios
      const selectedFlight = flights?.find((f: any) => f._id === updatedFlights[index].flight)
      const selectedClass = selectedFlight?.classes?.find((c: any) => c.type === value)
      if (selectedClass) {
        updatedFlights[index] = {
          ...updatedFlights[index],
          class: value,
          costPrice: selectedClass.pricing?.adult?.cost || selectedClass.costPrice || 0,
          sellingPrice: selectedClass.pricing?.adult?.selling || selectedClass.sellingPrice || 0
        }
      }
    } else {
      updatedFlights[index] = {
        ...updatedFlights[index],
        [field]: value
      }
    }
    
    setFormData({ ...formData, flights: updatedFlights })
  }

  const removeFlight = (index: number) => {
    setFormData({
      ...formData,
      flights: formData.flights.filter((_, i) => i !== index)
    })
  }

  const addHotel = () => {
    if (!hotels || hotels.length === 0) return
    
    const firstHotel = hotels[0]
    const defaultRoom = firstHotel.roomTypes?.[0]
    const defaultPlan = defaultRoom?.plans?.[0]
    
    setFormData({
      ...formData,
      hotels: [
        ...formData.hotels,
        {
          hotel: firstHotel._id,
          roomType: defaultRoom?.name || '',
          plan: defaultPlan?.type || 'room_only',
          nights: formData.duration.nights,
          costPrice: defaultPlan?.costPerNight || 0,
          sellingPrice: defaultPlan?.sellingPricePerNight || 0
        }
      ]
    })
  }

  const updateHotel = (index: number, field: string, value: any) => {
    const updatedHotels = [...formData.hotels]
    updatedHotels[index] = {
      ...updatedHotels[index],
      [field]: value
    }
    setFormData({ ...formData, hotels: updatedHotels })
  }

  const removeHotel = (index: number) => {
    setFormData({
      ...formData,
      hotels: formData.hotels.filter((_, i) => i !== index)
    })
  }

  const addTransport = () => {
    if (!transports || transports.length === 0) return
    
    const firstTransport = transports[0]
    
    setFormData({
      ...formData,
      transports: [
        ...formData.transports,
        {
          transport: firstTransport._id,
          type: firstTransport.type,
          costPrice: firstTransport.pricing?.costPrice || 0,
          sellingPrice: firstTransport.pricing?.sellingPrice || 0
        }
      ]
    })
  }

  const updateTransport = (index: number, field: string, value: any) => {
    const updatedTransports = [...formData.transports]
    
    if (field === 'transport') {
      const selectedTransport = transports?.find((t: any) => t._id === value)
      if (selectedTransport) {
        updatedTransports[index] = {
          transport: value,
          type: selectedTransport.type,
          costPrice: selectedTransport.pricing?.costPrice || 0,
          sellingPrice: selectedTransport.pricing?.sellingPrice || 0
        }
      }
    } else {
      updatedTransports[index] = {
        ...updatedTransports[index],
        [field]: value
      }
    }
    
    setFormData({ ...formData, transports: updatedTransports })
  }

  const removeTransport = (index: number) => {
    setFormData({
      ...formData,
      transports: formData.transports.filter((_, i) => i !== index)
    })
  }

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setFormData({
        ...formData,
        inclusions: [...formData.inclusions, newInclusion.trim()]
      })
      setNewInclusion('')
    }
  }

  const removeInclusion = (index: number) => {
    setFormData({
      ...formData,
      inclusions: formData.inclusions.filter((_, i) => i !== index)
    })
  }

  const addExclusion = () => {
    if (newExclusion.trim()) {
      setFormData({
        ...formData,
        exclusions: [...formData.exclusions, newExclusion.trim()]
      })
      setNewExclusion('')
    }
  }

  const removeExclusion = (index: number) => {
    setFormData({
      ...formData,
      exclusions: formData.exclusions.filter((_, i) => i !== index)
    })
  }

  const addItineraryDay = () => {
    setFormData({
      ...formData,
      itinerary: [
        ...formData.itinerary,
        {
          day: formData.itinerary.length + 1,
          title: '',
          description: '',
          activities: []
        }
      ]
    })
  }

  const updateItineraryDay = (index: number, field: string, value: any) => {
    const updatedItinerary = [...formData.itinerary]
    updatedItinerary[index] = {
      ...updatedItinerary[index],
      [field]: value
    }
    setFormData({ ...formData, itinerary: updatedItinerary })
  }

  const removeItineraryDay = (index: number) => {
    setFormData({
      ...formData,
      itinerary: formData.itinerary.filter((_, i) => i !== index)
    })
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          {packageData ? 'Editar Paquete' : 'Nuevo Paquete Turístico'}
        </ModalHeader>
        <ModalBody>
          <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
            {/* Tab 1: Información Básica */}
            <Tab key="basic" title="Información">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre del Paquete"
                    placeholder="Ej: Cancún Todo Incluido 3 Días"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isRequired
                  />
                  <Input
                    label="Código"
                    placeholder="Ej: CUN-3D-2N"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    isRequired
                  />
                </div>

                <Input
                  label="Destino"
                  placeholder="Ej: Cancún, Quintana Roo"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  isRequired
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Días"
                    type="number"
                    min="1"
                    value={formData.duration.days.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      duration: { ...formData.duration, days: parseInt(e.target.value) || 1 }
                    })}
                    isRequired
                  />
                  <Input
                    label="Noches"
                    type="number"
                    min="0"
                    value={formData.duration.nights.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      duration: { ...formData.duration, nights: parseInt(e.target.value) || 0 }
                    })}
                    isRequired
                  />
                </div>

                <Textarea
                  label="Descripción"
                  placeholder="Describe el paquete turístico..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  minRows={4}
                />

                <Select
                  label="Estado"
                  selectedKeys={[formData.status]}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <SelectItem key="draft">Borrador</SelectItem>
                  <SelectItem key="active">Activo</SelectItem>
                  <SelectItem key="inactive">Inactivo</SelectItem>
                </Select>
              </div>
            </Tab>

            {/* Tab 2: Servicios */}
            <Tab key="services" title={`Servicios (${formData.flights.length + formData.hotels.length + formData.transports.length})`}>
              <div className="space-y-6 py-4">
                {/* Vuelos */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Vuelos ({formData.flights.length})</h3>
                    <Button size="sm" color="primary" onPress={addFlight} isDisabled={!flights || flights.length === 0}>
                      + Agregar Vuelo
                    </Button>
                  </div>

                  {formData.flights.length === 0 ? (
                    <Card>
                      <CardBody className="text-center text-gray-500 py-6">
                        No hay vuelos agregados
                      </CardBody>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {formData.flights.map((flight, index) => (
                        <Card key={index}>
                          <CardBody>
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <Select
                                  label="Vuelo"
                                  selectedKeys={flight.flight ? [flight.flight] : []}
                                  onChange={(e) => updateFlight(index, 'flight', e.target.value)}
                                  size="sm"
                                >
                                  {flights?.map((f: any) => (
                                    <SelectItem key={f._id}>
                                      {f.flightNumber} - {typeof f.airline === 'string' ? f.airline : f.airline?.name || 'N/A'}
                                    </SelectItem>
                                  ))}
                                </Select>
                                <Select
                                  label="Tipo"
                                  selectedKeys={[flight.type]}
                                  onChange={(e) => updateFlight(index, 'type', e.target.value)}
                                  size="sm"
                                >
                                  <SelectItem key="outbound">Ida</SelectItem>
                                  <SelectItem key="return">Vuelta</SelectItem>
                                </Select>
                                <Select
                                  label="Clase"
                                  selectedKeys={[flight.class]}
                                  onChange={(e) => updateFlight(index, 'class', e.target.value)}
                                  size="sm"
                                >
                                  <SelectItem key="economy">Economy</SelectItem>
                                  <SelectItem key="business">Business</SelectItem>
                                  <SelectItem key="first">First</SelectItem>
                                </Select>
                              </div>
                              <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                onPress={() => removeFlight(index)}
                              >
                                Eliminar
                              </Button>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              Costo: ${flight.costPrice} | Precio: ${flight.sellingPrice}
                            </p>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <Divider />

                {/* Hoteles */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Hoteles ({formData.hotels.length})</h3>
                    <Button size="sm" color="primary" onPress={addHotel} isDisabled={!hotels || hotels.length === 0}>
                      + Agregar Hotel
                    </Button>
                  </div>

                  {formData.hotels.length === 0 ? (
                    <Card>
                      <CardBody className="text-center text-gray-500 py-6">
                        No hay hoteles agregados
                      </CardBody>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {formData.hotels.map((hotel, index) => (
                        <Card key={index}>
                          <CardBody>
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <Select
                                  label="Hotel"
                                  selectedKeys={hotel.hotel ? [hotel.hotel] : []}
                                  onChange={(e) => updateHotel(index, 'hotel', e.target.value)}
                                  size="sm"
                                >
                                  {hotels?.map((h: any) => (
                                    <SelectItem key={h._id}>
                                      {h.name}
                                    </SelectItem>
                                  ))}
                                </Select>
                                <Input
                                  label="Tipo de Habitación"
                                  value={hotel.roomType}
                                  onChange={(e) => updateHotel(index, 'roomType', e.target.value)}
                                  size="sm"
                                />
                                <Input
                                  label="Noches"
                                  type="number"
                                  min="1"
                                  value={hotel.nights.toString()}
                                  onChange={(e) => updateHotel(index, 'nights', parseInt(e.target.value) || 1)}
                                  size="sm"
                                />
                              </div>
                              <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                onPress={() => removeHotel(index)}
                              >
                                Eliminar
                              </Button>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              Costo/noche: ${hotel.costPrice} | Precio/noche: ${hotel.sellingPrice} | Total: ${hotel.sellingPrice * hotel.nights}
                            </p>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <Divider />

                {/* Transportes */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Transportes ({formData.transports.length})</h3>
                    <Button size="sm" color="primary" onPress={addTransport} isDisabled={!transports || transports.length === 0}>
                      + Agregar Transporte
                    </Button>
                  </div>

                  {formData.transports.length === 0 ? (
                    <Card>
                      <CardBody className="text-center text-gray-500 py-6">
                        No hay transportes agregados
                      </CardBody>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {formData.transports.map((transport, index) => (
                        <Card key={index}>
                          <CardBody>
                            <div className="flex justify-between items-center gap-4">
                              <div className="flex-1">
                                <Select
                                  label="Transporte"
                                  selectedKeys={transport.transport ? [transport.transport] : []}
                                  onChange={(e) => updateTransport(index, 'transport', e.target.value)}
                                  size="sm"
                                >
                                  {transports?.map((t: any) => (
                                    <SelectItem key={t._id}>
                                      {t.name} ({t.type})
                                    </SelectItem>
                                  ))}
                                </Select>
                                <p className="text-xs text-gray-600 mt-2">
                                  Costo: ${transport.costPrice} | Precio: ${transport.sellingPrice}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                onPress={() => removeTransport(index)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Tab>

            {/* Tab 3: Inclusiones/Exclusiones */}
            <Tab key="inclusions" title="Incluye/No Incluye">
              <div className="space-y-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Incluye</h3>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Ej: Desayuno buffet"
                      value={newInclusion}
                      onChange={(e) => setNewInclusion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addInclusion()}
                    />
                    <Button color="primary" onPress={addInclusion}>
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.inclusions.map((item, index) => (
                      <Chip
                        key={index}
                        onClose={() => removeInclusion(index)}
                        variant="flat"
                        color="success"
                      >
                        {item}
                      </Chip>
                    ))}
                  </div>
                </div>

                <Divider />

                <div>
                  <h3 className="text-lg font-semibold mb-3">No Incluye</h3>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Ej: Bebidas alcohólicas"
                      value={newExclusion}
                      onChange={(e) => setNewExclusion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addExclusion()}
                    />
                    <Button color="primary" onPress={addExclusion}>
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.exclusions.map((item, index) => (
                      <Chip
                        key={index}
                        onClose={() => removeExclusion(index)}
                        variant="flat"
                        color="danger"
                      >
                        {item}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </Tab>

            <Tab key="pricing" title="Precios">
              <div className="space-y-4 py-4">
                <Card>
                  <CardBody>
                    <h3 className="text-lg font-semibold mb-4">Precios por Persona</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Costos */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-600">Costos</h4>
                        <div className="flex justify-between text-sm">
                          <span>Doble:</span>
                          <span className="font-semibold">${formData.pricing.costPerPerson.double}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sencilla:</span>
                          <span className="font-semibold">${formData.pricing.costPerPerson.single}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Triple:</span>
                          <span className="font-semibold">${formData.pricing.costPerPerson.triple}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Niño:</span>
                          <span className="font-semibold">${formData.pricing.costPerPerson.child}</span>
                        </div>
                      </div>
                      
                      {/* Precios de Venta */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-600">Precios de Venta</h4>
                        <div className="flex justify-between text-sm">
                          <span>Doble:</span>
                          <span className="font-semibold text-primary">${formData.pricing.sellingPricePerPerson.double}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sencilla:</span>
                          <span className="font-semibold text-primary">${formData.pricing.sellingPricePerPerson.single}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Triple:</span>
                          <span className="font-semibold text-primary">${formData.pricing.sellingPricePerPerson.triple}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Niño:</span>
                          <span className="font-semibold text-primary">${formData.pricing.sellingPricePerPerson.child}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Divider className="my-4" />
                    
                    <div className="flex justify-between text-success">
                      <span className="font-semibold">Ganancia (Doble):</span>
                      <span className="font-bold">${formData.pricing.sellingPricePerPerson.double - formData.pricing.costPerPerson.double}</span>
                    </div>
                  </CardBody>
                </Card>

                <Input
                  label="Markup (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.pricing.markup.toString()}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, markup: parseFloat(e.target.value) || 0 }
                  })}
                />

                <Select
                  label="Moneda"
                  selectedKeys={[formData.pricing.currency]}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, currency: e.target.value }
                  })}
                >
                  <SelectItem key="USD">USD - Dólar Americano</SelectItem>
                  <SelectItem key="MXN">MXN - Peso Mexicano</SelectItem>
                  <SelectItem key="EUR">EUR - Euro</SelectItem>
                </Select>
              </div>
            </Tab>

            {/* Tab 5: Políticas */}
            <Tab key="policies" title="Políticas">
              <div className="space-y-4 py-4">
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

                <Textarea
                  label="Política de Cambios"
                  placeholder="Describe las condiciones para cambios..."
                  value={formData.policies.changes}
                  onChange={(e) => setFormData({
                    ...formData,
                    policies: { ...formData.policies, changes: e.target.value }
                  })}
                  minRows={3}
                />

                <Textarea
                  label="Condiciones de Pago"
                  placeholder="Describe las condiciones de pago..."
                  value={formData.policies.payment}
                  onChange={(e) => setFormData({
                    ...formData,
                    policies: { ...formData.policies, payment: e.target.value }
                  })}
                  minRows={3}
                />
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={
              !formData.name || 
              !formData.destination || 
              (formData.flights.length === 0 && formData.hotels.length === 0 && formData.transports.length === 0)
            }
          >
            {packageData ? 'Actualizar' : 'Crear'} Paquete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
