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
    console.log('🔍 DELETE /api/admin/users/[id] - Iniciando...')
    
    const session = await auth()
    console.log('🔐 Session:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    })
    
    if (!session?.user?.id) {
      console.log('❌ No hay sesión válida')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    console.log('🎯 ID a eliminar:', id)
    
    // Leer el body para obtener la contraseña de super admin
    const body = await request.json().catch(() => ({}))
    const { superAdminPassword } = body
    
    // Conectar a la base de datos primero
    console.log('🔌 Conectando a la base de datos...')
    await connectToDatabase()
    console.log('✅ Base de datos conectada')
    
    // Solo super admins y admins pueden eliminar usuarios
    console.log('👤 Buscando usuario actual:', session.user.id)
    const currentUser = await User.findById(session.user.id)
    console.log('👤 Usuario actual:', { 
      found: !!currentUser, 
      role: currentUser?.role,
      email: currentUser?.email 
    })
    
    if (!currentUser || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)) {
      console.log('❌ Sin permisos - Role:', currentUser?.role, 'Required: super_admin or admin')
      return NextResponse.json({ error: 'Sin permisos suficientes. Solo administradores pueden eliminar usuarios.' }, { status: 403 })
    }

    // Si no es super_admin, exigir password de super_admin
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!superAdminPassword || typeof superAdminPassword !== 'string') {
        return NextResponse.json(
          { error: 'Se requiere la contraseña del super administrador para eliminar usuarios' },
          { status: 403 }
        )
      }

      const superAdmin = await User.findOne({
        role: UserRole.SUPER_ADMIN,
        isActive: true
      }).select('+password')

      if (!superAdmin) {
        return NextResponse.json(
          { error: 'No se encontró super administrador en el sistema' },
          { status: 500 }
        )
      }

      const isPasswordValid = await superAdmin.comparePassword(superAdminPassword)
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Contraseña de super administrador incorrecta' },
          { status: 403 }
        )
      }
    }

    console.log('✅ Usuario autorizado para eliminar:', currentUser.role)

    console.log('🔍 Buscando usuario a eliminar:', id)
    const userToDelete = await User.findById(id)
    console.log('🔍 Usuario a eliminar:', { 
      found: !!userToDelete, 
      email: userToDelete?.email,
      role: userToDelete?.role 
    })
    
    if (!userToDelete) {
      console.log('❌ Usuario no encontrado')
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Solo super_admin puede eliminar un super_admin
    if (userToDelete.role === UserRole.SUPER_ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Solo el super administrador puede eliminar otro super administrador' },
        { status: 403 }
      )
    }

    // No permitir eliminar el último super admin
    if (userToDelete.role === UserRole.SUPER_ADMIN) {
      console.log('⚠️ Intentando eliminar super admin, verificando conteo...')
      const superAdminCount = await User.countDocuments({ 
        role: UserRole.SUPER_ADMIN, 
        isActive: true 
      })
      console.log('📊 Super admins activos:', superAdminCount)
      
      if (superAdminCount <= 1) {
        console.log('❌ No se puede eliminar el último super admin')
        return NextResponse.json(
          { error: 'No se puede eliminar el último super administrador del sistema' },
          { status: 400 }
        )
      }
    }

    // Hard delete - eliminar del sistema
    console.log('🗑️ Realizando hard delete...')
    const result = await User.findByIdAndDelete(id)
    console.log('✅ Usuario eliminado:', { success: !!result })

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente'
    })

  } catch (error) {
    console.error('💥 Error al eliminar usuario:', error)
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: 'Error al eliminar usuario', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
