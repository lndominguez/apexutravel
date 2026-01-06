import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDatabase from '@/lib/db/mongoose'
import { User, UserRole } from '@/models/User'
import { z } from 'zod'

// GET /api/users/[id] - Obtener usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    await connectToDatabase()

    const user = await User.findById(id)
      .select('-password')
      .populate('invitedBy', 'firstName lastName email')

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar permisos (usuarios pueden ver su propio perfil, admins pueden ver cualquiera)
    const currentUser = await User.findById(session.user.id)
    const canView = 
      session.user.id === id || 
      (currentUser && [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role))

    if (!canView) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const updateUserSchema = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.enum(['super_admin', 'admin', 'manager', 'agent', 'viewer']).optional(),
      phone: z.string().optional(),
      department: z.string().optional(),
      position: z.string().optional(),
      commissionRate: z.number().min(0).max(100).optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional(),
      isEmailVerified: z.boolean().optional()
    })

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    await connectToDatabase()

    const userToUpdate = await User.findById(id)
    if (!userToUpdate) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar permisos
    const currentUser = await User.findById(session.user.id)
    const isOwnProfile = session.user.id === id
    const isAdmin = currentUser && [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    // Restricciones adicionales para usuarios no admin
    if (!isAdmin) {
      // Los usuarios normales no pueden cambiar su rol, estado activo, etc.
      delete validatedData.role
      delete validatedData.isActive
      delete validatedData.isEmailVerified
      delete validatedData.commissionRate
      delete validatedData.notes
    }

    // Verificar email único si se está cambiando
    if (validatedData.email && validatedData.email !== userToUpdate.email) {
      const existingUser = await User.findOne({ 
        email: validatedData.email.toLowerCase(),
        _id: { $ne: id }
      })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
      validatedData.email = validatedData.email.toLowerCase()
    }

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('invitedBy', 'firstName lastName email')

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Eliminar usuario (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    
    // Solo super admins pueden eliminar usuarios
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    await connectToDatabase()

    const userToDelete = await User.findById(id)
    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir eliminar el último super admin
    if (userToDelete.role === UserRole.SUPER_ADMIN) {
      const superAdminCount = await User.countDocuments({ 
        role: UserRole.SUPER_ADMIN, 
        isActive: true 
      })
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: 'No se puede eliminar el último super administrador' },
          { status: 400 }
        )
      }
    }

    // Soft delete - marcar como inactivo
    await User.findByIdAndUpdate(id, { 
      isActive: false,
      email: `deleted_${Date.now()}_${userToDelete.email}` // Evitar conflictos de email único
    })

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
