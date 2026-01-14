import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Flight from '@/models/Flight'
import { User } from '@/models/User'

// GET /api/resources/flights/[id]
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

    const flight = await Flight.findById(id)
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

// PUT /api/resources/flights/[id]
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
        { error: 'No tienes permisos para actualizar vuelos' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const flight = await Flight.findByIdAndUpdate(
      id,
      { ...body, updatedBy: session.user.id },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean()

    if (!flight) {
      return NextResponse.json({ error: 'Vuelo no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Vuelo actualizado exitosamente', flight })
  } catch (error: any) {
    console.error('Error updating flight:', error)
    return NextResponse.json(
      { error: 'Error al actualizar vuelo', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/resources/flights/[id]
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
        { error: 'No tienes permisos para eliminar vuelos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isPermanent = searchParams.get('permanent') === 'true'

    if (isPermanent && currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo super_admin puede eliminar permanentemente' },
        { status: 403 }
      )
    }

    if (isPermanent) {
      const flight = await Flight.findByIdAndDelete(id).lean()
      if (!flight) {
        return NextResponse.json({ error: 'Vuelo no encontrado' }, { status: 404 })
      }
      return NextResponse.json({ message: 'Vuelo eliminado permanentemente', flight })
    } else {
      const flight = await Flight.findByIdAndUpdate(
        id,
        { status: 'inactive', updatedBy: session.user.id },
        { new: true }
      ).lean()
      if (!flight) {
        return NextResponse.json({ error: 'Vuelo no encontrado' }, { status: 404 })
      }
      return NextResponse.json({ message: 'Vuelo desactivado exitosamente', flight })
    }
  } catch (error: any) {
    console.error('Error deleting flight:', error)
    return NextResponse.json(
      { error: 'Error al eliminar vuelo', details: error.message },
      { status: 500 }
    )
  }
}
