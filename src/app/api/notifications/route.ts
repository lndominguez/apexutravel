import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    // Por ahora, notificaciones simuladas
    // TODO: Implementar cuando tengamos el modelo de Notifications
    const notifications = [
      {
        id: 1,
        type: 'info',
        title: 'Bienvenido al CRM',
        message: 'Tu cuenta ha sido configurada correctamente',
        read: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
        userId: session.user.id
      },
      {
        id: 2,
        type: 'success',
        title: 'Perfil actualizado',
        message: 'Tu información de perfil se ha actualizado exitosamente',
        read: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        userId: session.user.id
      },
      {
        id: 3,
        type: 'warning',
        title: 'Recordatorio',
        message: 'Tienes 3 tareas pendientes por completar',
        read: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
        userId: session.user.id
      },
      {
        id: 4,
        type: 'error',
        title: 'Error en sincronización',
        message: 'Hubo un problema al sincronizar los datos. Por favor, intenta nuevamente.',
        read: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
        userId: session.user.id
      }
    ]

    return NextResponse.json({
      success: true,
      data: notifications
    })

  } catch (error) {
    console.error('Error al obtener notificaciones:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
