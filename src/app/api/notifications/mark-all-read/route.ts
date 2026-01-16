import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import dbConnect from '@/lib/db/mongoose'
import { Notification } from '@/models'
import mongoose from 'mongoose'

// POST /api/notifications/mark-all-read - Marcar todas las notificaciones como leídas
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

    const result = await Notification.updateMany(
      { 
        userId: new mongoose.Types.ObjectId(session.user.id),
        isRead: false,
        dismissedAt: { $exists: false }
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    )

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} notificaciones marcadas como leídas`,
      modifiedCount: result.modifiedCount
    })

  } catch (error) {
    console.error('Error al marcar notificaciones como leídas:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
