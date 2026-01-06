import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { Transport } from '@/models'
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

    const transport = await Transport.findById(params.id)
      .populate('supplier', 'name type email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean()

    if (!transport) {
      return NextResponse.json({ error: 'Transporte no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ transport })
  } catch (error: any) {
    console.error('Error fetching transport:', error)
    return NextResponse.json(
      { error: 'Error al obtener transporte', details: error.message },
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
        { error: 'No tienes permisos para actualizar transportes' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const transport = await Transport.findByIdAndUpdate(
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

    if (!transport) {
      return NextResponse.json({ error: 'Transporte no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Transporte actualizado exitosamente',
      transport
    })
  } catch (error: any) {
    console.error('Error updating transport:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Error de validación', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar transporte', details: error.message },
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
        { error: 'No tienes permisos para eliminar transportes' },
        { status: 403 }
      )
    }

    const transport = await Transport.findByIdAndUpdate(
      params.id,
      {
        status: 'inactive',
        updatedBy: session.user.id
      },
      { new: true }
    ).lean()

    if (!transport) {
      return NextResponse.json({ error: 'Transporte no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Transporte desactivado exitosamente',
      transport
    })
  } catch (error: any) {
    console.error('Error deleting transport:', error)
    return NextResponse.json(
      { error: 'Error al eliminar transporte', details: error.message },
      { status: 500 }
    )
  }
}
