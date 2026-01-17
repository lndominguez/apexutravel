import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { Supplier } from '@/models'
import { User } from '@/models/User'

// GET /api/resources/suppliers - Listar proveedores con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const country = searchParams.get('country') || ''

    // Construir filtros
    const filters: any = {}

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { legalName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    if (type) {
      filters.type = type
    }

    if (status) {
      filters.status = status
    }

    if (country) {
      filters['address.country'] = country
    }

    // Calcular skip para paginación
    const skip = (page - 1) * limit

    // Ejecutar consulta
    const [suppliers, total] = await Promise.all([
      Supplier.find(filters)
        .select('-documents') // Excluir documentos para optimizar
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email')
        .lean(),
      Supplier.countDocuments(filters)
    ])

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedores', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/resources/suppliers - Crear nuevo proveedor
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    // Verificar permisos (admin o manager)
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear proveedores' },
        { status: 403 }
      )
    }

    const body: any = await request.json()
    if (Array.isArray(body)) {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    // Validaciones básicas
    if (!body.name || !body.type || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, type, email, phone' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un proveedor con el mismo taxId
    if (body.taxId) {
      const existingSupplier = await Supplier.findOne({ taxId: body.taxId })
      if (existingSupplier) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor con este RFC/NIT' },
          { status: 400 }
        )
      }
    }

    // Crear proveedor
    const newSupplier = await new Supplier({
      ...body,
      createdBy: session.user.id,
      status: body.status || 'pending_approval'
    }).save()

    // Poblar el createdBy para la respuesta
    const populatedSupplier = await Supplier.findById(newSupplier._id)
      .populate('createdBy', 'firstName lastName email')
      .lean()

    return NextResponse.json(
      { 
        message: 'Proveedor creado exitosamente',
        supplier: populatedSupplier || newSupplier
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating supplier:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Error de validación', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear proveedor', details: error.message },
      { status: 500 }
    )
  }
}
