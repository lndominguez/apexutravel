import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { Package } from '@/models'
import { User } from '@/models/User'

// GET /api/inventory/packages - Listar paquetes con filtros
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
    const destination = searchParams.get('destination') || ''
    const minPrice = searchParams.get('minPrice') || ''
    const maxPrice = searchParams.get('maxPrice') || ''

    const filters: any = {}

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (status) filters.status = status
    if (destination) filters.destination = { $regex: destination, $options: 'i' }
    
    if (minPrice || maxPrice) {
      filters['pricing.totalPrice'] = {}
      if (minPrice) filters['pricing.totalPrice'].$gte = parseFloat(minPrice)
      if (maxPrice) filters['pricing.totalPrice'].$lte = parseFloat(maxPrice)
    }

    const skip = (page - 1) * limit

    const [packages, total] = await Promise.all([
      Package.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('components.flights.flight', 'flightNumber airline departure arrival')
        .populate('components.hotels.hotel', 'name location category')
        .populate('components.transports.transport', 'type route')
        .populate('createdBy', 'firstName lastName')
        .lean(),
      Package.countDocuments(filters)
    ])

    return NextResponse.json({
      packages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Error al obtener paquetes', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/inventory/packages - Crear nuevo paquete
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
        { error: 'No tienes permisos para crear paquetes' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validaciones básicas
    if (!body.name || !body.destination || !body.duration) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, destination, duration' },
        { status: 400 }
      )
    }

    // Mantener la estructura de precios que viene del formulario
    // El nuevo modal envía: costPerPerson, sellingPricePerPerson, markup, currency
    const packageData = {
      ...body,
      createdBy: session.user.id,
      status: body.status || 'draft'
    }

    const newPackage = await Package.create(packageData) as any

    const populatedPackage = await Package.findById(newPackage._id)
      .populate('components.flights.flight', 'flightNumber airline departure arrival')
      .populate('components.hotels.hotel', 'name location category')
      .populate('components.transports.transport', 'type route')
      .populate('createdBy', 'firstName lastName')
      .lean()

    return NextResponse.json(
      {
        message: 'Paquete creado exitosamente',
        package: populatedPackage
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating package:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Error de validación', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear paquete', details: error.message },
      { status: 500 }
    )
  }
}
