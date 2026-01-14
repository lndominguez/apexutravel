import mongoose from 'mongoose'

const inventoryFlightSchema = new mongoose.Schema({
  // Código y nombre del inventario
  inventoryCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  inventoryName: {
    type: String,
    required: true,
    trim: true
  },

  // Referencia al vuelo
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    required: true
  },
  resourceType: {
    type: String,
    default: 'Flight',
    immutable: true
  },

  // Proveedor
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },

  // Configuración de vuelo
  configuration: {
    class: {
      type: String,
      enum: ['economy', 'premium_economy', 'business', 'first'],
      required: true,
      default: 'economy'
    },
    flightType: {
      type: String,
      enum: ['outbound', 'return', 'internal'],
      required: true
    }
  },

  // Estructura de precios para vuelos (por tipo de pasajero)
  pricing: {
    adult: {
      cost: {
        type: Number,
        required: true,
        min: 0
      }
    },
    child: {
      cost: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    infant: {
      cost: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },

  // Disponibilidad (cupos disponibles)
  availability: {
    type: Number,
    required: true,
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
  timestamps: true,
  collection: 'inventory_flights'
})

// Índices para consultas rápidas
inventoryFlightSchema.index({ resource: 1, supplier: 1, 'configuration.class': 1 })
inventoryFlightSchema.index({ supplier: 1, status: 1 })
inventoryFlightSchema.index({ validFrom: 1, validTo: 1 })
inventoryFlightSchema.index({ status: 1 })

// Validación: validTo debe ser posterior a validFrom
inventoryFlightSchema.pre('save', function() {
  if (this.validTo <= this.validFrom) {
    throw new Error('validTo debe ser posterior a validFrom')
  }
})

// Virtual para obtener precio por adulto (más común)
inventoryFlightSchema.virtual('defaultPrice').get(function(this: any) {
  return this.pricing?.adult?.cost || 0
})

// Método para verificar disponibilidad en fechas
inventoryFlightSchema.methods.isAvailableOnDate = function(date: Date) {
  return date >= this.validFrom && date <= this.validTo && this.availability > 0
}

// Método para reducir disponibilidad
inventoryFlightSchema.methods.reduceAvailability = function(quantity: number) {
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
inventoryFlightSchema.methods.increaseAvailability = function(quantity: number) {
  this.availability += quantity
  if (this.status === 'sold_out' && this.availability > 0) {
    this.status = 'active'
  }
}

export default mongoose.models.InventoryFlight || mongoose.model('InventoryFlight', inventoryFlightSchema)
