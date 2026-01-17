import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import InventoryHotel from '@/models/InventoryHotel'
import InventoryFlight from '@/models/InventoryFlight'
import InventoryTransport from '@/models/InventoryTransport'

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
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Offer.countDocuments(query)
    ])

    // Enriquecer items.inventoryId consultando los inventarios reales (separados)
    const inventoryIdsByType: Record<string, string[]> = {
      Hotel: [],
      Flight: [],
      Transport: []
    }

    for (const pkg of packages as any[]) {
      for (const item of pkg.items || []) {
        const id = item?.inventoryId?.toString()
        if (!id) continue
        if (item.resourceType === 'Hotel') inventoryIdsByType.Hotel.push(id)
        if (item.resourceType === 'Flight') inventoryIdsByType.Flight.push(id)
        if (item.resourceType === 'Transport') inventoryIdsByType.Transport.push(id)
      }
    }

    const hotelIds = Array.from(new Set(inventoryIdsByType.Hotel))
    const flightIds = Array.from(new Set(inventoryIdsByType.Flight))
    const transportIds = Array.from(new Set(inventoryIdsByType.Transport))

    const [hotelInv, flightInv, transportInv] = await Promise.all([
      hotelIds.length
        ? InventoryHotel.find({ _id: { $in: hotelIds } })
            .populate('resource')
            .populate('supplier', 'name businessName type contact')
            .lean()
        : Promise.resolve([]),
      flightIds.length
        ? InventoryFlight.find({ _id: { $in: flightIds } })
            .populate('resource')
            .populate('supplier', 'name businessName type contact')
            .lean()
        : Promise.resolve([]),
      transportIds.length
        ? InventoryTransport.find({ _id: { $in: transportIds } })
            .populate('resource')
            .populate('supplier', 'name businessName type contact')
            .lean()
        : Promise.resolve([])
    ])

    const inventoryMap = new Map<string, any>()
    for (const inv of hotelInv as any[]) inventoryMap.set(inv._id.toString(), inv)
    for (const inv of flightInv as any[]) inventoryMap.set(inv._id.toString(), inv)
    for (const inv of transportInv as any[]) inventoryMap.set(inv._id.toString(), inv)

    for (const pkg of packages as any[]) {
      for (const item of pkg.items || []) {
        const id = item?.inventoryId?.toString()
        if (!id) continue
        const inv = inventoryMap.get(id)
        if (inv) item.inventory = inv
      }
    }

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

    const data: any = await request.json()
    if (Array.isArray(data)) {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

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

    // Validar items: para paquetes, todos los items deben tener inventoryId
    if ((data.type || 'package') === 'package') {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        return NextResponse.json(
          { error: 'Debes agregar al menos un item al paquete' },
          { status: 400 }
        )
      }

      const invalidItem = data.items.find((i: any) => !i?.resourceType)
      if (invalidItem) {
        return NextResponse.json(
          { error: 'Todos los items deben tener resourceType' },
          { status: 400 }
        )
      }

      const itemMissingInventory = data.items.find((i: any) => !i?.inventoryId)
      if (itemMissingInventory) {
        return NextResponse.json(
          { error: 'Todos los items del paquete deben venir de inventario (inventoryId requerido). Para "incluido", selecciona el item $0 del inventario.' },
          { status: 400 }
        )
      }
    }

    // Crear oferta (respetando el tipo enviado)
    const packageData = {
      ...data,
      type: data.type || 'package',
      createdBy: session.user.id,
      updatedBy: session.user.id,
      status: data.status || 'draft'
    }

    const newPackage = await new Offer(packageData).save()

    // Responder con el documento recién creado (sin populate incorrecto)
    const populatedPackage = await Offer.findById(newPackage._id)
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
