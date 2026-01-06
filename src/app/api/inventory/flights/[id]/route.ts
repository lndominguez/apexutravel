import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { Flight } from '@/models'
import { User } from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const flight = await Flight.findById(params.id)
      .populate('supplier', 'name type email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean()

    if (!flight) {
      return NextResponse.json({ error: 'Vuelo no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ flight })
  } catch (error: any) {
    console.error('Error fetching flight:', error)
    return NextResponse.json(
      { error: 'Error al obtener vuelo', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar vuelos' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const flight = await Flight.findByIdAndUpdate(
      params.id,
      {
        ...body,
        updatedBy: session.user.id
      },
      { new: true, runValidators: true }
    )
      .populate('supplier', 'name type')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .lean()

    if (!flight) {
      return NextResponse.json({ error: 'Vuelo no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Vuelo actualizado exitosamente',
      flight
    })
  } catch (error: any) {
    console.error('Error updating flight:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Error de validación', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar vuelo', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar vuelos' },
        { status: 403 }
      )
    }

    const flight = await Flight.findByIdAndUpdate(
      params.id,
      {
        status: 'cancelled',
        updatedBy: session.user.id
      },
      { new: true }
    ).lean()

    if (!flight) {
      return NextResponse.json({ error: 'Vuelo no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Vuelo cancelado exitosamente',
      flight
    })
  } catch (error: any) {
    console.error('Error deleting flight:', error)
    return NextResponse.json(
      { error: 'Error al eliminar vuelo', details: error.message },
      { status: 500 }
    )
  }
}
