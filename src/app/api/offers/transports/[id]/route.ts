import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import { User } from '@/models/User'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const offer = await Offer.findOne({ _id: id, type: 'transport' }).populate('createdBy updatedBy', 'firstName lastName email').lean()
    if (!offer) return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
    return NextResponse.json({ offer })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener oferta', details: error.message }, { status: 500 })
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
    const offer = await Offer.findOneAndUpdate({ _id: id, type: 'transport' }, { ...body, updatedBy: session.user.id }, { new: true, runValidators: true }).populate('createdBy updatedBy', 'firstName lastName email').lean()
    if (!offer) return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
    return NextResponse.json({ message: 'Oferta actualizada', offer })
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
      const offer = await Offer.findOneAndDelete({ _id: id, type: 'transport' }).lean()
      if (!offer) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      return NextResponse.json({ message: 'Eliminada permanentemente', offer })
    } else {
      const offer = await Offer.findOneAndUpdate({ _id: id, type: 'transport' }, { status: 'archived', updatedBy: session.user.id }, { new: true }).lean()
      if (!offer) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      return NextResponse.json({ message: 'Archivada', offer })
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar', details: error.message }, { status: 500 })
  }
}
