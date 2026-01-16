import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDatabase from '@/lib/db/mongoose'
import { Notification } from '@/models'
import { User, UserRole } from '@/models/User'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    const currentUser = await User.findById(session.user.id)

    if (!currentUser || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10), 1), 100)
    const skip = (page - 1) * limit

    const search = (searchParams.get('search') || '').trim()
    const type = (searchParams.get('type') || '').trim()
    const priority = (searchParams.get('priority') || '').trim()

    const userId = (searchParams.get('userId') || '').trim()
    const userEmail = (searchParams.get('userEmail') || '').trim()
    const createdBy = (searchParams.get('createdBy') || '').trim()
    const createdByEmail = (searchParams.get('createdByEmail') || '').trim()

    const dateFrom = (searchParams.get('dateFrom') || '').trim()
    const dateTo = (searchParams.get('dateTo') || '').trim()

    const includeDismissedParam = (searchParams.get('includeDismissed') || '').trim()
    const includeDismissed = includeDismissedParam === '' ? true : includeDismissedParam === 'true'

    const query: Record<string, unknown> = {}

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ]
    }

    if (type) {
      query.type = type
    }

    if (priority) {
      query.priority = priority
    }

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ success: false, error: 'userId inválido' }, { status: 400 })
      }
      query.userId = new mongoose.Types.ObjectId(userId)
    } else if (userEmail) {
      const userDoc = await User.findOne({ email: userEmail.toLowerCase() }).select('_id')
      if (!userDoc?._id) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, pages: 0 }
        })
      }
      query.userId = userDoc._id
    }

    if (createdBy) {
      if (!mongoose.Types.ObjectId.isValid(createdBy)) {
        return NextResponse.json({ success: false, error: 'createdBy inválido' }, { status: 400 })
      }
      query.createdBy = new mongoose.Types.ObjectId(createdBy)
    } else if (createdByEmail) {
      const creatorDoc = await User.findOne({ email: createdByEmail.toLowerCase() }).select('_id')
      if (!creatorDoc?._id) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, pages: 0 }
        })
      }
      query.createdBy = creatorDoc._id
    }

    if (!includeDismissed) {
      query.dismissedAt = { $exists: false }
    }

    if (dateFrom || dateTo) {
      const createdAtRange: Record<string, unknown> = {}

      if (dateFrom) {
        const from = new Date(dateFrom)
        if (!Number.isNaN(from.getTime())) createdAtRange.$gte = from
      }

      if (dateTo) {
        const to = new Date(dateTo)
        if (!Number.isNaN(to.getTime())) createdAtRange.$lte = to
      }

      if (Object.keys(createdAtRange).length > 0) {
        query.createdAt = createdAtRange
      }
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email role avatar isActive')
        .populate('createdBy', 'firstName lastName email role avatar isActive')
        .lean(),
      Notification.countDocuments(query)
    ])

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error al obtener notificaciones admin:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
