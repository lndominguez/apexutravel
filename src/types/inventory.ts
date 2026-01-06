// Tipos compartidos para el sistema de inventario

export type Currency = 'USD' | 'MXN' | 'EUR' | 'CAD'

export type ServiceStatus = 'active' | 'inactive' | 'sold_out' | 'cancelled' | 'maintenance'

// ============================================
// PRICING - Sistema de Costos y Precios
// ============================================

export interface PricingBase {
  // Precio del proveedor (lo que pagamos)
  costPrice: number
  costCurrency: Currency
  
  // Nuestro markup (% de ganancia)
  markup: number
  
  // Precio de venta (lo que cobra el cliente)
  sellingPrice: number
  sellingCurrency: Currency
}

/**
 * Calcula el precio de venta basado en costo y markup
 */
export function calculateSellingPrice(costPrice: number, markup: number): number {
  return costPrice * (1 + markup / 100)
}

/**
 * Calcula la ganancia
 */
export function calculateProfit(costPrice: number, sellingPrice: number): number {
  return sellingPrice - costPrice
}

/**
 * Calcula el markup basado en costo y precio de venta
 */
export function calculateMarkup(costPrice: number, sellingPrice: number): number {
  return ((sellingPrice - costPrice) / costPrice) * 100
}

// ============================================
// SUPPLIER TYPES
// ============================================

export type SupplierType = 
  | 'airline'
  | 'hotel_chain'
  | 'tour_operator'
  | 'transport_company'
  | 'activity_provider'
  | 'insurance_company'
  | 'other_agency'

export type SupplierStatus = 'active' | 'inactive' | 'suspended' | 'pending_approval'

export type PaymentMethod = 'prepaid' | 'credit' | 'cash' | 'mixed'

export interface SupplierContact {
  name: string
  position: string
  email: string
  phone: string
  isPrimary: boolean
}

export interface SupplierPaymentTerms {
  method: PaymentMethod
  creditDays?: number
  currency: Currency
}

// ============================================
// AIRCRAFT TYPES
// ============================================

export interface AircraftCabinConfiguration {
  class: 'economy' | 'premium economy' | 'business' | 'first'
  rows: number[]  // [1, 2, 3, 4] o [5, 6, 7, ..., 30]
  columns: string[]  // ['A', 'B', 'C', 'D', 'E', 'F']
  layout: string  // '3-3', '2-2', '1-2-1', '2-4-2', '3-3-3'
  totalSeats: number
  seatPitch?: number  // Espacio entre asientos en pulgadas
  seatWidth?: number  // Ancho del asiento en pulgadas
  features?: string[]  // ['lie-flat', 'power outlet', 'extra legroom']
}

export interface AircraftType {
  _id?: string
  aircraftModel: string  // 'Boeing 737-800'
  manufacturer: string  // 'Boeing'
  iataCode?: string  // '738'
  icaoCode?: string  // 'B738'
  totalSeats: number
  range?: number  // Alcance en km
  cruiseSpeed?: number  // Velocidad de crucero en km/h
  cabinConfiguration: AircraftCabinConfiguration[]
  images?: {
    exterior?: string
    seatMap?: string
  }
  createdAt?: Date
  updatedAt?: Date
}

// ============================================
// FLIGHT TYPES
// ============================================

export type FlightClass = 'economy' | 'premium economy' | 'business' | 'first'

export interface FlightLocation {
  airport: string // Código IATA
  city: string
  country: string
  terminal?: string
  dateTime: Date
}

export interface FlightLayover {
  airport: string
  city: string
  duration: number // minutos
}

export interface FlightClassPricing extends PricingBase {
  type: FlightClass
  availableSeats: number
  baggage: {
    carry: string
    checked: string
  }
  seatSelection?: boolean // true = puede seleccionar asientos (gratis o de pago), false = asignado automáticamente
  amenities: string[]
  // Asientos individuales de esta clase (estado actual del vuelo)
  availableSeatsDetail?: Array<{
    seatNumber: string
    status: 'available' | 'occupied' | 'reserved'
    price: number // 0 = gratis, >0 = de pago
  }>
  // NOTA: La configuración de filas/columnas/layout viene de AircraftType.cabinConfiguration
}

// ============================================
// HOTEL TYPES
// ============================================

export type HotelPlanType = 
  | 'room_only'
  | 'breakfast'
  | 'half_board'
  | 'full_board'
  | 'all_inclusive'

export interface HotelLocation {
  address: string
  city: string
  state: string
  country: string
  postalCode?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  zone?: string
}

export interface HotelRoomPlan extends PricingBase {
  type: HotelPlanType
  costPerNight: number
  sellingPricePerNight: number
  minNights?: number
  maxNights?: number
}

export interface HotelRoomType {
  name: string
  description: string
  capacity: {
    adults: number
    children: number
  }
  size: number // m²
  bedType: string
  amenities: string[]
  totalRooms: number
  availableRooms: number
  plans: HotelRoomPlan[]
  images?: string[]
}

// ============================================
// TRANSPORT TYPES
// ============================================

export type TransportType = 
  | 'private_car'
  | 'shared_shuttle'
  | 'bus'
  | 'van'
  | 'limousine'
  | 'taxi'
  | 'train'
  | 'ferry'
  | 'other'

export type LocationType = 'airport' | 'hotel' | 'address' | 'port' | 'station'

export interface TransportLocation {
  type: LocationType
  name: string
  address: string
  city: string
  country: string
}

export interface TransportRoute {
  origin: TransportLocation
  destination: TransportLocation
  distance?: number // km
  estimatedDuration?: number // minutos
}

export type TransportScheduleType = 'fixed' | 'flexible' | 'on_demand'

export type PricingType = 'per_vehicle' | 'per_person' | 'per_trip'

export interface TransportPricing extends PricingBase {
  costType: PricingType
  sellingType: PricingType
}

// ============================================
// PACKAGE TYPES
// ============================================

export type PackageCategory = 
  | 'beach'
  | 'adventure'
  | 'cultural'
  | 'romantic'
  | 'family'
  | 'business'
  | 'cruise'
  | 'all_inclusive'

export type PackageDifficulty = 'easy' | 'moderate' | 'challenging'

export type PackageStatus = 'draft' | 'active' | 'inactive' | 'archived'

export interface PackageComponent {
  costPrice: number
  sellingPrice: number
}

export interface PackageFlightComponent extends PackageComponent {
  flight: string // ID del vuelo
  type: 'outbound' | 'return' | 'internal'
}

export interface PackageHotelComponent extends PackageComponent {
  hotel: string // ID del hotel
  roomType: string
  plan: string
  nights: number
}

export interface PackageTransportComponent extends PackageComponent {
  transport: string // ID del transporte
  type: string
  description: string
}

export interface PackageActivity extends PackageComponent {
  name: string
  description: string
  duration: string
  included: boolean
  optional: boolean
}

export interface PackageComponents {
  flights?: PackageFlightComponent[]
  hotels?: PackageHotelComponent[]
  transports?: PackageTransportComponent[]
  activities?: PackageActivity[]
  insurance?: {
    type: string
    coverage: string
    costPrice: number
    sellingPrice: number
  }
  extras?: Array<{
    name: string
    description: string
    included: boolean
    costPrice: number
    sellingPrice: number
  }>
}

export interface PackagePricing {
  totalCost: number
  packageMarkup: number
  baseSellingPrice: number
  pricePerPerson: {
    single: number
    double: number
    triple?: number
    child?: number
  }
  currency: Currency
  discounts?: Array<{
    type: 'early_bird' | 'group' | 'seasonal' | 'promotional'
    description: string
    percentage: number
    validFrom: Date
    validTo: Date
  }>
}

export interface PackageItineraryDay {
  day: number
  title: string
  description: string
  activities: string[]
  meals: {
    breakfast: boolean
    lunch: boolean
    dinner: boolean
  }
  accommodation?: string
}

/**
 * Calcula el costo total de un paquete sumando todos sus componentes
 */
export function calculatePackageTotalCost(components: PackageComponents): number {
  let total = 0
  
  // Sumar vuelos
  components.flights?.forEach(f => {
    total += f.costPrice
  })
  
  // Sumar hoteles (costo por noche × noches)
  components.hotels?.forEach(h => {
    total += h.costPrice * h.nights
  })
  
  // Sumar transportes
  components.transports?.forEach(t => {
    total += t.costPrice
  })
  
  // Sumar actividades
  components.activities?.forEach(a => {
    total += a.costPrice
  })
  
  // Sumar seguro
  if (components.insurance) {
    total += components.insurance.costPrice
  }
  
  // Sumar extras
  components.extras?.forEach(e => {
    total += e.costPrice
  })
  
  return total
}

/**
 * Calcula el precio de venta de un paquete
 */
export function calculatePackageSellingPrice(totalCost: number, packageMarkup: number): number {
  return calculateSellingPrice(totalCost, packageMarkup)
}

// ============================================
// AVAILABILITY TYPES
// ============================================

export interface Availability {
  startDate: Date
  endDate: Date
  maxCapacity: number
  currentBookings: number
  status: ServiceStatus
}

export function isAvailable(availability: Availability): boolean {
  const now = new Date()
  const hasCapacity = availability.currentBookings < availability.maxCapacity
  const isInDateRange = now >= availability.startDate && now <= availability.endDate
  const isActive = availability.status === 'active'
  
  return hasCapacity && isInDateRange && isActive
}

// ============================================
// FILTER TYPES
// ============================================

export interface InventoryFilters {
  search?: string
  supplier?: string
  status?: ServiceStatus
  minPrice?: number
  maxPrice?: number
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

export interface SupplierFilters {
  search?: string
  type?: SupplierType
  status?: SupplierStatus
  country?: string
  page?: number
  limit?: number
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export interface InventoryResponse<T> {
  items: T[]
  pagination: PaginationInfo
}
