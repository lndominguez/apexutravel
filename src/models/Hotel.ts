import mongoose, { Schema, Document } from 'mongoose'

// Enums para tipos de habitación
export type RoomCategory = 'standard' | 'superior' | 'deluxe' | 'junior_suite' | 'suite' | 'luxury' | 'presidential'
export type RoomOccupancy = 'single' | 'double' | 'triple' | 'quad'
export type RoomViewType = 'ocean_view' | 'city_view' | 'garden_view' | 'pool_view' | 'mountain_view' | 'balcony' | 'no_view'

export interface IRoomType {
  name: string // ej: "Habitación Deluxe con Vista al Mar"
  description: string
  
  // Características que influyen en precio (pero NO hay precio aquí)
  category: RoomCategory // Standard, Deluxe, Suite, etc.
  occupancy: RoomOccupancy[] // Array porque un cuarto puede ser simple, doble y triple al mismo tiempo
  viewType: RoomViewType[] // Array porque un cuarto puede tener múltiples vistas/características
  
  // Amenidades de la habitación
  amenities: string[]
  
  // Imágenes de la habitación
  images?: string[]
}

export interface IHotel extends Document {
  // Información básica del hotel (CATÁLOGO - SIN PRECIOS)
  name: string
  chain?: string // Cadena hotelera si aplica (ej: "Marriott", "Hilton")
  stars: number // Categoría de estrellas: 1-5
  
  // Ubicación
  location: {
    address: string
    city: string
    state?: string
    country: string
    postalCode?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    zone?: string // ej: "Zona Hotelera", "Centro Histórico"
  }
  
  // Contacto
  phone: string
  email: string
  website?: string
  
  // Descripción y amenidades del hotel
  description: string
  amenities: string[] // ['pool', 'spa', 'gym', 'restaurant', 'wifi', 'parking', 'beach_access', 'bar', 'room_service']
  
  // Fotos principales del hotel
  photos: string[]
  
  // Tipos de habitación disponibles (SIN PRECIOS)
  roomTypes: IRoomType[]
  
  // Políticas del hotel
  policies: {
    checkIn: string // ej: "15:00"
    checkOut: string // ej: "12:00"
    cancellation?: string
    children?: string
    pets?: string
  }
  
  // Información adicional
  rating?: number // Calificación promedio 1-10
  reviews?: number // Número de reseñas
  tags?: string[] // ['beach', 'family', 'romantic', 'business', 'luxury', 'budget']
  notes?: string // Notas internas
  
  // Estado
  status: 'active' | 'inactive'
  
  // Auditoría
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const HotelSchema = new Schema<IHotel>({
  // Información básica
  name: { type: String, required: true, index: true },
  chain: String,
  stars: { type: Number, required: true, min: 1, max: 5 },
  
  // Ubicación
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: String,
    country: { type: String, required: true, index: true },
    postalCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    zone: String
  },
  
  // Contacto
  phone: { type: String, required: true },
  email: { type: String, required: true },
  website: String,
  
  // Descripción y amenidades
  description: { type: String, required: true },
  amenities: [String],
  
  // Fotos principales del hotel
  photos: { type: [String], default: [] },
  
  // Tipos de habitación (SIN PRECIOS)
  roomTypes: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    
    // Características que influyen en precio
    category: {
      type: String,
      required: true,
      enum: ['standard', 'superior', 'deluxe', 'junior_suite', 'suite', 'luxury', 'presidential']
    },
    occupancy: [{
      type: String,
      enum: ['single', 'double', 'triple', 'quad']
    }],
    viewType: [{
      type: String,
      enum: ['ocean_view', 'city_view', 'garden_view', 'pool_view', 'mountain_view', 'balcony', 'no_view']
    }],
    
    // Amenidades de la habitación
    amenities: [String],
    
    // Imágenes de la habitación
    images: [String]
  }],
  
  // Políticas
  policies: {
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    cancellation: String,
    children: String,
    pets: String
  },
  
  // Información adicional
  rating: { type: Number, min: 1, max: 10 },
  reviews: Number,
  tags: [String],
  notes: String,
  
  // Estado
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // Auditoría
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

// Índices para búsquedas
HotelSchema.index({ name: 'text', description: 'text' })
HotelSchema.index({ 'location.city': 1, 'location.country': 1 })
HotelSchema.index({ status: 1 })
HotelSchema.index({ stars: 1 })

export default mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema)
