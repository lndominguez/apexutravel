'use client'

import { useRouter } from 'next/navigation'
import { Card, CardBody, Button, Chip } from '@heroui/react'
import { Plane, Clock, Briefcase, Luggage, Users, Wifi, Utensils, Tv, Zap, ArrowRight } from 'lucide-react'

// Tipos basados en el modelo de base de datos
interface FlightClass {
  type: 'economy' | 'premium_economy' | 'business' | 'first'
  availableSeats: number
  // Nueva estructura de pricing diferenciado
  pricing?: {
    adult: {
      cost: number
      selling: number
      currency: string
    }
    child: {
      cost: number
      selling: number
      currency: string
    }
    infant: {
      cost: number
      selling: number
      currency: string
    }
  }
  // Legacy (mantener por compatibilidad)
  sellingPrice: number
  sellingCurrency: string
  baggage: {
    carry: string
    checked: string
  }
  seatSelection?: boolean
  amenities: string[]
}

interface Layover {
  airport: string
  city: string
  duration: number
}

export interface FlightData {
  _id: string
  flightNumber: string
  airline: {
    name: string
    iataCode: string
    logoUrl?: string
  }
  departure: {
    airport: string
    city: string
    country: string
    terminal?: string
    dateTime: Date | string
  }
  arrival: {
    airport: string
    city: string
    country: string
    terminal?: string
    dateTime: Date | string
  }
  duration: number
  stops: number
  layovers?: Layover[]
  classes: FlightClass[]
  status: string
}

interface BookingData {
  outbound: {
    flight: FlightData
    selectedClass?: any
    extras?: any
  }
  return?: {
    flight: FlightData
    selectedClass?: any
    extras?: any
  }
  passengers?: any[]
}

interface FlightResultCardProps {
  flight: FlightData
  passengers: number // Total (legacy)
  adults?: number
  children?: number
  infants?: number
  onSelect: (bookingData: BookingData) => void
}

// Helper para formatear duración
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// Helper para formatear fecha/hora
const formatDateTime = (dateTime: Date | string): { date: string; time: string } => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
  
  const timeStr = date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
  
  const dateStr = date.toLocaleDateString('es-ES', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  })
  
  return { date: dateStr, time: timeStr }
}

// Helper para calcular precio total por tipo de pasajero
function calculateTotalPrice(
  flightClass: any,
  adults: number,
  children: number,
  infants: number
): number {
  // Si tiene estructura pricing nueva
  if (flightClass.pricing) {
    const adultPrice = flightClass.pricing.adult?.selling || 0
    const childPrice = flightClass.pricing.child?.selling || 0
    const infantPrice = flightClass.pricing.infant?.selling || 0
    
    return (adultPrice * adults) + (childPrice * children) + (infantPrice * infants)
  }
  
  // Fallback a estructura legacy
  return flightClass.sellingPrice * (adults + children + infants)
}

// Helper para obtener el precio más bajo de todas las clases
function getLowestPrice(classes: any[], adults: number, children: number, infants: number) {
  if (!classes || classes.length === 0) return { price: 0, currency: 'USD', classType: 'economy' }
  
  const lowest = classes.reduce((min, current) => {
    const minPrice = calculateTotalPrice(min, adults, children, infants)
    const currentPrice = calculateTotalPrice(current, adults, children, infants)
    return currentPrice < minPrice ? current : min
  })
  
  const totalPrice = calculateTotalPrice(lowest, adults, children, infants)
  
  return {
    price: totalPrice,
    currency: lowest.pricing?.adult?.currency || lowest.sellingCurrency || 'USD',
    classType: lowest.type
  }
}

// Helper para traducir tipo de clase
const translateClassType = (type: string): string => {
  const translations: Record<string, string> = {
    economy: 'Económica',
    premium_economy: 'Premium Economy',
    business: 'Business',
    first: 'Primera Clase'
  }
  return translations[type] || type
}

// Helper para obtener iconos de amenidades
const getAmenityIcon = (amenity: string) => {
  const amenityLower = amenity.toLowerCase()
  if (amenityLower.includes('wifi')) return <Wifi size={14} />
  if (amenityLower.includes('comida') || amenityLower.includes('meal')) return <Utensils size={14} />
  if (amenityLower.includes('entretenimiento') || amenityLower.includes('tv')) return <Tv size={14} />
  if (amenityLower.includes('usb') || amenityLower.includes('power')) return <Zap size={14} />
  return null
}

export default function FlightResultCard({ flight, passengers, adults, children, infants, onSelect }: FlightResultCardProps) {
  const router = useRouter()
  
  // Usar tipos de pasajeros si están disponibles, sino usar total
  const numAdults = adults || passengers || 1
  const numChildren = children || 0
  const numInfants = infants || 0
  
  const departureInfo = formatDateTime(flight.departure.dateTime)
  const arrivalInfo = formatDateTime(flight.arrival.dateTime)
  const durationStr = formatDuration(flight.duration)
  const lowestPrice = getLowestPrice(flight.classes, numAdults, numChildren, numInfants)
  
  // Obtener ciudades de escalas
  const stopCities = flight.layovers?.map(l => l.city) || []
  
  // Obtener información de la clase más económica
  const cheapestClass = flight.classes.find(c => {
    const totalPrice = calculateTotalPrice(c, numAdults, numChildren, numInfants)
    return totalPrice === lowestPrice.price
  })
  
  const handleSelectFlight = () => {
    // Navegar a página de reserva con los parámetros del vuelo y la clase más económica
    const classType = cheapestClass?.type || 'economy'
    router.push(`/booking/flights?outbound=${flight._id}&passengers=${passengers}&classType=${classType}`)
  }
  
  return (
    <>
      
      <Card className="w-full hover:shadow-lg transition-all duration-200 hover:border-primary/30">
      <CardBody className="p-0">
        <div className="flex flex-col">
          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-4 p-4">
            {/* Flight Details */}
            <div className="flex-1">
              {/* Header con aerolínea y fecha */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Logo de aerolínea */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {flight.airline.logoUrl ? (
                      <img 
                        src={flight.airline.logoUrl} 
                        alt={flight.airline.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          // Fallback a iniciales si falla la imagen
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.innerHTML = `<div class="text-sm font-bold text-primary">${flight.airline.iataCode}</div>`
                        }}
                      />
                    ) : (
                      <div className="text-sm font-bold text-primary">
                        {flight.airline.iataCode}
                      </div>
                    )}
                  </div>
                  {/* Info de aerolínea */}
                  <div>
                    <div className="font-semibold text-foreground text-sm">{flight.airline.name}</div>
                    <div className="text-xs text-foreground/60">{flight.flightNumber}</div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                  {departureInfo.date}
                </div>
              </div>

              {/* Flight Info */}
              <div className="flex items-center gap-2 sm:gap-4">
              {/* Departure */}
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold">{departureInfo.time}</div>
                <div className="text-sm font-semibold text-foreground/80">
                  {flight.departure.airport}
                </div>
                <div className="text-xs text-foreground/60">{flight.departure.city}</div>
              </div>

              {/* Duration & Stops */}
              <div className="flex-1 px-2 sm:px-4">
                <div className="relative">
                  {/* Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-divider -translate-y-1/2" />
                  
                  {/* Stop indicator */}
                  {flight.stops > 0 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                      <div className="w-2 h-2 rounded-full bg-warning mx-auto" />
                    </div>
                  )}
                </div>
                
                <div className="text-center mt-4 space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs font-medium text-foreground/60">
                    <Clock size={12} />
                    {durationStr}
                  </div>
                  {flight.stops === 0 ? (
                    <Chip size="sm" color="success" variant="flat" className="text-[10px] h-5">
                      Directo
                    </Chip>
                  ) : (
                    <Chip size="sm" color="warning" variant="flat" className="text-[10px] h-5">
                      {flight.stops} {flight.stops === 1 ? 'escala' : 'escalas'}
                      {stopCities.length > 0 && ` · ${stopCities.join(', ')}`}
                    </Chip>
                  )}
                </div>
              </div>

              {/* Arrival */}
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold">{arrivalInfo.time}</div>
                <div className="text-sm font-semibold text-foreground/80">
                  {flight.arrival.airport}
                </div>
                <div className="text-xs text-foreground/60">{flight.arrival.city}</div>
              </div>
            </div>

            {/* Baggage & Amenities Info */}
            {cheapestClass && (
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-divider/50">
                {/* Carry-on */}
                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <Briefcase size={14} className="text-primary" />
                  <span className="font-medium">{cheapestClass.baggage.carry}</span>
                </div>
                
                {/* Checked baggage */}
                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <Luggage size={14} className="text-primary" />
                  <span className="font-medium">{cheapestClass.baggage.checked}</span>
                </div>
                
                {/* Available seats */}
                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <Users size={14} className="text-primary" />
                  <span className="font-medium">{cheapestClass.availableSeats} asientos</span>
                </div>

                {/* Amenities */}
                {cheapestClass.amenities && cheapestClass.amenities.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-px bg-divider" />
                    {cheapestClass.amenities.slice(0, 3).map((amenity, idx) => {
                      const icon = getAmenityIcon(amenity)
                      return icon ? (
                        <div key={idx} className="text-primary" title={amenity}>
                          {icon}
                        </div>
                      ) : null
                    })}
                    {cheapestClass.amenities.length > 3 && (
                      <span className="text-xs text-foreground/50">+{cheapestClass.amenities.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Price & Action */}
            <div className="flex flex-col items-center justify-center gap-2 lg:w-36 border-t lg:border-t-0 lg:border-l border-divider p-3 lg:pl-4">
              {/* Trip type indicator */}
              <div className="flex items-center justify-center gap-1">
                <ArrowRight size={12} className="text-primary" />
                <span className="text-[9px] text-foreground/60 uppercase tracking-wide">Solo ida</span>
              </div>
              
              {/* Availability warning */}
              {flight.classes.some(c => c.availableSeats <= 5) && (
                <Chip size="sm" color="warning" variant="flat" className="text-[9px] h-5">
                  Últimos asientos
                </Chip>
              )}
              
              {/* Button with price */}
              <Button
                color="primary"
                size="lg"
                className="w-full font-bold flex flex-col gap-0 h-auto py-3"
                onPress={handleSelectFlight}
              >
                <span className="text-2xl">${lowestPrice.price.toLocaleString()}</span>
                <span className="text-[10px] font-normal opacity-90">{lowestPrice.currency} • {translateClassType(lowestPrice.classType)}</span>
                {(numAdults + numChildren + numInfants) > 1 && (
                  <span className="text-[9px] font-normal opacity-70">
                    {numAdults > 0 && `${numAdults} adulto${numAdults > 1 ? 's' : ''}`}
                    {numChildren > 0 && ` ${numChildren} niño${numChildren > 1 ? 's' : ''}`}
                    {numInfants > 0 && ` ${numInfants} bebé${numInfants > 1 ? 's' : ''}`}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
    </>
  )
}
