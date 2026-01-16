import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendPushNotification } from '@/lib/push-notifications'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import dbConnect from '@/lib/db/mongoose'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    await dbConnect()

    // Verificar Firebase Admin
    const firebaseAdmin = getFirebaseAdmin()
    const firebaseStatus = firebaseAdmin ? 'Inicializado ✅' : 'No inicializado ❌'

    // Verificar usuario y tokens
    const user = await User.findById(session.user.id).select('email fcmTokens')
    
    const diagnostics = {
      firebaseAdmin: firebaseStatus,
      user: {
        email: user?.email,
        fcmTokensCount: user?.fcmTokens?.length || 0,
        fcmTokens: user?.fcmTokens || []
      },
      env: {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Configurado ✅' : 'No configurado ❌',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Configurado ✅' : 'No configurado ❌',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'Configurado ✅' : 'No configurado ❌',
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Configurado ✅' : 'No configurado ❌',
        NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? 'Configurado ✅' : 'No configurado ❌'
      }
    }

    return NextResponse.json(diagnostics, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Error en diagnóstico',
      message: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    console.log('🧪 [TEST] Enviando notificación de prueba...')

    const result = await sendPushNotification({
      userId: session.user.id,
      title: '🧪 Prueba de notificación',
      body: 'Esta es una notificación de prueba desde el servidor',
      clickAction: '/dashboard',
      data: {
        test: 'true',
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({ 
      success: result,
      message: result 
        ? 'Notificación enviada correctamente' 
        : 'No se pudo enviar la notificación. Revisa los logs del servidor.'
    })

  } catch (error: any) {
    console.error('❌ [TEST] Error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}
