import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { notifySystem } from '@/lib/notifications'
import { NotificationPriority } from '@/types/notification'

/**
 * Ruta de prueba para crear una notificación al usuario actual
 * GET /api/notifications/test
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    console.log('🧪 Creando notificación de prueba para usuario:', session.user.id)

    // Crear notificación de prueba
    const notification = await notifySystem({
      userId: session.user.id,
      title: '🧪 Notificación de Prueba',
      message: `Hola ${session.user.name || 'Usuario'}! Esta es una notificación de prueba para verificar que el sistema funciona correctamente.`,
      priority: NotificationPriority.HIGH,
      action: {
        label: 'Ver Dashboard',
        url: '/dashboard'
      }
    })

    console.log('✅ Notificación de prueba creada:', notification._id)

    return NextResponse.json({
      success: true,
      message: 'Notificación de prueba creada',
      notificationId: notification._id,
      userId: session.user.id
    })
  } catch (error) {
    console.error('❌ Error creando notificación de prueba:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error
      },
      { status: 500 }
    )
  }
}
