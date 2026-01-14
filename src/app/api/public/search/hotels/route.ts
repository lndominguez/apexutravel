import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import '@/models/Inventory'
import '@/models/Hotel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/public/search/hotels - Búsqueda pública de ofertas de hoteles
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const city = searchParams.get('city') || ''
    const status = searchParams.get('status') || 'published'
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined

    const andConditions: any[] = [
      { type: 'hotel' },
      { status }
    ]

    if (city) {
      andConditions.push({
        $or: [
          { 'items.hotelInfo.location.city': { $regex: city, $options: 'i' } },
          { 'items.hotelInfo.location.country': { $regex: city, $options: 'i' } },
          { name: { $regex: city, $options: 'i' } }
        ]
      })
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {}
      if (minPrice !== undefined) priceFilter.$gte = minPrice
      if (maxPrice !== undefined) priceFilter.$lte = maxPrice
      andConditions.push({ 'pricing.finalPrice': priceFilter })
    }

    const filters = andConditions.length > 1 ? { $and: andConditions } : andConditions[0]

    const hotels = await Offer.find(filters)
      .populate('items.inventoryId', 'inventoryName resource pricing')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-createdBy -updatedBy -__v')
      .lean()

    return NextResponse.json({
      success: true,
      hotels: hotels || [],
      total: hotels?.length || 0
    })

  } catch (error: any) {
    console.error('Error en /api/public/search/hotels:', error)
    return NextResponse.json(
      { success: false, error: 'Error al buscar hoteles', hotels: [] },
      { status: 500 }
    )
  }
}
