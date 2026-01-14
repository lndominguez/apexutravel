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
import { Hotel, Star, MapPin, Check, Package as PackageIcon } from 'lucide-react'
import { useInventory } from '@/swr'
import { getRoomAdultBasePrice } from '@/lib/offerPricing'

interface HotelSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (inventoryData: {
    inventoryId: string
    hotel: any
    supplier: any
    roomType: string
    roomName: string
    plan: string
    nights: number
    costPrice: number
    sellingPrice: number
  }) => void
  defaultNights: number
}

export default function HotelSelectionModal({
  isOpen,
  onClose,
  onSelect,
  defaultNights
}: HotelSelectionModalProps) {
  const { inventory } = useInventory({ resourceType: 'Hotel', status: 'active' })
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [nights, setNights] = useState(defaultNights)

  const handleItemClick = (item: any, room?: any) => {
    setSelectedItem(item)
    // Si el inventario tiene una sola habitación, seleccionarla automáticamente
    if (item.rooms?.length === 1) {
      setSelectedRoom(item.rooms[0])
    } else if (room) {
      setSelectedRoom(room)
    } else {
      setSelectedRoom(null)
    }
  }

  const handleConfirm = () => {
    if (!selectedItem || !selectedRoom) return

    const roomPrice = getRoomAdultBasePrice(selectedRoom)

    onSelect({
      inventoryId: selectedItem._id,
      hotel: selectedItem.resource,
      supplier: selectedItem.supplier,
      roomType: selectedRoom.roomType,
      roomName: selectedRoom.roomName,
      plan: selectedRoom.plan,
      nights,
      costPrice: roomPrice,
      sellingPrice: roomPrice
    })

    // Reset
    setSelectedItem(null)
    setSelectedRoom(null)
    onClose()
  }

  const totalCost = selectedRoom ? getRoomAdultBasePrice(selectedRoom) * nights : 0
  const totalSelling = selectedRoom ? getRoomAdultBasePrice(selectedRoom) * nights : 0

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Hotel className="text-primary" size={24} />
          <span>Seleccionar Hotel</span>
        </ModalHeader>
        
        <ModalBody>
          {!selectedItem ? (
            // Lista de items de inventario
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inventory?.map((item) => (
                <div key={item._id}>
                  {item.rooms && item.rooms.length > 0 ? (
                    // Mostrar cada habitación como una opción separada
                    item.rooms.map((room: any, idx: number) => (
                      <Card 
                        key={`${item._id}-${idx}`}
                        isPressable
                        onPress={() => handleItemClick(item, room)}
                        className="hover:border-primary transition-all mb-3"
                      >
                        <CardBody className="p-0">
                          <div className="flex gap-3">
                            {/* Imagen */}
                            <div className="w-32 h-32 flex-shrink-0 bg-gray-100 relative overflow-hidden">
                              {item.resource?.photos?.[0] ? (
                                <Image
                                  src={item.resource.photos[0]}
                                  alt={item.resource.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Hotel size={40} className="text-gray-300" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 p-3">
                              <h3 className="font-semibold text-sm mb-1">{item.resource?.name}</h3>
                              
                              <div className="flex items-center gap-1 mb-1">
                                <MapPin size={12} className="text-gray-400" />
                                <span className="text-xs text-gray-600">
                                  {item.resource?.location?.city}, {item.resource?.location?.country}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 mb-2">
                                <PackageIcon size={12} className="text-primary" />
                                <span className="text-xs font-semibold text-primary">
                                  {item.supplier?.businessName || item.supplier?.name}
                                </span>
                              </div>

                              {item.resource?.stars && (
                                <div className="flex items-center gap-1 mb-2">
                                  {[...Array(item.resource.stars)].map((_, i) => (
                                    <Star key={i} size={12} className="fill-warning text-warning" />
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2 flex-wrap mb-2">
                                <Chip size="sm" variant="flat" color="secondary">
                                  {room.roomName}
                                </Chip>
                                <Chip size="sm" variant="flat" color="primary">
                                  {room.plan === 'room_only' ? 'Solo Habitación' :
                                   room.plan === 'breakfast' ? 'Desayuno' :
                                   room.plan === 'half_board' ? 'Media Pensión' :
                                   room.plan === 'full_board' ? 'Pensión Completa' :
                                   room.plan === 'all_inclusive' ? 'Todo Incluido' : room.plan}
                                </Chip>
                              </div>

                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xs text-gray-500">Precio por noche</p>
                                  <p className="text-lg font-bold text-primary">${room.priceAdult}</p>
                                </div>
                                <Chip size="sm" color={room.stock > 10 ? 'success' : 'warning'}>
                                  {room.stock} cupos
                                </Chip>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            // Confirmación del item seleccionado
            <div className="space-y-4">
              {/* Item seleccionado */}
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
                          {selectedItem.resource?.location?.city}, {selectedItem.resource?.location?.country}
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

              {/* Detalles */}
              {selectedRoom && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Habitación</p>
                    <Chip color="secondary" variant="flat">{selectedRoom.roomName}</Chip>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Plan</p>
                    <Chip color="primary" variant="flat">
                      {selectedRoom.plan === 'room_only' ? 'Solo Habitación' :
                       selectedRoom.plan === 'breakfast' ? 'Con Desayuno' :
                       selectedRoom.plan === 'half_board' ? 'Media Pensión' :
                       selectedRoom.plan === 'full_board' ? 'Pensión Completa' :
                       selectedRoom.plan === 'all_inclusive' ? 'Todo Incluido' : selectedRoom.plan}
                    </Chip>
                  </div>
                </div>
              )}

              <Input
                type="number"
                label="Número de Noches"
                value={nights.toString()}
                onChange={(e) => setNights(parseInt(e.target.value) || 1)}
                min="1"
                className="max-w-xs"
              />

              {/* Resumen */}
              <Card className="bg-gradient-to-r from-primary/10 to-success/10 border border-primary/20">
                <CardBody className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-600">Total ({nights} noches)</p>
                      <p className="text-3xl font-bold text-primary">${totalSelling.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Costo Total</p>
                      <p className="text-lg text-gray-700">${totalCost.toFixed(2)}</p>
                      <p className="text-sm text-success font-semibold mt-1">
                        Ganancia: ${(totalSelling - totalCost).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {selectedRoom && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Precio por noche:</span>
                        <span className="font-semibold">${selectedRoom.priceAdult}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-600">Disponibilidad:</span>
                        <Chip size="sm" color={selectedRoom.stock > 10 ? 'success' : 'warning'}>
                          {selectedRoom.stock} cupos
                        </Chip>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          {selectedItem && selectedRoom && (
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
