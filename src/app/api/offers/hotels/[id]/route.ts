import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import Hotel from '@/models/Hotel'

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
    const hotel = await Offer.findOne({ _id: id, type: 'hotel' })
      .populate('createdBy', 'firstName lastName email')
      .lean()

    if (!hotel) {
      return NextResponse.json(
        { error: 'Oferta de hotel no encontrada' },
        { status: 404 }
      )
    }

    // Enriquecer selectedRooms con imágenes del hotel resource
    if (hotel.items && hotel.items.length > 0) {
      for (const item of hotel.items) {
        if (item.resourceType === 'Hotel' && item.selectedRooms && item.selectedRooms.length > 0) {
          const resourceId = item.hotelInfo?.resourceId
          
          if (resourceId) {
            try {
              const hotelResource = await Hotel.findById(resourceId)
                .select('photos roomTypes')
                .lean()
              
              if (hotelResource) {
                // Agregar fotos del hotel si no existen en hotelInfo
                if (item.hotelInfo && (!item.hotelInfo.photos || item.hotelInfo.photos.length === 0)) {
                  item.hotelInfo.photos = hotelResource.photos || []
                }
                
                // Enriquecer selectedRooms con fotos
                item.selectedRooms = item.selectedRooms.map((room: any) => {
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

    // Enriquecer selectedRooms con imágenes del hotel resource
    if (updatedHotel && updatedHotel.items && updatedHotel.items.length > 0) {
      for (const item of updatedHotel.items) {
        if (item.resourceType === 'Hotel' && item.selectedRooms && item.selectedRooms.length > 0) {
          const resourceId = item.hotelInfo?.resourceId
          
          if (resourceId) {
            try {
              const hotelResource = await Hotel.findById(resourceId)
                .select('photos roomTypes')
                .lean()
              
              if (hotelResource) {
                // Agregar fotos del hotel si no existen en hotelInfo
                if (item.hotelInfo && (!item.hotelInfo.photos || item.hotelInfo.photos.length === 0)) {
                  item.hotelInfo.photos = hotelResource.photos || []
                }
                
                // Enriquecer selectedRooms con fotos
                item.selectedRooms = item.selectedRooms.map((room: any) => {
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

// DELETE /api/offers/hotels/[id] - Eliminar oferta de hotel
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
    const hotel = await Offer.findOne({ _id: id, type: 'hotel' })
    if (!hotel) {
      return NextResponse.json(
        { error: 'Oferta de hotel no encontrada' },
        { status: 404 }
      )
    }

    await Offer.findByIdAndDelete(id)

    return NextResponse.json({
      message: 'Oferta de hotel eliminada exitosamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar oferta de hotel:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar oferta de hotel' },
      { status: 500 }
    )
  }
}
