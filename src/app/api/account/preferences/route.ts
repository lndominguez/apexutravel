import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/mongoose'
import { User, ThemeMode, ColorScheme } from '@/models/User'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const preferencesSchema = z.object({
  theme: z.nativeEnum(ThemeMode).optional(),
  colorScheme: z.nativeEnum(ColorScheme).optional(),
  language: z.string().optional()
})

// GET - Obtener preferencias del usuario
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

    const user = await User.findById(session.user.id).select('preferences')
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      preferences: user.preferences
    })

  } catch (error) {
    console.error('Error al obtener preferencias:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// PUT - Actualizar preferencias completas
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    const body = await request.json()
    const preferences = preferencesSchema.parse(body)

    await connectToDatabase()

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { preferences },
      { new: true, runValidators: true }
    ).select('preferences')
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      preferences: user.preferences
    })

  } catch (error) {
    console.error('Error al actualizar preferencias:', error)
    
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

// PATCH - Actualizar preferencias parciales
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
    const preferences = preferencesSchema.parse(body)

    await connectToDatabase()

    // Obtener preferencias actuales
    const currentUser = await User.findById(session.user.id).select('preferences')
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    // Fusionar con las nuevas preferencias
    const updatedPreferences = {
      ...currentUser.preferences,
      ...preferences
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { preferences: updatedPreferences },
      { new: true, runValidators: true }
    ).select('preferences')

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      preferences: user.preferences
    })

  } catch (error) {
    console.error('Error al actualizar preferencias:', error)
    
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
