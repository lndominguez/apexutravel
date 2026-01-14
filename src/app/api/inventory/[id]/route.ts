import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { InventoryHotel, InventoryFlight, InventoryTransport } from '@/models'

// GET /api/inventory/[id] - Obtener un item específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    // Buscar en los 3 modelos específicos
    let item = await InventoryHotel.findById(id)
      .populate('resource')
      .populate('supplier', 'name businessName type contact')
      .lean()
    
    if (!item) {
      item = await InventoryFlight.findById(id)
        .populate('resource')
        .populate('supplier', 'name businessName type contact')
        .lean()
    }
    
    if (!item) {
      item = await InventoryTransport.findById(id)
        .populate('resource')
        .populate('supplier', 'name businessName type contact')
        .lean()
    }

    if (!item) {
      return NextResponse.json(
        { error: 'Item de inventario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)

  } catch (error: any) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { error: 'Error al obtener item de inventario', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/inventory/[id] - Actualizar item de inventario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    const data = await request.json()

    // Buscar en los 3 modelos específicos
    let item = await InventoryHotel.findById(id)
    let Model = InventoryHotel
    
    if (!item) {
      item = await InventoryFlight.findById(id)
      Model = InventoryFlight
    }
    
    if (!item) {
      item = await InventoryTransport.findById(id)
      Model = InventoryTransport
    }
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item de inventario no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar campos
    Object.keys(data).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'createdBy') {
        item[key] = data[key]
      }
    })

    item.updatedBy = session.user.id
    await item.save()

    // Poblar para respuesta
    await item.populate('resource')
    await item.populate('supplier', 'name businessName type')

    return NextResponse.json({
      message: 'Item de inventario actualizado exitosamente',
      item
    })

  } catch (error: any) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { error: 'Error al actualizar item de inventario', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/inventory/[id] - Eliminar item de inventario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    // Buscar en los 3 modelos específicos
    let item = await InventoryHotel.findById(id)
    
    if (!item) {
      item = await InventoryFlight.findById(id)
    }
    
    if (!item) {
      item = await InventoryTransport.findById(id)
    }
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item de inventario no encontrado' },
        { status: 404 }
      )
    }

    // Soft delete: cambiar status a inactive
    item.status = 'inactive'
    item.updatedBy = session.user.id
    await item.save()

    return NextResponse.json({
      message: 'Item de inventario eliminado exitosamente'
    })

  } catch (error: any) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { error: 'Error al eliminar item de inventario', details: error.message },
      { status: 500 }
    )
  }
}
