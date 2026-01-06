import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { Package } from '@/models'

// Deshabilitar caché de Next.js para esta ruta
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/public/packages - API pública para búsqueda de paquetes (sin autenticación)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const destination = searchParams.get('destination') || ''
    const status = searchParams.get('status') || 'active'
    const category = searchParams.get('category') || ''
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined
    const hotelStars = searchParams.get('hotelStars') ? searchParams.get('hotelStars')!.split(',').map(Number) : undefined
    const includesFlights = searchParams.get('includesFlights') === 'true' ? true : undefined
    const wifi = searchParams.get('wifi') === 'true' ? true : undefined
    const duration = searchParams.get('duration') || ''

    // Construir filtros usando $and para combinar correctamente todos los criterios
    const andConditions: any[] = [{ status }]

    // Filtrar por destino si se proporciona (ciudad O país)
    if (destination) {
      // Si el destino viene con código IATA (ej: "CUN Cancún"), extraer solo el nombre
      // Formato esperado: "XXX Ciudad" donde XXX son 3 letras mayúsculas
      let cleanDestination = destination
      const iataPattern = /^[A-Z]{3}\s+(.+)$/
      const match = destination.match(iataPattern)
      if (match) {
        cleanDestination = match[1] // Extraer solo el nombre sin el código IATA
      }
      
      // Normalizar el término de búsqueda (remover acentos)
      const normalizedDestination = cleanDestination
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
      
      // Buscar tanto con tildes como sin tildes - usar $or dentro de $and
      andConditions.push({
        $or: [
          { 'destination.cityNormalized': { $regex: normalizedDestination, $options: 'i' } },
          { 'destination.city': { $regex: cleanDestination, $options: 'i' } },
          { 'destination.city': { $regex: normalizedDestination, $options: 'i' } },
          { 'destination.countryNormalized': { $regex: normalizedDestination, $options: 'i' } },
          { 'destination.country': { $regex: cleanDestination, $options: 'i' } },
          { 'destination.country': { $regex: normalizedDestination, $options: 'i' } },
          { name: { $regex: cleanDestination, $options: 'i' } },
          { name: { $regex: normalizedDestination, $options: 'i' } }
        ]
      })
    }

    // Filtrar por categoría si se proporciona
    if (category) {
      andConditions.push({ category })
    }

    // Filtrar por rango de precios
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {}
      if (minPrice !== undefined) {
        priceFilter.$gte = minPrice
      }
      if (maxPrice !== undefined) {
        priceFilter.$lte = maxPrice
      }
      andConditions.push({ 'pricing.sellingPricePerPerson.double': priceFilter })
    }

    // Filtrar por estrellas del hotel
    if (hotelStars && hotelStars.length > 0) {
      andConditions.push({ 'features.hotelStars': { $in: hotelStars } })
    }

    // Filtrar por incluye vuelos
    if (includesFlights !== undefined) {
      andConditions.push({ 'features.includesFlights': includesFlights })
    }

    // Filtrar por WiFi
    if (wifi !== undefined) {
      andConditions.push({ 'features.wifi': wifi })
    }

    // Filtrar por duración
    if (duration) {
      if (duration === '3-4') {
        andConditions.push({ 'duration.days': { $gte: 3, $lte: 4 } })
      } else if (duration === '5-7') {
        andConditions.push({ 'duration.days': { $gte: 5, $lte: 7 } })
      } else if (duration === '8+') {
        andConditions.push({ 'duration.days': { $gte: 8 } })
      }
    }

    // Construir el filtro final con $and
    const filters = andConditions.length > 1 ? { $and: andConditions } : andConditions[0]

    const packages = await Package.find(filters)
      .sort({ featured: -1, 'pricing.sellingPrice': 1 })
      .limit(limit)
      .select('-createdBy -updatedBy -__v')
      .lean()

    return NextResponse.json({
      success: true,
      packages,
      total: packages.length
    })

  } catch (error: any) {
    console.error('Error en /api/public/packages:', error)
    return NextResponse.json(
      { success: false, error: 'Error al buscar paquetes' },
      { status: 500 }
    )
  }
}
