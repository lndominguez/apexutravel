'use client'

import { use, useState, useEffect, useRef } from 'react'
import { Card, CardBody, Button, Chip, Image, Tabs, Tab, Input, DateRangePicker, Popover, PopoverTrigger, PopoverContent, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from '@heroui/react'
import { MapPin, Calendar, Users, Check, X, Star, Hotel as HotelIcon, ArrowLeft, Info, ChevronLeft, ChevronRight, Plus, Minus, Bed, Utensils, FileText, DoorOpen, Sparkles, Shield, Baby, Dog, Building2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchLayout } from '@/components/layout/SearchLayout'
import { parseDate } from '@internationalized/date'
import { RoomReservationsPanel } from '@/components/booking/RoomReservationsPanel'

export default function HotelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  // Estados del formulario de reserva
  const [startDate, setStartDate] = useState<any>(null)
  const [endDateManual, setEndDateManual] = useState<any>(null)
  const [hotel, setHotel] = useState<any>(null)
  
  // Sistema de múltiples habitaciones
  interface RoomReservation {
    id: string
    roomIndex: number
    occupancy: string
    adults: number
    children: number
    infants: number
  }

  const getMinOccupancyFor = (occupancy: string) => {
    const map: Record<string, number> = { single: 1, double: 2, triple: 3, quad: 4 }
    return map[occupancy] || 1
  }
  
  const [roomReservations, setRoomReservations] = useState<RoomReservation[]>([])
  
  // Estados para vista de habitaciones disponibles
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0)
  const [roomImageIndex, setRoomImageIndex] = useState(0)
  
  // Extraer info de items[] para compatibilidad
  const hotelItem = hotel?.items?.find((item: any) => item.resourceType === 'Hotel')
  const hotelInfo = hotelItem?.hotelInfo
  const location = hotelInfo?.location
  
  // Filtrar coverPhoto duplicado: solo agregarlo si no está ya en las fotos del hotel
  const hotelPhotos = hotelInfo?.photos || []
  const coverPhoto = hotel?.coverPhoto
  const images = coverPhoto && !hotelPhotos.includes(coverPhoto)
    ? [coverPhoto, ...hotelPhotos]
    : hotelPhotos.length > 0 
      ? hotelPhotos 
      : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200']
  
  const hotelAmenities = (hotelInfo as any)?.amenities || []
  
  // Las habitaciones ya vienen enriquecidas con fotos desde el endpoint
  const selectedRooms = hotelItem?.selectedRooms || []
  
  // Obtener markup de la oferta
  const offerMarkup = hotel?.pricing?.markup || { type: 'percentage', value: 0 }
  
  // Para hoteles, calcular duración desde fechas o default 1 noche
  // NOTA: hotel?.duration es legacy (hoteles viejos), nuevos hoteles NO tienen duration fijo
  const duration = startDate && endDateManual ? {
    days: Math.ceil((new Date(endDateManual.toString()).getTime() - new Date(startDate.toString()).getTime()) / (1000 * 60 * 60 * 24)),
    nights: Math.ceil((new Date(endDateManual.toString()).getTime() - new Date(startDate.toString()).getTime()) / (1000 * 60 * 60 * 24))
  } : { days: 1, nights: 1 }
  
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

  const getCheapestRoomSelectionForTwoAdults = (rooms: any[], nights: number) => {
    if (!Array.isArray(rooms) || rooms.length === 0) {
      return { roomIndex: 0, occupancy: 'double' as string }
    }

    let bestIndex = 0
    let bestOcc = (rooms[0]?.occupancy?.includes('double') ? 'double' : rooms[0]?.occupancy?.[0] || 'double') as string
    let bestTotal = Number.POSITIVE_INFINITY

    for (let idx = 0; idx < rooms.length; idx++) {
      const room = rooms[idx]
      const prices = room?.capacityPrices?.double
      if (!prices) continue

      const perNight = (Number(prices.adult) || 0) * 2
      if (!Number.isFinite(perNight) || perNight <= 0) continue
      const total = perNight * Math.max(1, nights)

      if (total < bestTotal) {
        bestTotal = total
        bestIndex = idx
        bestOcc = 'double'
      }
    }

    if (!Number.isFinite(bestTotal)) {
      return { roomIndex: 0, occupancy: bestOcc }
    }

    return { roomIndex: bestIndex, occupancy: bestOcc }
  }

  // Funciones para manejar múltiples habitaciones
  const addRoomReservation = (roomData?: Partial<RoomReservation>) => {
    const defaultOcc = selectedRooms[0]?.occupancy?.[0] || 'double'
    const newReservation: RoomReservation = {
      id: `room-${Date.now()}-${Math.random()}`,
      roomIndex: roomData?.roomIndex ?? 0,
      occupancy: roomData?.occupancy ?? defaultOcc,
      adults: roomData?.adults ?? getMinOccupancyFor(roomData?.occupancy ?? defaultOcc),
      children: roomData?.children ?? 0,
      infants: roomData?.infants ?? 0
    }
    setRoomReservations([...roomReservations, newReservation])
  }

  const removeRoomReservation = (id: string) => {
    setRoomReservations(roomReservations.filter(r => r.id !== id))
  }

  const updateRoomReservation = (id: string, updates: Partial<RoomReservation>) => {
    setRoomReservations(roomReservations.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ))
  }

  // Mantener sincronizado el selector visual de habitación con la primera reserva
  useEffect(() => {
    const first = roomReservations?.[0]
    if (!first) return
    if (typeof first.roomIndex === 'number' && first.roomIndex !== selectedRoomIndex) {
      setSelectedRoomIndex(first.roomIndex)
      setRoomImageIndex(0)
    }
  }, [roomReservations, selectedRoomIndex])

  const calculateRoomPrice = (reservation: RoomReservation) => {
    const room = selectedRooms[reservation.roomIndex]
    if (!room?.capacityPrices?.[reservation.occupancy]) return 0

    const prices = room.capacityPrices[reservation.occupancy]
    const pricePerNight = 
      (prices.adult * reservation.adults) +
      (prices.child * reservation.children) +
      (prices.infant * reservation.infants)

    return pricePerNight * duration.nights
  }

  const calculateTotalPrice = () => {
    return roomReservations.reduce((total, reservation) => {
      return total + calculateRoomPrice(reservation)
    }, 0)
  }

  // Calcular totales de huéspedes
  const totalGuests = roomReservations.reduce((sum, r) => ({
    adults: sum.adults + r.adults,
    children: sum.children + r.children,
    infants: sum.infants + r.infants
  }), { adults: 0, children: 0, infants: 0 })

  // Validar que todas las habitaciones tengan al menos 1 persona (adulto o niño)
  const isBookingValid = () => {
    if (!startDate || !endDateManual) return false
    if (roomReservations.length === 0) return false
    
    // Verificar que cada habitación tenga al menos 1 persona
    return roomReservations.every(room => (room.adults + room.children) >= 1)
  }

  
  // Fetch del hotel usando API pública
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchHotel() {
      try {
        const res = await fetch(`/api/public/booking/hotels/${resolvedParams.slug}`, { cache: 'no-store' })
        const data = await res.json()
        if (data.success) {
          setHotel(data.data)
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

          // Inicializar con la habitación MÁS BARATA (config de portada: 2 adultos)
          const hotelRooms = data.data?.items?.find((item: any) => item.resourceType === 'Hotel')?.selectedRooms
          if (hotelRooms && hotelRooms.length > 0) {
            const nights = data.data?.duration?.nights || 2
            const cheapest = getCheapestRoomSelectionForTwoAdults(hotelRooms, nights)

            setSelectedRoomIndex(cheapest.roomIndex)
            setRoomReservations([
              {
                id: `room-${Date.now()}`,
                roomIndex: cheapest.roomIndex,
                occupancy: cheapest.occupancy,
                adults: 2,
                children: 0,
                infants: 0
              }
            ])
          } else {
            setSelectedRoomIndex(0)
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

  // Calcular habitación más barata (2 adultos / double) para mostrar disponibilidad
  const cheapestRoom = selectedRooms.length > 0
    ? selectedRooms.reduce((min: any, room: any) => {
        const minPrice = min?.capacityPrices?.double?.adult ?? Infinity
        const roomPrice = room?.capacityPrices?.double?.adult ?? Infinity
        return roomPrice < minPrice ? room : min
      }, null)
    : null
  const availableStock = (cheapestRoom?.availability ?? cheapestRoom?.stock ?? 0) as number

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

                {/* Información del Hotel - Compacta */}
                <Card className="h-fit">
                  <CardBody className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Building2 size={18} className="text-[#0c3f5b]" />
                      Información del Hotel
                    </h3>
                    
                    {/* Estrellas y ubicación */}
                    <div className="space-y-2 mb-3">
                      {hotelInfo?.stars && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < hotelInfo.stars ? "#f1c203" : "none"} className={i < hotelInfo.stars ? "text-[#f1c203]" : "text-gray-300"} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">{hotelInfo.stars} estrellas</span>
                        </div>
                      )}
                      {location && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-[#0c3f5b] mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-600">{location.city}, {location.country}</span>
                        </div>
                      )}
                    </div>

                    {/* Amenidades con iconos */}
                    {hotelAmenities && hotelAmenities.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Servicios destacados</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                          {hotelAmenities.slice(0, 6).map((amenity: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Check size={12} className="text-[#0c3f5b] flex-shrink-0" />
                              <span className="truncate">{amenity}</span>
                            </div>
                          ))}
                        </div>
                        {hotelAmenities.length > 6 && (
                          <p className="text-xs text-gray-500 mt-2">+{hotelAmenities.length - 6} más</p>
                        )}
                      </div>
                    )}
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
                    
                    {roomReservations.length > 0 && (
                      <div className="mb-4">
                        <Chip size="sm" className="bg-white/10 text-white border border-white/20">
                          <div className="flex items-center gap-1">
                            <Bed size={12} />
                            <span className="text-xs">{roomReservations.length} {roomReservations.length === 1 ? 'habitación' : 'habitaciones'}</span>
                          </div>
                        </Chip>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <div className="flex items-end gap-2 flex-wrap">
                        <span className="text-4xl font-black text-white tracking-tight break-all">
                          ${calculateTotalPrice().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xl font-bold text-white/40 mb-1">
                          USD
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      {totalGuests.adults + totalGuests.children + totalGuests.infants > 0 && (
                        <>
                          <Users size={14} />
                          <span>
                            {totalGuests.adults} {totalGuests.adults === 1 ? 'adulto' : 'adultos'}
                            {totalGuests.children > 0 && `, ${totalGuests.children} ${totalGuests.children === 1 ? 'niño' : 'niños'}`}
                            {totalGuests.infants > 0 && `, ${totalGuests.infants} ${totalGuests.infants === 1 ? 'infante' : 'infantes'}`}
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

                  {/* Panel de habitaciones múltiples */}
                  <RoomReservationsPanel
                    selectedRooms={selectedRooms}
                    roomReservations={roomReservations}
                    duration={duration}
                    onAddRoom={addRoomReservation}
                    onRemoveRoom={removeRoomReservation}
                    onUpdateRoom={updateRoomReservation}
                    calculateRoomPrice={calculateRoomPrice}
                  />

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
                      if (roomReservations.length === 0) {
                        alert('Por favor agrega al menos una habitación')
                        return
                      }
                      // Validar que cada habitación tenga al menos 1 persona
                      const invalidRooms = roomReservations.filter(r => (r.adults + r.children) < 1)
                      if (invalidRooms.length > 0) {
                        alert('Cada habitación debe tener al menos 1 persona (adulto o niño)')
                        return
                      }
                      // Calcular totales de huéspedes para el checkout
                      const totalAdults = roomReservations.reduce((sum, r) => sum + r.adults, 0)
                      const totalChildren = roomReservations.reduce((sum, r) => sum + r.children, 0)
                      const totalInfants = roomReservations.reduce((sum, r) => sum + r.infants, 0)
                      
                      const params = new URLSearchParams({
                        type: 'hotel',
                        id: hotel.slug,
                        startDate: startDate.toString(),
                        endDate: endDateManual.toString(),
                        adults: totalAdults.toString(),
                        children: totalChildren.toString(),
                        infants: totalInfants.toString(),
                        roomReservations: JSON.stringify(roomReservations),
                        totalPrice: calculateTotalPrice().toString()
                      })
                      router.push(`/checkout?${params.toString()}`)
                    }}
                    isDisabled={!isBookingValid()}
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
