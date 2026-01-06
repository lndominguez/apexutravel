import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Flight from '@/models/Flight'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    // En Next.js 14+, params es una Promise
    const { id } = await params
    
    console.log('🔍 Buscando vuelo con ID:', id)
    
    const flight = await Flight.findById(id)
      .populate('aircraftType')
      .populate('supplier', 'name type')
    
    if (!flight) {
      console.log('❌ Vuelo no encontrado con ID:', id)
      return NextResponse.json(
        { success: false, error: 'Vuelo no encontrado' },
        { status: 404 }
      )
    }
    
    console.log('✅ Vuelo encontrado:', flight.flightNumber)
    
    return NextResponse.json({
      success: true,
      flight
    })
  } catch (error) {
    console.error('❌ Error obteniendo vuelo:', error)
    return NextResponse.json(
      { success: false, error: 'Error obteniendo vuelo' },
      { status: 500 }
    )
  }
}
