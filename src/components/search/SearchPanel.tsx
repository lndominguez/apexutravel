'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Card, CardBody, DatePicker, Select, SelectItem, Checkbox } from '@heroui/react'
import {
  Plane,
  MapPin,
  Users,
  Plus,
  Minus,
  Repeat2,
  Zap
} from 'lucide-react'
import { today, getLocalTimeZone, parseDate, type DateValue } from '@internationalized/date'
import LocationAutocomplete from '@/components/public/LocationAutocomplete'

interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: DateValue | null
  returnDate: DateValue | null
  tripType: 'roundtrip' | 'one-way'
  adults: number
  children: number
  infants: number
  directOnly: boolean
}

interface SearchPanelProps {
  onSearchChange?: (params: FlightSearchParams) => void
  initialValues?: Partial<{
    origin: string
    destination: string
    tripType: 'roundtrip' | 'one-way'
    departureDate: string
    returnDate: string
    adults: number
    children: number
    infants: number
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

export default function SearchPanel({ onSearchChange, initialValues }: SearchPanelProps) {
  const [origin, setOrigin] = useState(initialValues?.origin || '')
  const [destination, setDestination] = useState(initialValues?.destination || '')
  const [tripType, setTripType] = useState<'roundtrip' | 'one-way'>(initialValues?.tripType || 'roundtrip')
  const [departureDate, setDepartureDate] = useState<DateValue | null>(null)
  const [returnDate, setReturnDate] = useState<DateValue | null>(null)
  const [adults, setAdults] = useState(initialValues?.adults || 1)
  const [children, setChildren] = useState(initialValues?.children || 0)
  const [infants, setInfants] = useState(initialValues?.infants || 0)
  const [directOnly, setDirectOnly] = useState(false)
  const [showPassengersPopup, setShowPassengersPopup] = useState(false)
  const passengersRef = useRef<HTMLDivElement>(null)
  const [initialized, setInitialized] = useState(false)

  // Inicializar fechas desde initialValues
  useEffect(() => {
    if (initialValues && !initialized) {
      if (initialValues.departureDate) {
        try {
          // parseDate espera formato YYYY-MM-DD
          setDepartureDate(parseDate(initialValues.departureDate))
        } catch (e) {
          console.error('Error parsing departure date:', e)
        }
      }
      if (initialValues.returnDate) {
        try {
          // parseDate espera formato YYYY-MM-DD
          setReturnDate(parseDate(initialValues.returnDate))
        } catch (e) {
          console.error('Error parsing return date:', e)
        }
      }
      setInitialized(true)
    }
  }, [initialValues, initialized])

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

  // Limpiar fecha de regreso cuando se cambia a solo ida
  useEffect(() => {
    if (tripType === 'one-way') {
      setReturnDate(null)
    }
  }, [tripType])

  // Notificar cambios automáticamente
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange({
        origin,
        destination,
        departureDate,
        returnDate,
        tripType,
        adults,
        children,
        infants,
        directOnly
      })
    }
  }, [origin, destination, departureDate, returnDate, tripType, adults, children, infants, directOnly, onSearchChange])

  const totalPassengers = adults + children + infants
  const passengersText = `${totalPassengers} ${totalPassengers === 1 ? 'Pasajero' : 'Pasajeros'}`

  return (
    <div className="w-full space-y-5">
      {/* Tipo de viaje */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide block pl-0.5">
          Tipo de viaje
        </label>
        <Select
          aria-label="Tipo de viaje"
          size="md"
          selectedKeys={new Set([tripType])}
          onChange={e => setTripType(e.target.value as 'roundtrip' | 'one-way')}
          startContent={<Repeat2 size={16} className="text-primary" />}
          variant="flat"
          classNames={{
            trigger: 'h-11 bg-default-100 hover:bg-default-200 transition-colors',
            value: 'text-sm font-medium'
          }}
        >
          <SelectItem key="roundtrip">Ida y vuelta</SelectItem>
          <SelectItem key="one-way">Solo ida</SelectItem>
        </Select>
      </div>

      {/* Ubicaciones */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide block pl-0.5">
          Ubicaciones
        </label>
        <div className="space-y-3">
          <LocationAutocomplete
            value={origin}
            onChange={setOrigin}
            placeholder="Origen"
            type="origin"
            icon={<Plane size={16} className="text-primary" />}
          />
          <LocationAutocomplete
            value={destination}
            onChange={setDestination}
            placeholder="Destino"
            type="destination"
            icon={<MapPin size={16} className="text-primary" />}
          />
        </div>
      </div>

      {/* Fechas */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide block pl-0.5">
          Fechas
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <DatePicker
            label="Salida"
            value={departureDate}
            onChange={setDepartureDate}
            minValue={today(getLocalTimeZone())}
            showMonthAndYearPickers
            size="md"
            variant="flat"
            classNames={{
              input: 'text-base lg:text-sm font-medium',
              inputWrapper: 'h-11 bg-default-100 hover:bg-default-200 transition-colors',
              label: 'text-xs font-medium'
            }}
          />
          <DatePicker
            label="Regreso"
            value={returnDate}
            onChange={setReturnDate}
            minValue={departureDate || today(getLocalTimeZone())}
            showMonthAndYearPickers
            isDisabled={tripType === 'one-way'}
            size="md"
            variant="flat"
            classNames={{
              input: 'text-base lg:text-sm font-medium',
              inputWrapper: 'h-11 bg-default-100 hover:bg-default-200 transition-colors data-[disabled=true]:opacity-40',
              label: 'text-xs font-medium'
            }}
          />
        </div>
      </div>

      {/* Pasajeros */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide block pl-0.5">
          Pasajeros
        </label>
        <div className="relative" ref={passengersRef}>
          <Button
            variant="flat"
            size="md"
            fullWidth
            onPress={() => setShowPassengersPopup(prev => !prev)}
            className="h-11 justify-start bg-default-100 hover:bg-default-200 transition-colors"
          >
            <Users size={16} className="text-primary" />
            <div className="flex-1 text-left">
              <span className="text-sm font-medium">{passengersText}</span>
            </div>
          </Button>

          {showPassengersPopup && (
            <Card className="absolute z-[99999] top-[calc(100%+8px)] left-0 w-full shadow-lg border border-divider rounded-xl">
              <CardBody className="p-4 space-y-3">
                <PassengerRow
                  label="Adultos"
                  description="12+ años"
                  value={adults}
                  min={1}
                  max={9}
                  onDecrement={() => setAdults(Math.max(1, adults - 1))}
                  onIncrement={() => setAdults(Math.min(9, adults + 1))}
                />
                <div className="border-t border-divider" />
                <PassengerRow
                  label="Niños"
                  description="2-11 años"
                  value={children}
                  min={0}
                  max={9}
                  onDecrement={() => setChildren(Math.max(0, children - 1))}
                  onIncrement={() => setChildren(Math.min(9, children + 1))}
                />
                <div className="border-t border-divider" />
                <PassengerRow
                  label="Bebés"
                  description="< 2 años"
                  value={infants}
                  min={0}
                  max={9}
                  onDecrement={() => setInfants(Math.max(0, infants - 1))}
                  onIncrement={() => setInfants(Math.min(9, infants + 1))}
                />
                <div className="pt-2">
                  <Button 
                    size="md" 
                    color="primary" 
                    className="w-full font-medium h-10" 
                    onClick={() => setShowPassengersPopup(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Preferencias */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide block pl-0.5">
          Opciones
        </label>
        <div className="p-3.5 rounded-lg bg-default-100 hover:bg-default-200 transition-colors cursor-pointer"
          onClick={() => setDirectOnly(!directOnly)}
        >
          <Checkbox
            isSelected={directOnly}
            onValueChange={setDirectOnly}
            size="md"
            classNames={{ 
              label: 'text-sm font-medium',
              wrapper: 'after:bg-primary'
            }}
          >
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              <span>Solo vuelos directos</span>
            </div>
          </Checkbox>
        </div>
      </div>
    </div>
  )
}
