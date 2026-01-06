'use client'

import { Card, CardBody, CardFooter, Button, Chip, Image, Tooltip } from '@heroui/react'
import { MapPin, Calendar, Users, Star, Plane, Wifi, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface PackageCardProps {
  pkg: any
}

export default function PackageCard({ pkg }: PackageCardProps) {
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
            src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800'}
            alt={pkg.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Badges superiores */}
          <div className="absolute top-2 left-2 flex gap-1.5 z-20">
            {pkg.featured && (
              <Chip color="warning" variant="solid" size="sm" className="font-bold text-xs h-6">
                TOP
              </Chip>
            )}
            {pkg.category && (
              <Chip color="primary" variant="solid" size="sm" className="font-bold capitalize text-xs h-6">
                {pkg.category === 'all_inclusive' ? 'Todo Incluido' : pkg.category.replace('_', ' ')}
              </Chip>
            )}
          </div>

          {/* Cinta de oferta diagonal */}
          {pkg.pricing?.sellingPricePerPerson?.double < 1000 && (
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
          {(pkg.features?.hotelStars || pkg.features?.includesFlights || pkg.features?.wifi) && (
            <div className="flex items-center gap-3 py-2">
              {/* Estrellas del hotel - siempre 5, rellenas según rating */}
              {pkg.features?.hotelStars && (
                <Tooltip content={`Hotel ${pkg.features.hotelStars} estrellas`} placement="top">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={i < pkg.features.hotelStars 
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
              {pkg.features?.includesFlights && (
                <Tooltip content="Vuelos incluidos" placement="top">
                  <div className="flex items-center text-blue-600">
                    <Plane size={16} strokeWidth={2} />
                  </div>
                </Tooltip>
              )}
              
              {/* WiFi */}
              {pkg.features?.wifi && (
                <Tooltip content="WiFi incluido" placement="top">
                  <div className="flex items-center text-green-600">
                    <Wifi size={16} strokeWidth={2} />
                  </div>
                </Tooltip>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-gray-600">
            <MapPin size={14} className="text-primary flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {pkg.destination?.city || pkg.destination}, {pkg.destination?.country || 'México'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar size={14} className="text-blue-500" />
              <span className="font-medium">{pkg.duration?.days || 0}D/{pkg.duration?.nights || 0}N</span>
            </div>
            <div className="h-3 w-px bg-gray-300" />
            <div className="flex items-center gap-1">
              <Users size={14} className="text-green-500" />
              <span className="font-medium">{pkg.availability?.minPeople || pkg.availability?.minParticipants || 1}-{pkg.availability?.maxPeople || pkg.availability?.maxParticipants || 4}</span>
            </div>
          </div>

          {/* Inclusiones compactas con tooltip */}
          {pkg.included && pkg.included.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <Tooltip 
                content={
                  <div className="max-w-xs p-2">
                    <p className="font-semibold mb-2 text-sm">Incluye:</p>
                    <ul className="text-xs space-y-1">
                      {pkg.included.map((inc: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                }
                placement="top"
              >
                <div className="flex items-center gap-2 cursor-help">
                  <span className="text-xs font-semibold text-gray-700">Incluye:</span>
                  <div className="flex gap-1">
                    {pkg.included.slice(0, 3).map((_: string, idx: number) => (
                      <span key={idx} className="text-xs text-gray-600 bg-green-50 px-2 py-0.5 rounded-full">
                        ✓
                      </span>
                    ))}
                    {pkg.included.length > 3 && (
                      <span className="text-xs text-primary font-semibold px-2 py-0.5">
                        +{pkg.included.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </Tooltip>
            </div>
          )}
        </div>
      </CardBody>

      {/* Footer con precio */}
      <CardFooter className="flex justify-between items-center border-t bg-gradient-to-r from-gray-50 to-blue-50/30 px-4 py-3 group-hover:bg-gradient-to-r group-hover:from-blue-50/50 group-hover:to-purple-50/50 transition-all duration-300 relative z-10">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Desde</p>
          
          {/* Mostrar precio tachado si hay descuento (precio base vs precio de venta) */}
          {pkg.pricing?.basePricePerPerson?.double && 
           pkg.pricing?.basePricePerPerson?.double > pkg.pricing?.sellingPricePerPerson?.double && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-400 line-through">
                ${pkg.pricing.basePricePerPerson.double.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {Math.round(((pkg.pricing.basePricePerPerson.double - pkg.pricing.sellingPricePerPerson.double) / pkg.pricing.basePricePerPerson.double) * 100)}% OFF
              </span>
            </div>
          )}
          
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-primary group-hover:scale-105 transition-transform duration-300 inline-block">
              ${(pkg.pricing?.sellingPricePerPerson?.double || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-gray-500 font-medium">{pkg.pricing?.currency || 'USD'}</span>
          </div>
          <p className="text-xs text-gray-400">por persona</p>
        </div>
        
        <Link href={`/packages/${pkg._id}`}>
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
