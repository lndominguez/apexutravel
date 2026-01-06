/**
 * Script de migración para actualizar vuelos existentes con estructura de pricing diferenciado
 * 
 * Este script:
 * 1. Lee todos los vuelos existentes
 * 2. Para cada clase de vuelo, crea la estructura pricing con:
 *    - adult: precio actual (sellingPrice)
 *    - child: 75% del precio adulto
 *    - infant: 10% del precio adulto
 * 3. Mantiene sellingPrice por compatibilidad
 */

import mongoose from 'mongoose'
import Flight from '../src/models/Flight'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-agency'

async function migrateFlightPricing() {
  try {
    console.log('🔌 Conectando a MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Conectado a MongoDB')

    console.log('\n📋 Buscando vuelos sin estructura de pricing...')
    const flights = await Flight.find({
      'classes.pricing': { $exists: false }
    })

    console.log(`📊 Encontrados ${flights.length} vuelos para migrar\n`)

    let migratedCount = 0
    let errorCount = 0

    for (const flight of flights) {
      try {
        let updated = false

        for (const classItem of flight.classes) {
          // Solo migrar si no tiene pricing
          if (!classItem.pricing) {
            const adultPrice = classItem.sellingPrice
            const currency = classItem.sellingCurrency || 'USD'

            // Calcular precios diferenciados
            // Niños: 75% del precio adulto
            // Bebés: 10% del precio adulto (generalmente solo pagan tasas)
            classItem.pricing = {
              adult: {
                sellingPrice: adultPrice,
                sellingCurrency: currency
              },
              child: {
                sellingPrice: Math.round(adultPrice * 0.75),
                sellingCurrency: currency
              },
              infant: {
                sellingPrice: Math.round(adultPrice * 0.10),
                sellingCurrency: currency
              }
            }

            updated = true
          }
        }

        if (updated) {
          await flight.save()
          migratedCount++
          console.log(`✅ Migrado: ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport})`)
        }
      } catch (error) {
        errorCount++
        console.error(`❌ Error migrando vuelo ${flight.flightNumber}:`, error)
      }
    }

    console.log('\n📊 Resumen de migración:')
    console.log(`   ✅ Vuelos migrados: ${migratedCount}`)
    console.log(`   ❌ Errores: ${errorCount}`)
    console.log(`   📝 Total procesados: ${flights.length}`)

    // Verificar migración
    console.log('\n🔍 Verificando migración...')
    const remainingFlights = await Flight.countDocuments({
      'classes.pricing': { $exists: false }
    })
    console.log(`   Vuelos sin pricing: ${remainingFlights}`)

    if (remainingFlights === 0) {
      console.log('\n🎉 ¡Migración completada exitosamente!')
    } else {
      console.log('\n⚠️  Aún hay vuelos sin migrar. Revisa los errores.')
    }

  } catch (error) {
    console.error('❌ Error en migración:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Desconectado de MongoDB')
  }
}

// Ejecutar migración
migrateFlightPricing()
  .then(() => {
    console.log('\n✨ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })
