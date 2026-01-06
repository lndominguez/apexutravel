import { NextRequest, NextResponse } from 'next/server'
import { searchAirports } from '@/lib/airports-data'

type AllowedType = 'origin' | 'destination' | 'all'

const CATEGORY_MAP: Record<AllowedType, string> = {
  origin: 'Aeropuerto · Origen',
  destination: 'Aeropuerto · Destino',
  all: 'Aeropuerto'
}

const LOCATION_TYPE_MAP: Record<AllowedType, 'flight-origin' | 'flight-destination' | 'airport'> = {
  origin: 'flight-origin',
  destination: 'flight-destination',
  all: 'airport'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const typeParam = (searchParams.get('type') || 'all') as AllowedType
    const type: AllowedType = ['origin', 'destination', 'all'].includes(typeParam) ? typeParam : 'all'

    if (q.length < 1) {
      return NextResponse.json({ success: true, locations: [] })
    }

    const airports = searchAirports(q, 25)
    const locations = airports.map((airport, idx) => ({
      type: LOCATION_TYPE_MAP[type],
      city: airport.city,
      country: airport.country,
      state: airport.state,
      airport: airport.name,
      iata: airport.iata,
      airportName: airport.name,
      label: `${airport.city} (${airport.iata})`,
      subtitle: airport.name,
      value: airport.iata,
      category: CATEGORY_MAP[type],
      priority: idx + 1,
      level: 'airport' as const
    }))

    return NextResponse.json({
      success: true,
      locations
    })
  } catch (error) {
    console.error('Error en /api/search/locations:', error)
    return NextResponse.json(
      { success: false, error: 'No se pudieron obtener ubicaciones' },
      { status: 500 }
    )
  }
}
