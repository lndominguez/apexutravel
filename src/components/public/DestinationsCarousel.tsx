'use client'

import { useState } from 'react'
import { Card, CardBody, Button, Chip } from '@heroui/react'
import { ChevronLeft, ChevronRight, MapPin, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const destinations = [
  {
    id: 1,
    name: 'Cancún',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800',
    packages: 45,
    price: 12500,
    popular: true,
    gradient: 'from-blue-500/80 to-cyan-500/80'
  },
  {
    id: 2,
    name: 'Riviera Maya',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    packages: 38,
    price: 15800,
    popular: true,
    gradient: 'from-purple-500/80 to-pink-500/80'
  },
  {
    id: 3,
    name: 'Los Cabos',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    packages: 28,
    price: 18900,
    popular: true,
    gradient: 'from-orange-500/80 to-red-500/80'
  },
  {
    id: 4,
    name: 'Puerto Vallarta',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    packages: 34,
    price: 11200,
    gradient: 'from-green-500/80 to-emerald-500/80'
  },
  {
    id: 5,
    name: 'Holbox',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    packages: 18,
    price: 9500,
    gradient: 'from-teal-500/80 to-cyan-500/80'
  },
  {
    id: 6,
    name: 'Tulum',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800',
    packages: 42,
    price: 14300,
    popular: true,
    gradient: 'from-yellow-500/80 to-orange-500/80'
  },
  {
    id: 7,
    name: 'Playa del Carmen',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
    packages: 36,
    price: 13700,
    gradient: 'from-pink-500/80 to-rose-500/80'
  },
  {
    id: 8,
    name: 'Varadero',
    country: 'Cuba',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    packages: 32,
    price: 12500,
    gradient: 'from-red-500/80 to-pink-500/80'
  }
]

export default function DestinationsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerView = 4

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + itemsPerView >= destinations.length ? 0 : prev + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, destinations.length - itemsPerView) : prev - 1
    )
  }

  const visibleDestinations = destinations.slice(currentIndex, currentIndex + itemsPerView)

  return (
    <div className="relative">
      {/* Carousel con scroll horizontal */}
      <div className="overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-primary scrollbar-track-gray-200">
        <div className="flex gap-6">
          {destinations.map((destination) => (
            <div
              key={destination.id}
              className="min-w-[280px] sm:min-w-[320px] md:min-w-[350px] flex-shrink-0"
            >
              <Card
                isPressable
                as={Link}
                href={`/search/packages?destination=${destination.name}`}
                className="group relative overflow-hidden h-80 border-2 border-transparent hover:border-primary transition-all duration-300"
              >
                {/* Imagen de fondo */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${destination.image})` }}
                />
                
                {/* Overlay gradiente */}
                <div className={`absolute inset-0 bg-gradient-to-t ${destination.gradient} opacity-60 group-hover:opacity-70 transition-opacity`} />
                
                {/* Contenido */}
                <CardBody className="relative z-10 flex flex-col justify-between p-6 text-white">
                  <div>
                    {destination.popular && (
                      <Chip
                        color="warning"
                        variant="solid"
                        size="sm"
                        startContent={<TrendingUp size={14} />}
                        className="mb-3 font-bold"
                      >
                        Popular
                      </Chip>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={20} className="text-white" />
                      <span className="text-sm font-medium opacity-90">{destination.country}</span>
                    </div>
                    
                    <h3 className="text-3xl font-black mb-3 group-hover:scale-105 transition-transform">
                      {destination.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90 mb-1">{destination.packages} paquetes disponibles</p>
                        <p className="text-2xl font-black">
                          ${destination.price.toLocaleString('es-MX')}
                          <span className="text-sm font-normal opacity-90"> MXN</span>
                        </p>
                      </div>
                      
                      <Button
                        isIconOnly
                        color="default"
                        variant="solid"
                        className="bg-white/20 backdrop-blur-sm group-hover:bg-white group-hover:text-primary transition-all"
                        size="lg"
                      >
                        <ArrowRight size={20} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
