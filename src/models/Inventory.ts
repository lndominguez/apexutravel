import mongoose from 'mongoose'

const inventorySchema = new mongoose.Schema({
  // Referencia al recurso (Hotel, Flight o Transport)
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'resourceType'
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['Hotel', 'Flight', 'Transport']
  },

  // Proveedor
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },

  // Configuración específica por tipo de recurso
  configuration: {
    // Para HOTELES
    roomType: {
      type: String,
      required: function(this: any) { return this.resourceType === 'Hotel' }
    },
    plan: {
      type: String,
      enum: ['room_only', 'breakfast', 'half_board', 'full_board', 'all_inclusive'],
      required: function(this: any) { return this.resourceType === 'Hotel' }
    },
    
    // Para VUELOS
    class: {
      type: String,
      enum: ['economy', 'premium_economy', 'business', 'first'],
      required: function(this: any) { return this.resourceType === 'Flight' }
    },
    flightType: {
      type: String,
      enum: ['outbound', 'return', 'internal'],
      required: function(this: any) { return this.resourceType === 'Flight' }
    },
    
    // Para TRANSPORTES
    serviceType: {
      type: String,
      enum: ['private', 'shared', 'luxury', 'standard'],
      required: function(this: any) { return this.resourceType === 'Transport' }
    }
  },

  // Costos del proveedor - ESTRUCTURA FLEXIBLE por tipo de recurso
  pricing: {
    // Para HOTELES
    costPerNight: Number,  // Costo del plan de alimentación
    priceAdult: Number,     // Suplemento por adulto
    priceChild: Number,     // Suplemento por niño
    priceInfant: Number,    // Suplemento por infante
    capacityPrices: {       // Precios adicionales por capacidad (ej: triple, cuádruple)
      type: Map,
      of: Number
    },
    featurePrices: {        // Precios adicionales por características (ej: vista al mar, balcón)
      type: Map,
      of: Number
    },
    
    // Para VUELOS (por tipo de pasajero)
    adult: {
      cost: Number
    },
    child: {
      cost: Number
    },
    infant: {
      cost: Number
    },
    
    // Para TRANSPORTES (precio fijo)
    cost: Number
  },

  // Disponibilidad y stock
  availability: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Vigencia temporal
  validFrom: {
    type: Date,
    required: true
  },
  validTo: {
    type: Date,
    required: true
  },

  // Notas internas
  notes: {
    type: String,
    trim: true
  },

  // Estado
  status: {
    type: String,
    enum: ['active', 'inactive', 'sold_out'],
    default: 'active'
  },

  // Auditoría
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Índices para consultas rápidas
inventorySchema.index({ resource: 1, supplier: 1 })
inventorySchema.index({ resourceType: 1, status: 1 })
inventorySchema.index({ validFrom: 1, validTo: 1 })
inventorySchema.index({ supplier: 1 })

// Virtual para obtener el costo total según tipo de recurso
inventorySchema.virtual('totalCost').get(function(this: any) {
  if (this.resourceType === 'Hotel' && this.pricing.costPerNight) {
    return this.pricing.costPerNight
  }
  if (this.resourceType === 'Transport' && this.pricing.cost) {
    return this.pricing.cost
  }
  if (this.resourceType === 'Flight' && this.pricing.adult?.cost) {
    return this.pricing.adult.cost // Por defecto retorna el costo de adulto
  }
  return 0
})

// Método para verificar disponibilidad en fechas
inventorySchema.methods.isAvailableOnDate = function(date: Date) {
  return date >= this.validFrom && date <= this.validTo && this.availability > 0
}

// Método para reducir disponibilidad
inventorySchema.methods.reduceAvailability = function(quantity: number) {
  if (this.availability >= quantity) {
    this.availability -= quantity
    if (this.availability === 0) {
      this.status = 'sold_out'
    }
    return true
  }
  return false
}

// Método para aumentar disponibilidad
inventorySchema.methods.increaseAvailability = function(quantity: number) {
  this.availability += quantity
  if (this.status === 'sold_out' && this.availability > 0) {
    this.status = 'active'
  }
}

export default mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema)
