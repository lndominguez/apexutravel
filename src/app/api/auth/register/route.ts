import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { User, UserRole } from '@/models/User'
import connectDB from '@/lib/db/mongoose'

export const runtime = 'nodejs'

const registerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  phone: z.string().optional(),
  role: z.enum(['agent', 'manager']).default('agent')
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, phone, role } = registerSchema.parse(body)

    // Conectar a la base de datos
    await connectDB()

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Crear usuario (el middleware del modelo hasheará el password automáticamente)
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password, // Password sin hashear, el middleware lo procesará
      phone: phone || undefined,
      role: role === 'manager' ? UserRole.MANAGER : UserRole.AGENT,
      commissionRate: role === 'manager' ? 0 : 5 // Managers no tienen comisión
    })

    // Retornar respuesta sin incluir el password
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      commissionRate: user.commissionRate
    }

    return NextResponse.json(
      { 
        message: 'Usuario creado exitosamente',
        user: userResponse
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error en registro:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear el usuario' },
      { status: 500 }
    )
  }
}
