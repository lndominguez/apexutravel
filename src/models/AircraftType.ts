import mongoose, { Schema, Document, Model } from 'mongoose'
import type { AircraftCabinConfiguration } from '@/types/inventory'

export interface AircraftTypeDocument extends Document {
  aircraftModel: string
  manufacturer: string
  iataCode?: string
  icaoCode?: string
  totalSeats: number
  range?: number
  cruiseSpeed?: number
  cabinConfiguration: AircraftCabinConfiguration[]
  images?: {
    exterior?: string
    seatMap?: string
  }
  getCabinConfig(flightClass: string): AircraftCabinConfiguration | undefined
  generateSeatsForCabin(flightClass: string): Array<{ seatNumber: string; status: string; price: number }>
}

const AircraftCabinConfigurationSchema = new Schema<AircraftCabinConfiguration>({
  class: {
    type: String,
    enum: ['economy', 'premium economy', 'business', 'first'],
    required: true
  },
  rows: {
    type: [Number],
    required: true
  },
  columns: {
    type: [String],
    required: true
  },
  layout: {
    type: String,
    required: true
  },
  totalSeats: {
    type: Number,
    required: true
  },
  seatPitch: Number,
  seatWidth: Number,
  features: [String]
}, { _id: false })

const AircraftTypeSchema = new Schema<AircraftTypeDocument>({
  aircraftModel: {
    type: String,
    required: true,
    trim: true
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  iataCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  icaoCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  range: {
    type: Number,
    min: 0
  },
  cruiseSpeed: {
    type: Number,
    min: 0
  },
  cabinConfiguration: {
    type: [AircraftCabinConfigurationSchema],
    required: true
  },
  images: {
    exterior: String,
    seatMap: String
  }
}, {
  timestamps: true,
  collection: 'aircraft_types'
})

// Índices
AircraftTypeSchema.index({ aircraftModel: 1, manufacturer: 1 })
AircraftTypeSchema.index({ iataCode: 1 })
AircraftTypeSchema.index({ icaoCode: 1 })

// Método para obtener configuración de una clase específica
AircraftTypeSchema.methods.getCabinConfig = function(flightClass: string) {
  return this.cabinConfiguration.find((cabin: AircraftCabinConfiguration) => cabin.class === flightClass)
}

// Método para generar todos los asientos de una cabina
AircraftTypeSchema.methods.generateSeatsForCabin = function(flightClass: string) {
  const cabin = this.getCabinConfig(flightClass)
  if (!cabin) return []
  
  const seats = []
  for (const row of cabin.rows) {
    for (const col of cabin.columns) {
      seats.push({
        seatNumber: `${row}${col}`,
        status: 'available',
        price: 0
      })
    }
  }
  return seats
}

export default mongoose.models.AircraftType || mongoose.model<AircraftTypeDocument>('AircraftType', AircraftTypeSchema)
