import mongoose, { Schema, Document } from 'mongoose'

// Interface principal unificada para TODAS las ofertas
export interface IOffer extends Document {
  // Información básica
  code: string
  name: string
  description?: string
  slug: string
  type: 'hotel' | 'flight' | 'transport' | 'activity' | 'package'
  status: 'draft' | 'published' | 'archived'
  
  // Duración (para ofertas de hotel y paquetes)
  duration?: {
    nights: number
  }
  
  // Markup aplicado sobre precios de inventario
  markup?: {
    type: 'percentage' | 'fixed'
    value: number
  }
  
  // Foto de portada
  coverPhoto?: string
  
  // Items incluidos en la oferta
  items: Array<{
    inventoryId: mongoose.Types.ObjectId
    resourceType: string // Hotel, Flight, Transport, Activity
    mandatory: boolean
    
    // Para hoteles
    // Metadata mínima del hotel (solo para display rápido, la verdad viene del resource)
    hotelInfo?: {
      resourceId?: mongoose.Types.ObjectId
      name?: string
      stars?: number
      location?: {
        city?: string
        country?: string
      }
    }
    
    // Para vuelos
    flightDetails?: {
      route: {
        from: string
        to: string
      }
      schedule: {
        departure: Date
        return?: Date
      }
      class: 'economy' | 'business' | 'first'
      seat: {
        assignmentType: 'auto' | 'manual' | 'none'
        number?: string
        allowSelection: boolean
      }
      baggage: {
        carryOn: boolean
        checked: boolean
      }
      pricing: {
        adult: number
        child: number
        infant: number
      }
    }
    
    // Transporte o actividad
    transportOrActivity?: {
      type: string // shuttle, private_transfer, excursion
      route: {
        from: string
        to: string
      }
      direction: 'one_way' | 'round_trip'
      pricing: {
        adult: number
        child: number
        infant: number
      }
    }
  }>
  
  // Precios de venta de la oferta
  pricing: {
    currency: string
    // Para paquetes con múltiples pasajeros
    base?: {
      adult: number
      child: number
      infant: number
    }
    adjustments?: {
      capacity: Record<string, number> // { simple: 0, double: 50 }
      features: Record<string, number>  // { balcony: 20, ocean_view: 40 }
    }
    // Precios calculados (para cache/display, se recalculan desde inventario)
    basePrice?: number
    finalPrice?: number
  }
  
  // Reglas de configuración para el cliente
  rules: {
    allowRoomChange: boolean
    allowFeatureChange: boolean
    allowDatesChange: boolean
    allowSeatSelection: boolean
  }
  
  // Disponibilidad
  availability: {
    type: 'limited' | 'inventory_based' | 'quota'
    quantity?: number
    minPax?: number
    maxPax?: number
  }
  
  // Vigencia
  validFrom?: Date
  validTo?: Date
  
  // Auditoría
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
  
  // Método para calcular precio final
  calculateFinalPrice(selectedOptions: any): number
}

const OfferSchema = new Schema<IOffer>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  
  type: {
    type: String,
    required: true,
    enum: ['hotel', 'flight', 'transport', 'activity', 'package'],
    index: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  
  // Duración (para ofertas de hotel y paquetes) - days se calcula como nights + 1
  duration: {
    nights: Number
  },
  
  // Markup aplicado sobre precios de inventario
  markup: {
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number
  },
  
  // Foto de portada
  coverPhoto: String,
  
  // Items incluidos en la oferta
  items: [{
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    resourceType: {
      type: String,
      required: true
    },
    mandatory: {
      type: Boolean,
      default: true
    },
    
    // Metadata mínima del hotel (la info completa viene del inventario + resource)
    hotelInfo: {
      resourceId: { type: Schema.Types.ObjectId, ref: 'Hotel' },
      name: String,
      stars: Number,
      location: {
        city: String,
        country: String
      }
    },
    
    // Para vuelos
    flightDetails: {
      route: {
        from: String,
        to: String
      },
      schedule: {
        departure: Date,
        return: Date
      },
      class: {
        type: String,
        enum: ['economy', 'business', 'first']
      },
      seat: {
        assignmentType: {
          type: String,
          enum: ['auto', 'manual', 'none']
        },
        number: String,
        allowSelection: Boolean
      },
      baggage: {
        carryOn: Boolean,
        checked: Boolean
      },
      pricing: {
        adult: Number,
        child: Number,
        infant: Number
      }
    },
    
    // Transporte o actividad
    transportOrActivity: {
      type: { type: String },
      route: {
        from: String,
        to: String
      },
      direction: {
        type: String,
        enum: ['one_way', 'round_trip']
      },
      pricing: {
        adult: Number,
        child: Number,
        infant: Number
      }
    }
  }],
  
  // Precios de venta
  pricing: {
    currency: {
      type: String,
      default: 'USD'
    },
    // Para paquetes con múltiples pasajeros
    base: {
      adult: Number,
      child: Number,
      infant: Number
    },
    adjustments: {
      capacity: Schema.Types.Mixed,
      features: Schema.Types.Mixed
    },
    // Precios calculados (cache, se recalculan desde inventario + markup)
    basePrice: Number,
    finalPrice: Number
  },
  
  // Reglas
  rules: {
    allowRoomChange: { type: Boolean, default: true },
    allowFeatureChange: { type: Boolean, default: true },
    allowDatesChange: { type: Boolean, default: false },
    allowSeatSelection: { type: Boolean, default: true }
  },
  
  // Disponibilidad
  availability: {
    type: {
      type: String,
      enum: ['limited', 'inventory_based', 'quota'],
      default: 'inventory_based'
    },
    quantity: Number,
    minPax: Number,
    maxPax: Number
  },
  
  // Vigencia
  validFrom: Date,
  validTo: Date,
  
  // Auditoría
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'offers'
})

// Índices compuestos
OfferSchema.index({ name: 'text', description: 'text' })
OfferSchema.index({ type: 1, status: 1 })
OfferSchema.index({ validFrom: 1, validTo: 1 })

// Generar slug automático si no existe
OfferSchema.pre('save', function() {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
})

// Método para calcular precio final dinámico según selección del cliente
OfferSchema.methods.calculateFinalPrice = function(selectedOptions: any) {
  let total = 0
  
  // Recorre items y suma precios base
  this.items.forEach((item: any) => {
    if (item.resourceType === 'Hotel' && item.selectedRooms) {
      item.selectedRooms.forEach((room: any) => {
        if (room.capacityPrices) {
          const capacity = selectedOptions.capacity
          const fallbackCapacity = room.capacityPrices.double
            ? 'double'
            : (Object.keys(room.capacityPrices)[0] || undefined)
          const selectedCapacity = capacity || fallbackCapacity
          const priceForCapacity = selectedCapacity ? room.capacityPrices[selectedCapacity] : undefined
          total += priceForCapacity?.adult || 0
        } else if (room.pricing) {
          total += room.pricing.adult
          
          // Sumar ajustes de capacity
          if (selectedOptions.capacity && room.pricing.capacityAdjustments?.[selectedOptions.capacity]) {
            total += room.pricing.capacityAdjustments[selectedOptions.capacity]
          }
          
          // Sumar ajustes de features
          if (selectedOptions.features) {
            selectedOptions.features.forEach((f: string) => {
              if (room.pricing.featureAdjustments?.[f]) {
                total += room.pricing.featureAdjustments[f]
              }
            })
          }
        }
      })
    }
    
    if (item.resourceType === 'Flight' && item.flightDetails) {
      total += item.flightDetails.pricing.adult
    }
    
    if (item.resourceType === 'Transport' && item.transportOrActivity) {
      total += item.transportOrActivity.pricing.adult
    }
  })
  
  this.pricing.finalPrice = total
  return total
}

// Virtual para calcular days automáticamente como nights + 1
OfferSchema.virtual('duration.days').get(function(this: any) {
  return this.duration?.nights ? this.duration.nights + 1 : 0
})

// Virtual para verificar si está disponible
OfferSchema.virtual('isAvailable').get(function(this: any) {
  const now = new Date()
  return this.status === 'published' && 
         (!this.validFrom || this.validFrom <= now) && 
         (!this.validTo || this.validTo >= now)
})

if (process.env.NODE_ENV === 'development' && mongoose.models.Offer) {
  delete mongoose.models.Offer
}

export default mongoose.model<IOffer>('Offer', OfferSchema)
