import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { Package } from '@/models'

// GET /api/search/destinations - Buscar destinos únicos de paquetes
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        destinations: []
      })
    }

    // Normalizar búsqueda
    const normalizedQuery = query
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    // Buscar paquetes que coincidan con ciudad O país
    const packages = await Package.find({
      status: 'active',
      $or: [
        { 'destination.cityNormalized': { $regex: normalizedQuery, $options: 'i' } },
        { 'destination.city': { $regex: query, $options: 'i' } },
        { 'destination.country': { $regex: query, $options: 'i' } }
      ]
    })
      .select('destination')
      .lean()

    // Extraer destinos únicos y agrupar por país
    const uniqueDestinations = new Map<string, any>()
    const countriesMap = new Map<string, any[]>()
    
    packages.forEach((pkg: any) => {
      if (pkg.destination && pkg.destination.city) {
        const key = pkg.destination.city.toLowerCase()
        if (!uniqueDestinations.has(key)) {
          const destination = {
            city: pkg.destination.city,
            state: pkg.destination.state || '',
            country: pkg.destination.country || 'México',
            value: pkg.destination.city,
            label: `${pkg.destination.city}, ${pkg.destination.state || pkg.destination.country}`
          }
          uniqueDestinations.set(key, destination)
          
          // Agrupar por país
          const country = destination.country
          if (!countriesMap.has(country)) {
            countriesMap.set(country, [])
          }
          countriesMap.get(country)!.push(destination)
        }
      }
    })

    // Ordenar destinos: primero por país, luego por ciudad
    const destinations: any[] = []
    Array.from(countriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([country, cities]) => {
        destinations.push(...cities.sort((a, b) => a.city.localeCompare(b.city)))
      })

    return NextResponse.json({
      success: true,
      destinations
    })

  } catch (error: any) {
    console.error('Error en /api/search/destinations:', error)
    return NextResponse.json(
      { success: false, error: 'Error al buscar destinos' },
      { status: 500 }
    )
  }
}
