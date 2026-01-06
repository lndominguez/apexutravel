import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/mongoose'
import { User } from '@/models/User'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    await connectToDatabase()

    // Buscar usuario activo
    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    })

    // Por seguridad, siempre devolvemos el mismo mensaje
    // independientemente de si el usuario existe o no
    const successMessage = 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.'

    if (!user) {
      return NextResponse.json({
        success: true,
        message: successMessage
      })
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Guardar token en el usuario
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = resetTokenExpires
    await user.save()

    // Enviar email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken
    )

    if (!emailResult.success) {
      console.error('Error enviando email de reset:', emailResult.error)
      // No revelamos el error específico por seguridad
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      emailSent: emailResult.success
    })

  } catch (error) {
    console.error('Error en forgot password:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Email inválido'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
