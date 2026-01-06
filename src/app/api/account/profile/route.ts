import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/mongoose'
import { User } from '@/models/User'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').optional(),
  lastName: z.string().min(1, 'El apellido es requerido').optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal(''))
})

// GET - Obtener perfil del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    await connectToDatabase()

    const user = await User.findById(session.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires -invitationToken')
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        department: user.department,
        position: user.position,
        role: user.role,
        commissionRate: user.commissionRate,
        preferences: user.preferences,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })

  } catch (error) {
    console.error('Error al obtener perfil:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// PATCH - Actualizar perfil del usuario
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    const body = await request.json()
    const updates = profileUpdateSchema.parse(body)

    await connectToDatabase()

    const user = await User.findByIdAndUpdate(
      session.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -invitationToken')
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        department: user.department,
        position: user.position,
        role: user.role,
        commissionRate: user.commissionRate,
        preferences: user.preferences,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })

  } catch (error) {
    console.error('Error al actualizar perfil:', error)
    
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
