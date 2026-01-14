'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Divider,
  Tabs,
  Tab
} from '@heroui/react'
import { ArrowLeft, ArrowRight, Check, Hotel, Plane, Bus, DollarSign, Package } from 'lucide-react'
import { useInventory } from '@/swr'

interface OfferPackageWizardSimpleProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  package?: any
}

export default function OfferPackageWizardSimple({ 
  isOpen, 
  onClose, 
  onSubmit, 
  package: packageData 
}: OfferPackageWizardSimpleProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Datos del paquete
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [markup, setMarkup] = useState(20)
  
  // Componentes seleccionados
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const [selectedFlights, setSelectedFlights] = useState<any[]>([])
  const [selectedTransports, setSelectedTransports] = useState<any[]>([])
  
  // Cargar inventario
  const { inventory: hotels } = useInventory({ resourceType: 'Hotel', status: 'active', limit: 100 })
  const { inventory: flights } = useInventory({ resourceType: 'Flight', status: 'active', limit: 100 })
  const { inventory: transports } = useInventory({ resourceType: 'Transport', status: 'active', limit: 100 })

  // Calcular fechas automáticamente de los componentes
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
    
    selectedTransports.forEach(t => {
      dates.push(new Date(t.validFrom))
      dates.push(new Date(t.validTo))
    })
    
    if (dates.length === 0) return { validFrom: '', validTo: '' }
    
    const validFrom = new Date(Math.max(...dates.map(d => d.getTime())))
    const validTo = new Date(Math.min(...dates.filter((_, i) => i % 2 === 1).map(d => d.getTime())))
    
    return {
      validFrom: validFrom.toISOString().split('T')[0],
      validTo: validTo.toISOString().split('T')[0]
    }
  }

  // Calcular precio total
  const calculateTotalCost = () => {
    let total = 0
    
    if (selectedHotel) {
      const nights = 4 // Por defecto
      const costPerNight = selectedHotel.pricing?.priceAdult || 0
      total += costPerNight * nights
    }
    
    selectedFlights.forEach(f => {
      total += f.pricing?.adult?.cost || 0
    })
    
    selectedTransports.forEach(t => {
      total += t.pricing?.cost || 0
    })
    
    const totalWithMarkup = total * (1 + markup / 100)
    
    return {
      cost: total,
      selling: totalWithMarkup,
      perPerson: totalWithMarkup / 2 // Asumiendo 2 personas
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const dates = calculateDates()
      const pricing = calculateTotalCost()
      
      // Generar código automático
      const code = `PKG-${Date.now().toString().slice(-6)}`
      
      // Extraer destino del hotel
      const destination = {
        city: selectedHotel?.resource?.location?.city || 'Destino',
        country: selectedHotel?.resource?.location?.country || 'País'
      }
      
      const data = {
        name,
        code,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        destination,
        duration: { days: 5, nights: 4 }, // Por defecto
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
          
          activities: []
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
        
        included: [
          'Alojamiento',
          'Vuelos',
          'Traslados'
        ],
        notIncluded: [
          'Comidas no especificadas',
          'Gastos personales'
        ],
        
        policies: {
          cancellation: 'Cancelación gratuita hasta 7 días antes',
          payment: 'Pago 50% al reservar, 50% antes del viaje'
        },
        
        images: selectedHotel?.resource?.photos || [],
        features: {
          includesFlights: selectedFlights.length > 0,
          includesTransfers: selectedTransports.length > 0,
          allInclusive: false,
          familyFriendly: true,
          petFriendly: false
        },
        
        featured: false,
        tags: [],
        status: 'draft'
      }
      
      await onSubmit(data)
      handleClose()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setName('')
    setDescription('')
    setMarkup(20)
    setSelectedHotel(null)
    setSelectedFlights([])
    setSelectedTransports([])
    onClose()
  }

  const pricing = calculateTotalCost()
  const dates = calculateDates()

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
                {packageData ? 'Editar Paquete' : 'Crear Paquete Turístico'}
              </h2>
              <p className="text-sm text-default-500 font-normal">
                Paso {step} de 2
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="p-6">
          {step === 1 ? (
            // PASO 1: Seleccionar Componentes
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Selecciona los Servicios del Paquete</h3>
                <p className="text-sm text-default-500">
                  Elige hotel, vuelos y transportes desde tu inventario
                </p>
              </div>

              <Tabs color="primary" variant="underlined">
                {/* Hotel */}
                <Tab 
                  key="hotel" 
                  title={
                    <div className="flex items-center gap-2">
                      <Hotel size={18} />
                      <span>Hotel {selectedHotel && '✓'}</span>
                    </div>
                  }
                >
                  <div className="space-y-3 mt-4 max-h-96 overflow-y-auto">
                    {selectedHotel && (
                      <Card className="border-2 border-success">
                        <CardBody className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <Chip size="sm" color="success" variant="flat" className="mb-2">Seleccionado</Chip>
                              <p className="font-semibold">{selectedHotel.resource?.name}</p>
                              <p className="text-sm text-default-500">{selectedHotel.inventoryName}</p>
                              <p className="text-xs text-default-400 mt-1">
                                ${selectedHotel.pricing?.priceAdult}/noche • {selectedHotel.configuration?.plan}
                              </p>
                            </div>
                            <Button size="sm" color="danger" variant="light" onPress={() => setSelectedHotel(null)}>
                              Quitar
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                    
                    {hotels.map((hotel: any) => (
                      <Card 
                        key={hotel._id} 
                        isPressable 
                        onPress={() => setSelectedHotel(hotel)}
                        className={selectedHotel?._id === hotel._id ? 'hidden' : ''}
                      >
                        <CardBody className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{hotel.resource?.name || 'Hotel'}</p>
                              <p className="text-xs text-default-500">{hotel.inventoryName}</p>
                              <p className="text-xs text-default-400 mt-1">
                                Plan: {hotel.configuration?.plan} • Vigencia: {new Date(hotel.validFrom).toLocaleDateString()} - {new Date(hotel.validTo).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-success">${hotel.pricing?.priceAdult || 0}</p>
                              <p className="text-xs text-default-500">por noche</p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </Tab>

                {/* Vuelos */}
                <Tab 
                  key="flights" 
                  title={
                    <div className="flex items-center gap-2">
                      <Plane size={18} />
                      <span>Vuelos ({selectedFlights.length})</span>
                    </div>
                  }
                >
                  <div className="space-y-3 mt-4 max-h-96 overflow-y-auto">
                    {selectedFlights.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-semibold">Seleccionados:</p>
                        {selectedFlights.map((flight, idx) => (
                          <Card key={idx} className="border-2 border-success">
                            <CardBody className="p-3 flex flex-row items-center justify-between">
                              <div>
                                <Chip size="sm" variant="flat">{flight.configuration?.flightType}</Chip>
                                <p className="text-sm font-semibold mt-1">{flight.inventoryName}</p>
                              </div>
                              <Button 
                                size="sm" 
                                color="danger" 
                                variant="light"
                                onPress={() => setSelectedFlights(selectedFlights.filter((_, i) => i !== idx))}
                              >
                                Quitar
                              </Button>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    {flights.map((flight: any) => (
                      <Card 
                        key={flight._id} 
                        isPressable 
                        onPress={() => {
                          if (!selectedFlights.find(f => f._id === flight._id)) {
                            setSelectedFlights([...selectedFlights, flight])
                          }
                        }}
                      >
                        <CardBody className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">{flight.inventoryName}</p>
                              <p className="text-xs text-default-500">
                                Clase: {flight.configuration?.class} • Tipo: {flight.configuration?.flightType}
                              </p>
                            </div>
                            <p className="font-bold text-success">${flight.pricing?.adult?.cost || 0}</p>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </Tab>

                {/* Transportes */}
                <Tab 
                  key="transports" 
                  title={
                    <div className="flex items-center gap-2">
                      <Bus size={18} />
                      <span>Transportes ({selectedTransports.length})</span>
                    </div>
                  }
                >
                  <div className="space-y-3 mt-4 max-h-96 overflow-y-auto">
                    {selectedTransports.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-semibold">Seleccionados:</p>
                        {selectedTransports.map((transport, idx) => (
                          <Card key={idx} className="border-2 border-success">
                            <CardBody className="p-3 flex flex-row items-center justify-between">
                              <p className="text-sm font-semibold">{transport.inventoryName}</p>
                              <Button 
                                size="sm" 
                                color="danger" 
                                variant="light"
                                onPress={() => setSelectedTransports(selectedTransports.filter((_, i) => i !== idx))}
                              >
                                Quitar
                              </Button>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    {transports.map((transport: any) => (
                      <Card 
                        key={transport._id} 
                        isPressable 
                        onPress={() => {
                          if (!selectedTransports.find(t => t._id === transport._id)) {
                            setSelectedTransports([...selectedTransports, transport])
                          }
                        }}
                      >
                        <CardBody className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">{transport.inventoryName}</p>
                              <p className="text-xs text-default-500">
                                Tipo: {transport.configuration?.serviceType}
                              </p>
                            </div>
                            <p className="font-bold text-success">${transport.pricing?.cost || 0}</p>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </Tab>
              </Tabs>

              {/* Resumen */}
              {selectedHotel && (
                <Card className="bg-primary/5">
                  <CardBody className="space-y-2">
                    <p className="text-sm font-semibold">Resumen de Componentes</p>
                    <div className="space-y-1 text-sm">
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
                      <Divider className="my-2" />
                      <div className="flex justify-between text-base">
                        <span className="font-semibold">Costo Total:</span>
                        <span className="font-bold text-primary">${pricing.cost.toFixed(2)}</span>
                      </div>
                      {dates.validFrom && (
                        <p className="text-xs text-default-500 mt-2">
                          Vigencia automática: {dates.validFrom} al {dates.validTo}
                        </p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          ) : (
            // PASO 2: Configurar Paquete
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Configura tu Paquete</h3>
                <p className="text-sm text-default-500">
                  Información básica y pricing
                </p>
              </div>

              <Input
                label="Nombre del Paquete"
                placeholder="Ej: Cancún Todo Incluido 5D/4N"
                value={name}
                onValueChange={setName}
                isRequired
                size="lg"
              />

              <Textarea
                label="Descripción"
                placeholder="Describe el paquete..."
                value={description}
                onValueChange={setDescription}
                minRows={3}
              />

              <Card>
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-primary" />
                    <h4 className="font-semibold">Pricing</h4>
                  </div>

                  <Input
                    type="number"
                    label="Markup (%)"
                    value={markup.toString()}
                    onValueChange={(v) => setMarkup(parseFloat(v) || 0)}
                    endContent={<span className="text-default-400">%</span>}
                    className="max-w-xs"
                  />

                  <div className="bg-default-100 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Costo Total:</span>
                      <span className="font-semibold">${pricing.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Markup ({markup}%):</span>
                      <span className="font-semibold text-warning">+${(pricing.selling - pricing.cost).toFixed(2)}</span>
                    </div>
                    <Divider />
                    <div className="flex justify-between">
                      <span className="font-semibold">Precio de Venta:</span>
                      <span className="font-bold text-xl text-success">${pricing.selling.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-default-500">Por Persona (2 pax):</span>
                      <span className="font-semibold text-success">${pricing.perPerson.toFixed(2)}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="border-t">
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button
                  variant="light"
                  onPress={() => setStep(step - 1)}
                  startContent={<ArrowLeft size={18} />}
                >
                  Atrás
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="light" onPress={handleClose}>
                Cancelar
              </Button>
              
              {step < 2 ? (
                <Button
                  color="primary"
                  onPress={() => setStep(2)}
                  endContent={<ArrowRight size={18} />}
                  isDisabled={!selectedHotel}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  startContent={<Check size={18} />}
                  isDisabled={!name}
                >
                  Crear Paquete
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
