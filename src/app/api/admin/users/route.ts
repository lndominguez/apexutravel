import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDatabase from '@/lib/db/mongoose'
import { User, UserRole } from '@/models/User'
import { z } from 'zod'

// GET /api/users - Obtener lista de usuarios con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    // Verificar permisos (solo admins pueden ver todos los usuarios)
    const currentUser = await User.findById(session.user.id)
    console.log('🔍 Current user role:', currentUser?.role)
    
    if (!currentUser || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const department = searchParams.get('department')

    // Construir filtros
    const filters: any = {}
    
    if (search) {
      filters.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    if (role && role !== 'all') {
      filters.role = role
    }

    if (status && status !== 'all') {
      if (status === 'active') filters.isActive = true
      if (status === 'inactive') filters.isActive = false
      if (status === 'pending') filters.isEmailVerified = false
    }

    if (department && department !== 'all') {
      filters.department = department
    }

    // Calcular skip para paginación
    const skip = (page - 1) * limit

    // Obtener usuarios con paginación
    const users = await User.find(filters)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    console.log('🔍 Found users:', users.length)
    console.log('🔍 Filters applied:', filters)

    // Contar total de usuarios
    const total = await User.countDocuments(filters)
    console.log('🔍 Total users in DB:', total)

    // Calcular estadísticas
    const stats = {
      total: await User.countDocuments(),
      active: await User.countDocuments({ isActive: true }),
      inactive: await User.countDocuments({ isActive: false }),
      pending: await User.countDocuments({ isEmailVerified: false }),
      newThisMonth: await User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      })
    }

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    })

  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// POST /api/users - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const createUserSchema = z.object({
      firstName: z.string().min(1, 'El nombre es requerido'),
      lastName: z.string().min(1, 'El apellido es requerido'),
      email: z.string().email('Email inválido'),
      password: z.string().min(6, 'Mínimo 6 caracteres'),
      role: z.enum(['super_admin', 'admin', 'manager', 'agent', 'viewer']),
      phone: z.string().optional(),
      department: z.string().optional(),
      position: z.string().optional(),
      commissionRate: z.number().min(0).max(100).optional(),
      notes: z.string().optional()
    })

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    await connectToDatabase()

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Crear usuario
    const newUser = await User.create({
      ...validatedData,
      email: validatedData.email.toLowerCase(),
      invitedBy: session.user.id
    })

    // Retornar usuario sin password
    const userResponse = await User.findById(newUser._id)
      .select('-password')
      .populate('invitedBy', 'firstName lastName email')

    return NextResponse.json({
      message: 'Usuario creado exitosamente',
      user: userResponse
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear usuario:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
