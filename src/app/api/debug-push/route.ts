import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import dbConnect from '@/lib/db/mongoose'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    await dbConnect()
    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        fcmTokens: user.fcmTokens || [],
        fcmTokensCount: user.fcmTokens?.length || 0
      },
      notificationPermission: 'Check browser console',
      instructions: {
        step1: 'Abre la consola del navegador (F12)',
        step2: 'Ve a la pestaña Application/Aplicación',
        step3: 'En el menú izquierdo, busca "Service Workers"',
        step4: 'Verifica que firebase-messaging-sw.js esté activo',
        step5: 'En la consola, ejecuta: Notification.permission',
        step6: 'Debe decir "granted" para que funcione'
      }
    })
  } catch (error: any) {
    console.error('Error en debug-push:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
