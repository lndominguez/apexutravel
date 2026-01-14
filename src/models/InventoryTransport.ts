import mongoose from 'mongoose'

const inventoryTransportSchema = new mongoose.Schema({
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

  // Referencia al transporte
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transport',
    required: true
  },
  resourceType: {
    type: String,
    default: 'Transport',
    immutable: true
  },

  // Proveedor
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },

  // Configuración de transporte
  configuration: {
    serviceType: {
      type: String,
      enum: ['private', 'shared', 'luxury', 'standard'],
      required: true,
      default: 'standard'
    }
  },

  // Estructura de precios para transportes (precio fijo por servicio)
  pricing: {
    cost: {
      type: Number,
      required: true,
      min: 0
    }
  },

  // Disponibilidad (unidades/servicios disponibles)
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
  collection: 'inventory_transports'
})

// Índices para consultas rápidas
inventoryTransportSchema.index({ resource: 1, supplier: 1, 'configuration.serviceType': 1 })
inventoryTransportSchema.index({ supplier: 1, status: 1 })
inventoryTransportSchema.index({ validFrom: 1, validTo: 1 })
inventoryTransportSchema.index({ status: 1 })

// Validación: validTo debe ser posterior a validFrom
inventoryTransportSchema.pre('save', function() {
  if (this.validTo <= this.validFrom) {
    throw new Error('validTo debe ser posterior a validFrom')
  }
})

// Virtual para obtener el costo del servicio
inventoryTransportSchema.virtual('totalCost').get(function(this: any) {
  return this.pricing?.cost || 0
})

// Método para verificar disponibilidad en fechas
inventoryTransportSchema.methods.isAvailableOnDate = function(date: Date) {
  return date >= this.validFrom && date <= this.validTo && this.availability > 0
}

// Método para reducir disponibilidad
inventoryTransportSchema.methods.reduceAvailability = function(quantity: number) {
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
inventoryTransportSchema.methods.increaseAvailability = function(quantity: number) {
  this.availability += quantity
  if (this.status === 'sold_out' && this.availability > 0) {
    this.status = 'active'
  }
}

export default mongoose.models.InventoryTransport || mongoose.model('InventoryTransport', inventoryTransportSchema)
