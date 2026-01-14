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
  Select,
  SelectItem,
  Textarea,
  Tabs,
  Tab,
  Chip,
  Card,
  CardBody,
  Divider,
  CheckboxGroup,
  Checkbox
} from '@heroui/react'
import { X, Plus, Trash2, Image as ImageIcon, Star } from 'lucide-react'
import { RoomCategory, RoomOccupancy, RoomViewType } from '@/models/Hotel'

interface RoomTypeForm {
  name: string
  description: string
  category: RoomCategory
  occupancy: RoomOccupancy[]
  viewType: RoomViewType[]
  amenities: string[]
  images?: string[]
}

interface HotelFormData {
  name: string
  chain?: string
  stars: number
  location: {
    address: string
    city: string
    state?: string
    country: string
    postalCode?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    zone?: string
  }
  phone: string
  email: string
  website?: string
  description: string
  amenities: string[]
  photos: string[]
  roomTypes: RoomTypeForm[]
  policies: {
    checkIn: string
    checkOut: string
    cancellation?: string
    children?: string
    pets?: string
  }
  rating?: number
  tags?: string[]
  notes?: string
  status: 'active' | 'inactive'
}

interface HotelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: HotelFormData) => Promise<void>
  hotel?: any
  isLoading?: boolean
}

const ROOM_CATEGORIES = [
  { value: 'standard', label: 'Standard' },
  { value: 'superior', label: 'Superior' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'junior_suite', label: 'Junior Suite' },
  { value: 'suite', label: 'Suite' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'presidential', label: 'Presidential' }
]

const ROOM_OCCUPANCIES = [
  { value: 'single', label: 'Simple (1 persona)' },
  { value: 'double', label: 'Doble (2 personas)' },
  { value: 'triple', label: 'Triple (3 personas)' },
  { value: 'quad', label: 'Cuádruple (4 personas)' }
]

const ROOM_VIEW_TYPES = [
  { value: 'ocean_view', label: 'Vista al Mar' },
  { value: 'city_view', label: 'Vista a la Ciudad' },
  { value: 'garden_view', label: 'Vista al Jardín' },
  { value: 'pool_view', label: 'Vista a la Piscina' },
  { value: 'mountain_view', label: 'Vista a la Montaña' },
  { value: 'balcony', label: 'Balcón' },
  { value: 'no_view', label: 'Sin Vista' }
]

const COMMON_AMENITIES = [
  'Piscina', 'Spa', 'Gimnasio', 'Restaurante', 'WiFi', 'Estacionamiento',
  'Acceso a la Playa', 'Bar', 'Servicio a Habitación', 'Centro de Negocios',
  'Salón de Eventos', 'Kids Club', 'Lavandería', 'Tienda de Regalos'
]

const ROOM_AMENITIES = [
  'Balcón', 'Minibar', 'Cafetera', 'Caja Fuerte', 'Bañera', 'Ducha',
  'Secador de Pelo', 'TV', 'Aire Acondicionado', 'Escritorio', 'Sofá Cama'
]

export default function HotelModal({ isOpen, onClose, onSubmit, hotel, isLoading }: HotelModalProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)

  const [formData, setFormData] = useState<HotelFormData>({
    name: '',
    stars: 3,
    location: {
      address: '',
      city: '',
      country: 'México'
    },
    phone: '',
    email: '',
    description: '',
    amenities: [],
    photos: [],
    roomTypes: [],
    policies: {
      checkIn: '15:00',
      checkOut: '12:00'
    },
    status: 'active'
  })

  const [newAmenity, setNewAmenity] = useState('')
  const [newRoomAmenity, setNewRoomAmenity] = useState('')
  const [newPhoto, setNewPhoto] = useState('')
  const [newRoomImage, setNewRoomImage] = useState('')

  useEffect(() => {
    if (hotel) {
      // Normalizar roomTypes: convertir occupancy y viewType de string a array si es necesario
      const normalizedRoomTypes = (hotel.roomTypes || []).map((room: any) => ({
        ...room,
        occupancy: Array.isArray(room.occupancy) ? room.occupancy : [room.occupancy],
        viewType: Array.isArray(room.viewType) ? room.viewType : [room.viewType]
      }))

      setFormData({
        name: hotel.name || '',
        chain: hotel.chain,
        stars: hotel.stars || 3,
        location: hotel.location || {
          address: '',
          city: '',
          country: 'México'
        },
        phone: hotel.phone || '',
        email: hotel.email || '',
        website: hotel.website,
        description: hotel.description || '',
        amenities: hotel.amenities || [],
        photos: hotel.photos || [],
        roomTypes: normalizedRoomTypes,
        policies: hotel.policies || {
          checkIn: '15:00',
          checkOut: '12:00'
        },
        rating: hotel.rating,
        tags: hotel.tags || [],
        notes: hotel.notes,
        status: hotel.status || 'active'
      })
    } else {
      setFormData({
        name: '',
        stars: 3,
        location: {
          address: '',
          city: '',
          country: 'México'
        },
        phone: '',
        email: '',
        description: '',
        amenities: [],
        photos: [],
        roomTypes: [],
        policies: {
          checkIn: '15:00',
          checkOut: '12:00'
        },
        status: 'active'
      })
      setCurrentRoomIndex(0)
    }
  }, [hotel, isOpen])

  const handleSubmit = async () => {
    await onSubmit(formData)
  }

  // Amenidades del hotel
  const addAmenity = (amenity?: string) => {
    const amenityToAdd = amenity || newAmenity.trim()
    if (amenityToAdd && !formData.amenities.includes(amenityToAdd)) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityToAdd]
      })
      setNewAmenity('')
    }
  }

  const removeAmenity = (index: number) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index)
    })
  }

  // Fotos del hotel
  const addPhoto = () => {
    if (newPhoto.trim()) {
      setFormData({
        ...formData,
        photos: [...formData.photos, newPhoto.trim()]
      })
      setNewPhoto('')
    }
  }

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index)
    })
  }

  // Habitaciones
  const addRoomType = () => {
    const newRoom: RoomTypeForm = {
      name: '',
      description: '',
      category: 'standard',
      occupancy: ['double'],
      viewType: ['no_view'],
      amenities: []
    }
    setFormData({
      ...formData,
      roomTypes: [...formData.roomTypes, newRoom]
    })
    setCurrentRoomIndex(formData.roomTypes.length)
  }

  const updateRoomType = (index: number, field: string, value: any) => {
    const updatedRooms = [...formData.roomTypes]
    const keys = field.split('.')
    let obj: any = updatedRooms[index]
    
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]]
    }
    obj[keys[keys.length - 1]] = value
    
    setFormData({ ...formData, roomTypes: updatedRooms })
  }

  const removeRoomType = (index: number) => {
    setFormData({
      ...formData,
      roomTypes: formData.roomTypes.filter((_, i) => i !== index)
    })
    if (currentRoomIndex >= formData.roomTypes.length - 1) {
      setCurrentRoomIndex(Math.max(0, formData.roomTypes.length - 2))
    }
  }

  const addRoomAmenity = (roomIndex: number, amenity?: string) => {
    const amenityToAdd = amenity || newRoomAmenity.trim()
    if (amenityToAdd) {
      const updatedRooms = [...formData.roomTypes]
      if (!updatedRooms[roomIndex].amenities.includes(amenityToAdd)) {
        updatedRooms[roomIndex].amenities.push(amenityToAdd)
        setFormData({ ...formData, roomTypes: updatedRooms })
        setNewRoomAmenity('')
      }
    }
  }

  const removeRoomAmenity = (roomIndex: number, amenityIndex: number) => {
    const updatedRooms = [...formData.roomTypes]
    updatedRooms[roomIndex].amenities = updatedRooms[roomIndex].amenities.filter((_, i) => i !== amenityIndex)
    setFormData({ ...formData, roomTypes: updatedRooms })
  }

  const addRoomImage = (roomIndex: number) => {
    if (newRoomImage.trim()) {
      const updatedRooms = [...formData.roomTypes]
      updatedRooms[roomIndex].images = [...(updatedRooms[roomIndex].images || []), newRoomImage.trim()]
      setFormData({ ...formData, roomTypes: updatedRooms })
      setNewRoomImage('')
    }
  }

  const removeRoomImage = (roomIndex: number, imageIndex: number) => {
    const updatedRooms = [...formData.roomTypes]
    updatedRooms[roomIndex].images = (updatedRooms[roomIndex].images || []).filter((_, i) => i !== imageIndex)
    setFormData({ ...formData, roomTypes: updatedRooms })
  }

  const currentRoom = formData.roomTypes[currentRoomIndex]

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {hotel ? 'Editar Hotel' : 'Nuevo Hotel'}
            <Chip size="sm" variant="flat" color="primary">Catálogo (sin precios)</Chip>
          </div>
        </ModalHeader>
        <ModalBody>
          <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
            {/* Tab 1: Información Básica */}
            <Tab key="basic" title="Información Básica">
              <div className="space-y-4 py-4">
                <Input
                  label="Nombre del Hotel"
                  placeholder="Ej: Hotel Paradisus Cancún"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  isRequired
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Cadena Hotelera (opcional)"
                    placeholder="Ej: Marriott, Hilton"
                    value={formData.chain || ''}
                    onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                  />

                  <Select
                    label="Categoría (Estrellas)"
                    placeholder="Selecciona estrellas"
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={new Set([String(formData.stars)])}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys as Set<string>)[0]
                      const stars = parseInt(selected || '3', 10)
                      setFormData((prev) => ({ ...prev, stars }))
                    }}
                    renderValue={(items) => items.map((i) => i.textValue).join(', ')}
                    isRequired
                  >
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <SelectItem
                        key={String(stars)}
                        textValue={`${'⭐'.repeat(stars)} ${stars} ${stars === 1 ? 'Estrella' : 'Estrellas'}`}
                      >
                        {Array.from({ length: stars }, (_, i) => '⭐').join('')} {stars} {stars === 1 ? 'Estrella' : 'Estrellas'}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <Textarea
                  label="Descripción del Hotel"
                  placeholder="Describe el hotel, sus instalaciones y atractivos..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  minRows={4}
                  isRequired
                />

                <Divider />

                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon size={16} />
                    Fotos del Hotel
                  </h4>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="URL de la foto"
                      value={newPhoto}
                      onChange={(e) => setNewPhoto(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addPhoto()}
                    />
                    <Button color="primary" onPress={addPhoto} startContent={<Plus size={16} />}>
                      Agregar
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {formData.photos.map((photo, index) => (
                      <Card key={index} className="relative">
                        <CardBody className="p-2">
                          <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-24 object-cover rounded" />
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="flat"
                            className="absolute top-1 right-1"
                            onPress={() => removePhoto(index)}
                          >
                            <X size={14} />
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </Tab>

            {/* Tab 2: Ubicación y Contacto */}
            <Tab key="location" title="Ubicación y Contacto">
              <div className="space-y-4 py-4">
                <h4 className="font-semibold text-primary">Ubicación</h4>
                
                <Input
                  label="Dirección"
                  placeholder="Calle y número"
                  value={formData.location.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value }
                  })}
                  isRequired
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ciudad"
                    placeholder="Ej: Cancún"
                    value={formData.location.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value }
                    })}
                    isRequired
                  />
                  <Input
                    label="Estado/Provincia"
                    placeholder="Ej: Quintana Roo"
                    value={formData.location.state || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, state: e.target.value }
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="País"
                    value={formData.location.country}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, country: e.target.value }
                    })}
                    isRequired
                  />
                  <Input
                    label="Código Postal"
                    placeholder="77500"
                    value={formData.location.postalCode || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, postalCode: e.target.value }
                    })}
                  />
                </div>

                <Input
                  label="Zona (opcional)"
                  placeholder="Ej: Zona Hotelera, Centro Histórico"
                  value={formData.location.zone || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, zone: e.target.value }
                  })}
                />

                <Divider className="my-4" />
                <h4 className="font-semibold text-primary">Contacto</h4>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Teléfono"
                    placeholder="+52 998 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    isRequired
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="contacto@hotel.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    isRequired
                  />
                </div>

                <Input
                  label="Sitio Web (opcional)"
                  placeholder="https://www.hotel.com"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </Tab>

            {/* Tab 3: Amenidades */}
            <Tab key="amenities" title="Amenidades">
              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-600">Amenidades comunes:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {COMMON_AMENITIES.map((amenity) => (
                    <Button
                      key={amenity}
                      size="sm"
                      variant={formData.amenities.includes(amenity) ? 'solid' : 'bordered'}
                      color={formData.amenities.includes(amenity) ? 'primary' : 'default'}
                      onPress={() => formData.amenities.includes(amenity) 
                        ? removeAmenity(formData.amenities.indexOf(amenity))
                        : addAmenity(amenity)
                      }
                    >
                      {amenity}
                    </Button>
                  ))}
                </div>

                <Divider />

                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar amenidad personalizada..."
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
                  />
                  <Button color="primary" onPress={() => addAmenity()}>
                    Agregar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.amenities.filter(a => !COMMON_AMENITIES.includes(a)).map((amenity, index) => (
                    <Chip
                      key={index}
                      onClose={() => removeAmenity(formData.amenities.indexOf(amenity))}
                      variant="flat"
                      color="primary"
                    >
                      {amenity}
                    </Chip>
                  ))}
                </div>
              </div>
            </Tab>

            {/* Tab 4: Habitaciones */}
            <Tab key="rooms" title={`Habitaciones (${formData.roomTypes.length})`}>
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Tipos de Habitación</h3>
                    <p className="text-sm text-gray-600">Define las habitaciones del catálogo (sin precios)</p>
                  </div>
                  <Button color="primary" size="sm" onPress={addRoomType} startContent={<Plus size={16} />}>
                    Agregar Habitación
                  </Button>
                </div>

                {formData.roomTypes.length === 0 ? (
                  <Card>
                    <CardBody className="text-center py-8 text-gray-500">
                      No hay habitaciones. Agrega al menos una.
                    </CardBody>
                  </Card>
                ) : (
                  <>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {formData.roomTypes.map((room, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant={currentRoomIndex === index ? 'solid' : 'bordered'}
                          color={currentRoomIndex === index ? 'primary' : 'default'}
                          onPress={() => setCurrentRoomIndex(index)}
                        >
                          {room.name || `Habitación ${index + 1}`}
                        </Button>
                      ))}
                    </div>

                    {currentRoom && (
                      <Card>
                        <CardBody className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Habitación {currentRoomIndex + 1}</h4>
                            <Button
                              color="danger"
                              size="sm"
                              variant="light"
                              onPress={() => removeRoomType(currentRoomIndex)}
                              startContent={<Trash2 size={16} />}
                            >
                              Eliminar
                            </Button>
                          </div>

                          <Input
                            label="Nombre"
                            placeholder="Ej: Habitación Deluxe Vista al Mar"
                            value={currentRoom.name}
                            onChange={(e) => updateRoomType(currentRoomIndex, 'name', e.target.value)}
                            isRequired
                          />

                          <Textarea
                            label="Descripción"
                            placeholder="Describe la habitación..."
                            value={currentRoom.description}
                            onChange={(e) => updateRoomType(currentRoomIndex, 'description', e.target.value)}
                            minRows={2}
                            isRequired
                          />

                          <Divider />
                          <p className="text-sm font-semibold text-primary">Características (influyen en precio)</p>

                          <div className="grid grid-cols-3 gap-4">
                            <Select
                              label="Categoría"
                              selectedKeys={[currentRoom.category]}
                              onChange={(e) => updateRoomType(currentRoomIndex, 'category', e.target.value)}
                              isRequired
                            >
                              {ROOM_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </Select>

                            <CheckboxGroup
                              label="Capacidad (selecciona todas las que apliquen)"
                              value={currentRoom.occupancy}
                              onValueChange={(values) => updateRoomType(currentRoomIndex, 'occupancy', values)}
                              isRequired
                            >
                              {ROOM_OCCUPANCIES.map((occ) => (
                                <Checkbox key={occ.value} value={occ.value}>
                                  {occ.label}
                                </Checkbox>
                              ))}
                            </CheckboxGroup>

                            <div>
                              <Select
                                label="Características/Vistas"
                                selectionMode="multiple"
                                selectedKeys={currentRoom.viewType}
                                onSelectionChange={(keys) => {
                                  const values = Array.from(keys) as string[]
                                  updateRoomType(currentRoomIndex, 'viewType', values)
                                }}
                                isRequired
                              >
                                {ROOM_VIEW_TYPES.map((view) => (
                                  <SelectItem key={view.value}>{view.label}</SelectItem>
                                ))}
                              </Select>
                              {Array.isArray(currentRoom.viewType) && currentRoom.viewType.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {currentRoom.viewType.map((view) => {
                                    const viewLabel = ROOM_VIEW_TYPES.find(v => v.value === view)?.label || view
                                    return (
                                      <Chip key={view} size="sm" variant="flat" color="primary">
                                        {viewLabel}
                                      </Chip>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          <Divider />
                          <p className="text-sm font-semibold">Amenidades de la Habitación</p>

                          <div className="flex flex-wrap gap-2 mb-2">
                            {ROOM_AMENITIES.map((amenity) => (
                              <Button
                                key={amenity}
                                size="sm"
                                variant={currentRoom.amenities.includes(amenity) ? 'solid' : 'bordered'}
                                color={currentRoom.amenities.includes(amenity) ? 'success' : 'default'}
                                onPress={() => currentRoom.amenities.includes(amenity)
                                  ? removeRoomAmenity(currentRoomIndex, currentRoom.amenities.indexOf(amenity))
                                  : addRoomAmenity(currentRoomIndex, amenity)
                                }
                              >
                                {amenity}
                              </Button>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <Input
                              placeholder="Amenidad personalizada..."
                              value={newRoomAmenity}
                              onChange={(e) => setNewRoomAmenity(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addRoomAmenity(currentRoomIndex)}
                            />
                            <Button size="sm" onPress={() => addRoomAmenity(currentRoomIndex)}>
                              Agregar
                            </Button>
                          </div>

                          <Divider />
                          <p className="text-sm font-semibold">Imágenes de la Habitación</p>

                          <div className="flex gap-2">
                            <Input
                              placeholder="URL de imagen"
                              value={newRoomImage}
                              onChange={(e) => setNewRoomImage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addRoomImage(currentRoomIndex)}
                            />
                            <Button size="sm" color="primary" onPress={() => addRoomImage(currentRoomIndex)}>
                              Agregar
                            </Button>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {(currentRoom.images || []).map((image, imgIndex) => (
                              <Card key={imgIndex} className="relative">
                                <CardBody className="p-1">
                                  <img src={image} alt={`Room ${imgIndex + 1}`} className="w-full h-20 object-cover rounded" />
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    className="absolute top-0 right-0"
                                    onPress={() => removeRoomImage(currentRoomIndex, imgIndex)}
                                  >
                                    <X size={12} />
                                  </Button>
                                </CardBody>
                              </Card>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </Tab>

            {/* Tab 5: Políticas */}
            <Tab key="policies" title="Políticas">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Check-in"
                    type="time"
                    value={formData.policies.checkIn}
                    onChange={(e) => setFormData({
                      ...formData,
                      policies: { ...formData.policies, checkIn: e.target.value }
                    })}
                    isRequired
                  />
                  <Input
                    label="Check-out"
                    type="time"
                    value={formData.policies.checkOut}
                    onChange={(e) => setFormData({
                      ...formData,
                      policies: { ...formData.policies, checkOut: e.target.value }
                    })}
                    isRequired
                  />
                </div>

                <Textarea
                  label="Política de Cancelación"
                  placeholder="Describe las condiciones de cancelación..."
                  value={formData.policies.cancellation || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    policies: { ...formData.policies, cancellation: e.target.value }
                  })}
                  minRows={3}
                />

                <Textarea
                  label="Política de Niños"
                  placeholder="Describe las condiciones para niños..."
                  value={formData.policies.children || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    policies: { ...formData.policies, children: e.target.value }
                  })}
                  minRows={3}
                />

                <Textarea
                  label="Política de Mascotas"
                  placeholder="Describe si se permiten mascotas y condiciones..."
                  value={formData.policies.pets || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    policies: { ...formData.policies, pets: e.target.value }
                  })}
                  minRows={2}
                />

                <Divider />

                <Select
                  label="Estado"
                  selectedKeys={[formData.status]}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <SelectItem key="active">Activo</SelectItem>
                  <SelectItem key="inactive">Inactivo</SelectItem>
                </Select>

                <Textarea
                  label="Notas Internas (opcional)"
                  placeholder="Notas para uso interno..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  minRows={2}
                />
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!formData.name || !formData.description || formData.roomTypes.length === 0}
          >
            {hotel ? 'Actualizar' : 'Crear'} Hotel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
