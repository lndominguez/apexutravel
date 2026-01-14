import mongoose, { Schema, Document } from 'mongoose'

export interface IOfferPackage extends Document {
  // Información básica
  name: string
  code: string
  slug: string
  description: string
  
  // Destino y duración
  destination: {
    city: string
    country: string
    region?: string
  }
  duration: {
    days: number
    nights: number
  }
  
  // Categoría
  category: 'beach' | 'adventure' | 'cultural' | 'romantic' | 'family' | 'luxury' | 'business' | 'wellness' | 'cruise'
  
  // COMPONENTES: Referencias a items de inventario
  components: {
    // Hotel: Opciones disponibles para el cliente
    hotel?: {
      inventoryItems: Array<{
        inventoryItem: mongoose.Types.ObjectId // → InventoryHotel
        isDefault: boolean // Opción por defecto
        label?: string // Ej: "Habitación Estándar", "Suite Junior"
      }>
      nights: number
      required: boolean
    }
    
    // Vuelos: Normalmente fijos (ida y vuelta)
    flights?: Array<{
      inventoryItem: mongoose.Types.ObjectId // → InventoryFlight
      type: 'outbound' | 'return' | 'internal'
      required: boolean
    }>
    
    // Transportes: Servicios de traslado
    transports?: Array<{
      inventoryItem: mongoose.Types.ObjectId // → InventoryTransport
      description: string
      required: boolean
    }>
    
    // Actividades: Pueden ser opcionales
    activities?: Array<{
      name: string
      description: string
      duration?: string
      optional: boolean // Cliente puede agregar o no
      pricing: {
        costAdult: number
        costChild: number
        costInfant: number
        sellingPriceAdult: number
        sellingPriceChild: number
        sellingPriceInfant: number
      }
    }>
  }
  
  // PRICING: Markup sobre costos de inventario
  pricing: {
    // Markup del paquete
    markup: {
      type: 'percentage' | 'fixed'
      value: number
    }
    
    // Precio base de referencia (configuración más económica)
    baseExample: {
      adults: number
      children: number
      roomConfig: string // Ej: "standard_double"
      totalCost: number
      totalSelling: number
      pricePerPerson: number
    }
    
    currency: 'USD' | 'MXN' | 'EUR'
  }
  
  // VIGENCIA: Calculada de componentes
  validFrom: Date
  validTo: Date
  
  // Itinerario día por día
  itinerary?: Array<{
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
  
  // Inclusiones y exclusiones
  included: string[]
  notIncluded: string[]
  
  // Políticas
  policies: {
    cancellation: string
    payment: string
    changes?: string
  }
  
  // Requisitos
  requirements?: {
    passport: boolean
    visa: boolean
    vaccination?: string[]
    minAge?: number
    maxAge?: number
    fitnessLevel?: string
  }
  
  // Media
  images: string[]
  videos?: string[]
  
  // Características para filtros
  features: {
    hotelStars?: number
    includesFlights: boolean
    includesTransfers: boolean
    allInclusive: boolean
    familyFriendly: boolean
    petFriendly: boolean
  }
  
  // Marketing
  featured: boolean
  tags: string[]
  
  // Estado
  status: 'draft' | 'active' | 'inactive' | 'archived'
  
  // Notas
  notes?: string
  internalNotes?: string
  
  // Auditoría
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const OfferPackageSchema = new Schema<IOfferPackage>({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },
  code: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  description: { 
    type: String, 
    required: true 
  },
  
  destination: {
    city: { type: String, required: true },
    country: { type: String, required: true, index: true },
    region: String
  },
  
  duration: {
    days: { type: Number, required: true, min: 1 },
    nights: { type: Number, required: true, min: 0 }
  },
  
  category: {
    type: String,
    required: true,
    enum: ['beach', 'adventure', 'cultural', 'romantic', 'family', 'luxury', 'business', 'wellness', 'cruise']
  },
  
  components: {
    hotel: {
      inventoryItems: [{
        inventoryItem: { 
          type: Schema.Types.ObjectId, 
          ref: 'InventoryHotel',
          required: true
        },
        isDefault: { type: Boolean, default: false },
        label: String
      }],
      nights: { type: Number, required: true, min: 1 },
      required: { type: Boolean, default: true }
    },
    
    flights: [{
      inventoryItem: { 
        type: Schema.Types.ObjectId, 
        ref: 'InventoryFlight',
        required: true
      },
      type: { 
        type: String, 
        enum: ['outbound', 'return', 'internal'],
        required: true
      },
      required: { type: Boolean, default: true }
    }],
    
    transports: [{
      inventoryItem: { 
        type: Schema.Types.ObjectId, 
        ref: 'InventoryTransport',
        required: true
      },
      description: { type: String, required: true },
      required: { type: Boolean, default: true }
    }],
    
    activities: [{
      name: { type: String, required: true },
      description: String,
      duration: String,
      optional: { type: Boolean, default: true },
      pricing: {
        costAdult: { type: Number, required: true, min: 0 },
        costChild: { type: Number, default: 0, min: 0 },
        costInfant: { type: Number, default: 0, min: 0 },
        sellingPriceAdult: { type: Number, required: true, min: 0 },
        sellingPriceChild: { type: Number, default: 0, min: 0 },
        sellingPriceInfant: { type: Number, default: 0, min: 0 }
      }
    }]
  },
  
  pricing: {
    markup: {
      type: { 
        type: String, 
        enum: ['percentage', 'fixed'],
        required: true,
        default: 'percentage'
      },
      value: { type: Number, required: true, min: 0 }
    },
    
    baseExample: {
      adults: { type: Number, default: 2 },
      children: { type: Number, default: 0 },
      roomConfig: String,
      totalCost: { type: Number, default: 0 },
      totalSelling: { type: Number, default: 0 },
      pricePerPerson: { type: Number, default: 0 }
    },
    
    currency: {
      type: String,
      enum: ['USD', 'MXN', 'EUR'],
      default: 'USD'
    }
  },
  
  validFrom: { 
    type: Date, 
    required: true,
    index: true
  },
  validTo: { 
    type: Date, 
    required: true,
    index: true
  },
  
  itinerary: [{
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: String,
    activities: [String],
    meals: {
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false }
    },
    accommodation: String
  }],
  
  included: [{ type: String }],
  notIncluded: [{ type: String }],
  
  policies: {
    cancellation: { type: String, required: true },
    payment: { type: String, required: true },
    changes: String
  },
  
  requirements: {
    passport: { type: Boolean, default: false },
    visa: { type: Boolean, default: false },
    vaccination: [String],
    minAge: Number,
    maxAge: Number,
    fitnessLevel: String
  },
  
  images: [{ type: String }],
  videos: [String],
  
  features: {
    hotelStars: { type: Number, min: 1, max: 5 },
    includesFlights: { type: Boolean, default: false },
    includesTransfers: { type: Boolean, default: false },
    allInclusive: { type: Boolean, default: false },
    familyFriendly: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false }
  },
  
  featured: { type: Boolean, default: false },
  tags: [String],
  
  status: {
    type: String,
    required: true,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft',
    index: true
  },
  
  notes: String,
  internalNotes: String,
  
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, {
  timestamps: true,
  collection: 'offer_packages'
})

// Índices compuestos para búsquedas
OfferPackageSchema.index({ name: 'text', description: 'text' })
OfferPackageSchema.index({ 'destination.country': 1, category: 1 })
OfferPackageSchema.index({ validFrom: 1, validTo: 1, status: 1 })
OfferPackageSchema.index({ status: 1, featured: 1 })
OfferPackageSchema.index({ 'features.hotelStars': 1 })

// Validación: validTo debe ser posterior a validFrom
OfferPackageSchema.pre('save', function() {
  if (this.validTo <= this.validFrom) {
    throw new Error('validTo debe ser posterior a validFrom')
  }
})

// Método para generar slug automático
OfferPackageSchema.pre('save', function() {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
})

// Virtual para verificar si está disponible
OfferPackageSchema.virtual('isAvailable').get(function(this: any) {
  const now = new Date()
  return this.status === 'active' && 
         this.validFrom <= now && 
         this.validTo >= now
})

// Método para calcular precio dinámico
OfferPackageSchema.methods.calculatePrice = async function(config: {
  adults: number
  children: number
  infants: number
  hotelOptionIndex: number
  includeActivities: string[]
}) {
  // Este método se implementará en el backend para calcular precios en tiempo real
  // basado en los inventory items y la configuración del cliente
  return {
    totalCost: 0,
    totalSelling: 0,
    breakdown: {}
  }
}

export default mongoose.models.OfferPackage || mongoose.model<IOfferPackage>('OfferPackage', OfferPackageSchema)
