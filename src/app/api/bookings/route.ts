import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { Booking } from '@/models/Booking'

export async function GET(request: NextRequest) {
  try {
    // TODO: Agregar autenticación
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    
    const query: any = {}
    
    if (status) query.status = status
    if (type) query.type = type
    
    const skip = (page - 1) * limit
    
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Booking.countDocuments(query)
    ])
    
    return NextResponse.json({
      success: true,
      bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error obteniendo bookings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}
