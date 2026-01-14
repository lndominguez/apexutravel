'use client'

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardBody, Button, Chip, Image } from '@heroui/react'
import { Hotel, MapPin, Star, Users } from 'lucide-react'
import Link from 'next/link'
import { SearchLayout } from '@/components/layout/SearchLayout'
import HotelSearchPanel from '@/components/search/HotelSearchPanel'

function HotelSearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialDestination = searchParams.get('destination') || ''
  const initialCheckIn = searchParams.get('checkIn') || ''
  const initialCheckOut = searchParams.get('checkOut') || ''
  const initialAdults = parseInt(searchParams.get('adults') || '2')
  const initialChildren = parseInt(searchParams.get('children') || '0')
  const initialRooms = parseInt(searchParams.get('rooms') || '1')

  const [hotels, setHotels] = useState<any[]>([])
  const [isLoadingHotels, setIsLoadingHotels] = useState(true)

  useEffect(() => {
    async function fetchHotels() {
      const urlDestination = searchParams.get('destination')
      const urlCheckIn = searchParams.get('checkIn')
      const urlCheckOut = searchParams.get('checkOut')
      const urlMinPrice = searchParams.get('minPrice')
      const urlMaxPrice = searchParams.get('maxPrice')
      const urlHotelStars = searchParams.get('hotelStars')
      const urlAmenities = searchParams.get('amenities')

      if (!urlDestination && !urlCheckIn && !urlMinPrice && !urlMaxPrice && !urlHotelStars && !urlAmenities) {
        setHotels([])
        setIsLoadingHotels(false)
        return
      }

      try {
        setIsLoadingHotels(true)
        const qs = new URLSearchParams({ limit: '100', status: 'published' })

        if (urlDestination) qs.set('city', urlDestination)
        if (urlMinPrice) qs.set('minPrice', urlMinPrice)
        if (urlMaxPrice) qs.set('maxPrice', urlMaxPrice)
        if (urlHotelStars) qs.set('category', urlHotelStars)

        const res = await fetch(`/api/public/search/hotels?${qs.toString()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        const data = await res.json()
        if (data.success) {
          setHotels(data.hotels || [])
        }
      } catch (error) {
        console.error('Error fetching hotels:', error)
      } finally {
        setIsLoadingHotels(false)
      }
    }
    fetchHotels()
  }, [searchParams])

  const getMinPrice = (roomTypes: any[]) => {
    if (!roomTypes || roomTypes.length === 0) return 0
    const prices = roomTypes.flatMap(rt => 
      (rt.plans || []).map((p: any) => p.sellingPricePerNight || 0)
    )
    return prices.length > 0 ? Math.min(...prices) : 0
  }

  const handleSearch = useCallback((params: any) => {
    const qs = new URLSearchParams()
    if (params.destination) qs.set('destination', params.destination)
    if (params.checkIn) qs.set('checkIn', params.checkIn)
    if (params.checkOut) qs.set('checkOut', params.checkOut)
    if (params.adults) qs.set('adults', String(params.adults))
    if (params.children) qs.set('children', String(params.children))
    if (params.rooms) qs.set('rooms', String(params.rooms))
    if (params.minPrice !== undefined) qs.set('minPrice', String(params.minPrice))
    if (params.maxPrice !== undefined) qs.set('maxPrice', String(params.maxPrice))
    if (params.hotelStars && params.hotelStars.length > 0) qs.set('hotelStars', params.hotelStars.join(','))
    if (params.amenities && params.amenities.length > 0) qs.set('amenities', params.amenities.join(','))
    
    router.push(`/search/hotels?${qs.toString()}`)
  }, [router])

  const initialValues = useMemo(() => ({
    destination: initialDestination,
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
    adults: initialAdults,
    children: initialChildren,
    rooms: initialRooms
  }), [initialDestination, initialCheckIn, initialCheckOut, initialAdults, initialChildren, initialRooms])

  const searchPanel = useMemo(() => (
    <HotelSearchPanel
      onSearchChange={handleSearch}
      initialValues={initialValues}
    />
  ), [handleSearch, initialValues])

  return (
    <SearchLayout
      moduleTitle="Hoteles"
      moduleIcon={<Hotel size={24} />}
      moduleDescription={initialDestination ? `Hoteles en "${initialDestination}"` : 'Encuentra el hotel perfecto para tu estadía'}
      searchPanel={searchPanel}
    >
      <div className="py-6">
        {!initialDestination && !isLoadingHotels ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <Hotel size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Encuentra tu hotel ideal
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Utiliza el panel de búsqueda para explorar nuestros hoteles. 
              Puedes buscar por ciudad, fechas y preferencias.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Chip variant="flat" color="primary">Cancún</Chip>
              <Chip variant="flat" color="primary">Playa del Carmen</Chip>
              <Chip variant="flat" color="primary">Los Cabos</Chip>
              <Chip variant="flat" color="primary">Puerto Vallarta</Chip>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                {isLoadingHotels ? 'Buscando...' : `${hotels?.length || 0} hoteles encontrados`}
              </p>
            </div>

            {isLoadingHotels ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-96 animate-pulse">
                    <CardBody>
                      <div className="h-full bg-gray-200 rounded" />
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : hotels && hotels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel: any) => (
                  <Card 
                    key={hotel._id} 
                    className="hover:shadow-xl transition-all duration-300"
                    isPressable
                    as={Link}
                    href={`/booking/hotels/${hotel.slug || hotel._id}`}
                  >
                    <CardBody className="p-0">
                      <div className="relative h-48">
                        <Image
                          src={hotel.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <Chip color="warning" variant="solid" size="sm">
                            <div className="flex items-center gap-1">
                              {[...Array(hotel.category || 0)].map((_, i) => (
                                <Star key={i} size={12} className="fill-current" />
                              ))}
                            </div>
                          </Chip>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold mb-2 line-clamp-1">
                          {hotel.name}
                        </h3>
                        <div className="flex items-center gap-1 text-gray-600 mb-3">
                          <MapPin size={14} className="text-primary" />
                          <span className="text-sm line-clamp-1">
                            {hotel.location?.city}, {hotel.location?.country}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 mb-4">
                          <Users size={14} />
                          <span className="text-xs">
                            {hotel.roomTypes?.length || 0} tipos de habitación
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div>
                            <p className="text-xs text-gray-500">Desde</p>
                            <p className="text-xl font-bold text-primary">
                              ${getMinPrice(hotel.roomTypes).toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500">por noche</p>
                          </div>
                          <Button 
                            color="primary"
                            size="sm"
                            className="font-semibold"
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏨</div>
                <h3 className="text-2xl font-bold mb-2">No se encontraron hoteles</h3>
                <p className="text-muted-foreground mb-6">
                  Intenta ajustar tus filtros o buscar otra ciudad
                </p>
                <Button
                  as={Link}
                  href="/"
                  color="primary"
                >
                  Volver al Inicio
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </SearchLayout>
  )
}

export default function HotelSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <HotelSearchContent />
    </Suspense>
  )
}
