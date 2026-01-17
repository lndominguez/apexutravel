import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/mongoose'
import { User } from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const { token, firstName, lastName, password } = await request.json()

    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json({
        success: false,
        message: 'Todos los campos son requeridos'
      }, { status: 400 })
    }

    // Buscar la invitación por token
    const invitation = await User.findOne({
      invitationToken: token,
      isActive: false
    })

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

    // Completar registro
    invitation.firstName = firstName
    invitation.lastName = lastName
    invitation.password = password
    invitation.isActive = true
    invitation.isEmailVerified = true
    invitation.invitationToken = undefined
    invitation.invitationExpires = undefined

    await invitation.save()

    return NextResponse.json({
      success: true,
      message: 'Cuenta creada exitosamente',
      user: {
        id: invitation._id,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role
      }
    })
  } catch (error) {
    console.error('Error al aceptar invitación:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 })
  }
}
