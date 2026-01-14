import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { Hotel } from '@/models'
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
    const status = searchParams.get('status') || ''
    const city = searchParams.get('city') || ''
    const stars = searchParams.get('stars') || ''

    const filters: any = {}

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ]
    }

    if (status) filters.status = status
    if (city) filters['location.city'] = { $regex: city, $options: 'i' }
    if (stars) filters.stars = parseInt(stars)

    const skip = (page - 1) * limit

    const [hotels, total] = await Promise.all([
      Hotel.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName')
        .lean(),
      Hotel.countDocuments(filters)
    ])

    return NextResponse.json({
      hotels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching hotels:', error)
    return NextResponse.json(
      { error: 'Error al obtener hoteles', details: error.message },
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
        { error: 'No tienes permisos para crear hoteles' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.name || !body.location || !body.description) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, location, description' },
        { status: 400 }
      )
    }

    const hotel = await Hotel.create({
      ...body,
      createdBy: session.user.id
    }) as any

    const populatedHotel = await Hotel.findById(hotel._id)
      .populate('createdBy', 'firstName lastName')
      .lean()

    return NextResponse.json(
      {
        message: 'Hotel creado exitosamente',
        hotel: populatedHotel
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating hotel:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Error de validación', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear hotel', details: error.message },
      { status: 500 }
    )
  }
}
