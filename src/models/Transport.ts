import mongoose, { Schema, Document } from 'mongoose'

export interface ITransport extends Document {
  // Relación con proveedor
  supplier: mongoose.Types.ObjectId
  
  // Información básica
  name: string
  type: 'private_car' | 'shared_shuttle' | 'bus' | 'van' | 'limousine' | 'taxi' | 'train' | 'ferry' | 'other'
  
  // Descripción
  description: string
  vehicleDetails?: {
    brand?: string
    model?: string
    year?: number
    color?: string
    plateNumber?: string
  }
  
  // Capacidad
  capacity: {
    passengers: number
    luggage: number
  }
  
  // Ruta
  route: {
    origin: {
      type: 'airport' | 'hotel' | 'address' | 'port' | 'station'
      name: string
      address: string
      city: string
      country: string
    }
    destination: {
      type: 'airport' | 'hotel' | 'address' | 'port' | 'station'
      name: string
      address: string
      city: string
      country: string
    }
    distance?: number // km
    estimatedDuration?: number // minutos
  }
  
  // Horarios
  schedule?: {
    type: 'fixed' | 'flexible' | 'on_demand'
    departureTimes?: string[] // ["08:00", "12:00", "16:00"]
    frequency?: string // "Cada 30 minutos"
  }
  
  // Precios
  pricing: {
    // Precio del proveedor (COSTO)
    costPrice: number
    costCurrency: string
    costType: 'per_vehicle' | 'per_person' | 'per_trip'
    
    // Nuestro precio (VENTA)
    markup: number // % de ganancia
    sellingPrice: number
    sellingCurrency: string
    sellingType: 'per_vehicle' | 'per_person' | 'per_trip'
  }
  
  // Servicios incluidos
  amenities: string[] // ['ac', 'wifi', 'water', 'child_seat', 'wheelchair_accessible']
  
  // Disponibilidad
  availability: {
    daysOfWeek: number[] // [0,1,2,3,4,5,6] donde 0=Domingo
    startDate?: Date
    endDate?: Date
    maxBookingsPerDay?: number
    currentBookings?: number
  }
  
  // Políticas
  cancellationPolicy: string
  waitingTime?: number // minutos de espera incluidos
  
  // Conductor (si aplica)
  driver?: {
    name: string
    phone: string
    license: string
    rating?: number
  }
  
  // Estado
  status: 'active' | 'inactive' | 'maintenance'
  
  // Media
  images?: string[]
  
  // Metadata
  notes?: string
  tags?: string[]
  
  // Auditoría
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const TransportSchema = new Schema<ITransport>({
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  
  name: { type: String, required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: ['private_car', 'shared_shuttle', 'bus', 'van', 'limousine', 'taxi', 'train', 'ferry', 'other']
  },
  
  description: { type: String, required: true },
  vehicleDetails: {
    brand: String,
    model: String,
    year: Number,
    color: String,
    plateNumber: String
  },
  
  capacity: {
    passengers: { type: Number, required: true },
    luggage: { type: Number, required: true }
  },
  
  route: {
    origin: {
      type: { type: String, enum: ['airport', 'hotel', 'address', 'port', 'station'] },
      name: { type: String, required: true },
      address: String,
      city: { type: String, required: true },
      country: { type: String, required: true }
    },
    destination: {
      type: { type: String, enum: ['airport', 'hotel', 'address', 'port', 'station'] },
      name: { type: String, required: true },
      address: String,
      city: { type: String, required: true },
      country: { type: String, required: true }
    },
    distance: Number,
    estimatedDuration: Number
  },
  
  schedule: {
    type: { type: String, enum: ['fixed', 'flexible', 'on_demand'] },
    departureTimes: [String],
    frequency: String
  },
  
  pricing: {
    costPrice: { type: Number, required: true },
    costCurrency: { type: String, default: 'USD' },
    costType: { type: String, enum: ['per_vehicle', 'per_person', 'per_trip'], required: true },
    
    markup: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    sellingCurrency: { type: String, default: 'USD' },
    sellingType: { type: String, enum: ['per_vehicle', 'per_person', 'per_trip'], required: true }
  },
  
  amenities: [String],
  
  availability: {
    daysOfWeek: [Number],
    startDate: Date,
    endDate: Date,
    maxBookingsPerDay: Number,
    currentBookings: { type: Number, default: 0 }
  },
  
  cancellationPolicy: String,
  waitingTime: Number,
  
  driver: {
    name: String,
    phone: String,
    license: String,
    rating: Number
  },
  
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  
  images: [String],
  notes: String,
  tags: [String],
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

// Índices
TransportSchema.index({ name: 'text', description: 'text' })
TransportSchema.index({ type: 1, status: 1 })
TransportSchema.index({ 'route.origin.city': 1, 'route.destination.city': 1 })
TransportSchema.index({ supplier: 1 })

export default mongoose.models.Transport || mongoose.model<ITransport>('Transport', TransportSchema)
