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

  // Filtrar por búsqueda, destino y pricingMode
  const filteredItems = items?.filter((item: any) => {
    const searchLower = searchTerm.toLowerCase()
    const destinationLower = destinationFilter.toLowerCase()
    const name = item.inventoryName?.toLowerCase() || ''
    const city = item.resource?.location?.city?.toLowerCase() || ''
    const country = item.resource?.location?.country?.toLowerCase() || ''
    
    const matchesSearch = !searchTerm || name.includes(searchLower) || city.includes(searchLower) || country.includes(searchLower)
    const matchesDestination = !destinationFilter || city.includes(destinationLower) || country.includes(destinationLower)
    
    // Filtrar por pricingMode según el tipo de oferta
    let matchesPricingMode = true
    if (selectedItemType === 'Hotel') {
      if (offerType === 'package') {
        // Para paquetes: solo mostrar hoteles con pricingMode 'package'
        matchesPricingMode = item.pricingMode === 'package'
      } else if (offerType === 'hotel') {
        // Para hoteles individuales: solo mostrar hoteles con pricingMode 'per_night'
        matchesPricingMode = item.pricingMode === 'per_night'
      }
    }
    
    return matchesSearch && matchesDestination && matchesPricingMode
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
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-4 border-b border-default-200">
          <h3 className="text-2xl font-bold text-default-900">
            {offerType === 'hotel' && '🏨 Seleccionar Hotel'}
            {offerType === 'flight' && '✈️ Seleccionar Vuelo'}
            {offerType === 'package' && '📦 Seleccionar Item para Paquete'}
          </h3>
          <p className="text-sm text-default-500 font-normal">
            {offerType === 'hotel' && 'Hoteles disponibles en inventario para ofertas individuales'}
            {offerType === 'flight' && 'Vuelos disponibles en inventario'}
            {offerType === 'package' && 'Selecciona hoteles, vuelos, transportes o actividades para tu paquete'}
          </p>
        </ModalHeader>

        <ModalBody className="px-6 py-6">
          <div className="space-y-6">
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
              <div className="mt-3 flex justify-center py-16">
                <Spinner size="lg" color="primary" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="mt-3 text-center py-16 bg-gradient-to-br from-default-50 to-default-100 rounded-xl border-2 border-dashed border-default-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-default-200 rounded-full flex items-center justify-center">
                  {selectedItemType === 'Hotel' && <Hotel size={32} className="text-default-400" />}
                  {selectedItemType === 'Flight' && <Plane size={32} className="text-default-400" />}
                  {selectedItemType === 'Transport' && <Bus size={32} className="text-default-400" />}
                  {selectedItemType === 'Activity' && <MapPin size={32} className="text-default-400" />}
                </div>
                <p className="text-default-500 font-medium">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay items disponibles'}
                </p>
                <p className="text-xs text-default-400 mt-1">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega items al inventario primero'}
                </p>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto p-2 pb-6 pr-3 custom-scrollbar">
                {filteredItems.map((item: any) => (
                  <Card
                    key={item._id}
                    isPressable
                    onPress={() => handleSelect(item)}
                    className="hover:border-primary hover:shadow-lg transition-all duration-200 border-2 border-transparent"
                    shadow="sm"
                  >
                    <CardBody className="p-0">
                      <div className="flex gap-3 p-3">
                        {/* Imagen miniatura (solo para hoteles) */}
                        {selectedItemType === 'Hotel' && (
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border border-default-200">
                              {item.resource?.coverPhoto ? (
                                <img
                                  src={item.resource.coverPhoto}
                                  alt={item.resource?.name || item.inventoryName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Hotel size={32} className="text-default-300" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {selectedItemType === 'Hotel' && <Hotel size={14} className="text-primary flex-shrink-0" />}
                                {selectedItemType === 'Flight' && <Plane size={14} className="text-primary flex-shrink-0" />}
                                {selectedItemType === 'Transport' && <Bus size={14} className="text-primary flex-shrink-0" />}
                                {selectedItemType === 'Activity' && <MapPin size={14} className="text-primary flex-shrink-0" />}
                                <h4 className="font-bold text-sm text-default-900 truncate">
                                  {item.resource?.name || item.inventoryName}
                                </h4>
                              </div>
                              <p className="text-xs text-default-400 truncate">
                                {item.inventoryName}
                              </p>
                            </div>
                            
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                <svg className="w-3 h-3 text-primary group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Info específica según tipo */}
                          {selectedItemType === 'Hotel' && (
                            <div className="space-y-1.5">
                              {item.resource?.location && (
                                <div className="flex items-center gap-1 text-xs text-default-600">
                                  <MapPin size={12} className="flex-shrink-0" />
                                  <span className="truncate">
                                    {item.resource.location.city}, {item.resource.location.country}
                                  </span>
                                </div>
                              )}
                              
                              {item.resource?.stars && (
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={11}
                                      className={i < item.resource.stars ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Chip 
                                  size="sm" 
                                  variant="flat" 
                                  color={item.pricingMode === 'package' ? 'secondary' : 'primary'}
                                  className="text-xs h-5"
                                >
                                  {item.pricingMode === 'package' ? '📦' : '🌙'}
                                </Chip>
                                {item.rooms && item.rooms.length > 0 && (
                                  <Chip size="sm" variant="flat" color="default" className="text-xs h-5">
                                    {item.rooms.length} hab.
                                  </Chip>
                                )}
                                {item.status && (
                                  <Chip 
                                    size="sm" 
                                    variant="dot" 
                                    color={item.status === 'active' ? 'success' : 'warning'}
                                    className="text-xs h-5"
                                  >
                                    {item.status === 'active' ? 'Activo' : item.status}
                                  </Chip>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedItemType === 'Flight' && item.resource?.route && (
                            <div className="flex items-center gap-2 text-sm text-default-600 mt-2">
                              <Plane size={14} />
                              <span className="font-medium">{item.resource.route.from}</span>
                              <span>→</span>
                              <span className="font-medium">{item.resource.route.to}</span>
                            </div>
                          )}

                          {selectedItemType === 'Transport' && (
                            <div className="flex items-center gap-2 text-sm text-default-600 mt-2">
                              <Bus size={14} />
                              <span>Transporte disponible</span>
                            </div>
                          )}

                          {selectedItemType === 'Activity' && (
                            <div className="flex items-center gap-2 text-sm text-default-600 mt-2">
                              <MapPin size={14} />
                              <span>Actividad disponible</span>
                            </div>
                          )}
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
