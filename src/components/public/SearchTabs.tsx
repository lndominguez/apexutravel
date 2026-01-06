'use client'

import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardBody, DatePicker, Select, SelectItem, Checkbox } from '@heroui/react'
import {
  Plane,
  MapPin,
  Package,
  Hotel,
  Search,
  Users,
  Plus,
  Minus,
  Repeat2,
  Luggage,
  Zap,
  Palette,
  Sparkles,
  BedDouble,
  Utensils,
  CalendarClock
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { today, getLocalTimeZone, type DateValue, parseDate } from '@internationalized/date'
import LocationAutocomplete from './LocationAutocomplete'

type TabKey = 'flights' | 'packages' | 'hotels'

type FlightSearchPrefill = {
  origin?: string
  destination?: string
  departureDate?: string
  returnDate?: string
  passengers?: number
  tripType?: 'roundtrip' | 'one-way'
  directOnly?: boolean
}

type SearchTabsProps = {
  enabledTabs?: TabKey[]
  defaultTab?: TabKey
  initialFlightSearch?: FlightSearchPrefill
  onFlightSearch?: (params: URLSearchParams) => void
}

type PassengerRowProps = {
  label: string
  description: string
  value: number
  min: number
  max: number
  onDecrement: () => void
  onIncrement: () => void
}

function PassengerRow({ label, description, value, min, max, onDecrement, onIncrement }: PassengerRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center font-semibold text-sm">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

type InlineControlProps = {
  icon: LucideIcon
  children: ReactNode
}

function InlineControl({ icon: Icon, children }: InlineControlProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/85 text-slate-900 shadow-sm ring-1 ring-white/60 backdrop-blur">
      <Icon size={18} className="text-primary" />
      <div className="flex-1 min-w-[180px]">{children}</div>
    </div>
  )
}

function FormShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="w-full rounded-[32px] border border-slate-100 bg-white shadow-[0_25px_60px_rgba(15,23,42,0.12)] p-5 sm:p-6"
      style={{ zIndex: 9999 }}
    >
      {children}
    </div>
  )
}

export default function SearchTabs({
  enabledTabs,
  defaultTab = 'packages',
  initialFlightSearch,
  onFlightSearch
}: SearchTabsProps) {
  const tabList = useMemo<TabKey[]>(() => {
    if (enabledTabs && enabledTabs.length > 0) {
      return enabledTabs
    }
    return ['flights', 'hotels', 'packages']
  }, [enabledTabs])
  const defaultActive = tabList.includes(defaultTab) ? defaultTab : tabList[0] || 'flights'
  const [activeTab, setActiveTab] = useState<TabKey>(defaultActive)
  const router = useRouter()

  const openResultsInNewTab = (path: string) => {
    if (typeof window !== 'undefined') {
      const url = path.startsWith('/') ? path : `/${path}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      router.push(path)
    }
  }

  // Estados para búsqueda de vuelos
  const [flightOrigin, setFlightOrigin] = useState('')
  const [flightDestination, setFlightDestination] = useState('')
  const [tripType, setTripType] = useState('round-trip')
  const [departureDate, setDepartureDate] = useState<DateValue | null>(null)
  const [returnDate, setReturnDate] = useState<DateValue | null>(null)

  // Estados para popup de pasajeros y fechas
  const [showPassengersPopup, setShowPassengersPopup] = useState(false)
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const passengersRef = useRef<HTMLDivElement>(null)
  const [flightBags, setFlightBags] = useState('0')
  const [flightDirectOnly, setFlightDirectOnly] = useState(false)

  // Estados para búsqueda de paquetes
  const [packageOrigin, setPackageOrigin] = useState('')
  const [packageDestination, setPackageDestination] = useState('')
  const [packageDepartureDate, setPackageDepartureDate] = useState<DateValue | null>(null)
  const [packageReturnDate, setPackageReturnDate] = useState<DateValue | null>(null)
  const [packageAdults, setPackageAdults] = useState(1)
  const [packageChildren, setPackageChildren] = useState(0)
  const [packageInfants, setPackageInfants] = useState(0)
  const [showPackagePassengers, setShowPackagePassengers] = useState(false)
  const packagePassengersRef = useRef<HTMLDivElement>(null)
  const [packageStyle, setPackageStyle] = useState('standard')
  const [packageAllInclusive, setPackageAllInclusive] = useState(true)

  // Estados para búsqueda de hoteles
  const [hotelCity, setHotelCity] = useState('')
  const [hotelCheckInDate, setHotelCheckInDate] = useState<DateValue | null>(null)
  const [hotelCheckOutDate, setHotelCheckOutDate] = useState<DateValue | null>(null)
  const [hotelAdults, setHotelAdults] = useState(2)
  const [hotelChildren, setHotelChildren] = useState(0)
  const [hotelInfants, setHotelInfants] = useState(0)
  const [showHotelPassengers, setShowHotelPassengers] = useState(false)
  const hotelPassengersRef = useRef<HTMLDivElement>(null)
  const [hotelRooms, setHotelRooms] = useState<string>('1')
  const [hotelBreakfastIncluded, setHotelBreakfastIncluded] = useState(true)
  const [hotelFlexibleDates, setHotelFlexibleDates] = useState(false)

  useEffect(() => {
    if (!tabList.includes(activeTab)) {
      setActiveTab(tabList[0] || 'flights')
    }
  }, [tabList, activeTab])

  const handlePackageSearch = () => {
    const params = new URLSearchParams()
    if (packageDestination) params.set('destination', packageDestination)
    const totalPackagePassengers = packageAdults + packageChildren + packageInfants
    if (totalPackagePassengers > 0) params.set('passengers', String(totalPackagePassengers))
    // Si el usuario marcó "Todo incluido", pasamos la categoría a la búsqueda
    if (packageAllInclusive) params.set('category', 'all_inclusive')
    openResultsInNewTab(`/search/packages?${params.toString()}`)
  }

  const handleFlightSearch = () => {
    const params = new URLSearchParams()
    
    // Origen y destino
    if (flightOrigin) params.set('origin', flightOrigin)
    if (flightDestination) params.set('destination', flightDestination)
    
    // Tipo de viaje
    params.set('tripType', tripType === 'round-trip' ? 'roundtrip' : 'one-way')
    
    // Fechas
    if (departureDate) {
      const depDate = `${departureDate.year}-${String(departureDate.month).padStart(2, '0')}-${String(departureDate.day).padStart(2, '0')}`
      params.set('departureDate', depDate)
    }
    if (returnDate && tripType === 'round-trip') {
      const retDate = `${returnDate.year}-${String(returnDate.month).padStart(2, '0')}-${String(returnDate.day).padStart(2, '0')}`
      params.set('returnDate', retDate)
    }
    
    // Pasajeros (individuales para prellenar el formulario)
    params.set('adults', String(adults))
    params.set('children', String(children))
    params.set('infants', String(infants))
    
    // Vuelos directos
    if (flightDirectOnly) params.set('directOnly', 'true')
    
    if (onFlightSearch) {
      onFlightSearch(params)
    } else {
      openResultsInNewTab(`/search/flights?${params.toString()}`)
    }
  }

  const handleHotelSearch = () => {
    const params = new URLSearchParams()
    if (hotelCity) params.set('city', hotelCity)
    const totalHotelGuests = hotelAdults + hotelChildren + hotelInfants
    if (totalHotelGuests > 0) params.set('guests', String(totalHotelGuests))
    openResultsInNewTab(`/search/hotels?${params.toString()}`)
  }

  // Cerrar popup al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passengersRef.current && !passengersRef.current.contains(event.target as Node)) {
        setShowPassengersPopup(false)
      }
      if (packagePassengersRef.current && !packagePassengersRef.current.contains(event.target as Node)) {
        setShowPackagePassengers(false)
      }
      if (hotelPassengersRef.current && !hotelPassengersRef.current.contains(event.target as Node)) {
        setShowHotelPassengers(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  const roomOptions = [
    { value: '1', label: '1 habitación' },
    { value: '2', label: '2 habitaciones' },
    { value: '3', label: '3 habitaciones' },
    { value: '4', label: '4 habitaciones' },
    { value: '5', label: '5 habitaciones' },
    { value: '6', label: '6+ habitaciones' }
  ]


  const parseISODateValue = (value?: string) => {
    if (!value) return null
    try {
      return parseDate(value)
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (!initialFlightSearch) return

    setFlightOrigin(initialFlightSearch.origin || '')
    setFlightDestination(initialFlightSearch.destination || '')

    setTripType(initialFlightSearch.tripType === 'one-way' ? 'one-way' : 'round-trip')
    setDepartureDate(parseISODateValue(initialFlightSearch.departureDate))
    setReturnDate(parseISODateValue(initialFlightSearch.returnDate))

    const passengers = initialFlightSearch.passengers && initialFlightSearch.passengers > 0
      ? initialFlightSearch.passengers
      : 1
    setAdults(passengers)
    setChildren(0)
    setInfants(0)

    setFlightDirectOnly(Boolean(initialFlightSearch.directOnly))
  }, [initialFlightSearch])

  // Calcular total de pasajeros
  const totalPassengers = adults + children + infants
  const passengersText = `${totalPassengers} ${totalPassengers === 1 ? 'Pasajero' : 'Pasajeros'}`
  // En mobile usamos 2 columnas para que Salida y Regreso queden en horizontal.
  // En desktop mantenemos el layout original con columnas proporcionales.
  const gridLayout =
    'grid grid-cols-2 gap-3 items-center lg:grid-cols-[1.35fr_1.35fr_1fr_1fr_0.85fr_auto]'
  const controlRowClass = 'flex flex-wrap items-center gap-3 px-1'
  const minimalSelectClassNames = {
    trigger:
      'bg-transparent shadow-none border-0 px-0 min-h-0 h-auto text-slate-900 font-semibold data-[hover=true]:bg-white/40',
    value: 'text-base font-semibold text-slate-900',
    placeholder: 'text-base text-slate-500',
    label: 'hidden',
    innerWrapper: 'gap-2',
    helperWrapper: 'hidden',
    selectorIcon: 'text-slate-500'
  }

  // Limpiar fecha de regreso cuando se cambia a solo ida
  useEffect(() => {
    if (tripType === 'one-way') {
      setReturnDate(null)
    }
  }, [tripType])

  return (
    <div className={`w-full relative ${activeTab === 'flights' ? 'space-y-6 pb-16' : 'space-y-6 pb-8'}`}>
      {activeTab === 'flights' && (
        <div className="space-y-4">
          <div className={controlRowClass}>
            <InlineControl icon={Repeat2}>
              <Select
                aria-label="Tipo de viaje"
                size="sm"
                classNames={minimalSelectClassNames}
                selectedKeys={new Set([tripType])}
                onChange={e => setTripType(e.target.value as 'round-trip' | 'one-way')}
              >
                <SelectItem key="round-trip">Ida y vuelta</SelectItem>
                <SelectItem key="one-way">Solo ida</SelectItem>
              </Select>
            </InlineControl>

            <InlineControl icon={Zap}>
              <Checkbox
                isSelected={flightDirectOnly}
                onValueChange={setFlightDirectOnly}
                size="sm"
                classNames={{ label: 'text-sm font-semibold text-slate-800' }}
              >
                Vuelos directos
              </Checkbox>
            </InlineControl>
          </div>

          <FormShell>
            <div className={gridLayout}>
              {/* Origen */}
              <div className="flex-1 min-w-0 col-span-2 lg:col-span-1">
                <LocationAutocomplete
                  value={flightOrigin}
                  onChange={setFlightOrigin}
                  placeholder="Origen"
                  type="origin"
                  icon={<Plane size={20} className="text-gray-400" />}
                />
              </div>

              {/* Destino */}
              <div className="flex-1 min-w-0 col-span-2 lg:col-span-1">
                <LocationAutocomplete
                  value={flightDestination}
                  onChange={setFlightDestination}
                  placeholder="Destino"
                  type="destination"
                  icon={<MapPin size={20} className="text-gray-400" />}
                />
              </div>

              {/* Salida */}
              <div className="min-w-[150px] xl:max-w-[200px]">
                <DatePicker
                  label="Salida"
                  value={departureDate}
                  onChange={setDepartureDate}
                  minValue={today(getLocalTimeZone())}
                  showMonthAndYearPickers
                  size="sm"
                  classNames={{
                    input: 'text-base',
                    inputWrapper: 'h-12'
                  }}
                />
              </div>

              {/* Salida */}
              <div className="min-w-[150px] xl:max-w-[200px]">
                <DatePicker
                  label="Regreso"
                  value={returnDate}
                  onChange={setReturnDate}
                  minValue={departureDate || today(getLocalTimeZone())}
                  showMonthAndYearPickers
                  isDisabled={tripType === 'one-way'}
                  size="sm"
                  classNames={{
                    input: 'text-base',
                    inputWrapper: 'h-12'
                  }}
                />
              </div>
              {/* Pasajeros */}
              <div className="w-full max-w-[220px] relative col-span-2 lg:col-span-1" ref={passengersRef}>
                {/* <Button
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  fullWidth
                  onPress={() => setShowPassengersPopup(prev => !prev)}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-slate-500">Pasajeros</span>
                    <span className="text-sm font-semibold text-slate-800">{passengersText}</span>
                  </div>
                  <Users size={18} className="text-slate-400" />
                </Button> */}
                <Button
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  fullWidth
                  onPress={() => setShowPassengersPopup(prev => !prev)}
                >
                  <div>
                    <span className="block text-xs text-slate-500">Pasajeros</span>
                    <span className="text-sm font-semibold text-slate-800">{passengersText}</span>
                  </div>
                  <Users size={18} className="text-slate-400" />
                </Button>

                {showPassengersPopup && (
                  <Card className="absolute z-[99999] top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[min(360px,calc(100vw-48px))] shadow-2xl border border-slate-100">
                    <CardBody className="p-4 space-y-4">
                      <PassengerRow
                        label="Adultos"
                        description="12+ años"
                        value={adults}
                        min={1}
                        max={9}
                        onDecrement={() => setAdults(Math.max(1, adults - 1))}
                        onIncrement={() => setAdults(Math.min(9, adults + 1))}
                      />
                      <PassengerRow
                        label="Niños"
                        description="2-11 años"
                        value={children}
                        min={0}
                        max={9}
                        onDecrement={() => setChildren(Math.max(0, children - 1))}
                        onIncrement={() => setChildren(Math.min(9, children + 1))}
                      />
                      <PassengerRow
                        label="Bebés"
                        description="{'<'} 2 años"
                        value={infants}
                        min={0}
                        max={9}
                        onDecrement={() => setInfants(Math.max(0, infants - 1))}
                        onIncrement={() => setInfants(Math.min(9, infants + 1))}
                      />
                      <Button size="sm" color="primary" className="w-full" onClick={() => setShowPassengersPopup(false)}>
                        Aplicar
                      </Button>
                    </CardBody>
                  </Card>
                )}
              </div>
              {/* Botón de búsqueda */}
              <div className="flex justify-end col-span-2 lg:col-span-1">
                <Button
                  isIconOnly
                  size="lg"
                  radius="full"
                  color="primary"
                  onPress={handleFlightSearch}
                >
                  <Search size={20} />
                </Button>
              </div>
            </div>
          </FormShell>
        </div>
      )}

      {tabList.includes('packages') && activeTab === 'packages' && (
        <div className="space-y-4">
          <div className={controlRowClass}>
            <InlineControl icon={Sparkles}>
              <Checkbox
                isSelected={packageAllInclusive}
                onValueChange={setPackageAllInclusive}
                size="sm"
                classNames={{ label: 'text-sm font-semibold text-slate-800' }}
              >
                Todo incluido
              </Checkbox>
            </InlineControl>
          </div>

          <FormShell>
            <div className={gridLayout}>
              {/* Origen */}
              <div className="flex-1 min-w-0 col-span-2 lg:col-span-1">
                <LocationAutocomplete
                  value={packageOrigin}
                  onChange={setPackageOrigin}
                  placeholder="Desde"
                  type="origin"
                  icon={<Plane size={20} className="text-gray-400" />}
                />
              </div>

              {/* Destino */}
              <div className="flex-1 min-w-0 col-span-2 lg:col-span-1">
                <LocationAutocomplete
                  value={packageDestination}
                  onChange={setPackageDestination}
                  placeholder="¿A dónde quieres ir?"
                  type="destination"
                  icon={<MapPin size={20} className="text-gray-400" />}
                />
              </div>
              <div className="min-w-[150px] xl:max-w-[200px]">
                <DatePicker
                  label="Salida"
                  value={packageDepartureDate}
                  onChange={setPackageDepartureDate}
                  minValue={today(getLocalTimeZone())}
                  showMonthAndYearPickers
                  size="sm"
                  classNames={{
                    input: 'text-base',
                    inputWrapper: 'h-12'
                  }}
                />
              </div>
              <div className="min-w-[150px] xl:max-w-[200px]">
                <DatePicker
                  label="Regreso"
                  value={packageReturnDate}
                  onChange={setPackageReturnDate}
                  minValue={packageDepartureDate || today(getLocalTimeZone())}
                  showMonthAndYearPickers
                  size="sm"
                  classNames={{
                    input: 'text-base',
                    inputWrapper: 'h-12'
                  }}
                />
              </div>

              {/* Pasajeros */}
              <div className="w-full max-w-[220px] relative col-span-2 lg:col-span-1" ref={packagePassengersRef}>
                <Button
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  fullWidth
                  onPress={() => setShowPackagePassengers(!showPackagePassengers)}
                >
                  <div>
                    <span className="block text-xs text-slate-500">Pasajeros</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {packageAdults + packageChildren + packageInfants} viajeros
                    </span>
                  </div>
                  <Users size={18} className="text-slate-400" />
                </Button>

                {showPackagePassengers && (
                  <Card className="absolute z-[99999] top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[min(360px,calc(100vw-48px))] shadow-2xl border border-slate-100">
                    <CardBody className="p-4 space-y-4">
                      <PassengerRow label="Adultos" description="12+ años" value={packageAdults} min={1} max={9} onDecrement={() => setPackageAdults(Math.max(1, packageAdults - 1))} onIncrement={() => setPackageAdults(Math.min(9, packageAdults + 1))} />
                      <PassengerRow label="Niños" description="2-11 años" value={packageChildren} min={0} max={9} onDecrement={() => setPackageChildren(Math.max(0, packageChildren - 1))} onIncrement={() => setPackageChildren(Math.min(9, packageChildren + 1))} />
                      <PassengerRow label="Bebés" description="{'<'} 2 años" value={packageInfants} min={0} max={9} onDecrement={() => setPackageInfants(Math.max(0, packageInfants - 1))} onIncrement={() => setPackageInfants(Math.min(9, packageInfants + 1))} />
                      <Button size="sm" color="primary" className="w-full" onClick={() => setShowPackagePassengers(false)}>
                        Aplicar
                      </Button>
                    </CardBody>
                  </Card>
                )}
              </div>

              {/* Botón de búsqueda */}
              <div className="flex justify-end col-span-2 lg:col-span-1">
                <Button
                  isIconOnly
                  size="lg"
                  radius="full"
                  color="primary"
                  onPress={handlePackageSearch}
                >
                  <Search size={20} />
                </Button>
              </div>
            </div>
          </FormShell>
        </div>
      )}

      {tabList.includes('hotels') && activeTab === 'hotels' && (
        <div className="space-y-4">
          <div className={controlRowClass}>
            <InlineControl icon={BedDouble}>
              <Select
                aria-label="Habitaciones"
                classNames={minimalSelectClassNames}
                selectedKeys={new Set([hotelRooms])}
                onSelectionChange={keys => {
                  const selected = Array.from(keys)[0]
                  if (typeof selected === 'string') {
                    setHotelRooms(selected)
                  }
                }}
                size="sm"
                variant="bordered"
                color="primary"
              >
                {roomOptions.map(option => (
                  <SelectItem key={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>


            </InlineControl>
          </div>

          <FormShell>
            <div className={gridLayout}>
              {/* Ciudad / destino */}
              <div className="w-full min-w-0 col-span-2 lg:col-span-2">
                <LocationAutocomplete
                  value={hotelCity}
                  onChange={setHotelCity}
                  placeholder="Ciudad o destino"
                  type="destination"
                  icon={<MapPin size={20} className="text-gray-400" />}
                />
              </div>
              <div className="min-w-[150px] xl:max-w-[200px]">
                <DatePicker
                  label="Check-in"
                  value={hotelCheckInDate}
                  onChange={setHotelCheckInDate}
                  minValue={today(getLocalTimeZone())}
                  showMonthAndYearPickers
                  size="sm"
                  classNames={{
                    input: 'text-base',
                    inputWrapper: 'h-12'
                  }}
                />
              </div>
              <div className="min-w-[150px] xl:max-w-[200px]">
                <DatePicker
                  label="Check-out"
                  value={hotelCheckOutDate}
                  onChange={setHotelCheckOutDate}
                  minValue={hotelCheckInDate || today(getLocalTimeZone())}
                  showMonthAndYearPickers
                  size="sm"
                  classNames={{
                    input: 'text-base',
                    inputWrapper: 'h-12'
                  }}
                />
              </div>

              {/* Huéspedes */}
              <div className="w-full max-w-[220px] relative col-span-2 lg:col-span-1" ref={hotelPassengersRef}>
                <Button
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  fullWidth
                  onPress={() => setShowHotelPassengers(!showHotelPassengers)}
                >
                  <div>
                    <span className="block text-xs text-slate-500">Huéspedes</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {hotelAdults + hotelChildren + hotelInfants} huéspedes
                    </span>
                  </div>
                  <Users size={18} className="text-slate-400" />
                </Button>

                {showHotelPassengers && (
                  <Card className="absolute z-[99999] top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[min(360px,calc(100vw-48px))] shadow-2xl border border-slate-100">
                    <CardBody className="p-4 space-y-4">
                      <PassengerRow label="Adultos" description="12+ años" value={hotelAdults} min={1} max={9} onDecrement={() => setHotelAdults(Math.max(1, hotelAdults - 1))} onIncrement={() => setHotelAdults(Math.min(9, hotelAdults + 1))} />
                      <PassengerRow label="Niños" description="2-11 años" value={hotelChildren} min={0} max={9} onDecrement={() => setHotelChildren(Math.max(0, hotelChildren - 1))} onIncrement={() => setHotelChildren(Math.min(9, hotelChildren + 1))} />
                      <PassengerRow label="Bebés" description="{'<'} 2 años" value={hotelInfants} min={0} max={9} onDecrement={() => setHotelInfants(Math.max(0, hotelInfants - 1))} onIncrement={() => setHotelInfants(Math.min(9, hotelInfants + 1))} />
                      <Button size="sm" color="primary" className="w-full" onClick={() => setShowHotelPassengers(false)}>
                        Aplicar
                      </Button>
                    </CardBody>
                  </Card>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  isIconOnly
                  size="lg"
                  radius="full"
                  color="primary"
                  onPress={handleHotelSearch}
                >
                  <Search size={20} />
                </Button>
              </div>
            </div>
          </FormShell>
        </div>
      )}

      {/* Tabs debajo */}
      {/* {tabList.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { key: 'flights', label: 'Vuelos', icon: Plane, accent: 'from-sky-400/90 via-cyan-300/80 to-emerald-300/80' },
            { key: 'hotels', label: 'Hoteles', icon: Hotel, accent: 'from-rose-400/90 via-pink-300/80 to-amber-300/80' },
            { key: 'packages', label: 'Paquetes', icon: Package, accent: 'from-violet-400/90 via-indigo-300/80 to-blue-300/80' }
          ]
            .filter(tab => tabList.includes(tab.key as TabKey))
            .map(({ key, label, icon: Icon, accent }) => {
              const isActive = activeTab === (key as TabKey)
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabKey)}
                  className={`group relative overflow-hidden rounded-2xl border px-6 py-3 text-sm font-semibold transition-all duration-300 backdrop-blur-md ${isActive
                    ? 'border-white/60 bg-white/20 text-white shadow-[0_15px_40px_rgba(15,23,42,0.35)]'
                    : 'border-white/30 bg-white/10 text-white/95 hover:text-white hover:border-white/50 hover:bg-white/15'
                    }`}
                >
                  <div className="flex items-center gap-2 relative z-10">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center bg-white/15 ${isActive ? 'text-white' : 'text-white/90'
                        }`}
                    >
                      <Icon size={16} />
                    </div>
                    <span>{label}</span>
                  </div>
                  {isActive && (
                    <div
                      className={`absolute inset-0 opacity-90 blur-xl transition-all duration-300 bg-gradient-to-r ${accent}`}
                    />
                  )}
                  <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )
            })}
        </div>
      )} */}
    </div>
  )
}
