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
    
    const hotelOffer: any = await Offer.findOne(query).lean()
    
    if (!hotelOffer) {
      return NextResponse.json({ success: false, error: 'Hotel no encontrado' }, { status: 404 })
    }

    // Aplicar markup helper
    const applyMarkup = (basePrice: number, markup: any) => {
      if (!markup || !markup.value) return basePrice
      if (markup.type === 'percentage') {
        return basePrice + (basePrice * markup.value / 100)
      }
      return basePrice + markup.value
    }
    
    // RECONSTRUIR selectedRooms desde InventoryHotel aplicando markup (igual que packages)
    if (hotelOffer.items && hotelOffer.items.length > 0) {
      const hotelResourceCache = new Map<string, any>()

      const hotelItemInventories = hotelOffer.items
        .filter((i: any) => i.resourceType === 'Hotel' && i.inventoryId)
        .map((i: any) => i.inventoryId)

      const inventoryIds = Array.from(
        new Set(hotelItemInventories.map((id: any) => id?.toString()).filter(Boolean))
      )

      const [inventoriesGeneric, inventoriesHotel] = await Promise.all([
        Inventory.find({ _id: { $in: inventoryIds } }).select('resource resourceType inventoryName pricing').lean(),
        InventoryHotel.find({ _id: { $in: inventoryIds } }).select('resource inventoryName pricingMode rooms').lean()
      ])

      const inventoryMap = new Map<string, any>()
      for (const inv of inventoriesGeneric) inventoryMap.set(inv._id.toString(), inv)
      for (const inv of inventoriesHotel) inventoryMap.set(inv._id.toString(), inv)

      for (const item of hotelOffer.items) {
        if (item.resourceType !== 'Hotel') {
          continue
        }

        const inv = item.inventoryId ? inventoryMap.get(item.inventoryId.toString()) : undefined
        const resourceId = item.hotelInfo?.resourceId || inv?.resource
        if (!resourceId || !inv) continue

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

          if (item.hotelInfo && (!item.hotelInfo.photos || item.hotelInfo.photos.length === 0)) {
            item.hotelInfo.photos = hotelResource.photos || []
          }

          if (item.hotelInfo) {
            if (!item.hotelInfo.name && hotelResource.name) item.hotelInfo.name = hotelResource.name
            if (!item.hotelInfo.stars && typeof hotelResource.stars === 'number') item.hotelInfo.stars = hotelResource.stars

            if ((!item.hotelInfo.location || Object.keys(item.hotelInfo.location).length === 0) && hotelResource.location) {
              item.hotelInfo.location = hotelResource.location as any
            }

            item.hotelInfo.policies = {
              ...(hotelResource.policies || {}),
              ...(item.hotelInfo.policies || {})
            }

            ;(item.hotelInfo as any).amenities = hotelResource.amenities || []

            if (!hotelOffer.description && hotelResource.description) {
              hotelOffer.description = hotelResource.description
            }
          }

          // RECONSTRUIR selectedRooms desde InventoryHotel aplicando markup de la oferta
          item.selectedRooms = (inv.rooms || []).map((invRoom: any) => {
            const roomType = hotelResource.roomTypes?.find((rt: any) =>
              rt._id?.toString() === invRoom.roomType?.toString()
            )

            // Aplicar markup a capacityPrices
            const capacityPricesWithMarkup: any = {}
            if (invRoom.capacityPrices) {
              for (const [occupancy, prices] of Object.entries(invRoom.capacityPrices)) {
                if (prices && typeof prices === 'object') {
                  capacityPricesWithMarkup[occupancy] = {
                    adult: applyMarkup((prices as any).adult || 0, hotelOffer.markup),
                    child: applyMarkup((prices as any).child || 0, hotelOffer.markup),
                    infant: 0
                  }
                }
              }
            }

            return {
              roomTypeId: invRoom.roomType,
              name: invRoom.roomName || roomType?.name || 'Habitación',
              plan: 'Standard',
              capacityPrices: capacityPricesWithMarkup,
              stock: invRoom.stock || 0,
              images: roomType?.images || [],
              category: roomType?.category,
              occupancy: roomType?.occupancy,
              viewType: roomType?.viewType,
              amenities: roomType?.amenities,
              validFrom: invRoom.validFrom,
              validTo: invRoom.validTo
            }
          })

          // Ordenar habitaciones por tipo de ocupación (simple, doble, triple, quad)
          const occupancyOrder: { [key: string]: number } = {
            'single': 1,
            'double': 2,
            'triple': 3,
            'quad': 4
          }
          
          item.selectedRooms.sort((a: any, b: any) => {
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
    
    return NextResponse.json({ success: true, data: hotelOffer })
  } catch (error: any) {
    console.error('Error fetching hotel:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener hotel' },
      { status: 500 }
    )
  }
}
