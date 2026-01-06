import dotenv from 'dotenv'
import { resolve } from 'path'
import mongoose from 'mongoose'
import AircraftType from '../src/models/AircraftType'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

// Función de conexión directa (sin usar el módulo que valida antes de cargar dotenv)
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI no está definido en .env.local')
  }

  if (mongoose.connection.readyState >= 1) {
    console.log('✅ Usando conexión existente a MongoDB')
    return
  }

  console.log('🔄 Conectando a MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado a MongoDB exitosamente')
}

// Función para normalizar texto (remover acentos)
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// Función helper para generar estructura de pricing diferenciado
function generatePricing(adultCost: number, markup: number, currency: string = 'USD') {
  const adultSelling = Math.round(adultCost * (1 + markup / 100))
  const childCost = Math.round(adultCost * 0.75) // 75% del adulto
  const infantCost = Math.round(adultCost * 0.10) // 10% del adulto
  const childSelling = Math.round(adultSelling * 0.75)
  const infantSelling = Math.round(adultSelling * 0.10)
  
  return {
    pricing: {
      adult: { cost: adultCost, selling: adultSelling, currency },
      child: { cost: childCost, selling: childSelling, currency },
      infant: { cost: infantCost, selling: infantSelling, currency }
    },
    // Mantener campos legacy
    costPrice: adultCost,
    costCurrency: currency,
    sellingPrice: adultSelling,
    sellingCurrency: currency
  }
}

// Función para generar asientos disponibles
function generateAvailableSeats(
  startRow: number, 
  endRow: number, 
  columns: string[], 
  excludeSeats: string[] = [],
  freeSeatsRows: number[] = [] // Filas con asientos gratis
) {
  const seats = []
  for (let row = startRow; row <= endRow; row++) {
    for (const col of columns) {
      const seatNumber = `${row}${col}`
      if (!excludeSeats.includes(seatNumber)) {
        // Determinar precio del asiento
        let price = 0
        if (!freeSeatsRows.includes(row)) {
          // Asientos de pago: ventanas más caras
          price = col === 'A' || col === 'F' ? 20 : 15
        }
        // Si la fila está en freeSeatsRows, price = 0 (gratis)
        
        seats.push({
          seatNumber,
          status: 'available',
          price
        })
      }
    }
  }
  return seats
}

// Modelos
const FlightSchema = new mongoose.Schema({
  supplier: mongoose.Schema.Types.ObjectId,
  flightNumber: String,
  airline: {
    name: String,
    iataCode: String,
    logoUrl: String
  },
  aircraftType: { type: mongoose.Schema.Types.ObjectId, ref: 'AircraftType' },
  departure: {
    airport: String,
    city: String,
    cityNormalized: String,
    country: String,
    terminal: String,
    dateTime: Date
  },
  arrival: {
    airport: String,
    city: String,
    cityNormalized: String,
    country: String,
    terminal: String,
    dateTime: Date
  },
  duration: Number,
  stops: Number,
  layovers: Array,
  classes: Array,
  amenities: Array,
  cancellationPolicy: String,
  changePolicy: String,
  refundable: Boolean,
  status: String,
  notes: String,
  tags: Array,
  createdBy: mongoose.Schema.Types.ObjectId,
  updatedBy: mongoose.Schema.Types.ObjectId
}, { timestamps: true })

const HotelSchema = new mongoose.Schema({
  supplier: mongoose.Schema.Types.ObjectId,
  name: String,
  chain: String,
  category: Number,
  location: Object,
  phone: String,
  email: String,
  website: String,
  description: String,
  amenities: Array,
  roomTypes: Array,
  checkIn: String,
  checkOut: String,
  cancellationPolicy: String,
  childPolicy: String,
  petPolicy: String,
  rating: Number,
  reviews: Number,
  status: String,
  images: Array,
  notes: String,
  tags: Array,
  createdBy: mongoose.Schema.Types.ObjectId,
  updatedBy: mongoose.Schema.Types.ObjectId
}, { timestamps: true })

const PackageSchema = new mongoose.Schema({
  supplier: mongoose.Schema.Types.ObjectId,
  name: String,
  description: String,
  destination: Object,
  duration: Object,
  category: String,
  included: Array,
  notIncluded: Array,
  itinerary: Array,
  pricing: Object,
  availability: Object,
  images: Array,
  featured: Boolean,
  tags: Array,
  status: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  updatedBy: mongoose.Schema.Types.ObjectId
}, { timestamps: true })

const SupplierSchema = new mongoose.Schema({
  name: String,
  type: String,
  contact: Object,
  status: String,
  createdBy: mongoose.Schema.Types.ObjectId
}, { timestamps: true })

const Flight = mongoose.models.Flight || mongoose.model('Flight', FlightSchema)
const Hotel = mongoose.models.Hotel || mongoose.model('Hotel', HotelSchema)
const Package = mongoose.models.Package || mongoose.model('Package', PackageSchema)
const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema)

async function seedInventory() {
  try {
    await connectDB()
    console.log('🔌 Conectado a MongoDB')

    // Limpiar datos existentes
    await Flight.deleteMany({})
    await Hotel.deleteMany({})
    await Package.deleteMany({})
    await Supplier.deleteMany({})
    console.log('🧹 Base de datos limpiada')

    // Crear un usuario admin ficticio para createdBy
    const adminId = new mongoose.Types.ObjectId()

    // 1. CREAR PROVEEDORES
    console.log('📦 Creando proveedores...')
    const suppliers = await Supplier.insertMany([
      {
        name: 'Aerolíneas Mexicanas',
        type: 'airline',
        contact: { email: 'contacto@aeromex.com', phone: '+52 55 1234 5678' },
        status: 'active',
        createdBy: adminId
      },
      {
        name: 'Hoteles Paradisus',
        type: 'hotel',
        contact: { email: 'reservas@paradisus.com', phone: '+52 998 123 4567' },
        status: 'active',
        createdBy: adminId
      },
      {
        name: 'Viajes Premium',
        type: 'package',
        contact: { email: 'info@viajespremium.com', phone: '+52 55 9876 5432' },
        status: 'active',
        createdBy: adminId
      }
    ])
    console.log(`✅ ${suppliers.length} proveedores creados`)

    // 2. OBTENER AIRCRAFT TYPES
    console.log('✈️ Obteniendo tipos de avión...')
    const boeing737 = await AircraftType.findOne({ aircraftModel: 'Boeing 737-800' })
    const airbusA320 = await AircraftType.findOne({ aircraftModel: 'Airbus A320-200' })
    const airbusA350 = await AircraftType.findOne({ aircraftModel: 'Airbus A350-900' })
    const boeing787 = await AircraftType.findOne({ aircraftModel: 'Boeing 787-9 Dreamliner' })
    const embraerE190 = await AircraftType.findOne({ aircraftModel: 'Embraer E190' })
    
    if (!boeing737 || !airbusA320 || !airbusA350 || !boeing787 || !embraerE190) {
      throw new Error('⚠️ Primero debes ejecutar: npm run seed:aircraft')
    }
    console.log(`✅ ${5} tipos de avión encontrados`)

    // 3. CREAR VUELOS
    console.log('✈️ Creando vuelos...')
    
    // Helper para generar asientos basados en la configuración del avión
    function generateSeatsForClass(aircraft: any, className: string, freeRows: number[] = []) {
      const cabin = aircraft.cabinConfiguration.find((c: any) => c.class === className)
      if (!cabin) return []
      
      const seats = []
      for (const row of cabin.rows) {
        for (const col of cabin.columns) {
          const seatNumber = `${row}${col}`
          // Determinar precio
          let price = 0
          if (!freeRows.includes(row)) {
            // Ventanas más caras
            price = col === 'A' || col === 'F' || col === 'K' ? 20 : 15
          }
          seats.push({
            seatNumber,
            status: 'available',
            price
          })
        }
      }
      return seats
    }
    
    // Vuelos específicos con diferentes configuraciones de asientos
    const specificFlights = [
      // VUELO 1: Boeing 787 - Vuelo largo con todas las clases
      {
        supplier: suppliers[0]._id,
        flightNumber: 'AA450',
        airline: {
          name: 'American Airlines',
          iataCode: 'AA',
          logoUrl: 'https://api-ninjas-data.s3.us-west-2.amazonaws.com/airline_logos/brandmark/american_airlines.png'
        },
        aircraftType: boeing787._id,
        departure: {
          airport: 'MEX',
          city: 'Ciudad de México',
          cityNormalized: normalizeText('Ciudad de México'),
          country: 'México',
          terminal: 'T2',
          dateTime: new Date('2026-01-28T08:00:00.000Z')
        },
        arrival: {
          airport: 'CUN',
          city: 'Cancún',
          cityNormalized: normalizeText('Cancún'),
          country: 'México',
          terminal: 'T3',
          dateTime: new Date('2026-01-28T10:30:00.000Z')
        },
        duration: 150,
        stops: 0,
        classes: [
          {
            type: 'economy',
            availableSeats: 120,
            ...generatePricing(180, 25),
            markup: 25,
            baggage: { carry: '3 x 10kg', checked: '2 x 23kg' },
            seatSelection: true,
            amenities: ['wifi', 'snacks', 'entertainment', 'usb charging'],
            availableSeatsDetail: generateSeatsForClass(boeing787, 'economy', [45, 46, 47, 48, 49, 50])
          },
          {
            type: 'premium economy',
            availableSeats: 24,
            ...generatePricing(320, 30),
            markup: 30,
            baggage: { carry: '2 x 12kg', checked: '2 x 23kg' },
            seatSelection: true,
            amenities: ['wifi', 'premium snacks', 'entertainment', 'extra legroom', 'priority boarding'],
            availableSeatsDetail: generateSeatsForClass(boeing787, 'premium economy', [15, 16, 17, 18])
          },
          {
            type: 'business',
            availableSeats: 16,
            ...generatePricing(480, 35),
            markup: 35,
            baggage: { carry: '2 x 15kg', checked: '2 x 32kg' },
            seatSelection: true,
            amenities: ['wifi', 'gourmet meals', 'entertainment', 'priority boarding', 'lounge access', 'lie-flat seats'],
            availableSeatsDetail: generateSeatsForClass(boeing787, 'business', [3, 4, 5, 6, 7, 8])
          },
          {
            type: 'first',
            availableSeats: 8,
            ...generatePricing(720, 40),
            markup: 40,
            baggage: { carry: '3 x 20kg', checked: '3 x 32kg' },
            seatSelection: true,
            amenities: ['wifi', 'luxury dining', 'entertainment', 'priority boarding', 'lounge access', 'private suite', 'chauffeur service'],
            availableSeatsDetail: generateSeatsForClass(boeing787, 'first', [1, 2])
          }
        ],
        cancellationPolicy: 'Reembolso del 80% hasta 7 días antes',
        changePolicy: 'Cambios permitidos con cargo de $50 USD',
        refundable: true,
        status: 'available',
        notes: 'Vuelo con selección manual de asientos',
        tags: ['direct', 'popular', 'manual_seats'],
        createdBy: adminId,
        updatedBy: adminId
      },
      
      // VUELO 2: Embraer E190 - Vuelo regional low-cost
      {
        supplier: suppliers[0]._id,
        flightNumber: 'F9789',
        airline: {
          name: 'Frontier Airlines',
          iataCode: 'F9',
          logoUrl: 'https://api-ninjas-data.s3.us-west-2.amazonaws.com/airline_logos/brandmark/frontier_airlines.png'
        },
        aircraftType: embraerE190._id,
        departure: {
          airport: 'MEX',
          city: 'Ciudad de México',
          cityNormalized: normalizeText('Ciudad de México'),
          country: 'México',
          terminal: 'T1',
          dateTime: new Date('2026-01-28T14:00:00.000Z')
        },
        arrival: {
          airport: 'CUN',
          city: 'Cancún',
          cityNormalized: normalizeText('Cancún'),
          country: 'México',
          terminal: 'T2',
          dateTime: new Date('2026-01-28T16:30:00.000Z')
        },
        duration: 150,
        stops: 0,
        classes: [
          {
            type: 'economy',
            availableSeats: 150,
            ...generatePricing(120, 20),
            markup: 20,
            baggage: { carry: '1 x 10kg', checked: '1 x 15kg' },
            seatSelection: false,
            amenities: ['snacks']
          }
        ],
        cancellationPolicy: 'No reembolsable',
        changePolicy: 'Cambios permitidos con cargo de $80 USD',
        refundable: false,
        status: 'available',
        notes: 'Vuelo económico. Asientos asignados por aerolínea.',
        tags: ['direct', 'budget', 'airline_assigned'],
        createdBy: adminId,
        updatedBy: adminId
      },
      
      // VUELO 3: Airbus A320 - Vuelo nacional con Business
      {
        supplier: suppliers[0]._id,
        flightNumber: 'DL234',
        airline: {
          name: 'Delta Air Lines',
          iataCode: 'DL',
          logoUrl: 'https://api-ninjas-data.s3.us-west-2.amazonaws.com/airline_logos/brandmark/delta.png'
        },
        aircraftType: airbusA320._id,
        departure: {
          airport: 'GDL',
          city: 'Guadalajara',
          cityNormalized: normalizeText('Guadalajara'),
          country: 'México',
          terminal: 'T1',
          dateTime: new Date('2026-01-28T10:00:00.000Z')
        },
        arrival: {
          airport: 'CUN',
          city: 'Cancún',
          cityNormalized: normalizeText('Cancún'),
          country: 'México',
          terminal: 'T2',
          dateTime: new Date('2026-01-28T13:15:00.000Z')
        },
        duration: 195,
        stops: 0,
        classes: [
          {
            type: 'economy',
            availableSeats: 100,
            ...generatePricing(150, 22),
            markup: 22,
            baggage: { carry: '1 x 10kg', checked: '2 x 23kg' },
            seatSelection: true,
            amenities: ['wifi', 'snacks', 'entertainment'],
            availableSeatsDetail: generateSeatsForClass(airbusA320, 'economy', [28, 29, 30, 31, 32])
          },
          {
            type: 'business',
            availableSeats: 16,
            ...generatePricing(400, 32),
            markup: 32,
            seatSelection: true,
            baggage: { carry: '2 x 12kg', checked: '2 x 32kg' },
            amenities: ['wifi', 'gourmet meals', 'entertainment', 'priority boarding', 'lounge access', 'extra legroom'],
            availableSeatsDetail: generateSeatsForClass(airbusA320, 'business', [1, 2, 3, 4])
          }
        ],
        cancellationPolicy: 'Reembolso del 50% hasta 3 días antes',
        changePolicy: 'Cambios permitidos con cargo de $30 USD',
        refundable: true,
        status: 'available',
        notes: 'Vuelo con asignación aleatoria de asientos',
        tags: ['direct', 'random_seats'],
        createdBy: adminId,
        updatedBy: adminId
      },

      // VUELO 4: MEX-CUN con escala en Monterrey (MTY)
      {
        supplier: suppliers[0]._id,
        flightNumber: 'AV102',
        airline: {
          name: 'Avianca',
          iataCode: 'AV',
          logoUrl: 'https://api-ninjas-data.s3.us-west-2.amazonaws.com/airline_logos/brandmark/avianca_airlines.png'
        },
        aircraftType: airbusA320._id,
        departure: {
          airport: 'MEX',
          city: 'Ciudad de México',
          cityNormalized: normalizeText('Ciudad de México'),
          country: 'México',
          terminal: 'T1',
          dateTime: new Date('2026-01-28T06:00:00.000Z')
        },
        arrival: {
          airport: 'CUN',
          city: 'Cancún',
          cityNormalized: normalizeText('Cancún'),
          country: 'México',
          terminal: 'T4',
          dateTime: new Date('2026-01-28T12:45:00.000Z')
        },
        duration: 405, // 6h 45min total
        stops: 1,
        layovers: [
          {
            airport: 'MTY',
            city: 'Monterrey',
            duration: 90 // 1h 30min de escala
          }
        ],
        classes: [
          {
            type: 'economy',
            availableSeats: 140,
            ...generatePricing(95, 18),
            markup: 18,
            baggage: { carry: '1 x 10kg', checked: '1 x 20kg' },
            seatSelection: true,
            amenities: ['snacks'],
            availableSeatsDetail: generateSeatsForClass(airbusA320, 'economy', [25, 26, 27, 28, 29, 30, 31, 32])
          }
        ],
        cancellationPolicy: 'No reembolsable',
        changePolicy: 'Cambios permitidos con cargo de $60 USD',
        refundable: false,
        status: 'available',
        notes: 'Vuelo económico con escala en Monterrey',
        tags: ['layover', 'budget'],
        createdBy: adminId,
        updatedBy: adminId
      },

      // VUELO 5: CUN-MEX directo (vuelo de regreso)
      {
        supplier: suppliers[0]._id,
        flightNumber: 'AA451',
        airline: {
          name: 'American Airlines',
          iataCode: 'AA',
          logoUrl: 'https://api-ninjas-data.s3.us-west-2.amazonaws.com/airline_logos/brandmark/american_airlines.png'
        },
        aircraftType: boeing787._id,
        departure: {
          airport: 'CUN',
          city: 'Cancún',
          cityNormalized: normalizeText('Cancún'),
          country: 'México',
          terminal: 'T3',
          dateTime: new Date('2026-02-04T11:00:00.000Z')
        },
        arrival: {
          airport: 'MEX',
          city: 'Ciudad de México',
          cityNormalized: normalizeText('Ciudad de México'),
          country: 'México',
          terminal: 'T2',
          dateTime: new Date('2026-02-04T13:30:00.000Z')
        },
        duration: 150,
        stops: 0,
        classes: [
          {
            type: 'economy',
            availableSeats: 110,
            ...generatePricing(185, 25),
            markup: 25,
            baggage: { carry: '3 x 10kg', checked: '2 x 23kg' },
            seatSelection: true,
            amenities: ['wifi', 'snacks', 'entertainment', 'usb charging'],
            availableSeatsDetail: generateSeatsForClass(boeing787, 'economy', [45, 46, 47, 48, 49, 50])
          },
          {
            type: 'business',
            availableSeats: 14,
            ...generatePricing(490, 35),
            markup: 35,
            baggage: { carry: '2 x 15kg', checked: '2 x 32kg' },
            seatSelection: true,
            amenities: ['wifi', 'gourmet meals', 'entertainment', 'priority boarding', 'lounge access', 'lie-flat seats'],
            availableSeatsDetail: generateSeatsForClass(boeing787, 'business', [3, 4, 5, 6, 7, 8])
          }
        ],
        cancellationPolicy: 'Reembolso del 80% hasta 7 días antes',
        changePolicy: 'Cambios permitidos con cargo de $50 USD',
        refundable: true,
        status: 'available',
        notes: 'Vuelo de regreso directo',
        tags: ['direct', 'popular'],
        createdBy: adminId,
        updatedBy: adminId
      },

      // VUELO 6: CUN-MEX con escala en Guadalajara (GDL)
      {
        supplier: suppliers[0]._id,
        flightNumber: 'V0790',
        airline: {
          name: 'Conviasa',
          iataCode: 'V0',
          logoUrl: 'https://api-ninjas-data.s3.us-west-2.amazonaws.com/airline_logos/brandmark/conviasa.png'
        },
        aircraftType: embraerE190._id,
        departure: {
          airport: 'CUN',
          city: 'Cancún',
          cityNormalized: normalizeText('Cancún'),
          country: 'México',
          terminal: 'T2',
          dateTime: new Date('2026-02-04T15:30:00.000Z')
        },
        arrival: {
          airport: 'MEX',
          city: 'Ciudad de México',
          cityNormalized: normalizeText('Ciudad de México'),
          country: 'México',
          terminal: 'T1',
          dateTime: new Date('2026-02-04T21:15:00.000Z')
        },
        duration: 345, // 5h 45min total
        stops: 1,
        layovers: [
          {
            airport: 'GDL',
            city: 'Guadalajara',
            duration: 75 // 1h 15min de escala
          }
        ],
        classes: [
          {
            type: 'economy',
            availableSeats: 145,
            ...generatePricing(105, 20),
            markup: 20,
            baggage: { carry: '1 x 10kg', checked: '1 x 15kg' },
            seatSelection: false,
            amenities: ['snacks']
          }
        ],
        cancellationPolicy: 'No reembolsable',
        changePolicy: 'Cambios permitidos con cargo de $80 USD',
        refundable: false,
        status: 'available',
        notes: 'Vuelo económico de regreso con escala en Guadalajara',
        tags: ['layover', 'budget', 'airline_assigned'],
        createdBy: adminId,
        updatedBy: adminId
      },

      // VUELO 7: CUN-MEX directo - 5 Febrero (para sugerencias)
      {
        supplier: suppliers[0]._id,
        flightNumber: 'AG452',
        airline: {
          name: 'Aruba Airlines',
          iataCode: 'AG',
          logoUrl: 'https://api-ninjas-data.s3.us-west-2.amazonaws.com/airline_logos/brandmark/aruba_airlines.png'
        },
        aircraftType: boeing787._id,
        departure: {
          airport: 'CUN',
          city: 'Cancún',
          cityNormalized: normalizeText('Cancún'),
          country: 'México',
          terminal: 'T3',
          dateTime: new Date('2026-02-05T14:00:00.000Z')
        },
        arrival: {
          airport: 'MEX',
          city: 'Ciudad de México',
          cityNormalized: normalizeText('Ciudad de México'),
          country: 'México',
          terminal: 'T2',
          dateTime: new Date('2026-02-05T16:30:00.000Z')
        },
        duration: 150,
        stops: 0,
        classes: [
          {
            type: 'economy',
            availableSeats: 95,
            ...generatePricing(190, 25),
            markup: 25,
            baggage: { carry: '3 x 10kg', checked: '2 x 23kg' },
            seatSelection: true,
            amenities: ['wifi', 'snacks', 'entertainment', 'usb charging'],
            availableSeatsDetail: generateSeatsForClass(boeing787, 'economy', [45, 46, 47, 48, 49, 50])
          },
          {
            type: 'business',
            availableSeats: 12,
            ...generatePricing(500, 35),
            markup: 35,
            baggage: { carry: '2 x 15kg', checked: '2 x 32kg' },
            seatSelection: true,
            amenities: ['wifi', 'gourmet meals', 'entertainment', 'priority boarding', 'lounge access', 'lie-flat seats'],
            availableSeatsDetail: generateSeatsForClass(boeing787, 'business', [3, 4, 5, 6, 7, 8])
          }
        ],
        cancellationPolicy: 'Reembolso del 80% hasta 7 días antes',
        changePolicy: 'Cambios permitidos con cargo de $50 USD',
        refundable: true,
        status: 'available',
        notes: 'Vuelo de regreso directo - 5 Feb',
        tags: ['direct', 'popular'],
        createdBy: adminId,
        updatedBy: adminId
      },

      // VUELO 8: CUN-MEX directo - 7 Febrero (para sugerencias)
      {
        supplier: suppliers[0]._id,
        flightNumber: 'DL454',
        airline: {
          name: 'Delta Air Lines',
          iataCode: 'DL',
          logoUrl: 'https://api-ninjas-data.s3.us-west-2.amazonaws.com/airline_logos/brandmark/delta.png'
        },
        aircraftType: boeing787._id,
        departure: {
          airport: 'CUN',
          city: 'Cancún',
          cityNormalized: normalizeText('Cancún'),
          country: 'México',
          terminal: 'T3',
          dateTime: new Date('2026-02-07T10:00:00.000Z')
        },
        arrival: {
          airport: 'MEX',
          city: 'Ciudad de México',
          cityNormalized: normalizeText('Ciudad de México'),
          country: 'México',
          terminal: 'T2',
          dateTime: new Date('2026-02-07T12:30:00.000Z')
        },
        duration: 150,
        stops: 0,
        classes: [
          {
            type: 'economy',
            availableSeats: 120,
            ...generatePricing(180, 25),
            markup: 25,
            baggage: { carry: '3 x 10kg', checked: '2 x 23kg' },
            seatSelection: true,
            amenities: ['wifi', 'snacks', 'entertainment', 'usb charging'],
            availableSeatsDetail: generateSeatsForClass(boeing787, 'economy', [45, 46, 47, 48, 49, 50])
          },
          {
            type: 'business',
            availableSeats: 16,
            ...generatePricing(480, 35),
            markup: 35,
            baggage: { carry: '2 x 15kg', checked: '2 x 32kg' },
            seatSelection: true,
            amenities: ['wifi', 'gourmet meals', 'entertainment', 'priority boarding', 'lounge access', 'lie-flat seats'],
            availableSeatsDetail: generateSeatsForClass(boeing787, 'business', [3, 4, 5, 6, 7, 8])
          }
        ],
        cancellationPolicy: 'Reembolso del 80% hasta 7 días antes',
        changePolicy: 'Cambios permitidos con cargo de $50 USD',
        refundable: true,
        status: 'available',
        notes: 'Vuelo de regreso directo - 7 Feb',
        tags: ['direct', 'popular'],
        createdBy: adminId,
        updatedBy: adminId
      },

      // VUELO 9: CUN-MEX con escala - 8 Febrero (para sugerencias)
      {
        supplier: suppliers[0]._id,
        flightNumber: 'F9792',
        airline: {
          name: 'Frontier Airlines',
          iataCode: 'F9',
          logoUrl: 'https://api-ninjas-data.s3.us-west-2.amazonaws.com/airline_logos/brandmark/frontier_airlines.png'
        },
        aircraftType: embraerE190._id,
        departure: {
          airport: 'CUN',
          city: 'Cancún',
          cityNormalized: normalizeText('Cancún'),
          country: 'México',
          terminal: 'T2',
          dateTime: new Date('2026-02-08T16:00:00.000Z')
        },
        arrival: {
          airport: 'MEX',
          city: 'Ciudad de México',
          cityNormalized: normalizeText('Ciudad de México'),
          country: 'México',
          terminal: 'T1',
          dateTime: new Date('2026-02-08T21:30:00.000Z')
        },
        duration: 330,
        stops: 1,
        layovers: [
          {
            airport: 'GDL',
            city: 'Guadalajara',
            duration: 70
          }
        ],
        classes: [
          {
            type: 'economy',
            availableSeats: 150,
            ...generatePricing(100, 20),
            markup: 20,
            baggage: { carry: '1 x 10kg', checked: '1 x 15kg' },
            seatSelection: false,
            amenities: ['snacks']
          }
        ],
        cancellationPolicy: 'No reembolsable',
        changePolicy: 'Cambios permitidos con cargo de $80 USD',
        refundable: false,
        status: 'available',
        notes: 'Vuelo económico de regreso con escala - 8 Feb',
        tags: ['layover', 'budget', 'airline_assigned'],
        createdBy: adminId,
        updatedBy: adminId
      }
    ]
    
    // Insertar vuelos
    const createdFlights = await Flight.insertMany(specificFlights)
    console.log(`✅ ${createdFlights.length} vuelos creados`)

    // 4. CREAR HOTELES
    console.log('🏨 Creando hoteles...')
    const hotels = [
      {
        supplier: suppliers[1]._id,
        name: 'Grand Oasis Cancún',
        chain: 'Oasis Hotels',
        category: 5,
        location: {
          address: 'Blvd. Kukulcan Km 16.5',
          city: 'Cancún',
          state: 'Quintana Roo',
          country: 'México',
          postalCode: '77500',
          zone: 'Zona Hotelera',
          coordinates: { latitude: 21.1236, longitude: -86.7474 }
        },
        phone: '+52 998 881 7000',
        email: 'reservas@grandoasis.com',
        website: 'https://www.grandoasiscancun.com',
        description: 'Resort todo incluido frente al mar Caribe con piscinas infinitas, restaurantes gourmet y spa de clase mundial. Perfecto para familias y parejas.',
        amenities: ['Piscina', 'Spa', 'Gimnasio', 'Restaurantes', 'WiFi', 'Estacionamiento', 'Acceso a playa', 'Bar', 'Servicio a habitación', 'Kids Club'],
        roomTypes: [
          {
            name: 'Habitación Deluxe Vista al Mar',
            description: 'Habitación elegante con vista panorámica al Caribe',
            capacity: { adults: 2, children: 2 },
            size: 45,
            bedType: '1 King o 2 Queen',
            amenities: ['Balcón', 'Minibar', 'TV Smart', 'Aire acondicionado', 'Caja fuerte'],
            totalRooms: 50,
            availableRooms: 35,
            plans: [
              {
                type: 'all_inclusive',
                costPerNight: 3500,
                costCurrency: 'MXN',
                markup: 35,
                sellingPricePerNight: 4725,
                sellingCurrency: 'MXN',
                minNights: 2
              }
            ],
            images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800']
          },
          {
            name: 'Suite Junior',
            description: 'Suite espaciosa con sala de estar y jacuzzi',
            capacity: { adults: 3, children: 1 },
            size: 65,
            bedType: '1 King + Sofá cama',
            amenities: ['Balcón', 'Minibar', 'TV Smart', 'Jacuzzi', 'Aire acondicionado', 'Caja fuerte', 'Cafetera'],
            totalRooms: 30,
            availableRooms: 18,
            plans: [
              {
                type: 'all_inclusive',
                costPerNight: 5500,
                costCurrency: 'MXN',
                markup: 40,
                sellingPricePerNight: 7700,
                sellingCurrency: 'MXN',
                minNights: 3
              }
            ],
            images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800']
          }
        ],
        checkIn: '15:00',
        checkOut: '12:00',
        cancellationPolicy: 'Cancelación gratuita hasta 7 días antes. Después aplica cargo del 50%.',
        childPolicy: 'Niños menores de 12 años gratis compartiendo habitación con adultos.',
        rating: 9.2,
        reviews: 1847,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'
        ],
        tags: ['playa', 'familia', 'todo-incluido', 'lujo'],
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        supplier: suppliers[1]._id,
        name: 'Secrets The Vine Cancún',
        chain: 'Secrets Resorts',
        category: 5,
        location: {
          address: 'Blvd. Kukulcan Km 14.5',
          city: 'Cancún',
          state: 'Quintana Roo',
          country: 'México',
          postalCode: '77500',
          zone: 'Zona Hotelera'
        },
        phone: '+52 998 848 8500',
        email: 'info@secretsthevine.com',
        website: 'https://www.secretsresorts.com',
        description: 'Resort solo adultos con ambiente romántico, gastronomía de autor y servicio personalizado. Ideal para lunas de miel.',
        amenities: ['Piscina infinity', 'Spa', 'Gimnasio', '7 Restaurantes', 'WiFi', 'Mayordomo', 'Acceso a playa', 'Bar en piscina', 'Yoga'],
        roomTypes: [
          {
            name: 'Preferred Club Ocean View',
            description: 'Habitación premium con acceso a lounge exclusivo',
            capacity: { adults: 2, children: 0 },
            size: 50,
            bedType: '1 King',
            amenities: ['Balcón', 'Minibar premium', 'TV Smart', 'Jacuzzi', 'Servicio de mayordomo', 'Amenidades de lujo'],
            totalRooms: 40,
            availableRooms: 22,
            plans: [
              {
                type: 'all_inclusive',
                costPerNight: 6500,
                costCurrency: 'MXN',
                markup: 45,
                sellingPricePerNight: 9425,
                sellingCurrency: 'MXN',
                minNights: 3
              }
            ],
            images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800']
          }
        ],
        checkIn: '15:00',
        checkOut: '12:00',
        cancellationPolicy: 'Cancelación gratuita hasta 14 días antes.',
        rating: 9.5,
        reviews: 2341,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200'
        ],
        tags: ['adultos-solo', 'romántico', 'lujo', 'playa'],
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        supplier: suppliers[1]._id,
        name: 'Hotel Xcaret México',
        chain: 'Grupo Xcaret',
        category: 5,
        location: {
          address: 'Carretera Chetumal-Puerto Juárez Km 282',
          city: 'Playa del Carmen',
          state: 'Quintana Roo',
          country: 'México',
          postalCode: '77710',
          zone: 'Riviera Maya'
        },
        phone: '+52 984 206 0038',
        email: 'reservaciones@hotelxcaret.com',
        website: 'https://www.hotelxcaret.com',
        description: 'Resort ecológico todo incluido con acceso ilimitado a parques Xcaret, Xel-Há, Xplor y más. Experiencia única en la Riviera Maya.',
        amenities: ['Acceso a parques', 'Piscinas naturales', 'Spa', '10 Restaurantes', 'WiFi', 'Ríos subterráneos', 'Playa privada', 'Shows nocturnos'],
        roomTypes: [
          {
            name: 'Habitación Estándar',
            description: 'Habitación confortable con decoración mexicana contemporánea',
            capacity: { adults: 2, children: 2 },
            size: 48,
            bedType: '1 King o 2 Queen',
            amenities: ['Balcón', 'Minibar', 'TV', 'Aire acondicionado', 'Amenidades ecológicas'],
            totalRooms: 60,
            availableRooms: 42,
            plans: [
              {
                type: 'all_inclusive',
                costPerNight: 7500,
                costCurrency: 'MXN',
                markup: 40,
                sellingPricePerNight: 10500,
                sellingCurrency: 'MXN',
                minNights: 2
              }
            ],
            images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800']
          }
        ],
        checkIn: '15:00',
        checkOut: '12:00',
        cancellationPolicy: 'Cancelación gratuita hasta 10 días antes.',
        childPolicy: 'Niños menores de 5 años gratis.',
        rating: 9.7,
        reviews: 3892,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200',
          'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200'
        ],
        tags: ['ecológico', 'familia', 'aventura', 'todo-incluido'],
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        supplier: suppliers[1]._id,
        name: 'Marquis Los Cabos',
        category: 5,
        location: {
          address: 'Fracc. Cabo Real s/n',
          city: 'Los Cabos',
          state: 'Baja California Sur',
          country: 'México',
          postalCode: '23400',
          zone: 'Corredor Turístico'
        },
        phone: '+52 624 144 2000',
        email: 'reservas@marquisloscabos.com',
        description: 'Resort de lujo solo adultos con vistas espectaculares al Mar de Cortés, gastronomía excepcional y servicio cinco estrellas.',
        amenities: ['Piscina infinity', 'Spa de lujo', 'Campo de golf', '4 Restaurantes', 'WiFi', 'Playa privada', 'Bar premium', 'Concierge'],
        roomTypes: [
          {
            name: 'Casita Ocean Front',
            description: 'Suite frente al mar con terraza privada y jacuzzi',
            capacity: { adults: 2, children: 0 },
            size: 85,
            bedType: '1 King',
            amenities: ['Terraza', 'Jacuzzi exterior', 'Minibar premium', 'TV Smart', 'Servicio de mayordomo', 'Amenidades de lujo'],
            totalRooms: 25,
            availableRooms: 12,
            plans: [
              {
                type: 'all_inclusive',
                costPerNight: 12000,
                costCurrency: 'MXN',
                markup: 50,
                sellingPricePerNight: 18000,
                sellingCurrency: 'MXN',
                minNights: 3
              }
            ],
            images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800']
          }
        ],
        checkIn: '16:00',
        checkOut: '12:00',
        cancellationPolicy: 'Cancelación gratuita hasta 21 días antes.',
        rating: 9.8,
        reviews: 1523,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200',
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200'
        ],
        tags: ['adultos-solo', 'lujo', 'playa', 'golf'],
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        supplier: suppliers[1]._id,
        name: 'Rosewood Mayakoba',
        chain: 'Rosewood Hotels',
        category: 5,
        location: {
          address: 'Carretera Federal Cancún-Playa del Carmen Km 298',
          city: 'Playa del Carmen',
          state: 'Quintana Roo',
          country: 'México',
          postalCode: '77710',
          zone: 'Riviera Maya'
        },
        phone: '+52 984 875 8000',
        email: 'reservations@rosewoodmayakoba.com',
        description: 'Resort ultra lujo integrado en la selva maya con lagunas, canales y playa privada. Experiencia exclusiva y personalizada.',
        amenities: ['Spa galardonado', 'Campo de golf', 'Piscinas privadas', '6 Restaurantes', 'WiFi', 'Playa privada', 'Paseos en lancha', 'Kids Club'],
        roomTypes: [
          {
            name: 'Lagoon Suite',
            description: 'Suite de lujo con piscina privada y muelle',
            capacity: { adults: 2, children: 2 },
            size: 120,
            bedType: '1 King',
            amenities: ['Piscina privada', 'Muelle privado', 'Terraza', 'Minibar premium', 'TV Smart', 'Mayordomo 24/7', 'Amenidades Rosewood'],
            totalRooms: 20,
            availableRooms: 8,
            plans: [
              {
                type: 'breakfast',
                costPerNight: 18000,
                costCurrency: 'MXN',
                markup: 55,
                sellingPricePerNight: 27900,
                sellingCurrency: 'MXN',
                minNights: 3
              }
            ],
            images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800']
          }
        ],
        checkIn: '15:00',
        checkOut: '12:00',
        cancellationPolicy: 'Cancelación gratuita hasta 30 días antes.',
        childPolicy: 'Niños bienvenidos. Servicios especiales disponibles.',
        rating: 9.9,
        reviews: 987,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200',
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200'
        ],
        tags: ['ultra-lujo', 'familia', 'golf', 'spa'],
        createdBy: adminId,
        updatedBy: adminId
      }
    ]

    const createdHotels = await Hotel.insertMany(hotels)
    console.log(`✅ ${createdHotels.length} hoteles creados`)

    // 4. CREAR PAQUETES
    console.log('📦 Creando paquetes turísticos...')
    const packages = [
      {
        supplier: suppliers[2]._id,
        name: 'Cancún Todo Incluido - 5 Días 4 Noches',
        description: 'Paquete completo a Cancún con vuelo redondo, hotel todo incluido 5 estrellas, traslados y tours. Disfruta del paraíso caribeño sin preocupaciones.',
        destination: {
          city: 'Cancún',
          cityNormalized: normalizeText('Cancún'),
          state: 'Quintana Roo',
          country: 'México',
          countryNormalized: normalizeText('México')
        },
        duration: {
          days: 5,
          nights: 4
        },
        category: 'beach',
        included: [
          'Vuelo redondo desde Ciudad de México',
          'Hotel Grand Oasis Cancún - Todo Incluido',
          'Traslados aeropuerto-hotel-aeropuerto',
          'Tour a Chichén Itzá',
          'Tour a Isla Mujeres',
          'Seguro de viaje',
          'Asistencia 24/7'
        ],
        notIncluded: [
          'Propinas',
          'Gastos personales',
          'Tours opcionales adicionales'
        ],
        itinerary: [
          { day: 1, title: 'Llegada a Cancún', description: 'Recepción en aeropuerto y traslado al hotel. Check-in y tarde libre para disfrutar las instalaciones.' },
          { day: 2, title: 'Día libre en resort', description: 'Disfruta de todas las amenidades del hotel: playa, piscinas, restaurantes y actividades.' },
          { day: 3, title: 'Tour Chichén Itzá', description: 'Visita guiada a la maravilla del mundo maya. Incluye cenote y comida buffet.' },
          { day: 4, title: 'Tour Isla Mujeres', description: 'Paseo en catamarán, snorkel y tiempo libre en la isla. Comida incluida.' },
          { day: 5, title: 'Check-out y regreso', description: 'Traslado al aeropuerto y vuelo de regreso.' }
        ],
        pricing: {
          costPerPerson: {
            double: 625,
            single: 900,
            triple: 550,
            child: 425
          },
          basePricePerPerson: {
            double: 1050,
            single: 1500,
            triple: 920,
            child: 710
          },
          sellingPricePerPerson: {
            double: 875,
            single: 1260,
            triple: 770,
            child: 595
          },
          currency: 'USD',
          markup: 40
        },
        availability: {
          startDate: new Date('2024-12-01'),
          endDate: new Date('2025-12-31'),
          minPeople: 2,
          maxPeople: 10
        },
        images: [
          'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=1200',
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200',
          'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200'
        ],
        features: {
          hotelStars: 5,
          includesFlights: true,
          includesTransfers: true,
          wifi: true,
          allInclusive: true,
          kidsClub: true,
          spa: true,
          pool: true,
          privateBeach: true,
          gym: true,
          golf: false,
          snorkelEquipment: true,
          roomType: 'standard',
          amenities: ['pool', 'spa', 'gym', 'beach', 'wifi', 'restaurant', 'bar', 'kids-club', 'water-sports']
        },
        featured: true,
        tags: ['playa', 'todo-incluido', 'familia', 'cultura'],
        status: 'active',
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        supplier: suppliers[2]._id,
        name: 'Riviera Maya Romántica - 7 Días 6 Noches',
        description: 'Escapada romántica perfecta para parejas. Hotel boutique solo adultos, cenas privadas, spa y experiencias exclusivas en la Riviera Maya.',
        destination: {
          city: 'Playa del Carmen',
          cityNormalized: normalizeText('Playa del Carmen'),
          state: 'Quintana Roo',
          country: 'México',
          countryNormalized: normalizeText('México')
        },
        duration: {
          days: 7,
          nights: 6
        },
        category: 'romance',
        included: [
          'Vuelo redondo',
          'Hotel Secrets The Vine - Solo Adultos',
          'Traslados privados',
          'Cena romántica en la playa',
          'Masaje de pareja en spa',
          'Tour privado a Tulum',
          'Paseo en catamarán al atardecer',
          'Champagne y fresas en habitación',
          'Seguro de viaje'
        ],
        notIncluded: [
          'Propinas',
          'Gastos personales'
        ],
        itinerary: [
          { day: 1, title: 'Llegada y bienvenida romántica', description: 'Traslado privado, check-in y champagne de bienvenida.' },
          { day: 2, title: 'Día de spa y relax', description: 'Masaje de pareja y día libre en el resort.' },
          { day: 3, title: 'Tour privado a Tulum', description: 'Visita las ruinas mayas frente al mar con guía exclusivo.' },
          { day: 4, title: 'Cena romántica', description: 'Cena privada en la playa bajo las estrellas.' },
          { day: 5, title: 'Paseo en catamarán', description: 'Navegación al atardecer con cena a bordo.' },
          { day: 6, title: 'Día libre', description: 'Disfruta del hotel y sus amenidades.' },
          { day: 7, title: 'Despedida', description: 'Traslado al aeropuerto.' }
        ],
        pricing: {
          costPerPerson: {
            double: 1100,
            single: 0
          },
          sellingPricePerPerson: {
            double: 1540,
            single: 0
          },
          currency: 'USD',
          markup: 40
        },
        availability: {
          startDate: new Date('2024-12-01'),
          endDate: new Date('2025-12-31'),
          minPeople: 2,
          maxPeople: 2
        },
        images: [
          'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200'
        ],
        features: {
          hotelStars: 5,
          includesFlights: true,
          includesTransfers: true,
          wifi: true,
          allInclusive: true,
          kidsClub: false,
          spa: true,
          pool: true,
          privateBeach: true,
          gym: true,
          golf: false,
          snorkelEquipment: false,
          roomType: 'suite',
          amenities: ['pool', 'spa', 'gym', 'beach', 'wifi', 'restaurant', 'bar', 'jacuzzi', 'romantic-dinner']
        },
        featured: true,
        tags: ['romántico', 'lujo', 'playa', 'adultos-solo'],
        status: 'active',
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        supplier: suppliers[2]._id,
        name: 'Los Cabos Aventura - 6 Días 5 Noches',
        description: 'Paquete de aventura en Los Cabos con actividades acuáticas, golf, paseos en el desierto y gastronomía de clase mundial.',
        destination: {
          city: 'Los Cabos',
          cityNormalized: normalizeText('Los Cabos'),
          state: 'Baja California Sur',
          country: 'México',
          countryNormalized: normalizeText('México')
        },
        duration: {
          days: 6,
          nights: 5
        },
        category: 'adventure',
        included: [
          'Vuelo redondo',
          'Hotel Marquis Los Cabos',
          'Traslados',
          'Tour en ATV por el desierto',
          'Snorkel en Cabo Pulmo',
          'Avistamiento de ballenas (temporada)',
          'Clase de golf',
          'Cena en restaurante gourmet',
          'Seguro de viaje'
        ],
        notIncluded: [
          'Propinas',
          'Equipo de golf',
          'Gastos personales'
        ],
        itinerary: [
          { day: 1, title: 'Llegada a Los Cabos', description: 'Traslado y check-in en hotel de lujo.' },
          { day: 2, title: 'ATV en el desierto', description: 'Aventura en cuatrimoto por dunas y playas.' },
          { day: 3, title: 'Snorkel Cabo Pulmo', description: 'Explora el arrecife más grande del Pacífico.' },
          { day: 4, title: 'Avistamiento de ballenas', description: 'Tour en barco para ver ballenas grises (dic-abr).' },
          { day: 5, title: 'Golf y gastronomía', description: 'Clase de golf y cena en restaurante premiado.' },
          { day: 6, title: 'Regreso', description: 'Traslado al aeropuerto.' }
        ],
        pricing: {
          costPerPerson: {
            double: 925,
            single: 1300,
            triple: 825
          },
          sellingPricePerPerson: {
            double: 1295,
            single: 1820,
            triple: 1155
          },
          currency: 'USD',
          markup: 40
        },
        availability: {
          startDate: new Date('2024-12-01'),
          endDate: new Date('2025-12-31'),
          minPeople: 2,
          maxPeople: 8
        },
        images: [
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200',
          'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
          'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200'
        ],
        features: {
          hotelStars: 5,
          includesFlights: true,
          includesTransfers: true,
          wifi: true,
          allInclusive: false,
          kidsClub: false,
          spa: true,
          pool: true,
          privateBeach: true,
          gym: true,
          golf: true,
          snorkelEquipment: true,
          roomType: 'suite',
          amenities: ['pool', 'spa', 'gym', 'beach', 'wifi', 'restaurant', 'bar', 'golf', 'water-sports']
        },
        featured: true,
        tags: ['aventura', 'golf', 'playa', 'lujo'],
        status: 'active',
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        supplier: suppliers[2]._id,
        name: 'Ruta Maya Cultural - 8 Días 7 Noches',
        description: 'Recorrido cultural por la Península de Yucatán visitando las principales zonas arqueológicas mayas, cenotes y pueblos mágicos.',
        destination: {
          city: 'Mérida',
          cityNormalized: normalizeText('Mérida'),
          state: 'Yucatán',
          country: 'México',
          countryNormalized: normalizeText('México')
        },
        duration: {
          days: 8,
          nights: 7
        },
        category: 'cultural',
        included: [
          'Vuelo redondo',
          'Hoteles boutique en Mérida, Valladolid y Tulum',
          'Transporte privado durante todo el recorrido',
          'Guía certificado',
          'Entradas a zonas arqueológicas',
          'Visitas a cenotes',
          'Comidas típicas',
          'Seguro de viaje'
        ],
        notIncluded: [
          'Propinas',
          'Bebidas alcohólicas',
          'Gastos personales'
        ],
        itinerary: [
          { day: 1, title: 'Llegada a Mérida', description: 'City tour por el centro histórico.' },
          { day: 2, title: 'Uxmal y Ruta Puuc', description: 'Visita a zona arqueológica y pueblos mayas.' },
          { day: 3, title: 'Chichén Itzá', description: 'Maravilla del mundo y cenote Ik Kil.' },
          { day: 4, title: 'Valladolid y cenotes', description: 'Pueblo mágico y cenotes sagrados.' },
          { day: 5, title: 'Ek Balam', description: 'Zona arqueológica menos conocida pero impresionante.' },
          { day: 6, title: 'Tulum y Cobá', description: 'Ruinas frente al mar y pirámide escalable.' },
          { day: 7, title: 'Sian Ka\'an', description: 'Reserva de la biosfera y canales mayas.' },
          { day: 8, title: 'Regreso', description: 'Traslado a aeropuerto de Cancún.' }
        ],
        pricing: {
          costPerPerson: {
            double: 800,
            single: 1100,
            triple: 725,
            child: 550
          },
          basePricePerPerson: {
            double: 1400,
            single: 1920,
            triple: 1265,
            child: 960
          },
          sellingPricePerPerson: {
            double: 1120,
            single: 1540,
            triple: 1015,
            child: 770
          },
          currency: 'USD',
          markup: 40
        },
        availability: {
          startDate: new Date('2024-12-01'),
          endDate: new Date('2025-12-31'),
          minPeople: 4,
          maxPeople: 12
        },
        images: [
          'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200',
          'https://images.unsplash.com/photo-1569165003085-e8a1066f1cb8?w=1200',
          'https://images.unsplash.com/photo-1512813498716-3e640fed3f39?w=1200'
        ],
        features: {
          hotelStars: 4,
          includesFlights: true,
          includesTransfers: true,
          wifi: true,
          allInclusive: false,
          kidsClub: false,
          spa: false,
          pool: true,
          privateBeach: false,
          gym: false,
          golf: false,
          snorkelEquipment: false,
          roomType: 'standard',
          amenities: ['pool', 'wifi', 'restaurant', 'cultural-tours', 'transport']
        },
        featured: true,
        tags: ['cultura', 'historia', 'arqueología', 'cenotes'],
        status: 'active',
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        supplier: suppliers[2]._id,
        name: 'Puerto Vallarta Familiar - 5 Días 4 Noches',
        description: 'Paquete perfecto para familias con niños. Hotel con kids club, actividades para todas las edades y tours familiares.',
        destination: {
          city: 'Puerto Vallarta',
          cityNormalized: normalizeText('Puerto Vallarta'),
          state: 'Jalisco',
          country: 'México',
          countryNormalized: normalizeText('México')
        },
        duration: {
          days: 5,
          nights: 4
        },
        category: 'family',
        included: [
          'Vuelo redondo',
          'Hotel todo incluido familiar',
          'Traslados',
          'Kids club',
          'Tour a Las Caletas',
          'Paseo en barco pirata',
          'Actividades acuáticas',
          'Seguro de viaje'
        ],
        notIncluded: [
          'Propinas',
          'Gastos personales'
        ],
        itinerary: [
          { day: 1, title: 'Llegada', description: 'Check-in y bienvenida familiar.' },
          { day: 2, title: 'Día de playa', description: 'Disfruta de piscinas y playa con actividades para niños.' },
          { day: 3, title: 'Tour Las Caletas', description: 'Playa privada con snorkel y actividades.' },
          { day: 4, title: 'Barco pirata', description: 'Aventura pirata con cena y show.' },
          { day: 5, title: 'Regreso', description: 'Traslado al aeropuerto.' }
        ],
        pricing: {
          costPerPerson: {
            double: 475,
            triple: 425,
            child: 300
          },
          sellingPricePerPerson: {
            double: 665,
            triple: 595,
            child: 420
          },
          currency: 'USD',
          markup: 40
        },
        availability: {
          startDate: new Date('2024-12-01'),
          endDate: new Date('2025-12-31'),
          minPeople: 3,
          maxPeople: 10
        },
        images: [
          'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
          'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200'
        ],
        features: {
          hotelStars: 4,
          includesFlights: true,
          includesTransfers: true,
          wifi: true,
          allInclusive: true,
          kidsClub: true,
          spa: false,
          pool: true,
          privateBeach: true,
          gym: false,
          golf: false,
          snorkelEquipment: false,
          roomType: 'standard',
          amenities: ['pool', 'wifi', 'restaurant', 'bar', 'kids-club', 'beach', 'family-activities']
        },
        featured: true,
        tags: ['familia', 'playa', 'todo-incluido', 'niños'],
        status: 'active',
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        supplier: suppliers[2]._id,
        name: 'Holbox Eco Paradise - 4 Días 3 Noches',
        description: 'Escapada ecológica a la paradisíaca isla de Holbox. Desconexión total, naturaleza virgen y experiencias únicas.',
        destination: {
          city: 'Holbox',
          cityNormalized: normalizeText('Holbox'),
          state: 'Quintana Roo',
          country: 'México',
          countryNormalized: normalizeText('México')
        },
        duration: {
          days: 4,
          nights: 3
        },
        category: 'eco',
        included: [
          'Transporte desde Cancún',
          'Ferry a Holbox',
          'Hotel boutique ecológico',
          'Bicicleta durante toda la estancia',
          'Tour de bioluminiscencia',
          'Kayak en manglares',
          'Avistamiento de flamencos',
          'Seguro de viaje'
        ],
        notIncluded: [
          'Vuelos',
          'Comidas',
          'Propinas'
        ],
        itinerary: [
          { day: 1, title: 'Llegada a Holbox', description: 'Traslado y check-in. Recorrido en bici por la isla.' },
          { day: 2, title: 'Manglares y flamencos', description: 'Tour en kayak y avistamiento de aves.' },
          { day: 3, title: 'Bioluminiscencia', description: 'Tour nocturno para ver el mar brillante.' },
          { day: 4, title: 'Regreso', description: 'Ferry y traslado a Cancún.' }
        ],
        pricing: {
          costPerPerson: {
            double: 325,
            single: 450
          },
          sellingPricePerPerson: {
            double: 455,
            single: 630
          },
          currency: 'USD',
          markup: 40
        },
        availability: {
          startDate: new Date('2024-12-01'),
          endDate: new Date('2025-12-31'),
          minPeople: 2,
          maxPeople: 6
        },
        images: [
          'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
          'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200'
        ],
        features: {
          hotelStars: 3,
          includesFlights: false,
          includesTransfers: true,
          wifi: false,
          allInclusive: false,
          kidsClub: false,
          spa: false,
          pool: false,
          privateBeach: true,
          gym: false,
          golf: false,
          snorkelEquipment: true,
          roomType: 'bungalow',
          amenities: ['beach', 'eco-tours', 'kayak', 'bike', 'nature']
        },
        featured: false,
        tags: ['ecológico', 'naturaleza', 'playa', 'aventura'],
        status: 'active',
        createdBy: adminId,
        updatedBy: adminId
      }
    ]

    const createdPackages = await Package.insertMany(packages)
    console.log(`✅ ${createdPackages.length} paquetes creados`)

    console.log('\n🎉 ¡SEED COMPLETADO EXITOSAMENTE!')
    console.log(`\n📊 RESUMEN:`)
    console.log(`   ✈️  ${createdFlights.length} vuelos`)
    console.log(`   🏨 ${createdHotels.length} hoteles`)
    console.log(`   📦 ${createdPackages.length} paquetes`)
    console.log(`   🏢 ${suppliers.length} proveedores`)
    console.log(`\n💡 Ahora puedes ver el inventario en tu aplicación`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error en seed:', error)
    process.exit(1)
  }
}

seedInventory()
