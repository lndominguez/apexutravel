'use client'

import { Modal, ModalContent, ModalHeader, ModalBody, Button, Card, CardBody, Chip } from '@heroui/react'
import { Users, Baby, Plus, Minus, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface RoomSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  availableRooms: any[]
  onSelectRoom: (roomIndex: number, adults: number, children: number, infants: number) => void
  selectedRoomIndexes?: number[] // Índices de habitaciones ya seleccionadas
}

const OCCUPANCY_LIMITS: Record<string, { maxOccupancy: number; maxInfants: number }> = {
  single: { maxOccupancy: 1, maxInfants: 2 },
  double: { maxOccupancy: 2, maxInfants: 2 },
  triple: { maxOccupancy: 3, maxInfants: 2 },
  quad: { maxOccupancy: 4, maxInfants: 2 }
}

export function RoomSelectionModal({ isOpen, onClose, availableRooms, onSelectRoom, selectedRoomIndexes = [] }: RoomSelectionModalProps) {
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [photoIndexes, setPhotoIndexes] = useState<Record<number, number>>({})

  const totalGuests = adults + children

  // Determinar qué tipo de ocupación se necesita según la cantidad de personas
  const getRequiredOccupancy = (guests: number): string => {
    if (guests === 1) return 'single'
    if (guests === 2) return 'double'
    if (guests === 3) return 'triple'
    if (guests === 4) return 'quad'
    return 'quad' // Default para más de 4
  }

  const requiredOccupancy = getRequiredOccupancy(totalGuests)

  // Filtrar habitaciones que tengan el tipo de ocupación requerido
  const filteredRooms = availableRooms.filter((room) => {
    return room?.occupancy?.includes(requiredOccupancy)
  })

  const handleSelectRoom = (roomIndex: number) => {
    onSelectRoom(roomIndex, adults, children, infants)
    onClose()
    // Reset para próxima vez
    setAdults(2)
    setChildren(0)
    setInfants(0)
    setPhotoIndexes({})
  }

  const getOccupancyLabel = (occ: string): string => {
    const labels: Record<string, string> = {
      single: 'Simple',
      double: 'Doble',
      triple: 'Triple',
      quad: 'Cuádruple'
    }
    return labels[occ] || occ
  }

  const handlePrevPhoto = (roomIndex: number, photoCount: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setPhotoIndexes(prev => ({
      ...prev,
      [roomIndex]: ((prev[roomIndex] || 0) - 1 + photoCount) % photoCount
    }))
  }

  const handleNextPhoto = (roomIndex: number, photoCount: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setPhotoIndexes(prev => ({
      ...prev,
      [roomIndex]: ((prev[roomIndex] || 0) + 1) % photoCount
    }))
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-default-200">
          <h3 className="text-xl font-bold">Seleccionar Habitación</h3>
          <p className="text-sm text-default-500 font-normal">Elige la cantidad de personas y selecciona una habitación</p>
        </ModalHeader>
        <ModalBody className="py-6">
          {/* Selector de personas */}
          <div className="bg-default-50 rounded-xl p-5 mb-6 border border-default-200">
            <h4 className="text-sm font-semibold text-default-700 mb-4">¿Cuántas personas?</h4>
            <div className="grid grid-cols-3 gap-4">
              {/* Adultos */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#0c3f5b]" />
                  <span className="text-sm font-medium text-default-700">Adultos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="min-w-8 h-8"
                    onPress={() => setAdults(Math.max(1, adults - 1))}
                    isDisabled={adults === 1}
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-8 text-center text-base font-bold">{adults}</span>
                  <Button
                    isIconOnly
                    size="sm"
                    className="bg-[#0c3f5b] text-white min-w-8 h-8"
                    onPress={() => setAdults(adults + 1)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              {/* Niños */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Baby size={16} className="text-[#ec9c12]" />
                  <span className="text-sm font-medium text-default-700">Niños (2-17)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="min-w-8 h-8"
                    onPress={() => setChildren(Math.max(0, children - 1))}
                    isDisabled={children === 0}
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-8 text-center text-base font-bold">{children}</span>
                  <Button
                    isIconOnly
                    size="sm"
                    className="bg-[#ec9c12] text-white min-w-8 h-8"
                    onPress={() => setChildren(children + 1)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              {/* Infantes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Baby size={16} className="text-[#f1c203]" />
                  <span className="text-sm font-medium text-default-700">Infantes (0-2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="min-w-8 h-8"
                    onPress={() => setInfants(Math.max(0, infants - 1))}
                    isDisabled={infants === 0}
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-8 text-center text-base font-bold">{infants}</span>
                  <Button
                    isIconOnly
                    size="sm"
                    className="bg-[#f1c203] text-white min-w-8 h-8"
                    onPress={() => setInfants(infants + 1)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-3 p-2 bg-white rounded-lg border border-default-200">
              <p className="text-xs text-default-600">
                <span className="font-semibold">Total:</span> {totalGuests} persona{totalGuests !== 1 ? 's' : ''} 
                {infants > 0 && <span className="text-default-500"> + {infants} infante{infants !== 1 ? 's' : ''} (no cuentan para ocupación)</span>}
              </p>
            </div>
          </div>

          {/* Habitaciones disponibles */}
          <div>
            <h4 className="text-sm font-semibold text-default-700 mb-3">
              Habitaciones disponibles ({filteredRooms.length})
            </h4>

            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-sm text-orange-800 font-medium mb-1">
                  ⚠️ No hay habitaciones disponibles para {totalGuests} persona{totalGuests !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-orange-600">
                  Reduce la cantidad de huéspedes o contacta al hotel para opciones especiales.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRooms.map((room, index) => {
                  const actualIndex = availableRooms.findIndex(r => r === room)
                  const basePrice = room.capacityPrices?.[requiredOccupancy]?.adult || 0
                  const currentPhotoIndex = photoIndexes[actualIndex] || 0
                  const hasPhotos = room.images && room.images.length > 0
                  const photoCount = hasPhotos ? room.images.length : 0
                  const isSelected = selectedRoomIndexes.includes(actualIndex)

                  return (
                    <Card 
                      key={actualIndex} 
                      isPressable
                      onPress={() => handleSelectRoom(actualIndex)}
                      className={`border-2 transition-all ${
                        isSelected 
                          ? 'border-[#0c3f5b] ring-2 ring-[#0c3f5b]/30' 
                          : 'border-default-200 hover:border-[#0c3f5b]'
                      }`}
                    >
                      <CardBody className="p-0">
                        {/* Card con imagen de fondo */}
                        <div className="relative h-48 overflow-hidden rounded-lg group">
                          {/* Imagen de fondo */}
                          {hasPhotos ? (
                            <img
                              src={room.images[currentPhotoIndex]}
                              alt={`${room.name} - Foto ${currentPhotoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                          )}
                          
                          {/* Overlay oscuro */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          
                          {/* Badge de seleccionada */}
                          {isSelected && (
                            <div className="absolute top-3 right-3 bg-[#0c3f5b] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                              <Check size={14} />
                              <span className="text-xs font-bold">Seleccionada</span>
                            </div>
                          )}
                          
                          {/* Controles del carousel */}
                          {hasPhotos && photoCount > 1 && (
                            <>
                              <div
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1.5 hover:bg-black/70 z-10 cursor-pointer"
                                onClick={(e) => handlePrevPhoto(actualIndex, photoCount, e)}
                              >
                                <ChevronLeft size={16} />
                              </div>
                              <div
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1.5 hover:bg-black/70 z-10 cursor-pointer"
                                onClick={(e) => handleNextPhoto(actualIndex, photoCount, e)}
                              >
                                <ChevronRight size={16} />
                              </div>
                              
                              {/* Puntos indicadores */}
                              <div className="absolute top-3 left-3 flex gap-1">
                                {Array.from({ length: Math.min(photoCount, 5) }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                                      idx === currentPhotoIndex ? 'bg-white w-4' : 'bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                          
                          {/* Info superpuesta */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="font-bold text-lg mb-1 drop-shadow-lg">{room.name}</h5>
                                <div className="flex items-center gap-2">
                                  <Chip 
                                    size="sm" 
                                    className="bg-white/20 backdrop-blur-sm text-white border border-white/30 h-5"
                                  >
                                    {getOccupancyLabel(requiredOccupancy)}
                                  </Chip>
                                  <div className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                                    <Users size={12} />
                                    <span className="text-xs font-semibold">{totalGuests}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-xs text-white/80 mb-0.5">Desde</p>
                                <p className="text-2xl font-bold drop-shadow-lg">
                                  ${basePrice.toFixed(2)}
                                  <span className="text-sm font-normal text-white/90">/noche</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30">
                                <Check size={16} />
                                <span className="text-xs font-bold">Seleccionar</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
