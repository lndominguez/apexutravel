import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Flight from '@/models/Flight'
import { User } from '@/models/User'

// GET /api/resources/flights - Listar vuelos del catálogo
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
    const airline = searchParams.get('airline') || ''
    const origin = searchParams.get('origin') || ''
    const destination = searchParams.get('destination') || ''
    const status = searchParams.get('status') || 'active'

    const filters: any = { status }

    if (search) {
      filters.$or = [
        { flightNumber: { $regex: search, $options: 'i' } },
        { 'route.from': { $regex: search, $options: 'i' } },
        { 'route.to': { $regex: search, $options: 'i' } }
      ]
    }

    if (airline) filters.airline = airline
    if (origin) filters['route.from'] = { $regex: origin, $options: 'i' }
    if (destination) filters['route.to'] = { $regex: destination, $options: 'i' }

    const skip = (page - 1) * limit

    const [flights, total] = await Promise.all([
      Flight.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email')
        .lean(),
      Flight.countDocuments(filters)
    ])

    return NextResponse.json({
      flights,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching flights:', error)
    return NextResponse.json(
      { error: 'Error al obtener vuelos', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/resources/flights - Crear nuevo vuelo
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
        { error: 'No tienes permisos para crear vuelos' },
        { status: 403 }
      )
    }

    const body: any = await request.json()
    if (Array.isArray(body)) {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    if (!body.flightNumber || !body.airline || !body.route?.from || !body.route?.to) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: flightNumber, airline, route.from, route.to' },
        { status: 400 }
      )
    }

    const newFlight = await new Flight({
      ...body,
      createdBy: session.user.id,
      status: body.status || 'active'
    }).save()

    const populatedFlight = await Flight.findById(newFlight._id)
      .populate('createdBy', 'firstName lastName email')
      .lean()

    return NextResponse.json(
      { 
        message: 'Vuelo creado exitosamente',
        flight: populatedFlight
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating flight:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Error de validación', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear vuelo', details: error.message },
      { status: 500 }
    )
  }
}
