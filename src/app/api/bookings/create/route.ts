import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { type, itemId, passengers, contactInfo, pricing, startDate, paymentMethod, status } = body
    
    // Validar datos requeridos
    if (!type || !itemId || !passengers || !contactInfo || !pricing) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }
    
    // Crear la reserva
    const booking = {
      type, // 'package' | 'flight' | 'hotel'
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
      bookingNumber: `BK${Date.now()}`, // Número de reserva único
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
    
    // TODO: Enviar email de confirmación al cliente
    // TODO: Notificar a los agentes sobre la nueva reserva
    
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
