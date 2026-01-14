'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Slider, Chip } from '@heroui/react'
import { Search, MapPin, Calendar, SlidersHorizontal, Star, Wifi, Coffee, Waves } from 'lucide-react'
import { DateRangePicker } from '@heroui/react'
import { parseDate } from '@internationalized/date'

interface HotelSearchPanelProps {
  onSearchChange: (params: any) => void
  initialValues?: {
    destination?: string
    checkIn?: string
    checkOut?: string
    adults?: number
    children?: number
    rooms?: number
  }
}

export default function HotelSearchPanel({ onSearchChange, initialValues }: HotelSearchPanelProps) {
  const [destination, setDestination] = useState(initialValues?.destination || '')
  const [dateRange, setDateRange] = useState<any>(null)
  const [adults, setAdults] = useState(initialValues?.adults || 2)
  const [children, setChildren] = useState(initialValues?.children || 0)
  const [rooms, setRooms] = useState(initialValues?.rooms || 1)
  
  // Filtros avanzados
  const [showFilters, setShowFilters] = useState(false)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(10000)
  const [hotelStars, setHotelStars] = useState<number[]>([])
  const [amenities, setAmenities] = useState<string[]>([])

  useEffect(() => {
    if (initialValues?.checkIn && initialValues?.checkOut) {
      try {
        setDateRange({
          start: parseDate(initialValues.checkIn),
          end: parseDate(initialValues.checkOut)
        })
      } catch (e) {
        console.error('Error parsing dates:', e)
      }
    }
  }, [initialValues])

  const handleSearch = () => {
    const params: any = {
      destination,
      adults,
      children,
      rooms
    }

    if (dateRange?.start && dateRange?.end) {
      params.checkIn = dateRange.start.toString()
      params.checkOut = dateRange.end.toString()
    }

    if (minPrice > 0) params.minPrice = minPrice
    if (maxPrice < 10000) params.maxPrice = maxPrice
    if (hotelStars.length > 0) params.hotelStars = hotelStars
    if (amenities.length > 0) params.amenities = amenities

    onSearchChange(params)
  }

  const handleClearFilters = () => {
    setDestination('')
    setDateRange(null)
    setAdults(2)
    setChildren(0)
    setRooms(1)
    setMinPrice(0)
    setMaxPrice(10000)
    setHotelStars([])
    setAmenities([])
  }

  const toggleStar = (star: number) => {
    setHotelStars(prev => 
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    )
  }

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  return (
    <div className="space-y-4">
          {/* Búsqueda principal */}
          <div className="space-y-3">
            {/* Destino */}
            <div>
              <Input
                value={destination}
                onValueChange={setDestination}
                placeholder="¿A dónde viajas?"
                label="Destino"
                startContent={<MapPin size={18} />}
                size="sm"
              />
            </div>

            {/* Fechas */}
            <div>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                label="Check-in / Check-out"
                className="w-full"
                startContent={<Calendar size={18} />}
              />
            </div>

            {/* Huéspedes y Habitaciones */}
            <div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  label="Adultos"
                  value={String(adults)}
                  onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  size="sm"
                />
                <Input
                  type="number"
                  label="Niños"
                  value={String(children)}
                  onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  size="sm"
                />
                <Input
                  type="number"
                  label="Hab."
                  value={String(rooms)}
                  onChange={(e) => setRooms(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Botón de filtros avanzados */}
          <div className="flex items-center gap-2">
            <Button
              variant="flat"
              size="sm"
              startContent={<SlidersHorizontal size={16} />}
              onPress={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros Avanzados
            </Button>
            {(hotelStars.length > 0 || amenities.length > 0 || minPrice > 0 || maxPrice < 10000) && (
              <Chip
                size="sm"
                color="primary"
                variant="flat"
                onClose={handleClearFilters}
              >
                {hotelStars.length + amenities.length + (minPrice > 0 ? 1 : 0) + (maxPrice < 10000 ? 1 : 0)} filtros activos
              </Chip>
            )}
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Precio */}
              <div>
                <p className="text-sm font-semibold mb-3">Precio por noche</p>
                <Slider
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
                  formatOptions={{ style: 'currency', currency: 'USD' }}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>${minPrice.toLocaleString()}</span>
                  <span>${maxPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Estrellas */}
              <div>
                <p className="text-sm font-semibold mb-3">Categoría</p>
                <div className="flex gap-2">
                  {[3, 4, 5].map((star) => (
                    <Chip
                      key={star}
                      variant={hotelStars.includes(star) ? 'solid' : 'bordered'}
                      color={hotelStars.includes(star) ? 'primary' : 'default'}
                      onClick={() => toggleStar(star)}
                      className="cursor-pointer"
                      size="sm"
                    >
                      <div className="flex items-center gap-1">
                        {star} <Star size={12} className={hotelStars.includes(star) ? 'fill-current' : ''} />
                      </div>
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Amenidades */}
              <div>
                <p className="text-sm font-semibold mb-3">Amenidades</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'wifi', label: 'WiFi', icon: <Wifi size={14} /> },
                    { key: 'breakfast', label: 'Desayuno', icon: <Coffee size={14} /> },
                    { key: 'pool', label: 'Piscina', icon: <Waves size={14} /> }
                  ].map((amenity) => (
                    <Chip
                      key={amenity.key}
                      variant={amenities.includes(amenity.key) ? 'solid' : 'bordered'}
                      color={amenities.includes(amenity.key) ? 'primary' : 'default'}
                      onClick={() => toggleAmenity(amenity.key)}
                      className="cursor-pointer"
                      size="sm"
                      startContent={amenity.icon}
                    >
                      {amenity.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-2">
            <Button
              color="primary"
              size="md"
              className="w-full font-bold"
              startContent={<Search size={18} />}
              onPress={handleSearch}
            >
              Buscar Hoteles
            </Button>
            <Button
              variant="bordered"
              size="sm"
              className="w-full"
              onPress={handleClearFilters}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
  )
}
