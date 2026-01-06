import dotenv from 'dotenv'
import { resolve } from 'path'
import mongoose from 'mongoose'
import AircraftType from '../src/models/AircraftType'

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

// Función de conexión
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

// Función para generar array de filas
function generateRows(start: number, end: number): number[] {
  const rows = []
  for (let i = start; i <= end; i++) {
    rows.push(i)
  }
  return rows
}

async function seedAircraftTypes() {
  try {
    await connectDB()

    console.log('🗑️  Limpiando colección de aircraft_types...')
    await AircraftType.deleteMany({})

    console.log('✈️  Creando tipos de avión...')

    const aircraftTypes = [
      // Boeing 737-800 - Avión de pasillo único más común
      {
        aircraftModel: 'Boeing 737-800',
        manufacturer: 'Boeing',
        iataCode: '738',
        icaoCode: 'B738',
        totalSeats: 189,
        range: 5765,
        cruiseSpeed: 842,
        cabinConfiguration: [
          {
            class: 'business',
            rows: generateRows(1, 4),
            columns: ['A', 'B', 'E', 'F'],
            layout: '2-2',
            totalSeats: 16,
            seatPitch: 38,
            seatWidth: 21,
            features: ['extra legroom', 'power outlet', 'priority boarding']
          },
          {
            class: 'economy',
            rows: generateRows(5, 33),
            columns: ['A', 'B', 'C', 'D', 'E', 'F'],
            layout: '3-3',
            totalSeats: 173,
            seatPitch: 31,
            seatWidth: 17,
            features: ['standard']
          }
        ]
      },

      // Airbus A320 - Competidor directo del 737
      {
        aircraftModel: 'Airbus A320-200',
        manufacturer: 'Airbus',
        iataCode: '320',
        icaoCode: 'A320',
        totalSeats: 180,
        range: 6150,
        cruiseSpeed: 840,
        cabinConfiguration: [
          {
            class: 'business',
            rows: generateRows(1, 4),
            columns: ['A', 'C', 'D', 'F'],
            layout: '2-2',
            totalSeats: 16,
            seatPitch: 38,
            seatWidth: 21,
            features: ['extra legroom', 'power outlet']
          },
          {
            class: 'economy',
            rows: generateRows(5, 32),
            columns: ['A', 'B', 'C', 'D', 'E', 'F'],
            layout: '3-3',
            totalSeats: 164,
            seatPitch: 30,
            seatWidth: 18,
            features: ['standard']
          }
        ]
      },

      // Airbus A350-900 - Avión de largo alcance moderno
      {
        aircraftModel: 'Airbus A350-900',
        manufacturer: 'Airbus',
        iataCode: '359',
        icaoCode: 'A359',
        totalSeats: 325,
        range: 15000,
        cruiseSpeed: 903,
        cabinConfiguration: [
          {
            class: 'business',
            rows: generateRows(1, 8),
            columns: ['A', 'D', 'G', 'K'],
            layout: '1-2-1',
            totalSeats: 32,
            seatPitch: 78,
            seatWidth: 22,
            features: ['lie-flat', 'direct aisle access', 'power outlet', 'entertainment system']
          },
          {
            class: 'premium economy',
            rows: generateRows(15, 22),
            columns: ['A', 'B', 'D', 'E', 'G', 'H'],
            layout: '2-4-2',
            totalSeats: 64,
            seatPitch: 38,
            seatWidth: 19,
            features: ['extra legroom', 'power outlet', 'enhanced meal']
          },
          {
            class: 'economy',
            rows: generateRows(30, 59),
            columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'],
            layout: '3-3-3',
            totalSeats: 229,
            seatPitch: 32,
            seatWidth: 18,
            features: ['standard', 'entertainment system']
          }
        ]
      },

      // Boeing 787-9 Dreamliner - Avión de largo alcance
      {
        aircraftModel: 'Boeing 787-9 Dreamliner',
        manufacturer: 'Boeing',
        iataCode: '789',
        icaoCode: 'B789',
        totalSeats: 290,
        range: 14140,
        cruiseSpeed: 903,
        cabinConfiguration: [
          {
            class: 'first',
            rows: generateRows(1, 2),
            columns: ['A', 'K'],
            layout: '1-1',
            totalSeats: 4,
            seatPitch: 82,
            seatWidth: 24,
            features: ['private suite', 'lie-flat', 'direct aisle access', 'premium dining']
          },
          {
            class: 'business',
            rows: generateRows(3, 8),
            columns: ['A', 'D', 'G', 'K'],
            layout: '1-2-1',
            totalSeats: 24,
            seatPitch: 76,
            seatWidth: 22,
            features: ['lie-flat', 'direct aisle access', 'power outlet']
          },
          {
            class: 'premium economy',
            rows: generateRows(15, 18),
            columns: ['A', 'B', 'D', 'E', 'G', 'H'],
            layout: '2-3-2',
            totalSeats: 28,
            seatPitch: 38,
            seatWidth: 19,
            features: ['extra legroom', 'power outlet']
          },
          {
            class: 'economy',
            rows: generateRows(25, 50),
            columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'],
            layout: '3-3-3',
            totalSeats: 234,
            seatPitch: 32,
            seatWidth: 17,
            features: ['standard']
          }
        ]
      },

      // Embraer E190 - Avión regional
      {
        aircraftModel: 'Embraer E190',
        manufacturer: 'Embraer',
        iataCode: 'E90',
        icaoCode: 'E190',
        totalSeats: 100,
        range: 4537,
        cruiseSpeed: 829,
        cabinConfiguration: [
          {
            class: 'economy',
            rows: generateRows(1, 25),
            columns: ['A', 'B', 'C', 'D'],
            layout: '2-2',
            totalSeats: 100,
            seatPitch: 31,
            seatWidth: 18,
            features: ['standard']
          }
        ]
      },

      // Boeing 777-300ER - Avión de largo alcance grande
      {
        aircraftModel: 'Boeing 777-300ER',
        manufacturer: 'Boeing',
        iataCode: '77W',
        icaoCode: 'B77W',
        totalSeats: 396,
        range: 13649,
        cruiseSpeed: 905,
        cabinConfiguration: [
          {
            class: 'first',
            rows: generateRows(1, 2),
            columns: ['A', 'K'],
            layout: '1-1',
            totalSeats: 4,
            seatPitch: 82,
            seatWidth: 24,
            features: ['private suite', 'lie-flat', 'premium dining']
          },
          {
            class: 'business',
            rows: generateRows(3, 10),
            columns: ['A', 'D', 'G', 'K'],
            layout: '1-2-1',
            totalSeats: 32,
            seatPitch: 78,
            seatWidth: 22,
            features: ['lie-flat', 'direct aisle access']
          },
          {
            class: 'premium economy',
            rows: generateRows(16, 20),
            columns: ['A', 'B', 'D', 'E', 'G', 'H'],
            layout: '2-4-2',
            totalSeats: 40,
            seatPitch: 38,
            seatWidth: 19,
            features: ['extra legroom', 'power outlet']
          },
          {
            class: 'economy',
            rows: generateRows(30, 59),
            columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'],
            layout: '3-4-3',
            totalSeats: 320,
            seatPitch: 31,
            seatWidth: 17,
            features: ['standard']
          }
        ]
      },

      // Airbus A321neo - Avión de pasillo único largo
      {
        aircraftModel: 'Airbus A321neo',
        manufacturer: 'Airbus',
        iataCode: '32Q',
        icaoCode: 'A21N',
        totalSeats: 220,
        range: 7400,
        cruiseSpeed: 840,
        cabinConfiguration: [
          {
            class: 'business',
            rows: generateRows(1, 5),
            columns: ['A', 'C', 'D', 'F'],
            layout: '2-2',
            totalSeats: 20,
            seatPitch: 38,
            seatWidth: 21,
            features: ['extra legroom', 'power outlet']
          },
          {
            class: 'economy',
            rows: generateRows(6, 40),
            columns: ['A', 'B', 'C', 'D', 'E', 'F'],
            layout: '3-3',
            totalSeats: 200,
            seatPitch: 30,
            seatWidth: 18,
            features: ['standard']
          }
        ]
      }
    ]

    const createdAircraft = await AircraftType.insertMany(aircraftTypes)
    
    console.log(`✅ ${createdAircraft.length} tipos de avión creados exitosamente:`)
    createdAircraft.forEach(aircraft => {
      console.log(`   - ${aircraft.aircraftModel} (${aircraft.totalSeats} asientos)`)
    })

    console.log('\n🎉 Seed de aircraft types completado!')
    
  } catch (error) {
    console.error('❌ Error en seed:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('👋 Conexión cerrada')
  }
}

// Ejecutar seed
seedAircraftTypes()
