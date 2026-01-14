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
  Textarea,
  Card,
  CardBody,
  Chip,
  Divider,
  Avatar
} from '@heroui/react'
import { 
  Package, 
  MapPin, 
  Calendar,
  Hotel as HotelIcon,
  Plane,
  Activity,
  Bus,
  DollarSign,
  Plus,
  X,
  Check
} from 'lucide-react'
import { useInventory } from '@/swr'

interface OfferPackageModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  package?: any
  isLoading?: boolean
}

export default function OfferPackageModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  package: packageData,
  isLoading 
}: OfferPackageModalProps) {
  
  // TIRILLA SUPERIOR - Información básica del paquete
  const [packageCode, setPackageCode] = useState('')
  const [packageName, setPackageName] = useState('')
  const [description, setDescription] = useState('')
  const [origin, setOrigin] = useState({ city: '', country: '' })
  const [destination, setDestination] = useState({ city: '', country: '' })
  const [creationDate, setCreationDate] = useState(new Date().toISOString().split('T')[0])
  
  // COMPONENTES SELECCIONADOS
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const [selectedFlights, setSelectedFlights] = useState<any[]>([])
  const [selectedTransports, setSelectedTransports] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  
  // PRICING
  const [markup, setMarkup] = useState(20)
  
  // Cargar inventarios
  const { inventory: hotelInventory } = useInventory({ 
    resourceType: 'Hotel', 
    status: 'active',
    limit: 100 
  })
  
  const { inventory: flightInventory } = useInventory({ 
    resourceType: 'Flight', 
    status: 'active',
    limit: 100 
  })
  
  const { inventory: transportInventory } = useInventory({ 
    resourceType: 'Transport', 
    status: 'active',
    limit: 100 
  })

  // Generar código automático
  useEffect(() => {
    if (isOpen && !packageData) {
      const timestamp = Date.now().toString().slice(-6)
      setPackageCode(`PKG-${timestamp}`)
    }
  }, [isOpen, packageData])

  // Cargar datos al editar
  useEffect(() => {
    if (packageData && isOpen) {
      setPackageCode(packageData.code || '')
      setPackageName(packageData.name || '')
      setDescription(packageData.description || '')
      setOrigin(packageData.origin || { city: '', country: '' })
      setDestination(packageData.destination || { city: '', country: '' })
      setMarkup(packageData.pricing?.markup?.value || 20)
    }
  }, [packageData, isOpen])

  // Resetear al cerrar
  useEffect(() => {
    if (!isOpen) {
      setPackageCode('')
      setPackageName('')
      setDescription('')
      setOrigin({ city: '', country: '' })
      setDestination({ city: '', country: '' })
      setCreationDate(new Date().toISOString().split('T')[0])
      setSelectedHotel(null)
      setSelectedFlights([])
      setSelectedTransports([])
      setActivities([])
      setMarkup(20)
    }
  }, [isOpen])

  // Calcular fechas automáticamente
  const calculateDates = () => {
    const dates: Date[] = []
    
    if (selectedHotel) {
      dates.push(new Date(selectedHotel.validFrom))
      dates.push(new Date(selectedHotel.validTo))
    }
    
    selectedFlights.forEach(f => {
      dates.push(new Date(f.validFrom))
      dates.push(new Date(f.validTo))
    })
    
    if (dates.length === 0) return { validFrom: '', validTo: '' }
    
    // validFrom = fecha más reciente de inicio
    // validTo = fecha más temprana de fin
    const validFromDates = dates.filter((_, i) => i % 2 === 0)
    const validToDates = dates.filter((_, i) => i % 2 === 1)
    
    const validFrom = new Date(Math.max(...validFromDates.map(d => d.getTime())))
    const validTo = new Date(Math.min(...validToDates.map(d => d.getTime())))
    
    return {
      validFrom: validFrom.toISOString().split('T')[0],
      validTo: validTo.toISOString().split('T')[0]
    }
  }

  // Calcular precio total
  const calculatePricing = () => {
    let totalCost = 0
    
    // Hotel (4 noches por defecto)
    if (selectedHotel) {
      const nights = 4
      const costPerNight = selectedHotel.pricing?.priceAdult || 0
      totalCost += costPerNight * nights
    }
    
    // Vuelos
    selectedFlights.forEach(f => {
      totalCost += f.pricing?.adult?.cost || 0
    })
    
    // Transportes
    selectedTransports.forEach(t => {
      totalCost += t.pricing?.cost || 0
    })
    
    // Actividades
    activities.forEach(a => {
      totalCost += a.cost || 0
    })
    
    const totalSelling = totalCost * (1 + markup / 100)
    
    return {
      cost: totalCost,
      selling: totalSelling,
      perPerson: totalSelling / 2 // Asumiendo 2 personas
    }
  }

  const handleSubmit = async () => {
    const dates = calculateDates()
    const pricing = calculatePricing()
    
    const data = {
      code: packageCode,
      name: packageName,
      slug: packageName.toLowerCase().replace(/\s+/g, '-'),
      description,
      origin,
      destination,
      duration: { days: 5, nights: 4 },
      category: 'beach',
      
      components: {
        hotel: selectedHotel ? {
          inventoryItems: [{
            inventoryItem: selectedHotel._id,
            isDefault: true,
            label: selectedHotel.inventoryName
          }],
          nights: 4,
          required: true
        } : undefined,
        
        flights: selectedFlights.map(f => ({
          inventoryItem: f._id,
          type: f.configuration?.flightType || 'outbound',
          required: true
        })),
        
        transports: selectedTransports.map(t => ({
          inventoryItem: t._id,
          description: t.inventoryName,
          required: true
        })),
        
        activities
      },
      
      pricing: {
        markup: {
          type: 'percentage',
          value: markup
        },
        baseExample: {
          adults: 2,
          children: 0,
          roomConfig: selectedHotel?.inventoryName || '',
          totalCost: pricing.cost,
          totalSelling: pricing.selling,
          pricePerPerson: pricing.perPerson
        },
        currency: 'USD'
      },
      
      validFrom: dates.validFrom,
      validTo: dates.validTo,
      
      included: ['Alojamiento', 'Traslados'],
      notIncluded: ['Gastos personales'],
      
      policies: {
        cancellation: 'Cancelación gratuita hasta 7 días antes',
        payment: 'Pago 50% al reservar, 50% antes del viaje'
      },
      
      images: selectedHotel?.resource?.photos || [],
      features: {
        includesFlights: selectedFlights.length > 0,
        includesTransfers: selectedTransports.length > 0,
        allInclusive: false,
        familyFriendly: true
      },
      
      status: 'draft'
    }
    
    await onSubmit(data)
  }

  const pricing = calculatePricing()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      isDismissable={false}
    >
      <ModalContent>
        <ModalHeader className="border-b">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-primary" />
            <div>
              <h2 className="text-xl font-bold">
                {packageData ? 'Editar Paquete Turístico' : 'Crear Paquete Turístico'}
              </h2>
              <p className="text-sm text-default-500 font-normal">
                Define los servicios que incluirá tu paquete
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="p-6">
          <div className="space-y-6">
            {/* TIRILLA SUPERIOR - Información Básica */}
            <Card className="bg-default-50">
              <CardBody className="p-4">
                <div className="grid grid-cols-12 gap-4">
                  {/* Origen */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={16} className="text-primary" />
                      <p className="text-sm font-semibold">Origen</p>
                    </div>
                    <Input
                      size="sm"
                      placeholder="Ciudad"
                      value={origin.city}
                      onValueChange={(v) => setOrigin({ ...origin, city: v })}
                      className="mb-2"
                    />
                    <Input
                      size="sm"
                      placeholder="País"
                      value={origin.country}
                      onValueChange={(v) => setOrigin({ ...origin, country: v })}
                    />
                  </div>

                  {/* Destino */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={16} className="text-success" />
                      <p className="text-sm font-semibold">Destino</p>
                    </div>
                    <Input
                      size="sm"
                      placeholder="Ciudad"
                      value={destination.city}
                      onValueChange={(v) => setDestination({ ...destination, city: v })}
                      className="mb-2"
                      isRequired
                    />
                    <Input
                      size="sm"
                      placeholder="País"
                      value={destination.country}
                      onValueChange={(v) => setDestination({ ...destination, country: v })}
                      isRequired
                    />
                  </div>

                  {/* Código y Fecha */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Package size={16} className="text-primary" />
                      <p className="text-sm font-semibold">Código</p>
                    </div>
                    <Input
                      size="sm"
                      value={packageCode}
                      onValueChange={setPackageCode}
                      className="mb-2"
                      isReadOnly
                    />
                    <Input
                      size="sm"
                      type="date"
                      value={creationDate}
                      onValueChange={setCreationDate}
                      startContent={<Calendar size={14} className="text-default-400" />}
                    />
                  </div>

                  {/* Nombre y Descripción */}
                  <div className="col-span-4">
                    <p className="text-sm font-semibold mb-2">Nombre del Paquete</p>
                    <Input
                      size="sm"
                      placeholder="Ej: Cancún Todo Incluido 5D/4N"
                      value={packageName}
                      onValueChange={setPackageName}
                      className="mb-2"
                      isRequired
                    />
                    <Textarea
                      size="sm"
                      placeholder="Descripción breve..."
                      value={description}
                      onValueChange={setDescription}
                      minRows={2}
                      maxRows={2}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* CARDS HORIZONTALES - Componentes */}
            <div className="grid grid-cols-4 gap-4">
              {/* HOTEL */}
              <Card className="hover:shadow-md transition-shadow">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HotelIcon size={20} className="text-primary" />
                      <h3 className="font-semibold">Hotel</h3>
                    </div>
                    {selectedHotel && (
                      <Chip size="sm" color="success" variant="flat">
                        Seleccionado
                      </Chip>
                    )}
                  </div>

                  {selectedHotel ? (
                    <div className="space-y-2">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <p className="text-xs font-semibold">{selectedHotel.resource?.name}</p>
                        <p className="text-xs text-default-500">{selectedHotel.inventoryName}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <DollarSign size={12} className="text-success" />
                          <span className="text-xs font-bold text-success">
                            ${selectedHotel.pricing?.priceAdult || 0}/noche
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="light" 
                        color="danger"
                        fullWidth
                        onPress={() => setSelectedHotel(null)}
                      >
                        Quitar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-default-500 mb-2">
                        Selecciona un hotel del inventario
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {hotelInventory.slice(0, 5).map((hotel: any) => (
                          <button
                            key={hotel._id}
                            onClick={() => setSelectedHotel(hotel)}
                            className="w-full text-left p-2 hover:bg-default-100 rounded-lg transition-colors"
                          >
                            <p className="text-xs font-semibold truncate">{hotel.resource?.name}</p>
                            <p className="text-xs text-default-500 truncate">{hotel.inventoryName}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* VUELOS */}
              <Card className="hover:shadow-md transition-shadow">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Plane size={20} className="text-primary" />
                      <h3 className="font-semibold">Vuelos</h3>
                    </div>
                    <Chip size="sm" variant="flat">
                      {selectedFlights.length}
                    </Chip>
                  </div>

                  {selectedFlights.length > 0 ? (
                    <div className="space-y-2">
                      {selectedFlights.map((flight, idx) => (
                        <div key={idx} className="p-2 bg-primary/10 rounded-lg flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-semibold truncate">{flight.inventoryName}</p>
                            <Chip size="sm" variant="flat" className="mt-1">
                              {flight.configuration?.flightType}
                            </Chip>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => setSelectedFlights(selectedFlights.filter((_, i) => i !== idx))}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-default-500 mb-2">
                        Agrega vuelos (ida/vuelta)
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {flightInventory.slice(0, 5).map((flight: any) => (
                          <button
                            key={flight._id}
                            onClick={() => {
                              if (!selectedFlights.find(f => f._id === flight._id)) {
                                setSelectedFlights([...selectedFlights, flight])
                              }
                            }}
                            className="w-full text-left p-2 hover:bg-default-100 rounded-lg transition-colors"
                          >
                            <p className="text-xs font-semibold truncate">{flight.inventoryName}</p>
                            <Chip size="sm" variant="flat" className="mt-1">
                              {flight.configuration?.flightType}
                            </Chip>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* ACTIVIDADES */}
              <Card className="hover:shadow-md transition-shadow">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity size={20} className="text-primary" />
                      <h3 className="font-semibold">Actividades</h3>
                    </div>
                    <Chip size="sm" variant="flat">
                      {activities.length}
                    </Chip>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-default-500">
                      Agrega actividades opcionales
                    </p>
                    <Button
                      size="sm"
                      variant="flat"
                      fullWidth
                      startContent={<Plus size={14} />}
                      onPress={() => {
                        const name = prompt('Nombre de la actividad:')
                        const cost = prompt('Costo:')
                        if (name && cost) {
                          setActivities([...activities, { name, cost: parseFloat(cost) }])
                        }
                      }}
                    >
                      Agregar
                    </Button>

                    {activities.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {activities.map((activity, idx) => (
                          <div key={idx} className="p-2 bg-warning/10 rounded-lg flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-semibold truncate">{activity.name}</p>
                              <p className="text-xs text-success">${activity.cost}</p>
                            </div>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => setActivities(activities.filter((_, i) => i !== idx))}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* TRANSPORTE */}
              <Card className="hover:shadow-md transition-shadow">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bus size={20} className="text-primary" />
                      <h3 className="font-semibold">Transporte</h3>
                    </div>
                    <Chip size="sm" variant="flat">
                      {selectedTransports.length}
                    </Chip>
                  </div>

                  {selectedTransports.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTransports.map((transport, idx) => (
                        <div key={idx} className="p-2 bg-secondary/10 rounded-lg flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-semibold truncate">{transport.inventoryName}</p>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => setSelectedTransports(selectedTransports.filter((_, i) => i !== idx))}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-default-500 mb-2">
                        Agrega servicios de traslado
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {transportInventory.slice(0, 5).map((transport: any) => (
                          <button
                            key={transport._id}
                            onClick={() => {
                              if (!selectedTransports.find(t => t._id === transport._id)) {
                                setSelectedTransports([...selectedTransports, transport])
                              }
                            }}
                            className="w-full text-left p-2 hover:bg-default-100 rounded-lg transition-colors"
                          >
                            <p className="text-xs font-semibold truncate">{transport.inventoryName}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* RESUMEN Y PRICING */}
            {selectedHotel && (
              <Card className="bg-primary/5">
                <CardBody className="p-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Resumen de Componentes</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Hotel (4 noches):</span>
                          <span className="font-semibold">${(selectedHotel.pricing?.priceAdult || 0) * 4}</span>
                        </div>
                        {selectedFlights.length > 0 && (
                          <div className="flex justify-between">
                            <span>Vuelos ({selectedFlights.length}):</span>
                            <span className="font-semibold">
                              ${selectedFlights.reduce((sum, f) => sum + (f.pricing?.adult?.cost || 0), 0)}
                            </span>
                          </div>
                        )}
                        {selectedTransports.length > 0 && (
                          <div className="flex justify-between">
                            <span>Transportes ({selectedTransports.length}):</span>
                            <span className="font-semibold">
                              ${selectedTransports.reduce((sum, t) => sum + (t.pricing?.cost || 0), 0)}
                            </span>
                          </div>
                        )}
                        {activities.length > 0 && (
                          <div className="flex justify-between">
                            <span>Actividades ({activities.length}):</span>
                            <span className="font-semibold">
                              ${activities.reduce((sum, a) => sum + (a.cost || 0), 0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Pricing</h4>
                      <div className="space-y-2">
                        <Input
                          size="sm"
                          type="number"
                          label="Markup (%)"
                          value={markup.toString()}
                          onValueChange={(v) => setMarkup(parseFloat(v) || 0)}
                          endContent={<span className="text-default-400">%</span>}
                          className="max-w-xs"
                        />
                        
                        <Divider className="my-2" />
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Costo Total:</span>
                            <span className="font-semibold">${pricing.cost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Markup ({markup}%):</span>
                            <span className="font-semibold text-warning">+${(pricing.selling - pricing.cost).toFixed(2)}</span>
                          </div>
                          <Divider className="my-1" />
                          <div className="flex justify-between text-base">
                            <span className="font-semibold">Precio de Venta:</span>
                            <span className="font-bold text-success text-lg">${pricing.selling.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-default-500">
                            <span>Por Persona (2 pax):</span>
                            <span className="font-semibold">${pricing.perPerson.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="border-t">
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!packageName || !selectedHotel}
            startContent={<Check size={18} />}
          >
            {packageData ? 'Actualizar Paquete' : 'Crear Paquete'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
