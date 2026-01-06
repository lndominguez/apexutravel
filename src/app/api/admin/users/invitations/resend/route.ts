import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/mongoose'
import { User, UserRole } from '@/models/User'
import { auth } from '@/lib/auth'
import { sendInvitationEmail } from '@/lib/email'
import { z } from 'zod'

const resendSchema = z.object({
  invitationId: z.string().min(1, 'ID de invitación requerido')
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

    // Verificar permisos
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)) {
      return NextResponse.json({
        success: false,
        error: 'Sin permisos suficientes'
      }, { status: 403 })
    }

    const body = await request.json()
    const { invitationId } = resendSchema.parse(body)

    await connectToDatabase()

    // Buscar la invitación pendiente
    const invitation = await User.findOne({
      _id: invitationId,
      isActive: false,
      isEmailVerified: false,
      invitationToken: { $exists: true },
      invitationExpires: { $gt: new Date() }
    }).populate('invitedBy', 'firstName lastName')

    if (!invitation) {
      return NextResponse.json({
        success: false,
        error: 'Invitación no encontrada, ya utilizada o expirada'
      }, { status: 404 })
    }

    // Reenviar email
    const emailResult = await sendInvitationEmail(
      invitation.email,
      currentUser.getFullName(),
      invitation.role,
      invitation.invitationToken || ''
    )

    return NextResponse.json({
      success: true,
      message: emailResult.success 
        ? 'Email reenviado exitosamente'
        : 'Error al reenviar email',
      emailSent: emailResult.success,
      emailError: emailResult.success ? null : emailResult.error
    })

  } catch (error) {
    console.error('Error al reenviar invitación:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Datos inválidos'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
