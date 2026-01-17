'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardBody, Button, Input, Select, SelectItem, Radio, RadioGroup, Divider, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react'
import { ArrowLeft, Lock, CreditCard, User, Mail, Phone, MapPin, Calendar, Users, CheckCircle2, AlertCircle, ShoppingBag, Upload, FileText, X, PartyPopper, Star } from 'lucide-react'
import { SearchLayout } from '@/components/layout/SearchLayout'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Parámetros de la URL
  const type = searchParams.get('type') || 'package' // 'package' | 'flight' | 'hotel'
  const itemId = searchParams.get('id')
  const adults = parseInt(searchParams.get('adults') || '2')
  const children = parseInt(searchParams.get('children') || '0')
  const infants = parseInt(searchParams.get('infants') || '0')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const roomIndex = parseInt(searchParams.get('roomIndex') || '0')
  const occupancy = searchParams.get('occupancy') || 'double'
  const totalPrice = parseFloat(searchParams.get('totalPrice') || '0')
  
  // Parsear roomReservations para hoteles con múltiples habitaciones
  const roomReservationsParam = searchParams.get('roomReservations')
  const roomReservations = (() => {
    if (!roomReservationsParam) return []
    try {
      const parsed = JSON.parse(roomReservationsParam)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()
  
  // Estados
  const [item, setItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1) // 1: Pasajeros, 2: Contacto, 3: Pago
  const [paymentMethod, setPaymentMethod] = useState('reserve') // 'paypal' | 'card' | 'reserve'
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingNumber?: string; error?: string } | null>(null)
  
  // Datos del formulario
  const [passengers, setPassengers] = useState<any[]>([])
  const [passportFiles, setPassportFiles] = useState<{[key: number]: File | null}>({})
  const [passportPreviews, setPassportPreviews] = useState<{[key: number]: string}>({})
  const [passportDataUrls, setPassportDataUrls] = useState<{[key: number]: string}>({})
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    country: 'México',
    city: ''
  })
  
  // Cargar datos del item
  useEffect(() => {
    async function loadItem() {
      if (!itemId) {
        console.log('No itemId provided')
        setIsLoading(false)
        return
      }
      
      try {
        let endpoint = ''
        if (type === 'package') endpoint = `/api/public/booking/packages/${itemId}`
        if (type === 'hotel') endpoint = `/api/public/booking/hotels/${itemId}`
        if (type === 'flight') endpoint = `/api/public/booking/flights/${itemId}`
        
        if (!endpoint) {
          console.error('Tipo de item no válido:', type)
          setIsLoading(false)
          return
        }
        
        console.log('Fetching from:', endpoint)
        const res = await fetch(endpoint, { cache: 'no-store' })
        const data = await res.json()
        
        console.log('Response data:', data)
        
        if (data.success && data.data) {
          setItem(data.data)
          
          // Inicializar array de pasajeros
          const totalPassengers = adults + children + infants
          const initialPassengers = Array.from({ length: totalPassengers }, (_, i) => ({
            type: i < adults ? 'adult' : i < adults + children ? 'child' : 'infant',
            fullName: '',
            dateOfBirth: '',
            passport: '',
            nationality: 'México'
          }))
          setPassengers(initialPassengers)
        } else {
          console.error('Item not found or invalid response:', data)
        }
      } catch (error) {
        console.error('Error loading item:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadItem()
  }, [itemId, type, adults, children, infants])
  
  // Calcular precio total
  const calculateTotal = () => {
    // Si viene totalPrice desde el booking, usarlo directamente
    // Esto asegura que el precio sea exactamente el mismo que vio el usuario
    if (totalPrice && totalPrice > 0) {
      return totalPrice
    }
    
    // Fallback: calcular si no viene totalPrice (compatibilidad con flujos antiguos)
    if (!item) return 0
    
    if (type === 'package') {
      const adultPrice = (item.pricing?.sellingPricePerPerson?.double || 0) * adults
      const childPrice = ((item.pricing?.sellingPricePerPerson?.child || item.pricing?.sellingPricePerPerson?.double * 0.7) || 0) * children
      const infantPrice = (((item.pricing?.sellingPricePerPerson?.child || 0) * 0.5) || 0) * infants
      return adultPrice + childPrice + infantPrice
    }
    
    return 0
  }
  
  const total = calculateTotal()
  
  // Validar paso actual
  const validateStep = (step: number) => {
    if (step === 1) {
      // Validar que todos los pasajeros tengan datos completos
      return passengers.every((p, idx) => p.fullName && p.dateOfBirth && p.passport && !!passportDataUrls[idx])
    }
    if (step === 2) {
      // Validar datos de contacto
      return contactInfo.email && contactInfo.phone && contactInfo.city
    }
    return true
  }
  
  // Procesar pago/reserva
  const handleSubmit = async () => {
    if (!validateStep(3)) return
    
    setIsProcessing(true)
    
    try {
      const passengersWithDocs = passengers.map((p: any, idx: number) => ({
        ...p,
        passportPhoto: passportDataUrls[idx] || undefined
      }))

      // Preparar datos adicionales según el tipo
      let additionalData: any = {}
      
      if (type === 'hotel' && item) {
        const hotelItem = item.items?.[0]
        const selectedRoom = hotelItem?.selectedRooms?.[roomIndex]
        additionalData = {
          itemName: hotelItem?.hotelInfo?.name || item.name || 'Hotel',
          roomName: selectedRoom?.name || 'Habitación',
          endDate
        }
      } else if (type === 'package' && item) {
        const packageHotelItem = item.items?.find((it: any) => it.resourceType === 'Hotel') || item.items?.[0]
        const loc = packageHotelItem?.hotelInfo?.location
        const destinationString = typeof item.destination === 'string'
          ? item.destination
          : [item.destination?.city || loc?.city, item.destination?.country || loc?.country].filter(Boolean).join(', ')

        additionalData = {
          itemName: item.name || 'Paquete',
          destination: destinationString || 'Destino',
          duration: item.duration
        }
      }
      
      // Crear reserva
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          itemId,
          passengers: passengersWithDocs,
          contactInfo,
          pricing: {
            adults,
            children,
            infants,
            total
          },
          startDate,
          endDate,
          roomIndex,
          occupancy,
          roomReservations,
          paymentMethod: 'pending',
          status: 'pending',
          ...additionalData
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setBookingResult({
          success: true,
          bookingNumber: data.bookingNumber
        })
      } else {
        setBookingResult({
          success: false,
          error: data.error || 'Error al crear la reserva'
        })
      }
    } catch (error) {
      console.error('Error processing:', error)
      setBookingResult({
        success: false,
        error: 'Error de conexión. Por favor intenta nuevamente.'
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }
  
  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No se encontró el item solicitado</p>
          <Button color="primary" onPress={() => router.back()} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <SearchLayout moduleTitle="Checkout" moduleIcon={<ShoppingBag size={24} />}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="light"
            startContent={<ArrowLeft size={20} />}
            onPress={() => router.back()}
            className="mb-4"
          >
            Volver
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Lock size={24} className="text-green-600" />
            <h1 className="text-3xl font-bold">Checkout Seguro</h1>
          </div>
          <p className="text-gray-600">Completa tu reserva de forma segura</p>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: 'Pasajeros' },
              { num: 2, label: 'Contacto' },
              { num: 3, label: 'Pago' }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep >= step.num 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.num ? <CheckCircle2 size={20} /> : step.num}
                  </div>
                  <span className="text-xs mt-1 font-medium">{step.label}</span>
                </div>
                {idx < 2 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step.num ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Layout de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Resumen */}
          <div className="lg:col-span-2 space-y-6">
            {/* Paso 1: Datos de pasajeros */}
            {currentStep === 1 && (
              <Card>
                <CardBody className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Users size={24} className="text-primary" />
                    Datos de los Pasajeros
                  </h2>
                  
                  <div className="space-y-6">
                    {passengers.map((passenger, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-4 text-primary">
                          {passenger.type === 'adult' ? 'Adulto' : passenger.type === 'child' ? 'Niño' : 'Infante'} {idx + 1}
                        </h3>
                        
                        {/* Layout de 2 columnas: Datos (2/3) | Pasaporte (1/3) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Columna izquierda - Datos del pasajero (2/3) */}
                          <div className="lg:col-span-2 space-y-4">
                            <Input
                              label="Nombre Completo"
                              placeholder="Juan Carlos García López"
                              value={passenger.fullName}
                              onValueChange={(val) => {
                                const newPassengers = [...passengers]
                                newPassengers[idx].fullName = val
                                setPassengers(newPassengers)
                              }}
                              startContent={<User size={18} />}
                              isRequired
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input
                                type="date"
                                label="Fecha de Nacimiento"
                                value={passenger.dateOfBirth}
                                onValueChange={(val) => {
                                  const newPassengers = [...passengers]
                                  newPassengers[idx].dateOfBirth = val
                                  setPassengers(newPassengers)
                                }}
                                startContent={<Calendar size={18} />}
                                isRequired
                              />
                              <Input
                                label="Número de Pasaporte"
                                placeholder="A12345678"
                                value={passenger.passport}
                                onValueChange={(val) => {
                                  const newPassengers = [...passengers]
                                  newPassengers[idx].passport = val
                                  setPassengers(newPassengers)
                                }}
                                startContent={<FileText size={18} />}
                                isRequired
                              />
                            </div>
                          </div>
                          
                          {/* Columna derecha - Upload y preview del pasaporte (1/3) */}
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Foto del Pasaporte *
                            </label>
                            
                            {/* Vista previa si hay imagen */}
                            {passportPreviews[idx] ? (
                              <div className="space-y-2">
                                <div 
                                  className="relative h-40 rounded-lg overflow-hidden border-2 border-primary cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setSelectedImageModal(passportPreviews[idx])}
                                >
                                  <img 
                                    src={passportPreviews[idx]} 
                                    alt="Vista previa del pasaporte"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                                      <span className="text-xs font-semibold text-gray-700">Ver grande</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Botón para cambiar imagen */}
                                <label className="cursor-pointer">
                                  <div className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors bg-white hover:bg-gray-50">
                                    <Upload size={16} className="text-gray-400" />
                                    <span className="text-xs text-gray-600">Cambiar</span>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        setPassportFiles({ ...passportFiles, [idx]: file })

                                        const reader = new FileReader()
                                        reader.onloadend = () => {
                                          const result = reader.result as string
                                          setPassportDataUrls({ ...passportDataUrls, [idx]: result })
                                          if (file.type.startsWith('image/')) {
                                            setPassportPreviews({ ...passportPreviews, [idx]: result })
                                          }
                                        }
                                        reader.readAsDataURL(file)
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            ) : (
                              /* Área de upload inicial */
                              <label className="cursor-pointer block">
                                <div className="h-40 flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors bg-white hover:bg-gray-50">
                                  <Upload size={28} className="text-gray-400" />
                                  <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700">Subir foto</p>
                                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, PDF</p>
                                    <p className="text-xs text-gray-400">Máx. 5MB</p>
                                  </div>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      setPassportFiles({ ...passportFiles, [idx]: file })

                                      const reader = new FileReader()
                                      reader.onloadend = () => {
                                        const result = reader.result as string
                                        setPassportDataUrls({ ...passportDataUrls, [idx]: result })
                                        if (file.type.startsWith('image/')) {
                                          setPassportPreviews({ ...passportPreviews, [idx]: result })
                                        }
                                      }
                                      reader.readAsDataURL(file)
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button
                      color="primary"
                      size="lg"
                      onPress={() => {
                        if (validateStep(1)) setCurrentStep(2)
                      }}
                      isDisabled={!validateStep(1)}
                    >
                      Continuar
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
            
            {/* Paso 2: Datos de contacto */}
            {currentStep === 2 && (
              <Card>
                <CardBody className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Mail size={24} className="text-primary" />
                    Información de Contacto
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="email"
                      label="Email"
                      placeholder="tu@email.com"
                      value={contactInfo.email}
                      onValueChange={(val) => setContactInfo({ ...contactInfo, email: val })}
                      startContent={<Mail size={18} />}
                      isRequired
                    />
                    <Input
                      type="tel"
                      label="Teléfono"
                      placeholder="+52 123 456 7890"
                      value={contactInfo.phone}
                      onValueChange={(val) => setContactInfo({ ...contactInfo, phone: val })}
                      startContent={<Phone size={18} />}
                      isRequired
                    />
                    <Input
                      label="País"
                      value={contactInfo.country}
                      onValueChange={(val) => setContactInfo({ ...contactInfo, country: val })}
                      startContent={<MapPin size={18} />}
                      isRequired
                    />
                    <Input
                      label="Ciudad"
                      placeholder="Ciudad de México"
                      value={contactInfo.city}
                      onValueChange={(val) => setContactInfo({ ...contactInfo, city: val })}
                      startContent={<MapPin size={18} />}
                      isRequired
                    />
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="bordered"
                      onPress={() => setCurrentStep(1)}
                    >
                      Atrás
                    </Button>
                    <Button
                      color="primary"
                      size="lg"
                      onPress={() => {
                        if (validateStep(2)) setCurrentStep(3)
                      }}
                      isDisabled={!validateStep(2)}
                    >
                      Continuar
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
            
            {/* Paso 3: Método de pago */}
            {currentStep === 3 && (
              <Card>
                <CardBody className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CreditCard size={24} className="text-primary" />
                    Método de Pago
                  </h2>
                  
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="gap-4"
                  >
                    <Radio value="reserve" description="Un agente se pondrá en contacto contigo para completar el pago">
                      <div className="flex items-center gap-2">
                        <User size={20} />
                        <span className="font-semibold">Reservar (Pago posterior con agente)</span>
                      </div>
                    </Radio>
                    
                    <Radio value="paypal" description="Paga de forma segura con tu cuenta PayPal" isDisabled>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">PayPal</span>
                        <Chip size="sm" color="warning">Próximamente</Chip>
                      </div>
                    </Radio>
                    
                    <Radio value="card" description="Visa, Mastercard, American Express" isDisabled>
                      <div className="flex items-center gap-2">
                        <CreditCard size={20} />
                        <span className="font-semibold">Tarjeta de Crédito/Débito</span>
                        <Chip size="sm" color="warning">Próximamente</Chip>
                      </div>
                    </Radio>
                  </RadioGroup>
                  
                  {paymentMethod === 'reserve' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Nota:</strong> Al confirmar tu reserva, recibirás un email de confirmación. 
                        Uno de nuestros agentes se pondrá en contacto contigo en las próximas 24 horas 
                        para completar el proceso de pago y confirmar todos los detalles de tu viaje.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="bordered"
                      onPress={() => setCurrentStep(2)}
                    >
                      Atrás
                    </Button>
                    <Button
                      color="primary"
                      size="lg"
                      onPress={handleSubmit}
                      isLoading={isProcessing}
                    >
                      {paymentMethod === 'reserve' ? 'Confirmar Reserva' : 'Proceder al Pago'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
          
          {/* Columna derecha - Resumen del pedido (sticky) */}
          <div>
            <Card className="sticky top-24">
              <CardBody className="p-6">
                <h3 className="font-bold text-lg mb-4">Resumen de tu Reserva</h3>
                
                {type === 'package' && (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Paquete</p>
                      <p className="font-bold">{item.name}</p>
                    </div>
                    
                    <Divider className="my-4" />
                    
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const packageHotelItem = item.items?.find((it: any) => it.resourceType === 'Hotel') || item.items?.[0]
                        const loc = packageHotelItem?.hotelInfo?.location
                        const destinationLabel = typeof item.destination === 'string'
                          ? item.destination
                          : [item.destination?.city || loc?.city, item.destination?.country || loc?.country].filter(Boolean).join(', ')

                        return destinationLabel ? (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-primary" />
                            <span>{destinationLabel}</span>
                          </div>
                        ) : null
                      })()}
                      {startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary" />
                          <span>Salida: {new Date(startDate).toLocaleDateString('es-ES')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span>
                          {adults + children + infants} persona{adults + children + infants > 1 ? 's' : ''}
                          {' '}({adults} adulto{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} niño${children > 1 ? 's' : ''}` : ''}{infants > 0 ? `, ${infants} infante${infants > 1 ? 's' : ''}` : ''})
                        </span>
                      </div>
                    </div>

                    {roomReservations.length > 0 && (
                      <>
                        <Divider className="my-4" />
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-700">Habitaciones</p>
                            <Chip size="sm" className="bg-[#0c3f5b] text-white">
                              {roomReservations.length} {roomReservations.length === 1 ? 'habitación' : 'habitaciones'}
                            </Chip>
                          </div>
                          <div className="space-y-2">
                            {roomReservations.map((reservation: any, idx: number) => {
                              const packageHotelItem = item.items?.find((it: any) => it.resourceType === 'Hotel') || item.items?.[0]
                              const room = packageHotelItem?.selectedRooms?.[reservation.roomIndex]
                              if (!room) return null

                              return (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900 text-sm">{room.name}</p>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                        <Users size={12} />
                                        <span>
                                          {reservation.adults} adulto{reservation.adults > 1 ? 's' : ''}
                                          {reservation.children > 0 && `, ${reservation.children} niño${reservation.children > 1 ? 's' : ''}`}
                                          {reservation.infants > 0 && `, ${reservation.infants} infante${reservation.infants > 1 ? 's' : ''}`}
                                        </span>
                                      </div>
                                    </div>
                                    <Chip size="sm" variant="flat" className="text-xs">
                                      {reservation.occupancy === 'single' ? 'Simple' : 
                                       reservation.occupancy === 'double' ? 'Doble' : 
                                       reservation.occupancy === 'triple' ? 'Triple' : 'Cuádruple'}
                                    </Chip>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )}
                    
                    <Divider className="my-4" />
                    
                    <div className="space-y-2">
                      <p className="font-semibold text-sm mb-2">Desglose de Precios</p>
                      {adults > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>{adults} Adulto{adults > 1 ? 's' : ''} × ${(item.pricing?.sellingPricePerPerson?.double || 0).toLocaleString()}</span>
                          <span className="font-semibold">${((item.pricing?.sellingPricePerPerson?.double || 0) * adults).toLocaleString()}</span>
                        </div>
                      )}
                      {children > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>{children} Niño{children > 1 ? 's' : ''} × ${((item.pricing?.sellingPricePerPerson?.child || item.pricing?.sellingPricePerPerson?.double * 0.7) || 0).toLocaleString()}</span>
                          <span className="font-semibold">${(((item.pricing?.sellingPricePerPerson?.child || item.pricing?.sellingPricePerPerson?.double * 0.7) || 0) * children).toLocaleString()}</span>
                        </div>
                      )}
                      {infants > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>{infants} Infante{infants > 1 ? 's' : ''} × ${(((item.pricing?.sellingPricePerPerson?.child || 0) * 0.5) || 0).toLocaleString()}</span>
                          <span className="font-semibold">${((((item.pricing?.sellingPricePerPerson?.child || 0) * 0.5) || 0) * infants).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <Divider className="my-4" />
                    
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-3xl font-black text-primary">${total.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-1">{item.pricing?.currency || 'USD'}</p>
                  </>
                )}
                
                {type === 'hotel' && (
                  <>
                    {/* Nombre del hotel */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{item.name || 'Hotel'}</h3>
                      {item.items?.[0]?.hotelInfo?.stars && (
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < item.items[0].hotelInfo.stars ? "#f1c203" : "none"} className={i < item.items[0].hotelInfo.stars ? "text-[#f1c203]" : "text-gray-300"} />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Divider className="my-4" />
                    
                    {/* Información del servicio */}
                    <div className="space-y-3 text-sm">
                      {/* Habitaciones reservadas */}
                      {roomReservations.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-700">Habitaciones</p>
                            <Chip size="sm" className="bg-[#0c3f5b] text-white">
                              {roomReservations.length} {roomReservations.length === 1 ? 'habitación' : 'habitaciones'}
                            </Chip>
                          </div>
                          <div className="space-y-2">
                            {roomReservations.map((reservation: any, idx: number) => {
                              const room = item.items?.[0]?.selectedRooms?.[reservation.roomIndex]
                              if (!room) return null
                              
                              return (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900 text-sm">{room.name}</p>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                        <Users size={12} />
                                        <span>
                                          {reservation.adults} adulto{reservation.adults > 1 ? 's' : ''}
                                          {reservation.children > 0 && `, ${reservation.children} niño${reservation.children > 1 ? 's' : ''}`}
                                          {reservation.infants > 0 && `, ${reservation.infants} infante${reservation.infants > 1 ? 's' : ''}`}
                                        </span>
                                      </div>
                                    </div>
                                    <Chip size="sm" variant="flat" className="text-xs">
                                      {reservation.occupancy === 'single' ? 'Simple' : 
                                       reservation.occupancy === 'double' ? 'Doble' : 
                                       reservation.occupancy === 'triple' ? 'Triple' : 'Cuádruple'}
                                    </Chip>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Ubicación */}
                      {item.items?.[0]?.hotelInfo?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-primary flex-shrink-0" />
                          <span>
                            {item.items[0].hotelInfo.location.city}, {item.items[0].hotelInfo.location.country}
                          </span>
                        </div>
                      )}
                      
                      {/* Fechas */}
                      {startDate && endDate && (
                        <div className="flex items-start gap-2">
                          <Calendar size={16} className="text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">Check-in: {new Date(startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p className="font-medium">Check-out: {new Date(endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} noche(s)
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Total de huéspedes */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-[#0c3f5b] flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-600">Total de huéspedes</p>
                            <p className="font-semibold text-gray-900">
                              {adults + children + infants} persona{adults + children + infants > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {adults} adulto{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} niño${children > 1 ? 's' : ''}` : ''}{infants > 0 ? `, ${infants} infante${infants > 1 ? 's' : ''}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Divider className="my-4" />
                    
                    {/* Desglose de precio */}
                    <div className="space-y-2">
                      <p className="font-semibold text-sm mb-2">Desglose de Precios</p>
                      <div className="flex justify-between text-sm">
                        <span>Estadía completa</span>
                        <span className="font-semibold">${total.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <Divider className="my-4" />
                    
                    {/* Total */}
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-3xl font-black text-primary">${total.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-1">USD</p>
                  </>
                )}
                
                <div className="mt-6 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lock size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-green-900">
                      <p className="font-semibold mb-1">Pago 100% seguro</p>
                      <p>Tus datos están protegidos con encriptación SSL</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modal para ver imagen del pasaporte en tamaño grande */}
      <Modal 
        isOpen={!!selectedImageModal} 
        onClose={() => setSelectedImageModal(null)}
        size="3xl"
        classNames={{
          base: "bg-transparent shadow-none",
          backdrop: "bg-black/80"
        }}
      >
        <ModalContent>
          <ModalBody className="p-0">
            <div className="relative">
              <img 
                src={selectedImageModal || ''} 
                alt="Pasaporte - Vista ampliada"
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
              <Button
                isIconOnly
                className="absolute top-4 right-4 bg-white/90 hover:bg-white"
                size="sm"
                onPress={() => setSelectedImageModal(null)}
              >
                <X size={20} />
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Modal de confirmación de reserva */}
      <Modal 
        isOpen={!!bookingResult} 
        onClose={() => {
          setBookingResult(null)
          if (bookingResult?.success) {
            router.push('/')
          }
        }}
        size="2xl"
        isDismissable={false}
        hideCloseButton={bookingResult?.success}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {bookingResult?.success ? (
              <div className="flex items-center gap-3">
                <div className="bg-success/10 p-3 rounded-full">
                  <PartyPopper size={32} className="text-success" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-success">¡Reserva Exitosa!</h3>
                  <p className="text-sm text-gray-600 font-normal">Tu reserva ha sido confirmada</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="bg-danger/10 p-3 rounded-full">
                  <AlertCircle size={32} className="text-danger" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-danger">Error en la Reserva</h3>
                  <p className="text-sm text-gray-600 font-normal">No se pudo completar tu reserva</p>
                </div>
              </div>
            )}
          </ModalHeader>
          <ModalBody>
            {bookingResult?.success ? (
              <div className="space-y-4">
                {/* Número de reserva destacado */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Número de Reserva</p>
                  <p className="text-3xl font-bold text-primary font-mono tracking-wider">
                    {bookingResult.bookingNumber}
                  </p>
                </div>
                
                {/* Resumen */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-gray-800">Resumen de tu Reserva</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">{type === 'hotel' ? 'Hotel' : type === 'package' ? 'Paquete' : 'Vuelo'}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pasajeros:</span>
                      <span className="font-medium">{passengers.length} persona{passengers.length > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-lg text-primary">${total.toLocaleString()} USD</span>
                    </div>
                  </div>
                </div>
                
                {/* Próximos pasos */}
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📧 Próximos Pasos</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Recibirás un email de confirmación en {contactInfo.email}</li>
                    <li>• Un agente te contactará en las próximas 24 horas</li>
                    <li>• Coordinaremos el método de pago más conveniente</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
                  <p className="text-danger font-medium">{bookingResult?.error}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">¿Qué puedes hacer?</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Verifica que todos los datos estén correctos</li>
                    <li>• Intenta nuevamente en unos momentos</li>
                    <li>• Si el problema persiste, contáctanos</li>
                  </ul>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {bookingResult?.success ? (
              <Button
                color="primary"
                size="lg"
                className="w-full"
                onPress={() => {
                  setBookingResult(null)
                  router.push('/')
                }}
              >
                Volver al Inicio
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button
                  variant="bordered"
                  className="flex-1"
                  onPress={() => setBookingResult(null)}
                >
                  Cerrar
                </Button>
                <Button
                  color="primary"
                  className="flex-1"
                  onPress={() => {
                    setBookingResult(null)
                    setCurrentStep(1)
                  }}
                >
                  Intentar Nuevamente
                </Button>
              </div>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SearchLayout>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
