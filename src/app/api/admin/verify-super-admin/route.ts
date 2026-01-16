import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import dbConnect from '@/lib/db/mongoose'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password requerido' },
        { status: 400 }
      )
    }

    await dbConnect()

    const superAdminUser = await User.findOne({ role: 'super_admin' }).select('+password')

    if (!superAdminUser) {
      console.error('⚠️ No se encontró usuario super_admin en la base de datos')
      return NextResponse.json(
        { success: false, error: 'Configuración incorrecta del sistema' },
        { status: 500 }
      )
    }

    const isValid = await superAdminUser.comparePassword(password)

    if (!isValid) {
      console.warn(`⚠️ Intento fallido de acceso super_admin por ${session.user.email}`)
      return NextResponse.json(
        { success: false, error: 'Password incorrecto' },
        { status: 401 }
      )
    }

    console.log(`✅ Acceso super_admin verificado para ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Password verificado correctamente'
    })
  } catch (error) {
    console.error('❌ Error en verify-super-admin:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
