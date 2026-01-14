import mongoose, { Schema, Document } from 'mongoose'

export interface IPassenger {
  type: 'adult' | 'child' | 'infant'
  fullName: string
  dateOfBirth: string
  passport: string
  nationality: string
  passportPhoto?: string
}

export interface IContactInfo {
  email: string
  phone: string
  country: string
  city: string
}

export interface IPricing {
  adults: number
  children: number
  infants: number
  subtotal: number
  taxes?: number
  fees?: number
  total: number
  currency: string
}

export interface IBooking extends Document {
  // Información básica
  bookingNumber: string
  type: 'package' | 'hotel' | 'flight'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  
  // Referencia al item reservado
  itemId: mongoose.Types.ObjectId
  itemType: string
  itemName: string
  
  // Datos de los pasajeros
  passengers: IPassenger[]
  
  // Información de contacto
  contactInfo: IContactInfo
  
  // Detalles específicos según tipo
  details?: {
    // Para hoteles
    hotel?: {
      roomIndex: number
      roomName: string
      occupancy: string
      checkIn: Date
      checkOut: Date
      nights: number
    }
    // Para paquetes
    package?: {
      destination: string
      startDate: Date
      duration: {
        days: number
        nights: number
      }
    }
    // Para vuelos
    flight?: {
      origin: string
      destination: string
      departureDate: Date
      returnDate?: Date
      class: string
    }
  }
  
  // Pricing
  pricing: IPricing
  
  // Pago
  paymentMethod: 'pending' | 'paypal' | 'card' | 'cash' | 'transfer'
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded'
  paymentDate?: Date
  transactionId?: string
  
  // Invoice
  invoiceNumber?: string
  invoiceDate?: Date
  invoiceUrl?: string
  
  // Notas y comunicación
  notes?: string
  adminNotes?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Usuario que creó (si está logueado)
  createdBy?: mongoose.Types.ObjectId
  
  // Agente asignado
  assignedAgent?: mongoose.Types.ObjectId
}

const PassengerSchema = new Schema({
  type: { 
    type: String, 
    enum: ['adult', 'child', 'infant'],
    required: true 
  },
  fullName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  passport: { type: String, required: true },
  nationality: { type: String, default: 'México' },
  passportPhoto: { type: String }
})

const ContactInfoSchema = new Schema({
  email: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true }
})

const PricingSchema = new Schema({
  adults: { type: Number, required: true },
  children: { type: Number, default: 0 },
  infants: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  taxes: { type: Number, default: 0 },
  fees: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD' }
})

const BookingSchema = new Schema<IBooking>({
  bookingNumber: { 
    type: String, 
    unique: true,
    index: true,
    sparse: true
  },
  type: { 
    type: String, 
    enum: ['package', 'hotel', 'flight'],
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
    index: true
  },
  
  itemId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    index: true
  },
  itemType: { type: String, required: true },
  itemName: { type: String, required: true },
  
  passengers: [PassengerSchema],
  contactInfo: { type: ContactInfoSchema, required: true },
  
  details: {
    hotel: {
      roomIndex: Number,
      roomName: String,
      occupancy: String,
      checkIn: Date,
      checkOut: Date,
      nights: Number
    },
    package: {
      destination: String,
      startDate: Date,
      duration: {
        days: Number,
        nights: Number
      }
    },
    flight: {
      origin: String,
      destination: String,
      departureDate: Date,
      returnDate: Date,
      class: String
    }
  },
  
  pricing: { type: PricingSchema, required: true },
  
  paymentMethod: { 
    type: String, 
    enum: ['pending', 'paypal', 'card', 'cash', 'transfer'],
    default: 'pending'
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentDate: Date,
  transactionId: String,
  
  invoiceNumber: String,
  invoiceDate: Date,
  invoiceUrl: String,
  
  notes: String,
  adminNotes: String,
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedAgent: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

// Índices compuestos para búsquedas comunes
BookingSchema.index({ status: 1, createdAt: -1 })
BookingSchema.index({ type: 1, status: 1 })
BookingSchema.index({ 'contactInfo.email': 1 })
BookingSchema.index({ paymentStatus: 1 })

// Forzar recarga del modelo en desarrollo
if (process.env.NODE_ENV === 'development' && mongoose.models.Booking) {
  delete mongoose.models.Booking
}

export const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema)
