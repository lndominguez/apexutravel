import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Transport from '@/models/Transport'
import { User } from '@/models/User'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const transport = await Transport.findById(id).populate('createdBy updatedBy', 'firstName lastName email').lean()
    if (!transport) return NextResponse.json({ error: 'Transporte no encontrado' }, { status: 404 })
    return NextResponse.json({ transport })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener transporte', details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }
    const body = await request.json()
    const transport = await Transport.findByIdAndUpdate(id, { ...body, updatedBy: session.user.id }, { new: true, runValidators: true }).populate('createdBy updatedBy', 'firstName lastName email').lean()
    if (!transport) return NextResponse.json({ error: 'Transporte no encontrado' }, { status: 404 })
    return NextResponse.json({ message: 'Transporte actualizado', transport })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const isPermanent = searchParams.get('permanent') === 'true'
    if (isPermanent) {
      if (currentUser.role !== 'super_admin') return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })
      const transport = await Transport.findByIdAndDelete(id).lean()
      if (!transport) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
      return NextResponse.json({ message: 'Eliminado permanentemente', transport })
    } else {
      const transport = await Transport.findByIdAndUpdate(id, { status: 'inactive', updatedBy: session.user.id }, { new: true }).lean()
      if (!transport) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
      return NextResponse.json({ message: 'Desactivado', transport })
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar', details: error.message }, { status: 500 })
  }
}
