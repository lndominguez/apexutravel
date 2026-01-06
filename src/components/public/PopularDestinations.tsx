'use client'

import { Card, CardBody, Button } from '@heroui/react'
import { MapPin, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const destinations = [
  {
    name: 'Cancún',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800',
    packages: 24,
    fromPrice: 4500
  },
  {
    name: 'Riviera Maya',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    packages: 18,
    fromPrice: 5200
  },
  {
    name: 'Los Cabos',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800',
    packages: 15,
    fromPrice: 6800
  },
  {
    name: 'Puerto Vallarta',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1512813498716-3e640fed3f39?w=800',
    packages: 12,
    fromPrice: 4200
  },
  {
    name: 'Playa del Carmen',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800',
    packages: 20,
    fromPrice: 4800
  },
  {
    name: 'Tulum',
    country: 'México',
    image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800',
    packages: 16,
    fromPrice: 5500
  }
]

export default function PopularDestinations() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {destinations.map((dest) => (
        <Link key={dest.name} href={`/destinations/${dest.name.toLowerCase().replace(' ', '-')}`}>
          <Card 
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden"
            isPressable
          >
            <CardBody className="p-0">
              {/* Imagen con overlay */}
              <div className="relative h-80 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                  style={{ backgroundImage: `url(${dest.image})` }}
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Badge trending */}
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-xs font-semibold">Popular</span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={18} />
                    <span className="text-sm opacity-90">{dest.country}</span>
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {dest.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-75">{dest.packages} paquetes disponibles</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-sm">Desde</span>
                        <span className="text-2xl font-bold">${dest.fromPrice.toLocaleString()}</span>
                        <span className="text-sm">MXN</span>
                      </div>
                    </div>
                    
                    <Button
                      color="primary"
                      variant="shadow"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Explorar
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  )
}
