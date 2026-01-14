import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/public/checkout - Crear booking (confirmación/pago/creación)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { type, itemId, passengers, contactInfo, pricing, startDate, paymentMethod, status } = body
    
    if (!type || !itemId || !passengers || !contactInfo || !pricing) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }
    
    const booking = {
      type,
      itemId: new mongoose.Types.ObjectId(itemId),
      passengers,
      contactInfo,
      pricing,
      startDate: startDate ? new Date(startDate) : null,
      paymentMethod: paymentMethod || 'pending',
      paymentStatus: 'pending',
      bookingStatus: status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      bookingNumber: `BK${Date.now()}`,
      notes: 'Reserva creada - Pendiente de confirmación por agente'
    }
    
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Error de conexión a la base de datos' },
        { status: 500 }
      )
    }
    
    const result = await db.collection('bookings').insertOne(booking)
    
    return NextResponse.json({
      success: true,
      bookingId: result.insertedId.toString(),
      bookingNumber: booking.bookingNumber,
      message: 'Reserva creada exitosamente'
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear la reserva' },
      { status: 500 }
    )
  }
}
