import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/mongoose'
import { User, UserRole } from '@/models/User'
import { auth } from '@/lib/auth'
import { sendInvitationEmail } from '@/lib/email'
import { z } from 'zod'
import crypto from 'crypto'

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

    // Buscar la invitación pendiente (incluso si está expirada)
    const invitation = await User.findOne({
      _id: invitationId,
      isActive: false,
      isEmailVerified: false,
      invitationToken: { $exists: true }
    }).populate('invitedBy', 'firstName lastName')

    if (!invitation) {
      return NextResponse.json({
        success: false,
        error: 'Invitación no encontrada o ya utilizada'
      }, { status: 404 })
    }

    // Si la invitación está expirada, renovar el token y la fecha
    if (invitation.invitationExpires && invitation.invitationExpires < new Date()) {
      console.log('⚠️ Invitación expirada, renovando token...')
      invitation.invitationToken = crypto.randomBytes(32).toString('hex')
      invitation.invitationExpires = new Date()
      invitation.invitationExpires.setDate(invitation.invitationExpires.getDate() + 1) // 1 día
      await invitation.save()
      console.log('✅ Token renovado con nueva expiración:', invitation.invitationExpires)
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
