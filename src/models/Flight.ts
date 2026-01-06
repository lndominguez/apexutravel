import mongoose, { Schema, Document } from 'mongoose'

export interface IFlight extends Document {
  // Relación con proveedor
  supplier: mongoose.Types.ObjectId
  
  // Información del vuelo
  flightNumber: string
  airline: {
    name: string // Nombre completo de la aerolínea
    iataCode: string // Código IATA de 2 letras (ej: "AM")
    logoUrl?: string // URL del logo desde la API externa
  }
  aircraftType: mongoose.Types.ObjectId // Referencia a AircraftType
  
  // Origen y destino
  departure: {
    airport: string // Código IATA (ej: MEX)
    city: string
    cityNormalized?: string // Ciudad sin acentos para búsquedas
    country: string
    terminal?: string
    dateTime: Date
  }
  
  arrival: {
    airport: string // Código IATA (ej: CUN)
    city: string
    cityNormalized?: string // Ciudad sin acentos para búsquedas
    country: string
    terminal?: string
    dateTime: Date
  }
  
  // Duración y escalas
  duration: number // minutos
  stops: number
  layovers?: Array<{
    airport: string
    city: string
    duration: number // minutos
  }>
  
  // Clases y disponibilidad
  classes: Array<{
    type: 'economy' | 'premium_economy' | 'business' | 'first'
    availableSeats: number
    
    // Precios diferenciados por tipo de pasajero
    markup: number // % de ganancia general
    pricing: {
      adult: {
        cost: number           // Costo del proveedor
        selling: number        // Precio de venta
        currency: string
      }
      child: {
        cost: number           // Costo del proveedor (2-11 años)
        selling: number        // Precio de venta
        currency: string
      }
      infant: {
        cost: number           // Costo del proveedor (0-23 meses)
        selling: number        // Precio de venta
        currency: string
      }
    }
    
    // DEPRECATED: Mantener por compatibilidad temporal
    costPrice: number
    costCurrency: string
    sellingPrice: number
    sellingCurrency: string
    
    // Servicios incluidos
    baggage: {
      carry: string // ej: "1 x 10kg"
      checked: string // ej: "2 x 23kg"
    }
    seatSelection?: boolean // true = puede seleccionar, false = asignado automáticamente
    amenities: string[] // ['wifi', 'meals', 'entertainment']
    
    // Cupos disponibles con asientos específicos (cuando seatSelectionType = 'manual')
    availableSeatsDetail?: Array<{
      seatNumber: string // ej: "12A", "12B"
      status: 'available' | 'reserved' | 'blocked'
      price?: number // Precio adicional por este asiento específico (ventana, pasillo, etc)
    }>
  }>
  
  // NOTA: La configuración de filas/columnas/layout viene de AircraftType.cabinConfiguration
  // Solo guardamos el estado actual de ocupación de asientos
  
  // Políticas
  cancellationPolicy: string
  changePolicy: string
  refundable: boolean
  
  // Estado
  status: 'available' | 'limited' | 'sold_out' | 'cancelled'
  
  // Metadata
  notes?: string
  tags?: string[] // ['direct', 'red-eye', 'weekend']
  
  // Auditoría
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const FlightSchema = new Schema<IFlight>({
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  
  flightNumber: { type: String, required: true, index: true },
  airline: {
    name: { type: String, required: true, index: true },
    iataCode: { type: String, required: true, uppercase: true, index: true },
    logoUrl: { type: String },
  },
  aircraftType: { type: Schema.Types.ObjectId, ref: 'AircraftType', required: true },
  
  departure: {
    airport: { type: String, required: true, index: true },
    city: { type: String, required: true },
    cityNormalized: { type: String, index: true }, // Para búsquedas sin acentos
    country: { type: String, required: true },
    terminal: String,
    dateTime: { type: Date, required: true, index: true }
  },
  
  arrival: {
    airport: { type: String, required: true, index: true },
    city: { type: String, required: true },
    cityNormalized: { type: String, index: true }, // Para búsquedas sin acentos
    country: { type: String, required: true },
    terminal: String,
    dateTime: { type: Date, required: true }
  },
  
  duration: { type: Number, required: true },
  stops: { type: Number, default: 0 },
  layovers: [{
    airport: String,
    city: String,
    duration: Number
  }],
  
  classes: [{
    type: {
      type: String,
      required: true,
      enum: ['economy', 'premium_economy', 'business', 'first']
    },
    availableSeats: { type: Number, required: true },
    
    markup: { type: Number, required: true },
    
    // Precios diferenciados por tipo de pasajero
    pricing: {
      adult: {
        cost: { type: Number, required: true },
        selling: { type: Number, required: true },
        currency: { type: String, default: 'USD' }
      },
      child: {
        cost: { type: Number, required: true },
        selling: { type: Number, required: true },
        currency: { type: String, default: 'USD' }
      },
      infant: {
        cost: { type: Number, required: true },
        selling: { type: Number, required: true },
        currency: { type: String, default: 'USD' }
      }
    },
    
    // DEPRECATED: Mantener por compatibilidad
    costPrice: { type: Number, required: true },
    costCurrency: { type: String, default: 'USD' },
    sellingPrice: { type: Number, required: true },
    sellingCurrency: { type: String, default: 'USD' },
    
    baggage: {
      carry: String,
      checked: String
    },
    seatSelection: { type: Boolean, default: true },
    amenities: [String],
    
    // Cupos disponibles con asientos específicos
    availableSeatsDetail: [{
      seatNumber: { type: String, required: true }, // "12A", "12B"
      status: { 
        type: String, 
        enum: ['available', 'reserved', 'blocked'],
        default: 'available'
      },
      price: Number // Precio adicional por este asiento
    }]
  }],
  
  
  cancellationPolicy: String,
  changePolicy: String,
  refundable: { type: Boolean, default: false },
  
  status: {
    type: String,
    required: true,
    enum: ['available', 'limited', 'sold_out', 'cancelled'],
    default: 'available'
  },
  
  notes: String,
  tags: [String],
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

// Middleware para normalizar ciudades antes de guardar
FlightSchema.pre('save', function(this: any, next: any) {
  if (this.departure?.city) {
    this.departure.cityNormalized = this.departure.city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }
  if (this.arrival?.city) {
    this.arrival.cityNormalized = this.arrival.city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }
  next()
})

// Índices compuestos para búsquedas comunes
FlightSchema.index({ 'departure.airport': 1, 'arrival.airport': 1, 'departure.dateTime': 1 })
FlightSchema.index({ 'departure.cityNormalized': 1, 'arrival.cityNormalized': 1 })
FlightSchema.index({ supplier: 1, status: 1 })
FlightSchema.index({ airline: 1, flightNumber: 1 })

export default mongoose.models.Flight || mongoose.model<IFlight>('Flight', FlightSchema)
