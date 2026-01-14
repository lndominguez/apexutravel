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
  Input
} from '@heroui/react'
import { Bus, MapPin, Users, Check, Package as PackageIcon } from 'lucide-react'
import { useInventory } from '@/swr'

interface TransportSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (inventoryData: {
    inventoryId: string
    transport: any
    supplier: any
    serviceType: string
    description: string
    costPrice: number
    sellingPrice: number
  }) => void
}

export default function TransportSelectionModal({
  isOpen,
  onClose,
  onSelect
}: TransportSelectionModalProps) {
  const { inventory } = useInventory({ resourceType: 'Transport', status: 'active' })
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [description, setDescription] = useState('')

  const handleItemClick = (item: any) => {
    setSelectedItem(item)
    setDescription(item.resource?.name || '')
  }

  const handleConfirm = () => {
    if (!selectedItem) return

    onSelect({
      inventoryId: selectedItem._id,
      transport: selectedItem.resource,
      supplier: selectedItem.supplier,
      serviceType: selectedItem.configuration.serviceType,
      description: description || selectedItem.resource?.name,
      costPrice: selectedItem.pricing.cost || 0,
      sellingPrice: selectedItem.pricing.sellingPrice || 0
    })

    // Reset
    setSelectedItem(null)
    setDescription('')
    onClose()
  }

  const getTransportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'private_car': 'Auto Privado',
      'shared_shuttle': 'Shuttle Compartido',
      'bus': 'Autobús',
      'van': 'Van',
      'limousine': 'Limusina',
      'taxi': 'Taxi',
      'train': 'Tren',
      'ferry': 'Ferry'
    }
    return types[type] || type
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Bus className="text-primary" size={24} />
          <span>Seleccionar Transporte</span>
        </ModalHeader>
        
        <ModalBody>
          {!selectedItem ? (
            // Lista de transportes del inventario
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inventory?.map((item) => (
                <Card 
                  key={item._id}
                  isPressable
                  onPress={() => handleItemClick(item)}
                  className="hover:border-primary transition-all"
                >
                  <CardBody className="p-0">
                    <div className="flex gap-3">
                      {/* Imagen del vehículo */}
                      <div className="w-32 h-32 flex-shrink-0 bg-gray-100 relative overflow-hidden">
                        {item.resource?.images?.[0] ? (
                          <Image
                            src={item.resource.images[0]}
                            alt={item.resource.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Bus size={40} className="text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{item.resource?.name}</h3>
                          <Chip size="sm" variant="flat" color="secondary">
                            {getTransportTypeLabel(item.resource?.type)}
                          </Chip>
                        </div>

                        <div className="flex items-center gap-1 mb-2">
                          <PackageIcon size={12} className="text-primary" />
                          <span className="text-xs font-semibold text-primary">
                            {item.supplier?.businessName || item.supplier?.name}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 mb-2">
                          {item.resource?.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span>{item.resource?.route?.origin?.city} → {item.resource?.route?.destination?.city}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 text-xs">
                            <Users size={12} className="text-gray-400" />
                            <span>{item.resource?.capacity?.passengers} pasajeros</span>
                          </div>
                          <Chip size="sm" variant="flat" color="primary">
                            {item.configuration.serviceType === 'private' ? 'Privado' :
                             item.configuration.serviceType === 'shared' ? 'Compartido' :
                             item.configuration.serviceType === 'luxury' ? 'Lujo' : 'Estándar'}
                          </Chip>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-lg font-bold text-primary">
                              ${item.pricing.sellingPrice || 0}
                            </span>
                          </div>
                          <Chip size="sm" color={item.availability > 5 ? 'success' : 'warning'}>
                            {item.availability} cupos
                          </Chip>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            // Confirmación del transporte seleccionado
            <div className="space-y-4">
              {/* Transporte seleccionado */}
              <Card className="border-2 border-primary">
                <CardBody className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedItem.resource?.images?.[0] && (
                        <Image
                          src={selectedItem.resource.images[0]}
                          alt={selectedItem.resource.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{selectedItem.resource?.name}</h3>
                        <p className="text-xs text-gray-600">
                          {selectedItem.resource?.route?.origin?.city} → {selectedItem.resource?.route?.destination?.city}
                        </p>
                        <p className="text-xs text-primary font-semibold mt-1">
                          Proveedor: {selectedItem.supplier?.businessName || selectedItem.supplier?.name}
                        </p>
                        <Chip size="sm" variant="flat" className="mt-1">
                          {getTransportTypeLabel(selectedItem.resource?.type)}
                        </Chip>
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

              {/* Descripción personalizada */}
              <Input
                label="Descripción para el paquete"
                placeholder="Ej: Traslado aeropuerto-hotel"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Tipo de servicio */}
              <div>
                <p className="text-xs text-gray-600 mb-1">Tipo de Servicio</p>
                <Chip color="primary" variant="flat">
                  {selectedItem.configuration.serviceType === 'private' ? 'Servicio Privado' :
                   selectedItem.configuration.serviceType === 'shared' ? 'Servicio Compartido' :
                   selectedItem.configuration.serviceType === 'luxury' ? 'Servicio de Lujo' : 'Servicio Estándar'}
                </Chip>
              </div>

              {/* Detalles del transporte */}
              <Card className="bg-gray-50">
                <CardBody className="p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Capacidad</p>
                      <p className="font-semibold">
                        {selectedItem.resource?.capacity?.passengers} pasajeros
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Equipaje</p>
                      <p className="font-semibold">
                        {selectedItem.resource?.capacity?.luggage} maletas
                      </p>
                    </div>
                    {selectedItem.resource?.route?.distance && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Distancia</p>
                        <p className="font-semibold">
                          {selectedItem.resource.route.distance} km
                        </p>
                      </div>
                    )}
                    {selectedItem.resource?.route?.estimatedDuration && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Duración</p>
                        <p className="font-semibold">
                          {Math.floor(selectedItem.resource.route.estimatedDuration / 60)}h {selectedItem.resource.route.estimatedDuration % 60}m
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedItem.resource?.amenities?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">Amenidades</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedItem.resource.amenities.map((amenity: string, i: number) => (
                          <Chip key={i} size="sm" variant="flat">
                            {amenity}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Resumen de precios */}
              <Card className="bg-gradient-to-r from-primary/10 to-success/10 border border-primary/20">
                <CardBody className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Precio de Venta</p>
                      <p className="text-3xl font-bold text-primary">
                        ${selectedItem.pricing.sellingPrice?.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Costo</p>
                      <p className="text-lg text-gray-700">
                        ${selectedItem.pricing.cost?.toFixed(2)}
                      </p>
                      <p className="text-sm text-success font-semibold mt-1">
                        Ganancia: ${((selectedItem.pricing.sellingPrice || 0) - (selectedItem.pricing.cost || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Disponibilidad:</span>
                      <Chip size="sm" color={selectedItem.availability > 5 ? 'success' : 'warning'}>
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
