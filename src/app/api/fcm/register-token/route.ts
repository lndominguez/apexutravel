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

    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token FCM requerido' },
        { status: 400 }
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

    if (!user.fcmTokens) {
      user.fcmTokens = []
    }

    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token)
      await user.save()
      console.log(`✅ FCM token registrado para usuario ${user.email}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Token FCM registrado correctamente'
    })

  } catch (error) {
    console.error('❌ Error al registrar token FCM:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token FCM requerido' },
        { status: 400 }
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

    if (user.fcmTokens) {
      user.fcmTokens = user.fcmTokens.filter(t => t !== token)
      await user.save()
      console.log(`✅ FCM token eliminado para usuario ${user.email}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Token FCM eliminado correctamente'
    })

  } catch (error) {
    console.error('❌ Error al eliminar token FCM:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
