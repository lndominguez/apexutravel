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

  // Inclusiones y exclusiones
  included: string[]
  notIncluded: string[]

  // Itinerario
  itinerary: Array<{
    day: number
    title: string
    description: string
  }>

  // Precios por persona
  pricing: {
    costPerPerson: {
      double: number
      single: number
      triple: number
      child: number
    }
    basePricePerPerson?: {
      double: number
      single: number
      triple: number
      child: number
    }
    sellingPricePerPerson: {
      double: number
      single: number
      triple: number
      child: number
    }
    currency: string
    markup: number
  }

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
    included: [],
    notIncluded: [],
    itinerary: [],
    pricing: {
      costPerPerson: {
        double: 0,
        single: 0,
        triple: 0,
        child: 0
      },
      sellingPricePerPerson: {
        double: 0,
        single: 0,
        triple: 0,
        child: 0
      },
      currency: 'USD',
      markup: 40
    },
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
      // Merge profundo de pricing con valores por defecto
      const defaultPricing = {
        costPerPerson: { double: 0, single: 0, triple: 0, child: 0 },
        sellingPricePerPerson: { double: 0, single: 0, triple: 0, child: 0 },
        currency: 'USD',
        markup: 40
      }

      const mergedPricing = {
        ...defaultPricing,
        ...packageData.pricing,
        costPerPerson: {
          ...defaultPricing.costPerPerson,
          ...(packageData.pricing?.costPerPerson || {})
        },
        sellingPricePerPerson: {
          ...defaultPricing.sellingPricePerPerson,
          ...(packageData.pricing?.sellingPricePerPerson || {})
        }
      }

      setFormData({
        name: packageData.name || '',
        description: packageData.description || '',
        destination: packageData.destination || { city: '', state: '', country: 'México' },
        duration: packageData.duration || { days: 5, nights: 4 },
        category: packageData.category || 'beach',
        included: packageData.included || [],
        notIncluded: packageData.notIncluded || [],
        itinerary: packageData.itinerary || [],
        pricing: mergedPricing,
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
          <h2 className="text-2xl font-bold">
            {packageData ? 'Editar Paquete' : 'Crear Nuevo Paquete'}
          </h2>
          <p className="text-sm text-gray-500 font-normal">
            Completa toda la información del paquete turístico
          </p>
        </ModalHeader>

        <ModalBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            variant="underlined"
            
          >
            {/* TAB 1: INFORMACIÓN BÁSICA */}
            <Tab key="basic" title="Información Básica">
              <div className="space-y-6 py-4">
                {/* Nombre y Categoría */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre del Paquete"
                    placeholder="Ej: Cancún Todo Incluido - 5 Días"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isRequired
                    startContent={<MapPin size={18} className="text-gray-400" />}
                  />

                  <Select
                    label="Categoría"
                    selectedKeys={[formData.category]}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    isRequired
                  >
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.key}>{cat.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Descripción */}
                <Textarea
                  label="Descripción"
                  placeholder="Describe el paquete turístico de forma atractiva..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  minRows={4}
                  isRequired
                />

                <Divider />

                {/* Destino */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <MapPin size={20} className="text-primary" />
                    Destino
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
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
                </div>

                <Divider />

                {/* Duración */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calendar size={20} className="text-primary" />
                    Duración
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
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
                  </div>
                </div>

                <Divider />

                {/* Disponibilidad */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users size={20} className="text-primary" />
                    Disponibilidad
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
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

                <Divider />

                {/* Estado y Featured */}
                <div className="flex gap-6">
                  <Select
                    label="Estado"
                    selectedKeys={[formData.status]}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="max-w-xs"
                  >
                    <SelectItem key="draft">Borrador</SelectItem>
                    <SelectItem key="active">Activo</SelectItem>
                    <SelectItem key="inactive">Inactivo</SelectItem>
                  </Select>

                  <Switch
                    isSelected={formData.featured}
                    onValueChange={(value) => setFormData({ ...formData, featured: value })}
                  >
                    <span className="text-sm">Paquete Destacado</span>
                  </Switch>
                </div>
              </div>
            </Tab>

            {/* TAB 2: PRECIOS */}
            <Tab key="pricing" title="Precios">
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign size={20} className="text-primary" />
                    Precios por Persona
                  </h3>
                  <Select
                    label="Moneda"
                    selectedKeys={[formData.pricing.currency]}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, currency: e.target.value }
                    })}
                    className="max-w-[150px]"
                  >
                    <SelectItem key="USD">USD</SelectItem>
                    <SelectItem key="MXN">MXN</SelectItem>
                    <SelectItem key="EUR">EUR</SelectItem>
                  </Select>
                </div>

                {/* Markup */}
                <Input
                  type="number"
                  label="Markup (%)"
                  placeholder="40"
                  value={formData.pricing.markup.toString()}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, markup: parseFloat(e.target.value) || 0 }
                  })}
                  min="0"
                  max="100"
                  step="1"
                  description="Porcentaje de ganancia sobre el costo"
                />

                <Divider />

                {/* Costos por Persona */}
                <Card>
                  <CardBody>
                    <h4 className="font-semibold mb-4 text-gray-700">Costos (Proveedor)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        label="Habitación Doble"
                        placeholder="0"
                        value={formData.pricing.costPerPerson.double.toString()}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            costPerPerson: {
                              ...formData.pricing.costPerPerson,
                              double: parseFloat(e.target.value) || 0
                            }
                          }
                        })}
                        startContent={<span className="text-gray-400">$</span>}
                      />
                      <Input
                        type="number"
                        label="Habitación Sencilla"
                        placeholder="0"
                        value={formData.pricing.costPerPerson.single.toString()}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            costPerPerson: {
                              ...formData.pricing.costPerPerson,
                              single: parseFloat(e.target.value) || 0
                            }
                          }
                        })}
                        startContent={<span className="text-gray-400">$</span>}
                      />
                      <Input
                        type="number"
                        label="Habitación Triple"
                        placeholder="0"
                        value={formData.pricing.costPerPerson.triple.toString()}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            costPerPerson: {
                              ...formData.pricing.costPerPerson,
                              triple: parseFloat(e.target.value) || 0
                            }
                          }
                        })}
                        startContent={<span className="text-gray-400">$</span>}
                      />
                      <Input
                        type="number"
                        label="Niño (compartiendo)"
                        placeholder="0"
                        value={formData.pricing.costPerPerson.child.toString()}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            costPerPerson: {
                              ...formData.pricing.costPerPerson,
                              child: parseFloat(e.target.value) || 0
                            }
                          }
                        })}
                        startContent={<span className="text-gray-400">$</span>}
                      />
                    </div>
                  </CardBody>
                </Card>

                {/* Precios de Venta */}
                <Card className="border-2 border-primary/20">
                  <CardBody>
                    <h4 className="font-semibold mb-4 text-primary">Precios de Venta (Cliente)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        label="Habitación Doble"
                        placeholder="0"
                        value={formData.pricing.sellingPricePerPerson.double.toString()}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            sellingPricePerPerson: {
                              ...formData.pricing.sellingPricePerPerson,
                              double: parseFloat(e.target.value) || 0
                            }
                          }
                        })}
                        startContent={<span className="text-gray-400">$</span>}
                        classNames={{ input: "font-semibold" }}
                      />
                      <Input
                        type="number"
                        label="Habitación Sencilla"
                        placeholder="0"
                        value={formData.pricing.sellingPricePerPerson.single.toString()}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            sellingPricePerPerson: {
                              ...formData.pricing.sellingPricePerPerson,
                              single: parseFloat(e.target.value) || 0
                            }
                          }
                        })}
                        startContent={<span className="text-gray-400">$</span>}
                        classNames={{ input: "font-semibold" }}
                      />
                      <Input
                        type="number"
                        label="Habitación Triple"
                        placeholder="0"
                        value={formData.pricing.sellingPricePerPerson.triple.toString()}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            sellingPricePerPerson: {
                              ...formData.pricing.sellingPricePerPerson,
                              triple: parseFloat(e.target.value) || 0
                            }
                          }
                        })}
                        startContent={<span className="text-gray-400">$</span>}
                        classNames={{ input: "font-semibold" }}
                      />
                      <Input
                        type="number"
                        label="Niño (compartiendo)"
                        placeholder="0"
                        value={formData.pricing.sellingPricePerPerson.child.toString()}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            sellingPricePerPerson: {
                              ...formData.pricing.sellingPricePerPerson,
                              child: parseFloat(e.target.value) || 0
                            }
                          }
                        })}
                        startContent={<span className="text-gray-400">$</span>}
                        classNames={{ input: "font-semibold" }}
                      />
                    </div>
                  </CardBody>
                </Card>

                {/* Resumen de Ganancias */}
                <Card className="bg-success/5">
                  <CardBody>
                    <h4 className="font-semibold mb-3 text-success">Ganancia por Persona</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span>Doble:</span>
                        <span className="font-bold text-success">
                          ${(formData.pricing.sellingPricePerPerson.double - formData.pricing.costPerPerson.double).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sencilla:</span>
                        <span className="font-bold text-success">
                          ${(formData.pricing.sellingPricePerPerson.single - formData.pricing.costPerPerson.single).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Triple:</span>
                        <span className="font-bold text-success">
                          ${(formData.pricing.sellingPricePerPerson.triple - formData.pricing.costPerPerson.triple).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Niño:</span>
                        <span className="font-bold text-success">
                          ${(formData.pricing.sellingPricePerPerson.child - formData.pricing.costPerPerson.child).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            {/* TAB 3: INCLUSIONES Y EXCLUSIONES */}
            <Tab key="inclusions" title="Incluye / No Incluye">
              <div className="space-y-6 py-4">
                {/* Inclusiones */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle size={20} className="text-success" />
                    Incluye
                  </h3>

                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Ej: Vuelo redondo desde Ciudad de México"
                      value={newInclusion}
                      onChange={(e) => setNewInclusion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addInclusion()}
                    />
                    <Button
                      color="success"
                      onPress={addInclusion}
                      isIconOnly
                    >
                      <Plus size={20} />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formData.included.map((item, index) => (
                      <Card key={index}>
                        <CardBody className="flex flex-row items-center justify-between py-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-success" />
                            <span className="text-sm">{item}</span>
                          </div>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => removeInclusion(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Exclusiones */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <XCircle size={20} className="text-danger" />
                    No Incluye
                  </h3>

                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Ej: Propinas"
                      value={newExclusion}
                      onChange={(e) => setNewExclusion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addExclusion()}
                    />
                    <Button
                      color="danger"
                      onPress={addExclusion}
                      isIconOnly
                    >
                      <Plus size={20} />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formData.notIncluded.map((item, index) => (
                      <Card key={index}>
                        <CardBody className="flex flex-row items-center justify-between py-3">
                          <div className="flex items-center gap-2">
                            <XCircle size={16} className="text-danger" />
                            <span className="text-sm">{item}</span>
                          </div>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => removeExclusion(index)}
                          >
                            <Trash2 size={16} />
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
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Días del Viaje</h3>
                  <Button
                    color="primary"
                    startContent={<Plus size={18} />}
                    onPress={addItineraryDay}
                  >
                    Agregar Día
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.itinerary.map((day, index) => (
                    <Card key={index}>
                      <CardBody className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Chip color="primary" variant="flat">
                            Día {day.day}
                          </Chip>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => removeItineraryDay(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>

                        <Input
                          label="Título"
                          placeholder="Ej: Llegada a Cancún"
                          value={day.title}
                          onChange={(e) => updateItineraryDay(index, 'title', e.target.value)}
                        />

                        <Textarea
                          label="Descripción"
                          placeholder="Describe las actividades del día..."
                          value={day.description}
                          onChange={(e) => updateItineraryDay(index, 'description', e.target.value)}
                          minRows={3}
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
              <div className="space-y-4 py-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon size={20} className="text-primary" />
                  Galería de Imágenes
                </h3>

                <div className="flex gap-2">
                  <Input
                    placeholder="URL de la imagen"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addImage()}
                    startContent={<Upload size={18} className="text-gray-400" />}
                  />
                  <Button
                    color="primary"
                    onPress={addImage}
                    isIconOnly
                  >
                    <Plus size={20} />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {formData.images.map((url, index) => (
                    <Card key={index} className="relative group">
                      <CardBody className="p-0">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <Button
                          size="sm"
                          color="danger"
                          isIconOnly
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onPress={() => removeImage(index)}
                        >
                          <Trash2 size={16} />
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
              <div className="space-y-6 py-4">
                {/* Características principales */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Características Principales</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
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

                <Divider />

                {/* Switches de características */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Servicios Incluidos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Switch
                      isSelected={formData.features.includesFlights}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, includesFlights: value }
                      })}
                    >
                      Incluye Vuelos
                    </Switch>

                    <Switch
                      isSelected={formData.features.includesTransfers}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, includesTransfers: value }
                      })}
                    >
                      Incluye Traslados
                    </Switch>

                    <Switch
                      isSelected={formData.features.wifi}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, wifi: value }
                      })}
                    >
                      WiFi
                    </Switch>

                    <Switch
                      isSelected={formData.features.allInclusive}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, allInclusive: value }
                      })}
                    >
                      Todo Incluido
                    </Switch>

                    <Switch
                      isSelected={formData.features.kidsClub}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, kidsClub: value }
                      })}
                    >
                      Kids Club
                    </Switch>

                    <Switch
                      isSelected={formData.features.spa}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, spa: value }
                      })}
                    >
                      Spa
                    </Switch>

                    <Switch
                      isSelected={formData.features.pool}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, pool: value }
                      })}
                    >
                      Piscina
                    </Switch>

                    <Switch
                      isSelected={formData.features.privateBeach}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, privateBeach: value }
                      })}
                    >
                      Playa Privada
                    </Switch>

                    <Switch
                      isSelected={formData.features.gym}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, gym: value }
                      })}
                    >
                      Gimnasio
                    </Switch>

                    <Switch
                      isSelected={formData.features.golf}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, golf: value }
                      })}
                    >
                      Golf
                    </Switch>

                    <Switch
                      isSelected={formData.features.snorkelEquipment}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        features: { ...formData.features, snorkelEquipment: value }
                      })}
                    >
                      Equipo de Snorkel
                    </Switch>
                  </div>
                </div>

                <Divider />

                {/* Amenidades */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Amenidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(amenity => (
                      <Chip
                        key={amenity}
                        color={formData.features.amenities.includes(amenity) ? 'primary' : 'default'}
                        variant={formData.features.amenities.includes(amenity) ? 'solid' : 'bordered'}
                        onClick={() => toggleAmenity(amenity)}
                        className="cursor-pointer"
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
              <div className="space-y-4 py-4">
                <h3 className="text-lg font-semibold mb-3">Etiquetas del Paquete</h3>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ej: playa, familia, todo-incluido"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button
                    color="primary"
                    onPress={addTag}
                    isIconOnly
                  >
                    <Plus size={20} />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      onClose={() => removeTag(tag)}
                      variant="flat"
                      color="primary"
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

        <ModalFooter>
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
