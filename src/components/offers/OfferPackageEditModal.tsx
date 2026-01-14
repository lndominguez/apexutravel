'use client'

import { useState, useEffect } from 'react'
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
  Divider
} from '@heroui/react'
import {
  Package, 
  MapPin, 
  Calendar, 
  Hotel as HotelIcon,
  Plane,
  Bus,
  Ticket,
  DollarSign,
  Save,
  X,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { getCheapestRoomAdultBasePrice, getRoomAdultBasePrice } from '@/lib/offerPricing'

interface OfferPackageEditModalProps {
  isOpen: boolean
  onClose: () => void
  packageData: any
  onSave: (data: any) => Promise<void>
  isLoading?: boolean
}

const CATEGORIES = [
  { value: 'beach', label: 'Playa' },
  { value: 'adventure', label: 'Aventura' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'romantic', label: 'Romántico' },
  { value: 'family', label: 'Familiar' },
  { value: 'luxury', label: 'Lujo' },
  { value: 'business', label: 'Negocios' },
  { value: 'wellness', label: 'Bienestar' },
  { value: 'cruise', label: 'Crucero' }
]

export default function OfferPackageEditModal({
  isOpen,
  onClose,
  packageData,
  onSave,
  isLoading = false
}: OfferPackageEditModalProps) {
  const notification = useNotification()

  // Tab actual
  const [activeTab, setActiveTab] = useState('info')

  // Info General
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('beach')
  
  // Duración (days se calcula automáticamente como nights + 1)
  const [nights, setNights] = useState(4)
  
  // Markup
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage')
  const [markupValue, setMarkupValue] = useState(10)
  
  // Fechas válidas
  const [validFrom, setValidFrom] = useState<string>('')
  const [validTo, setValidTo] = useState<string>('')
  
  // Estado
  const [status, setStatus] = useState('draft')
  const [featured, setFeatured] = useState(false)

  // Items (estructura de Offer)
  const [items, setItems] = useState<any[]>([])
  
  // Estado para selector de hotel
  const [isSelectingHotel, setIsSelectingHotel] = useState(false)
  const [isRefreshingHotel, setIsRefreshingHotel] = useState(false)

  // Derivados para resumen (el pricing real se calcula desde inventario en runtime)
  const hotelItem = items.find((item: any) => item.resourceType === 'Hotel')
  const days = nights + 1

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && packageData) {
      setName(packageData.name || '')
      setCode(packageData.code || '')
      setDescription(packageData.description || '')
      setCategory(packageData.category || 'beach')
      
      setNights(packageData.duration?.nights || 4)
      
      setMarkupType(packageData.markup?.type || 'percentage')
      setMarkupValue(packageData.markup?.value || 10)
      
      setValidFrom(packageData.validFrom ? new Date(packageData.validFrom).toISOString().split('T')[0] : '')
      setValidTo(packageData.validTo ? new Date(packageData.validTo).toISOString().split('T')[0] : '')
      
      setStatus(packageData.status || 'draft')
      setFeatured(packageData.featured || false)
      
      setItems(packageData.items || [])
    }
  }, [isOpen, packageData])

  const updateDurationFromDateStrings = (start: string, end: string) => {
    if (!start || !end) return
    const dateFrom = new Date(start)
    const dateTo = new Date(end)
    if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) return
    const diffMs = dateTo.getTime() - dateFrom.getTime()
    if (diffMs <= 0) return
    const nightsCalc = Math.round(diffMs / (1000 * 60 * 60 * 24))
    setNights(nightsCalc)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      notification.error('Nombre requerido', 'Debes ingresar un nombre para el paquete')
      return
    }

    // Extraer ubicación del hotel automáticamente
    const hotelItem = items.find((item: any) => item.resourceType === 'Hotel')
    const destination = hotelItem?.hotelInfo?.location ? {
      city: hotelItem.hotelInfo.location.city,
      country: hotelItem.hotelInfo.location.country,
      region: hotelItem.hotelInfo.location.state || ''
    } : null

    if (!destination) {
      notification.error('Hotel requerido', 'El paquete debe incluir un hotel para determinar el destino')
      return
    }

    // Validar fechas
    if (validFrom && validTo) {
      const dateFrom = new Date(validFrom)
      const dateTo = new Date(validTo)

      if (dateFrom >= dateTo) {
        notification.error('Fechas inválidas', 'La fecha de inicio debe ser anterior a la fecha de fin')
        return
      }

      // Nota: La validación de fechas contra inventario se hace en el backend
    }

    // Reglas de negocio al publicar
    if (status === 'published') {
      if (!validFrom || !validTo) {
        notification.error(
          'No se puede publicar',
          'Debes definir un rango de vigencia válido para el paquete'
        )
        return
      }

      if (markupValue <= 0) {
        notification.error(
          'Markup inválido',
          'El markup debe ser mayor a 0 para publicar el paquete'
        )
        return
      }
    }

    const updatedData = {
      name,
      code,
      description,
      category,
      destination,
      duration: {
        nights: Number(nights)
      },
      markup: {
        type: markupType,
        value: markupValue
      },
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: validTo ? new Date(validTo) : undefined,
      status,
      featured
    }

    await onSave(updatedData)
  }

  const handleClose = () => {
    setActiveTab('info')
    onClose()
  }

  const handleRefreshHotelInfo = async () => {
    const hotelItem = items.find((item: any) => item.resourceType === 'Hotel')
    if (!hotelItem?.hotelInfo?.resourceId) {
      notification.error('Error', 'No se encontró el ID del recurso del hotel')
      return
    }

    setIsRefreshingHotel(true)
    try {
      const response = await fetch(`/api/resources/hotels/${hotelItem.hotelInfo.resourceId}`)
      const data = await response.json()

      if (data.success && data.data) {
        const hotelResource = data.data
        
        // Actualizar hotelInfo con datos frescos del recurso
        const updatedItems = items.map((item: any) => {
          if (item.resourceType === 'Hotel') {
            return {
              ...item,
              hotelInfo: {
                ...item.hotelInfo,
                name: hotelResource.name,
                stars: hotelResource.stars,
                location: hotelResource.location,
                photos: hotelResource.photos || [],
                policies: hotelResource.policies || item.hotelInfo.policies,
                amenities: hotelResource.amenities || []
              }
            }
          }
          return item
        })
        
        setItems(updatedItems)
        notification.success('Información actualizada', 'Los datos del hotel se han recargado desde el recurso')
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

  const handleRemoveHotel = () => {
    if (!confirm('¿Estás seguro de quitar el hotel? Esto afectará el destino y los precios del paquete.')) {
      return
    }
    
    const updatedItems = items.filter((item: any) => item.resourceType !== 'Hotel')
    setItems(updatedItems)
    notification.success('Hotel eliminado', 'El hotel ha sido quitado del paquete')
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Package size={24} className="text-primary" />
          Editar Paquete Turístico
        </ModalHeader>
        
        <ModalBody>
          {/* Resumen superior del paquete */}
          <Card className="mb-4">
            <CardBody>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Chip
                      size="sm"
                      color={status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'default'}
                      variant="flat"
                    >
                      {status}
                    </Chip>
                    {packageData?.code && (
                      <span className="text-xs text-default-500">
                        {packageData.code}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">
                    {name || packageData?.name}
                  </h3>
                  {hotelItem?.hotelInfo?.location && (
                    <p className="text-sm text-default-500 flex items-center gap-1">
                      <MapPin size={14} className="text-primary" />
                      <span>
                        {hotelItem.hotelInfo.location.city}, {hotelItem.hotelInfo.location.country}
                      </span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-default-500">Vigencia</p>
                    <p className="font-medium">
                      {validFrom && validTo
                        ? `${new Date(validFrom).toLocaleDateString('es-ES')} – ${new Date(
                            validTo
                          ).toLocaleDateString('es-ES')}`
                        : 'Sin definir'}
                    </p>
                    <p className="text-xs text-default-400 mt-1">
                      {days} días / {nights} noches
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-default-500">Markup</p>
                    <p className="font-semibold flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>{markupType === 'percentage' ? `${markupValue}%` : `$${markupValue}`}</span>
                    </p>
                    <p className="text-xs text-default-500 mt-1">
                      Precio final se calcula desde inventario
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            color="primary"
            variant="underlined"
          >
            {/* TAB 1: INFO GENERAL */}
            <Tab 
              key="info" 
              title={
                <div className="flex items-center gap-2">
                  <Package size={16} />
                  <span>Información</span>
                </div>
              }
            >
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre del Paquete"
                    placeholder="Ej: Cancún Todo Incluido 5 Días"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    isRequired
                  />
                  <Input
                    label="Código"
                    placeholder="PKG-001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    isDisabled
                    description="El código no se puede modificar"
                  />
                </div>

                <Textarea
                  label="Descripción"
                  placeholder="Describe el paquete turístico..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minRows={3}
                />

                <Divider />

                {/* Ubicación extraída del hotel (solo lectura) */}
                {items.find((item: any) => item.resourceType === 'Hotel')?.hotelInfo?.location && (
                  <div className="p-3 bg-default-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={16} className="text-primary" />
                      <span className="text-sm font-semibold">Destino</span>
                    </div>
                    <p className="text-sm">
                      {items.find((item: any) => item.resourceType === 'Hotel').hotelInfo.location.city}, {items.find((item: any) => item.resourceType === 'Hotel').hotelInfo.location.country}
                    </p>
                    <p className="text-xs text-default-500 mt-1">
                      La ubicación se obtiene automáticamente del hotel del paquete
                    </p>
                  </div>
                )}

                <Divider />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Categoría"
                    selectedKeys={[category]}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </Tab>

            {/* TAB 2: COMPONENTES */}
            <Tab 
              key="components" 
              title={
                <div className="flex items-center gap-2">
                  <Ticket size={16} />
                  <span>Componentes</span>
                </div>
              }
            >
              <div className="space-y-4 py-4">
                {/* Hotel */}
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <HotelIcon size={20} className="text-primary" />
                        <h3 className="font-semibold">Hotel</h3>
                        {items.filter((item: any) => item.resourceType === 'Hotel').length > 0 && (
                          <Chip size="sm" color="success" variant="flat">
                            {items.filter((item: any) => item.resourceType === 'Hotel').length}
                          </Chip>
                        )}
                      </div>
                      
                      {items.filter((item: any) => item.resourceType === 'Hotel').length > 0 && (
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
                      )}
                    </div>
                    
                    {items.filter((item: any) => item.resourceType === 'Hotel').length > 0 ? (
                      <div className="space-y-2">
                        {items.filter((item: any) => item.resourceType === 'Hotel').map((item: any, idx: number) => (
                          <div key={idx} className="p-3 bg-default-100 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">{item.hotelInfo?.name || 'Hotel'}</p>
                                <p className="text-xs text-default-500 mb-2">
                                  <MapPin size={12} className="inline mr-1" />
                                  {item.hotelInfo?.location?.city}, {item.hotelInfo?.location?.country}
                                </p>
                                {item.hotelInfo?.resourceId && (
                                  <p className="text-xs text-default-400">
                                    ID Recurso: {item.hotelInfo.resourceId.toString().slice(-8)}
                                  </p>
                                )}
                              </div>
                              {item.hotelInfo?.stars && (
                                <Chip size="sm" variant="flat" color="warning">
                                  ⭐ {item.hotelInfo.stars}
                                </Chip>
                              )}
                            </div>
                            
                            {/* Mostrar habitaciones del inventario */}
                            {item.inventory?.rooms && item.inventory.rooms.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-default-200">
                                <p className="text-xs font-medium text-default-600 mb-2">
                                  Habitaciones del Inventario ({item.inventory.rooms.length})
                                </p>
                                <div className="space-y-2">
                                  {item.inventory.rooms.map((room: any, roomIdx: number) => {
                                    const roomType = item.hotelResource?.roomTypes?.find(
                                      (rt: any) => rt._id?.toString() === room.roomType?.toString()
                                    )
                                    
                                    // Aplicar markup a los precios para mostrar precio final
                                    const applyMarkup = (basePrice: number) => {
                                      if (!packageData?.markup) return basePrice
                                      if (packageData.markup.type === 'percentage') {
                                        return basePrice + (basePrice * packageData.markup.value / 100)
                                      }
                                      return basePrice + packageData.markup.value
                                    }
                                    
                                    return (
                                      <div key={roomIdx} className="p-2 bg-default-50 rounded text-xs">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium">{room.roomName || roomType?.name || 'Habitación'}</span>
                                          <Chip size="sm" variant="flat" color="primary">
                                            Stock: {room.stock || 0}
                                          </Chip>
                                        </div>
                                        {room.capacityPrices && (
                                          <div className="grid grid-cols-2 gap-1 mt-2">
                                            {Object.entries(room.capacityPrices).map(([occupancy, prices]: [string, any]) => (
                                              <div key={occupancy} className="text-xs">
                                                <span className="text-default-500 capitalize">{occupancy}:</span>
                                                <span className="ml-1 font-medium">
                                                  ${applyMarkup(prices?.adult || 0).toFixed(2)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg mt-3">
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            <strong>💡 Info:</strong> Las habitaciones y precios se sincronizan automáticamente desde el inventario.
                            Cualquier cambio en el inventario se reflejará en la oferta.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-default-400 mb-3">No hay hotel configurado</p>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => setIsSelectingHotel(true)}
                        >
                          Agregar Hotel
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* Vuelos */}
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-2 mb-3">
                      <Plane size={20} className="text-primary" />
                      <h3 className="font-semibold">Vuelos</h3>
                      {items.filter((item: any) => item.resourceType === 'Flight').length > 0 && (
                        <Chip size="sm" color="success" variant="flat">
                          {items.filter((item: any) => item.resourceType === 'Flight').length}
                        </Chip>
                      )}
                    </div>
                    
                    {items.filter((item: any) => item.resourceType === 'Flight').length > 0 ? (
                      <div className="space-y-2">
                        {items.filter((item: any) => item.resourceType === 'Flight').map((flight: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-default-100 rounded">
                            <div>
                              <p className="text-sm">
                                {flight.flightDetails?.route?.from} → {flight.flightDetails?.route?.to}
                              </p>
                              <p className="text-xs text-default-500">
                                Clase: {flight.flightDetails?.class || 'Economy'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-default-400">No hay vuelos configurados</p>
                    )}
                  </CardBody>
                </Card>

                {/* Transportes */}
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-2 mb-3">
                      <Bus size={20} className="text-primary" />
                      <h3 className="font-semibold">Transportes</h3>
                      {items.filter((item: any) => item.resourceType === 'Transport').length > 0 && (
                        <Chip size="sm" color="success" variant="flat">
                          {items.filter((item: any) => item.resourceType === 'Transport').length}
                        </Chip>
                      )}
                    </div>
                    
                    {items.filter((item: any) => item.resourceType === 'Transport').length > 0 ? (
                      <div className="space-y-2">
                        {items.filter((item: any) => item.resourceType === 'Transport').map((transport: any, idx: number) => (
                          <div key={idx} className="p-2 bg-default-100 rounded">
                            <p className="text-sm">
                              {transport.transportOrActivity?.route?.from} → {transport.transportOrActivity?.route?.to}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-default-400">No hay transportes configurados</p>
                    )}
                  </CardBody>
                </Card>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Nota:</strong> Para modificar los componentes (agregar/quitar hoteles, vuelos, etc.), 
                    es recomendable crear un nuevo paquete usando el wizard. Esta vista es solo para editar información básica y precios.
                  </p>
                </div>
              </div>
            </Tab>

            {/* TAB 3: PRICING & MARKUP */}
            <Tab 
              key="pricing" 
              title={
                <div className="flex items-center gap-2">
                  <DollarSign size={16} />
                  <span>Pricing & Markup</span>
                </div>
              }
            >
              <div className="space-y-4 py-4">
                {/* Configuración de Markup */}
                <Card>
                  <CardBody>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <DollarSign size={20} className="text-warning" />
                      Configuración de Markup
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Select
                        label="Tipo de Markup"
                        selectedKeys={[markupType]}
                        onChange={(e) => setMarkupType(e.target.value as 'percentage' | 'fixed')}
                      >
                        <SelectItem key="percentage">Porcentaje (%)</SelectItem>
                        <SelectItem key="fixed">Monto Fijo (USD)</SelectItem>
                      </Select>
                      
                      <Input
                        type="number"
                        label="Valor de Markup"
                        value={markupValue.toString()}
                        onChange={(e) => setMarkupValue(Number(e.target.value))}
                        startContent={markupType === 'percentage' ? '%' : '$'}
                        min={0}
                      />
                    </div>
                  </CardBody>
                </Card>

                {/* Fechas de Validez */}
                <Card>
                  <CardBody>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Calendar size={20} className="text-primary" />
                      Fechas de Validez del Paquete
                    </h3>
                    
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 mb-1">
                        <strong>📌 Vigencia del Paquete:</strong>
                      </p>
                      <p className="text-xs text-blue-700">
                        Define el rango de fechas en que este paquete estará disponible para reserva.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="date"
                        label="Fecha Inicio"
                        value={validFrom}
                        onChange={(e) => {
                          const value = e.target.value
                          setValidFrom(value)
                          updateDurationFromDateStrings(value, validTo)
                        }}
                        description="Fecha desde la que el paquete es válido"
                      />
                      <Input
                        type="date"
                        label="Fecha Fin"
                        value={validTo}
                        onChange={(e) => {
                          const value = e.target.value
                          setValidTo(value)
                          updateDurationFromDateStrings(validFrom, value)
                        }}
                        min={validFrom}
                        description="Fecha hasta la que el paquete es válido"
                      />
                    </div>
                  </CardBody>
                </Card>

                {/* Resumen de Precios */}
                <Card>
                  <CardBody>
                    <h3 className="font-semibold mb-4">Resumen de Precios</h3>
                    
                    <div className="space-y-4">
                      {/* Info de Pricing */}
                      <div className="p-3 bg-default-100 rounded-lg">
                        <p className="text-sm font-medium mb-2">Cálculo de Precios</p>
                        <p className="text-xs text-default-600">
                          Los precios se calculan automáticamente desde el inventario aplicando el markup configurado.
                        </p>
                        <p className="text-xs text-default-500 mt-2">
                          Duración: {nights} noches ({days} días)
                        </p>
                      </div>

                      {/* Markup Aplicado */}
                      <div className="p-3 bg-warning-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Markup Aplicado</p>
                        <p className="text-lg font-bold text-warning">
                          {markupType === 'percentage' ? `${markupValue}%` : `$${markupValue}`}
                        </p>
                      </div>

                      {/* Markup Configurado */}
                      <div className="p-4 bg-success-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Markup Aplicado</p>
                        <p className="text-3xl font-bold text-success">
                          {markupType === 'percentage' ? `${markupValue}%` : `$${markupValue}`}
                        </p>
                        <p className="text-xs text-success-600 mt-1">
                          Se aplica sobre los precios del inventario
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            {/* TAB 4: ESTADO */}
            <Tab 
              key="status" 
              title={
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Estado</span>
                </div>
              }
            >
              <div className="space-y-4 py-4">
                <Card>
                  <CardBody>
                    <h3 className="font-semibold mb-4">Estado de Publicación</h3>
                    
                    <Select
                      label="Estado"
                      selectedKeys={[status]}
                      onChange={(e) => setStatus(e.target.value)}
                      description="Draft = Borrador, Published = Publicado, Archived = Archivado"
                    >
                      <SelectItem key="draft">
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color="warning" variant="flat">Draft</Chip>
                          <span>Borrador</span>
                        </div>
                      </SelectItem>
                      <SelectItem key="published">
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color="success" variant="flat">Published</Chip>
                          <span>Publicado</span>
                        </div>
                      </SelectItem>
                      <SelectItem key="archived">
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color="default" variant="flat">Archived</Chip>
                          <span>Archivado</span>
                        </div>
                      </SelectItem>
                    </Select>

                    <Divider className="my-4" />

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="featured" className="text-sm">
                        Marcar como destacado
                      </label>
                    </div>
                    <p className="text-xs text-default-500 mt-2">
                      Los paquetes destacados aparecen primero en el listado público
                    </p>
                  </CardBody>
                </Card>

                {packageData?.createdAt && (
                  <Card>
                    <CardBody>
                      <h3 className="font-semibold mb-2">Información de Auditoría</h3>
                      <div className="space-y-2 text-sm text-default-600">
                        <p>Creado: {new Date(packageData.createdAt).toLocaleString('es-ES')}</p>
                        {packageData.updatedAt && (
                          <p>Última modificación: {new Date(packageData.updatedAt).toLocaleString('es-ES')}</p>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </Tab>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="light"
            onPress={handleClose}
            startContent={<X size={16} />}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={isLoading}
            startContent={!isLoading && <Save size={16} />}
          >
            Guardar Cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
