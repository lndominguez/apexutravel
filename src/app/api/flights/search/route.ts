import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Flight from '@/models/Flight'
import '@/models/AircraftType' // Import to register the model

export async function GET(request: NextRequest) {
  console.log('\n=== FLIGHT SEARCH API CALLED ===')
  console.log('Request URL:', request.url)
  
  try {
    console.log('Connecting to database...')
    await connectDB()
    console.log('✅ Database connected')

    const { searchParams } = new URL(request.url)
    const originParam = searchParams.get('origin')
    const destinationParam = searchParams.get('destination')
    const departureDate = searchParams.get('departureDate')
    
    // Tipos de pasajeros (nuevo)
    const adults = parseInt(searchParams.get('adults') || searchParams.get('passengers') || '1')
    const children = parseInt(searchParams.get('children') || '0')
    const infants = parseInt(searchParams.get('infants') || '0')
    const totalPassengers = adults + children + infants
    
    const searchAlternatives = searchParams.get('searchAlternatives') === 'true'

    console.log('Flight search params:', { 
      origin: originParam, 
      destination: destinationParam, 
      departureDate, 
      adults,
      children,
      infants,
      totalPassengers,
      searchAlternatives 
    })

    if (!originParam || !destinationParam || !departureDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Extraer código IATA del formato "IATA ciudad" o usar el valor completo si es solo IATA
    const extractIATA = (value: string): string => {
      const parts = value.trim().split(' ')
      // Si el primer elemento tiene 3 caracteres y es mayúsculas, es el IATA
      if (parts[0].length === 3 && parts[0] === parts[0].toUpperCase()) {
        return parts[0]
      }
      // Si no, asumir que todo el valor es el IATA
      return value.trim()
    }

    const origin = extractIATA(originParam)
    const destination = extractIATA(destinationParam)

    // Parse the departure date - handle as UTC to avoid timezone issues
    const [year, month, day] = departureDate.split('-').map(Number)
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))

    console.log('Searching for flights:', {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      dateRange: { start: startOfDay.toISOString(), end: endOfDay.toISOString() }
    })

    // Search for flights
    const flights = await Flight.find({
      'departure.airport': origin.toUpperCase(),
      'arrival.airport': destination.toUpperCase(),
      'departure.dateTime': {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'available'
    })
      .populate('aircraftType')
      .lean()

    console.log(`Found ${flights.length} flights`)

    // Filter flights that have enough seats
    const availableFlights = flights.filter(flight => {
      const hasEnoughSeats = flight.classes?.some((flightClass: any) => 
        flightClass.availableSeats >= totalPassengers
      )
      return hasEnoughSeats
    })

    console.log(`${availableFlights.length} flights have enough seats for ${totalPassengers} passengers`)

    // Si no hay vuelos y se solicita búsqueda de alternativas, buscar en ±3 días
    let alternativeDates: any[] = []
    if (availableFlights.length === 0 && searchAlternatives) {
      console.log('No flights found, searching alternative dates (±3 days)...')
      console.log('Original search date:', departureDate)
      
      // Buscar en los próximos 3 días y 3 días anteriores
      const alternativeSearches = []
      for (let offset = -3; offset <= 3; offset++) {
        if (offset === 0) continue // Ya buscamos este día
        
        // Calcular fecha alternativa correctamente usando la fecha base
        const baseDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        const altDate = new Date(baseDate)
        altDate.setUTCDate(altDate.getUTCDate() + offset)
        
        const altEndOfDay = new Date(altDate)
        altEndOfDay.setUTCHours(23, 59, 59, 999)
        
        const altDateString = altDate.toISOString().split('T')[0]
        console.log(`Searching offset ${offset}: ${altDateString}`)
        
        // Capturar todas las variables en el closure
        alternativeSearches.push(
          (async (dateStr: string, off: number, startDate: Date, endDate: Date) => {
            const flights = await Flight.find({
              'departure.airport': origin.toUpperCase(),
              'arrival.airport': destination.toUpperCase(),
              'departure.dateTime': {
                $gte: startDate,
                $lte: endDate
              },
              status: 'available'
            })
              .populate('aircraftType')
              .lean()
            
            console.log(`  Offset ${off} (${dateStr}): Found ${flights.length} flights`)
            const available = flights.filter(flight => 
              flight.classes?.some((flightClass: any) => 
                flightClass.availableSeats >= totalPassengers
              )
            )
            console.log(`  Offset ${off}: ${available.length} flights with enough seats`)
            
            if (available.length > 0) {
              return {
                date: dateStr,
                offset: off,
                flightCount: available.length,
                flights: available
              }
            }
            return null
          })(altDateString, offset, altDate, altEndOfDay)
        )
      }
      
      const results = await Promise.all(alternativeSearches)
      alternativeDates = results.filter(r => r !== null)
      
      console.log(`Found ${alternativeDates.length} alternative dates with flights`)
    }

    return NextResponse.json({
      success: true,
      flights: availableFlights,
      total: availableFlights.length,
      alternativeDates: alternativeDates.length > 0 ? alternativeDates : undefined
    })

  } catch (error: any) {
    console.error('❌ Error searching flights:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search flights',
        details: error.message,
        errorType: error.name
      },
      { status: 500 }
    )
  }
}
