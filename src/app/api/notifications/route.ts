import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import dbConnect from '@/lib/db/mongoose'
import { Notification, NotificationType, NotificationPriority } from '@/models'
import mongoose from 'mongoose'

// GET /api/notifications - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const includeDismissed = searchParams.get('includeDismissed') === 'true'

    const userRole = session.user.role

    const query: Record<string, unknown> = { 
      userId: new mongoose.Types.ObjectId(session.user.id),
      $or: [
        { targetRoles: { $exists: false } },
        { targetRoles: null },
        { targetRoles: [] },
        { targetRoles: userRole }
      ]
    }
    
    if (unreadOnly) {
      query.isRead = false
    }

    if (!includeDismissed) {
      query.dismissedAt = { $exists: false }
    }

    const notifications = await Notification.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('createdBy', 'firstName lastName avatar')
      .lean()

    const unreadCount = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(session.user.id),
      isRead: false,
      dismissedAt: { $exists: false },
      $or: [
        { targetRoles: { $exists: false } },
        { targetRoles: null },
        { targetRoles: [] },
        { targetRoles: userRole }
      ]
    })

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount
    })

  } catch (error) {
    console.error('Error al obtener notificaciones:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// POST /api/notifications - Crear nueva notificación
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    await dbConnect()

    const body = await request.json()
    const {
      userId,
      type = NotificationType.INFO,
      priority = NotificationPriority.MEDIUM,
      title,
      message,
      icon,
      imageUrl,
      action,
      metadata,
      isPinned = false,
      expiresAt,
      sentVia = { inApp: true, push: false, email: false }
    } = body

    if (!title || !message) {
      return NextResponse.json({
        success: false,
        error: 'Título y mensaje son requeridos'
      }, { status: 400 })
    }

    const notification = await Notification.create({
      userId: userId || session.user.id,
      type,
      priority,
      title,
      message,
      icon,
      imageUrl,
      action,
      metadata,
      isPinned,
      expiresAt,
      sentVia,
      createdBy: new mongoose.Types.ObjectId(session.user.id)
    })

    return NextResponse.json({
      success: true,
      data: notification
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear notificación:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
