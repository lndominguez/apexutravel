import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import Hotel from '@/models/Hotel'
import Inventory from '@/models/Inventory'
import InventoryHotel from '@/models/InventoryHotel'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/public/booking/hotels/[slug] - Detalle de hotel para booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB()
    const { slug } = await params
    
    const query: any = { type: 'hotel', status: 'published' }
    
    if (mongoose.isValidObjectId(slug)) {
      query.$or = [{ slug: slug }, { _id: slug }]
    } else {
      query.slug = slug
    }
    
    // Obtener la oferta (no asumimos que inventoryId referencia siempre el mismo modelo).
    const hotel = await Offer.findOne(query).lean()
    
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel no encontrado' }, { status: 404 })
    }
    
    // Enriquecer selectedRooms con fotos del hotel resource
    if (hotel.items && hotel.items.length > 0) {
      const hotelResourceCache = new Map<string, any>()

      const hotelItemInventories = hotel.items
        .filter((i: any) => i.resourceType === 'Hotel' && i.inventoryId)
        .map((i: any) => i.inventoryId)

      const inventoryIds = Array.from(
        new Set(hotelItemInventories.map((id: any) => id?.toString()).filter(Boolean))
      )

      const [inventoriesGeneric, inventoriesHotel] = await Promise.all([
        Inventory.find({ _id: { $in: inventoryIds } }).select('resource resourceType').lean(),
        InventoryHotel.find({ _id: { $in: inventoryIds } }).select('resource').lean()
      ])

      const inventoryMap = new Map<string, any>()
      for (const inv of inventoriesGeneric) inventoryMap.set(inv._id.toString(), inv)
      for (const inv of inventoriesHotel) inventoryMap.set(inv._id.toString(), inv)

      for (const item of hotel.items) {
        if (item.resourceType !== 'Hotel' || !item.selectedRooms || item.selectedRooms.length === 0) {
          continue
        }

        const inv = item.inventoryId ? inventoryMap.get(item.inventoryId.toString()) : undefined

        // 1) Preferir el resourceId persistido en la oferta (si existe)
        // 2) Fallback: obtener el Hotel._id desde el inventario (InventoryHotel.resource / Inventory.resource)
        const resourceId = item.hotelInfo?.resourceId || inv?.resource

        if (!resourceId) continue

        try {
          const cacheKey = resourceId.toString()
          let hotelResource = hotelResourceCache.get(cacheKey)

          if (!hotelResource) {
            hotelResource = await Hotel.findById(resourceId)
              .select('name stars location photos amenities policies roomTypes description')
              .lean()
            hotelResourceCache.set(cacheKey, hotelResource)
          }

          if (!hotelResource) continue

          // Agregar fotos del hotel si no existen en hotelInfo
          if (item.hotelInfo && (!item.hotelInfo.photos || item.hotelInfo.photos.length === 0)) {
            item.hotelInfo.photos = hotelResource.photos || []
          }

          if (item.hotelInfo) {
            if (!item.hotelInfo.name && hotelResource.name) item.hotelInfo.name = hotelResource.name
            if (!item.hotelInfo.stars && typeof hotelResource.stars === 'number') item.hotelInfo.stars = hotelResource.stars

            if ((!item.hotelInfo.location || Object.keys(item.hotelInfo.location).length === 0) && hotelResource.location) {
              item.hotelInfo.location = hotelResource.location as any
            }

            // Enriquecer políticas para poder mostrar cancelación/niños/mascotas en Tabs
            item.hotelInfo.policies = {
              ...(hotelResource.policies || {}),
              ...(item.hotelInfo.policies || {})
            }

            // Agregar amenidades del hotel (no están en el schema, pero sí para consumo frontend)
            ;(item.hotelInfo as any).amenities = hotelResource.amenities || []

            // Agregar descripción del hotel si no existe en la oferta
            if (!(hotel as any).description && hotelResource.description) {
              ;(hotel as any).description = hotelResource.description
            }
          }

          // Enriquecer cada selectedRoom con las fotos de su roomType
          item.selectedRooms = item.selectedRooms.map((room: any) => {
            const roomType = hotelResource.roomTypes?.find((rt: any) =>
              rt._id?.toString() === room.roomTypeId?.toString()
            )

            if (roomType) {
              return {
                ...room,
                images: roomType.images || [],
                category: roomType.category,
                occupancy: roomType.occupancy,
                viewType: roomType.viewType,
                amenities: roomType.amenities
              }
            }
            return room
          })

          // Ordenar habitaciones por tipo de ocupación (simple, doble, triple, quad)
          const occupancyOrder: { [key: string]: number } = {
            'single': 1,
            'double': 2,
            'triple': 3,
            'quad': 4
          }
          
          item.selectedRooms.sort((a: any, b: any) => {
            // Obtener el primer tipo de ocupación de cada habitación
            const occupancyA = a.occupancy?.[0] || 'quad'
            const occupancyB = b.occupancy?.[0] || 'quad'
            
            const orderA = occupancyOrder[occupancyA] || 999
            const orderB = occupancyOrder[occupancyB] || 999
            
            return orderA - orderB
          })
        } catch (resourceError) {
          console.error('Error fetching hotel resource:', resourceError)
        }
      }
    }
    
    return NextResponse.json({ success: true, data: hotel })
  } catch (error: any) {
    console.error('Error fetching hotel:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener hotel' },
      { status: 500 }
    )
  }
}
