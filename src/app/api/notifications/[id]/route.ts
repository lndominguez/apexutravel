import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import dbConnect from '@/lib/db/mongoose'
import { Notification } from '@/models'
import mongoose from 'mongoose'

// PATCH /api/notifications/[id] - Actualizar notificación (marcar como leída, pin, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    await dbConnect()

    const { id } = await params
    const body = await request.json()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID de notificación inválido'
      }, { status: 400 })
    }

    const notification = await Notification.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(session.user.id)
    })

    if (!notification) {
      return NextResponse.json({
        success: false,
        error: 'Notificación no encontrada'
      }, { status: 404 })
    }

    if (body.isRead !== undefined) {
      notification.isRead = body.isRead
      if (body.isRead) {
        notification.readAt = new Date()
      }
    }

    if (body.isPinned !== undefined) {
      notification.isPinned = body.isPinned
    }

    await notification.save()

    return NextResponse.json({
      success: true,
      data: notification
    })

  } catch (error) {
    console.error('Error al actualizar notificación:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// DELETE /api/notifications/[id] - Eliminar notificación
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const hard = searchParams.get('hard') === 'true'

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID de notificación inválido'
      }, { status: 400 })
    }

    const notification = await Notification.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(session.user.id)
    })

    if (!notification) {
      return NextResponse.json({
        success: false,
        error: 'Notificación no encontrada'
      }, { status: 404 })
    }

    if (hard) {
      if (session.user.role !== 'super_admin') {
        return NextResponse.json({
          success: false,
          error: 'No autorizado'
        }, { status: 403 })
      }

      await Notification.deleteOne({ _id: notification._id })

      return NextResponse.json({
        success: true,
        message: 'Notificación eliminada definitivamente'
      })
    }

    if (!notification.dismissedAt) {
      notification.dismissedAt = new Date()
      await notification.save()
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación archivada'
    })

  } catch (error) {
    console.error('Error al eliminar notificación:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
