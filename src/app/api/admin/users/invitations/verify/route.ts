import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/mongoose'
import { User } from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Token de invitación requerido'
      }, { status: 400 })
    }

    // Buscar la invitación por token
    const invitation = await User.findOne({
      invitationToken: token,
      isActive: false // Solo invitaciones pendientes
    }).populate('invitedBy', 'firstName lastName email')

    if (!invitation) {
      return NextResponse.json({
        success: false,
        message: 'Invitación no encontrada o ya utilizada'
      }, { status: 404 })
    }

    // Verificar si la invitación ha expirado
    if (invitation.invitationExpires && new Date() > invitation.invitationExpires) {
      return NextResponse.json({
        success: false,
        message: 'La invitación ha expirado'
      }, { status: 400 })
    }

    // Devolver los datos de la invitación
    return NextResponse.json({
      success: true,
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        department: invitation.department,
        position: invitation.position,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.invitationExpires,
        isUsed: invitation.isActive // Si ya está activo, significa que se usó
      }
    })

  } catch (error) {
    console.error('Error al verificar invitación:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 })
  }
}
