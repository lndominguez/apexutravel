import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import Inventory from '@/models/Inventory'
import InventoryHotel from '@/models/InventoryHotel'
import Hotel from '@/models/Hotel'

// GET /api/offers/packages/[id] - Obtener paquete por ID
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

    const packageData: any = await Offer.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean()

    if (!packageData) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      )
    }

    // Cargar datos completos del inventario y hotel resource
    if (packageData.items && packageData.items.length > 0) {
      const hotelItems = packageData.items.filter((i: any) => i.resourceType === 'Hotel' && i.inventoryId)
      const inventoryIds = hotelItems.map((i: any) => i.inventoryId)

      if (inventoryIds.length > 0) {
        const [inventoriesGeneric, inventoriesHotel] = await Promise.all([
          Inventory.find({ _id: { $in: inventoryIds } }).select('resource resourceType inventoryName pricing').lean(),
          InventoryHotel.find({ _id: { $in: inventoryIds } }).select('resource inventoryName pricingMode rooms').lean()
        ])

        const inventoryMap = new Map<string, any>()
        for (const inv of inventoriesGeneric) inventoryMap.set(inv._id.toString(), inv)
        for (const inv of inventoriesHotel) inventoryMap.set(inv._id.toString(), inv)

        // Cargar hotel resources
        const resourceIds = Array.from(new Set(
          [...inventoriesGeneric, ...inventoriesHotel]
            .map((inv: any) => inv.resource?.toString())
            .filter(Boolean)
        ))

        const hotelResources = await Hotel.find({ _id: { $in: resourceIds } })
          .select('name stars location photos amenities policies roomTypes description')
          .lean()

        const hotelResourceMap = new Map<string, any>()
        for (const hotel of hotelResources) {
          hotelResourceMap.set(hotel._id.toString(), hotel)
        }

        // Enriquecer items con datos del inventario y hotel
        for (const item of packageData.items) {
          if (item.resourceType === 'Hotel' && item.inventoryId) {
            const inv = inventoryMap.get(item.inventoryId.toString())
            if (inv) {
              item.inventory = inv
              const hotelResource = hotelResourceMap.get(inv.resource?.toString())
              if (hotelResource) {
                item.hotelResource = hotelResource
              }
            }
          }
        }
      }
    }

    // Calcular days desde nights
    if (packageData.duration?.nights) {
      packageData.duration.days = packageData.duration.nights + 1
    }

    return NextResponse.json(packageData)
  } catch (error: any) {
    console.error('Error al obtener paquete:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener paquete' },
      { status: 500 }
    )
  }
}

// PUT /api/offers/packages/[id] - Actualizar paquete
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

    const packageData = await Offer.findById(id)

    if (!packageData) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos para actualizar (solo metadatos, NO tocar items)
    const updateData = { ...data }
    // No permitimos actualizar items desde este endpoint de edición,
    // para evitar problemas con inventoryId y mantener integridad.
    if ('items' in updateData) {
      delete (updateData as any).items
    }
    delete updateData._id
    delete updateData.createdAt
    delete updateData.createdBy
    updateData.updatedBy = session.user.id

    // Usar findByIdAndUpdate para actualizar metadatos sin revalidar items existentes
    const updatedPackage = await Offer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate('items.inventoryId', 'inventoryName resource pricing validFrom validTo availability rooms')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean()

    return NextResponse.json({
      message: 'Paquete actualizado exitosamente',
      package: updatedPackage
    })
  } catch (error: any) {
    console.error('Error al actualizar paquete:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar paquete' },
      { status: 500 }
    )
  }
}

// DELETE /api/offers/packages/[id] - Eliminar paquete (soft delete por defecto, permanente con ?permanent=true)
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
    const { searchParams } = new URL(request.url)
    const isPermanent = searchParams.get('permanent') === 'true'

    const packageData = await Offer.findById(id)

    if (!packageData) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no esté publicado si se intenta eliminar permanentemente
    if (isPermanent && packageData.status === 'published') {
      return NextResponse.json(
        { error: 'No se puede eliminar una oferta publicada. Primero debes archivarla.' },
        { status: 400 }
      )
    }

    if (isPermanent) {
      // Eliminación permanente
      await Offer.findByIdAndDelete(id)
      return NextResponse.json({
        message: 'Paquete eliminado permanentemente'
      })
    } else {
      // Soft delete: cambiar status a archived
      packageData.status = 'archived'
      packageData.updatedBy = session.user.id as any
      await packageData.save()

      return NextResponse.json({
        message: 'Paquete archivado exitosamente'
      })
    }
  } catch (error: any) {
    console.error('Error al eliminar paquete:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar paquete' },
      { status: 500 }
    )
  }
}
