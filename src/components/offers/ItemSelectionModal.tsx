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
  Card,
  CardBody,
  Chip,
  Tabs,
  Tab,
  Spinner
} from '@heroui/react'
import { Search, Hotel, Plane, Bus, MapPin, Star } from 'lucide-react'
import { useInventory } from '@/swr'

interface ItemSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: any) => void
  offerType: 'hotel' | 'flight' | 'package'
}

export default function ItemSelectionModal({
  isOpen,
  onClose,
  onSelect,
  offerType
}: ItemSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [destinationFilter, setDestinationFilter] = useState('')
  const [selectedItemType, setSelectedItemType] = useState<'Hotel' | 'Flight' | 'Transport' | 'Activity'>('Hotel')

  // Determinar qué tipos de items mostrar según offerType
  const availableTypes = offerType === 'hotel' 
    ? ['Hotel'] 
    : offerType === 'flight' 
    ? ['Flight'] 
    : ['Hotel', 'Flight', 'Transport', 'Activity']

  // Cargar inventario según el tipo seleccionado (sin filtrar por pricingMode)
  const { inventory: items, isLoading } = useInventory({
    resourceType: selectedItemType,
    status: 'active',
    limit: 100
  })

  // Filtrar por búsqueda y destino
  const filteredItems = items?.filter((item: any) => {
    const searchLower = searchTerm.toLowerCase()
    const destinationLower = destinationFilter.toLowerCase()
    const name = item.inventoryName?.toLowerCase() || ''
    const city = item.resource?.location?.city?.toLowerCase() || ''
    const country = item.resource?.location?.country?.toLowerCase() || ''
    
    const matchesSearch = !searchTerm || name.includes(searchLower) || city.includes(searchLower) || country.includes(searchLower)
    const matchesDestination = !destinationFilter || city.includes(destinationLower) || country.includes(destinationLower)
    
    return matchesSearch && matchesDestination
  }) || []

  // Reset al cambiar tipo
  useEffect(() => {
    if (isOpen && availableTypes.length > 0) {
      setSelectedItemType(availableTypes[0] as any)
    }
  }, [isOpen, offerType])

  const handleSelect = (item: any) => {
    // Construir el objeto según el tipo de item
    const itemData: any = {
      inventoryId: item._id,
      resourceType: selectedItemType,
      mandatory: true
    }

    // Agregar metadata específica según el tipo
    if (selectedItemType === 'Hotel') {
      itemData.hotelInfo = {
        resourceId: item.resource?._id || item.resource,
        name: item.resource?.name || item.inventoryName,
        stars: item.resource?.stars || 0,
        location: {
          city: item.resource?.location?.city || '',
          country: item.resource?.location?.country || ''
        },
        // Agregar datos del inventario necesarios para cálculos de precio
        rooms: item.rooms || [],
        pricingMode: item.pricingMode || 'perNight',
        description: item.resource?.description || '',
        amenities: item.resource?.amenities || []
      }
    } else if (selectedItemType === 'Flight') {
      itemData.flightDetails = {
        route: {
          from: item.resource?.route?.from || '',
          to: item.resource?.route?.to || ''
        },
        class: item.resource?.class || 'economy'
      }
    }

    onSelect(itemData)
    handleClose()
  }

  const handleClose = () => {
    setSearchTerm('')
    setDestinationFilter('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <div>
            <h3 className="text-xl font-bold">
              {offerType === 'hotel' && 'Seleccionar Hotel'}
              {offerType === 'flight' && 'Seleccionar Vuelo'}
              {offerType === 'package' && 'Seleccionar Item para Paquete'}
            </h3>
            <p className="text-sm text-default-500 font-normal mt-1">
              {offerType === 'hotel' && 'Hoteles disponibles en inventario'}
              {offerType === 'flight' && 'Vuelos disponibles en inventario'}
              {offerType === 'package' && 'Selecciona hoteles, vuelos, transportes o actividades'}
            </p>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Filtros */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Filtrar por destino (ciudad)..."
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                startContent={
                  <svg className="w-4 h-4 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                isClearable
                onClear={() => setDestinationFilter('')}
                classNames={{
                  inputWrapper: "border-2 border-primary/20"
                }}
              />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<Search size={18} />}
                isClearable
                onClear={() => setSearchTerm('')}
              />
            </div>

            {/* Tabs de tipos (solo para paquetes) */}
            {offerType === 'package' && (
              <Tabs
                selectedKey={selectedItemType}
                onSelectionChange={(key) => setSelectedItemType(key as any)}
                color="primary"
                variant="underlined"
              >
                <Tab
                  key="Hotel"
                  title={
                    <div className="flex items-center gap-2">
                      <Hotel size={16} />
                      <span>Hoteles</span>
                    </div>
                  }
                />
                <Tab
                  key="Flight"
                  title={
                    <div className="flex items-center gap-2">
                      <Plane size={16} />
                      <span>Vuelos</span>
                    </div>
                  }
                />
                <Tab
                  key="Transport"
                  title={
                    <div className="flex items-center gap-2">
                      <Bus size={16} />
                      <span>Transportes</span>
                    </div>
                  }
                />
                <Tab
                  key="Activity"
                  title={
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>Actividades</span>
                    </div>
                  }
                />
              </Tabs>
            )}

            {/* Lista de items */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-default-50 rounded-lg">
                <p className="text-default-500">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay items disponibles'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {filteredItems.map((item: any) => (
                  <Card
                    key={item._id}
                    isPressable
                    onPress={() => handleSelect(item)}
                    className="hover:border-primary transition-colors"
                  >
                    <CardBody>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {selectedItemType === 'Hotel' && <Hotel size={18} className="text-primary" />}
                            {selectedItemType === 'Flight' && <Plane size={18} className="text-primary" />}
                            {selectedItemType === 'Transport' && <Bus size={18} className="text-primary" />}
                            {selectedItemType === 'Activity' && <MapPin size={18} className="text-primary" />}
                            <h4 className="font-semibold">
                              {item.resource?.name || item.inventoryName}
                            </h4>
                          </div>

                          {/* Info específica según tipo */}
                          {selectedItemType === 'Hotel' && (
                            <div className="space-y-1">
                              {item.resource?.location && (
                                <p className="text-sm text-default-600 flex items-center gap-1">
                                  <MapPin size={14} />
                                  {item.resource.location.city}, {item.resource.location.country}
                                </p>
                              )}
                              {item.resource?.stars && (
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={12}
                                      className={i < item.resource.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                                    />
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Chip size="sm" variant="flat" color="primary">
                                  {item.pricingMode === 'package' ? 'Paquete' : 'Por Noche'}
                                </Chip>
                                {item.rooms && (
                                  <Chip size="sm" variant="flat">
                                    {item.rooms.length} habitaciones
                                  </Chip>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedItemType === 'Flight' && item.resource?.route && (
                            <p className="text-sm text-default-600">
                              {item.resource.route.from} → {item.resource.route.to}
                            </p>
                          )}

                          <p className="text-xs text-default-400 mt-2">
                            Inventario: {item.inventoryName}
                          </p>
                        </div>

                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
