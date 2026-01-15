import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'

// GET /api/offers/packages - Listar paquetes con filtros
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
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const destination = searchParams.get('destination')

    // Construir query - Todas las ofertas (package, hotel, flight)
    const query: any = {}

    if (search) {
      query.$text = { $search: search }
    }

    if (status) {
      query.status = status
    }

    if (featured === 'true') {
      query.featured = true
    }

    if (destination) {
      query.$or = [
        { 'destination.city': { $regex: destination, $options: 'i' } },
        { 'destination.country': { $regex: destination, $options: 'i' } }
      ]
    }

    const skip = (page - 1) * limit

    const [packages, total] = await Promise.all([
      Offer.find(query)
        .populate({
          path: 'items.inventoryId',
          select: 'inventoryName resource pricing validFrom validTo availability rooms',
          populate: {
            path: 'resource',
            select: 'name photos location stars policies'
          }
        })
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Offer.countDocuments(query)
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
    console.error('Error al obtener paquetes:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener paquetes' },
      { status: 500 }
    )
  }
}

// POST /api/offers/packages - Crear nuevo paquete
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const data = await request.json()

    // Validaciones básicas
    if (!data.name || !data.code) {
      return NextResponse.json(
        { error: 'Los campos name y code son requeridos' },
        { status: 400 }
      )
    }

    // Generar slug automático basado en el nombre
    const generateSlug = (name: string) => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
        .replace(/^-+|-+$/g, '') // Remover guiones al inicio y final
    }

    let slug = generateSlug(data.name)
    
    // Verificar que el slug sea único
    let slugExists = await Offer.findOne({ slug })
    let counter = 1
    while (slugExists) {
      slug = `${generateSlug(data.name)}-${counter}`
      slugExists = await Offer.findOne({ slug })
      counter++
    }
    
    data.slug = slug

    // Verificar que el código no exista
    const existingPackage = await Offer.findOne({ code: data.code })
    if (existingPackage) {
      return NextResponse.json(
        { error: 'Ya existe un paquete con ese código' },
        { status: 400 }
      )
    }

    // Crear oferta (respetando el tipo enviado)
    const packageData = {
      ...data,
      type: data.type || 'package',
      createdBy: session.user.id,
      updatedBy: session.user.id,
      status: data.status || 'draft'
    }

    const newPackage = await Offer.create(packageData)

    // Poblar para respuesta
    const populatedPackage = await Offer.findById((newPackage as any)._id)
      .populate('items.inventoryId', 'inventoryName resource pricing validFrom validTo availability')
      .populate('createdBy', 'firstName lastName email')
      .lean()

    return NextResponse.json({
      message: 'Paquete creado exitosamente',
      package: populatedPackage
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear paquete:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear paquete' },
      { status: 500 }
    )
  }
}
