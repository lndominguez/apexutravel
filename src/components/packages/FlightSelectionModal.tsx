'use client'

import { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Image,
  Chip,
  Select,
  SelectItem,
  Input
} from '@heroui/react'
import { Plane, Calendar, Clock, Check, Package as PackageIcon, Users } from 'lucide-react'
import { useInventory } from '@/swr'

interface FlightSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  flightType: 'outbound' | 'return' | 'internal'
  onSelect: (inventoryData: {
    inventoryId: string
    flight: any
    supplier: any
    type: 'outbound' | 'return' | 'internal'
    class: string
    pricing: {
      adult: { cost: number; sellingPrice: number }
      child: { cost: number; sellingPrice: number }
      infant: { cost: number; sellingPrice: number }
    }
  }) => void
}

export default function FlightSelectionModal({
  isOpen,
  onClose,
  flightType,
  onSelect
}: FlightSelectionModalProps) {
  const { inventory } = useInventory({ 
    resourceType: 'Flight', 
    status: 'active'
  })
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchDate, setSearchDate] = useState('')
  
  // Filtrar por tipo de vuelo (ida/vuelta)
  const filteredByType = inventory?.filter(item => 
    item.configuration.flightType === flightType
  ) || []

  const handleItemClick = (item: any) => {
    setSelectedItem(item)
  }

  const handleConfirm = () => {
    if (!selectedItem) return

    onSelect({
      inventoryId: selectedItem._id,
      flight: selectedItem.resource,
      supplier: selectedItem.supplier,
      type: flightType,
      class: selectedItem.configuration.class,
      pricing: {
        adult: selectedItem.pricing.adult || { cost: 0, sellingPrice: 0 },
        child: selectedItem.pricing.child || { cost: 0, sellingPrice: 0 },
        infant: selectedItem.pricing.infant || { cost: 0, sellingPrice: 0 }
      }
    })

    // Reset
    setSelectedItem(null)
    onClose()
  }

  // Filtrar por fecha si se ingresó
  const filteredFlights = searchDate 
    ? filteredByType?.filter((item) => {
        const flightDate = new Date(item.resource?.departure?.dateTime).toISOString().split('T')[0]
        return flightDate === searchDate
      })
    : filteredByType

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleString('es-MX', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <ModalHeader className="flex items-center gap-2">
          <Plane className="text-primary" size={24} />
          <span>Seleccionar Vuelo de {flightType === 'outbound' ? 'Ida' : flightType === 'return' ? 'Vuelta' : 'Interno'}</span>
        </ModalHeader>
        
        <ModalBody>
          {!selectedItem ? (
            <div className="space-y-3">
              {/* Filtro por fecha */}
              <div className="flex gap-3 items-end">
                <Input
                  type="date"
                  label="Filtrar por fecha"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="max-w-xs"
                  size="sm"
                />
                {searchDate && (
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => setSearchDate('')}
                  >
                    Limpiar
                  </Button>
                )}
              </div>

              {/* Lista de vuelos del inventario */}
              <div className="space-y-2">
                {filteredFlights?.map((item) => (
                  <Card 
                    key={item._id}
                    isPressable
                    onPress={() => handleItemClick(item)}
                    className="hover:border-primary transition-all"
                  >
                    <CardBody className="p-3">
                      <div className="flex items-center gap-4">
                        {/* Logo aerolínea */}
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                          {item.resource?.airline?.logoUrl ? (
                            <Image
                              src={item.resource.airline.logoUrl}
                              alt={item.resource.airline.name}
                              className="w-12 h-12 object-contain"
                            />
                          ) : (
                            <Plane size={32} className="text-gray-400" />
                          )}
                        </div>

                        {/* Info vuelo */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{item.resource?.airline?.name}</span>
                            <Chip size="sm" variant="flat">{item.resource?.flightNumber}</Chip>
                          </div>

                          <div className="flex items-center gap-1 mb-2">
                            <PackageIcon size={12} className="text-primary" />
                            <span className="text-xs font-semibold text-primary">
                              {item.supplier?.businessName || item.supplier?.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <p className="font-semibold">{item.resource?.departure?.city}</p>
                              <p className="text-xs text-gray-600">{formatDateTime(item.resource?.departure?.dateTime)}</p>
                            </div>
                            
                            <div className="flex-1 flex flex-col items-center">
                              <Clock size={14} className="text-gray-400 mb-1" />
                              <p className="text-xs text-gray-600">{formatDuration(item.resource?.duration)}</p>
                              {item.resource?.stops > 0 && (
                                <p className="text-xs text-warning">{item.resource.stops} escala(s)</p>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="font-semibold">{item.resource?.arrival?.city}</p>
                              <p className="text-xs text-gray-600">{formatDateTime(item.resource?.arrival?.dateTime)}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-2">
                            <Chip size="sm" variant="flat" color="secondary">
                              {item.configuration.class === 'economy' ? 'Económica' :
                               item.configuration.class === 'premium_economy' ? 'Premium' :
                               item.configuration.class === 'business' ? 'Business' :
                               item.configuration.class === 'first' ? 'Primera' : item.configuration.class}
                            </Chip>
                          </div>
                        </div>

                        {/* Precios por pasajero */}
                        <div className="text-right">
                          <p className="text-xs text-gray-600 mb-1">Precio Adulto</p>
                          <p className="text-xl font-bold text-primary">
                            ${item.pricing.adult?.sellingPrice || 0}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            <p>Niño: ${item.pricing.child?.sellingPrice || 0}</p>
                            <p>Infante: ${item.pricing.infant?.sellingPrice || 0}</p>
                          </div>
                          <Chip size="sm" color={item.availability > 10 ? 'success' : 'warning'} className="mt-1">
                            {item.availability} cupos
                          </Chip>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}

                {filteredFlights?.length === 0 && (
                  <Card>
                    <CardBody className="py-12 text-center text-gray-400">
                      <Plane size={48} className="mx-auto mb-3 opacity-50" />
                      <p>No hay vuelos disponibles para esta fecha</p>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            // Confirmación del vuelo seleccionado
            <div className="space-y-4">
              {/* Vuelo seleccionado */}
              <Card className="border-2 border-primary">
                <CardBody className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedItem.resource?.airline?.logoUrl && (
                        <Image
                          src={selectedItem.resource.airline.logoUrl}
                          alt={selectedItem.resource.airline.name}
                          className="w-12 h-12 object-contain"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {selectedItem.resource?.airline?.name} - {selectedItem.resource?.flightNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedItem.resource?.departure?.city} → {selectedItem.resource?.arrival?.city}
                        </p>
                        <p className="text-xs text-primary font-semibold mt-1">
                          Proveedor: {selectedItem.supplier?.businessName || selectedItem.supplier?.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => setSelectedItem(null)}
                    >
                      Cambiar
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Detalles de configuración */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Tipo de Vuelo</p>
                  <Chip color="primary" variant="flat">
                    {flightType === 'outbound' ? 'Vuelo de Ida' :
                     flightType === 'return' ? 'Vuelo de Vuelta' : 'Vuelo Interno'}
                  </Chip>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Clase</p>
                  <Chip color="secondary" variant="flat">
                    {selectedItem.configuration.class === 'economy' ? 'Económica' :
                     selectedItem.configuration.class === 'premium_economy' ? 'Premium Economy' :
                     selectedItem.configuration.class === 'business' ? 'Business' :
                     selectedItem.configuration.class === 'first' ? 'Primera Clase' : selectedItem.configuration.class}
                  </Chip>
                </div>
              </div>

              {/* Precios por tipo de pasajero */}
              <Card className="bg-gradient-to-r from-primary/10 to-success/10 border border-primary/20">
                <CardBody className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={18} className="text-primary" />
                    <h3 className="font-semibold">Precios por Tipo de Pasajero</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {/* Adulto */}
                    <div className="bg-white/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Adulto</p>
                      <p className="text-2xl font-bold text-primary">
                        ${selectedItem.pricing.adult?.sellingPrice || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Costo: ${selectedItem.pricing.adult?.cost || 0}
                      </p>
                      <p className="text-xs text-success font-semibold">
                        +${((selectedItem.pricing.adult?.sellingPrice || 0) - (selectedItem.pricing.adult?.cost || 0)).toFixed(2)}
                      </p>
                    </div>

                    {/* Niño */}
                    <div className="bg-white/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Niño</p>
                      <p className="text-2xl font-bold text-primary">
                        ${selectedItem.pricing.child?.sellingPrice || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Costo: ${selectedItem.pricing.child?.cost || 0}
                      </p>
                      <p className="text-xs text-success font-semibold">
                        +${((selectedItem.pricing.child?.sellingPrice || 0) - (selectedItem.pricing.child?.cost || 0)).toFixed(2)}
                      </p>
                    </div>

                    {/* Infante */}
                    <div className="bg-white/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Infante</p>
                      <p className="text-2xl font-bold text-primary">
                        ${selectedItem.pricing.infant?.sellingPrice || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Costo: ${selectedItem.pricing.infant?.cost || 0}
                      </p>
                      <p className="text-xs text-success font-semibold">
                        +${((selectedItem.pricing.infant?.sellingPrice || 0) - (selectedItem.pricing.infant?.cost || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Disponibilidad:</span>
                      <Chip size="sm" color={selectedItem.availability > 10 ? 'success' : 'warning'}>
                        {selectedItem.availability} cupos
                      </Chip>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          {selectedItem && (
            <Button
              color="primary"
              onPress={handleConfirm}
              startContent={<Check size={18} />}
            >
              Agregar al Paquete
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
