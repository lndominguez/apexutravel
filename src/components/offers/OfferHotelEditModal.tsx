'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Card,
  CardBody,
  Chip,
  Divider,
  RadioGroup,
  Radio,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from '@heroui/react'
import { 
  Hotel as HotelIcon,
  MapPin, 
  Calendar, 
  DollarSign,
  Save,
  X,
  Star,
  Check,
  Percent,
  Image as ImageIcon,
  Upload,
  BedDouble,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'

interface OfferHotelEditModalProps {
  isOpen: boolean
  onClose: () => void
  hotelData: any
  onSave: (data: any) => Promise<void>
  isLoading?: boolean
}

export default function OfferHotelEditModal({
  isOpen,
  onClose,
  hotelData,
  onSave,
  isLoading = false
}: OfferHotelEditModalProps) {
  const notification = useNotification()

  // Tab actual
  const [activeTab, setActiveTab] = useState('info')

  // Info General
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  
  // Duración (inputs directos para paquetes de proveedor)
  const [days, setDays] = useState(5)
  const [nights, setNights] = useState(4)
  
  // Estado
  const [status, setStatus] = useState('draft')
  
  // Foto de portada (puede ser del hotel o personalizada)
  const [coverPhoto, setCoverPhoto] = useState<string>('')
  const [customCoverPhoto, setCustomCoverPhoto] = useState<string>('')
  const [useCustomCover, setUseCustomCover] = useState(false)

  // Items (estructura de Offer)
  const [items, setItems] = useState<any[]>([])
  
  // Estado para refresh
  const [isRefreshingHotel, setIsRefreshingHotel] = useState(false)
  
  // Estado para selector de hotel
  const [showHotelSelector, setShowHotelSelector] = useState(false)
  const [availableHotels, setAvailableHotels] = useState<any[]>([])
  const [isLoadingHotels, setIsLoadingHotels] = useState(false)
  
  // Markup
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage')
  const [markupValue, setMarkupValue] = useState(10)
  
  // Precio base original (sin markup) - se carga del paquete guardado
  const [originalBasePrice, setOriginalBasePrice] = useState(0)

  // Derivados para hotel info
  const hotelItem = items.find((item: any) => item.resourceType === 'Hotel')
  const hotelInfo = hotelItem?.hotelInfo
  const selectedRooms = hotelItem?.selectedRooms || []
  
  // Calcular precios
  const pricing = useMemo(() => {
    if (!originalBasePrice) return null
    
    // Usar el precio base original guardado (sin markup)
    const basePrice = originalBasePrice
    
    // Calcular markup
    const markupAmount = markupType === 'percentage'
      ? basePrice * (markupValue / 100)
      : markupValue
    
    const finalPrice = basePrice + markupAmount
    
    return {
      basePrice,
      markupAmount,
      finalPrice,
      currency: 'USD'
    }
  }, [originalBasePrice, markupType, markupValue])

  // Inicializar form con datos de la oferta
  useEffect(() => {
    if (hotelData && isOpen) {
      setName(hotelData.name || '')
      setCode(hotelData.code || '')
      setDescription(hotelData.description || '')
      setDays(hotelData.duration?.days || 5)
      setNights(hotelData.duration?.nights || 4)
      setStatus(hotelData.status || 'draft')
      setItems(hotelData.items || [])
      const cover = hotelData.coverPhoto || ''
      setCoverPhoto(cover)
      
      // Detectar si es una imagen personalizada (no está en las fotos del hotel)
      const hotelPhotos = hotelData.items?.[0]?.hotelInfo?.photos || []
      const isCustom = cover && !hotelPhotos.includes(cover)
      setUseCustomCover(isCustom)
      if (isCustom) {
        setCustomCoverPhoto(cover)
      }
      
      // Cargar precio base original y markup existente
      if (hotelData.pricing) {
        const base = hotelData.pricing.basePrice || 0
        const final = hotelData.pricing.finalPrice || 0
        const markup = final - base
        
        // Guardar el precio base original (sin markup)
        setOriginalBasePrice(base)
        
        // Detectar tipo de markup
        if (base > 0) {
          const percentage = (markup / base) * 100
          if (Number.isInteger(percentage) || percentage % 1 < 0.01) {
            setMarkupType('percentage')
            setMarkupValue(Math.round(percentage))
          } else {
            setMarkupType('fixed')
            setMarkupValue(Math.round(markup))
          }
        }
      }
    }
  }, [hotelData, isOpen])

  const handleSubmit = async () => {
    try {
      // Validaciones básicas
      if (!name.trim()) {
        notification.error('Error', 'El nombre es requerido')
        return
      }

      if (!days || !nights) {
        notification.error('Error', 'La duración es requerida')
        return
      }

      // Construir objeto actualizado
      // NOTA: NO enviamos items - eso ya está vinculado al inventario y no se modifica en edit
      const updatedData = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim(),
        items,
        duration: {
          days,
          nights
        },
        status,
        coverPhoto: useCustomCover ? customCoverPhoto : coverPhoto,
        pricing: pricing ? {
          basePrice: pricing.basePrice,
          finalPrice: pricing.finalPrice,
          currency: pricing.currency,
          markup: {
            type: markupType,
            value: markupValue,
            amount: pricing.markupAmount
          }
        } : undefined
      }

      await onSave(updatedData)
      notification.success('Oferta actualizada', 'Los cambios se guardaron correctamente')
      onClose()
    } catch (error: any) {
      console.error('Error al guardar:', error)
      notification.error('Error al guardar', error.message || 'No se pudo actualizar la oferta')
    }
  }

  const handleCancel = () => {
    onClose()
  }

  const handleRefreshHotelInfo = async () => {
    const hotelItem = items.find((item: any) => item.resourceType === 'Hotel')
    if (!hotelItem?.inventoryId) {
      notification.error('Error', 'No se encontró el ID del inventario del hotel')
      return
    }

    setIsRefreshingHotel(true)
    try {
      // Obtener datos actualizados del inventario (incluye habitaciones con precios)
      const inventoryResponse = await fetch(`/api/inventory/${hotelItem.inventoryId}`)
      const inventoryItem = await inventoryResponse.json()

      if (!inventoryResponse.ok || inventoryItem?.error) {
        notification.error('Error', inventoryItem?.error || 'No se pudo obtener la información del inventario')
        return
      }
      
      // Obtener datos del recurso hotel (info general)
      const resourceId = inventoryItem.resource?._id || inventoryItem.resource
      const resourceResponse = await fetch(`/api/resources/hotels/${resourceId}`)
      const resourceData = await resourceResponse.json()

      if (resourceData.success && resourceData.data) {
        const hotelResource = resourceData.data
        
        // Actualizar hotelInfo con datos frescos del recurso Y selectedRooms del inventario
        const updatedItems = items.map((item: any) => {
          if (item.resourceType === 'Hotel') {
            // Aplicar markup a las habitaciones del inventario
            const roomsWithMarkup = inventoryItem.rooms?.map((room: any) => {
              const applyMarkup = (basePrice: number) => {
                if (markupType === 'percentage') {
                  return basePrice + (basePrice * markupValue / 100)
                }
                return basePrice + markupValue
              }

              // Aplicar markup a capacityPrices si existen
              let capacityPricesWithMarkup = null
              if (room.capacityPrices) {
                capacityPricesWithMarkup = {}
                for (const [capacity, prices] of Object.entries(room.capacityPrices)) {
                  capacityPricesWithMarkup[capacity] = {
                    adult: applyMarkup((prices as any).adult || 0),
                    child: applyMarkup((prices as any).child || 0),
                    infant: (prices as any).infant || 0
                  }
                }
              }

              return {
                roomTypeId: room.roomType,
                name: room.roomName,
                plan: room.plan || 'all-inclusive',
                features: [],
                availability: room.stock || 0,
                validFrom: room.validFrom,
                validTo: room.validTo,
                stock: room.stock || 0,
                capacityPrices: capacityPricesWithMarkup
              }
            }) || []

            return {
              ...item,
              hotelInfo: {
                ...item.hotelInfo,
                resourceId: resourceId,
                name: hotelResource.name,
                stars: hotelResource.stars,
                location: hotelResource.location,
                photos: hotelResource.photos || [],
                policies: hotelResource.policies || item.hotelInfo.policies,
                amenities: hotelResource.amenities || []
              },
              selectedRooms: roomsWithMarkup
            }
          }
          return item
        })
        
        setItems(updatedItems)
        
        // Actualizar coverPhoto si está usando foto del hotel
        if (!useCustomCover && hotelResource.photos?.[0]) {
          setCoverPhoto(hotelResource.photos[0])
        }
        
        notification.success('Información actualizada', 'Los datos del hotel y las habitaciones se han recargado desde el inventario')
      } else {
        notification.error('Error', 'No se pudo obtener la información del hotel')
      }
    } catch (error) {
      console.error('Error refreshing hotel:', error)
      notification.error('Error', 'Ocurrió un error al recargar la información del hotel')
    } finally {
      setIsRefreshingHotel(false)
    }
  }

  const handleRemoveHotel = async () => {
    if (!confirm('¿Estás seguro de quitar el hotel? Podrás seleccionar otro del inventario.')) {
      return
    }
    
    const updatedItems = items.filter((item: any) => item.resourceType !== 'Hotel')
    setItems(updatedItems)
    
    // Cargar hoteles disponibles del inventario
    setIsLoadingHotels(true)
    try {
      const response = await fetch('/api/inventory?resourceType=Hotel&status=active&pricingMode=package&limit=500')
      const data = await response.json()
      
      if (response.ok && Array.isArray(data.items)) {
        setAvailableHotels(data.items)
        setShowHotelSelector(true)
        notification.success('Hotel eliminado', 'Selecciona un nuevo hotel del inventario')
      } else {
        notification.error('Error', data?.error || 'No se pudieron cargar los hoteles disponibles')
      }
    } catch (error) {
      console.error('Error loading hotels:', error)
      notification.error('Error', 'Ocurrió un error al cargar los hoteles')
    } finally {
      setIsLoadingHotels(false)
    }
  }
  
  const handleSelectNewHotel = (hotel: any) => {
    // Aplicar markup a las habitaciones del hotel seleccionado
    const roomsWithMarkup = hotel.rooms?.map((room: any) => {
      const applyMarkup = (basePrice: number) => {
        if (markupType === 'percentage') {
          return basePrice + (basePrice * markupValue / 100)
        }
        return basePrice + markupValue
      }

      let capacityPricesWithMarkup = null
      if (room.capacityPrices) {
        capacityPricesWithMarkup = {}
        for (const [capacity, prices] of Object.entries(room.capacityPrices)) {
          capacityPricesWithMarkup[capacity] = {
            adult: applyMarkup((prices as any).adult || 0),
            child: applyMarkup((prices as any).child || 0),
            infant: (prices as any).infant || 0
          }
        }
      }

      return {
        roomTypeId: room.roomType,
        name: room.roomName,
        plan: room.plan || 'all-inclusive',
        features: [],
        availability: room.stock || 0,
        validFrom: room.validFrom,
        validTo: room.validTo,
        stock: room.stock || 0,
        capacityPrices: capacityPricesWithMarkup
      }
    }) || []

    const newHotelItem = {
      inventoryId: hotel._id,
      resourceType: 'Hotel',
      mandatory: true,
      hotelInfo: {
        resourceId: hotel.resource?._id || hotel.resource,
        name: hotel.resource?.name || hotel.inventoryName,
        stars: hotel.resource?.stars || 0,
        location: hotel.resource?.location || {},
        photos: hotel.resource?.photos || [],
        policies: hotel.resource?.policies || { checkIn: '15:00', checkOut: '12:00' }
      },
      selectedRooms: roomsWithMarkup
    }

    setItems([newHotelItem])
    setShowHotelSelector(false)
    
    // Actualizar coverPhoto con la primera foto del nuevo hotel
    if (!useCustomCover && hotel.resource?.photos?.[0]) {
      setCoverPhoto(hotel.resource.photos[0])
    }
    
    notification.success('Hotel seleccionado', 'El nuevo hotel ha sido agregado a la oferta')
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center border-b pb-4">
          <HotelIcon size={24} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Editar Oferta de Hotel</h2>
            <p className="text-sm text-default-500 font-normal">Modifica la información de la oferta</p>
          </div>
        </ModalHeader>

        <ModalBody>
          <Tabs 
            selectedKey={activeTab} 
            onSelectionChange={(key) => setActiveTab(key as string)}
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            {/* TAB 1: INFORMACIÓN GENERAL */}
            <Tab key="info" title="Información General">
              <div className="space-y-4 py-4">
                <Input
                  label="Nombre de la Oferta"
                  placeholder="Ej: Hotel Paradise 3 días"
                  value={name}
                  onValueChange={setName}
                  isRequired
                  variant="bordered"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Código"
                    placeholder="Ej: HTL001"
                    value={code}
                    onValueChange={setCode}
                    variant="bordered"
                  />
                </div>

                <Textarea
                  label="Descripción"
                  placeholder="Describe los detalles de la oferta..."
                  value={description}
                  onValueChange={setDescription}
                  variant="bordered"
                  minRows={3}
                />

                <Divider className="my-2" />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Días"
                    value={String(days)}
                    onValueChange={(val) => setDays(Number(val) || 5)}
                    variant="bordered"
                    isRequired
                    min={1}
                    startContent={<Calendar size={18} className="text-default-400" />}
                  />
                  <Input
                    type="number"
                    label="Noches"
                    value={String(nights)}
                    onValueChange={(val) => setNights(Number(val) || 4)}
                    variant="bordered"
                    isRequired
                    min={1}
                    startContent={<Calendar size={18} className="text-default-400" />}
                  />
                </div>
                
                <p className="text-xs text-default-500">
                  El precio del hotel ya incluye estos días/noches
                </p>

                <Select
                  label="Estado"
                  selectedKeys={[status]}
                  onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as string)}
                  variant="bordered"
                  isRequired
                >
                  <SelectItem key="draft">Borrador</SelectItem>
                  <SelectItem key="published">Publicado</SelectItem>
                  <SelectItem key="archived">Archivado</SelectItem>
                </Select>
              </div>
            </Tab>
            
            {/* TAB 2: PRECIOS Y HABITACIONES */}
            <Tab key="pricing" title="Precios y Habitaciones">
              <div className="space-y-4 py-4">
                {/* Selector de Hotel (cuando no hay hotel o se quitó) */}
                {showHotelSelector && (
                  <Card className="border-2 border-primary">
                    <CardBody>
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <HotelIcon size={20} className="text-primary" />
                        Selecciona un Hotel del Inventario
                      </h3>
                      
                      {isLoadingHotels ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-sm text-default-500 mt-2">Cargando hoteles...</p>
                        </div>
                      ) : availableHotels.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                          {availableHotels.map((hotel: any) => (
                            <Card
                              key={hotel._id}
                              isPressable
                              onPress={() => handleSelectNewHotel(hotel)}
                              className="border border-default-200 hover:border-primary hover:shadow-lg transition-all"
                            >
                              <CardBody className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-default-100 flex-shrink-0">
                                    {hotel.resource?.photos?.[0] ? (
                                      <img
                                        src={hotel.resource.photos[0]}
                                        alt={hotel.resource.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <HotelIcon size={20} className="text-default-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">{hotel.resource?.name || hotel.inventoryName}</p>
                                    <p className="text-xs text-default-500">
                                      <MapPin size={10} className="inline mr-1" />
                                      {hotel.resource?.location?.city}, {hotel.resource?.location?.country}
                                    </p>
                                    <p className="text-xs text-default-400 mt-1">
                                      {hotel.rooms?.length || 0} habitación(es) disponible(s)
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    color="primary"
                                    onPress={() => handleSelectNewHotel(hotel)}
                                  >
                                    Seleccionar
                                  </Button>
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-default-400 py-4">
                          {isLoadingHotels ? 'Cargando hoteles...' : 'No hay hoteles disponibles'}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                )}
                
                {/* Info del Hotel */}
                {hotelInfo && (
                  <Card>
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <HotelIcon size={20} className="text-primary" />
                          <div>
                            <h3 className="font-bold">{hotelInfo.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-default-600">
                              <MapPin size={12} />
                              <span>{hotelInfo.location?.city}, {hotelInfo.location?.country}</span>
                              {hotelInfo.stars && (
                                <Chip size="sm" color="warning" variant="flat">
                                  {hotelInfo.stars} <Star size={10} className="ml-1" fill="currentColor" />
                                </Chip>
                              )}
                            </div>
                            {hotelInfo.resourceId && (
                              <p className="text-xs text-default-400 mt-1">
                                ID Recurso: {hotelInfo.resourceId.toString().slice(-8)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            startContent={<RefreshCw size={14} />}
                            onPress={handleRefreshHotelInfo}
                            isLoading={isRefreshingHotel}
                          >
                            Recargar Info
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            startContent={<Trash2 size={14} />}
                            onPress={handleRemoveHotel}
                          >
                            Quitar
                          </Button>
                        </div>
                      </div>
                      
                      <Divider className="my-3" />
                      
                      <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>💡 Recargar Info:</strong> Actualiza nombre, ubicación, fotos y amenidades desde el recurso hotel.
                        Los precios y habitaciones seleccionadas NO se modifican.
                      </p>
                    </CardBody>
                  </Card>
                )}
                
                {/* Configuración de Markup */}
                <Card className="bg-primary/5">
                  <CardBody>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <DollarSign size={18} className="text-primary" />
                      Configuración de Markup
                    </h4>
                    
                    <div className="flex gap-4 items-end">
                      <RadioGroup 
                        value={markupType}
                        onValueChange={(val) => setMarkupType(val as 'percentage' | 'fixed')}
                        orientation="horizontal"
                        label="Tipo de markup"
                        classNames={{ wrapper: "gap-4" }}
                        className="max-w-[300px]"
                      >
                        <Radio value="percentage">
                          <div className="flex items-center gap-2">
                            <Percent size={16} />
                            <span>Porcentaje</span>
                          </div>
                        </Radio>
                        <Radio value="fixed">
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} />
                            <span>Cantidad fija</span>
                          </div>
                        </Radio>
                      </RadioGroup>
                      
                      <Input
                        type="number"
                        label={markupType === 'percentage' ? 'Porcentaje' : 'Markup Fijo (USD)'}
                        value={String(markupValue)}
                        onValueChange={(val) => setMarkupValue(Number(val) || 0)}
                        variant="bordered"
                        startContent={markupType === 'percentage' ? <Percent size={18} /> : <DollarSign size={18} />}
                        endContent={markupType === 'percentage' && <span className="text-sm text-default-400">%</span>}
                        min={0}
                        className="max-w-[200px]"
                      />
                      
                      {pricing && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-lg border border-success/30">
                          <span className="text-sm text-default-600">Precio Total:</span>
                          <span className="text-xl font-bold text-success">${pricing.finalPrice.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
                
                {/* Habitaciones con Precios Detallados */}
                {selectedRooms.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRooms.map((room: any, idx: number) => {
                      return (
                        <Card key={idx}>
                          <CardBody>
                            <div className="flex gap-4">
                              {room.photos?.[0] && (
                                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                  <img 
                                    src={room.photos[0]} 
                                    alt={room.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <BedDouble size={16} className="text-primary" />
                                      {room.name}
                                    </h4>
                                    <div className="flex gap-2 flex-wrap mt-1">
                                      <Chip size="sm" variant="flat" color="success">
                                        {room.plan === 'all_inclusive' ? 'Todo incluido' :
                                         room.plan === 'all-inclusive' ? 'Todo incluido' :
                                         room.plan === 'full_board' ? 'Pensión completa' :
                                         room.plan === 'half_board' ? 'Media pensión' :
                                         room.plan === 'breakfast' ? 'Desayuno' : 'Solo alojamiento'}
                                      </Chip>
                                      {room.stock && (
                                        <Chip size="sm" variant="flat">
                                          Stock: {room.stock}
                                        </Chip>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Tabla de precios por ocupación */}
                                {room.capacityPrices && Object.keys(room.capacityPrices).length > 0 && (
                                  <Table 
                                    hideHeader
                                    removeWrapper
                                    className="mt-3"
                                    classNames={{
                                      tr: "border-b border-divider last:border-0",
                                      td: "py-2 text-sm"
                                    }}
                                  >
                                    <TableHeader>
                                      <TableColumn>OCUPACIÓN</TableColumn>
                                      <TableColumn>ADULTO</TableColumn>
                                      <TableColumn>NIÑO</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                      {Object.entries(room.capacityPrices).map(([capacity, prices]: [string, any]) => (
                                        <TableRow key={capacity}>
                                          <TableCell>
                                            <span className="text-default-600 font-medium capitalize">
                                              {capacity === 'single' ? 'Simple' :
                                               capacity === 'double' ? 'Doble' :
                                               capacity === 'triple' ? 'Triple' :
                                               capacity === 'quad' ? 'Cuádruple' : capacity}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <span className="font-bold text-success">${prices.adult?.toFixed(2) || '0.00'}</span>
                                          </TableCell>
                                          <TableCell>
                                            <span className="text-default-500">${prices.child?.toFixed(2) || '0.00'}</span>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-default-400">
                    <HotelIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No hay habitaciones seleccionadas</p>
                  </div>
                )}
                
                {/* Resumen Final */}
                {pricing && selectedRooms.length > 0 && (
                  <Card className="bg-gradient-to-br from-primary/5 to-success/5">
                    <CardBody>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign size={18} className="text-success" />
                        Resumen Total de la Oferta
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-default-500">Duración</p>
                          <p className="font-bold">{days} días / {nights} noches</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-default-500">Precio Base</p>
                          <p className="font-bold">${pricing.basePrice.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-default-500">Precio Final</p>
                          <p className="text-2xl font-bold text-success">${pricing.finalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
                
                <p className="text-xs text-default-400 text-center">
                  ℹ️ Los precios de venta se actualizan automáticamente al cambiar el markup
                </p>
              </div>
            </Tab>
            
            {/* TAB 3: FOTO DE PORTADA */}
            <Tab key="cover" title="Foto de Portada">
              <div className="space-y-4 py-4">
                <RadioGroup 
                  value={useCustomCover ? 'custom' : 'hotel'}
                  onValueChange={(val) => setUseCustomCover(val === 'custom')}
                  className="mb-4"
                >
                  <Radio value="hotel">Usar foto del hotel</Radio>
                  <Radio value="custom">Usar imagen personalizada</Radio>
                </RadioGroup>
                
                {!useCustomCover ? (
                  // Fotos del hotel
                  <div>
                    <p className="text-sm text-default-600 mb-4">
                      Selecciona la foto que aparecerá como portada de la oferta
                    </p>
                    {hotelInfo?.photos && hotelInfo.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {hotelInfo.photos.map((photo: string, idx: number) => (
                          <Card
                            key={idx}
                            isPressable
                            onPress={() => setCoverPhoto(photo)}
                            className={`cursor-pointer transition-all ${
                              coverPhoto === photo && !useCustomCover
                                ? 'ring-2 ring-primary shadow-lg' 
                                : 'hover:shadow-md'
                            }`}
                          >
                            <CardBody className="p-0 relative">
                              <div className="aspect-video w-full overflow-hidden rounded-lg">
                                <img 
                                  src={photo} 
                                  alt={`Foto ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {coverPhoto === photo && !useCustomCover && (
                                <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                                  <Check size={16} className="text-white" />
                                </div>
                              )}
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-default-400">
                        <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No hay fotos disponibles</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Imagen personalizada
                  <div>
                    <p className="text-sm text-default-600 mb-4">
                      Ingresa la URL de una imagen personalizada para la portada
                    </p>
                    <Input
                      label="URL de la imagen"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={customCoverPhoto}
                      onValueChange={setCustomCoverPhoto}
                      variant="bordered"
                      startContent={<Upload size={18} className="text-default-400" />}
                    />
                    
                    {customCoverPhoto && (
                      <Card className="mt-4">
                        <CardBody className="p-0">
                          <div className="aspect-video w-full overflow-hidden rounded-lg">
                            <img 
                              src={customCoverPhoto} 
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E'
                              }}
                            />
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </ModalBody>

        <ModalFooter className="border-t pt-4">
          <Button
            variant="flat"
            onPress={handleCancel}
            startContent={<X size={18} />}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            startContent={!isLoading && <Save size={18} />}
          >
            Guardar Cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
