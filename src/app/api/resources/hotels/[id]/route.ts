import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Hotel from '@/models/Hotel'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    
    const hotel = await Hotel.findById(id)
      .select('name photos roomTypes amenities location stars policies')
      .lean()
    
    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: hotel
    })
  } catch (error: any) {
    console.error('Error fetching hotel resource:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener hotel' },
      { status: 500 }
    )
  }
}
