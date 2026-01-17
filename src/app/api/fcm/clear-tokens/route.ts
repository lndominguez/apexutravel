import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import dbConnect from '@/lib/db/mongoose'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    await dbConnect()

    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const tokensRemoved = user.fcmTokens?.length || 0
    user.fcmTokens = []
    await user.save()
    
    console.log(`🧹 Limpiados ${tokensRemoved} tokens FCM para usuario ${user.email}`)

    return NextResponse.json({
      success: true,
      message: `${tokensRemoved} tokens FCM eliminados correctamente`,
      tokensRemoved
    })

  } catch (error) {
    console.error('❌ Error al limpiar tokens FCM:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
