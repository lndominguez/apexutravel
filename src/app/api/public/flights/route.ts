import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import mongoose from 'mongoose'
import { Flight } from '@/models'
// Importar AircraftType para asegurar que el modelo esté registrado
import '@/models/AircraftType'

// Función para normalizar texto (remover acentos y convertir a minúsculas)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remueve acentos
    .trim()
}

// GET /api/public/flights - API pública para búsqueda de vuelos (sin autenticación)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const origin = searchParams.get('origin') || ''
    const destination = searchParams.get('destination') || ''
    const status = searchParams.get('status') || 'available'
    const departureDate = searchParams.get('departureDate') || ''
    const returnDate = searchParams.get('returnDate') || ''

    console.log('🔍 Flight Search Params:', { origin, destination, departureDate, status })

    const filters: any = { status }

    // Filtrar por origen - PRIORIDAD: IATA > ciudad normalizada > ciudad
    if (origin) {
      const normalizedOrigin = normalizeText(origin)
      const isIATA = origin.length === 3 && origin === origin.toUpperCase()
      
      if (isIATA) {
        // Si es código IATA (3 letras mayúsculas), buscar solo por IATA
        filters['departure.airport'] = origin
        console.log('🔍 Searching by IATA origin:', origin)
      } else {
        // Si no es IATA, buscar por ciudad (normalizada y original) y por IATA
        filters.$or = [
          { 'departure.cityNormalized': { $regex: normalizedOrigin, $options: 'i' } },
          { 'departure.city': { $regex: origin, $options: 'i' } },
          { 'departure.airport': { $regex: origin, $options: 'i' } }
        ]
      }
    }

    // Filtrar por destino - PRIORIDAD: IATA > ciudad normalizada > ciudad
    if (destination) {
      const normalizedDestination = normalizeText(destination)
      const isIATA = destination.length === 3 && destination === destination.toUpperCase()
      
      if (isIATA) {
        // Si es código IATA, buscar solo por IATA
        filters['arrival.airport'] = destination
        console.log('🔍 Searching by IATA destination:', destination)
      } else {
        // Si no es IATA, buscar por ciudad
        if (filters.$or) {
          // Si ya hay filtro de origen, combinar con AND
          filters.$and = [
            { $or: filters.$or },
            {
              $or: [
                { 'arrival.cityNormalized': { $regex: normalizedDestination, $options: 'i' } },
                { 'arrival.city': { $regex: destination, $options: 'i' } },
                { 'arrival.airport': { $regex: destination, $options: 'i' } }
              ]
            }
          ]
          delete filters.$or
        } else {
          filters.$or = [
            { 'arrival.cityNormalized': { $regex: normalizedDestination, $options: 'i' } },
            { 'arrival.city': { $regex: destination, $options: 'i' } },
            { 'arrival.airport': { $regex: destination, $options: 'i' } }
          ]
        }
      }
    }

    // Filtrar por fecha de salida si se proporciona
    if (departureDate) {
      // Usar UTC para evitar problemas de zona horaria
      const startOfDay = new Date(departureDate + 'T00:00:00.000Z')
      const endOfDay = new Date(departureDate + 'T23:59:59.999Z')
      
      console.log('🔍 Date Range:', {
        input: departureDate,
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      })
      
      filters['departure.dateTime'] = {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }

    console.log('🔍 MongoDB Filters:', JSON.stringify(filters, null, 2))

    const flights = await Flight.find(filters)
      .populate('aircraftType', 'aircraftModel manufacturer cabinConfiguration') // Popular aircraft type
      .sort({ 'departure.dateTime': 1 })
      .limit(limit)
      .select('-createdBy -updatedBy -__v')
      .lean()

    console.log(`✅ Found ${flights.length} flights`)

    return NextResponse.json({
      success: true,
      flights,
      total: flights.length
    })

  } catch (error: any) {
    console.error('Error en /api/public/flights:', error)
    return NextResponse.json(
      { success: false, error: 'Error al buscar vuelos' },
      { status: 500 }
    )
  }
}
