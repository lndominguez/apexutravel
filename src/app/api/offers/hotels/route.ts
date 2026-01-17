import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import Hotel from '@/models/Hotel'

// GET /api/offers/hotels - Listar ofertas de hoteles con filtros
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
    const destination = searchParams.get('destination')

    // Construir query - Solo hoteles
    const query: any = {
      type: 'hotel'
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (status) {
      query.status = status
    }

    if (destination) {
      query.$or = [
        { 'destination.city': { $regex: destination, $options: 'i' } },
        { 'destination.country': { $regex: destination, $options: 'i' } }
      ]
    }

    const skip = (page - 1) * limit

    let [hotels, total] = await Promise.all([
      Offer.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Offer.countDocuments(query)
    ])

    // Enriquecer cada hotel con imágenes del resource
    for (const hotel of hotels as any[]) {
      if (hotel.items && hotel.items.length > 0) {
        for (const item of hotel.items as any[]) {
          if (item.resourceType === 'Hotel' && (item as any).selectedRooms && (item as any).selectedRooms.length > 0) {
            const resourceId = item.hotelInfo?.resourceId
            
            if (resourceId) {
              try {
                const hotelResource = await Hotel.findById(resourceId)
                  .select('photos roomTypes')
                  .lean()
                
                if (hotelResource) {
                  // Agregar fotos del hotel si no existen en hotelInfo
                  const hotelInfo = (item as any).hotelInfo
                  if (hotelInfo && (!hotelInfo.photos || hotelInfo.photos.length === 0)) {
                    hotelInfo.photos = hotelResource.photos || []
                  }
                  
                  // Enriquecer selectedRooms con fotos
                  ;(item as any).selectedRooms = (item as any).selectedRooms.map((room: any) => {
                    const roomType = hotelResource.roomTypes?.find((rt: any) => 
                      rt._id?.toString() === room.roomTypeId?.toString()
                    )
                    
                    if (roomType && roomType.images) {
                      return {
                        ...room,
                        images: roomType.images
                      }
                    }
                    return room
                  })
                }
              } catch (error) {
                console.error('Error fetching hotel resource:', error)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      hotels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error al obtener ofertas de hoteles:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener ofertas de hoteles' },
      { status: 500 }
    )
  }
}

// POST /api/offers/hotels - Crear nueva oferta de hotel
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
    if (!data.name) {
      return NextResponse.json(
        { error: 'El campo name es requerido' },
        { status: 400 }
      )
    }

    // Generar código automático si no existe
    if (!data.code) {
      const timestamp = Date.now().toString(36).toUpperCase()
      data.code = `HOTEL-${timestamp}`
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
    const existingOffer = await Offer.findOne({ code: data.code })
    if (existingOffer) {
      return NextResponse.json(
        { error: 'Ya existe una oferta con ese código' },
        { status: 400 }
      )
    }

    // Crear oferta de hotel
    const hotelData = {
      ...data,
      type: 'hotel',
      createdBy: session.user.id,
      updatedBy: session.user.id,
      status: data.status || 'draft'
    }

    const newHotel = await new Offer(hotelData).save()

    // Poblar para respuesta
    const populatedHotel = await Offer.findById(newHotel._id)
      .populate('items.inventoryId', 'inventoryName resource pricing validFrom validTo availability rooms')
      .populate('createdBy', 'firstName lastName email')
      .lean()

    return NextResponse.json({
      message: 'Oferta de hotel creada exitosamente',
      hotel: populatedHotel
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear oferta de hotel:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear oferta de hotel' },
      { status: 500 }
    )
  }
}
