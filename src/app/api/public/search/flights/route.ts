import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import '@/models/Inventory'
import '@/models/Flight'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/public/search/flights - Búsqueda pública de ofertas de vuelos
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const origin = searchParams.get('origin') || ''
    const destination = searchParams.get('destination') || ''
    const status = searchParams.get('status') || 'published'
    
    const andConditions: any[] = [{ type: 'flight' }, { status }]
    
    if (origin) {
      andConditions.push({ 'items.flightDetails.route.from': { $regex: origin, $options: 'i' } })
    }
    if (destination) {
      andConditions.push({ 'items.flightDetails.route.to': { $regex: destination, $options: 'i' } })
    }
    
    const filters = andConditions.length > 1 ? { $and: andConditions } : andConditions[0]
    
    const flights = await Offer.find(filters)
      .populate('items.inventoryId', 'inventoryName resource pricing')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-createdBy -updatedBy -__v')
      .lean()
    
    return NextResponse.json({ 
      success: true, 
      flights: flights || [], 
      total: flights?.length || 0 
    })
  } catch (error: any) {
    console.error('Error en /api/public/search/flights:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al buscar vuelos',
      flights: []
    }, { status: 500 })
  }
}
