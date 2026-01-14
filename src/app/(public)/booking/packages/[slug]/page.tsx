'use client'

import { use, useState, useEffect, useRef } from 'react'
import { Card, CardBody, Button, Chip, Image, Tabs, Tab, Input, DatePicker, Popover, PopoverTrigger, PopoverContent, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from '@heroui/react'
import { MapPin, Calendar, Users, Check, X, Star, Hotel as HotelIcon, ArrowLeft, Info, ChevronLeft, ChevronRight, Plus, Minus, Bed, Utensils, FileText, DoorOpen, Sparkles, Shield, Baby, Dog } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchLayout } from '@/components/layout/SearchLayout'
import { parseDate } from '@internationalized/date'

// Capacidades máximas por tipo de ocupación
const OCCUPANCY_LIMITS = {
  single: { adults: 1, children: 0, infants: 0 },
  double: { adults: 2, children: 1, infants: 1 },
  triple: { adults: 3, children: 2, infants: 1 },
  quad: { adults: 4, children: 2, infants: 2 }
} as const

export default function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  // Estados del formulario de reserva
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [startDate, setStartDate] = useState<any>(null)
  const [endDateManual, setEndDateManual] = useState<any>(null)
  const [totalPrice, setTotalPrice] = useState(0)
  const [pkg, setPkg] = useState<any>(null)
  
  // Estados para selección de habitación y ocupancy
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0)
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>('single')
  const [roomImageIndex, setRoomImageIndex] = useState(0)
  
  // Estado para selector de huéspedes
  const [isGuestsOpen, setIsGuestsOpen] = useState(false)
  
  // Extraer info de items[] para compatibilidad
  const hotelItem = pkg?.items?.find((item: any) => item.resourceType === 'Hotel')
  const hotelInfo = hotelItem?.hotelInfo
  const location = hotelInfo?.location
  const images = pkg?.coverPhoto ? [pkg.coverPhoto, ...(hotelInfo?.photos || [])] : (hotelInfo?.photos || ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'])
  const hotelAmenities = (hotelInfo as any)?.amenities || []
  
  // Las habitaciones ya vienen enriquecidas con fotos desde el endpoint
  const selectedRooms = hotelItem?.selectedRooms || []
  
  // Obtener markup de la oferta (NO se usa para paquetes de proveedor, el precio ya está calculado)
  const offerMarkup = pkg?.pricing?.markup || { type: 'percentage', value: 0 }
  
  // Para paquetes, la duración es FIJA (no se calcula por fechas)
  const duration = pkg?.duration || { days: 5, nights: 4 }
  
  // endDate para compatibilidad
  const endDate = endDateManual

  const toUtcMidnight = (value: any): Date | null => {
    if (!value) return null
    
    // Si es un objeto CalendarDate de @internationalized/date
    if (value?.calendar && value?.year && value?.month && value?.day) {
      const year = value.year
      const month = String(value.month).padStart(2, '0')
      const day = String(value.day).padStart(2, '0')
      return new Date(`${year}-${month}-${day}T00:00:00Z`)
    }
    
    // Si es string en formato YYYY-MM-DD
    const s = typeof value === 'string' ? value : (value?.toString?.() ?? '')
    if (!s) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00Z`)
    
    // Si es Date u otro formato
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return null
    const iso = d.toISOString().split('T')[0]
    return new Date(`${iso}T00:00:00Z`)
  }

  const addDaysUtc = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

  const diffDaysUtc = (start: Date, end: Date) => Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))

  
  // Fetch del paquete usando API pública
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPackage() {
      try {
        const res = await fetch(`/api/public/booking/packages/${resolvedParams.slug}`, { cache: 'no-store' })
        const data = await res.json()
        if (data.success) {
          setPkg(data.data)
          setSelectedRoomIndex(0)
          setRoomImageIndex(0)
          
          // Setear fechas desde validFrom y calcular fecha de fin basada en duration del paquete
          const firstRoom = data.data?.items?.find((item: any) => item.resourceType === 'Hotel')?.selectedRooms?.[0]
          if (firstRoom?.validFrom) {
            const validFromDate = new Date(firstRoom.validFrom)
            setStartDate(parseDate(validFromDate.toISOString().split('T')[0]))
            
            // Calcular fecha de fin basada en la duración del paquete
            const packageDuration = data.data?.duration?.days || 5
            const calculatedEndDate = new Date(validFromDate.getTime() + (packageDuration * 24 * 60 * 60 * 1000))
            setEndDateManual(parseDate(calculatedEndDate.toISOString().split('T')[0]))
          }
        }
      } catch (error) {
        console.error('Error fetching package:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPackage()
  }, [resolvedParams.slug])


  useEffect(() => {
    const defaultRoom = selectedRooms?.[0]
    if (!defaultRoom?.capacityPrices) {
      return
    }
    
    // Detectar qué ocupaciones están disponibles basándose en capacityPrices
    const availableOccupancies = Object.keys(defaultRoom.capacityPrices)
    
    if (availableOccupancies.length === 0) return
    
    // Preferir 'double' si está disponible, sino usar la primera disponible
    const defaultOccupancy = availableOccupancies.includes('double') 
      ? 'double' 
      : availableOccupancies[0]
    
    setSelectedOccupancy(defaultOccupancy)
  }, [pkg])

  // Ajustar cantidad de personas cuando cambia la ocupación
  useEffect(() => {
    const limits = getMaxCapacity(selectedOccupancy)
    
    // Ajustar adultos si excede el límite
    if (adults > limits.adults) {
      setAdults(limits.adults)
    }
    
    // Ajustar niños si excede el límite
    if (children > limits.children) {
      setChildren(limits.children)
    }
    
    // Ajustar infantes si excede el límite
    if (infants > limits.infants) {
      setInfants(limits.infants)
    }
  }, [selectedOccupancy])

  // Calcular precio total cuando cambian los valores
  // IMPORTANTE: Para paquetes, el precio NO se multiplica por noches, pero SÍ por cantidad de personas
  useEffect(() => {
    if (!selectedRooms || selectedRooms.length === 0) return
    
    const selectedRoom = selectedRooms[selectedRoomIndex]
    if (!selectedRoom?.capacityPrices) return
    
    // Obtener el precio según la ocupación seleccionada (single/double/triple/quad)
    const priceForOccupancy = selectedRoom.capacityPrices[selectedOccupancy]
    
    if (!priceForOccupancy) {
      setTotalPrice(0)
      return
    }
    
    // Calcular precio total multiplicando por cantidad de personas
    // Los capacityPrices ya incluyen el markup aplicado al crear la oferta
    const adultPrice = (priceForOccupancy.adult || 0) * adults
    const childPrice = (priceForOccupancy.child || 0) * children
    const infantPrice = (priceForOccupancy.infant || 0) * infants
    
    const total = adultPrice + childPrice + infantPrice
    
    setTotalPrice(total)
  }, [selectedRoomIndex, selectedOccupancy, selectedRooms, adults, children, infants])

  // Validación de capacidad
  const getMaxCapacity = (occupancy: string) => {
    return OCCUPANCY_LIMITS[occupancy as keyof typeof OCCUPANCY_LIMITS] || OCCUPANCY_LIMITS.single
  }

  const isValidCapacity = () => {
    const limits = getMaxCapacity(selectedOccupancy)
    return adults <= limits.adults && children <= limits.children && infants <= limits.infants
  }

  const getCapacityError = () => {
    const limits = getMaxCapacity(selectedOccupancy)
    const errors = []
    
    if (adults > limits.adults) errors.push(`máximo ${limits.adults} adulto${limits.adults > 1 ? 's' : ''}`)
    if (children > limits.children) errors.push(`máximo ${limits.children} niño${limits.children > 1 ? 's' : ''}`)
    if (infants > limits.infants) errors.push(`máximo ${limits.infants} infante${limits.infants > 1 ? 's' : ''}`)
    
    return errors.length > 0 ? `Ocupación ${selectedOccupancy}: ${errors.join(', ')}` : null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ec9c12]/20 border-t-[#ec9c12] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles del paquete...</p>
        </div>
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Paquete no encontrado</h2>
          <Button as={Link} href="/" className="bg-[#ec9c12] text-white">
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 200
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const availableStock = selectedRooms.length > 0
    ? selectedRooms.reduce((max: number, room: any) => {
        const stock = (room?.availability ?? room?.stock ?? 0) as number
        return stock > max ? stock : max
      }, 0)
    : 0

  return (
    <SearchLayout
      moduleTitle="Detalles del Paquete"
      moduleIcon={<HotelIcon size={24} />}
      moduleDescription={pkg?.name || 'Cargando...'}
      searchPanel={null}
    >
      {/* Botón volver */}
      <div className="container mx-auto px-4 pt-4">
        <Button
          variant="light"
          startContent={<ArrowLeft size={20} />}
          onPress={() => router.back()}
          className="mb-2"
        >
          Volver
        </Button>
      </div>

      {/* Layout principal en 3 columnas */}
      <div className="container mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Area izquierda (Columnas 1 + 2) */}
          <div className="lg:col-span-9 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
              {/* Columna 1 - Galería de fotos */}
              <div className="lg:col-span-5 space-y-4">
                {/* Imagen principal */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={images[selectedImage]}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                  />
                  {availableStock > 0 && (
                    <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-md text-sm font-semibold">
                      En stock
                    </div>
                  )}
                </div>

                {/* Miniaturas horizontales */}
                <div className="grid grid-cols-5 gap-2">
                  {images.slice(0, 5).map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedImage === idx ? 'ring-3 ring-[#0c3f5b]' : 'opacity-60 hover:opacity-100'
                      }`}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img 
                        src={img} 
                        alt={`Vista ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

              </div>

              {/* Columna 2 - Info y opciones */}
              <div className="lg:col-span-4 space-y-6">
                {/* Título y rating */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{pkg.name}</h1>
                  {hotelInfo?.name && hotelInfo.name !== pkg.name && (
                    <p className="text-lg text-gray-600 mb-3">{hotelInfo.name}</p>
                  )}
                  
                  {/* Rating y reviews */}
                  <div className="flex items-center gap-3 mb-3">
                    {hotelInfo?.stars && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} fill={i < hotelInfo.stars ? "#f1c203" : "none"} className={i < hotelInfo.stars ? "text-[#f1c203]" : "text-gray-300"} />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">{hotelInfo.stars}</span>
                      </div>
                    )}
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{pkg.code || 'HTL'}</span>
                  </div>

                  {/* Ubicación */}
                  {location && (
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <MapPin size={16} className="text-[#0c3f5b]" />
                      <span className="text-sm">{location.city}, {location.country}</span>
                    </div>
                  )}

                </div>

                <Card>
                  <CardBody className="p-3 space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Habitación</h3>
                      {selectedRooms && selectedRooms.length > 0 ? (
                        <Select
                          label="Habitación"
                          placeholder="Selecciona una habitación"
                          selectedKeys={[selectedRoomIndex.toString()]}
                          defaultSelectedKeys={["0"]}
                          onChange={(e) => {
                            const newIndex = parseInt(e.target.value)
                            setSelectedRoomIndex(newIndex)
                            setRoomImageIndex(0)
                          }}
                          className="w-full"
                          classNames={{
                            trigger: "border-[#0c3f5b]/20 data-[hover=true]:border-[#0c3f5b] min-h-[48px]",
                            value: "text-[#0c3f5b] font-semibold",
                            popoverContent: "min-w-[420px]"
                          }}
                        >
                          {selectedRooms.map((room: any, idx: number) => (
                            <SelectItem
                              key={idx.toString()}
                              textValue={room.name}
                              className="py-2"
                            >
                              <div className="flex justify-between items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">{room.name}</p>
                                  {room.plan && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {room.plan === 'all_inclusive' ? 'Todo incluido' :
                                       room.plan === 'full_board' ? 'Pensión completa' :
                                       room.plan === 'half_board' ? 'Media pensión' :
                                       room.plan === 'breakfast' ? 'Desayuno' : 'Solo alojamiento'}
                                    </p>
                                  )}
                                </div>
                                {room.availability != null && (
                                  <Chip size="sm" className="bg-[#ec9c12] text-white flex-shrink-0">
                                    {room.availability} disp.
                                  </Chip>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-500">No hay habitaciones disponibles</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Fotos de la habitación</h3>
                      {selectedRooms[selectedRoomIndex]?.images && selectedRooms[selectedRoomIndex].images.length > 0 ? (
                        <div className="relative">
                          <div className="aspect-[21/9] rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={selectedRooms[selectedRoomIndex].images[roomImageIndex]}
                              alt={`Habitación ${selectedRooms[selectedRoomIndex].name}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {selectedRooms[selectedRoomIndex].images.length > 1 && (
                            <div className="grid grid-cols-6 gap-1 mt-1.5">
                              {selectedRooms[selectedRoomIndex].images.slice(0, 6).map((img: string, idx: number) => (
                                <div
                                  key={idx}
                                  className={`aspect-square rounded-md overflow-hidden cursor-pointer transition-all ${
                                    roomImageIndex === idx ? 'ring-2 ring-[#0c3f5b]' : 'opacity-60 hover:opacity-100'
                                  }`}
                                  onClick={() => setRoomImageIndex(idx)}
                                >
                                  <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-[21/9] rounded-lg bg-gray-100 flex items-center justify-center">
                          <p className="text-sm text-gray-500">No hay fotos disponibles</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Ocupación</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedRooms[selectedRoomIndex]?.capacityPrices && Object.keys(selectedRooms[selectedRoomIndex].capacityPrices).length > 0 ? (
                          Object.keys(selectedRooms[selectedRoomIndex].capacityPrices).map((occ: string) => (
                            <Button
                              key={occ}
                              size="sm"
                              variant={selectedOccupancy === occ ? "solid" : "bordered"}
                              className={selectedOccupancy === occ ? "bg-[#0c3f5b] text-white" : ""}
                              onPress={() => setSelectedOccupancy(occ)}
                            >
                              {occ === 'single' ? 'Simple' :
                               occ === 'double' ? 'Doble' :
                               occ === 'triple' ? 'Triple' :
                               occ === 'quad' ? 'Cuádruple' : occ}
                            </Button>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No hay tipos de ocupación disponibles</p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>

              </div>
            </div>

            {/* Tabs de contenido - Solo debajo del area izquierda */}
            <div>
              <Card>
                <CardBody className="p-6">
                  <Tabs aria-label="Información del paquete" className="[&_[data-selected=true]]:text-[#0c3f5b]" variant="underlined">
                    <Tab key="description" title={
                      <div className="flex items-center gap-2">
                        <FileText size={16} />
                        <span>Descripción</span>
                      </div>
                    }>
                      <div className="py-6">
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                          <p className="text-gray-700 leading-relaxed text-base">{pkg.description || 'Paquete turístico completo con excelentes servicios.'}</p>
                        </div>
                      </div>
                    </Tab>

                    <Tab key="selectedRoom" title={
                      <div className="flex items-center gap-2">
                        <DoorOpen size={16} />
                        <span>Habitación seleccionada</span>
                      </div>
                    }>
                      <div className="py-6">
                        {selectedRooms[selectedRoomIndex] ? (
                          <div className="space-y-6">
                            <div className="bg-gradient-to-br from-[#0c3f5b]/5 to-transparent rounded-xl p-6 border border-[#0c3f5b]/10">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="bg-[#0c3f5b] p-2 rounded-lg">
                                  <Bed size={20} className="text-white" />
                                </div>
                                <p className="text-xl font-bold text-gray-900">{selectedRooms[selectedRoomIndex].name}</p>
                              </div>
                              {selectedRooms[selectedRoomIndex].plan && (
                                <div className="flex items-center gap-2 mt-3">
                                  <Utensils size={16} className="text-[#ec9c12]" />
                                  <p className="text-sm text-gray-600 font-medium">
                                    {selectedRooms[selectedRoomIndex].plan === 'all_inclusive' ? 'Todo incluido' :
                                     selectedRooms[selectedRoomIndex].plan === 'full_board' ? 'Pensión completa' :
                                     selectedRooms[selectedRoomIndex].plan === 'half_board' ? 'Media pensión' :
                                     selectedRooms[selectedRoomIndex].plan === 'breakfast' ? 'Desayuno' : 'Solo alojamiento'}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white border-2 border-gray-100 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                  <Info size={18} className="text-[#0c3f5b]" />
                                  <p className="font-bold text-gray-800">Características</p>
                                </div>
                                <div className="space-y-3">
                                  {selectedRooms[selectedRoomIndex].category && (
                                    <div className="flex items-start gap-3">
                                      <Star size={16} className="text-[#f1c203] mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-gray-500 font-medium">Categoría</p>
                                        <p className="text-sm text-gray-800 capitalize">{selectedRooms[selectedRoomIndex].category.replace(/_/g, ' ')}</p>
                                      </div>
                                    </div>
                                  )}
                                  {selectedRooms[selectedRoomIndex].viewType?.length > 0 && (
                                    <div className="flex items-start gap-3">
                                      <MapPin size={16} className="text-[#0c3f5b] mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-gray-500 font-medium">Vista</p>
                                        <p className="text-sm text-gray-800 capitalize">{selectedRooms[selectedRoomIndex].viewType.join(', ').replace(/_/g, ' ')}</p>
                                      </div>
                                    </div>
                                  )}
                                  {selectedRooms[selectedRoomIndex].capacityPrices && Object.keys(selectedRooms[selectedRoomIndex].capacityPrices).length > 0 && (
                                    <div className="flex items-start gap-3">
                                      <Users size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-gray-500 font-medium">Ocupación</p>
                                        <p className="text-sm text-gray-800 capitalize">{Object.keys(selectedRooms[selectedRoomIndex].capacityPrices).join(', ')}</p>
                                      </div>
                                    </div>
                                  )}
                                  {selectedRooms[selectedRoomIndex].availability != null && (
                                    <div className="flex items-start gap-3">
                                      <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-gray-500 font-medium">Disponibilidad</p>
                                        <p className="text-sm text-gray-800 font-semibold">{selectedRooms[selectedRoomIndex].availability} habitaciones</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white border-2 border-gray-100 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                  <Sparkles size={18} className="text-[#ec9c12]" />
                                  <p className="font-bold text-gray-800">Amenidades</p>
                                </div>
                                {selectedRooms[selectedRoomIndex].amenities?.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {selectedRooms[selectedRoomIndex].amenities.map((a: string, idx: number) => (
                                      <Chip key={idx} size="sm" className="bg-blue-50 text-blue-700 font-medium">{a}</Chip>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Amenidades no disponibles</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <DoorOpen size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">Selecciona una habitación para ver detalles</p>
                          </div>
                        )}
                      </div>
                    </Tab>

                    <Tab key="amenities" title={
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} />
                        <span>Amenidades</span>
                      </div>
                    }>
                      <div className="py-6">
                        {hotelAmenities.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {hotelAmenities.map((a: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-[#0c3f5b]/30 hover:shadow-sm transition-all">
                                <Check size={16} className="text-[#0c3f5b] flex-shrink-0" />
                                <span className="text-sm text-gray-700 font-medium">{a}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <Sparkles size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">Amenidades no disponibles</p>
                          </div>
                        )}
                      </div>
                    </Tab>

                    <Tab key="policies" title={
                      <div className="flex items-center gap-2">
                        <Shield size={16} />
                        <span>Políticas</span>
                      </div>
                    }>
                      <div className="py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {hotelInfo?.policies?.checkIn && (
                            <div className="bg-white border-2 border-gray-100 rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                  <DoorOpen size={18} className="text-green-700" />
                                </div>
                                <p className="font-bold text-gray-800">Check-in</p>
                              </div>
                              <p className="text-sm text-gray-600 ml-10">{hotelInfo.policies.checkIn}</p>
                            </div>
                          )}
                          {hotelInfo?.policies?.checkOut && (
                            <div className="bg-white border-2 border-gray-100 rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="bg-red-100 p-2 rounded-lg">
                                  <DoorOpen size={18} className="text-red-700" />
                                </div>
                                <p className="font-bold text-gray-800">Check-out</p>
                              </div>
                              <p className="text-sm text-gray-600 ml-10">{hotelInfo.policies.checkOut}</p>
                            </div>
                          )}
                          {hotelInfo?.policies?.cancellation && (
                            <div className="bg-white border-2 border-gray-100 rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                  <X size={18} className="text-orange-700" />
                                </div>
                                <p className="font-bold text-gray-800">Cancelación</p>
                              </div>
                              <p className="text-sm text-gray-600 ml-10">{hotelInfo.policies.cancellation}</p>
                            </div>
                          )}
                          {hotelInfo?.policies?.children && (
                            <div className="bg-white border-2 border-gray-100 rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <Baby size={18} className="text-blue-700" />
                                </div>
                                <p className="font-bold text-gray-800">Niños</p>
                              </div>
                              <p className="text-sm text-gray-600 ml-10">{hotelInfo.policies.children}</p>
                            </div>
                          )}
                          {hotelInfo?.policies?.pets && (
                            <div className="bg-white border-2 border-gray-100 rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                  <Dog size={18} className="text-purple-700" />
                                </div>
                                <p className="font-bold text-gray-800">Mascotas</p>
                              </div>
                              <p className="text-sm text-gray-600 ml-10">{hotelInfo.policies.pets}</p>
                            </div>
                          )}
                        </div>
                        {!hotelInfo?.policies?.checkIn && !hotelInfo?.policies?.checkOut && !hotelInfo?.policies?.cancellation && !hotelInfo?.policies?.children && !hotelInfo?.policies?.pets && (
                          <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <Shield size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">Políticas no disponibles</p>
                          </div>
                        )}
                      </div>
                    </Tab>
                  </Tabs>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Columna 3 - Precio y reserva (Sticky independiente) */}
          <div className="lg:col-span-3">
            <div className="sticky top-24">
              {/* Card principal minimalista */}
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
                
                {/* Header con precio */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1 w-12 bg-gradient-to-r from-[#ec9c12] to-[#f1c203] rounded-full"></div>
                      <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total</span>
                    </div>
                    
                    {selectedRooms[selectedRoomIndex] && (
                      <div className="mb-4">
                        <Chip size="sm" className="bg-white/10 text-white border border-white/20">
                          <div className="flex items-center gap-1">
                            <Bed size={12} />
                            <span className="text-xs">{selectedRooms[selectedRoomIndex].name}</span>
                          </div>
                        </Chip>
                      </div>
                    )}
                    
                    <div className="mb-2 overflow-x-auto">
                      <div className="flex items-baseline gap-3 w-fit">
                        <span className="font-black text-white tracking-tight tabular-nums text-5xl sm:text-6xl whitespace-nowrap">
                          ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.floor(totalPrice))}
                        </span>
                        <span className="font-bold text-white/50 text-xl sm:text-2xl whitespace-nowrap">
                          USD
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      {selectedOccupancy && (
                        <>
                          <Users size={14} />
                          <span>
                            {selectedOccupancy === 'single' ? 'Simple' :
                             selectedOccupancy === 'double' ? 'Doble' :
                             selectedOccupancy === 'triple' ? 'Triple' :
                             selectedOccupancy === 'quad' ? 'Cuádruple' : selectedOccupancy}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección de ajustes inline */}
                <div className="p-4 space-y-4">
                  
                  {/* RangePicker de fechas */}
                  <div>
                    <label className="text-sm font-bold text-gray-900 mb-3 block">Fecha de ida</label>
                    <DatePicker
                      label="Fecha de ida"
                      value={startDate}
                      onChange={(date) => {
                        setStartDate(date)
                        const start = toUtcMidnight(date)
                        if (!start) {
                          setEndDateManual(null)
                          return
                        }
                        const daysToAdd = duration?.days || 5
                        const end = addDaysUtc(start, daysToAdd)
                        setEndDateManual(parseDate(end.toISOString().split('T')[0]))
                      }}
                      minValue={parseDate(new Date().toISOString().split('T')[0])}
                      classNames={{
                        base: "w-full",
                        inputWrapper: "border-2 border-gray-200 hover:border-[#0c3f5b]"
                      }}
                    />
                    {selectedRooms[selectedRoomIndex]?.validFrom && selectedRooms[selectedRoomIndex]?.validTo && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700">
                          <span className="font-semibold">Disponibilidad:</span> {new Date(selectedRooms[selectedRoomIndex].validFrom).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(selectedRooms[selectedRoomIndex].validTo).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {startDate && endDateManual && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <Calendar size={12} className="text-[#0c3f5b]" />
                        <span className="font-semibold">
                          Regreso: {(() => {
                            const start = toUtcMidnight(startDate)
                            if (!start) return ''
                            const daysToAdd = duration?.days || 5
                            const end = addDaysUtc(start, daysToAdd)
                            return end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                          })()}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="font-semibold">
                          {duration?.days || 5} {(duration?.days || 5) === 1 ? 'día' : 'días'} / {duration?.nights || 4} {(duration?.nights || 4) === 1 ? 'noche' : 'noches'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Selector de huéspedes con Popover */}
                  <div>
                    <label className="text-sm font-bold text-gray-900 mb-3 block">Huéspedes</label>
                    <Popover placement="bottom" isOpen={isGuestsOpen} onOpenChange={setIsGuestsOpen}>
                      <PopoverTrigger>
                        <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-[#0c3f5b] transition-colors">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-[#0c3f5b]" />
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold text-gray-900">{adults} adulto{adults !== 1 ? 's' : ''}</span>
                              {(children > 0 || infants > 0) && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  {children > 0 && <span className="text-gray-700">{children} niño{children !== 1 ? 's' : ''}</span>}
                                  {children > 0 && infants > 0 && <span className="text-gray-400">•</span>}
                                  {infants > 0 && <span className="text-gray-700">{infants} infante{infants !== 1 ? 's' : ''}</span>}
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={16} className={`text-gray-400 transition-transform ${isGuestsOpen ? 'rotate-90' : ''}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="p-4 space-y-4">
                          {!isValidCapacity() && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs text-red-700 font-medium">
                                ⚠️ {getCapacityError()}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#0c3f5b] rounded-lg">
                                <Users size={16} className="text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">Adultos</p>
                                <p className="text-xs text-gray-500">Mayores de 18 años</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button isIconOnly size="sm" variant="flat" className="min-w-8 h-8" onPress={() => setAdults(Math.max(1, adults - 1))}>
                                <Minus size={14} />
                              </Button>
                              <span className="w-8 text-center font-bold text-gray-900">{adults}</span>
                              <Button 
                                isIconOnly 
                                size="sm" 
                                className="bg-[#0c3f5b] text-white min-w-8 h-8" 
                                onPress={() => setAdults(Math.min(getMaxCapacity(selectedOccupancy).adults, adults + 1))}
                                isDisabled={adults >= getMaxCapacity(selectedOccupancy).adults}
                              >
                                <Plus size={14} />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#ec9c12] rounded-lg">
                                <Baby size={16} className="text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">Niños</p>
                                <p className="text-xs text-gray-500">2-17 años</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button isIconOnly size="sm" variant="flat" className="min-w-8 h-8" onPress={() => setChildren(Math.max(0, children - 1))}>
                                <Minus size={14} />
                              </Button>
                              <span className="w-8 text-center font-bold text-gray-900">{children}</span>
                              <Button 
                                isIconOnly 
                                size="sm" 
                                className="bg-[#ec9c12] text-white min-w-8 h-8" 
                                onPress={() => setChildren(Math.min(getMaxCapacity(selectedOccupancy).children, children + 1))}
                                isDisabled={children >= getMaxCapacity(selectedOccupancy).children}
                              >
                                <Plus size={14} />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#f1c203] rounded-lg">
                                <Baby size={16} className="text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">Infantes</p>
                                <p className="text-xs text-gray-500">Menores de 2 años</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button isIconOnly size="sm" variant="flat" className="min-w-8 h-8" onPress={() => setInfants(Math.max(0, infants - 1))}>
                                <Minus size={14} />
                              </Button>
                              <span className="w-8 text-center font-bold text-gray-900">{infants}</span>
                              <Button 
                                isIconOnly 
                                size="sm" 
                                className="bg-[#f1c203] text-white min-w-8 h-8" 
                                onPress={() => setInfants(Math.min(getMaxCapacity(selectedOccupancy).infants, infants + 1))}
                                isDisabled={infants >= getMaxCapacity(selectedOccupancy).infants}
                              >
                                <Plus size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>

                  {/* Botón de reserva principal */}
                  <Button
                    className="w-full bg-gradient-to-r from-[#0c3f5b] via-[#0c3f5b] to-[#0a5270] text-white font-bold text-base py-7 shadow-xl hover:shadow-2xl transition-all"
                    size="lg"
                    onPress={() => {
                      if (!startDate) {
                        alert('Por favor selecciona tu fecha de ida')
                        return
                      }

                      if (!isValidCapacity()) {
                        alert(getCapacityError() || 'La cantidad de personas excede la capacidad de la habitación')
                        return
                      }

                      const computedEndDate = (() => {
                        if (endDateManual) return endDateManual
                        const start = toUtcMidnight(startDate)
                        if (!start) return null
                        const daysToAdd = duration?.days || 5
                        const end = addDaysUtc(start, daysToAdd)
                        return parseDate(end.toISOString().split('T')[0])
                      })()

                      if (!computedEndDate) {
                        alert('No se pudo calcular la fecha de retorno')
                        return
                      }

                      const params = new URLSearchParams({
                        type: 'package',
                        itemId: pkg.slug,
                        startDate: startDate.toString(),
                        endDate: computedEndDate.toString(),
                        adults: adults.toString(),
                        children: children.toString(),
                        infants: infants.toString(),
                        roomIndex: selectedRoomIndex.toString(),
                        occupancy: selectedOccupancy,
                        totalPrice: totalPrice.toString()
                      })
                      router.push(`/checkout?${params.toString()}`)
                    }}
                    isDisabled={!startDate || !isValidCapacity()}
                    startContent={<Check size={20} />}
                  >
                    Reservar ahora
                  </Button>
                  
                  {!isValidCapacity() && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700 font-medium text-center">
                        ⚠️ {getCapacityError()}
                      </p>
                    </div>
                  )}

                  {/* Garantías compactas */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-green-50 rounded-full mb-1.5">
                        <Check size={16} className="text-green-600" />
                      </div>
                      <p className="text-xs font-semibold text-gray-700">Cancelación</p>
                      <p className="text-xs text-gray-500">gratuita</p>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-50 rounded-full mb-1.5">
                        <Shield size={16} className="text-blue-600" />
                      </div>
                      <p className="text-xs font-semibold text-gray-700">Pago</p>
                      <p className="text-xs text-gray-500">seguro</p>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-50 rounded-full mb-1.5">
                        <Star size={16} className="text-orange-600" />
                      </div>
                      <p className="text-xs font-semibold text-gray-700">Mejor</p>
                      <p className="text-xs text-gray-500">precio</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </SearchLayout>
  )
}
