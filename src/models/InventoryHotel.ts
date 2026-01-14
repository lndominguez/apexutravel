import mongoose from 'mongoose'

const inventoryHotelSchema = new mongoose.Schema({
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

  // Referencia al hotel
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  resourceType: {
    type: String,
    default: 'Hotel',
    immutable: true
  },

  // Proveedor
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },

  // Modalidad de precio
  pricingMode: {
    type: String,
    enum: ['per_night', 'package'],
    default: 'per_night',
    required: true
  },

  // Array de configuraciones de habitaciones
  rooms: [{
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    roomName: {
      type: String,
      required: true
    },
    // Precios por capacidad (cada capacidad tiene adult/child/infant)
    capacityPrices: {
      single: {
        adult: { type: Number, default: 0, min: 0 },
        child: { type: Number, default: 0, min: 0 },
        infant: { type: Number, default: 0, min: 0 }
      },
      double: {
        adult: { type: Number, default: 0, min: 0 },
        child: { type: Number, default: 0, min: 0 },
        infant: { type: Number, default: 0, min: 0 }
      },
      triple: {
        adult: { type: Number, default: 0, min: 0 },
        child: { type: Number, default: 0, min: 0 },
        infant: { type: Number, default: 0, min: 0 }
      },
      quad: {
        adult: { type: Number, default: 0, min: 0 },
        child: { type: Number, default: 0, min: 0 },
        infant: { type: Number, default: 0, min: 0 }
      }
    },
    // Disponibilidad (stock de esta habitación)
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  }],

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
  collection: 'inventory_hotels'
})

// Índices para consultas rápidas
inventoryHotelSchema.index({ resource: 1, supplier: 1 })
inventoryHotelSchema.index({ supplier: 1, status: 1 })
inventoryHotelSchema.index({ status: 1 })
inventoryHotelSchema.index({ 'rooms.roomType': 1 })


// Virtual para calcular disponibilidad total
inventoryHotelSchema.virtual('totalAvailability').get(function(this: any) {
  return this.rooms.reduce((sum: number, room: any) => sum + (room.stock || 0), 0)
})

// Método para verificar disponibilidad
inventoryHotelSchema.methods.hasAvailability = function() {
  return this.rooms.some((room: any) => room.stock > 0)
}

// Método para reducir disponibilidad de una habitación específica
inventoryHotelSchema.methods.reduceRoomAvailability = function(roomType: string, quantity: number) {
  const room = this.rooms.find((r: any) => r.roomType === roomType)
  if (room && room.stock >= quantity) {
    room.stock -= quantity
    const hasStock = this.rooms.some((r: any) => r.stock > 0)
    if (!hasStock) {
      this.status = 'sold_out'
    }
    return true
  }
  return false
}

// Método para aumentar disponibilidad de una habitación específica
inventoryHotelSchema.methods.increaseRoomAvailability = function(roomType: string, quantity: number) {
  const room = this.rooms.find((r: any) => r.roomType === roomType)
  if (room) {
    room.stock += quantity
    if (this.status === 'sold_out' && room.stock > 0) {
      this.status = 'active'
    }
  }
}

export default mongoose.models.InventoryHotel || mongoose.model('InventoryHotel', inventoryHotelSchema)
