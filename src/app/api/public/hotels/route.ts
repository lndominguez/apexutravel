import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { Hotel } from '@/models'

// GET /api/public/hotels - API pública para búsqueda de hoteles (sin autenticación)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const city = searchParams.get('city') || ''
    const status = searchParams.get('status') || 'active'
    const category = searchParams.get('category') || ''

    const filters: any = { status }

    // Filtrar por ciudad si se proporciona
    if (city) {
      filters.$or = [
        { 'location.city': { $regex: city, $options: 'i' } },
        { name: { $regex: city, $options: 'i' } }
      ]
    }

    // Filtrar por categoría si se proporciona
    if (category) {
      filters.category = category
    }

    const hotels = await Hotel.find(filters)
      .sort({ rating: -1 })
      .limit(limit)
      .select('-createdBy -updatedBy -__v')
      .lean()

    return NextResponse.json({
      success: true,
      hotels,
      total: hotels.length
    })

  } catch (error: any) {
    console.error('Error en /api/public/hotels:', error)
    return NextResponse.json(
      { success: false, error: 'Error al buscar hoteles' },
      { status: 500 }
    )
  }
}
