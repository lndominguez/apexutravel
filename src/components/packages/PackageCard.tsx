'use client'

import { Card, CardBody, CardFooter, Button, Chip, Image, Tooltip } from '@heroui/react'
import { MapPin, Calendar, Users, Star, Plane, Wifi, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface PackageCardProps {
  pkg: any
}

export default function PackageCard({ pkg }: PackageCardProps) {
  // Extraer información de items[]
  const hotelItem = pkg.items?.find((item: any) => item.resourceType === 'Hotel')
  const hasFlights = pkg.items?.some((item: any) => item.resourceType === 'Flight')
  const hasTransport = pkg.items?.some((item: any) => item.resourceType === 'Transport')
  
  const hotelInfo = hotelItem?.hotelInfo
  const location = hotelInfo?.location
  const photos = hotelInfo?.photos || []
  const stars = hotelInfo?.stars
  
  // Usar finalPrice que ya incluye el markup aplicado
  const price = pkg.pricing?.finalPrice || pkg.pricing?.base?.adult || 0
  
  return (
    <Card 
      className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden relative"
    >
      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[5]" />
      
      <CardBody className="p-0">
        {/* Imagen */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
          <Image
            src={photos[0] || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800'}
            alt={pkg.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Badges superiores */}
          <div className="absolute top-2 left-2 flex gap-1.5 z-20">
            <Chip color="default" variant="solid" size="sm" className="font-bold text-xs h-6">
              {pkg.code || 'PKG'}
            </Chip>
            {hasFlights && (
              <Chip color="primary" variant="solid" size="sm" className="font-bold text-xs h-6">
                + Vuelos
              </Chip>
            )}
          </div>

          {/* Cinta de oferta diagonal */}
          {price < 1000 && (
            <div className="absolute top-0 right-0 z-20 overflow-hidden w-32 h-32 pointer-events-none">
              <div className="absolute top-6 -right-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold py-1 px-12 transform rotate-45 shadow-lg flex items-center justify-center gap-1">
                <Sparkles size={10} />
                <span>OFERTA</span>
              </div>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-2.5 relative z-10 bg-white">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
            {pkg.name}
          </h3>

          {/* Features principales con iconos */}
          {(stars || hasFlights) && (
            <div className="flex items-center gap-3 py-2">
              {/* Estrellas del hotel */}
              {stars && (
                <Tooltip content={`Hotel ${stars} estrellas`} placement="top">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={i < stars 
                          ? "fill-amber-400 text-amber-400" 
                          : "fill-none text-gray-300"
                        }
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </Tooltip>
              )}
              
              {/* Vuelos incluidos */}
              {hasFlights && (
                <Tooltip content="Vuelos incluidos" placement="top">
                  <div className="flex items-center text-blue-600">
                    <Plane size={16} strokeWidth={2} />
                  </div>
                </Tooltip>
              )}
              
              {/* Transporte */}
              {hasTransport && (
                <Tooltip content="Transporte incluido" placement="top">
                  <div className="flex items-center text-green-600">
                    <Wifi size={16} strokeWidth={2} />
                  </div>
                </Tooltip>
              )}
            </div>
          )}

          {location && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin size={14} className="text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {location.city}, {location.country}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-600">
            {pkg.validFrom && pkg.validTo && (
              <div className="flex items-center gap-1">
                <Calendar size={14} className="text-blue-500" />
                <span className="font-medium">
                  {new Date(pkg.validFrom).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            {pkg.availability?.minPax && pkg.availability?.maxPax && (
              <>
                <div className="h-3 w-px bg-gray-300" />
                <div className="flex items-center gap-1">
                  <Users size={14} className="text-green-500" />
                  <span className="font-medium">{pkg.availability.minPax}-{pkg.availability.maxPax}</span>
                </div>
              </>
            )}
          </div>

          {/* Items incluidos */}
          {pkg.items && pkg.items.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">Incluye:</span>
                <div className="flex gap-1 flex-wrap">
                  {pkg.items.map((item: any, idx: number) => (
                    <Chip key={idx} size="sm" variant="flat" color="success">
                      {item.resourceType}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardBody>

      {/* Footer con precio */}
      <CardFooter className="flex justify-between items-center border-t bg-gradient-to-r from-gray-50 to-blue-50/30 px-4 py-3 group-hover:bg-gradient-to-r group-hover:from-blue-50/50 group-hover:to-purple-50/50 transition-all duration-300 relative z-10">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Desde</p>
          
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-primary group-hover:scale-105 transition-transform duration-300 inline-block">
              ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-gray-500 font-medium">{pkg.pricing?.currency || 'USD'}</span>
          </div>
          <p className="text-xs text-gray-400">por adulto</p>
        </div>
        
        <Link href={`/booking/packages/${pkg.slug}`}>
          <Button 
            color="primary" 
            variant="shadow"
            size="md"
            className="font-bold group-hover:scale-105 transition-transform duration-300"
            endContent={<span className="text-lg group-hover:translate-x-1 transition-transform duration-300 inline-block">→</span>}
          >
            Ver más
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
