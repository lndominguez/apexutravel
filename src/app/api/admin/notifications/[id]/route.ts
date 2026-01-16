import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDatabase from '@/lib/db/mongoose'
import { Notification } from '@/models'
import { User, UserRole } from '@/models/User'
import mongoose from 'mongoose'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    const currentUser = await User.findById(session.user.id)

    if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    const result = await Notification.deleteOne({ _id: new mongoose.Types.ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Notificación no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Notificación eliminada' })
  } catch (error) {
    console.error('Error al eliminar notificación admin:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
