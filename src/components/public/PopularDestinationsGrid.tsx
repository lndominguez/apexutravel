'use client'

import { Card, CardBody, Button, Chip } from '@heroui/react'
import { MapPin, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const destinations = [
  {
    name: 'Cancún',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800&q=80',
    packages: 45,
    fromPrice: 8500,
    popular: true,
    gradient: 'from-blue-500/80 to-cyan-500/80'
  },
  {
    name: 'Varadero',
    country: 'Cuba',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    packages: 32,
    fromPrice: 12500,
    popular: true,
    gradient: 'from-orange-500/80 to-red-500/80'
  },
  {
    name: 'Punta Cana',
    country: 'República Dominicana',
    image: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80',
    packages: 38,
    fromPrice: 11200,
    popular: true,
    gradient: 'from-green-500/80 to-emerald-500/80'
  },
  {
    name: 'Los Cabos',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800&q=80',
    packages: 28,
    fromPrice: 9800,
    gradient: 'from-purple-500/80 to-pink-500/80'
  },
  {
    name: 'Miami',
    country: 'Estados Unidos',
    image: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800&q=80',
    packages: 52,
    fromPrice: 15400,
    gradient: 'from-yellow-500/80 to-orange-500/80'
  },
  {
    name: 'La Habana',
    country: 'Cuba',
    image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80',
    packages: 24,
    fromPrice: 10800,
    gradient: 'from-red-500/80 to-pink-500/80'
  }
]

export default function PopularDestinationsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {destinations.map((dest, index) => (
        <Card
          key={dest.name}
          isPressable
          as={Link}
          href={`/search/packages?destination=${dest.name}`}
          className="group relative overflow-hidden h-80 border-2 border-transparent hover:border-primary transition-all duration-300"
        >
          {/* Imagen de fondo */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundImage: `url(${dest.image})` }}
          />
          
          {/* Overlay gradiente */}
          <div className={`absolute inset-0 bg-gradient-to-t ${dest.gradient} opacity-60 group-hover:opacity-70 transition-opacity`} />
          
          {/* Contenido */}
          <CardBody className="relative z-10 flex flex-col justify-between p-6 text-white">
            <div>
              {dest.popular && (
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
                <span className="text-sm font-medium opacity-90">{dest.country}</span>
              </div>
              
              <h3 className="text-3xl font-black mb-3 group-hover:scale-105 transition-transform">
                {dest.name}
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">{dest.packages} paquetes disponibles</p>
                  <p className="text-2xl font-black">
                    ${dest.fromPrice.toLocaleString('es-MX')}
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
      ))}
    </div>
  )
}
