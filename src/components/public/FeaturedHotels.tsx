'use client'

import { Card, CardBody, CardFooter, Chip, Button, Skeleton } from '@heroui/react'
import { Hotel, MapPin, Star, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import Image from 'next/image'
import { getCheapestRoomAdultBasePrice, getRoomAdultBasePrice } from '@/lib/offerPricing'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Error al cargar hoteles')
  }
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch (e) {
    console.error('Error parsing JSON:', text)
    throw new Error('Respuesta inválida del servidor')
  }
}

export default function FeaturedHotels() {
  const { data, error, isLoading } = useSWR('/api/public/search/hotels?status=published&limit=6', fetcher)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <Skeleton className="rounded-t-xl h-48" />
            <CardBody className="p-6">
              <Skeleton className="rounded-lg h-4 w-3/4 mb-2" />
              <Skeleton className="rounded-lg h-4 w-1/2" />
            </CardBody>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data?.hotels || data.hotels.length === 0) {
    return (
      <div className="text-center py-12">
        <Hotel size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 mb-4">No hay hoteles disponibles en este momento</p>
        <Button as={Link} href="/search/hotels" color="primary" variant="flat">
          Buscar Hoteles
        </Button>
      </div>
    )
  }

  const hotels = (data?.hotels || []).slice(0, 6)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {hotels.map((hotel: any) => {
        // Extraer info del hotel desde items
        const hotelItem = hotel.items?.find((item: any) => item.resourceType === 'Hotel')
        const hotelInfo = hotelItem?.hotelInfo
        const roomDetails = hotelItem?.selectedRooms?.[0]
        const selectedRooms = hotelItem?.selectedRooms || []
        const minRoomPrice = getCheapestRoomAdultBasePrice(selectedRooms)
        const price = minRoomPrice || hotel.pricing?.finalPrice || 0
        
        // Calcular habitación más barata y su availability
        const cheapestRoom = selectedRooms.length > 0 
          ? selectedRooms.reduce((min: any, room: any) => {
              const minPrice = min ? getRoomAdultBasePrice(min) : Infinity
              const roomPrice = getRoomAdultBasePrice(room)
              return roomPrice < minPrice ? room : min
            }, null)
          : null
        const availableStock = cheapestRoom?.availability || 0

        return (
          <Card
            key={hotel._id}
            isPressable
            as={Link}
            href={`/booking/hotels/${hotel.slug || hotel._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group hover:shadow-2xl transition-all duration-300 overflow-hidden max-w-sm mx-auto w-full"
          >
            {/* Imagen */}
            <div className="relative h-56 overflow-hidden">
              {(hotel.coverPhoto || hotelInfo?.photos?.[0]) ? (
                <>
                  <Image
                    src={hotel.coverPhoto || hotelInfo.photos[0]}
                    alt={hotelInfo?.name || hotel.name}
                    fill
                    className="object-cover transition-all duration-300"
                  />
                  {/* Overlay con tinte naranja en hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ec9c12]/0 to-[#0c3f5b]/0 group-hover:from-[#ec9c12]/30 group-hover:to-[#0c3f5b]/40 transition-all duration-300" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Hotel size={64} className="text-white opacity-50" />
                </div>
              )}
              
              {/* Badges superiores */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                {/* Cupos disponibles */}
                {availableStock > 0 && (
                  <Chip
                    size="sm"
                    variant="solid"
                    className="bg-[#ec9c12] text-white font-semibold shadow-lg"
                    startContent={<Users size={14} />}
                  >
                    {availableStock} cupos
                  </Chip>
                )}
                
                {/* Estrellas */}
                {hotelInfo?.stars && (
                  <Chip
                    variant="solid"
                    size="sm"
                    className="bg-white/95 text-gray-800 font-bold shadow-lg"
                    startContent={<Star size={14} fill="#f1c203" className="text-[#f1c203]" />}
                  >
                    {hotelInfo.stars}
                  </Chip>
                )}
              </div>
              
              {/* Precio overlay */}
              <div className="absolute bottom-3 right-3">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-xl">
                  <p className="text-xs text-gray-500 font-medium">Desde</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#ec9c12]">
                      ${Math.round(price).toLocaleString('es-MX')}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{hotel.pricing?.currency || 'USD'}</span>
                  </div>
                </div>
              </div>
            </div>

            <CardBody className="p-5">
              {/* Nombre del hotel */}
              <h3 className="font-black text-xl mb-3 line-clamp-2 group-hover:text-[#0c3f5b] transition-colors leading-tight">
                {hotel.name}
              </h3>

              {/* Nombre del hotel real */}
              {hotelInfo?.name && hotelInfo.name !== hotel.name && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-1 font-medium">
                  {hotelInfo.name}
                </p>
              )}

              {/* Ubicación */}
              {hotelInfo?.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPin size={16} className="text-[#0c3f5b] flex-shrink-0" />
                  <span className="line-clamp-1">
                    {hotelInfo.location.city}, {hotelInfo.location.country}
                  </span>
                </div>
              )}

              {/* Plan */}
              <div className="flex flex-wrap gap-2 mb-3">
                {roomDetails?.plan && (
                  <Chip size="sm" variant="flat" className="bg-green-100 text-green-700 font-semibold">
                    {roomDetails.plan === 'all_inclusive' ? 'Todo incluido' :
                     roomDetails.plan === 'full_board' ? 'Pensión completa' :
                     roomDetails.plan === 'half_board' ? 'Media pensión' :
                     roomDetails.plan === 'breakfast' ? 'Desayuno' : 'Solo alojamiento'}
                  </Chip>
                )}
              </div>
              
              {/* Descripción */}
              {hotel.description && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {hotel.description}
                </p>
              )}
            </CardBody>

            <CardFooter className="bg-gradient-to-r from-[#0c3f5b] to-[#0c3f5b]/90 border-t px-5 py-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 rounded-lg p-2">
                    <Hotel size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70 font-medium">Hotel disponible</p>
                    <p className="text-sm text-white font-bold">Reservar ahora</p>
                  </div>
                </div>
                <Button
                  className="bg-[#ec9c12] hover:bg-[#f1c203] text-white font-bold shadow-lg group-hover:scale-105 transition-all"
                  size="md"
                  endContent={<span className="text-lg">→</span>}
                >
                  Ver Oferta
                </Button>
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
