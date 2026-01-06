'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Checkbox, Input, Slider, Select, SelectItem, CheckboxGroup } from '@heroui/react'
import {
  MapPin,
  Users,
  Plus,
  Minus,
  Search,
  Utensils,
  DollarSign,
  Star,
  Plane,
  Wifi,
  Calendar
} from 'lucide-react'

interface PackageSearchParams {
  destination: string
  adults: number
  children: number
  infants: number
  allInclusive: boolean
  minPrice?: number
  maxPrice?: number
  hotelStars?: number[]
  includesFlights?: boolean
  wifi?: boolean
  duration?: string // '3-4', '5-7', '8+'
  amenities?: string[]
}

interface PackageSearchPanelProps {
  onSearchChange?: (params: PackageSearchParams) => void
  initialValues?: Partial<{
    destination: string
    adults: number
    children: number
    infants: number
    allInclusive: boolean
    minPrice: number
    maxPrice: number
    hotelStars: number[]
    includesFlights: boolean
    wifi: boolean
    duration: string
    amenities: string[]
  }>
}

function PassengerRow({ 
  label, 
  description, 
  value, 
  min, 
  max, 
  onDecrement, 
  onIncrement 
}: {
  label: string
  description: string
  value: number
  min: number
  max: number
  onDecrement: () => void
  onIncrement: () => void
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <Minus size={14} />
        </button>
        <span className="w-7 text-center font-bold text-sm">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

export default function PackageSearchPanel({ onSearchChange, initialValues }: PackageSearchPanelProps) {
  // Limpiar el destino si viene con código IATA (ej: "CUN Cancún" -> "Cancún")
  const cleanInitialDestination = (dest: string) => {
    if (!dest) return ''
    const iataPattern = /^[A-Z]{3}\s+(.+)$/
    const match = dest.match(iataPattern)
    return match ? match[1] : dest
  }

  const [destination, setDestination] = useState(cleanInitialDestination(initialValues?.destination || ''))
  const [adults, setAdults] = useState(initialValues?.adults || 2)
  const [children, setChildren] = useState(initialValues?.children || 0)
  const [infants, setInfants] = useState(initialValues?.infants || 0)
  const [allInclusive, setAllInclusive] = useState(initialValues?.allInclusive ?? false)
  const [priceRange, setPriceRange] = useState<number | number[]>([initialValues?.minPrice || 0, initialValues?.maxPrice || 2500])
  const [hotelStars, setHotelStars] = useState<number[]>(initialValues?.hotelStars || [])
  const [includesFlights, setIncludesFlights] = useState<boolean | undefined>(initialValues?.includesFlights)
  const [wifi, setWifi] = useState<boolean | undefined>(initialValues?.wifi)
  const [duration, setDuration] = useState<string>(initialValues?.duration || '')
  const [showPassengersPopup, setShowPassengersPopup] = useState(false)
  const passengersRef = useRef<HTMLDivElement>(null)

  // Cerrar popup al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passengersRef.current && !passengersRef.current.contains(event.target as Node)) {
        setShowPassengersPopup(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Función para ejecutar búsqueda manualmente
  const handleSearchClick = () => {
    if (onSearchChange) {
      const [minPrice, maxPrice] = Array.isArray(priceRange) ? priceRange : [priceRange, priceRange]
      onSearchChange({
        destination,
        adults,
        children,
        infants,
        allInclusive,
        minPrice,
        maxPrice,
        hotelStars: hotelStars.length > 0 ? hotelStars : undefined,
        includesFlights,
        wifi,
        duration: duration || undefined
      })
    }
  }

  const totalPassengers = adults + children + infants

  return (
    <div className="space-y-4">
      {/* Destino */}
      <div>
        <label className="text-sm font-semibold mb-2 block">Destino</label>
        <Input
          value={destination}
          onValueChange={setDestination}
          placeholder="Buscar por país, ciudad o nombre del paquete..."
          startContent={<MapPin size={18} className="text-primary" />}
          variant="flat"
          classNames={{
            input: "text-sm",
            inputWrapper: "h-11 bg-default-100"
          }}
        />
      </div>

      {/* Personas */}
      <div>
        <label className="text-sm font-semibold mb-2 block">Personas</label>
        <div className="relative" ref={passengersRef}>
          <Button
            variant="flat"
            className="w-full justify-start h-11 bg-default-100"
            startContent={<Users size={18} />}
            onPress={() => setShowPassengersPopup(!showPassengersPopup)}
          >
            <span className="text-sm">
              {totalPassengers} {totalPassengers === 1 ? 'persona' : 'personas'}
            </span>
          </Button>

          {showPassengersPopup && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-divider rounded-lg shadow-lg p-4 space-y-3 z-50">
              <PassengerRow
                label="Adultos"
                description="18+ años"
                value={adults}
                min={1}
                max={9}
                onDecrement={() => setAdults(Math.max(1, adults - 1))}
                onIncrement={() => setAdults(Math.min(9, adults + 1))}
              />
              <PassengerRow
                label="Niños"
                description="2-17 años"
                value={children}
                min={0}
                max={9}
                onDecrement={() => setChildren(Math.max(0, children - 1))}
                onIncrement={() => setChildren(Math.min(9, children + 1))}
              />
              <PassengerRow
                label="Infantes"
                description="0-2 años"
                value={infants}
                min={0}
                max={9}
                onDecrement={() => setInfants(Math.max(0, infants - 1))}
                onIncrement={() => setInfants(Math.min(9, infants + 1))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Rango de Precios */}
      <div>
        <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
          <DollarSign size={16} className="text-primary" />
          Rango de Precio
        </label>
        <Slider
          value={priceRange}
          onChange={setPriceRange}
          minValue={0}
          maxValue={2500}
          step={50}
          formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
          className="w-full"
          classNames={{
            track: "bg-default-200",
            filler: "bg-primary"
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>${Array.isArray(priceRange) ? priceRange[0].toLocaleString() : priceRange.toLocaleString()}</span>
          <span>${Array.isArray(priceRange) ? priceRange[1].toLocaleString() : priceRange.toLocaleString()}</span>
        </div>
      </div>

      {/* Todo Incluido */}
      <div>
        <Checkbox
          isSelected={allInclusive}
          onValueChange={setAllInclusive}
          classNames={{
            label: "text-sm"
          }}
        >
          <div className="flex items-center gap-2">
            <Utensils size={16} />
            <span>Todo incluido</span>
          </div>
        </Checkbox>
      </div>

      {/* Estrellas del Hotel */}
      <div>
        <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
          <Star size={16} className="text-primary" />
          Estrellas del Hotel
        </label>
        <div className="flex gap-2">
          {[3, 4, 5].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => {
                if (hotelStars.includes(stars)) {
                  setHotelStars(hotelStars.filter(s => s !== stars))
                } else {
                  setHotelStars([...hotelStars, stars])
                }
              }}
              className={`flex-1 h-10 rounded-lg border-2 transition-all ${
                hotelStars.includes(stars)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-default-200 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="font-semibold">{stars}</span>
                <Star size={14} fill="currentColor" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Duración */}
      <div>
        <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          Duración
        </label>
        <Select
          selectedKeys={duration ? [duration] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string
            setDuration(selected || '')
          }}
          placeholder="Cualquier duración"
          variant="flat"
          classNames={{
            trigger: "h-11 bg-default-100"
          }}
        >
          <SelectItem key="">Cualquier duración</SelectItem>
          <SelectItem key="3-4">3-4 días</SelectItem>
          <SelectItem key="5-7">5-7 días</SelectItem>
          <SelectItem key="8+">8+ días</SelectItem>
        </Select>
      </div>

      {/* Filtros adicionales */}
      <div className="space-y-2">
        <Checkbox
          isSelected={includesFlights === true}
          onValueChange={(checked) => setIncludesFlights(checked ? true : undefined)}
          classNames={{ label: "text-sm" }}
        >
          <div className="flex items-center gap-2">
            <Plane size={16} />
            <span>Incluye vuelos</span>
          </div>
        </Checkbox>
        
        <Checkbox
          isSelected={wifi === true}
          onValueChange={(checked) => setWifi(checked ? true : undefined)}
          classNames={{ label: "text-sm" }}
        >
          <div className="flex items-center gap-2">
            <Wifi size={16} />
            <span>WiFi incluido</span>
          </div>
        </Checkbox>
      </div>

      {/* Botón de búsqueda */}
      <Button
        color="primary"
        size="lg"
        className="w-full font-semibold"
        startContent={<Search size={20} />}
        onPress={handleSearchClick}
      >
        Buscar Paquetes
      </Button>
    </div>
  )
}
