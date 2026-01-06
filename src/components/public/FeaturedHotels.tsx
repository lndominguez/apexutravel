'use client'

import { Card, CardBody, CardFooter, Chip, Button, Skeleton } from '@heroui/react'
import { Hotel, MapPin, Star, Users } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import Image from 'next/image'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function FeaturedHotels() {
  const { data, error, isLoading } = useSWR('/api/public/hotels?status=active&limit=6', fetcher)

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hotels.map((hotel: any) => {
        const lowestPrice = Math.min(...(hotel.roomTypes || []).flatMap((rt: any) => 
          (rt.plans || []).map((p: any) => p.sellingPrice || 0)
        ))

        return (
          <Card
            key={hotel._id}
            isPressable
            as={Link}
            href={`/search/hotels?city=${hotel.location.city}`}
            className="group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary"
          >
            {/* Imagen */}
            <div className="relative h-48 overflow-hidden">
              {hotel.images?.[0] ? (
                <Image
                  src={hotel.images[0]}
                  alt={hotel.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Hotel size={64} className="text-white opacity-50" />
                </div>
              )}
              
              {/* Badge de categoría */}
              <div className="absolute top-3 right-3">
                <Chip
                  color="warning"
                  variant="solid"
                  size="sm"
                  startContent={<Star size={14} fill="currentColor" />}
                  className="font-bold"
                >
                  {hotel.category} ⭐
                </Chip>
              </div>
            </div>

            <CardBody className="p-6">
              {/* Nombre del hotel */}
              <h3 className="font-black text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                {hotel.name}
              </h3>

              {/* Ubicación */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <MapPin size={16} className="text-primary" />
                <span className="line-clamp-1">
                  {hotel.location.city}, {hotel.location.country}
                </span>
              </div>

              {/* Amenidades destacadas */}
              <div className="flex flex-wrap gap-2 mb-3">
                {hotel.amenities?.slice(0, 3).map((amenity: string, idx: number) => (
                  <Chip key={idx} size="sm" variant="flat" color="default">
                    {amenity}
                  </Chip>
                ))}
              </div>

              {/* Capacidad */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users size={14} />
                <span>Hasta {(hotel.roomTypes[0]?.capacity?.adults || 2) + (hotel.roomTypes[0]?.capacity?.children || 0)} personas</span>
              </div>
            </CardBody>

            <CardFooter className="bg-gradient-to-r from-gray-50 to-gray-100 border-t px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-xs text-gray-500">Desde</p>
                  <p className="text-2xl font-black text-primary">
                    ${lowestPrice.toLocaleString('es-MX')}
                    <span className="text-sm font-normal text-gray-500"> /noche</span>
                  </p>
                </div>
                <Button
                  color="primary"
                  variant="shadow"
                  size="sm"
                  className="group-hover:scale-105 transition-transform"
                >
                  Ver Hotel
                </Button>
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
