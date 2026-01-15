import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import Hotel from '@/models/Hotel'
import Inventory from '@/models/Inventory'
import InventoryHotel from '@/models/InventoryHotel'

// GET /api/offers/hotels/[id] - Obtener una oferta de hotel específica
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
    const hotel: any = await Offer.findOne({ _id: id, type: 'hotel' })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean()

    if (!hotel) {
      return NextResponse.json(
        { error: 'Oferta de hotel no encontrada' },
        { status: 404 }
      )
    }

    // Cargar datos completos del inventario y hotel resource
    if (hotel.items && hotel.items.length > 0) {
      const hotelItems = hotel.items.filter((i: any) => i.resourceType === 'Hotel' && i.inventoryId)
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
        for (const hotelRes of hotelResources) {
          hotelResourceMap.set(hotelRes._id.toString(), hotelRes)
        }

        // Enriquecer items con datos del inventario y hotel
        for (const item of hotel.items) {
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

    // Calcular days desde nights si existe
    if (hotel.duration?.nights) {
      hotel.duration.days = hotel.duration.nights + 1
    }

    return NextResponse.json(hotel)
  } catch (error: any) {
    console.error('Error al obtener oferta de hotel:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener oferta de hotel' },
      { status: 500 }
    )
  }
}

// PUT /api/offers/hotels/[id] - Actualizar oferta de hotel
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
    const updates = await request.json()
    
    console.log('🔍 UPDATE HOTEL - ID:', id)
    console.log('📦 Updates recibidos:', JSON.stringify(updates, null, 2))

    // Verificar que la oferta existe y es de tipo hotel
    const existingHotel = await Offer.findOne({ _id: id, type: 'hotel' })
    if (!existingHotel) {
      console.error('❌ Oferta no encontrada:', id)
      return NextResponse.json(
        { error: 'Oferta de hotel no encontrada' },
        { status: 404 }
      )
    }
    
    console.log('✅ Oferta existente encontrada:', existingHotel.name)

    // Si se cambia el código, verificar que no exista otro con el mismo
    if (updates.code && updates.code !== existingHotel.code) {
      const codeExists = await Offer.findOne({ 
        code: updates.code, 
        _id: { $ne: id } 
      })
      if (codeExists) {
        console.error('❌ Código duplicado:', updates.code)
        return NextResponse.json(
          { error: 'Ya existe una oferta con ese código' },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualización
    const updateData = {
      ...updates,
      updatedBy: session.user.id,
      updatedAt: new Date()
    }
    
    console.log('💾 Intentando guardar con:', JSON.stringify(updateData, null, 2))

    // Actualizar
    const updatedHotel = await Offer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .lean()
    
    console.log('✅ Oferta actualizada exitosamente:', updatedHotel?._id)

    // Enriquecer items con datos del hotel resource si existen
    if (updatedHotel && updatedHotel.items && updatedHotel.items.length > 0) {
      for (const item of updatedHotel.items) {
        if (item.resourceType === 'Hotel' && item.hotelInfo?.resourceId) {
          try {
            const hotelResource = await Hotel.findById(item.hotelInfo.resourceId)
              .select('name stars location photos amenities policies description')
              .lean()
            
            if (hotelResource) {
              item.hotelInfo = hotelResource
            }
          } catch (err) {
            console.error('Error loading hotel resource:', err)
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Oferta de hotel actualizada exitosamente',
      hotel: updatedHotel
    })
  } catch (error: any) {
    console.error('Error al actualizar oferta de hotel:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar oferta de hotel' },
      { status: 500 }
    )
  }
}

// DELETE /api/offers/hotels/[id] - Eliminar oferta de hotel (soft delete por defecto, permanente con ?permanent=true)
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

    const hotel = await Offer.findOne({ _id: id, type: 'hotel' })
    if (!hotel) {
      return NextResponse.json(
        { error: 'Oferta de hotel no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que no esté publicado si se intenta eliminar permanentemente
    if (isPermanent && hotel.status === 'published') {
      return NextResponse.json(
        { error: 'No se puede eliminar una oferta publicada. Primero debes archivarla.' },
        { status: 400 }
      )
    }

    if (isPermanent) {
      // Eliminación permanente
      await Offer.findByIdAndDelete(id)
      return NextResponse.json({
        message: 'Oferta de hotel eliminada permanentemente'
      })
    } else {
      // Soft delete: cambiar status a archived
      hotel.status = 'archived'
      hotel.updatedBy = session.user.id as any
      await hotel.save()

      return NextResponse.json({
        message: 'Oferta de hotel archivada exitosamente'
      })
    }
  } catch (error: any) {
    console.error('Error al eliminar oferta de hotel:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar oferta de hotel' },
      { status: 500 }
    )
  }
}
