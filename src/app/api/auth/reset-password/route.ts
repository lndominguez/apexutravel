import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/mongoose'
import { User } from '@/models/User'
import { sendPasswordChangedEmail } from '@/lib/email'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token requerido')
})

// POST - Restablecer contraseña
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    await connectToDatabase()

    // Buscar usuario con token válido y no expirado
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
      isActive: true
    }).select('+resetPasswordToken +resetPasswordExpires')

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido o expirado'
      }, { status: 400 })
    }

    // Actualizar contraseña (el middleware del modelo la hasheará)
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    // Enviar email de confirmación
    const emailResult = await sendPasswordChangedEmail(
      user.email,
      user.firstName
    )

    return NextResponse.json({
      success: true,
      message: 'Contraseña restablecida exitosamente',
      emailSent: emailResult.success
    })

  } catch (error) {
    console.error('Error en reset password:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Datos inválidos',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// GET - Verificar token de reset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token requerido'
      }, { status: 400 })
    }

    const { token: validatedToken } = verifyTokenSchema.parse({ token })

    await connectToDatabase()

    // Verificar si el token existe y no ha expirado
    const user = await User.findOne({
      resetPasswordToken: validatedToken,
      resetPasswordExpires: { $gt: new Date() },
      isActive: true
    }).select('firstName lastName email')

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido o expirado'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Token válido',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Error verificando token:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
