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
  Card,
  CardBody,
  Chip,
  Avatar,
  Divider,
  ScrollShadow,
  User,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Autocomplete,
  AutocompleteItem
} from '@heroui/react'
import { useHotels, useFlights, useTransports, useSuppliers, useInventory } from '@/swr'
import { useNotification } from '@/hooks/useNotification'
import { 
  Search, 
  Plane, 
  Hotel as HotelIcon, 
  Bus, 
  DollarSign, 
  Package2,
  Calendar,
  MapPin,
  Users,
  Star,
  Check,
  ArrowLeft,
  Building2,
  Bed,
  ChevronRight,
  LayoutGrid,
  List,
  Lock,
  Unlock,
  X
} from 'lucide-react'
import Image from 'next/image'
import SupplierSelector from './SupplierSelector'
import HotelInventoryForm from './HotelInventoryForm'
import FlightInventoryForm from './FlightInventoryForm'
import TransportInventoryForm from './TransportInventoryForm'

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  item?: any
  isLoading?: boolean
}

const RESOURCE_CATEGORIES = [
  {
    id: 'Hotel',
    label: 'Hoteles',
    icon: HotelIcon,
    color: 'bg-slate-600',
    description: 'Gestiona inventario de hoteles'
  },
  {
    id: 'Flight',
    label: 'Vuelos',
    icon: Plane,
    color: 'bg-slate-700',
    description: 'Gestiona inventario de vuelos'
  },
  {
    id: 'Transport',
    label: 'Transportes',
    icon: Bus,
    color: 'bg-slate-600',
    description: 'Gestiona inventario de transportes'
  }
]

const FLIGHT_CLASSES = [
  { value: 'economy', label: 'Económica' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Ejecutiva' },
  { value: 'first', label: 'Primera Clase' }
]

const FLIGHT_TYPES = [
  { value: 'outbound', label: 'Ida' },
  { value: 'return', label: 'Vuelta' },
  { value: 'internal', label: 'Interno' }
]

const SERVICE_TYPES = [
  { value: 'private', label: 'Privado' },
  { value: 'shared', label: 'Compartido' },
  { value: 'luxury', label: 'Lujo' },
  { value: 'standard', label: 'Estándar' }
]

export default function InventoryModal({ isOpen, onClose, onSubmit, item, isLoading }: InventoryModalProps) {
  const { hotels } = useHotels({ status: 'active' })
  const { flights } = useFlights({ status: 'available' })
  const { transports } = useTransports({ status: 'active' })
  const { suppliers } = useSuppliers({ status: 'active' })

  const [step, setStep] = useState<'resource' | 'configure'>('resource')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Campos comunes de inventario
  const [inventoryName, setInventoryName] = useState('')
  const [inventoryCode, setInventoryCode] = useState('')
  const [isCodeLocked, setIsCodeLocked] = useState(true)
  const [creationDate, setCreationDate] = useState(new Date().toISOString().split('T')[0])

  // Obtener inventarios del tipo seleccionado para calcular consecutivo
  const { inventory: existingInventories } = useInventory({
    resourceType: selectedCategory as 'Hotel' | 'Flight' | 'Transport'
  })

  // Generar código de inventario automáticamente
  useEffect(() => {
    if (selectedCategory && isCodeLocked) {
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const day = now.getDate().toString().padStart(2, '0')
      const resourceType = selectedCategory === 'Hotel' ? 'HTL' : selectedCategory === 'Flight' ? 'FLT' : 'TRP'
      
      // Calcular consecutivo basado en inventarios existentes del mismo tipo
      const count = existingInventories?.length || 0
      const consecutive = (count + 1).toString().padStart(3, '0')
      
      setInventoryCode(`INV-${resourceType}-${year}${month}${day}-${consecutive}`)
    }
  }, [selectedCategory, isCodeLocked, existingInventories])

  // Configuración de inventario por tipo de habitación (para hoteles)
  const [roomConfigs, setRoomConfigs] = useState<{[key: string]: {
    roomName: string
    stock: number
    capacityPrices: {[key: string]: { adult: number, child: number, infant: number }}
  }}>({})

  // Configuración para vuelos
  const [flightConfig, setFlightConfig] = useState({
    class: 'economy',
    flightType: 'outbound',
    adult: { cost: 0 },
    child: { cost: 0 },
    infant: { cost: 0 },
    availability: 0
  })

  // Configuración para transportes
  const [transportConfig, setTransportConfig] = useState({
    serviceType: 'standard',
    cost: 0,
    availability: 0
  })

  const [notes, setNotes] = useState('')
  const [pricingMode, setPricingMode] = useState<'per_night' | 'package'>('per_night')

  useEffect(() => {
    if (!isOpen || !item) return

    // Cargar datos del item para edición
    setStep('configure')
    setSelectedCategory(item.resourceType)
    setSelectedResource(item.resource)
    setInventoryCode(item.inventoryCode || '')
    setInventoryName(item.inventoryName || '')
    setIsCodeLocked(false) // Permitir edición del código cuando se está editando
    setNotes(item.notes || '')
    setPricingMode(item.pricingMode || 'per_night')

    // Cargar proveedor completo (para asegurar logo y demás campos)
    if (item.supplier) {
      const supplierId = typeof item.supplier === 'string'
        ? item.supplier
        : item.supplier._id

      const supplierData = supplierId
        ? suppliers?.find((s: any) => s._id === supplierId)
        : null

      // Preferir el supplier completo del catálogo; fallback al objeto del item si ya viene poblado
      if (supplierData) {
        setSelectedSupplier(supplierData)
      } else if (typeof item.supplier !== 'string') {
        setSelectedSupplier(item.supplier)
      } else {
        setSelectedSupplier(null)
      }
    } else {
      setSelectedSupplier(null)
    }

    // Cargar configuración específica según tipo de recurso
    if (item.resourceType === 'Hotel' && item.rooms && Array.isArray(item.rooms)) {
      // Nuevo formato: array de habitaciones
      const configs: any = {}
      item.rooms.forEach((room: any) => {
        configs[room.roomType] = {
          roomName: room.roomName,
          stock: room.stock || 0,
          capacityPrices: room.capacityPrices || {}
        }
      })
      setRoomConfigs(configs)
    } else if (item.resourceType === 'Hotel' && item.configuration?.roomType) {
      // Formato antiguo (retrocompatibilidad): configuración única
      setRoomConfigs({
        [item.configuration.roomType]: {
          roomName: item.resource?.roomTypes?.find((r: any) => (r._id || r.id) === item.configuration.roomType)?.name || '',
          stock: item.availability || 0,
          capacityPrices: item.pricing?.capacityPrices || {}
        }
      })
    } else if (item.resourceType === 'Flight' && item.configuration) {
      setFlightConfig({
        class: item.configuration.class || 'economy',
        flightType: item.configuration.flightType || 'outbound',
        adult: { cost: item.pricing?.adult?.cost || 0 },
        child: { cost: item.pricing?.child?.cost || 0 },
        infant: { cost: item.pricing?.infant?.cost || 0 },
        availability: item.availability || 0
      })
    } else if (item.resourceType === 'Transport' && item.configuration) {
      setTransportConfig({
        serviceType: item.configuration.serviceType || 'standard',
        cost: item.pricing?.cost || 0,
        availability: item.availability || 0
      })
    }
  }, [isOpen, item, suppliers])

  // Función para normalizar texto (quitar tildes, ñ, etc.)
  const normalizeText = (text: string): string => {
    if (!text) return ''
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
      .replace(/ñ/g, 'n')
      .replace(/Ñ/g, 'n')
  }

  // Obtener lista de ciudades únicas para el autocomplete
  const cityOptions = useMemo(() => {
    let cities: Set<string> = new Set()
    
    if (selectedCategory === 'Hotel') {
      (hotels || []).forEach((hotel: any) => {
        if (hotel.location?.city) {
          const cityCountry = `${hotel.location.city}, ${hotel.location.country}`
          cities.add(cityCountry)
        }
      })
    } else if (selectedCategory === 'Flight') {
      (flights || []).forEach((flight: any) => {
        if (flight.departure?.city) cities.add(flight.departure.city)
        if (flight.arrival?.city) cities.add(flight.arrival.city)
      })
    } else if (selectedCategory === 'Transport') {
      (transports || []).forEach((transport: any) => {
        if (transport.route?.origin?.city) cities.add(transport.route.origin.city)
        if (transport.route?.destination?.city) cities.add(transport.route.destination.city)
      })
    }
    
    return Array.from(cities).sort()
  }, [selectedCategory, hotels, flights, transports])

  // Filtrar recursos según búsqueda
  const filteredResources = useMemo(() => {
    let resources: any[] = []
    
    if (selectedCategory === 'Hotel') {
      resources = hotels || []
    } else if (selectedCategory === 'Flight') {
      resources = flights || []
    } else if (selectedCategory === 'Transport') {
      resources = transports || []
    }

    if (!searchQuery) return resources

    return resources.filter((r: any) => {
      const query = normalizeText(searchQuery)
      if (selectedCategory === 'Hotel') {
        return normalizeText(r.name || '').includes(query) || 
               normalizeText(r.location?.city || '').includes(query) ||
               normalizeText(r.location?.country || '').includes(query) ||
               normalizeText(r.location?.state || '').includes(query) ||
               normalizeText(r.location?.zone || '').includes(query) ||
               normalizeText(r.chain || '').includes(query) ||
               normalizeText(r.location?.address || '').includes(query)
      } else if (selectedCategory === 'Flight') {
        return normalizeText(r.flightNumber || '').includes(query) ||
               normalizeText(r.airline?.name || '').includes(query) ||
               normalizeText(r.departure?.city || '').includes(query) ||
               normalizeText(r.departure?.airport || '').includes(query) ||
               normalizeText(r.departure?.country || '').includes(query) ||
               normalizeText(r.arrival?.city || '').includes(query) ||
               normalizeText(r.arrival?.airport || '').includes(query) ||
               normalizeText(r.arrival?.country || '').includes(query)
      } else if (selectedCategory === 'Transport') {
        return normalizeText(r.name || '').includes(query) ||
               normalizeText(r.route?.origin?.city || '').includes(query) ||
               normalizeText(r.route?.origin?.country || '').includes(query) ||
               normalizeText(r.route?.destination?.city || '').includes(query) ||
               normalizeText(r.route?.destination?.country || '').includes(query) ||
               normalizeText(r.type || '').includes(query)
      }
      return false
    })
  }, [selectedCategory, searchQuery, hotels, flights, transports])

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setStep('resource')
    setSearchQuery('')
  }

  const handleResourceSelect = (resource: any) => {
    setSelectedResource(resource)
    
    // Inicializar configuración según el tipo de recurso
    if (selectedCategory === 'Hotel' && resource.roomTypes) {
      const initialConfigs: any = {}
      resource.roomTypes.forEach((rt: any) => {
        initialConfigs[rt.name] = {
          plan: 'all_inclusive',
          costPerNight: 0,
          availability: 0
        }
      })
      setRoomConfigs(initialConfigs)
    }
    
    setStep('configure')
  }

  const handleBack = () => {
    if (step === 'configure') {
      setStep('resource')
      setSelectedResource(null)
      setSelectedSupplier(null)
    }
  }

  const notification = useNotification()

  const handleSubmit = async () => {
    if (!selectedResource || !selectedSupplier) {
      notification.warning('Campos requeridos', 'Debes seleccionar un recurso y un proveedor')
      return
    }

    // Validar que se hayan ingresado el código y nombre del inventario
    if (!inventoryCode || !inventoryName) {
      notification.warning('Campos requeridos', 'Debes ingresar el código y nombre del inventario')
      return
    }

    // Configuración específica según tipo
    if (selectedCategory === 'Hotel') {
      // Construir array de habitaciones
      const roomsArray = Object.entries(roomConfigs)
        .filter(([_, config]: any) => config.stock > 0)
        .map(([roomType, config]: any) => ({
          roomType,
          roomName: config.roomName,
          capacityPrices: config.capacityPrices || {},
          stock: config.stock
        }))

      if (roomsArray.length === 0) {
        notification.warning('Sin configuraciones válidas', 'Debes configurar al menos una habitación con stock')
        return
      }

      // Crear UN SOLO inventario con todas las habitaciones (cada una con sus propias fechas)
      const hotelData = {
        inventoryCode,
        inventoryName,
        resourceType: selectedCategory,
        resource: selectedResource._id,
        supplier: selectedSupplier._id,
        pricingMode,
        notes,
        status: 'active',
        rooms: roomsArray
      }
      
      await onSubmit(hotelData)
    } else if (selectedCategory === 'Flight') {
      const flightData = {
        inventoryCode,
        inventoryName,
        resourceType: selectedCategory,
        resource: selectedResource._id,
        supplier: selectedSupplier._id,
        notes,
        status: 'active',
        configuration: {
          class: flightConfig.class,
          flightType: flightConfig.flightType
        },
        pricing: {
          adult: { cost: flightConfig.adult.cost },
          child: { cost: flightConfig.child.cost },
          infant: { cost: flightConfig.infant.cost }
        },
        availability: flightConfig.availability
      }
      await onSubmit(flightData)
    } else if (selectedCategory === 'Transport') {
      const transportData = {
        inventoryCode,
        inventoryName,
        resourceType: selectedCategory,
        resource: selectedResource._id,
        supplier: selectedSupplier._id,
        notes,
        status: 'active',
        configuration: {
          serviceType: transportConfig.serviceType
        },
        pricing: {
          cost: transportConfig.cost
        },
        availability: transportConfig.availability
      }
      await onSubmit(transportData)
    }

    handleClose()
  }

  const handleClose = () => {
    onClose()
  }
  
  // Resetear estado cuando el modal se cierra completamente
  useEffect(() => {
    if (!isOpen) {
      setStep('resource')
      setSelectedCategory(null)
      setSelectedResource(null)
      setSelectedSupplier(null)
      setSearchQuery('')
      setInventoryCode('')
      setInventoryName('')
      setIsCodeLocked(true)
      setCreationDate(new Date().toISOString().split('T')[0])
      setRoomConfigs({})
      setFlightConfig({
        class: 'economy',
        flightType: 'outbound',
        adult: { cost: 0 },
        child: { cost: 0 },
        infant: { cost: 0 },
        availability: 0
      })
      setTransportConfig({
        serviceType: 'standard',
        cost: 0,
        availability: 0
      })
      setNotes('')
      setPricingMode('per_night')
    }
  }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        body: "p-0"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 px-6 py-4">
          {step === 'configure' && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={handleBack}
              isDisabled={!!item}
              title={item ? 'No se puede cambiar el recurso al editar' : 'Volver a selección de recurso'}
            >
              <ArrowLeft size={18} />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package2 size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {step === 'resource' && 'Agregar a Inventario'}
                {step === 'configure' && 'Configurar Inventario'}
              </h2>
              <p className="text-sm text-default-500 font-normal">
                {step === 'resource' && 'Selecciona un catálogo y elige el recurso'}
                {step === 'configure' && 'Define costos, stock y proveedor'}
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="p-0">
          {/* PASO 1: Selección de Recurso (2 columnas) */}
          {step === 'resource' && (
            <div className="flex h-[600px]">
              {/* Columna Izquierda: Categorías */}
              <div className="w-52 p-4 space-y-3 border-r border-dashed border-default-300">
                <p className="text-xs font-semibold text-default-600 uppercase tracking-wide px-1">Catálogos</p>
                <div className="space-y-2.5">
                  {RESOURCE_CATEGORIES.map((category) => {
                    const Icon = category.icon
                    const isSelected = selectedCategory === category.id
                    return (
                      <Card
                        key={category.id}
                        isPressable
                        onPress={() => handleCategorySelect(category.id)}
                        className={`w-[176px] h-[120px] transition-all duration-200 ${
                          isSelected 
                            ? 'border-2 border-primary bg-primary/10 shadow-md scale-[1.02]' 
                            : 'border-2 border-default-200 hover:border-primary/40 hover:shadow-sm'
                        }`}
                      >
                        <CardBody className="p-3 relative flex items-center justify-center">
                          <div className="flex flex-col items-center text-center gap-2">
                            <div className={`w-11 h-11 rounded-lg ${category.color} flex items-center justify-center transition-transform ${
                              isSelected ? 'scale-105' : ''
                            }`}>
                              <Icon size={22} className="text-white" />
                            </div>
                            <div className="w-full">
                              <p className="font-bold text-sm leading-tight">{category.label}</p>
                              <p className="text-[10px] text-default-400 mt-0.5 line-clamp-1">{category.description}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check size={12} className="text-white" />
                              </div>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Columna Derecha: Listado de Recursos */}
              <div className="flex-1 flex flex-col">
                {selectedCategory ? (
                  <>
                    {/* Búsqueda y Toggle de Vista */}
                    <div className="p-4 space-y-3 border-b border-dashed border-default-300">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Input
                          placeholder={`Buscar por ${selectedCategory === 'Hotel' ? 'nombre, ciudad, país, cadena...' : selectedCategory === 'Flight' ? 'vuelo, aerolínea, ciudad, aeropuerto...' : 'nombre, ciudad, tipo...'}`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          startContent={<Search size={18} className="text-default-400" />}
                          size="md"
                          className="flex-1 max-w-md"
                          isClearable
                          onClear={() => setSearchQuery('')}
                          variant="bordered"
                        />
                        {searchQuery && (
                          <Chip size="sm" variant="flat" color="primary">
                            {filteredResources.length} resultado{filteredResources.length !== 1 ? 's' : ''}
                          </Chip>
                        )}
                      </div>
                      <Tabs
                        selectedKey={viewMode}
                        onSelectionChange={(key) => setViewMode(key as 'grid' | 'table')}
                        size="sm"
                        color="primary"
                        variant="underlined"
                      >
                        <Tab
                          key="grid"
                          title={
                            <div className="flex items-center gap-2">
                              <LayoutGrid size={16} />
                              <span>Vista de Cards</span>
                            </div>
                          }
                        />
                        <Tab
                          key="table"
                          title={
                            <div className="flex items-center gap-2">
                              <List size={16} />
                              <span>Vista de Tabla</span>
                            </div>
                          }
                        />
                      </Tabs>
                    </div>

                    {/* Lista de recursos */}
                    <ScrollShadow className="flex-1 p-4">
                      {filteredResources.length === 0 ? (
                        <div className="text-center py-12 text-default-400">
                          <p>No se encontraron recursos</p>
                        </div>
                      ) : viewMode === 'table' ? (
                        /* Vista de Tabla */
                        <>
                          {selectedCategory === 'Hotel' && (
                            <Table aria-label="Hoteles disponibles" removeWrapper>
                              <TableHeader>
                                <TableColumn>HOTEL</TableColumn>
                                <TableColumn>DESTINO</TableColumn>
                                <TableColumn>HABITACIONES</TableColumn>
                              </TableHeader>
                              <TableBody>
                                {filteredResources.map((resource: any) => (
                                  <TableRow 
                                    key={resource._id}
                                    className="cursor-pointer"
                                    onClick={() => handleResourceSelect(resource)}
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-default-100">
                                          {resource.photos?.[0] ? (
                                            <Image
                                              src={resource.photos[0]}
                                              alt={resource.name}
                                              fill
                                              className="object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <HotelIcon size={18} className="text-default-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div className="font-semibold text-sm">{resource.name}</div>
                                          <div className="flex items-center gap-1 mt-0.5">
                                            {[...Array(resource.stars || 0)].map((_, i) => (
                                              <Star key={i} size={12} className="fill-warning text-warning" />
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                          <MapPin size={14} className="text-primary flex-shrink-0" />
                                          <span>{resource.location?.city || 'N/A'}</span>
                                        </div>
                                        <div className="text-xs text-default-500 pl-5">
                                          {resource.location?.country || 'N/A'}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Chip size="sm" variant="flat" color="primary">
                                        {resource.roomTypes?.length || 0} tipo{resource.roomTypes?.length !== 1 ? 's' : ''}
                                      </Chip>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}

                          {selectedCategory === 'Flight' && (
                            <Table aria-label="Vuelos disponibles" removeWrapper>
                              <TableHeader>
                                <TableColumn>AEROLÍNEA</TableColumn>
                                <TableColumn>VUELO</TableColumn>
                                <TableColumn>RUTA</TableColumn>
                                <TableColumn>ESCALAS</TableColumn>
                              </TableHeader>
                              <TableBody>
                                {filteredResources.map((resource: any) => (
                                  <TableRow 
                                    key={resource._id}
                                    className="cursor-pointer"
                                    onClick={() => handleResourceSelect(resource)}
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {resource.airline?.logoUrl ? (
                                          <Avatar src={resource.airline.logoUrl} size="sm" />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Plane size={14} className="text-primary" />
                                          </div>
                                        )}
                                        <span className="font-semibold">{resource.airline?.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-mono text-sm">{resource.flightNumber}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        <span className="font-semibold">{resource.departure?.city}</span>
                                        <span className="mx-2 text-default-400">→</span>
                                        <span className="font-semibold">{resource.arrival?.city}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Chip size="sm" color={resource.stops === 0 ? 'success' : 'default'} variant="flat">
                                        {resource.stops === 0 ? 'Directo' : `${resource.stops} escala${resource.stops > 1 ? 's' : ''}`}
                                      </Chip>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}

                          {selectedCategory === 'Transport' && (
                            <Table aria-label="Transportes disponibles" removeWrapper>
                              <TableHeader>
                                <TableColumn>NOMBRE</TableColumn>
                                <TableColumn>TIPO</TableColumn>
                                <TableColumn>RUTA</TableColumn>
                                <TableColumn>CAPACIDAD</TableColumn>
                              </TableHeader>
                              <TableBody>
                                {filteredResources.map((resource: any) => (
                                  <TableRow 
                                    key={resource._id}
                                    className="cursor-pointer"
                                    onClick={() => handleResourceSelect(resource)}
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                          <Bus size={16} className="text-primary" />
                                        </div>
                                        <span className="font-semibold">{resource.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm capitalize">{resource.type?.replace('_', ' ')}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        <span className="font-semibold">{resource.route?.origin?.city}</span>
                                        <span className="mx-2 text-default-400">→</span>
                                        <span className="font-semibold">{resource.route?.destination?.city}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1 text-sm">
                                        <Users size={14} className="text-default-400" />
                                        <span>{resource.capacity?.passengers || 0}</span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </>
                      ) : (
                        /* Vista de Grid/Cards */
                        <div className="grid grid-cols-3 gap-3">
                          {filteredResources.map((resource: any) => (
                        <Card
                          key={resource._id}
                          isPressable
                          onPress={() => handleResourceSelect(resource)}
                          className="border-2 border-transparent hover:border-primary transition-all"
                        >
                          <CardBody className="p-4">
                            {selectedCategory === 'Hotel' && (
                              <div className="flex flex-col gap-3">
                                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-default-100">
                                  {resource.photos?.[0] ? (
                                    <Image
                                      src={resource.photos[0]}
                                      alt={resource.name}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <HotelIcon size={28} className="text-default-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-sm truncate">{resource.name}</h3>
                                  <div className="flex items-center gap-1 mt-1">
                                    {[...Array(resource.stars || 0)].map((_, i) => (
                                      <Star key={i} size={12} className="fill-warning text-warning" />
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-default-500 mt-2">
                                    <MapPin size={12} />
                                    <span className="truncate">{resource.location?.city}, {resource.location?.country}</span>
                                  </div>
                                  {resource.roomTypes && (
                                    <Chip size="sm" variant="flat" className="mt-2">
                                      {resource.roomTypes.length} tipos de habitación
                                    </Chip>
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedCategory === 'Flight' && (
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    {resource.airline?.logoUrl ? (
                                      <Avatar
                                        src={resource.airline.logoUrl}
                                        size="sm"
                                        className="flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Plane size={18} className="text-primary" />
                                      </div>
                                    )}
                                    <div>
                                      <h3 className="font-bold text-sm">{resource.airline?.name}</h3>
                                      <p className="text-xs text-default-500">{resource.flightNumber}</p>
                                    </div>
                                  </div>
                                  <Chip size="sm" color="primary" variant="flat">
                                    {resource.stops === 0 ? 'Directo' : `${resource.stops} escala${resource.stops > 1 ? 's' : ''}`}
                                  </Chip>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <div>
                                    <p className="font-semibold">{resource.departure?.airport}</p>
                                    <p className="text-default-500">{resource.departure?.city}</p>
                                  </div>
                                  <div className="flex-1 mx-4 border-t-2 border-dashed border-default-300 relative">
                                    <Plane size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary rotate-90" />
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{resource.arrival?.airport}</p>
                                    <p className="text-default-500">{resource.arrival?.city}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedCategory === 'Transport' && (
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Bus size={24} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-sm truncate">{resource.name}</h3>
                                  <p className="text-xs text-default-500 capitalize">{resource.type?.replace('_', ' ')}</p>
                                  <div className="space-y-1 mt-2 text-xs">
                                    <div className="flex items-center gap-2">
                                      <MapPin size={12} className="text-success flex-shrink-0" />
                                      <span className="truncate">{resource.route?.origin?.city}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin size={12} className="text-danger flex-shrink-0" />
                                      <span className="truncate">{resource.route?.destination?.city}</span>
                                    </div>
                                  </div>
                                  {resource.capacity && (
                                    <div className="flex items-center gap-2 text-xs text-default-500 mt-2">
                                      <Users size={12} />
                                      <span>{resource.capacity.passengers} pasajeros</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      ))}
                        </div>
                      )}
                    </ScrollShadow>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center space-y-3">
                      <div className="w-20 h-20 mx-auto rounded-full bg-default-100 flex items-center justify-center">
                        <Package2 size={32} className="text-default-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Selecciona un catálogo</h3>
                        <p className="text-sm text-default-500 mt-1">
                          Elige un tipo de recurso de la columna izquierda para comenzar
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: Configuración */}
          {step === 'configure' && (
            <ScrollShadow className="h-[600px] px-6 py-4">
              <div className="space-y-4">
                {/* BARRA HORIZONTAL CON LAS 3 SECCIONES */}
                <div className="bg-default-50 rounded-lg p-4">
                  <div className="flex items-start gap-6">
                    {/* SECCIÓN 1: Información del Recurso */}
                    <div className="flex flex-col gap-1.5 min-w-[220px]">
                      <div className="text-xs text-default-500 font-semibold uppercase">
                        {selectedCategory === 'Hotel' && 'Hotel'}
                        {selectedCategory === 'Flight' && 'Vuelo'}
                        {selectedCategory === 'Transport' && 'Transporte'}
                      </div>
                      <div className="font-bold text-sm">
                        {selectedCategory === 'Hotel' && selectedResource?.name}
                        {selectedCategory === 'Flight' && `${selectedResource?.airline?.name} - ${selectedResource?.flightNumber}`}
                        {selectedCategory === 'Transport' && selectedResource?.name}
                      </div>
                      {selectedCategory === 'Hotel' && selectedResource?.stars && (
                        <div className="flex items-center gap-1">
                          {[...Array(selectedResource.stars)].map((_, i) => (
                            <Star key={i} size={12} className="fill-warning text-warning" />
                          ))}
                        </div>
                      )}
                      {selectedCategory === 'Hotel' && selectedResource?.location && (
                        <div className="flex items-center gap-1 text-xs text-default-500">
                          <MapPin size={12} />
                          <span>{selectedResource.location.city}, {selectedResource.location.country}</span>
                        </div>
                      )}
                      {selectedCategory === 'Flight' && (
                        <div className="text-xs text-default-500">
                          {selectedResource?.departure?.city} → {selectedResource?.arrival?.city}
                        </div>
                      )}
                      {selectedCategory === 'Transport' && selectedResource?.route && (
                        <div className="text-xs text-default-500">
                          {selectedResource.route.origin?.city} → {selectedResource.route.destination?.city}
                        </div>
                      )}
                    </div>

                    <Divider orientation="vertical" className="h-20" />

                    {/* SECCIÓN 2: Inventario ID + Fecha + Nombre */}
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-default-500 font-semibold w-20">Código:</span>
                        <Input
                          value={inventoryCode}
                          onChange={(e) => setInventoryCode(e.target.value)}
                          placeholder="INV-HTL-2601-001"
                          size="sm"
                          className="flex-1 max-w-[180px]"
                          variant="bordered"
                          isDisabled={isCodeLocked}
                          classNames={{
                            input: isCodeLocked ? 'text-default-400' : ''
                          }}
                        />
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => setIsCodeLocked(!isCodeLocked)}
                          title={isCodeLocked ? 'Desbloquear para editar' : 'Bloquear'}
                          className="min-w-unit-6 w-6 h-6"
                        >
                          {isCodeLocked ? <Lock size={14} /> : <Unlock size={14} />}
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-default-500 font-semibold w-20">Fecha:</span>
                        <span className="text-sm">{new Date(creationDate).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-default-500 font-semibold w-20">Nombre:</span>
                        <Input
                          value={inventoryName}
                          onChange={(e) => setInventoryName(e.target.value)}
                          placeholder="Ej: Temporada Alta Verano"
                          size="sm"
                          className="flex-1"
                          variant="bordered"
                        />
                      </div>
                    </div>

                    <Divider orientation="vertical" className="h-20" />

                    {/* SECCIÓN 3: Proveedor */}
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      {selectedSupplier ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={selectedSupplier.logo}
                              name={(selectedSupplier.businessName || selectedSupplier.name)?.[0]}
                              className="w-10 h-10"
                              isBordered
                            />
                            <div className="flex-1 min-w-0">
                              <Chip size="sm" variant="flat" color="success" className="h-4 text-xs mb-1">Verificado</Chip>
                              <p className="font-bold text-xs truncate">{selectedSupplier.businessName || selectedSupplier.name}</p>
                              <p className="text-xs text-default-500 truncate">{selectedSupplier.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => {
                                const selector = document.querySelector('[data-open-supplier]')
                                if (selector) (selector as any).click()
                              }}
                              className="flex-1 h-7"
                              startContent={<Building2 size={14} />}
                            >
                              Cambiar
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="danger"
                              onPress={() => setSelectedSupplier(null)}
                              className="flex-1 h-7"
                              startContent={<X size={14} />}
                            >
                              Quitar
                            </Button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            const selector = document.querySelector('[data-open-supplier]')
                            if (selector) (selector as any).click()
                          }}
                          className="w-full min-h-[100px] border-2 border-dashed border-default-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-default-400 hover:text-primary"
                        >
                          <Building2 size={20} />
                          <span className="text-xs font-medium">Proveedor</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Componente oculto para abrir modal de proveedor */}
                <div className="hidden">
                  <SupplierSelector
                    selectedSupplier={selectedSupplier}
                    suppliers={suppliers || []}
                    onSupplierSelect={setSelectedSupplier}
                    onSupplierRemove={() => setSelectedSupplier(null)}
                  />
                </div>

                {/* Configuración específica por tipo */}
                {selectedCategory === 'Hotel' && selectedResource?.roomTypes && (
                  <HotelInventoryForm
                    hotel={selectedResource}
                    roomConfigs={roomConfigs}
                    onRoomConfigChange={setRoomConfigs}
                    pricingMode={pricingMode}
                    onPricingModeChange={setPricingMode}
                  />
                )}

                {selectedCategory === 'Flight' && (
                  <FlightInventoryForm
                    flightConfig={flightConfig}
                    onConfigChange={setFlightConfig}
                  />
                )}

                {selectedCategory === 'Transport' && (
                  <TransportInventoryForm
                    transportConfig={transportConfig}
                    onConfigChange={setTransportConfig}
                  />
                )}
              </div>
            </ScrollShadow>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="light"
            onPress={handleClose}
            isDisabled={isLoading}
          >
            Cancelar
          </Button>
          {step === 'configure' && (
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isLoading}
              size="lg"
            >
              {item ? 'Actualizar Inventario' : 'Agregar a Inventario'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
