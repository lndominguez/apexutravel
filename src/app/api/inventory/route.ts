import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { InventoryHotel, InventoryFlight, InventoryTransport } from '@/models'

// GET /api/inventory - Obtener items de inventario con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const resourceType = searchParams.get('resourceType')
    const supplier = searchParams.get('supplier')
    const status = searchParams.get('status') || 'active'
    const season = searchParams.get('season')
    const pricingMode = searchParams.get('pricingMode')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Construir filtros
    const filters: any = {}
    
    if (resourceType) {
      filters.resourceType = resourceType
    }
    
    if (supplier) {
      filters.supplier = supplier
    }
    
    if (status) {
      filters.status = status
    }
    
    if (season) {
      filters.season = season
    }
    
    if (pricingMode) {
      filters.pricingMode = pricingMode
    }


    // Consulta con paginación - usar modelo específico según resourceType
    const skip = (page - 1) * limit
    
    let items: any[] = []
    let total = 0
    
    if (resourceType) {
      // Si se especifica resourceType, consultar solo ese modelo
      const Model = resourceType === 'Hotel' ? InventoryHotel :
                    resourceType === 'Flight' ? InventoryFlight :
                    InventoryTransport
      
      const [data, count] = await Promise.all([
        Model.find(filters)
          .populate('resource')
          .populate('supplier', 'name businessName type contact')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Model.countDocuments(filters)
      ])
      
      items = data
      total = count
    } else {
      // Si no se especifica, consultar en todos los modelos
      const [hotelItems, flightItems, transportItems] = await Promise.all([
        InventoryHotel.find(filters)
          .populate('resource')
          .populate('supplier', 'name businessName type contact')
          .sort({ createdAt: -1 })
          .lean(),
        InventoryFlight.find(filters)
          .populate('resource')
          .populate('supplier', 'name businessName type contact')
          .sort({ createdAt: -1 })
          .lean(),
        InventoryTransport.find(filters)
          .populate('resource')
          .populate('supplier', 'name businessName type contact')
          .sort({ createdAt: -1 })
          .lean()
      ])
      
      // Combinar y ordenar todos los items
      const allItems = [...hotelItems, ...flightItems, ...transportItems]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      total = allItems.length
      items = allItems.slice(skip, skip + limit)
    }

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Error al obtener inventario', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/inventory - Crear nuevo item de inventario
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const data = await request.json()
    
    // Debug: Ver datos recibidos
    console.log('📦 Datos recibidos en API:', JSON.stringify(data, null, 2))

    // Validar datos requeridos
    if (!data.inventoryCode || !data.inventoryName) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: inventoryCode, inventoryName' },
        { status: 400 }
      )
    }

    if (!data.resource || !data.resourceType || !data.supplier) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: resource, resourceType, supplier' },
        { status: 400 }
      )
    }

    // Validaciones específicas por tipo
    if (data.resourceType === 'Hotel') {
      if (!data.rooms || !Array.isArray(data.rooms) || data.rooms.length === 0) {
        return NextResponse.json(
          { error: 'Debes incluir al menos una habitación en el inventario (rooms array)' },
          { status: 400 }
        )
      }
      
      // Validar cada habitación
      for (const room of data.rooms) {
        if (!room.roomType || !room.roomName) {
          return NextResponse.json(
            { error: 'Cada habitación debe tener roomType y roomName' },
            { status: 400 }
          )
        }
        if (room.stock === undefined || room.stock === null || room.stock < 0) {
          return NextResponse.json(
            { error: 'Cada habitación debe tener stock válido' },
            { status: 400 }
          )
        }
        if (!room.capacityPrices || typeof room.capacityPrices !== 'object') {
          return NextResponse.json(
            { error: 'Cada habitación debe tener capacityPrices (precios por capacidad)' },
            { status: 400 }
          )
        }
      }
    }

    // Seleccionar modelo específico según resourceType
    const Model = data.resourceType === 'Hotel' ? InventoryHotel :
                  data.resourceType === 'Flight' ? InventoryFlight :
                  data.resourceType === 'Transport' ? InventoryTransport :
                  null

    if (!Model) {
      return NextResponse.json(
        { error: 'Tipo de recurso no válido' },
        { status: 400 }
      )
    }

    // Crear item de inventario con el modelo específico
    const inventoryItem = new Model({
      ...data,
      createdBy: session.user.id,
      updatedBy: session.user.id
    })
    
    console.log('💾 Item a guardar:', JSON.stringify(inventoryItem.toObject(), null, 2))

    await inventoryItem.save()

    // Poblar referencias para respuesta
    await inventoryItem.populate('resource')
    await inventoryItem.populate('supplier', 'name businessName type')

    return NextResponse.json({
      message: 'Item de inventario creado exitosamente',
      item: inventoryItem
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Error al crear item de inventario', details: error.message },
      { status: 500 }
    )
  }
}
