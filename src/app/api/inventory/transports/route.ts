import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { Transport } from '@/models'
import { User } from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const supplier = searchParams.get('supplier') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''

    const filters: any = {}

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'route.origin.city': { $regex: search, $options: 'i' } },
        { 'route.destination.city': { $regex: search, $options: 'i' } }
      ]
    }

    if (supplier) filters.supplier = supplier
    if (status) filters.status = status
    if (type) filters.type = type

    const skip = (page - 1) * limit

    const [transports, total] = await Promise.all([
      Transport.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('supplier', 'name type')
        .populate('createdBy', 'firstName lastName')
        .lean(),
      Transport.countDocuments(filters)
    ])

    return NextResponse.json({
      transports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching transports:', error)
    return NextResponse.json(
      { error: 'Error al obtener transportes', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear transportes' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.supplier || !body.name || !body.route) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const transport = await Transport.create({
      ...body,
      createdBy: session.user.id
    }) as any

    const populatedTransport = await Transport.findById(transport._id)
      .populate('supplier', 'name type')
      .populate('createdBy', 'firstName lastName')
      .lean()

    return NextResponse.json(
      {
        message: 'Transporte creado exitosamente',
        transport: populatedTransport
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating transport:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Error de validación', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear transporte', details: error.message },
      { status: 500 }
    )
  }
}
