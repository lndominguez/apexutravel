// Tipos para búsqueda y reserva de vuelos

export interface Airport {
  code: string
  name: string
  city: string
  country: string
}

export interface FlightSegment {
  departureTime: string
  departureCity: string
  departureAirport: string
  arrivalTime: string
  arrivalCity: string
  arrivalAirport: string
  duration: string
  flightNumber: string
  airline: {
    code: string
    name: string
  }
  aircraft?: string
  cabin: string
}

export interface FlightItinerary {
  segments: FlightSegment[]
  totalDuration: string
  isDirect: boolean
  stops: number
}

export interface FlightFare {
  type: 'basic' | 'guarantee'
  price: number
  currency: string
  description?: string
}

export interface FlightOffer {
  id: string
  type: 'one-way' | 'round-trip'
  outbound: FlightItinerary
  inbound?: FlightItinerary
  return?: FlightItinerary
  price: number
  fares: FlightFare[]
  priceDetails?: {
    total: number
    currency: string
    breakdown?: {
      base: number
      taxes: number
      fees: number
    }
  }
  availableSeats: number
  cabin: string
  baggage?: {
    checked?: number
    cabin?: number
  }
  amenities?: string[]
  refundable?: boolean
  changeable?: boolean
}

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: {
    adults: number
    children: number
    infants: number
  }
  cabin: 'economy' | 'premium_economy' | 'business' | 'first'
  directOnly?: boolean
}

export interface FlightSearchResult {
  offers: FlightOffer[]
  searchParams: FlightSearchParams
  totalResults: number
}
