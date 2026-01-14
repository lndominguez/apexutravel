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
  Divider,
  Switch
} from '@heroui/react'
import {
  X,
  Plus,
  Trash2,
  Upload,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Image as ImageIcon,
  Plane,
  Hotel,
  Bus,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useFlights, useHotels, useTransports } from '@/swr'
import HotelSelectionModal from './HotelSelectionModal'
import FlightSelectionModal from './FlightSelectionModal'
import TransportSelectionModal from './TransportSelectionModal'

interface PackageFormData {
  name: string
  description: string
  destination: {
    city: string
    state: string
    country: string
  }
  duration: {
    days: number
    nights: number
  }
  category: string

  // Componentes del paquete (OPCIONAL)
  components: {
    hotel?: {
      inventoryId: string // ID del item de inventario
      hotel: string // ID del hotel
      supplier: string // ID del proveedor
      roomType: string
      plan: string
      nights: number
      costPrice: number
      sellingPrice: number
    }
    outboundFlight?: {
      inventoryId: string // ID del item de inventario
      flight: string // ID del vuelo de ida
      supplier: string // ID del proveedor
      class: string
      pricing: {
        adult: { cost: number; sellingPrice: number }
        child: { cost: number; sellingPrice: number }
        infant: { cost: number; sellingPrice: number }
      }
    }
    returnFlight?: {
      inventoryId: string // ID del item de inventario
      flight: string // ID del vuelo de vuelta
      supplier: string // ID del proveedor
      class: string
      pricing: {
        adult: { cost: number; sellingPrice: number }
        child: { cost: number; sellingPrice: number }
        infant: { cost: number; sellingPrice: number }
      }
    }
    transports: Array<{
      inventoryId: string // ID del item de inventario
      transport: string // ID del transporte
      supplier: string // ID del proveedor
      serviceType: string
      description: string
      costPrice: number
      sellingPrice: number
    }>
    activities: Array<{
      name: string
      description: string
      duration: string
      included: boolean
      costPrice: number
      sellingPrice: number
    }>
  }

  // Inclusiones y exclusiones
  included: string[]
  notIncluded: string[]

  // Itinerario
  itinerary: Array<{
    day: number
    title: string
    description: string
  }>

  // PRECIOS MOVIDOS AL INVENTARIO
  // Los precios ahora se manejan mediante items de inventario
  // Markup opcional sobre el total de componentes
  markup?: number

  // Disponibilidad
  availability: {
    startDate: string
    endDate: string
    minPeople: number
    maxPeople: number
  }

  // Imágenes
  images: string[]

  // Features
  features: {
    hotelStars: number
    includesFlights: boolean
    includesTransfers: boolean
    wifi: boolean
    allInclusive: boolean
    kidsClub: boolean
    spa: boolean
    pool: boolean
    privateBeach: boolean
    gym: boolean
    golf: boolean
    snorkelEquipment: boolean
    roomType: string
    amenities: string[]
  }

  featured: boolean
  tags: string[]
  status: 'draft' | 'active' | 'inactive'
}

interface PackageFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  packageData?: any
  isLoading?: boolean
}

const CATEGORIES = [
  { key: 'beach', label: 'Playa' },
  { key: 'adventure', label: 'Aventura' },
  { key: 'culture', label: 'Cultura' },
  { key: 'romance', label: 'Romance' },
  { key: 'family', label: 'Familia' },
  { key: 'luxury', label: 'Lujo' },
  { key: 'eco', label: 'Ecológico' },
  { key: 'city', label: 'Ciudad' }
]

const AMENITIES = [
  'pool', 'spa', 'gym', 'beach', 'wifi', 'restaurant',
  'bar', 'kids-club', 'water-sports', 'golf', 'tennis',
  'entertainment', 'room-service', 'concierge'
]

export default function PackageFormModal({
  isOpen,
  onClose,
  onSubmit,
  packageData,
  isLoading = false
}: PackageFormModalProps) {
  const { flights } = useFlights({ status: 'available' })
  const { hotels } = useHotels({ status: 'active' })
  const { transports } = useTransports({ status: 'active' })

  const [activeTab, setActiveTab] = useState('basic')
  const [newInclusion, setNewInclusion] = useState('')
  const [newExclusion, setNewExclusion] = useState('')
  const [newTag, setNewTag] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  
  // Estados para modales de selección
  const [showHotelModal, setShowHotelModal] = useState(false)
  const [showOutboundFlightModal, setShowOutboundFlightModal] = useState(false)
  const [showReturnFlightModal, setShowReturnFlightModal] = useState(false)
  const [showTransportModal, setShowTransportModal] = useState(false)

  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    description: '',
    destination: {
      city: '',
      state: '',
      country: 'México'
    },
    duration: {
      days: 5,
      nights: 4
    },
    category: 'beach',
    components: {
      hotel: undefined,
      outboundFlight: undefined,
      returnFlight: undefined,
      transports: [],
      activities: []
    },
    included: [],
    notIncluded: [],
    itinerary: [],
    markup: 0,
    availability: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minPeople: 2,
      maxPeople: 10
    },
    images: [],
    features: {
      hotelStars: 4,
      includesFlights: true,
      includesTransfers: true,
      wifi: true,
      allInclusive: false,
      kidsClub: false,
      spa: false,
      pool: true,
      privateBeach: false,
      gym: false,
      golf: false,
      snorkelEquipment: false,
      roomType: 'standard',
      amenities: []
    },
    featured: false,
    tags: [],
    status: 'draft'
  })

  // Cargar datos del paquete si existe
  useEffect(() => {
    if (packageData && isOpen) {
      setFormData({
        name: packageData.name || '',
        description: packageData.description || '',
        destination: packageData.destination || { city: '', state: '', country: 'México' },
        duration: packageData.duration || { days: 5, nights: 4 },
        category: packageData.category || 'beach',
        components: {
          hotel: packageData.components?.hotel || undefined,
          outboundFlight: packageData.components?.outboundFlight || undefined,
          returnFlight: packageData.components?.returnFlight || undefined,
          transports: packageData.components?.transports || [],
          activities: packageData.components?.activities || []
        },
        included: packageData.included || [],
        notIncluded: packageData.notIncluded || [],
        itinerary: packageData.itinerary || [],
        markup: packageData.markup || 0,
        availability: packageData.availability || {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          minPeople: 2,
          maxPeople: 10
        },
        images: packageData.images || [],
        features: {
          hotelStars: packageData.features?.hotelStars || 4,
          includesFlights: packageData.features?.includesFlights ?? true,
          includesTransfers: packageData.features?.includesTransfers ?? true,
          wifi: packageData.features?.wifi ?? true,
          allInclusive: packageData.features?.allInclusive ?? false,
          kidsClub: packageData.features?.kidsClub ?? false,
          spa: packageData.features?.spa ?? false,
          pool: packageData.features?.pool ?? true,
          privateBeach: packageData.features?.privateBeach ?? false,
          gym: packageData.features?.gym ?? false,
          golf: packageData.features?.golf ?? false,
          snorkelEquipment: packageData.features?.snorkelEquipment ?? false,
          roomType: packageData.features?.roomType || 'standard',
          amenities: packageData.features?.amenities || []
        },
        featured: packageData.featured || false,
        tags: packageData.tags || [],
        status: packageData.status || 'draft'
      })
    }
  }, [packageData, isOpen])

  const handleSubmit = async () => {
    // Normalizar texto para búsquedas
    const normalizeText = (text: string) => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    }

    const submitData = {
      ...formData,
      destination: {
        ...formData.destination,
        cityNormalized: normalizeText(formData.destination.city),
        countryNormalized: normalizeText(formData.destination.country)
      }
    }

    console.log('📦 Datos a enviar:', JSON.stringify(submitData, null, 2))
    await onSubmit(submitData)
  }

  // Funciones para inclusiones
  const addInclusion = () => {
    if (newInclusion.trim()) {
      setFormData({
        ...formData,
        included: [...formData.included, newInclusion.trim()]
      })
      setNewInclusion('')
    }
  }

  const removeInclusion = (index: number) => {
    setFormData({
      ...formData,
      included: formData.included.filter((_, i) => i !== index)
    })
  }

  // Funciones para exclusiones
  const addExclusion = () => {
    if (newExclusion.trim()) {
      setFormData({
        ...formData,
        notIncluded: [...formData.notIncluded, newExclusion.trim()]
      })
      setNewExclusion('')
    }
  }

  const removeExclusion = (index: number) => {
    setFormData({
      ...formData,
      notIncluded: formData.notIncluded.filter((_, i) => i !== index)
    })
  }

  // Funciones para itinerario
  const addItineraryDay = () => {
    const nextDay = formData.itinerary.length + 1
    setFormData({
      ...formData,
      itinerary: [
        ...formData.itinerary,
        {
          day: nextDay,
          title: `Día ${nextDay}`,
          description: ''
        }
      ]
    })
  }

  const updateItineraryDay = (index: number, field: string, value: any) => {
    const updated = [...formData.itinerary]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, itinerary: updated })
  }

  const removeItineraryDay = (index: number) => {
    const updated = formData.itinerary.filter((_, i) => i !== index)
    // Renumerar días
    const renumbered = updated.map((item, i) => ({ ...item, day: i + 1 }))
    setFormData({ ...formData, itinerary: renumbered })
  }

  // Funciones para tags
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      })
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  // ========================================
  // FUNCIONES PARA COMPONENTES DEL PAQUETE
  // ========================================

  // Hotel (solo 1)
  const addHotelFromModal = (inventoryData: any) => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        hotel: {
          inventoryId: inventoryData.inventoryId,
          hotel: inventoryData.hotel._id,
          supplier: inventoryData.supplier._id,
          roomType: inventoryData.roomType,
          plan: inventoryData.plan,
          nights: inventoryData.nights,
          costPrice: inventoryData.costPrice,
          sellingPrice: inventoryData.sellingPrice
        }
      }
    })
  }

  const removeHotel = () => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        hotel: undefined
      }
    })
  }


  // Vuelos (ida y vuelta separados)
  const addOutboundFlightFromModal = (inventoryData: any) => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        outboundFlight: {
          inventoryId: inventoryData.inventoryId,
          flight: inventoryData.flight._id,
          supplier: inventoryData.supplier._id,
          class: inventoryData.class,
          pricing: inventoryData.pricing
        }
      }
    })
  }

  const addReturnFlightFromModal = (inventoryData: any) => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        returnFlight: {
          inventoryId: inventoryData.inventoryId,
          flight: inventoryData.flight._id,
          supplier: inventoryData.supplier._id,
          class: inventoryData.class,
          pricing: inventoryData.pricing
        }
      }
    })
  }

  const removeOutboundFlight = () => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        outboundFlight: undefined
      }
    })
  }

  const removeReturnFlight = () => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        returnFlight: undefined
      }
    })
  }


  // Transporte
  const addTransportFromModal = (inventoryData: any) => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        transports: [...formData.components.transports, {
          inventoryId: inventoryData.inventoryId,
          transport: inventoryData.transport._id,
          supplier: inventoryData.supplier._id,
          serviceType: inventoryData.serviceType,
          description: inventoryData.description,
          costPrice: inventoryData.costPrice,
          sellingPrice: inventoryData.sellingPrice
        }]
      }
    })
  }

  const updateTransport = (index: number, field: string, value: any) => {
    const updated = [...formData.components.transports]
    updated[index] = { ...updated[index], [field]: value }
    
    // Nota: Los transportes ahora vienen del inventario, no se actualizan directamente
    // La actualización manual se hace solo para campos editables como description
    
    setFormData({ ...formData, components: { ...formData.components, transports: updated } })
  }

  const removeTransport = (index: number) => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        transports: formData.components.transports.filter((_, i) => i !== index)
      }
    })
  }

  // Actividades
  const addActivity = () => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        activities: [
          ...formData.components.activities,
          {
            name: '',
            description: '',
            duration: '2 horas',
            included: true,
            costPrice: 0,
            sellingPrice: 0
          }
        ]
      }
    })
  }

  const updateActivity = (index: number, field: string, value: any) => {
    const updated = [...formData.components.activities]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, components: { ...formData.components, activities: updated } })
  }

  const removeActivity = (index: number) => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        activities: formData.components.activities.filter((_, i) => i !== index)
      }
    })
  }

  // Calcular totales de componentes
  const calculateComponentsTotals = () => {
    const hotelCost = formData.components.hotel 
      ? formData.components.hotel.costPrice * formData.components.hotel.nights 
      : 0
    const hotelSelling = formData.components.hotel 
      ? formData.components.hotel.sellingPrice * formData.components.hotel.nights 
      : 0
    
    // Vuelos: usar precio de adulto como base (se puede ajustar según necesidad)
    const outboundCost = formData.components.outboundFlight?.pricing.adult.cost || 0
    const outboundSelling = formData.components.outboundFlight?.pricing.adult.sellingPrice || 0
    
    const returnCost = formData.components.returnFlight?.pricing.adult.cost || 0
    const returnSelling = formData.components.returnFlight?.pricing.adult.sellingPrice || 0
    
    const transportsCost = formData.components.transports.reduce((sum, t) => sum + t.costPrice, 0)
    const transportsSelling = formData.components.transports.reduce((sum, t) => sum + t.sellingPrice, 0)
    
    const activitiesCost = formData.components.activities.reduce((sum, a) => sum + a.costPrice, 0)
    const activitiesSelling = formData.components.activities.reduce((sum, a) => sum + a.sellingPrice, 0)
    
    const subtotalCost = hotelCost + outboundCost + returnCost + transportsCost + activitiesCost
    const subtotalSelling = hotelSelling + outboundSelling + returnSelling + transportsSelling + activitiesSelling
    
    // Aplicar markup del paquete sobre el precio de venta
    const markup = formData.markup || 0
    const markupAmount = (subtotalSelling * markup) / 100
    const totalCost = subtotalCost
    const totalSelling = subtotalSelling + markupAmount
    const totalProfit = totalSelling - totalCost
    const profitMargin = totalCost > 0 ? ((totalProfit / totalCost) * 100) : 0
    
    return { 
      subtotalCost, 
      subtotalSelling, 
      markupAmount, 
      totalCost, 
      totalSelling, 
      totalProfit, 
      profitMargin 
    }
  }

  // Funciones para imágenes
  const addImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl.trim()]
      })
      setNewImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    })
  }

  // Toggle amenity
  const toggleAmenity = (amenity: string) => {
    const amenities = formData.features.amenities.includes(amenity)
      ? formData.features.amenities.filter(a => a !== amenity)
      : [...formData.features.amenities, amenity]

    setFormData({
      ...formData,
      features: { ...formData.features, amenities }
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">
            {packageData ? 'Editar Paquete' : 'Crear Nuevo Paquete'}
          </h2>
          {formData.name && (
            <p className="text-sm text-gray-600">{formData.name}</p>
          )}
        </ModalHeader>

        <ModalBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            variant="underlined"
            
          >
            {/* TAB 1: INFORMACIÓN BÁSICA */}
            <Tab key="basic" title="Información Básica">
              <div className="space-y-4 py-4">
                {/* Fila 1: Nombre, Categoría, Estado */}
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    size="sm"
                    label="Nombre del Paquete"
                    placeholder="Ej: Cancún Todo Incluido"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isRequired
                  />
                  <Select
                    size="sm"
                    label="Categoría"
                    selectedKeys={[formData.category]}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    isRequired
                  >
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.key}>{cat.label}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    size="sm"
                    label="Estado"
                    selectedKeys={[formData.status]}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <SelectItem key="draft">Borrador</SelectItem>
                    <SelectItem key="active">Activo</SelectItem>
                    <SelectItem key="inactive">Inactivo</SelectItem>
                  </Select>
                </div>

                {/* Fila 2: Descripción */}
                <Textarea
                  size="sm"
                  label="Descripción"
                  placeholder="Describe el paquete turístico..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  minRows={3}
                  isRequired
                />

                {/* Fila 3: Destino (Ciudad, Estado, País) */}
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    size="sm"
                    label="Ciudad"
                    placeholder="Ej: Cancún"
                    value={formData.destination.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      destination: { ...formData.destination, city: e.target.value }
                    })}
                    isRequired
                  />
                  <Input
                    size="sm"
                    label="Estado"
                    placeholder="Ej: Quintana Roo"
                    value={formData.destination.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      destination: { ...formData.destination, state: e.target.value }
                    })}
                    isRequired
                  />
                  <Input
                    size="sm"
                    label="País"
                    placeholder="Ej: México"
                    value={formData.destination.country}
                    onChange={(e) => setFormData({
                      ...formData,
                      destination: { ...formData.destination, country: e.target.value }
                    })}
                    isRequired
                  />
                </div>

                {/* Fila 4: Duración y Disponibilidad */}
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    size="sm"
                    type="number"
                    label="Días"
                    value={formData.duration.days.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      duration: { ...formData.duration, days: parseInt(e.target.value) || 0 }
                    })}
                    min="1"
                    isRequired
                  />
                  <Input
                    size="sm"
                    type="number"
                    label="Noches"
                    value={formData.duration.nights.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      duration: { ...formData.duration, nights: parseInt(e.target.value) || 0 }
                    })}
                    min="0"
                    isRequired
                  />
                  <div className="flex items-center pt-6">
                    <Switch
                      size="sm"
                      isSelected={formData.featured}
                      onValueChange={(value) => setFormData({ ...formData, featured: value })}
                    >
                      <span className="text-xs">Destacado</span>
                    </Switch>
                  </div>
                </div>

                {/* Fila 5: Fechas y Markup */}
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    size="sm"
                    type="date"
                    label="Fecha Inicio"
                    value={formData.availability.startDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      availability: { ...formData.availability, startDate: e.target.value }
                    })}
                    isRequired
                  />
                  <Input
                    size="sm"
                    type="date"
                    label="Fecha Fin"
                    value={formData.availability.endDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      availability: { ...formData.availability, endDate: e.target.value }
                    })}
                    isRequired
                  />
                  <Input
                    size="sm"
                    type="number"
                    label="Markup (%)"
                    placeholder="0"
                    value={formData.markup?.toString() || '0'}
                    onChange={(e) => setFormData({
                      ...formData,
                      markup: parseFloat(e.target.value) || 0
                    })}
                    min="0"
                    max="100"
                    step="1"
                    description="Ganancia adicional sobre componentes"
                    startContent={<DollarSign size={14} className="text-gray-400" />}
                  />
                </div>

                {/* Fila 6: Min/Max Personas */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    size="sm"
                    type="number"
                    label="Mínimo de Personas"
                    value={formData.availability.minPeople.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      availability: { ...formData.availability, minPeople: parseInt(e.target.value) || 1 }
                    })}
                    min="1"
                  />
                  <Input
                    size="sm"
                    type="number"
                    label="Máximo de Personas"
                    value={formData.availability.maxPeople.toString()}
                    onChange={(e) => setFormData({
                      ...formData,
                      availability: { ...formData.availability, maxPeople: parseInt(e.target.value) || 1 }
                    })}
                    min="1"
                  />
                </div>
              </div>
            </Tab>

            {/* TAB 2: COMPONENTES DEL PAQUETE */}
            <Tab key="components" title="Componentes">
              <div className="space-y-4 py-4">
                {/* Botones de agregar componentes */}
                <div className="grid grid-cols-5 gap-3">
                  <Card 
                    isPressable
                    onPress={() => setShowHotelModal(true)}
                    isDisabled={!!formData.components.hotel}
                    className="hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <CardBody className="flex flex-col items-center justify-center py-6">
                      <Hotel size={40} className={formData.components.hotel ? "text-success mb-2" : "text-primary mb-2"} />
                      <p className="text-sm font-semibold">Hotel</p>
                      <p className="text-xs text-gray-500">{formData.components.hotel ? '✓ Agregado' : 'Agregar'}</p>
                    </CardBody>
                  </Card>

                  <Card 
                    isPressable
                    onPress={() => setShowOutboundFlightModal(true)}
                    isDisabled={!!formData.components.outboundFlight}
                    className="hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <CardBody className="flex flex-col items-center justify-center py-6">
                      <Plane size={40} className={formData.components.outboundFlight ? "text-success mb-2" : "text-primary mb-2"} />
                      <p className="text-sm font-semibold">Vuelo Ida</p>
                      <p className="text-xs text-gray-500">{formData.components.outboundFlight ? '✓ Agregado' : 'Agregar'}</p>
                    </CardBody>
                  </Card>

                  <Card 
                    isPressable
                    onPress={() => setShowReturnFlightModal(true)}
                    isDisabled={!!formData.components.returnFlight}
                    className="hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <CardBody className="flex flex-col items-center justify-center py-6">
                      <Plane size={40} className={formData.components.returnFlight ? "text-success mb-2 rotate-180" : "text-primary mb-2 rotate-180"} />
                      <p className="text-sm font-semibold">Vuelo Vuelta</p>
                      <p className="text-xs text-gray-500">{formData.components.returnFlight ? '✓ Agregado' : 'Agregar'}</p>
                    </CardBody>
                  </Card>

                  <Card 
                    isPressable
                    onPress={() => setShowTransportModal(true)}
                    className="hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <CardBody className="flex flex-col items-center justify-center py-6">
                      <Bus size={40} className="text-primary mb-2" />
                      <p className="text-sm font-semibold">Transporte</p>
                      <p className="text-xs text-gray-500">{formData.components.transports.length} agregados</p>
                    </CardBody>
                  </Card>

                  <Card 
                    isPressable
                    onPress={addActivity}
                    className="hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <CardBody className="flex flex-col items-center justify-center py-6">
                      <Calendar size={40} className="text-primary mb-2" />
                      <p className="text-sm font-semibold">Actividad</p>
                      <p className="text-xs text-gray-500">{formData.components.activities.length} agregadas</p>
                    </CardBody>
                  </Card>
                </div>

                <Divider />

                {/* Items seleccionados */}
                <div className="space-y-3">
                  {/* Hotel seleccionado */}
                  {formData.components.hotel && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Hotel size={16} className="text-primary" />
                        Hotel del Paquete
                      </h3>
                      <Card className="border-l-4 border-l-primary">
                        <CardBody className="p-3">
                          <div className="flex items-center gap-3">
                            {hotels?.find((h: any) => h._id === formData.components.hotel?.hotel)?.images?.[0] && (
                              <img
                                src={hotels.find((h: any) => h._id === formData.components.hotel?.hotel)?.images[0]}
                                alt="Hotel"
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{hotels?.find((h: any) => h._id === formData.components.hotel?.hotel)?.name || 'Hotel'}</h4>
                              <p className="text-xs text-gray-600">
                                {formData.components.hotel.roomType} - {formData.components.hotel.plan === 'room_only' ? 'Solo Hab.' :
                                 formData.components.hotel.plan === 'breakfast' ? 'Desayuno' :
                                 formData.components.hotel.plan === 'all_inclusive' ? 'Todo Incluido' : formData.components.hotel.plan}
                              </p>
                              <p className="text-xs text-gray-500">{formData.components.hotel.nights} noches</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">${(formData.components.hotel.sellingPrice * formData.components.hotel.nights).toFixed(2)}</p>
                              <p className="text-xs text-gray-500">Costo: ${(formData.components.hotel.costPrice * formData.components.hotel.nights).toFixed(2)}</p>
                            </div>
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              isIconOnly
                              onPress={removeHotel}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  )}

                  {/* Vuelos seleccionados */}
                  {(formData.components.outboundFlight || formData.components.returnFlight) && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Plane size={16} className="text-primary" />
                        Vuelos del Paquete
                      </h3>
                      <div className="space-y-2">
                        {formData.components.outboundFlight && (
                          <Card className="border-l-4 border-l-primary">
                            <CardBody className="p-3">
                              <div className="flex items-center gap-3">
                                {flights?.find((f: any) => f._id === formData.components.outboundFlight?.flight)?.airline?.logoUrl && (
                                  <img
                                    src={flights.find((f: any) => f._id === formData.components.outboundFlight?.flight)?.airline?.logoUrl}
                                    alt="Aerolínea"
                                    className="w-12 h-12 object-contain"
                                  />
                                )}
                                <div className="flex-1">
                                  <Chip size="sm" color="primary" variant="flat" className="mb-1">Vuelo de Ida</Chip>
                                  <h4 className="font-semibold text-sm">
                                    {flights?.find((f: any) => f._id === formData.components.outboundFlight?.flight)?.airline?.name || 'Aerolínea'} - 
                                    {flights?.find((f: any) => f._id === formData.components.outboundFlight?.flight)?.flightNumber}
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    {flights?.find((f: any) => f._id === formData.components.outboundFlight?.flight)?.departure?.city} → 
                                    {flights?.find((f: any) => f._id === formData.components.outboundFlight?.flight)?.arrival?.city}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formData.components.outboundFlight.class === 'economy' ? 'Económica' : 
                                     formData.components.outboundFlight.class === 'business' ? 'Business' : formData.components.outboundFlight.class}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 mb-1">Precio Adulto</p>
                                  <p className="text-lg font-bold text-primary">${formData.components.outboundFlight.pricing.adult.sellingPrice.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">Costo: ${formData.components.outboundFlight.pricing.adult.cost.toFixed(2)}</p>
                                </div>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  isIconOnly
                                  onPress={removeOutboundFlight}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        )}

                        {formData.components.returnFlight && (
                          <Card className="border-l-4 border-l-success">
                            <CardBody className="p-3">
                              <div className="flex items-center gap-3">
                                {flights?.find((f: any) => f._id === formData.components.returnFlight?.flight)?.airline?.logoUrl && (
                                  <img
                                    src={flights.find((f: any) => f._id === formData.components.returnFlight?.flight)?.airline?.logoUrl}
                                    alt="Aerolínea"
                                    className="w-12 h-12 object-contain"
                                  />
                                )}
                                <div className="flex-1">
                                  <Chip size="sm" color="success" variant="flat" className="mb-1">Vuelo de Vuelta</Chip>
                                  <h4 className="font-semibold text-sm">
                                    {flights?.find((f: any) => f._id === formData.components.returnFlight?.flight)?.airline?.name || 'Aerolínea'} - 
                                    {flights?.find((f: any) => f._id === formData.components.returnFlight?.flight)?.flightNumber}
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    {flights?.find((f: any) => f._id === formData.components.returnFlight?.flight)?.departure?.city} → 
                                    {flights?.find((f: any) => f._id === formData.components.returnFlight?.flight)?.arrival?.city}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formData.components.returnFlight.class === 'economy' ? 'Económica' : 
                                     formData.components.returnFlight.class === 'business' ? 'Business' : formData.components.returnFlight.class}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 mb-1">Precio Adulto</p>
                                  <p className="text-lg font-bold text-primary">${formData.components.returnFlight.pricing.adult.sellingPrice.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">Costo: ${formData.components.returnFlight.pricing.adult.cost.toFixed(2)}</p>
                                </div>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  isIconOnly
                                  onPress={removeReturnFlight}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transportes seleccionados */}
                  {formData.components.transports.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Bus size={16} className="text-primary" />
                        Transportes Seleccionados
                      </h3>
                      <div className="space-y-2">
                        {formData.components.transports.map((transport, index) => {
                          const selectedTransport = transports?.find((t: any) => t._id === transport.transport)
                          return (
                            <Card key={index} className="border-l-4 border-l-primary">
                              <CardBody className="p-3">
                                <div className="flex items-center gap-3">
                                  {selectedTransport?.images?.[0] && (
                                    <img
                                      src={selectedTransport.images[0]}
                                      alt={selectedTransport.name}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-sm">{selectedTransport?.name || 'Transporte'}</h4>
                                    <p className="text-xs text-gray-600">{transport.description}</p>
                                    <p className="text-xs text-gray-500">
                                      {selectedTransport?.route?.origin?.city} → {selectedTransport?.route?.destination?.city}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-primary">${transport.sellingPrice.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">Costo: ${transport.costPrice.toFixed(2)}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    isIconOnly
                                    onPress={() => removeTransport(index)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </CardBody>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actividades seleccionadas */}
                  {formData.components.activities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        Actividades Seleccionadas
                      </h3>
                      <div className="space-y-2">
                        {formData.components.activities.map((activity, index) => (
                          <Card key={index} className="border-l-4 border-l-primary">
                            <CardBody className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                                  <Calendar size={24} className="text-primary" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm">{activity.name || 'Actividad'}</h4>
                                  <p className="text-xs text-gray-600">{activity.description}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Chip size="sm" variant="flat">{activity.duration}</Chip>
                                    {activity.included && (
                                      <Chip size="sm" color="success" variant="flat">Incluido</Chip>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary">${activity.sellingPrice.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">Costo: ${activity.costPrice.toFixed(2)}</p>
                                </div>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  isIconOnly
                                  onPress={() => removeActivity(index)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resumen de Precios Calculados */}
                  {(formData.components.hotel || formData.components.outboundFlight || formData.components.returnFlight || formData.components.transports.length > 0 || formData.components.activities.length > 0) && (
                    <Card className="bg-gradient-to-br from-primary/5 to-success/5 border-2 border-primary/20">
                      <CardBody className="p-4">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <DollarSign size={16} className="text-primary" />
                          Resumen de Precios (Calculado Automáticamente)
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal Costo:</span>
                            <span className="font-semibold">${calculateComponentsTotals().subtotalCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal Venta:</span>
                            <span className="font-semibold">${calculateComponentsTotals().subtotalSelling.toFixed(2)}</span>
                          </div>
                          
                          {(formData.markup || 0) > 0 && (
                            <>
                              <Divider />
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Markup ({formData.markup}%):</span>
                                <span className="font-semibold text-primary">+${calculateComponentsTotals().markupAmount.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          
                          <Divider />
                          <div className="flex justify-between text-base">
                            <span className="font-semibold">Total Costo:</span>
                            <span className="font-bold text-danger">${calculateComponentsTotals().totalCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-base">
                            <span className="font-semibold">Total Venta:</span>
                            <span className="font-bold text-primary">${calculateComponentsTotals().totalSelling.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-base">
                            <span className="font-semibold">Ganancia:</span>
                            <span className="font-bold text-success">${calculateComponentsTotals().totalProfit.toFixed(2)} ({calculateComponentsTotals().profitMargin.toFixed(1)}%)</span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </div>
            </Tab>

            {/* TAB 4: INCLUSIONES Y EXCLUSIONES */}
            <Tab key="inclusions" title="Incluye / No Incluye">
              <div className="space-y-4 py-4">
                {/* Inclusiones */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle size={16} className="text-success" />
                    Incluye
                  </h3>

                  <div className="flex gap-2 mb-2">
                    <Input
                      size="sm"
                      placeholder="Ej: Vuelo redondo desde Ciudad de México"
                      value={newInclusion}
                      onChange={(e) => setNewInclusion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addInclusion()}
                    />
                    <Button
                      size="sm"
                      color="success"
                      onPress={addInclusion}
                      isIconOnly
                    >
                      <Plus size={18} />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    {formData.included.map((item, index) => (
                      <Card key={index}>
                        <CardBody className="flex flex-row items-center justify-between py-2 px-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-success" />
                            <span className="text-xs">{item}</span>
                          </div>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => removeInclusion(index)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Exclusiones */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <XCircle size={16} className="text-danger" />
                    No Incluye
                  </h3>

                  <div className="flex gap-2 mb-2">
                    <Input
                      size="sm"
                      placeholder="Ej: Propinas"
                      value={newExclusion}
                      onChange={(e) => setNewExclusion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addExclusion()}
                    />
                    <Button
                      size="sm"
                      color="danger"
                      onPress={addExclusion}
                      isIconOnly
                    >
                      <Plus size={18} />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    {formData.notIncluded.map((item, index) => (
                      <Card key={index}>
                        <CardBody className="flex flex-row items-center justify-between py-2 px-3">
                          <div className="flex items-center gap-2">
                            <XCircle size={14} className="text-danger" />
                            <span className="text-xs">{item}</span>
                          </div>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => removeExclusion(index)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </Tab>

            {/* TAB 4: ITINERARIO */}
            <Tab key="itinerary" title="Itinerario">
              <div className="space-y-3 py-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold">Días del Viaje</h3>
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<Plus size={16} />}
                    onPress={addItineraryDay}
                  >
                    Agregar Día
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.itinerary.map((day, index) => (
                    <Card key={index}>
                      <CardBody className="space-y-2 p-3">
                        <div className="flex items-center justify-between">
                          <Chip size="sm" color="primary" variant="flat">
                            Día {day.day}
                          </Chip>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => removeItineraryDay(index)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>

                        <Input
                          size="sm"
                          label="Título"
                          placeholder="Ej: Llegada a Cancún"
                          value={day.title}
                          onChange={(e) => updateItineraryDay(index, 'title', e.target.value)}
                        />

                        <Textarea
                          size="sm"
                          label="Descripción"
                          placeholder="Describe las actividades del día..."
                          value={day.description}
                          onChange={(e) => updateItineraryDay(index, 'description', e.target.value)}
                          minRows={2}
                        />
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {formData.itinerary.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No hay días agregados al itinerario</p>
                  </div>
                )}
              </div>
            </Tab>

            {/* TAB 5: IMÁGENES */}
            <Tab key="images" title="Imágenes">
              <div className="space-y-3 py-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ImageIcon size={16} className="text-primary" />
                  Galería de Imágenes
                </h3>

                <div className="flex gap-2">
                  <Input
                    size="sm"
                    placeholder="URL de la imagen"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addImage()}
                    startContent={<Upload size={16} className="text-gray-400" />}
                  />
                  <Button
                    size="sm"
                    color="primary"
                    onPress={addImage}
                    isIconOnly
                  >
                    <Plus size={18} />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {formData.images.map((url, index) => (
                    <Card key={index} className="relative group">
                      <CardBody className="p-0">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          size="sm"
                          color="danger"
                          isIconOnly
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onPress={() => removeImage(index)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {formData.images.length === 0 && (
                  <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No hay imágenes agregadas</p>
                  </div>
                )}
              </div>
            </Tab>

            {/* TAB 6: CARACTERÍSTICAS */}
            <Tab key="features" title="Características">
              <div className="space-y-4 py-4">
                {/* Características principales */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Características Principales</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      size="sm"
                      type="number"
                      label="Estrellas del Hotel"
                      value={formData.features.hotelStars.toString()}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, hotelStars: parseInt(e.target.value) || 0 }
                      })}
                      min="1"
                      max="5"
                    />

                    <Select
                      size="sm"
                      label="Tipo de Habitación"
                      selectedKeys={[formData.features.roomType]}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, roomType: e.target.value }
                      })}
                    >
                      <SelectItem key="standard">Standard</SelectItem>
                      <SelectItem key="deluxe">Deluxe</SelectItem>
                      <SelectItem key="suite">Suite</SelectItem>
                      <SelectItem key="villa">Villa</SelectItem>
                    </Select>
                  </div>
                </div>

                {/* Switches de características */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Servicios Incluidos</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Switch
                      size="sm"
                      isSelected={formData.features.includesFlights}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, includesFlights: value }
                      })}
                    >
                      <span className="text-xs">Vuelos</span>
                    </Switch>

                    <Switch
                      size="sm"
                      isSelected={formData.features.includesTransfers}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, includesTransfers: value }
                      })}
                    >
                      <span className="text-xs">Traslados</span>
                    </Switch>

                    <Switch
                      size="sm"
                      isSelected={formData.features.wifi}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, wifi: value }
                      })}
                    >
                      <span className="text-xs">WiFi</span>
                    </Switch>

                    <Switch
                      size="sm"
                      isSelected={formData.features.allInclusive}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, allInclusive: value }
                      })}
                    >
                      <span className="text-xs">Todo Incluido</span>
                    </Switch>

                    <Switch
                      size="sm"
                      isSelected={formData.features.kidsClub}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, kidsClub: value }
                      })}
                    >
                      <span className="text-xs">Kids Club</span>
                    </Switch>

                    <Switch
                      size="sm"
                      isSelected={formData.features.spa}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, spa: value }
                      })}
                    >
                      <span className="text-xs">Spa</span>
                    </Switch>

                    <Switch
                      size="sm"
                      isSelected={formData.features.pool}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, pool: value }
                      })}
                    >
                      <span className="text-xs">Piscina</span>
                    </Switch>

                    <Switch
                      size="sm"
                      isSelected={formData.features.privateBeach}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, privateBeach: value }
                      })}
                    >
                      <span className="text-xs">Playa Privada</span>
                    </Switch>

                    <Switch
                      size="sm"
                      isSelected={formData.features.gym}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, gym: value }
                      })}
                    >
                      <span className="text-xs">Gimnasio</span>
                    </Switch>

                    <Switch
                      size="sm"
                      isSelected={formData.features.golf}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, golf: value }
                      })}
                    >
                      <span className="text-xs">Golf</span>
                    </Switch>

                    <Switch
                      size="sm"
                      isSelected={formData.features.snorkelEquipment}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, snorkelEquipment: value }
                      })}
                    >
                      <span className="text-xs">Snorkel</span>
                    </Switch>
                  </div>
                </div>

                {/* Amenidades */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Amenidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(amenity => (
                      <Chip
                        key={amenity}
                        size="sm"
                        color={formData.features.amenities.includes(amenity) ? 'primary' : 'default'}
                        variant={formData.features.amenities.includes(amenity) ? 'solid' : 'bordered'}
                        onClick={() => toggleAmenity(amenity)}
                        className="cursor-pointer text-xs"
                      >
                        {amenity}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </Tab>

            {/* TAB 7: TAGS */}
            <Tab key="tags" title="Tags">
              <div className="space-y-3 py-4">
                <h3 className="text-sm font-semibold mb-2">Etiquetas del Paquete</h3>

                <div className="flex gap-2">
                  <Input
                    size="sm"
                    placeholder="Ej: playa, familia, todo-incluido"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button
                    size="sm"
                    color="primary"
                    onPress={addTag}
                    isIconOnly
                  >
                    <Plus size={18} />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      size="sm"
                      onClose={() => removeTag(tag)}
                      variant="flat"
                      color="primary"
                      className="text-xs"
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>

                {formData.tags.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <p>No hay etiquetas agregadas</p>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>

        </ModalBody>

        <ModalFooter className="flex justify-between items-center">
          {/* Precio total del paquete - Lado izquierdo */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-primary/10 to-success/10 px-4 py-2 rounded-lg border border-primary/20">
            <div className="text-center">
              <p className="text-xs text-gray-600">Costo</p>
              <p className="text-lg font-bold text-gray-700">${calculateComponentsTotals().totalCost.toFixed(2)}</p>
            </div>
            <div className="w-px h-10 bg-gray-300"></div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Precio Venta</p>
              <p className="text-2xl font-bold text-primary">${calculateComponentsTotals().totalSelling.toFixed(2)}</p>
            </div>
            <div className="w-px h-10 bg-gray-300"></div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Ganancia</p>
              <p className="text-lg font-bold text-success">${calculateComponentsTotals().totalProfit.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Margen</p>
              <p className="text-lg font-bold text-success">{calculateComponentsTotals().profitMargin.toFixed(1)}%</p>
            </div>
          </div>

          {/* Botones - Lado derecho */}
          <div className="flex gap-2">
            <Button
              variant="light"
              onPress={onClose}
              isDisabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isLoading}
            >
              {packageData ? 'Actualizar Paquete' : 'Crear Paquete'}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>

      {/* Modales de selección - FUERA del Modal principal */}
      <HotelSelectionModal
        isOpen={showHotelModal}
        onClose={() => setShowHotelModal(false)}
        onSelect={addHotelFromModal}
        defaultNights={formData.duration.nights}
      />

      <FlightSelectionModal
        isOpen={showOutboundFlightModal}
        onClose={() => setShowOutboundFlightModal(false)}
        flightType="outbound"
        onSelect={addOutboundFlightFromModal}
      />

      <FlightSelectionModal
        isOpen={showReturnFlightModal}
        onClose={() => setShowReturnFlightModal(false)}
        flightType="return"
        onSelect={addReturnFlightFromModal}
      />

      <TransportSelectionModal
        isOpen={showTransportModal}
        onClose={() => setShowTransportModal(false)}
        onSelect={addTransportFromModal}
      />
    </Modal>
  )
}
