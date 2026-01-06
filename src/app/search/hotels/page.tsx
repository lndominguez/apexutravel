'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardBody, CardFooter, Button, Chip, Input, Select, SelectItem, Slider, Image } from '@heroui/react'
import { Hotel, MapPin, Star, Users, DollarSign, Search, SlidersHorizontal, Wifi, Coffee, Waves } from 'lucide-react'
import Link from 'next/link'
import LocationAutocomplete from '@/components/public/LocationAutocomplete'

function HotelSearchContent() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('city') || '')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(10000)
  const [sortBy, setSortBy] = useState('price_asc')

  // Usar API pública en lugar del hook privado
  const [hotels, setHotels] = useState<any[]>([])
  const [isLoadingHotels, setIsLoadingHotels] = useState(true)

  useEffect(() => {
    async function fetchHotels() {
      try {
        setIsLoadingHotels(true)
        const res = await fetch('/api/public/hotels?limit=100&status=active')
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
  }, [])

  // Filtrar por precio, ciudad y categoría
  const filteredHotels = hotels?.filter((hotel: any) => {
    const minRoomPrice = getMinPrice(hotel.roomTypes)
    const matchesPrice = minRoomPrice >= minPrice && minRoomPrice <= maxPrice
    
    const matchesCity = !search || 
      hotel.location?.city?.toLowerCase().includes(search.toLowerCase()) ||
      hotel.location?.country?.toLowerCase().includes(search.toLowerCase()) ||
      hotel.name?.toLowerCase().includes(search.toLowerCase())
    
    const matchesCategory = !categoryFilter || 
      hotel.category === parseInt(categoryFilter)
    
    return matchesPrice && matchesCity && matchesCategory
  })

  // Ordenar
  const sortedHotels = filteredHotels?.sort((a: any, b: any) => {
    switch (sortBy) {
      case 'price_asc':
        return getMinPrice(a.roomTypes) - getMinPrice(b.roomTypes)
      case 'price_desc':
        return getMinPrice(b.roomTypes) - getMinPrice(a.roomTypes)
      case 'rating':
        return (b.category || 0) - (a.category || 0)
      default:
        return 0
    }
  })

  const getMinPrice = (roomTypes: any[]) => {
    if (!roomTypes || roomTypes.length === 0) return 0
    const prices = roomTypes.flatMap(rt => 
      (rt.plans || []).map((p: any) => p.sellingPricePerNight || 0)
    )
    return prices.length > 0 ? Math.min(...prices) : 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Buscar Hoteles</h1>
          <p className="text-lg opacity-90">
            {search ? `Hoteles en ${search}` : 'Todos los hoteles disponibles'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filtros */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardBody className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-lg font-bold">
                  <SlidersHorizontal size={20} />
                  <span>Filtros</span>
                </div>

                {/* Búsqueda con autocompletado */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">Ciudad o Destino</label>
                  <LocationAutocomplete
                    value={search}
                    onChange={setSearch}
                    placeholder="Buscar ciudad..."
                    type="destination"
                    icon={<MapPin size={18} />}
                  />
                </div>

                {/* Categoría */}
                <div>
                  <p className="text-sm font-semibold mb-3">Categoría</p>
                  <Select
                    placeholder="Todas las categorías"
                    selectedKeys={categoryFilter ? [categoryFilter] : []}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    size="sm"
                  >
                    <SelectItem key="">Todas</SelectItem>
                    <SelectItem key="3">3 Estrellas</SelectItem>
                    <SelectItem key="4">4 Estrellas</SelectItem>
                    <SelectItem key="5">5 Estrellas</SelectItem>
                  </Select>
                </div>

                {/* Rango de precio */}
                <div>
                  <p className="text-sm font-semibold mb-3">Precio por noche</p>
                  <Slider
                    label="Rango de precio"
                    step={100}
                    minValue={0}
                    maxValue={10000}
                    value={[minPrice, maxPrice]}
                    onChange={(value) => {
                      if (Array.isArray(value)) {
                        setMinPrice(value[0])
                        setMaxPrice(value[1])
                      }
                    }}
                    formatOptions={{ style: 'currency', currency: 'MXN' }}
                    className="max-w-md"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>${minPrice.toLocaleString()}</span>
                    <span>${maxPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Ordenar */}
                <div>
                  <p className="text-sm font-semibold mb-3">Ordenar por</p>
                  <Select
                    selectedKeys={[sortBy]}
                    onChange={(e) => setSortBy(e.target.value)}
                    size="sm"
                  >
                    <SelectItem key="price_asc">Precio: Menor a Mayor</SelectItem>
                    <SelectItem key="price_desc">Precio: Mayor a Menor</SelectItem>
                    <SelectItem key="rating">Mejor Valorados</SelectItem>
                  </Select>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button
                    color="primary"
                    variant="shadow"
                    fullWidth
                    size="lg"
                    startContent={<Search size={20} />}
                    className="font-bold"
                  >
                    Buscar Hoteles
                  </Button>
                  
                  <Button
                    variant="flat"
                    fullWidth
                    size="sm"
                    onPress={() => {
                      setSearch('')
                      setCategoryFilter('')
                      setMinPrice(0)
                      setMaxPrice(10000)
                      setSortBy('price_asc')
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-gray-600">
                {isLoadingHotels ? 'Buscando...' : `${sortedHotels?.length || 0} hoteles encontrados`}
              </p>
            </div>

            {isLoadingHotels ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-64 animate-pulse">
                    <CardBody>
                      <div className="h-full bg-gray-200 rounded" />
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : sortedHotels && sortedHotels.length > 0 ? (
              <div className="space-y-6">
                {sortedHotels.map((hotel: any) => (
                  <Card 
                    key={hotel._id} 
                    className="hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    isPressable
                  >
                    <CardBody className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                        {/* Imagen */}
                        <div className="md:col-span-4 relative h-64 md:h-auto">
                          <div 
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ 
                              backgroundImage: `url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800)`
                            }}
                          />
                          {/* Badge de categoría */}
                          <div className="absolute top-4 left-4">
                            <Chip color="warning" variant="solid" size="sm">
                              <div className="flex items-center gap-1">
                                {[...Array(hotel.category || 0)].map((_, i) => (
                                  <Star key={i} size={12} className="fill-current" />
                                ))}
                              </div>
                            </Chip>
                          </div>
                        </div>

                        {/* Contenido */}
                        <div className="md:col-span-8 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold mb-2 hover:text-primary transition-colors">
                                {hotel.name}
                              </h3>
                              <div className="flex items-center gap-2 text-gray-600 mb-3">
                                <MapPin size={16} className="text-primary" />
                                <span className="text-sm">
                                  {hotel.location?.city}, {hotel.location?.country}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Descripción */}
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {hotel.description || 'Hotel de excelente calidad con todas las comodidades para tu estadía.'}
                          </p>

                          {/* Amenidades */}
                          {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="flex gap-4 mb-4 text-sm text-gray-600">
                              {hotel.amenities.slice(0, 4).map((amenity: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-1">
                                  {amenity.toLowerCase().includes('wifi') && <Wifi size={16} />}
                                  {amenity.toLowerCase().includes('desayuno') && <Coffee size={16} />}
                                  {amenity.toLowerCase().includes('piscina') && <Waves size={16} />}
                                  <span className="text-xs">{amenity}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Habitaciones disponibles */}
                          <div className="flex items-center gap-2 mb-4">
                            <Users size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {hotel.roomTypes?.length || 0} tipos de habitación disponibles
                            </span>
                          </div>

                          {/* Footer con precio */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Desde</p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-primary">
                                  ${getMinPrice(hotel.roomTypes).toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-600">MXN</span>
                              </div>
                              <p className="text-xs text-gray-500">por noche</p>
                            </div>
                            
                            <Link href={`/hotels/${hotel._id}`}>
                              <Button 
                                color="primary"
                                size="lg"
                                className="font-semibold"
                              >
                                Ver Habitaciones
                              </Button>
                            </Link>
                          </div>
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
                <p className="text-gray-600 mb-6">
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HotelSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <HotelSearchContent />
    </Suspense>
  )
}
