import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { Flight } from '@/models'
import { User } from '@/models/User'

// GET /api/inventory/flights - Listar vuelos con filtros
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
    const departureAirport = searchParams.get('departureAirport') || ''
    const arrivalAirport = searchParams.get('arrivalAirport') || ''

    const filters: any = {}

    if (search) {
      filters.$or = [
        { flightNumber: { $regex: search, $options: 'i' } },
        { airline: { $regex: search, $options: 'i' } }
      ]
    }

    if (supplier) filters.supplier = supplier
    if (status) filters.status = status
    if (departureAirport) filters['departure.airport'] = departureAirport
    if (arrivalAirport) filters['arrival.airport'] = arrivalAirport

    const skip = (page - 1) * limit

    const [flights, total] = await Promise.all([
      Flight.find(filters)
        .sort({ 'departure.dateTime': -1 })
        .skip(skip)
        .limit(limit)
        .populate('supplier', 'name type')
        .populate('createdBy', 'firstName lastName')
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

// POST /api/inventory/flights - Crear nuevo vuelo
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

    const body = await request.json()

    // Validaciones básicas
    if (!body.supplier || !body.flightNumber || !body.airline || !body.departure || !body.arrival) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const flight = await Flight.create({
      ...body,
      createdBy: session.user.id
    }) as any

    const populatedFlight = await Flight.findById(flight._id)
      .populate('supplier', 'name type')
      .populate('createdBy', 'firstName lastName')
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
