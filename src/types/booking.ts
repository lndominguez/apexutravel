// Tipos para el sistema de reservas

export interface BookingStepConfig {
  id: string
  label: string
  description?: string
  completed: boolean
  current?: boolean
  number?: number
}

export interface PassengerInfo {
  id: string
  type: 'adult' | 'child' | 'infant'
  title?: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Miss'
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  passportNumber?: string
  passportExpiry?: string
  gender?: 'male' | 'female' | 'other'
  email?: string
  phone?: string
}

export interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  countryCode?: string
  address?: string
  city?: string
  country?: string
  postalCode?: string
}

export interface BookingData {
  passengers: PassengerInfo[]
  contact: ContactInfo
  specialRequests?: string
  agreeToTerms: boolean
}

export interface FlightBooking {
  outboundFlightId: string
  returnFlightId?: string
  selectedClass: string
  passengers: PassengerInfo[]
  contact: ContactInfo
  totalPrice: number
  currency: string
}

export interface HotelBooking {
  hotelId: string
  roomType: string
  checkIn: string
  checkOut: string
  guests: number
  specialRequests?: string
  contact: ContactInfo
  totalPrice: number
  currency: string
}

export interface PackageBooking {
  packageId: string
  startDate: string
  passengers: PassengerInfo[]
  contact: ContactInfo
  selectedOptions?: Record<string, any>
  totalPrice: number
  currency: string
}
