import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const resolvedParams = await params
    
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { success: false, error: 'ID de reserva inválido' },
        { status: 400 }
      )
    }
    
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Error de conexión a la base de datos' },
        { status: 500 }
      )
    }
    
    const booking = await db
      .collection('bookings')
      .findOne({ _id: new mongoose.Types.ObjectId(resolvedParams.id) })
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: booking
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener la reserva' },
      { status: 500 }
    )
  }
}
