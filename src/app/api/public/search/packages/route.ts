import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import Inventory from '@/models/Inventory'
import InventoryHotel from '@/models/InventoryHotel'
import Hotel from '@/models/Hotel'
import '@/models/Flight'
import '@/models/Transport'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/public/search/packages - Búsqueda pública de paquetes turísticos
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const destination = searchParams.get('destination') || ''
    const status = searchParams.get('status') || 'published'
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined
    
    const andConditions: any[] = [{ type: 'package' }, { status }]
    
    if (destination) {
      andConditions.push({
        $or: [
          { 'destination.city': { $regex: destination, $options: 'i' } },
          { 'destination.country': { $regex: destination, $options: 'i' } },
          { name: { $regex: destination, $options: 'i' } }
        ]
      })
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {}
      if (minPrice !== undefined) priceFilter.$gte = minPrice
      if (maxPrice !== undefined) priceFilter.$lte = maxPrice
      andConditions.push({ 'pricing.finalPrice': priceFilter })
    }
    
    const filters = andConditions.length > 1 ? { $and: andConditions } : andConditions[0]
    
    const packages: any[] = await Offer.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-createdBy -updatedBy -__v')
      .lean()
    
    // Enriquecer con datos del hotel resource para mostrar fotos correctas
    if (packages && packages.length > 0) {
      const hotelItems = packages.flatMap((pkg: any) => 
        pkg.items?.filter((i: any) => i.resourceType === 'Hotel' && i.inventoryId) || []
      )
      const inventoryIds = [...new Set(hotelItems.map((i: any) => i.inventoryId?.toString()).filter(Boolean))]

      if (inventoryIds.length > 0) {
        const [inventoriesGeneric, inventoriesHotel] = await Promise.all([
          Inventory.find({ _id: { $in: inventoryIds } }).select('resource resourceType inventoryName').lean(),
          InventoryHotel.find({ _id: { $in: inventoryIds } }).select('resource inventoryName').lean()
        ])

        const inventoryMap = new Map<string, any>()
        for (const inv of inventoriesGeneric) inventoryMap.set(inv._id.toString(), inv)
        for (const inv of inventoriesHotel) inventoryMap.set(inv._id.toString(), inv)

        const resourceIds = [...new Set(
          [...inventoriesGeneric, ...inventoriesHotel]
            .map((inv: any) => inv.resource?.toString())
            .filter(Boolean)
        )]

        const hotelResources = await Hotel.find({ _id: { $in: resourceIds } })
          .select('name stars location photos')
          .lean()

        const hotelResourceMap = new Map<string, any>()
        for (const hotel of hotelResources) {
          hotelResourceMap.set(hotel._id.toString(), hotel)
        }

        // Enriquecer hotelInfo con fotos del resource
        for (const pkg of packages) {
          if (pkg.items) {
            for (const item of pkg.items) {
              if (item.resourceType === 'Hotel' && item.inventoryId) {
                const inv = inventoryMap.get(item.inventoryId.toString())
                if (inv) {
                  const hotelResource = hotelResourceMap.get(inv.resource?.toString())
                  if (hotelResource && item.hotelInfo) {
                    item.hotelInfo.photos = hotelResource.photos || []
                    item.hotelInfo.name = hotelResource.name || item.hotelInfo.name
                    item.hotelInfo.stars = hotelResource.stars || item.hotelInfo.stars
                    if (hotelResource.location) {
                      item.hotelInfo.location = {
                        city: hotelResource.location.city || item.hotelInfo.location?.city,
                        country: hotelResource.location.country || item.hotelInfo.location?.country
                      }
                    }
                  }
                }
              }
            }
          }
          // Calcular days desde nights
          if (pkg.duration?.nights) {
            pkg.duration.days = pkg.duration.nights + 1
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      packages: packages || [], 
      total: packages?.length || 0 
    })
  } catch (error: any) {
    console.error('Error en /api/public/search/packages:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error al buscar paquetes',
      packages: []
    }, { status: 500 })
  }
}
