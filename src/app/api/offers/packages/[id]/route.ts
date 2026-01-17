import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import InventoryHotel from '@/models/InventoryHotel'
import InventoryFlight from '@/models/InventoryFlight'
import InventoryTransport from '@/models/InventoryTransport'
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

    // Cargar datos completos del inventario (Hotel/Flight/Transport) y hotel resource
    if (packageData.items && packageData.items.length > 0) {
      const hotelIds = Array.from(new Set(
        packageData.items
          .filter((i: any) => i.resourceType === 'Hotel' && i.inventoryId)
          .map((i: any) => i.inventoryId.toString())
      ))
      const flightIds = Array.from(new Set(
        packageData.items
          .filter((i: any) => i.resourceType === 'Flight' && i.inventoryId)
          .map((i: any) => i.inventoryId.toString())
      ))
      const transportIds = Array.from(new Set(
        packageData.items
          .filter((i: any) => i.resourceType === 'Transport' && i.inventoryId)
          .map((i: any) => i.inventoryId.toString())
      ))

      const [inventoriesHotel, inventoriesFlight, inventoriesTransport] = await Promise.all([
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
      for (const inv of inventoriesHotel as any[]) inventoryMap.set(inv._id.toString(), inv)
      for (const inv of inventoriesFlight as any[]) inventoryMap.set(inv._id.toString(), inv)
      for (const inv of inventoriesTransport as any[]) inventoryMap.set(inv._id.toString(), inv)

      // Cargar hotel resources extra (para fotos/amenities)
      const hotelResourceIds = Array.from(new Set(
        (inventoriesHotel as any[])
          .map((inv: any) => inv.resource?._id?.toString?.() || inv.resource?.toString?.())
          .filter(Boolean)
      ))

      const hotelResources = hotelResourceIds.length
        ? await Hotel.find({ _id: { $in: hotelResourceIds } })
            .select('name stars location photos amenities policies roomTypes description')
            .lean()
        : []

      const hotelResourceMap = new Map<string, any>()
      for (const hotel of hotelResources as any[]) hotelResourceMap.set(hotel._id.toString(), hotel)

      // Enriquecer items con datos del inventario (todos los tipos)
      for (const item of packageData.items) {
        if (!item.inventoryId) continue
        const inv = inventoryMap.get(item.inventoryId.toString())
        if (inv) {
          item.inventory = inv
          if (item.resourceType === 'Hotel') {
            const resId = inv.resource?._id?.toString?.() || inv.resource?.toString?.()
            const hotelResource = resId ? hotelResourceMap.get(resId) : null
            if (hotelResource) item.hotelResource = hotelResource
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

    // Preparar datos para actualizar (metadatos + items si vienen)
    const updateData = { ...data }

    // Validar items si vienen en el payload
    if (Array.isArray((updateData as any).items)) {
      if ((updateData as any).items.length === 0) {
        return NextResponse.json(
          { error: 'Debes agregar al menos un item al paquete' },
          { status: 400 }
        )
      }

      const invalidType = (updateData as any).items.find((i: any) => !i?.resourceType)
      if (invalidType) {
        return NextResponse.json(
          { error: 'Todos los items deben tener resourceType' },
          { status: 400 }
        )
      }

      const missingInventory = (updateData as any).items.find((i: any) => !i?.inventoryId)
      if (missingInventory) {
        return NextResponse.json(
          { error: 'Todos los items del paquete deben venir de inventario (inventoryId requerido).' },
          { status: 400 }
        )
      }
    }

    delete updateData._id
    delete updateData.createdAt
    delete updateData.createdBy
    updateData.updatedBy = session.user.id

    // Usar findByIdAndUpdate para actualizar (incluyendo items si vienen)
    const updatedPackage = await Offer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
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
