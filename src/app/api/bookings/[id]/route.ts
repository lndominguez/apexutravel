import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { Booking } from '@/models/Booking'
import { auth } from '@/lib/auth'
import { User } from '@/models'
import { notifyBookingConfirmed, notifyBookingCancelled, notifyPaymentReceived, notifyAdminBookingUpdate } from '@/lib/notifications'

// GET /api/bookings/[id] - Obtener detalle de una reserva
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    
    const booking = await Booking.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedAgent', 'firstName lastName email')
      .lean()
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      booking
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener la reserva' },
      { status: 500 }
    )
  }
}

// PATCH /api/bookings/[id] - Actualizar reserva (estado, pago, agente, notas)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const body = await request.json()
    
    const allowedUpdates = [
      'status',
      'paymentStatus',
      'paymentMethod',
      'paymentDate',
      'transactionId',
      'assignedAgent',
      'adminNotes',
      'invoiceNumber',
      'invoiceDate',
      'invoiceUrl'
    ]
    
    const updates: any = {}
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key]
      }
    }
    
    // Obtener reserva antes de actualizar para comparar estados
    const oldBooking = await Booking.findById(id)
    
    const booking = await Booking.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedAgent', 'firstName lastName email')
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }
    
    // Crear notificaciones según los cambios
    try {
      console.log('🔍 Iniciando creación de notificaciones...')
      console.log('👤 Usuario autenticado:', session.user?.email, '- ID:', session.user?.id)
      console.log(' Email de contacto:', booking.contactInfo.email)
      console.log('📊 Estado anterior:', oldBooking?.status, '→ Nuevo:', booking.status)
      console.log('💳 Pago anterior:', oldBooking?.paymentStatus, '→ Nuevo:', booking.paymentStatus)
      
      const changes: string[] = []
      if (oldBooking) {
        if (oldBooking.status !== booking.status) {
          changes.push(`Estado: ${oldBooking.status} → ${booking.status}`)
        }
        if (oldBooking.paymentStatus !== booking.paymentStatus) {
          changes.push(`Pago: ${oldBooking.paymentStatus} → ${booking.paymentStatus}`)
        }
        if ((oldBooking as any).invoiceNumber !== (booking as any).invoiceNumber) {
          changes.push(`Factura #: ${(booking as any).invoiceNumber || '—'}`)
        }
        if ((oldBooking as any).invoiceUrl !== (booking as any).invoiceUrl) {
          changes.push('Factura actualizada')
        }
        if ((oldBooking as any).assignedAgent?.toString?.() !== (booking as any).assignedAgent?.toString?.()) {
          changes.push('Agente asignado actualizado')
        }
      }

      const actionDescription = changes.join(' | ')
      
      // Buscar usuario por email del contacto (cliente)
      const clientUser = await User.findOne({ email: booking.contactInfo.email })
      
      if (clientUser) {
        console.log('✅ Cliente encontrado:', clientUser.email, '- ID:', clientUser._id)
        
        // Notificar si el estado cambió a confirmed
        if (oldBooking && oldBooking.status !== 'confirmed' && booking.status === 'confirmed') {
          console.log('📤 Enviando notificación de confirmación al cliente...')
          await notifyBookingConfirmed({
            userId: clientUser._id,
            bookingNumber: booking.bookingNumber,
            bookingId: booking._id.toString(),
            itemName: booking.itemName
          })
          console.log('✅ Notificación de confirmación enviada al cliente')
        }
        
        // Notificar si el estado cambió a cancelled
        if (oldBooking && oldBooking.status !== 'cancelled' && booking.status === 'cancelled') {
          console.log('📤 Enviando notificación de cancelación al cliente...')
          await notifyBookingCancelled({
            userId: clientUser._id,
            bookingNumber: booking.bookingNumber,
            bookingId: booking._id.toString(),
            itemName: booking.itemName,
            reason: body.cancellationReason
          })
          console.log('✅ Notificación de cancelación enviada al cliente')
        }
        
        // Notificar si el pago cambió a paid
        if (oldBooking && oldBooking.paymentStatus !== 'paid' && booking.paymentStatus === 'paid') {
          console.log('📤 Enviando notificación de pago recibido al cliente...')
          await notifyPaymentReceived({
            userId: clientUser._id,
            bookingNumber: booking.bookingNumber,
            bookingId: booking._id.toString(),
            amount: booking.pricing.total,
            currency: booking.pricing.currency,
            paymentMethod: booking.paymentMethod || 'No especificado'
          })
          console.log('✅ Notificación de pago recibido enviada al cliente')
        }
      } else {
        console.warn('⚠️ Cliente NO encontrado con email:', booking.contactInfo.email)
        console.log('💡 El cliente debe estar registrado con este email para recibir notificaciones')
      }
      
      // IMPORTANTE: En el sistema de administración, notificar a TODOS los admins activos
      if (actionDescription) {
        const adminUsers = await User.find({
          role: { $in: [/^admin$/i, /^super_admin$/i, /^manager$/i] },
          isActive: true
        }).select('_id email role')

        console.log(`📤 Enviando notificación de movimiento a ${adminUsers.length} admins...`)

        for (const admin of adminUsers) {
          await notifyAdminBookingUpdate({
            adminUserId: admin._id,
            createdBy: session.user.id,
            bookingNumber: booking.bookingNumber,
            bookingId: booking._id.toString(),
            action: actionDescription,
            itemName: booking.itemName
          })
        }

        console.log('✅ Notificación de movimiento enviada a admins')
      } else {
        console.log('ℹ️ No hubo cambios relevantes para notificar a admins')
      }
      
    } catch (notifError) {
      console.error('❌ Error creando notificaciones:', notifError)
      // No fallar la actualización si las notificaciones fallan
    }
    
    return NextResponse.json({
      success: true,
      booking
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la reserva' },
      { status: 500 }
    )
  }
}

// DELETE /api/bookings/[id] - Eliminar reserva
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    
    const booking = await Booking.findByIdAndDelete(id)
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reserva eliminada correctamente'
    })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la reserva' },
      { status: 500 }
    )
  }
}
