'use client'

import { use, useState, useEffect, useRef } from 'react'
import { Card, CardBody, Button, Chip, Image, Tabs, Tab, Input, DateRangePicker, Popover, PopoverTrigger, PopoverContent, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from '@heroui/react'
import { MapPin, Calendar, Users, Check, X, Star, Hotel as HotelIcon, ArrowLeft, Info, ChevronLeft, ChevronRight, Plus, Minus, Bed, Utensils, FileText, DoorOpen, Sparkles, Shield, Baby, Dog } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchLayout } from '@/components/layout/SearchLayout'
import { parseDate } from '@internationalized/date'

export default function HotelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
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
  const [hotel, setHotel] = useState<any>(null)
  
  // Estados para selección de habitación y ocupancy
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0)
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>('single')
  const [roomImageIndex, setRoomImageIndex] = useState(0)
  
  // Estado para selector de huéspedes
  const [isGuestsOpen, setIsGuestsOpen] = useState(false)
  
  // Extraer info de items[] para compatibilidad
  const hotelItem = hotel?.items?.find((item: any) => item.resourceType === 'Hotel')
  const hotelInfo = hotelItem?.hotelInfo
  const location = hotelInfo?.location
  const images = hotel?.coverPhoto ? [hotel.coverPhoto, ...(hotelInfo?.photos || [])] : (hotelInfo?.photos || ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'])
  const hotelAmenities = (hotelInfo as any)?.amenities || []
  
  // Las habitaciones ya vienen enriquecidas con fotos desde el endpoint
  const selectedRooms = hotelItem?.selectedRooms || []
  
  // Obtener markup de la oferta
  const offerMarkup = hotel?.pricing?.markup || { type: 'percentage', value: 0 }
  
  // Calcular duración basada en las fechas seleccionadas
  const duration = startDate && endDateManual ? {
    days: Math.ceil((new Date(endDateManual.toString()).getTime() - new Date(startDate.toString()).getTime()) / (1000 * 60 * 60 * 24)),
    nights: Math.ceil((new Date(endDateManual.toString()).getTime() - new Date(startDate.toString()).getTime()) / (1000 * 60 * 60 * 24))
  } : hotel?.duration || { days: 3, nights: 2 }
  
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

  
  // Fetch del hotel usando API pública
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchHotel() {
      try {
        const res = await fetch(`/api/public/booking/hotels/${resolvedParams.slug}`, { cache: 'no-store' })
        const data = await res.json()
        if (data.success) {
          setHotel(data.data)
          setSelectedRoomIndex(0)
          setRoomImageIndex(0)
          
          // Setear fechas desde validFrom y calcular fecha de fin basada en duration de la oferta
          const firstRoom = data.data?.items?.find((item: any) => item.resourceType === 'Hotel')?.selectedRooms?.[0]
          if (firstRoom?.validFrom) {
            const validFromDate = new Date(firstRoom.validFrom)
            setStartDate(parseDate(validFromDate.toISOString().split('T')[0]))
            
            // Calcular fecha de fin basada en la duración de la oferta
            const offerDuration = data.data?.duration?.days || 3
            const calculatedEndDate = new Date(validFromDate.getTime() + (offerDuration * 24 * 60 * 60 * 1000))
            setEndDateManual(parseDate(calculatedEndDate.toISOString().split('T')[0]))
          }
        }
      } catch (error) {
        console.error('Error fetching hotel:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHotel()
  }, [resolvedParams.slug])


  useEffect(() => {
    const defaultRoom = selectedRooms?.[0]
    if (!defaultRoom?.occupancy || !defaultRoom?.pricing?.capacityAdjustments) {
      // Si no hay datos, usar la primera ocupación disponible
      const defaultOcc = defaultRoom?.occupancy?.[0]
      if (defaultOcc) {
        setSelectedOccupancy(defaultOcc)
      }
      return
    }
    
    // Buscar la ocupación con capacityAdjustment = 0 (capacidad base sin cargo adicional)
    const baseOccupancy = defaultRoom.occupancy.find((occ: string) => {
      const adjustment = defaultRoom.pricing.capacityAdjustments[occ]
      return adjustment === 0 || adjustment === undefined
    })
    
    // Si se encuentra la ocupación base, usarla; sino usar la primera
    setSelectedOccupancy(baseOccupancy || defaultRoom.occupancy[0])
  }, [hotel])

  // Calcular precio total cuando cambian los valores
  useEffect(() => {
    if (!selectedRooms || selectedRooms.length === 0) return
    
    const selectedRoom = selectedRooms[selectedRoomIndex]
    if (!selectedRoom?.pricing) return
    
    const totalNights = duration?.nights || 1
    
    // Precio base del inventario por persona por noche
    const adultPriceBase = selectedRoom.pricing.adult || 0
    const childPriceBase = selectedRoom.pricing.child || 0
    const infantPriceBase = selectedRoom.pricing.infant || 0
    
    // Calcular precio total de personas por noche (sin markup)
    const totalPersonsPrice = (adultPriceBase * adults) + (childPriceBase * children) + (infantPriceBase * infants)
    
    // Aplicar markup de la oferta
    let priceWithMarkup = totalPersonsPrice
    if (offerMarkup.type === 'percentage') {
      priceWithMarkup = totalPersonsPrice * (1 + offerMarkup.value / 100)
    } else if (offerMarkup.type === 'fixed') {
      priceWithMarkup = totalPersonsPrice + offerMarkup.value
    }
    
    // Ajuste por ocupancy (si se selecciona una capacidad diferente a la base)
    const capacityAdjustment = selectedRoom.pricing.capacityAdjustments?.[selectedOccupancy] || 0
    
    // Calcular precio total: (precio con markup + ajuste de capacidad) × noches
    const pricePerNight = priceWithMarkup + capacityAdjustment
    const stayPrice = pricePerNight * totalNights
    
    setTotalPrice(stayPrice)
  }, [adults, children, infants, selectedRoomIndex, selectedOccupancy, selectedRooms, duration, offerMarkup])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ec9c12]/20 border-t-[#ec9c12] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles del hotel...</p>
        </div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Hotel no encontrado</h2>
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

  // Calcular habitación más barata para mostrar disponibilidad
  const cheapestRoom = selectedRooms.length > 0 
    ? selectedRooms.reduce((min: any, room: any) => {
        const minPrice = min?.pricing?.adult || Infinity
        const roomPrice = room?.pricing?.adult || Infinity
        return roomPrice < minPrice ? room : min
      }, null)
    : null
  const availableStock = cheapestRoom?.availability || 0

  return (
    <SearchLayout
      moduleTitle="Detalles del Hotel"
      moduleIcon={<HotelIcon size={24} />}
      moduleDescription={hotel?.name || 'Cargando...'}
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
                    alt={hotel.name}
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
                  {hotelInfo?.name && hotelInfo.name !== hotel.name && (
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
                    <span className="text-sm text-gray-600">{hotel.code || 'HTL'}</span>
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
                        {selectedRooms[selectedRoomIndex]?.occupancy?.map((occ: string) => (
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
                        )) || (
                          <p className="text-sm text-gray-500">No hay tipos de ocupancy disponibles</p>
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
                  <Tabs aria-label="Información del hotel" className="[&_[data-selected=true]]:text-[#0c3f5b]" variant="underlined">
                    <Tab key="description" title={
                      <div className="flex items-center gap-2">
                        <FileText size={16} />
                        <span>Descripción</span>
                      </div>
                    }>
                      <div className="py-6">
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                          <p className="text-gray-700 leading-relaxed text-base">{hotel.description || 'Hotel con excelentes servicios y ubicación privilegiada.'}</p>
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
                                  {selectedRooms[selectedRoomIndex].occupancy?.length > 0 && (
                                    <div className="flex items-start gap-3">
                                      <Users size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-gray-500 font-medium">Ocupación</p>
                                        <p className="text-sm text-gray-800 capitalize">{selectedRooms[selectedRoomIndex].occupancy.join(', ')}</p>
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
                    
                    <div className="mb-2">
                      <div className="flex items-end gap-2">
                        <span className="text-6xl font-black text-white tracking-tight">
                          ${Math.floor(totalPrice).toLocaleString('en-US')}
                        </span>
                        <span className="text-2xl font-bold text-white/40 mb-2">
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
                    <label className="text-sm font-bold text-gray-900 mb-3 block">Fechas de estadía</label>
                    <DateRangePicker
                      label="Selecciona tus fechas"
                      value={startDate && endDateManual ? { start: startDate, end: endDateManual } : null}
                      onChange={(range) => {
                        if (range?.start) {
                          setStartDate(range.start)
                        }
                        if (range?.end) {
                          setEndDateManual(range.end)
                        }
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
                        <span className="font-semibold">{duration?.nights || 1} {(duration?.nights || 1) === 1 ? 'noche' : 'noches'}</span>
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
                              <Button isIconOnly size="sm" className="bg-[#0c3f5b] text-white min-w-8 h-8" onPress={() => setAdults(Math.min(6, adults + 1))}>
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
                              <Button isIconOnly size="sm" className="bg-[#ec9c12] text-white min-w-8 h-8" onPress={() => setChildren(Math.min(4, children + 1))}>
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
                              <Button isIconOnly size="sm" className="bg-[#f1c203] text-white min-w-8 h-8" onPress={() => setInfants(Math.min(2, infants + 1))}>
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
                      if (!startDate || !endDateManual) {
                        alert('Por favor selecciona las fechas de tu estadía')
                        return
                      }
                      const params = new URLSearchParams({
                        type: 'hotel',
                        id: hotel._id,
                        startDate: startDate.toString(),
                        endDate: endDateManual.toString(),
                        adults: adults.toString(),
                        children: children.toString(),
                        infants: infants.toString(),
                        roomIndex: selectedRoomIndex.toString(),
                        occupancy: selectedOccupancy,
                        totalPrice: totalPrice.toString()
                      })
                      router.push(`/checkout?${params.toString()}`)
                    }}
                    isDisabled={!startDate || !endDateManual}
                    startContent={<Check size={20} />}
                  >
                    Reservar ahora
                  </Button>

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
