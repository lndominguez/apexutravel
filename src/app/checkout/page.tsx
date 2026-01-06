'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardBody, Button, Input, Select, SelectItem, Radio, RadioGroup, Divider, Chip } from '@heroui/react'
import { ArrowLeft, Lock, CreditCard, User, Mail, Phone, MapPin, Calendar, Users, CheckCircle2, AlertCircle } from 'lucide-react'
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
  
  // Estados
  const [item, setItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1) // 1: Pasajeros, 2: Contacto, 3: Pago
  const [paymentMethod, setPaymentMethod] = useState('reserve') // 'paypal' | 'card' | 'reserve'
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Datos del formulario
  const [passengers, setPassengers] = useState<any[]>([])
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
        if (type === 'package') endpoint = `/api/public/packages/${itemId}`
        // Agregar más endpoints cuando tengamos flights y hotels
        
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
            firstName: '',
            lastName: '',
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
      return passengers.every(p => p.firstName && p.lastName && p.dateOfBirth)
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
      // Aquí iría la lógica de pago según el método seleccionado
      if (paymentMethod === 'reserve') {
        // Crear reserva sin pago
        const response = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            itemId,
            passengers,
            contactInfo,
            pricing: {
              adults,
              children,
              infants,
              total
            },
            startDate,
            paymentMethod: 'pending',
            status: 'pending'
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          router.push(`/checkout/confirmation/${data.bookingId}`)
        }
      }
      // TODO: Implementar PayPal y tarjeta cuando tengamos las credenciales
    } catch (error) {
      console.error('Error processing:', error)
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
    <SearchLayout moduleTitle="Checkout" moduleIcon="shopping-cart">
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
                        <h3 className="font-semibold mb-3 text-primary">
                          {passenger.type === 'adult' ? 'Adulto' : passenger.type === 'child' ? 'Niño' : 'Infante'} {idx + 1}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Nombre(s)"
                            placeholder="Juan Carlos"
                            value={passenger.firstName}
                            onValueChange={(val) => {
                              const newPassengers = [...passengers]
                              newPassengers[idx].firstName = val
                              setPassengers(newPassengers)
                            }}
                            isRequired
                          />
                          <Input
                            label="Apellido(s)"
                            placeholder="García López"
                            value={passenger.lastName}
                            onValueChange={(val) => {
                              const newPassengers = [...passengers]
                              newPassengers[idx].lastName = val
                              setPassengers(newPassengers)
                            }}
                            isRequired
                          />
                          <Input
                            type="date"
                            label="Fecha de Nacimiento"
                            value={passenger.dateOfBirth}
                            onValueChange={(val) => {
                              const newPassengers = [...passengers]
                              newPassengers[idx].dateOfBirth = val
                              setPassengers(newPassengers)
                            }}
                            isRequired
                          />
                          <Input
                            label="Pasaporte (opcional)"
                            placeholder="A12345678"
                            value={passenger.passport}
                            onValueChange={(val) => {
                              const newPassengers = [...passengers]
                              newPassengers[idx].passport = val
                              setPassengers(newPassengers)
                            }}
                          />
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
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        <span>{item.duration?.days} días / {item.duration?.nights} noches</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        <span>{item.destination?.city}, {item.destination?.country}</span>
                      </div>
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
