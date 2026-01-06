import mongoose, { Schema, Document } from 'mongoose'

export interface IHotel extends Document {
  // Relación con proveedor
  supplier: mongoose.Types.ObjectId
  
  // Información básica
  name: string
  chain?: string // Cadena hotelera si aplica
  category: number // Estrellas 1-5
  
  // Ubicación
  location: {
    address: string
    city: string
    state: string
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
  
  // Descripción y amenidades
  description: string
  amenities: string[] // ['pool', 'spa', 'gym', 'restaurant', 'wifi', 'parking', 'beach_access']
  
  // Tipos de habitación con precios
  roomTypes: Array<{
    name: string // ej: "Habitación Estándar", "Suite Junior"
    description: string
    capacity: {
      adults: number
      children: number
    }
    size: number // m²
    bedType: string // ej: "1 King", "2 Queen"
    amenities: string[]
    
    // Disponibilidad
    totalRooms: number
    availableRooms: number
    
    // Precios por plan
    plans: Array<{
      type: 'room_only' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive'
      
      // Precio del proveedor (COSTO)
      costPerNight: number
      costCurrency: string
      
      // Nuestro precio (VENTA)
      markup: number // % de ganancia
      sellingPricePerNight: number
      sellingCurrency: string
      
      // Restricciones
      minNights?: number
      maxNights?: number
    }>
    
    // Imágenes
    images?: string[]
  }>
  
  // Políticas
  checkIn: string // ej: "15:00"
  checkOut: string // ej: "12:00"
  cancellationPolicy: string
  childPolicy?: string
  petPolicy?: string
  
  // Calificación
  rating?: number // 1-10
  reviews?: number
  
  // Estado
  status: 'active' | 'inactive' | 'maintenance'
  
  // Temporadas y disponibilidad
  seasons?: Array<{
    name: string // ej: "Temporada Alta"
    startDate: Date
    endDate: Date
    priceMultiplier: number // 1.2 = 20% más caro
  }>
  
  // Metadata
  images?: string[]
  notes?: string
  tags?: string[] // ['beach', 'family', 'romantic', 'business']
  
  // Auditoría
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const HotelSchema = new Schema<IHotel>({
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  
  name: { type: String, required: true, index: true },
  chain: String,
  category: { type: Number, required: true, min: 1, max: 5 },
  
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
  
  phone: { type: String, required: true },
  email: { type: String, required: true },
  website: String,
  
  description: { type: String, required: true },
  amenities: [String],
  
  roomTypes: [{
    name: { type: String, required: true },
    description: String,
    capacity: {
      adults: { type: Number, required: true },
      children: { type: Number, default: 0 }
    },
    size: Number,
    bedType: String,
    amenities: [String],
    
    totalRooms: { type: Number, required: true },
    availableRooms: { type: Number, required: true },
    
    plans: [{
      type: {
        type: String,
        required: true,
        enum: ['room_only', 'breakfast', 'half_board', 'full_board', 'all_inclusive']
      },
      
      costPerNight: { type: Number, required: true },
      costCurrency: { type: String, default: 'USD' },
      
      markup: { type: Number, required: true },
      sellingPricePerNight: { type: Number, required: true },
      sellingCurrency: { type: String, default: 'USD' },
      
      minNights: Number,
      maxNights: Number
    }],
    
    images: [String]
  }],
  
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  cancellationPolicy: String,
  childPolicy: String,
  petPolicy: String,
  
  rating: { type: Number, min: 1, max: 10 },
  reviews: Number,
  
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  
  seasons: [{
    name: String,
    startDate: Date,
    endDate: Date,
    priceMultiplier: { type: Number, default: 1 }
  }],
  
  images: [String],
  notes: String,
  tags: [String],
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

// Índices para búsquedas
HotelSchema.index({ name: 'text', description: 'text' })
HotelSchema.index({ 'location.city': 1, 'location.country': 1 })
HotelSchema.index({ supplier: 1, status: 1 })
HotelSchema.index({ category: 1 })

export default mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema)
