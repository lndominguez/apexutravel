import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/mongoose'
import { User, UserRole } from '@/models/User'
import { auth } from '@/lib/auth'
import { sendInvitationEmail } from '@/lib/email'
import crypto from 'crypto'
import { z } from 'zod'

// POST /api/users/invitations - Generar link de invitación
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos (solo admins pueden generar invitaciones)
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const invitationSchema = z.object({
      email: z.string().email('Email inválido'),
      role: z.enum(['admin', 'manager', 'agent', 'viewer']),
      department: z.string().optional(),
      position: z.string().optional(),
      expiresInDays: z.number().min(1).max(30).default(7)
    })

    const body = await request.json()
    const { email, role, department, position, expiresInDays } = invitationSchema.parse(body)

    await connectToDatabase()

    // Verificar si ya existe un usuario con este email
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Generar token único
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const invitationExpires = new Date()
    invitationExpires.setDate(invitationExpires.getDate() + expiresInDays)

    // Crear usuario pendiente con token de invitación
    const pendingUser = await User.create({
      email: email.toLowerCase(),
      firstName: 'Pendiente',
      lastName: 'Invitación',
      password: crypto.randomBytes(32).toString('hex'), // Password temporal
      role,
      department,
      position,
      isActive: false,
      isEmailVerified: false,
      invitedBy: session.user.id,
      invitationToken,
      invitationExpires
    })

    // Enviar email de invitación
    const emailResult = await sendInvitationEmail(
      email,
      currentUser.getFullName(),
      role,
      invitationToken,
      expiresInDays
    )

    // Generar URL de invitación
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/auth/invitation?token=${invitationToken}`

    return NextResponse.json({
      message: 'Invitación generada y enviada exitosamente',
      invitation: {
        id: pendingUser._id,
        email,
        role,
        department,
        position,
        invitationUrl,
        expiresAt: invitationExpires,
        invitedBy: {
          id: currentUser._id,
          name: currentUser.getFullName(),
          email: currentUser.email
        }
      },
      emailSent: emailResult.success,
      emailError: emailResult.success ? null : emailResult.error
    }, { status: 201 })

  } catch (error) {
    console.error('Error al generar invitación:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al generar invitación' },
      { status: 500 }
    )
  }
}

// GET /api/users/invitations - Listar invitaciones pendientes
export async function GET(request: NextRequest) {
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

    await connectToDatabase()

    // Obtener invitaciones pendientes
    const pendingInvitations = await User.find({
      isActive: false,
      isEmailVerified: false,
      invitationToken: { $exists: true },
      invitationExpires: { $gt: new Date() }
    })
      .select('email role department position invitationExpires createdAt')
      .populate('invitedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })

    // Obtener invitaciones expiradas
    const expiredInvitations = await User.find({
      isActive: false,
      isEmailVerified: false,
      invitationToken: { $exists: true },
      invitationExpires: { $lte: new Date() }
    })
      .select('email role department position invitationExpires createdAt')
      .populate('invitedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10)

    return NextResponse.json({
      pending: pendingInvitations,
      expired: expiredInvitations,
      stats: {
        totalPending: pendingInvitations.length,
        totalExpired: await User.countDocuments({
          isActive: false,
          isEmailVerified: false,
          invitationToken: { $exists: true },
          invitationExpires: { $lte: new Date() }
        })
      }
    })

  } catch (error) {
    console.error('Error al obtener invitaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener invitaciones' },
      { status: 500 }
    )
  }
}
