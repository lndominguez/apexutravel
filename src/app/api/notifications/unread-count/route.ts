import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import dbConnect from '@/lib/db/mongoose'
import { Notification } from '@/models'
import mongoose from 'mongoose'

// GET /api/notifications/unread-count - Obtener contador de notificaciones no leídas
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

    const count = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(session.user.id),
      isRead: false,
      dismissedAt: { $exists: false }
    })

    return NextResponse.json({
      success: true,
      count
    })

  } catch (error) {
    console.error('Error al obtener contador de notificaciones:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
