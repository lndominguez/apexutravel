import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/mongoose'
import { User } from '@/models/User'
import { auth } from '@/lib/auth'
import { sendPasswordChangedEmail } from '@/lib/email'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmación de contraseña requerida')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    await connectToDatabase()

    // Buscar usuario con password
    const user = await User.findById(session.user.id).select('+password')
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Contraseña actual incorrecta'
      }, { status: 400 })
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await user.comparePassword(newPassword)
    
    if (isSamePassword) {
      return NextResponse.json({
        success: false,
        error: 'La nueva contraseña debe ser diferente a la actual'
      }, { status: 400 })
    }

    // Actualizar contraseña (el middleware del modelo la hasheará)
    user.password = newPassword
    await user.save()

    // Enviar email de confirmación
    const emailResult = await sendPasswordChangedEmail(
      user.email,
      user.firstName
    )

    return NextResponse.json({
      success: true,
      message: 'Contraseña cambiada exitosamente',
      emailSent: emailResult.success
    })

  } catch (error) {
    console.error('Error en change password:', error)
    
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
