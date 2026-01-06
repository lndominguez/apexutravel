'use client'

import { useRouter } from 'next/navigation'
import { Card, CardBody, Button, Chip, Divider } from '@heroui/react'
import { Plane, Clock, ArrowRight, ArrowLeftRight, Briefcase, Luggage, Users, Wifi, Utensils, Tv, Zap } from 'lucide-react'
import { FlightData } from './FlightResultCard'

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

interface RoundtripFlightCardProps {
  outboundFlight: FlightData
  returnFlight: FlightData
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

// Helper para obtener el precio más bajo
const getLowestPrice = (classes: any[], adults: number, children: number, infants: number): number => {
  if (!classes || classes.length === 0) return 0
  
  const prices = classes.map(c => calculateTotalPrice(c, adults, children, infants))
  return Math.min(...prices)
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
  if (amenityLower.includes('wifi')) return <Wifi size={12} />
  if (amenityLower.includes('comida') || amenityLower.includes('meal')) return <Utensils size={12} />
  if (amenityLower.includes('entretenimiento') || amenityLower.includes('tv')) return <Tv size={12} />
  if (amenityLower.includes('usb') || amenityLower.includes('power')) return <Zap size={12} />
  return null
}

// Componente para renderizar un vuelo individual en formato compacto horizontal
function FlightSegment({ flight, label }: { flight: FlightData; label: string }) {
  const departureInfo = formatDateTime(flight.departure.dateTime)
  const arrivalInfo = formatDateTime(flight.arrival.dateTime)
  const durationStr = formatDuration(flight.duration)

  return (
    <div className="flex flex-col">
      {/* Label con logo de aerolínea */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Plane size={12} className={label === 'Ida' ? 'text-primary' : 'text-secondary'} />
          <span className="text-xs font-bold uppercase tracking-wide">
            {label}
          </span>
          <span className="text-[10px] text-foreground/60">
            {departureInfo.date}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Info de aerolínea */}
          <div className="text-right">
            <div className="text-[10px] font-semibold text-foreground leading-tight">{flight.airline.name}</div>
            <div className="text-[9px] text-foreground/60">{flight.flightNumber}</div>
          </div>
          {/* Logo de aerolínea */}
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {flight.airline.logoUrl ? (
              <img 
                src={flight.airline.logoUrl} 
                alt={flight.airline.name}
                className="w-full h-full object-contain p-0.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML = `<div class="text-[10px] font-bold text-primary">${flight.airline.iataCode}</div>`
                }}
              />
            ) : (
              <div className="text-[10px] font-bold text-primary">
                {flight.airline.iataCode}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flight Route */}
      <div className="flex items-center gap-3">
        {/* Departure */}
        <div className="flex-shrink-0">
          <div className="text-xl font-bold">{departureInfo.time}</div>
          <div className="text-xs font-semibold text-foreground/80">
            {flight.departure.airport}
          </div>
        </div>

        {/* Duration & Stops */}
        <div className="flex-1 px-3">
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-divider -translate-y-1/2" />
            {flight.stops > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-warning" />
              </div>
            )}
          </div>
          <div className="text-center mt-3">
            <div className="flex items-center justify-center gap-1 text-[10px] text-foreground/60">
              <Clock size={10} />
              {durationStr}
            </div>
            {flight.stops === 0 ? (
              <Chip size="sm" color="success" variant="flat" className="text-[9px] h-4 mt-1">
                Directo
              </Chip>
            ) : (
              <Chip size="sm" color="warning" variant="flat" className="text-[9px] h-4 mt-1">
                {flight.stops} escala{flight.stops > 1 ? 's' : ''}
                 {flight.layovers && flight.layovers.length > 0 && (
          <span> : {flight.layovers.map(l => l.city).join(', ')}</span>
        )}
              </Chip>
            )}
          </div>
        </div>

        {/* Arrival */}
        <div className="flex-shrink-0 text-right">
          <div className="text-xl font-bold">{arrivalInfo.time}</div>
          <div className="text-xs font-semibold text-foreground/80">
            {flight.arrival.airport}
          </div>
        </div>
      </div>

      {/* Airline info */}
      <div className="text-[10px] text-foreground/60 mt-2">
        {flight.airline.name} • {flight.flightNumber}
      </div>

      {/* Baggage & Amenities */}
      {flight.classes && flight.classes.length > 0 && (() => {
        const cheapestClass = flight.classes.reduce((min, c) => c.sellingPrice < min.sellingPrice ? c : min)
        return (
          <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-divider/50">
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/60">
              <Briefcase size={12} className="text-primary/70" />
              <span>{cheapestClass.baggage.carry}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/60">
              <Luggage size={12} className="text-primary/70" />
              <span>{cheapestClass.baggage.checked}</span>
            </div>
            {cheapestClass.amenities && cheapestClass.amenities.length > 0 && (
              <div className="flex items-center gap-1.5">
                {cheapestClass.amenities.slice(0, 2).map((amenity, idx) => {
                  const icon = getAmenityIcon(amenity)
                  return icon ? (
                    <div key={idx} className="text-primary/70" title={amenity}>
                      {icon}
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

export default function RoundtripFlightCard({ 
  outboundFlight, 
  returnFlight,
  passengers,
  adults,
  children,
  infants,
  onSelect 
}: RoundtripFlightCardProps) {
  const router = useRouter()
  
  // Usar tipos de pasajeros si están disponibles, sino usar total
  const numAdults = adults || passengers || 1
  const numChildren = children || 0
  const numInfants = infants || 0
  
  const outboundPrice = getLowestPrice(outboundFlight.classes, numAdults, numChildren, numInfants)
  const returnPrice = getLowestPrice(returnFlight.classes, numAdults, numChildren, numInfants)
  const totalPrice = outboundPrice + returnPrice
  const currency = outboundFlight.classes[0]?.pricing?.adult?.currency || outboundFlight.classes[0]?.sellingCurrency || 'USD'
  
  // Obtener la clase más económica de ambos vuelos
  const outboundLowestClass = [...outboundFlight.classes].sort((a, b) => {
    const priceA = calculateTotalPrice(a, numAdults, numChildren, numInfants)
    const priceB = calculateTotalPrice(b, numAdults, numChildren, numInfants)
    return priceA - priceB
  })[0]
  const returnLowestClass = [...returnFlight.classes].sort((a, b) => {
    const priceA = calculateTotalPrice(a, numAdults, numChildren, numInfants)
    const priceB = calculateTotalPrice(b, numAdults, numChildren, numInfants)
    return priceA - priceB
  })[0]
  const lowestClassType = outboundLowestClass?.type || 'economy'
  
  const handleSelectFlight = () => {
    // Navegar a página de reserva con ambos vuelos y la clase más económica
    router.push(`/booking/flights?outbound=${outboundFlight._id}&return=${returnFlight._id}&passengers=${passengers}&classType=${lowestClassType}`)
  }

  return (
    <>
      
      <Card className="w-full hover:shadow-lg transition-all duration-200 hover:border-primary/30">
        <CardBody className="p-0">
          <div className="flex flex-col lg:flex-row gap-3 p-4">
            {/* IDA - Left Side */}
            <div className="flex-1">
              <FlightSegment flight={outboundFlight} label="Ida" />
            </div>

            {/* Divider discontinuo vertical en desktop, horizontal en mobile */}
            <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-divider/40 to-transparent">
              <div className="h-full border-l-2 border-dashed border-divider/30"></div>
            </div>
            <div className="lg:hidden h-px bg-gradient-to-r from-transparent via-divider/40 to-transparent">
              <div className="w-full border-t-2 border-dashed border-divider/30"></div>
            </div>

            {/* REGRESO - Right Side */}
            <div className="flex-1">
              <FlightSegment flight={returnFlight} label="Regreso" />
            </div>

            {/* Price & Action */}
            <div className="flex flex-col items-center justify-center gap-2 lg:w-36 border-t lg:border-t-0 lg:border-l border-divider p-3 lg:pl-4">
              {/* Trip type indicator */}
              <div className="flex items-center justify-center gap-1">
                <ArrowLeftRight size={12} className="text-primary" />
                <span className="text-[9px] text-foreground/60 uppercase tracking-wide">Ida y vuelta</span>
              </div>

              {/* Availability warning */}
              {(outboundFlight.classes.some(c => c.availableSeats <= 5) || 
                returnFlight.classes.some(c => c.availableSeats <= 5)) && (
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
                <span className="text-2xl">${totalPrice.toLocaleString()}</span>
                <span className="text-[10px] font-normal opacity-90">{currency} • {translateClassType(lowestClassType)}</span>
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
        </CardBody>
      </Card>
    </>
  )
}
