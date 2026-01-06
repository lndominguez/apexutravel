import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { Hotel } from '@/models'
import { User } from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    const hotel = await Hotel.findById(id)
      .populate('supplier', 'name type email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ hotel })
  } catch (error: any) {
    console.error('Error fetching hotel:', error)
    return NextResponse.json(
      { error: 'Error al obtener hotel', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar hoteles' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const hotel = await Hotel.findByIdAndUpdate(
      id,
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

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Hotel actualizado exitosamente',
      hotel
    })
  } catch (error: any) {
    console.error('Error updating hotel:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Error de validación', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar hotel', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar hoteles' },
        { status: 403 }
      )
    }

    const hotel = await Hotel.findByIdAndUpdate(
      id,
      {
        status: 'inactive',
        updatedBy: session.user.id
      },
      { new: true }
    ).lean()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Hotel desactivado exitosamente',
      hotel
    })
  } catch (error: any) {
    console.error('Error deleting hotel:', error)
    return NextResponse.json(
      { error: 'Error al eliminar hotel', details: error.message },
      { status: 500 }
    )
  }
}
