import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import User from '@/models/User'

/**
 * GET /api/account/me
 * 
 * Obtiene los datos COMPLETOS del usuario actual desde la BD
 * Usado por SWR para mantener datos en tiempo real
 */
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    await connectDB()
    
    // Obtener usuario completo de la BD
    const user = await User.findById(session.user.id).select('-password')
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Retornar datos completos
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        department: user.department,
        position: user.position,
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
    console.error('❌ Error en /api/account/me:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
