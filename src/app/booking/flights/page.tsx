'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Progress,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Spinner
} from '@heroui/react'
import {
  Plane,
  Check,
  Briefcase,
  Luggage,
  Wifi,
  Utensils,
  Tv,
  Zap,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react'
import { Logo } from '@/components/common/Logo'

type BookingStep = 'class-outbound' | 'extras-outbound' | 'passengers' | 'class-return' | 'extras-return' | 'summary'

export default function FlightBookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState<BookingStep>('class-outbound')
  const [isLoading, setIsLoading] = useState(true)
  const [outboundFlight, setOutboundFlight] = useState<any>(null)
  const [returnFlight, setReturnFlight] = useState<any>(null)
  const [passengers, setPassengers] = useState(1)

  // Estados de la reserva
  const [outboundClass, setOutboundClass] = useState<any>(null)
  const [outboundExtras, setOutboundExtras] = useState<any>(null)
  const [returnClass, setReturnClass] = useState<any>(null)
  const [returnExtras, setReturnExtras] = useState<any>(null)
  const [passengersData, setPassengersData] = useState<any[]>([])
  const [isPricesSummaryOpen, setIsPricesSummaryOpen] = useState(false)

  // Estados para modal con carousel
  const [showClassModal, setShowClassModal] = useState(false)
  const [currentClassIndex, setCurrentClassIndex] = useState(0)
  const [modalFlightType, setModalFlightType] = useState<'outbound' | 'return'>('outbound')

  const passengersCount = useMemo(
    () => parseInt(searchParams.get('passengers') || '1'),
    [searchParams]
  )

  const isRoundtrip = useMemo(
    () => Boolean(searchParams.get('return') || returnFlight),
    [searchParams, returnFlight]
  )

  const routeInfo = useMemo(() => {
    const originCity = outboundFlight?.departure?.city || searchParams.get('origin') || 'Origen'
    const destinationCity =
      outboundFlight?.arrival?.city || searchParams.get('destination') || 'Destino'
    const departureDate =
      outboundFlight?.departure?.dateTime ||
      searchParams.get('departureDate') ||
      ''
    const returnDate =
      returnFlight?.departure?.dateTime ||
      searchParams.get('returnDate') ||
      ''

    const departureLabel = departureDate
      ? new Date(departureDate).toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
      : 'Por confirmar'

    const returnLabel = isRoundtrip
      ? returnDate
        ? new Date(returnDate).toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })
        : 'por confirmar'
      : ''

    return {
      routeLabel: `${originCity} ${isRoundtrip ? '⇄' : '→'} ${destinationCity}`,
      tripDates: isRoundtrip ? `${departureLabel} - ${returnLabel}` : departureLabel
    }
  }, [isRoundtrip, outboundFlight, returnFlight, searchParams])

  // Cargar datos del vuelo desde la API
  useEffect(() => {
    const loadFlightData = async () => {
      const outboundId = searchParams.get('outbound')
      const returnId = searchParams.get('return')
      const passengersCount = parseInt(searchParams.get('passengers') || '1')
      const classType = searchParams.get('classType') || 'economy' // Clase seleccionada en búsqueda

      console.log('📋 Parámetros de búsqueda:', {
        outboundId,
        returnId,
        passengersCount,
        classType
      })

      if (!outboundId) {
        console.log('❌ No hay ID de vuelo de ida, redirigiendo...')
        router.push('/search/flights')
        return
      }

      setPassengers(passengersCount)

      try {
        // Cargar vuelo de ida
        console.log('🔍 Cargando vuelo de ida:', outboundId)
        const outboundRes = await fetch(`/api/flights/${outboundId}`)
        const outboundData = await outboundRes.json()

        console.log('📦 Respuesta vuelo de ida:', outboundData)

        if (outboundData.success) {
          console.log('✅ Vuelo de ida cargado:', outboundData.flight.flightNumber)
          setOutboundFlight(outboundData.flight)
          
          // Inicializar el índice de clase basado en el tipo seleccionado
          const classIndex = outboundData.flight.classes.findIndex((c: any) => c.type === classType)
          if (classIndex !== -1) {
            setCurrentClassIndex(classIndex)
            console.log('✅ Clase inicial configurada:', classType, 'índice:', classIndex)
          }
        } else {
          console.error('❌ Error en vuelo de ida:', outboundData.error)
        }

        // Cargar vuelo de retorno si existe
        if (returnId) {
          console.log('🔍 Cargando vuelo de retorno:', returnId)
          const returnRes = await fetch(`/api/flights/${returnId}`)
          const returnData = await returnRes.json()

          console.log('📦 Respuesta vuelo de retorno:', returnData)

          if (returnData.success) {
            console.log('✅ Vuelo de retorno cargado:', returnData.flight.flightNumber)
            setReturnFlight(returnData.flight)
          } else {
            console.error('❌ Error en vuelo de retorno:', returnData.error)
          }
        }
      } catch (error) {
        console.error('❌ Error cargando vuelos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFlightData()
  }, [searchParams, router])

  // Calcular progreso
  const getProgress = () => {
    const steps = returnFlight
      ? ['class-outbound', 'extras-outbound', 'passengers', 'class-return', 'extras-return', 'summary']
      : ['class-outbound', 'extras-outbound', 'passengers', 'summary']

    const currentIndex = steps.indexOf(currentStep)
    return ((currentIndex + 1) / steps.length) * 100
  }

  // Función para obtener colores por tipo de clase
  const getClassColors = (classType: string) => {
    switch (classType) {
      case 'economy':
        return {
          gradient: 'from-blue-900 via-blue-800 to-blue-900',
          border: 'border-blue-500/50',
          icon: 'bg-blue-500/20',
          iconColor: 'text-blue-400',
          checkBg: 'bg-blue-500/20',
          checkColor: 'text-blue-400'
        }
      case 'premium_economy':
        return {
          gradient: 'from-purple-900 via-purple-800 to-purple-900',
          border: 'border-purple-500/50',
          icon: 'bg-purple-500/20',
          iconColor: 'text-purple-400',
          checkBg: 'bg-purple-500/20',
          checkColor: 'text-purple-400'
        }
      case 'business':
        return {
          gradient: 'from-amber-900 via-amber-800 to-amber-900',
          border: 'border-amber-500/50',
          icon: 'bg-amber-500/20',
          iconColor: 'text-amber-400',
          checkBg: 'bg-amber-500/20',
          checkColor: 'text-amber-400'
        }
      case 'first':
        return {
          gradient: 'from-emerald-900 via-emerald-800 to-emerald-900',
          border: 'border-emerald-500/50',
          icon: 'bg-emerald-500/20',
          iconColor: 'text-emerald-400',
          checkBg: 'bg-emerald-500/20',
          checkColor: 'text-emerald-400'
        }
      default:
        return {
          gradient: 'from-slate-900 via-slate-800 to-slate-900',
          border: 'border-primary/50',
          icon: 'bg-white/10',
          iconColor: 'text-white',
          checkBg: 'bg-primary/20',
          checkColor: 'text-primary'
        }
    }
  }

  // Abrir modal automáticamente cuando carga el vuelo
  useEffect(() => {
    if (outboundFlight && currentStep === 'class-outbound' && !outboundClass) {
      setShowClassModal(true)
      setModalFlightType('outbound')
      setCurrentClassIndex(0)
    }
  }, [outboundFlight, currentStep, outboundClass])

  // Funciones para el carousel
  const handleNextClass = () => {
    const flight = modalFlightType === 'outbound' ? outboundFlight : returnFlight
    if (flight && currentClassIndex < flight.classes.length - 1) {
      setCurrentClassIndex(currentClassIndex + 1)
    }
  }

  const handlePrevClass = () => {
    if (currentClassIndex > 0) {
      setCurrentClassIndex(currentClassIndex - 1)
    }
  }

  const handleSelectClass = () => {
    const flight = currentStep === 'class-outbound' ? outboundFlight : returnFlight
    const selectedClass = flight.classes[currentClassIndex]
    
    // Calcular precio total con tipos de pasajeros
    const calculateClassPrice = (flightClass: any) => {
      if (flightClass.pricing) {
        const adultPrice = flightClass.pricing.adult?.selling || 0
        const childPrice = flightClass.pricing.child?.selling || 0
        const infantPrice = flightClass.pricing.infant?.selling || 0
        
        const adultsCount = parseInt(searchParams.get('adults') || '1')
        const childrenCount = parseInt(searchParams.get('children') || '0')
        const infantsCount = parseInt(searchParams.get('infants') || '0')
        
        return (adultPrice * adultsCount) + (childPrice * childrenCount) + (infantPrice * infantsCount)
      }
      
      // Fallback a estructura legacy
      return flightClass.sellingPrice * passengers
    }

    if (currentStep === 'class-outbound') {
      setOutboundClass({
        type: selectedClass.type,
        price: calculateClassPrice(selectedClass),
        currency: selectedClass.pricing?.adult?.currency || selectedClass.sellingCurrency,
        baggage: selectedClass.baggage,
        seatSelection: selectedClass.seatSelection,
        amenities: selectedClass.amenities
      })
      setCurrentStep('extras-outbound')
    } else if (currentStep === 'class-return') {
      setReturnClass({
        type: selectedClass.type,
        price: calculateClassPrice(selectedClass),
        currency: selectedClass.pricing?.adult?.currency || selectedClass.sellingCurrency,
        baggage: selectedClass.baggage,
        seatSelection: selectedClass.seatSelection,
        amenities: selectedClass.amenities
      })
      setCurrentStep('extras-return')
    }
  }

  // Handlers para cada paso
  const handleOutboundClassSelected = (classType: string, price: number, currency: string) => {
    const selectedClass = outboundFlight.classes.find((c: any) => c.type === classType)
    setOutboundClass({
      type: classType,
      price,
      currency,
      baggage: selectedClass.baggage,
      seatSelection: selectedClass.seatSelection,
      amenities: selectedClass.amenities
    })
    setCurrentStep('extras-outbound')
  }

  const handleOutboundExtrasConfigured = (extras: any) => {
    setOutboundExtras(extras)
    setCurrentStep('passengers')
  }

  const handlePassengersDataCompleted = (data: any[]) => {
    setPassengersData(data)

    if (returnFlight) {
      setCurrentStep('class-return')
      setShowClassModal(true)
      setModalFlightType('return')
      setCurrentClassIndex(0)
    } else {
      setCurrentStep('summary')
    }
  }

  const handleReturnClassSelected = (classType: string, price: number, currency: string) => {
    const selectedClass = returnFlight.classes.find((c: any) => c.type === classType)
    setReturnClass({
      type: classType,
      price,
      currency,
      baggage: selectedClass.baggage,
      seatSelection: selectedClass.seatSelection,
      amenities: selectedClass.amenities
    })
    setCurrentStep('extras-return')
  }

  const handleReturnExtrasConfigured = (extras: any) => {
    setReturnExtras(extras)
    setCurrentStep('summary')
  }

  const handleCancel = () => {
    router.back()
  }

  const handleConfirmBooking = () => {
    const bookingData = {
      outbound: {
        flight: outboundFlight,
        selectedClass: outboundClass,
        extras: outboundExtras
      },
      return: returnFlight ? {
        flight: returnFlight,
        selectedClass: returnClass,
        extras: returnExtras
      } : undefined,
      passengers: passengersData
    }

    console.log('✅ Reserva confirmada:', bookingData)
    // TODO: Navegar a página de pago
    // router.push('/booking/payment', { state: bookingData })
  }

  const previewLoadingDesign = false

  if (isLoading || previewLoadingDesign) {
    const originCity = outboundFlight?.departure?.city || searchParams.get('origin') || 'Origen'
    const destinationCity = outboundFlight?.arrival?.city || searchParams.get('destination') || 'Destino'
    const originCode = outboundFlight?.departure?.airport?.iataCode || searchParams.get('origin')?.substring(0, 3).toUpperCase() || 'ORG'
    const destinationCode = outboundFlight?.arrival?.airport?.iataCode || searchParams.get('destination')?.substring(0, 3).toUpperCase() || 'DST'
    const flightNumber = outboundFlight?.flightNumber || '---'
    const airlineName = outboundFlight?.airline?.name || 'Aerolínea'
    const airlineLogo = outboundFlight?.airline?.logo || '/images/airlines/default.png'
    const departureTime = outboundFlight?.departure?.dateTime 
      ? new Date(outboundFlight.departure.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : '--:--'
    const arrivalTime = outboundFlight?.arrival?.dateTime
      ? new Date(outboundFlight.arrival.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : '--:--'
    const departureDate = outboundFlight?.departure?.dateTime
      ? new Date(outboundFlight.departure.dateTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Fecha por confirmar'

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <Logo size="lg" variant="dark" showIcon={false} className="justify-center" />
          
          {/* Ticket compacto estilo tirilla */}
          <div className="relative">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-default-200">
              {/* Barra de progreso superior */}
              <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse" />
              
              {/* Contenido del ticket */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Origen */}
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-bold text-foreground">{originCode}</p>
                    <p className="text-xs text-foreground/60 mt-0.5">{departureTime}</p>
                  </div>

                  {/* Separador con icono */}
                  <div className="flex flex-col items-center gap-1 px-3">
                    {isRoundtrip ? (
                      <ArrowLeftRight size={18} className="text-primary" />
                    ) : (
                      <ArrowRight size={18} className="text-primary" />
                    )}
                    <div className="h-px w-12 bg-default-300" />
                  </div>

                  {/* Destino */}
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-bold text-foreground">{destinationCode}</p>
                    <p className="text-xs text-foreground/60 mt-0.5">{arrivalTime}</p>
                  </div>
                </div>

                <Divider className="my-3" />

                {/* Info compacta */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-foreground/70">
                    <Plane size={14} className="text-primary" />
                    <span className="font-semibold">{flightNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-foreground/70">
                    <Users size={14} className="text-primary" />
                    <span>{passengersCount}</span>
                  </div>
                  <Chip size="sm" color="warning" variant="flat" className="h-5">
                    Confirmando
                  </Chip>
                </div>
              </div>

              {/* Footer con línea decorativa */}
              <div className="h-8 bg-default-50 border-t border-dashed border-default-300 flex items-center justify-center">
                <div className="flex gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-0.5 h-3 bg-foreground/20 rounded-full" />
                  ))}
                </div>
              </div>
            </div>

            {/* Círculos perforados */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border border-default-200" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full border border-default-200" />
          </div>

          <p className="text-center text-sm text-foreground/60">
            Validando disponibilidad con {airlineName}...
          </p>

          <Progress
            isIndeterminate
            color="primary"
            size="sm"
            className="max-w-xs mx-auto"
          />
        </div>
      </div>
    )
  }

  if (!outboundFlight) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-default-50 to-background">
        <Card className="max-w-md">
          <CardBody className="text-center p-8">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <Plane size={32} className="text-danger" />
            </div>
            <h3 className="text-xl font-bold mb-2">Vuelo no encontrado</h3>
            <p className="text-foreground/60 mb-6">No pudimos cargar la información del vuelo seleccionado</p>
            <Button
              color="primary"
              size="lg"
              startContent={<ArrowLeft size={20} />}
              onPress={() => router.push('/search/flights')}
            >
              Volver a búsqueda
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header minimalista y profesional */}
      <div className="bg-white border-b border-default-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="light"
              size="sm"
              onPress={handleCancel}
              startContent={<ArrowLeft size={18} />}
              className="text-foreground/70"
            >
              Volver
            </Button>
            <Logo size="sm" variant="dark" showIcon={false} />
            <div className="w-16" />
          </div>

          {/* Barra de progreso con steps - Solo Desktop */}
          <div className="relative hidden lg:block">
            {(() => {
              const steps = returnFlight 
                ? [
                    { key: 'class-outbound', label: 'Clase ida' },
                    { key: 'extras-outbound', label: 'Extras' },
                    { key: 'passengers', label: 'Pasajeros' },
                    { key: 'class-return', label: 'Clase vuelta' },
                    { key: 'extras-return', label: 'Extras' },
                    { key: 'summary', label: 'Resumen' }
                  ]
                : [
                    { key: 'class-outbound', label: 'Clase' },
                    { key: 'extras-outbound', label: 'Extras' },
                    { key: 'passengers', label: 'Pasajeros' },
                    { key: 'summary', label: 'Resumen' }
                  ]
              
              const currentIndex = steps.findIndex(s => s.key === currentStep)
              
              return (
                <>
                  {/* Steps con círculos */}
                  <div className="flex items-center justify-between mb-2">
                    {steps.map((step, idx) => (
                      <div key={step.key} className="flex-1 flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                          idx < currentIndex 
                            ? 'bg-success text-white' 
                            : idx === currentIndex 
                            ? 'bg-primary text-white' 
                            : 'bg-default-100 text-foreground/40'
                        }`}>
                          {idx < currentIndex ? <Check size={16} /> : idx + 1}
                        </div>
                        <p className={`text-xs mt-1 ${
                          idx === currentIndex ? 'text-foreground font-medium' : 'text-foreground/50'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Línea de conexión entre steps */}
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-default-200 -z-10" style={{ width: 'calc(100% - 2rem)', marginLeft: '1rem' }} />
                  <div 
                    className="absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-300" 
                    style={{ 
                      width: `calc((100% - 2rem) * ${getProgress() / 100})`,
                      marginLeft: '1rem'
                    }} 
                  />
                </>
              )
            })()}
          </div>

          {/* Layout 2 columnas: Ticket (8/12) + Resumen Precios (4/12) */}
          <div className="mt-2 lg:mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-stretch">
            {/* Ticket de vuelo - 8/12 */}
            <div className="lg:col-span-8 relative flex">
              {(() => {
                const flight = currentStep.includes('return') && returnFlight ? returnFlight : outboundFlight
                const originCode = flight.departure.airport?.iataCode || flight.departure.airport
                const destinationCode = flight.arrival.airport?.iataCode || flight.arrival.airport
                const departureTime = new Date(flight.departure.dateTime).toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })
                const arrivalTime = new Date(flight.arrival.dateTime).toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })
                const departureDate = new Date(flight.departure.dateTime).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })

                return (
                  <>
                    {/* TICKET MÓVIL - Simplificado */}
                    <div className="lg:hidden bg-white rounded-lg shadow-md overflow-hidden border border-default-200 flex-1">
                      <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-primary" />
                      
                      <div className="p-2">
                        {/* Header con aerolínea */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 bg-white rounded flex items-center justify-center shadow-sm border border-default-100">
                              {flight.airline?.logoUrl ? (
                                <img src={flight.airline.logoUrl} alt={flight.airline.name} className="w-4 h-4 object-contain" />
                              ) : (
                                <Plane size={12} className="text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="text-[9px] font-semibold leading-tight">{flight.airline?.name}</p>
                              <p className="text-[8px] text-foreground/60 leading-tight">{flight.flightNumber}</p>
                            </div>
                          </div>
                          <Chip size="sm" color="primary" variant="flat" className="text-[8px] h-4 px-1.5">
                            {currentStep.includes('return') ? 'Retorno' : 'Ida'}
                          </Chip>
                        </div>

                        {/* Ruta principal */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground leading-tight">{originCode}</p>
                            <p className="text-[9px] text-foreground/60 leading-tight">{flight.departure.city}</p>
                            <p className="text-[9px] font-semibold text-primary leading-tight">{departureTime}</p>
                          </div>
                          
                          <div className="flex flex-col items-center px-1.5">
                            <ArrowRight size={14} className="text-primary" />
                            {flight.stops === 0 ? (
                              <Chip size="sm" color="success" variant="flat" className="text-[8px] h-3.5 px-1">Directo</Chip>
                            ) : (
                              <Chip size="sm" color="warning" variant="flat" className="text-[8px] h-3.5 px-1">{flight.stops} esc</Chip>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground leading-tight">{destinationCode}</p>
                            <p className="text-[9px] text-foreground/60 leading-tight">{flight.arrival.city}</p>
                            <p className="text-[9px] font-semibold text-primary leading-tight">{arrivalTime}</p>
                          </div>
                        </div>

                        <Divider className="my-1" />

                        {/* Info adicional */}
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-foreground/60">{departureDate}</span>
                          <div className="flex items-center gap-0.5">
                            <Users size={10} className="text-primary" />
                            <span className="font-semibold">{passengers} pax</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TICKET DESKTOP - Compacto */}
                    <div className="hidden lg:block relative flex-1">
                      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-default-200">
                        <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-primary" />
                        
                        <div className="p-3">
                          {/* Header + Ruta en una sola línea */}
                          <div className="flex items-center justify-between gap-3 mb-2">
                            {/* Logo y aerolínea compacto */}
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-sm border border-default-100">
                                {flight.airline?.logoUrl ? (
                                  <img src={flight.airline.logoUrl} alt={flight.airline.name} className="w-6 h-6 object-contain" />
                                ) : (
                                  <Plane size={16} className="text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-xs leading-tight">{flight.airline?.name}</p>
                                <p className="text-[9px] text-foreground/60 leading-tight">{flight.flightNumber}</p>
                              </div>
                            </div>

                            {/* Ruta principal compacta */}
                            <div className="flex items-center gap-3 flex-1 justify-center">
                              {/* Origen */}
                              <div className="text-center">
                                <p className="text-2xl font-bold text-foreground leading-tight">{originCode}</p>
                                <p className="text-[10px] text-foreground/60 leading-tight">{flight.departure.city}</p>
                                <p className="text-[10px] font-semibold text-primary leading-tight">{departureTime}</p>
                              </div>
                              
                              {/* Centro */}
                              <div className="flex flex-col items-center px-2">
                                <ArrowRight size={16} className="text-primary mb-1" />
                                {flight.stops === 0 ? (
                                  <Chip size="sm" color="success" variant="flat" className="text-[9px] h-4 px-1.5">Directo</Chip>
                                ) : (
                                  <Chip size="sm" color="warning" variant="flat" className="text-[9px] h-4 px-1.5">{flight.stops} esc</Chip>
                                )}
                              </div>
                              
                              {/* Destino */}
                              <div className="text-center">
                                <p className="text-2xl font-bold text-foreground leading-tight">{destinationCode}</p>
                                <p className="text-[10px] text-foreground/60 leading-tight">{flight.arrival.city}</p>
                                <p className="text-[10px] font-semibold text-primary leading-tight">{arrivalTime}</p>
                              </div>
                            </div>

                            {/* Chip tipo vuelo */}
                            <Chip color="primary" variant="flat" size="sm" className="text-[9px] h-5 px-2">
                              {currentStep.includes('return') ? 'Retorno' : 'Ida'}
                            </Chip>
                          </div>

                          <Divider className="my-1.5" />

                          {/* Footer info compacto */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-foreground/60">{departureDate}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-foreground/60">Duración: {Math.floor(flight.duration / 60)}h {flight.duration % 60}m</span>
                              <div className="flex items-center gap-1">
                                <Users size={12} className="text-primary" />
                                <span className="font-semibold">{passengers} pax</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer decorativo */}
                        <div className="h-5 bg-default-50 border-t border-dashed border-default-300 flex items-center justify-center">
                          <div className="flex gap-0.5">
                            {[...Array(30)].map((_, i) => (
                              <div key={i} className="w-0.5 h-2 bg-foreground/20 rounded-full" />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Círculos perforados */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-background rounded-full border-2 border-default-200" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-background rounded-full border-2 border-default-200" />
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Panel Resumen de Precios - 4/12 */}
            <div className="lg:col-span-4 flex">
              <div className="bg-white rounded-lg overflow-hidden flex-1 flex flex-col">
                {/* Header clickeable en mobile */}
                <button
                  onClick={() => setIsPricesSummaryOpen(!isPricesSummaryOpen)}
                  className="lg:hidden w-full px-3 py-2 flex items-center justify-between bg-default-50 border-b border-default-200 active:bg-default-100 transition-colors"
                >
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">Resumen</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">
                      ${(() => {
                        let total = 0
                        if (currentStep === 'class-outbound' && outboundFlight) {
                          total += (outboundFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers
                        } else if (outboundClass) {
                          total += outboundClass.price * passengers
                        } else if (outboundFlight) {
                          total += (outboundFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers
                        }
                        if (currentStep === 'class-return' && returnFlight) {
                          total += (returnFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers
                        } else if (returnClass) {
                          total += returnClass.price * passengers
                        } else if (returnFlight) {
                          total += (returnFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers
                        }
                        return total.toLocaleString()
                      })()}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isPricesSummaryOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Header fijo en desktop */}
               
                {/* Contenido - Formato índice */}
                <div className={`
                  lg:flex lg:flex-col lg:flex-1 lg:px-3 lg:py-3
                  ${isPricesSummaryOpen ? 'block' : 'hidden lg:block'}
                `}>
                  <div className="space-y-2 text-xs flex-1 p-3 lg:p-0">
                    {/* Vuelo de ida */}
                    {outboundFlight && (
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/70 whitespace-nowrap">Vuelo de ida</span>
                        <div className="flex-1 border-b border-dotted border-default-300"></div>
                        <span className="font-semibold text-foreground">
                          ${(() => {
                            if (currentStep === 'class-outbound') {
                              return ((outboundFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers).toLocaleString()
                            }
                            if (outboundClass) {
                              return ((outboundClass.price || 0) * passengers).toLocaleString()
                            }
                            return ((outboundFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers).toLocaleString()
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Vuelo de retorno */}
                    {returnFlight && (
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/70 whitespace-nowrap">Vuelo de retorno</span>
                        <div className="flex-1 border-b border-dotted border-default-300"></div>
                        <span className="font-semibold text-foreground">
                          ${(() => {
                            if (currentStep === 'class-return') {
                              return ((returnFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers).toLocaleString()
                            }
                            if (returnClass) {
                              return ((returnClass.price || 0) * passengers).toLocaleString()
                            }
                            return ((returnFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers).toLocaleString()
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Extras */}
                    {(outboundExtras || returnExtras) && (
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/70 whitespace-nowrap">Extras</span>
                        <div className="flex-1 border-b border-dotted border-default-300"></div>
                        <span className="font-semibold text-foreground">$0</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="hidden lg:block mt-auto pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground whitespace-nowrap">Total</span>
                      <div className="flex-1 border-b border-dotted border-default-400"></div>
                      <span className="text-lg font-bold text-primary">
                        ${(() => {
                          let total = 0
                          if (currentStep === 'class-outbound' && outboundFlight) {
                            total += (outboundFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers
                          } else if (outboundClass) {
                            total += outboundClass.price * passengers
                          } else if (outboundFlight) {
                            total += (outboundFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers
                          }
                          if (currentStep === 'class-return' && returnFlight) {
                            total += (returnFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers
                          } else if (returnClass) {
                            total += returnClass.price * passengers
                          } else if (returnFlight) {
                            total += (returnFlight.classes[currentClassIndex]?.sellingPrice || 0) * passengers
                          }
                          return total.toLocaleString()
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 py-4 lg:py-6">

        {/* Selección de clase - Slider Horizontal */}
        {currentStep === 'class-outbound' && outboundFlight && (
          <div className="space-y-4 lg:space-y-6">
            <div className="text-center mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-1 lg:mb-2">Selecciona tu clase</h2>
              <p className="text-xs lg:text-sm text-foreground/60">
                {outboundFlight.airline.name} • {outboundFlight.flightNumber}
              </p>
            </div>

            {/* Slider horizontal unificado - Desktop y Mobile */}
            <div className="overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-primary scrollbar-track-gray-200">
              <div className={`flex gap-4 px-4 ${outboundFlight.classes.length === 1 ? 'justify-center' : ''}`}>
                {outboundFlight.classes.map((flightClass: any, idx: number) => {
                  const colors = getClassColors(flightClass.type)
                  const isEconomy = flightClass.type === 'economy'
                  
                  return (
                    <div
                      key={idx}
                      className="w-[280px] flex-shrink-0"
                    >
                      <Card
                        className={`group relative overflow-hidden h-64 border-2 transition-all duration-300 cursor-pointer ${
                          isEconomy 
                            ? "border-default-200 hover:border-default-300" 
                            : `${colors.border} hover:border-opacity-100`
                        }`}
                        onClick={() => {
                          if (isEconomy) {
                            handleSelectClass()
                          } else {
                            setCurrentClassIndex(idx)
                            handleSelectClass()
                          }
                        }}
                      >
                        {/* Background gradient */}
                        <div className={`absolute inset-0 ${
                          isEconomy 
                            ? 'bg-gradient-to-br from-default-50 to-default-100' 
                            : `bg-gradient-to-br ${colors.gradient}`
                        } transition-opacity group-hover:opacity-90`} />
                        
                        {/* Contenido */}
                        <CardBody className="relative z-10 flex flex-col justify-between p-4">
                          <div className="flex justify-center mb-3">
                            <div className={`w-12 h-12 rounded-full ${isEconomy ? 'bg-white' : colors.icon} flex items-center justify-center shadow-lg`}>
                              <Briefcase size={24} className={isEconomy ? 'text-default-500' : colors.iconColor} />
                            </div>
                          </div>

                          <div>
                            <h4 className={`text-2xl font-black text-center capitalize mb-2 group-hover:scale-105 transition-transform ${isEconomy ? 'text-foreground' : 'text-white'}`}>
                              {flightClass.type.replace('_', ' ')}
                            </h4>

                            <div className="text-center mb-3">
                              <div className="flex items-baseline justify-center gap-1">
                                <span className={`text-3xl font-black ${isEconomy ? 'text-foreground' : 'text-white'}`}>
                                  ${flightClass.pricing?.adult?.selling || flightClass.sellingPrice}
                                </span>
                                <span className={`text-sm ${isEconomy ? 'text-foreground/60' : 'text-white/60'}`}>
                                  {flightClass.pricing?.adult?.currency || flightClass.sellingCurrency}
                                </span>
                              </div>
                              <p className={`text-xs mt-1 ${isEconomy ? 'text-foreground/60' : 'text-white/80'}`}>por adulto</p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className={`text-xs ${isEconomy ? 'text-foreground/70' : 'text-white/90'}`}>
                                <p>{flightClass.availableSeats} asientos</p>
                              </div>
                              
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isEconomy 
                                  ? 'bg-success text-white' 
                                  : 'bg-white/20 backdrop-blur-sm group-hover:bg-white text-white group-hover:text-primary'
                              }`}>
                                <ArrowRight size={18} />
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Carousel para vuelo de retorno */}
        {currentStep === 'class-return' && returnFlight && (
          <div className="min-h-[80vh] flex items-center justify-center py-8">
            <div className="w-full max-w-7xl mx-auto px-4">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-3">Selecciona tu clase de vuelo de retorno</h3>
                <div className="flex items-center justify-center gap-2 text-foreground/70">
                  <Chip size="sm" variant="flat" color="secondary">
                    Vuelo de retorno
                  </Chip>
                  <span>{returnFlight.airline.name} • {returnFlight.flightNumber}</span>
                </div>
              </div>

              {/* Mismo carousel pero para returnFlight */}
              <div className="relative">
                <div className="hidden lg:flex items-stretch justify-center gap-6 px-16">
                  {currentClassIndex > 0 && (
                    <Card
                      isPressable
                      onPress={handlePrevClass}
                      className="w-64 opacity-60 hover:opacity-80 transition-all cursor-pointer"
                      shadow="sm"
                    >
                      <CardBody className="p-6">
                        <div className="text-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center mx-auto mb-3">
                            <Briefcase size={20} className="text-default-500" />
                          </div>
                          <h4 className="text-lg font-bold capitalize">
                            {returnFlight.classes[currentClassIndex - 1].type.replace('_', ' ')}
                          </h4>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            ${returnFlight.classes[currentClassIndex - 1].sellingPrice}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {(() => {
                    const currentClass = returnFlight.classes[currentClassIndex]
                    const colors = getClassColors(currentClass.type)
                    return (
                      <Card
                        className={`w-96 bg-gradient-to-br ${colors.gradient} border-2 ${colors.border} shadow-2xl scale-105`}
                      >
                        <CardBody className="p-8">
                          <div className="flex justify-center mb-6">
                            <div className={`w-16 h-16 rounded-full ${colors.icon} flex items-center justify-center`}>
                              <Briefcase size={32} className={colors.iconColor} />
                            </div>
                          </div>

                          <h4 className="text-3xl font-bold text-white text-center capitalize mb-2">
                            {currentClass.type.replace('_', ' ')}
                          </h4>

                          <div className="text-center mb-6">
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-5xl font-bold text-white">
                                ${currentClass.sellingPrice}
                              </span>
                              <span className="text-white/60">/{currentClass.sellingCurrency}</span>
                            </div>
                          </div>

                          <p className="text-center text-white/80 text-sm mb-6">
                            {currentClass.type === 'economy' ? 'La mejor relación calidad-precio' :
                              currentClass.type === 'business' ? 'Máxima comodidad y exclusividad' :
                                currentClass.type === 'first' ? 'Experiencia de lujo incomparable' :
                                  'Experiencia premium mejorada'}
                          </p>

                          <Divider className="bg-white/20 mb-6" />

                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-white">
                              <div className={`w-5 h-5 rounded-full ${colors.checkBg} flex items-center justify-center flex-shrink-0`}>
                                <Check size={14} className={colors.checkColor} />
                              </div>
                              <span className="text-sm">{currentClass.baggage.carry}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white">
                              <div className={`w-5 h-5 rounded-full ${colors.checkBg} flex items-center justify-center flex-shrink-0`}>
                                <Check size={14} className={colors.checkColor} />
                              </div>
                              <span className="text-sm">{currentClass.baggage.checked}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white">
                              <div className={`w-5 h-5 rounded-full ${colors.checkBg} flex items-center justify-center flex-shrink-0`}>
                                <Check size={14} className={colors.checkColor} />
                              </div>
                              <span className="text-sm">{currentClass.availableSeats} asientos disponibles</span>
                            </div>
                            {currentClass.amenities?.slice(0, 3).map((amenity: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 text-white">
                                <div className={`w-5 h-5 rounded-full ${colors.checkBg} flex items-center justify-center flex-shrink-0`}>
                                  <Check size={14} className={colors.checkColor} />
                                </div>
                                <span className="text-sm">{amenity}</span>
                              </div>
                            ))}
                          </div>

                          <Button
                            color="primary"
                            size="lg"
                            className="w-full font-semibold"
                            onPress={handleSelectClass}
                          >
                            Seleccionar
                          </Button>
                        </CardBody>
                      </Card>
                    )
                  })()}

                  {currentClassIndex < returnFlight.classes.length - 1 && (
                    <Card
                      isPressable
                      onPress={handleNextClass}
                      className="w-64 opacity-60 hover:opacity-80 transition-all cursor-pointer"
                      shadow="sm"
                    >
                      <CardBody className="p-6">
                        <div className="text-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center mx-auto mb-3">
                            <Briefcase size={20} className="text-default-500" />
                          </div>
                          <h4 className="text-lg font-bold capitalize">
                            {returnFlight.classes[currentClassIndex + 1].type.replace('_', ' ')}
                          </h4>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            ${returnFlight.classes[currentClassIndex + 1].sellingPrice}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>

                <div className="lg:hidden">
                  {(() => {
                    const currentClass = returnFlight.classes[currentClassIndex]
                    const colors = getClassColors(currentClass.type)
                    return (
                      <Card
                        className={`max-w-md mx-auto bg-gradient-to-br ${colors.gradient} border-2 ${colors.border} shadow-xl`}
                      >
                        <CardBody className="p-6">
                          <div className="flex justify-center mb-4">
                            <div className={`w-14 h-14 rounded-full ${colors.icon} flex items-center justify-center`}>
                              <Briefcase size={28} className={colors.iconColor} />
                            </div>
                          </div>

                          <h4 className="text-2xl font-bold text-white text-center capitalize mb-2">
                            {currentClass.type.replace('_', ' ')}
                          </h4>

                          <div className="text-center mb-4">
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-4xl font-bold text-white">
                                ${currentClass.sellingPrice}
                              </span>
                              <span className="text-white/60 text-sm">/{currentClass.sellingCurrency}</span>
                            </div>
                          </div>

                          <p className="text-center text-white/80 text-sm mb-4">
                            {currentClass.type === 'economy' ? 'La mejor relación calidad-precio' :
                              currentClass.type === 'business' ? 'Máxima comodidad y exclusividad' :
                                currentClass.type === 'first' ? 'Experiencia de lujo incomparable' :
                                  'Experiencia premium mejorada'}
                          </p>

                          <Divider className="bg-white/20 mb-4" />

                          <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-white text-sm">
                              <div className={`w-5 h-5 rounded-full ${colors.checkBg} flex items-center justify-center flex-shrink-0`}>
                                <Check size={12} className={colors.checkColor} />
                              </div>
                              <span>{currentClass.baggage.carry}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white text-sm">
                              <div className={`w-5 h-5 rounded-full ${colors.checkBg} flex items-center justify-center flex-shrink-0`}>
                                <Check size={12} className={colors.checkColor} />
                              </div>
                              <span>{currentClass.baggage.checked}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white text-sm">
                              <div className={`w-5 h-5 rounded-full ${colors.checkBg} flex items-center justify-center flex-shrink-0`}>
                                <Check size={12} className={colors.checkColor} />
                              </div>
                              <span>{currentClass.availableSeats} asientos disponibles</span>
                            </div>
                          </div>

                          <Button
                            color="primary"
                            size="lg"
                            className="w-full font-semibold"
                            onPress={handleSelectClass}
                          >
                            Seleccionar
                          </Button>
                        </CardBody>
                      </Card>
                    )
                  })()}
                </div>

                <Button
                  isIconOnly
                  size="lg"
                  className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 bg-default-100"
                  onPress={handlePrevClass}
                  isDisabled={currentClassIndex === 0}
                >
                  <ArrowLeft size={24} />
                </Button>
                <Button
                  isIconOnly
                  size="lg"
                  className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 bg-default-100"
                  onPress={handleNextClass}
                  isDisabled={currentClassIndex === returnFlight.classes.length - 1}
                >
                  <ArrowRight size={24} />
                </Button>
              </div>

              <div className="mt-8">
                <div className="flex justify-center gap-2 mb-4">
                  {returnFlight.classes.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentClassIndex(idx)}
                      className={`h-2 rounded-full transition-all ${idx === currentClassIndex
                          ? 'w-8 bg-primary'
                          : 'w-2 bg-default-300'
                        }`}
                    />
                  ))}
                </div>

                <div className="flex lg:hidden justify-center gap-3">
                  <Button
                    variant="flat"
                    onPress={handlePrevClass}
                    isDisabled={currentClassIndex === 0}
                    startContent={<ArrowLeft size={18} />}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="flat"
                    onPress={handleNextClass}
                    isDisabled={currentClassIndex === returnFlight.classes.length - 1}
                    endContent={<ArrowRight size={18} />}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Extras de IDA */}
        {currentStep === 'extras-outbound' && (
          <Card className="shadow-lg border border-divider/50">
            <CardHeader className="flex-col items-start gap-2 pb-4">
              <h3 className="text-2xl font-bold">Personaliza tu experiencia</h3>
              <Chip size="sm" variant="flat" color="success" startContent={<CheckCircle2 size={14} />}>
                Clase {outboundClass?.type.replace('_', ' ')} seleccionada
              </Chip>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-4">Equipaje incluido en tu tarifa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                      <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                        <Briefcase size={24} className="text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60 mb-1">Equipaje de mano</p>
                        <p className="font-semibold">{outboundClass?.baggage.carry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                      <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                        <Luggage size={24} className="text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60 mb-1">Equipaje documentado</p>
                        <p className="font-semibold">{outboundClass?.baggage.checked}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                <div className="p-6 rounded-xl bg-default-100 border border-divider">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Zap size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Próximamente disponible</h4>
                      <p className="text-sm text-foreground/70">
                        Pronto podrás agregar equipaje adicional, seleccionar asientos preferenciales y más servicios para mejorar tu viaje.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="bordered"
                  onPress={() => setCurrentStep('class-outbound')}
                  startContent={<ArrowLeft size={18} />}
                >
                  Volver
                </Button>
                <Button
                  color="primary"
                  size="lg"
                  onPress={() => handleOutboundExtrasConfigured({})}
                  className="flex-1"
                  endContent={<ArrowRight size={18} />}
                >
                  Continuar a datos de pasajeros
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Paso 3: Datos de pasajeros */}
        {currentStep === 'passengers' && (
          <Card className="shadow-lg border border-divider/50">
            <CardHeader className="flex-col items-start gap-2 pb-4">
              <h3 className="text-2xl font-bold">Información de pasajeros</h3>
              <p className="text-sm text-foreground/60">
                Completa los datos de {passengers} {passengers === 1 ? 'pasajero' : 'pasajeros'} para tu vuelo
              </p>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-6">
                {Array.from({ length: passengers }).map((_, idx) => (
                  <Card key={idx} className="border border-divider/50" shadow="sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={20} className="text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold">Pasajero {idx + 1}</h4>
                          <p className="text-xs text-foreground/60">
                            {idx === 0 ? 'Pasajero principal' : 'Pasajero adicional'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          type="text"
                          label="Nombre(s)"
                          placeholder="Ingresa el nombre"
                          variant="bordered"
                          labelPlacement="outside"
                          startContent={<User size={18} className="text-foreground/40" />}
                          isRequired
                        />
                        <Input
                          type="text"
                          label="Apellido(s)"
                          placeholder="Ingresa el apellido"
                          variant="bordered"
                          labelPlacement="outside"
                          isRequired
                        />
                        {idx === 0 && (
                          <>
                            <Input
                              type="email"
                              label="Correo electrónico"
                              placeholder="correo@ejemplo.com"
                              variant="bordered"
                              labelPlacement="outside"
                              startContent={<Mail size={18} className="text-foreground/40" />}
                              description="Enviaremos tu confirmación aquí"
                              isRequired
                            />
                            <Input
                              type="tel"
                              label="Teléfono"
                              placeholder="+52 123 456 7890"
                              variant="bordered"
                              labelPlacement="outside"
                              startContent={<Phone size={18} className="text-foreground/40" />}
                              description="Para contactarte si es necesario"
                              isRequired
                            />
                          </>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={18} className="text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground mb-1">Información importante</p>
                    <p className="text-foreground/70">
                      Asegúrate de que los nombres coincidan exactamente con los documentos de identificación que usarás para viajar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="bordered"
                  onPress={() => setCurrentStep('extras-outbound')}
                  startContent={<ArrowLeft size={18} />}
                >
                  Volver
                </Button>
                <Button
                  color="primary"
                  size="lg"
                  onPress={() => handlePassengersDataCompleted([{ firstName: 'Test', lastName: 'User' }])}
                  className="flex-1"
                  endContent={<ArrowRight size={18} />}
                >
                  {returnFlight ? 'Continuar a vuelo de retorno' : 'Ver resumen'}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Paso 4: Clase de RETORNO (si aplica) */}
        {currentStep === 'class-return' && returnFlight && (
          <Card className="shadow-lg border border-divider/50">
            <CardHeader className="flex-col items-start gap-2 pb-4">
              <h3 className="text-2xl font-bold">Selecciona tu clase de vuelo de retorno</h3>
              <div className="flex items-center gap-2 text-sm">
                <Chip size="sm" variant="flat" color="secondary" startContent={<Plane size={14} className="rotate-180" />}>
                  Vuelo de retorno
                </Chip>
                <span className="text-foreground/60">
                  {returnFlight.airline.name} • {returnFlight.flightNumber}
                </span>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {returnFlight.classes.map((flightClass: any) => (
                  <Card
                    key={flightClass.type}
                    isPressable
                    onPress={() => handleReturnClassSelected(flightClass.type, flightClass.sellingPrice, flightClass.sellingCurrency)}
                    className="hover:scale-[1.02] hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-secondary/50"
                    shadow="sm"
                  >
                    <CardBody className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-xl capitalize mb-1">
                            {flightClass.type.replace('_', ' ')}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                            <Users size={12} />
                            <span>{flightClass.availableSeats} asientos disponibles</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
                            ${flightClass.sellingPrice}
                          </p>
                          <p className="text-xs text-foreground/60">{flightClass.sellingCurrency}</p>
                        </div>
                      </div>

                      <Divider className="my-4" />

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-default-50">
                          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                            <Briefcase size={16} className="text-secondary" />
                          </div>
                          <div>
                            <p className="text-xs text-foreground/60">Equipaje de mano</p>
                            <p className="text-sm font-medium">{flightClass.baggage.carry}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-default-50">
                          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                            <Luggage size={16} className="text-secondary" />
                          </div>
                          <div>
                            <p className="text-xs text-foreground/60">Equipaje documentado</p>
                            <p className="text-sm font-medium">{flightClass.baggage.checked}</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        color="secondary"
                        variant="flat"
                        className="w-full mt-4"
                        endContent={<ArrowRight size={18} />}
                      >
                        Seleccionar
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Paso 5: Extras de RETORNO */}
        {currentStep === 'extras-return' && returnClass && (
          <Card className="shadow-lg border border-divider/50">
            <CardHeader className="flex-col items-start gap-2 pb-4">
              <h3 className="text-2xl font-bold">Personaliza tu vuelo de retorno</h3>
              <Chip size="sm" variant="flat" color="success" startContent={<CheckCircle2 size={14} />}>
                Clase {returnClass?.type.replace('_', ' ')} seleccionada
              </Chip>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-4">Equipaje incluido en tu tarifa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                      <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                        <Briefcase size={24} className="text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60 mb-1">Equipaje de mano</p>
                        <p className="font-semibold">{returnClass?.baggage.carry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                      <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                        <Luggage size={24} className="text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60 mb-1">Equipaje documentado</p>
                        <p className="font-semibold">{returnClass?.baggage.checked}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="bordered"
                  onPress={() => setCurrentStep('class-return')}
                  startContent={<ArrowLeft size={18} />}
                >
                  Volver
                </Button>
                <Button
                  color="primary"
                  size="lg"
                  onPress={() => handleReturnExtrasConfigured({})}
                  className="flex-1"
                  endContent={<CheckCircle2 size={18} />}
                >
                  Ver resumen de reserva
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Resumen final */}
        {currentStep === 'summary' && (
          <Card>
            <CardBody className="p-6 space-y-6">
              <h3 className="text-xl font-bold">Resumen de tu reserva</h3>

              <div className="w-full max-w-md mx-auto rounded-2xl border border-default-200 shadow-sm bg-white overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />
                <div className="px-6 py-5 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-foreground/60">
                    <CheckCircle2 size={16} className="text-primary" />
                    {isRoundtrip ? 'Verificando vuelo redondo' : 'Verificando vuelo de ida'}
                  </div>
                  <div className="flex items-center justify-center gap-3 text-foreground">
                    {isRoundtrip ? (
                      <ArrowLeftRight size={20} className="text-primary" />
                    ) : (
                      <ArrowRight size={20} className="text-primary" />
                    )}
                    <p className="text-lg font-semibold">{routeInfo.routeLabel}</p>
                  </div>
                  <p className="text-sm text-foreground/60">{routeInfo.tripDates}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-foreground/70">
                    <Users size={16} className="text-primary" />
                    <span>{passengersCount} {passengersCount === 1 ? 'pasajero' : 'pasajeros'}</span>
                  </div>
                </div>
              </div>

              {outboundClass && (
                <div className="space-y-1">
                  <h4 className="font-semibold">Vuelo de ida</h4>
                  <p className="text-sm text-foreground/80 capitalize">
                    Clase: {outboundClass.type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-foreground/80">
                    Precio: ${outboundClass.price} {outboundClass.currency}
                  </p>
                </div>
              )}

              {returnFlight && returnClass && (
                <div className="space-y-1">
                  <h4 className="font-semibold">Vuelo de retorno</h4>
                  <p className="text-sm text-foreground/80 capitalize">
                    Clase: {returnClass.type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-foreground/80">
                    Precio: ${returnClass.price} {returnClass.currency}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <h4 className="font-semibold">Pasajeros</h4>
                {passengersData.length === 0 ? (
                  <p className="text-sm text-foreground/60">Información pendiente.</p>
                ) : (
                  passengersData.map((p, idx) => (
                    <p key={idx} className="text-sm text-foreground/80">
                      {p.firstName} {p.lastName}
                    </p>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-divider">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${(outboundClass?.price || 0) + (returnClass?.price || 0)}{' '}
                    {outboundClass?.currency || returnClass?.currency || 'USD'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="light" onPress={handleCancel} className="flex-1">
                  Cancelar
                </Button>
                <Button color="primary" onPress={handleConfirmBooking} className="flex-1">
                  Confirmar y pagar
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
