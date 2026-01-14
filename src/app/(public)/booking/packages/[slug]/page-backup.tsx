'use client'

import { use, useState, useEffect, useRef } from 'react'
import { Card, CardBody, Button, Chip, Image, Tabs, Tab, Input, DatePicker } from '@heroui/react'
import { MapPin, Calendar, Users, Check, X, Star, Plane, Wifi, ArrowLeft, Share2, Heart, Sparkles, Clock, Info, ChevronLeft, ChevronRight, Package as PackageIcon, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchLayout } from '@/components/layout/SearchLayout'
import { parseDate } from '@internationalized/date'

export default function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  // Estados del formulario de reserva
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [startDate, setStartDate] = useState<any>(null)
  const [totalPrice, setTotalPrice] = useState(0)
  const [pkg, setPkg] = useState<any>(null)
  
  // Extraer info de items[] para compatibilidad con diseño existente
  const hotelItem = pkg?.items?.find((item: any) => item.resourceType === 'Hotel')
  const hotelInfo = hotelItem?.hotelInfo
  const location = hotelInfo?.location
  const images = hotelInfo?.photos || ['https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200']
  const hasFlights = pkg?.items?.some((item: any) => item.resourceType === 'Flight')
  const hasTransport = pkg?.items?.some((item: any) => item.resourceType === 'Transport')
  
  // Calcular duración desde validFrom/validTo o usar valor por defecto
  const duration = pkg?.validFrom && pkg?.validTo 
    ? {
        days: Math.ceil((new Date(pkg.validTo).getTime() - new Date(pkg.validFrom).getTime()) / (1000 * 60 * 60 * 24)),
        nights: Math.ceil((new Date(pkg.validTo).getTime() - new Date(pkg.validFrom).getTime()) / (1000 * 60 * 60 * 24)) - 1
      }
    : { days: 5, nights: 4 } // Default
  
  // Calcular fecha de regreso automáticamente basado en la duración del paquete
  const endDate = startDate && duration?.days 
    ? parseDate(new Date(new Date(startDate.toString()).getTime() + (duration.days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0])
    : null
  
  // Fetch del paquete usando API pública
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPackage() {
      try {
        const res = await fetch(`/api/public/booking/packages/${resolvedParams.id}`, { cache: 'no-store' })
        const data = await res.json()
        if (data.success) {
          setPkg(data.data)
        }
      } catch (error) {
        console.error('Error fetching package:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPackage()
  }, [resolvedParams.id])

  // Calcular precio total cuando cambian los valores
  useEffect(() => {
    if (!pkg?.pricing) return
    
    const adultPrice = (pkg.pricing.base?.adult || pkg.pricing.finalPrice || 0) * adults
    const childPrice = (pkg.pricing.base?.child || (pkg.pricing.base?.adult || 0) * 0.7) * children
    const infantPrice = (pkg.pricing.base?.infant || (pkg.pricing.base?.adult || 0) * 0.3) * infants
    
    setTotalPrice(adultPrice + childPrice + infantPrice)
  }, [adults, children, infants, pkg])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
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
          <Button as={Link} href="/search/packages" color="primary">
            Ver todos los paquetes
          </Button>
        </div>
      </div>
    )
  }

  // Images ya se extraen arriba desde hotelInfo

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 200
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <SearchLayout
      moduleTitle="Detalles del Paquete"
      moduleIcon={<PackageIcon size={24} />}
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

      {/* Layout principal en 2 columnas */}
      <div className="container mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Imágenes y contenido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Imagen principal */}
            <div className="relative w-full h-64 md:h-auto md:aspect-video rounded-2xl overflow-hidden group bg-gradient-to-br from-gray-100 to-gray-200">
              <img
                src={images[selectedImage]}
                alt={pkg.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center' }}
              />
              {/* Badge de oferta si el precio es menor a cierto umbral */}
              {(pkg.pricing?.base?.adult || 0) < 1000 && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  ¡OFERTA!
                </div>
              )}
            </div>

            {/* Carousel de miniaturas */}
            <div className="relative group">
              {/* Botón anterior */}
              {images.length > 4 && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur"
                  onPress={() => scrollCarousel('left')}
                >
                  <ChevronLeft size={20} />
                </Button>
              )}

              {/* Carousel */}
              <div
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth py-2 px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {images.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className={`relative h-24 w-32 rounded-xl overflow-hidden cursor-pointer transition-all flex-shrink-0 ${
                      selectedImage === idx ? 'ring-4 ring-primary' : 'opacity-70 hover:opacity-100'
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

              {/* Botón siguiente */}
              {images.length > 4 && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur"
                  onPress={() => scrollCarousel('right')}
                >
                  <ChevronRight size={20} />
                </Button>
              )}
            </div>
            {/* Título y badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Chip color="default" variant="solid" size="sm">
                  {pkg.code || 'PKG'}
                </Chip>
                {hasFlights && (
                  <Chip color="primary" variant="solid" size="sm" startContent={<Plane size={12} />}>
                    Incluye Vuelos
                  </Chip>
                )}
                {hasTransport && (
                  <Chip color="success" variant="solid" size="sm">
                    Incluye Traslados
                  </Chip>
                )}
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">{pkg.name}</h1>

              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-primary" />
                    <span className="font-medium">
                      {location.city}, {location.country}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-blue-500" />
                  <span className="font-medium">{duration?.days}D / {duration?.nights}N</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-green-500" />
                  <span className="font-medium">
                    {pkg.availability?.minPax || 1}-{pkg.availability?.maxPax || 10} personas
                  </span>
                </div>
              </div>

              {/* Features del hotel */}
              {(hotelInfo?.stars || hasFlights || hasTransport) && (
                <div className="flex flex-wrap items-center gap-4 p-4 bg-blue-50 rounded-xl">
                  {hotelInfo?.stars && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Hotel:</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < hotelInfo.stars ? "fill-amber-400 text-amber-400" : "fill-none text-gray-300"}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {hasFlights && (
                    <Chip size="sm" variant="flat" startContent={<Plane size={14} />}>
                      Vuelos incluidos
                    </Chip>
                  )}
                  {hasTransport && (
                    <Chip size="sm" variant="flat" startContent={<Wifi size={14} />}>
                      Traslados incluidos
                    </Chip>
                  )}
                </div>
              )}
            </div>

            {/* Tabs de contenido */}
            <Card>
              <CardBody className="p-6">
                <Tabs aria-label="Información del paquete" color="primary" variant="underlined">
                  <Tab key="description" title="Descripción">
                    <div className="py-4">
                      <p className="text-gray-700 leading-relaxed">{pkg.description || 'Paquete turístico completo con los mejores servicios.'}</p>
                    </div>
                  </Tab>

                  <Tab key="itinerary" title="Itinerario">
                    <div className="py-4 space-y-4">
                      {pkg.itinerary && pkg.itinerary.length > 0 ? (
                        pkg.itinerary.map((day: any, idx: number) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold">Día {day.day}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1">{day.title}</h4>
                              <p className="text-sm text-gray-600">{day.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">Itinerario no disponible</p>
                      )}
                    </div>
                  </Tab>

                  <Tab key="included" title="Qué incluye">
                    <div className="py-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-bold text-green-600 mb-4 flex items-center gap-2">
                            <Check size={20} />
                            Incluye
                          </h4>
                          <ul className="space-y-2">
                            {pkg.items && pkg.items.length > 0 ? (
                              pkg.items.map((item: any, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{item.resourceType === 'Hotel' ? `Hotel ${hotelInfo?.stars || 3} estrellas` : item.resourceType}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-500">No especificado</li>
                            )}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                            <X size={20} />
                            No incluye
                          </h4>
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-sm">
                              <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                              <span>Gastos personales</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                              <span>Propinas</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Tab>

                  <Tab key="amenities" title="Amenidades">
                    <div className="py-4">
                      {hotelItem?.selectedRooms?.[0]?.features && hotelItem.selectedRooms[0].features.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {hotelItem.selectedRooms[0].features.map((amenity: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                              <Check size={16} className="text-primary" />
                              <span className="text-sm capitalize">{amenity.replace('-', ' ')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No hay amenidades especificadas</p>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </CardBody>
            </Card>

            {/* Información importante */}
            <Card>
              <CardBody className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Info size={20} className="text-primary" />
                  Información Importante
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Precios sujetos a disponibilidad y cambios sin previo aviso</p>
                  <p>• Se requiere pasaporte vigente con al menos 6 meses de validez</p>
                  <p>• Políticas de cancelación aplican según términos y condiciones</p>
                  <p>• Consulta con tu médico sobre vacunas recomendadas</p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Columna derecha - Card de reserva sticky */}
          <div>
            <Card className="sticky top-24">
              <CardBody className="p-0">
                {/* Header del card */}
                <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
                  <h3 className="font-bold text-lg">Resumen del Paquete</h3>
                  <p className="text-sm text-white/90">{duration?.days} días / {duration?.nights} noches</p>
                </div>

                <div className="p-6">
                  {/* Detalles del paquete */}
                  <div className="space-y-3 mb-6 pb-6 border-b">
                    {location && (
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Destino</p>
                          <p className="font-semibold text-sm">{location.city}, {location.country}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <Users size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Capacidad del paquete</p>
                        <p className="font-semibold text-sm">{pkg.availability?.minPax || 1} - {pkg.availability?.maxPax || 10} personas</p>
                      </div>
                    </div>
                    
                    {/* Mostrar personas seleccionadas */}
                    {(adults > 0 || children > 0 || infants > 0) && (
                      <div className="flex items-start gap-3">
                        <Users size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Personas seleccionadas</p>
                          <p className="font-semibold text-sm text-green-600">
                            {adults + children + infants} persona{adults + children + infants > 1 ? 's' : ''} 
                            <span className="text-xs text-gray-500 ml-1">
                              ({adults} adulto{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} niño${children > 1 ? 's' : ''}` : ''}{infants > 0 ? `, ${infants} infante${infants > 1 ? 's' : ''}` : ''})
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {hotelInfo?.stars && (
                      <div className="flex items-start gap-3">
                        <Star size={18} className="text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Hotel</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < hotelInfo.stars ? "fill-amber-400 text-amber-400" : "fill-none text-gray-300"}
                                strokeWidth={1.5}
                              />
                            ))}
                            <span className="text-xs text-gray-600 ml-1">({hotelInfo.stars} estrellas)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Formulario de reserva */}
                  <div className="mb-6 space-y-4">
                    <h4 className="font-bold text-sm text-gray-700">Personaliza tu viaje</h4>
                    
                    {/* Pasajeros */}
                    <div className="space-y-3">
                      {/* Adultos */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Adultos</p>
                          <p className="text-xs text-gray-500">Mayores de 12 años</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => setAdults(Math.max(1, adults - 1))}
                            isDisabled={adults <= 1}
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-8 text-center font-semibold">{adults}</span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => setAdults(Math.min((pkg.availability?.maxPax || 10) - children - infants, adults + 1))}
                            isDisabled={adults + children + infants >= (pkg.availability?.maxPax || 10)}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>

                      {/* Niños */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Niños</p>
                          <p className="text-xs text-gray-500">2-11 años</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => setChildren(Math.max(0, children - 1))}
                            isDisabled={children <= 0}
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-8 text-center font-semibold">{children}</span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => setChildren(children + 1)}
                            isDisabled={adults + children + infants >= (pkg.availability?.maxPax || 10)}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>

                      {/* Infantes */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Infantes</p>
                          <p className="text-xs text-gray-500">Menores de 2 años</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => setInfants(Math.max(0, infants - 1))}
                            isDisabled={infants <= 0}
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-8 text-center font-semibold">{infants}</span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => setInfants(infants + 1)}
                            isDisabled={adults + children + infants >= (pkg.availability?.maxPax || 10)}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="space-y-3">
                      <DatePicker
                        label="Fecha de salida"
                        value={startDate}
                        onChange={setStartDate}
                        className="w-full"
                        minValue={parseDate(new Date().toISOString().split('T')[0])}
                        description={`El viaje dura ${duration?.days} días / ${duration?.nights} noches`}
                      />
                      
                      {/* Mostrar fecha de regreso calculada automáticamente */}
                      {startDate && endDate && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-600">Fecha de regreso</p>
                          <p className="font-semibold text-sm text-primary">
                            {new Date(endDate.toString()).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Precio total calculado */}
                  <div className="mb-6">
                    <p className="text-xs text-gray-500 mb-2">Precio total estimado</p>

                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-black text-primary">
                        ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-gray-600">{pkg.pricing?.currency || 'USD'}</span>
                    </div>
                    <p className="text-xs text-gray-500">Para {adults + children + infants} persona{adults + children + infants > 1 ? 's' : ''}</p>
                    
                    {/* Desglose de precios */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1 text-xs">
                      {adults > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{adults} Adulto{adults > 1 ? 's' : ''} × ${(pkg.pricing?.base?.adult || 0).toLocaleString('en-US')}</span>
                          <span className="font-semibold">${((pkg.pricing?.base?.adult || 0) * adults).toLocaleString('en-US')}</span>
                        </div>
                      )}
                      {children > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{children} Niño{children > 1 ? 's' : ''} × ${(pkg.pricing?.base?.child || (pkg.pricing?.base?.adult || 0) * 0.7).toLocaleString('en-US')}</span>
                          <span className="font-semibold">${((pkg.pricing?.base?.child || (pkg.pricing?.base?.adult || 0) * 0.7) * children).toLocaleString('en-US')}</span>
                        </div>
                      )}
                      {infants > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{infants} Infante{infants > 1 ? 's' : ''} × ${(pkg.pricing?.base?.infant || (pkg.pricing?.base?.adult || 0) * 0.3).toLocaleString('en-US')}</span>
                          <span className="font-semibold">${((pkg.pricing?.base?.infant || (pkg.pricing?.base?.adult || 0) * 0.3) * infants).toLocaleString('en-US')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="space-y-3 mb-6">
                    <Button
                      color="primary"
                      size="lg"
                      className="w-full font-bold"
                      startContent={<Calendar size={20} />}
                      onPress={() => {
                        if (!startDate) {
                          alert('Por favor selecciona una fecha de salida')
                          return
                        }
                        const params = new URLSearchParams({
                          type: 'package',
                          id: pkg._id,
                          adults: adults.toString(),
                          children: children.toString(),
                          infants: infants.toString(),
                          startDate: startDate.toString()
                        })
                        router.push(`/checkout?${params.toString()}`)
                      }}
                      isDisabled={!startDate || (adults + children + infants) === 0}
                    >
                      Reservar Ahora
                    </Button>
                    <Button
                      variant="bordered"
                      size="lg"
                      className="w-full"
                    >
                      Solicitar Cotización
                    </Button>
                  </div>

                  {/* Beneficios */}
                  <div className="border-t pt-4 space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Check size={16} className="text-green-500" />
                      <span>Confirmación inmediata</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Check size={16} className="text-green-500" />
                      <span>Cancelación flexible</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Check size={16} className="text-green-500" />
                      <span>Mejor precio garantizado</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </SearchLayout>
  )
}
