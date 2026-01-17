'use client'

import { Card, CardBody, Image, Tooltip } from '@heroui/react'
import { MapPin, Star, Plane, Sparkles, Hotel as HotelIcon, Bus, Clock } from 'lucide-react'
import Link from 'next/link'
import { getCheapestRoomAdultBasePrice } from '@/lib/offerPricing'

interface PackageCardProps {
  pkg: any
}

export default function PackageCard({ pkg }: PackageCardProps) {
  // Extraer información de items[]
  const hotelItem = pkg.items?.find((item: any) => item.resourceType === 'Hotel')
  const hasFlights = pkg.items?.some((item: any) => item.resourceType === 'Flight')
  const hasTransport = pkg.items?.some((item: any) => item.resourceType === 'Transport')
  const hasActivities = pkg.items?.some((item: any) => item.resourceType === 'Activity')
  
  const hotelInfo = hotelItem?.hotelInfo
  const location = hotelInfo?.location
  const photos = hotelInfo?.photos || []
  const stars = hotelInfo?.stars
  const hotelName = hotelInfo?.name || 'Hotel'
  
  const applyMarkup = (basePrice: number, markup: any) => {
    if (!markup || !markup.value) return basePrice
    if (markup.type === 'percentage') {
      return basePrice + (basePrice * markup.value / 100)
    }
    return basePrice + markup.value
  }

  const baseAdultFromRooms = getCheapestRoomAdultBasePrice(hotelInfo?.rooms || [])
  const finalAdultFromRooms = baseAdultFromRooms ? applyMarkup(baseAdultFromRooms, pkg.markup) : 0

  const pricePerAdult = finalAdultFromRooms || pkg.pricing?.finalPrice || pkg.pricing?.base?.adult || 0
  const priceFor2People = pricePerAdult * 2
  
  return (
    <Link href={`/booking/packages/${pkg.slug}`} className="block h-full">
      <Card 
        className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden border-2 border-transparent hover:border-primary/20 h-full flex flex-col cursor-pointer"
      >
      
        <CardBody className="p-0 flex-1 flex flex-col">
          {/* Imagen con overlay */}
          <div className="relative h-48 overflow-hidden flex-shrink-0">
            <Image
              src={photos[0] || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800'}
              alt={pkg.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            
            {/* Overlay corporativo */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c3f5b]/85 via-black/20 to-transparent" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[#ec9c12]/20 to-[#0c3f5b]/30" />
          
            {/* Badge de oferta */}
            {pricePerAdult < 1000 && (
              <div className="absolute top-3 right-3 z-20">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-lg flex items-center gap-1.5">
                  <Sparkles size={12} />
                  <span>OFERTA</span>
                </div>
              </div>
            )}

            {/* Título sobre la imagen */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
              <h3 className="font-bold text-lg text-white line-clamp-2 drop-shadow-lg">
                {pkg.name}
              </h3>
              <p className="text-xs text-white/90 font-semibold truncate drop-shadow">
                {hotelName}
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="p-4 bg-white space-y-3 flex-1 flex flex-col">
            {/* Ubicación */}
            {location && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin size={14} className="text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {location.city}, {location.country}
                </span>
              </div>
            )}

            {/* Descripción */}
            {pkg.description && (
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {pkg.description}
              </p>
            )}

            {/* Inclusiones */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-2">Incluye:</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip content={hotelItem ? 'Hotel incluido' : 'Hotel no incluido'} placement="top">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${hotelItem ? 'bg-orange-50 text-orange-700' : 'bg-default-100 text-default-400 opacity-60'}`}>
                    <HotelIcon size={14} strokeWidth={2} />
                    <span className="text-xs font-medium">Hotel</span>
                  </div>
                </Tooltip>

                <Tooltip content={hasFlights ? 'Vuelos incluidos' : 'Vuelos no incluidos'} placement="top">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${hasFlights ? 'bg-blue-50 text-blue-700' : 'bg-default-100 text-default-400 opacity-60'}`}>
                    <Plane size={14} strokeWidth={2} />
                    <span className="text-xs font-medium">Vuelos</span>
                  </div>
                </Tooltip>

                <Tooltip content={hasTransport ? 'Transporte incluido' : 'Transporte no incluido'} placement="top">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${hasTransport ? 'bg-green-50 text-green-700' : 'bg-default-100 text-default-400 opacity-60'}`}>
                    <Bus size={14} strokeWidth={2} />
                    <span className="text-xs font-medium">Transporte</span>
                  </div>
                </Tooltip>

                <Tooltip content={hasActivities ? 'Actividades incluidas' : 'Actividades no incluidas'} placement="top">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${hasActivities ? 'bg-purple-50 text-purple-700' : 'bg-default-100 text-default-400 opacity-60'}`}>
                    <MapPin size={14} strokeWidth={2} />
                    <span className="text-xs font-medium">Actividades</span>
                  </div>
                </Tooltip>
              </div>
            </div>

            {/* Spacer para empujar el footer al fondo */}
            <div className="flex-1"></div>

            {/* Footer con precio y estrellas */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                {stars && hotelInfo?.name && (
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={i < stars 
                          ? "fill-amber-400 text-amber-400" 
                          : "fill-none text-gray-300"
                        }
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                )}
                
                {pkg.duration?.nights && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={14} className="text-blue-500" />
                    <span className="text-xs font-medium">{pkg.duration.nights} noches</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-0.5">Desde</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-primary">
                    ${priceFor2People.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">{pkg.pricing?.currency || 'USD'}</span>
                </div>
                <p className="text-xs text-gray-400">por 2 personas</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}
