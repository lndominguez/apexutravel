import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { Booking } from '@/models/Booking'
import { sendBookingConfirmationClient, sendBookingNotificationAdmin } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const {
      type,
      itemId,
      passengers,
      contactInfo,
      pricing,
      startDate,
      endDate,
      roomIndex,
      occupancy,
      paymentMethod,
      details
    } = body
    
    // Usar información que viene del frontend
    const itemName = body.itemName || (type === 'hotel' ? 'Hotel' : type === 'package' ? 'Paquete' : 'Vuelo')
    
    // Preparar detalles específicos según el tipo
    let bookingDetails: any = {}
    
    if (type === 'hotel') {
      bookingDetails = {
        hotel: {
          roomIndex: roomIndex || 0,
          roomName: body.roomName || 'Habitación',
          occupancy: occupancy || 'double',
          checkIn: startDate ? new Date(startDate) : new Date(),
          checkOut: endDate ? new Date(endDate) : new Date(),
          nights: endDate && startDate 
            ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
            : 1
        }
      }
    } else if (type === 'package') {
      bookingDetails = {
        package: {
          destination: body.destination || 'Destino',
          startDate: startDate ? new Date(startDate) : new Date(),
          duration: body.duration || { days: 5, nights: 4 }
        }
      }
    }
    
    // Generar número de reserva único
    const prefix = type === 'package' ? 'PKG' : type === 'hotel' ? 'HTL' : 'FLT'
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const bookingNumber = `${prefix}-${timestamp}-${random}`
    
    // Crear la reserva
    const booking = new Booking({
      bookingNumber,
      type,
      itemId,
      itemType: type,
      itemName,
      passengers,
      contactInfo,
      details: bookingDetails,
      pricing: {
        adults: pricing.adults || 0,
        children: pricing.children || 0,
        infants: pricing.infants || 0,
        subtotal: pricing.total || 0,
        total: pricing.total || 0,
        currency: 'USD'
      },
      paymentMethod: paymentMethod || 'pending',
      paymentStatus: 'pending',
      status: 'pending'
    })
    
    await booking.save()
    
    // Preparar datos para los emails
    const emailDetails: any = {}
    
    if (type === 'hotel') {
      emailDetails.checkIn = new Date(startDate).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
      emailDetails.checkOut = new Date(endDate).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
      emailDetails.nights = bookingDetails.hotel?.nights
      emailDetails.roomName = bookingDetails.hotel?.roomName
      emailDetails.occupancy = occupancy === 'single' ? 'Simple' : 
                               occupancy === 'double' ? 'Doble' : 
                               occupancy === 'triple' ? 'Triple' : 'Cuádruple'
    } else if (type === 'package') {
      emailDetails.destination = bookingDetails.package?.destination
      emailDetails.startDate = new Date(startDate).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    }
    
    // Enviar email de confirmación al cliente
    try {
      await sendBookingConfirmationClient({
        customerEmail: contactInfo.email,
        customerName: passengers[0]?.fullName || 'Cliente',
        bookingNumber: booking.bookingNumber,
        itemName,
        itemType: type,
        totalPrice: pricing.total,
        currency: 'USD',
        passengers: passengers.map((p: any) => ({
          fullName: p.fullName,
          type: p.type
        })),
        details: emailDetails
      })
    } catch (emailError) {
      console.error('Error enviando email al cliente:', emailError)
      // No fallar la reserva si el email falla
    }
    
    // Enviar email de notificación al administrador
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'sales@apexucode.com'
      
      await sendBookingNotificationAdmin({
        adminEmail,
        customerName: passengers[0]?.fullName || 'Cliente',
        customerEmail: contactInfo.email,
        customerPhone: contactInfo.phone,
        bookingNumber: booking.bookingNumber,
        itemName,
        itemType: type,
        totalPrice: pricing.total,
        currency: 'USD',
        passengers: passengers.map((p: any) => ({
          fullName: p.fullName,
          type: p.type,
          passport: p.passport
        })),
        details: emailDetails,
        bookingId: booking._id.toString()
      })
    } catch (emailError) {
      console.error('Error enviando email al admin:', emailError)
      // No fallar la reserva si el email falla
    }
    
    return NextResponse.json({
      success: true,
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      message: 'Reserva creada exitosamente'
    })
    
  } catch (error) {
    console.error('Error creando reserva:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}
