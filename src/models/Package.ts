import mongoose, { Schema, Document } from 'mongoose'

export interface IPackage extends Document {
  // Información básica
  name: string
  description: string
  destination: {
    city: string
    cityNormalized?: string
    country: string
    countryNormalized?: string
    region?: string
    state?: string
  }
  
  // Duración
  duration: {
    days: number
    nights: number
  }
  
  // Categoría y tipo
  category: 'beach' | 'adventure' | 'cultural' | 'romantic' | 'family' | 'business' | 'cruise' | 'all_inclusive'
  difficulty?: 'easy' | 'moderate' | 'challenging'
  
  // Componentes del paquete (servicios incluidos)
  components: {
    // Vuelos incluidos
    flights?: Array<{
      flight: mongoose.Types.ObjectId // Referencia a Flight
      type: 'outbound' | 'return' | 'internal'
      costPrice: number
      sellingPrice: number
    }>
    
    // Hoteles incluidos
    hotels?: Array<{
      hotel: mongoose.Types.ObjectId // Referencia a Hotel
      roomType: string
      plan: string // 'breakfast', 'all_inclusive', etc.
      nights: number
      costPrice: number
      sellingPrice: number
    }>
    
    // Transportes incluidos
    transports?: Array<{
      transport: mongoose.Types.ObjectId // Referencia a Transport
      type: string
      description: string
      costPrice: number
      sellingPrice: number
    }>
    
    // Actividades incluidas
    activities?: Array<{
      name: string
      description: string
      duration: string
      included: boolean
      optional: boolean
      costPrice: number
      sellingPrice: number
    }>
    
    // Seguros
    insurance?: {
      type: string
      coverage: string
      costPrice: number
      sellingPrice: number
    }
    
    // Otros servicios
    extras?: Array<{
      name: string
      description: string
      included: boolean
      costPrice: number
      sellingPrice: number
    }>
  }
  
  // Itinerario día por día
  itinerary: Array<{
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
  }>
  
  // PRECIOS MOVIDOS AL INVENTARIO
  // Los precios se gestionan ahora mediante el sistema de inventario
  // permitiendo múltiples combinaciones de proveedor/temporada/precio
  
  // Markup opcional: ganancia adicional sobre el total de componentes
  markup?: number
  
  // Disponibilidad
  availability: {
    startDate: Date
    endDate: Date
    maxParticipants: number
    minParticipants: number
    currentBookings: number
    status: 'available' | 'limited' | 'sold_out' | 'cancelled'
  }
  
  // Inclusiones y exclusiones
  included: string[] // Lista de lo que incluye
  notIncluded: string[] // Lista de lo que NO incluye
  
  // Requisitos
  requirements?: {
    passport: boolean
    visa: boolean
    vaccination?: string[]
    minAge?: number
    maxAge?: number
    fitnessLevel?: string
  }
  
  // Políticas
  cancellationPolicy: string
  paymentPolicy: string
  
  // Proveedores involucrados (para referencia)
  suppliers: mongoose.Types.ObjectId[]
  
  // Media
  images: string[]
  videos?: string[]
  brochure?: string // URL del PDF
  
  // Características para filtros
  features: {
    hotelStars?: number // 3, 4, 5
    includesFlights: boolean
    includesTransfers: boolean
    wifi: boolean
    allInclusive: boolean
    kidsClub: boolean
    spa: boolean
    pool: boolean
    privateBeach: boolean
    gym: boolean
    golf: boolean
    snorkelEquipment: boolean
    roomType?: 'standard' | 'suite' | 'villa' | 'bungalow'
    amenities: string[] // ['pool', 'spa', 'gym', 'beach', 'wifi', 'restaurant', 'bar', 'kids-club']
  }
  
  // Marketing
  featured: boolean
  tags: string[]
  rating?: number
  reviewCount?: number
  
  // Estado
  status: 'draft' | 'active' | 'inactive' | 'archived'
  
  // Metadata
  notes?: string
  internalNotes?: string // Notas privadas para el equipo
  
  // Auditoría
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const PackageSchema = new Schema<IPackage>({
  name: { type: String, required: true, index: true },
  description: { type: String, required: true },
  destination: {
    city: { type: String, required: true },
    cityNormalized: String,
    country: { type: String, required: true, index: true },
    countryNormalized: String,
    region: String,
    state: String
  },
  
  duration: {
    days: { type: Number, required: true },
    nights: { type: Number, required: true }
  },
  
  category: {
    type: String,
    required: true,
    enum: ['beach', 'adventure', 'cultural', 'romantic', 'family', 'business', 'cruise', 'all_inclusive']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging']
  },
  
  components: {
    flights: [{
      flight: { type: Schema.Types.ObjectId, ref: 'Flight' },
      type: { type: String, enum: ['outbound', 'return', 'internal'] },
      costPrice: Number,
      sellingPrice: Number
    }],
    
    hotels: [{
      hotel: { type: Schema.Types.ObjectId, ref: 'Hotel' },
      roomType: String,
      plan: String,
      nights: Number,
      costPrice: Number,
      sellingPrice: Number
    }],
    
    transports: [{
      transport: { type: Schema.Types.ObjectId, ref: 'Transport' },
      type: String,
      description: String,
      costPrice: Number,
      sellingPrice: Number
    }],
    
    activities: [{
      name: String,
      description: String,
      duration: String,
      included: Boolean,
      optional: Boolean,
      costPrice: Number,
      sellingPrice: Number
    }],
    
    insurance: {
      type: String,
      coverage: String,
      costPrice: Number,
      sellingPrice: Number
    },
    
    extras: [{
      name: String,
      description: String,
      included: Boolean,
      costPrice: Number,
      sellingPrice: Number
    }]
  },
  
  itinerary: [{
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: String,
    activities: [String],
    meals: {
      breakfast: Boolean,
      lunch: Boolean,
      dinner: Boolean
    },
    accommodation: String
  }],
  
  // PRECIOS MOVIDOS AL INVENTARIO
  // Los precios ahora se manejan mediante items de inventario
  // Cada paquete puede tener múltiples items de inventario con diferentes:
  // - Proveedores
  // - Temporadas
  // - Precios
  // - Disponibilidad
  
  availability: {
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    minPeople: { type: Number, default: 1 },
    maxPeople: { type: Number, default: 10 },
    currentBookings: { type: Number, default: 0 },
    
    // Campos legacy (mantener por compatibilidad)
    maxParticipants: Number,
    minParticipants: Number,
    
    status: {
      type: String,
      enum: ['available', 'limited', 'sold_out', 'cancelled'],
      default: 'available'
    }
  },
  
  included: [String],
  notIncluded: [String],
  
  requirements: {
    passport: Boolean,
    visa: Boolean,
    vaccination: [String],
    minAge: Number,
    maxAge: Number,
    fitnessLevel: String
  },
  
  cancellationPolicy: String,
  paymentPolicy: String,
  
  suppliers: [{ type: Schema.Types.ObjectId, ref: 'Supplier' }],
  
  images: [String],
  videos: [String],
  brochure: String,
  
  features: {
    hotelStars: { type: Number, min: 3, max: 5 },
    includesFlights: { type: Boolean, default: false },
    includesTransfers: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    allInclusive: { type: Boolean, default: false },
    kidsClub: { type: Boolean, default: false },
    spa: { type: Boolean, default: false },
    pool: { type: Boolean, default: false },
    privateBeach: { type: Boolean, default: false },
    gym: { type: Boolean, default: false },
    golf: { type: Boolean, default: false },
    snorkelEquipment: { type: Boolean, default: false },
    roomType: { type: String, enum: ['standard', 'suite', 'villa', 'bungalow'] },
    amenities: [String]
  },
  
  featured: { type: Boolean, default: false },
  tags: [String],
  rating: { type: Number, min: 1, max: 5 },
  reviewCount: { type: Number, default: 0 },
  
  status: {
    type: String,
    required: true,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  
  notes: String,
  internalNotes: String,
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

// Índices
PackageSchema.index({ name: 'text', description: 'text' })
PackageSchema.index({ 'destination.country': 1, category: 1 })
PackageSchema.index({ 'destination.cityNormalized': 1, 'destination.countryNormalized': 1 })
PackageSchema.index({ 'availability.startDate': 1, 'availability.endDate': 1 })
PackageSchema.index({ status: 1, featured: 1 })
PackageSchema.index({ 'features.hotelStars': 1 })
PackageSchema.index({ 'features.includesFlights': 1 })
PackageSchema.index({ 'features.allInclusive': 1 })
PackageSchema.index({ 'duration.days': 1 })

// Forzar recarga del modelo en desarrollo
if (process.env.NODE_ENV === 'development' && mongoose.models.Package) {
  delete mongoose.models.Package
}

export const Package = mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema)
export default Package
