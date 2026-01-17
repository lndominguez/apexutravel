'use client'

import { Button, Select, SelectItem, Chip } from '@heroui/react'
import { Plus, X, Users, Bed, Minus, Baby } from 'lucide-react'

interface RoomReservation {
  id: string
  roomIndex: number
  occupancy: string
  adults: number
  children: number
  infants: number
}

interface RoomReservationsPanelProps {
  selectedRooms: any[]
  roomReservations: RoomReservation[]
  duration: { nights: number; days?: number }
  isPackage?: boolean  // true = precio combo fijo, false = precio por noches
  onAddRoom: () => void
  onRemoveRoom: (id: string) => void
  onUpdateRoom: (id: string, updates: Partial<RoomReservation>) => void
  calculateRoomPrice: (reservation: RoomReservation) => number
}

// Reglas estándar de la industria hotelera:
// - Adultos (18+) y Niños (2-17) SÍ cuentan para la ocupancy
// - Infantes (0-2) NO cuentan para ocupancy (no ocupan cama)
// - Validación: adults + children <= capacidad de la habitación
const OCCUPANCY_LIMITS: Record<string, { maxOccupancy: number; maxInfants: number }> = {
  single: { maxOccupancy: 1, maxInfants: 2 },   // 1 persona (adulto o niño) + hasta 2 infantes
  double: { maxOccupancy: 2, maxInfants: 2 },   // 2 personas (adultos/niños) + hasta 2 infantes
  triple: { maxOccupancy: 3, maxInfants: 2 },   // 3 personas (adultos/niños) + hasta 2 infantes
  quad: { maxOccupancy: 4, maxInfants: 2 }      // 4 personas (adultos/niños) + hasta 2 infantes
}

const MIN_OCCUPANCY: Record<string, number> = {
  single: 1,
  double: 2,
  triple: 3,
  quad: 4
}

export function RoomReservationsPanel({
  selectedRooms,
  roomReservations,
  duration,
  isPackage = false,
  onAddRoom,
  onRemoveRoom,
  onUpdateRoom,
  calculateRoomPrice
}: RoomReservationsPanelProps) {
  const normalizeGuestsForOccupancy = (
    occupancy: string,
    adults: number,
    children: number,
    infants: number
  ) => {
    const limits = OCCUPANCY_LIMITS[occupancy] || { maxOccupancy: 4, maxInfants: 2 }
    const minOcc = MIN_OCCUPANCY[occupancy] || 1

    // Regla clave: si cambias a SINGLE y venías con 2+, debe resetear a 1.
    if (occupancy === 'single' && (adults + children) > 1) {
      return {
        adults: 1,
        children: 0,
        infants: Math.min(infants, limits.maxInfants)
      }
    }

    let nextAdults = Math.max(0, adults)
    let nextChildren = Math.max(0, children)

    // Asegurar mínimo según ocupación
    if ((nextAdults + nextChildren) < minOcc) {
      nextAdults = minOcc
      nextChildren = 0
    }

    // No exceder máximo
    while ((nextAdults + nextChildren) > limits.maxOccupancy) {
      if (nextChildren > 0) nextChildren -= 1
      else nextAdults = Math.max(minOcc, nextAdults - 1)
    }

    // Validación general: al menos 1 persona (adulto o niño)
    if ((nextAdults + nextChildren) < 1) {
      nextAdults = 1
      nextChildren = 0
    }

    return {
      adults: nextAdults,
      children: nextChildren,
      infants: Math.min(Math.max(0, infants), limits.maxInfants)
    }
  }
  
  const getOccupancyLabel = (occ: string) => {
    const labels: Record<string, string> = {
      single: 'Simple',
      double: 'Doble',
      triple: 'Triple',
      quad: 'Cuádruple'
    }
    return labels[occ] || occ
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Habitaciones Seleccionadas</h3>
        {roomReservations.length > 0 && (
          <Chip size="sm" variant="flat" color="primary">
            {roomReservations.length} {roomReservations.length === 1 ? 'habitación' : 'habitaciones'}
          </Chip>
        )}
      </div>

      {roomReservations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Bed size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-3">No hay habitaciones seleccionadas</p>
          <Button
            size="sm"
            color="primary"
            startContent={<Plus size={16} />}
            onPress={onAddRoom}
          >
            Agregar habitación
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {roomReservations.map((reservation, index) => {
            const room = selectedRooms[reservation.roomIndex]
            const pricePerNight = room?.capacityPrices?.[reservation.occupancy] 
              ? (room.capacityPrices[reservation.occupancy].adult * reservation.adults) +
                (room.capacityPrices[reservation.occupancy].child * reservation.children) +
                (room.capacityPrices[reservation.occupancy].infant * reservation.infants)
              : 0
            const totalPrice = calculateRoomPrice(reservation)
            const limits = OCCUPANCY_LIMITS[reservation.occupancy] || { maxOccupancy: 4, maxInfants: 2 }
            const minOcc = MIN_OCCUPANCY[reservation.occupancy] || 1
            const currentOccupancy = reservation.adults + reservation.children
            const remainingOccupancy = limits.maxOccupancy - currentOccupancy

            return (
              <div key={reservation.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#0c3f5b]/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#0c3f5b]/10 rounded-lg">
                      <Bed size={16} className="text-[#0c3f5b]" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Habitación {index + 1}</span>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => onRemoveRoom(reservation.id)}
                  >
                    <X size={16} />
                  </Button>
                </div>

                {/* Selector de habitación */}
                <div className="mb-3">
                  <Select
                    label="Tipo de habitación"
                    selectedKeys={[reservation.roomIndex.toString()]}
                    disallowEmptySelection={true}
                    isRequired
                    onChange={(e) => {
                      const newIndex = parseInt(e.target.value)
                      if (isNaN(newIndex)) return // Prevenir valores inválidos
                      const newRoom = selectedRooms[newIndex]
                      const desiredOccupancy =
                        (newRoom?.occupancy?.includes(reservation.occupancy) ? reservation.occupancy : undefined) ||
                        newRoom?.occupancy?.[0] ||
                        'double'

                      const normalized = normalizeGuestsForOccupancy(
                        desiredOccupancy,
                        reservation.adults,
                        reservation.children,
                        reservation.infants
                      )

                      onUpdateRoom(reservation.id, {
                        roomIndex: newIndex,
                        occupancy: desiredOccupancy,
                        ...normalized
                      })
                    }}
                    size="sm"
                    classNames={{
                      trigger: "border-gray-200",
                      value: "text-sm"
                    }}
                  >
                    {selectedRooms.map((r: any, idx: number) => (
                      <SelectItem key={idx.toString()} textValue={r.name}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{r.name}</span>
                          <span className="text-xs text-gray-500">${r.capacityPrices?.double?.adult || 0}/noche</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Selector de ocupancy */}
                {room?.occupancy && room.occupancy.length > 1 && (
                  <div className="mb-3">
                    <Select
                      label="Ocupación"
                      selectedKeys={[reservation.occupancy]}
                      disallowEmptySelection={true}
                      isRequired
                      onChange={(e) => {
                        const newOccupancy = e.target.value
                        if (!newOccupancy) return // Prevenir valores vacíos
                        const normalized = normalizeGuestsForOccupancy(
                          newOccupancy,
                          reservation.adults,
                          reservation.children,
                          reservation.infants
                        )
                        onUpdateRoom(reservation.id, { occupancy: newOccupancy, ...normalized })
                      }}
                      size="sm"
                      classNames={{
                        trigger: "border-gray-200",
                        value: "text-sm"
                      }}
                    >
                      {room.occupancy.map((occ: string) => (
                        <SelectItem key={occ} textValue={getOccupancyLabel(occ)}>
                          {getOccupancyLabel(occ)}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                )}

             
                {/* Distribución de huéspedes */}
                <div className="space-y-2 mb-3">
                  {/* Adultos */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-[#0c3f5b]" />
                      <span className="text-xs text-gray-700">Adultos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        className="min-w-6 h-6"
                        onPress={() => {
                          const newAdults = Math.max(0, reservation.adults - 1)
                          // Respetar mínimo por ocupación
                          if (newAdults + reservation.children >= minOcc) {
                            onUpdateRoom(reservation.id, { adults: newAdults })
                          }
                        }}
                        isDisabled={reservation.adults === 0 || (reservation.adults - 1 + reservation.children) < minOcc}
                      >
                        <Minus size={12} />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{reservation.adults}</span>
                      <Button
                        isIconOnly
                        size="sm"
                        className="bg-[#0c3f5b] text-white min-w-6 h-6"
                        onPress={() => onUpdateRoom(reservation.id, { 
                          adults: reservation.adults + 1
                        })}
                        isDisabled={currentOccupancy >= limits.maxOccupancy}
                      >
                        <Plus size={12} />
                      </Button>
                    </div>
                  </div>

                  {/* Niños */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Baby size={14} className="text-[#ec9c12]" />
                      <span className="text-xs text-gray-700">Niños (2-17 años)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        className="min-w-6 h-6"
                        onPress={() => {
                          const newChildren = Math.max(0, reservation.children - 1)
                          // Respetar mínimo por ocupación
                          if (reservation.adults + newChildren >= minOcc) {
                            onUpdateRoom(reservation.id, { children: newChildren })
                          }
                        }}
                        isDisabled={reservation.children === 0 || (reservation.adults + reservation.children - 1) < minOcc}
                      >
                        <Minus size={12} />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{reservation.children}</span>
                      <Button
                        isIconOnly
                        size="sm"
                        className="bg-[#ec9c12] text-white min-w-6 h-6"
                        onPress={() => onUpdateRoom(reservation.id, { 
                          children: reservation.children + 1
                        })}
                        isDisabled={currentOccupancy >= limits.maxOccupancy}
                      >
                        <Plus size={12} />
                      </Button>
                    </div>
                  </div>

                  {/* Infantes */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Baby size={14} className="text-[#f1c203]" />
                      <span className="text-xs text-gray-700">Infantes (0-2 años)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        className="min-w-6 h-6"
                        onPress={() => onUpdateRoom(reservation.id, { 
                          infants: Math.max(0, reservation.infants - 1) 
                        })}
                        isDisabled={reservation.infants === 0}
                      >
                        <Minus size={12} />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{reservation.infants}</span>
                      <Button
                        isIconOnly
                        size="sm"
                        className="bg-[#f1c203] text-white min-w-6 h-6"
                        onPress={() => onUpdateRoom(reservation.id, { 
                          infants: reservation.infants + 1
                        })}
                        isDisabled={reservation.infants >= limits.maxInfants}
                      >
                        <Plus size={12} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Precio */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    {isPackage ? (
                      <>
                        <span className="text-gray-600">Precio combo</span>
                        <span className="font-bold text-[#0c3f5b]">${totalPrice.toFixed(2)}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-600">${pricePerNight.toFixed(2)} × {duration.nights} noches</span>
                        <span className="font-bold text-[#0c3f5b]">${totalPrice.toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Botón agregar otra habitación */}
          <Button
            variant="bordered"
            className="w-full border-2 border-dashed border-gray-300 hover:border-[#0c3f5b] hover:bg-[#0c3f5b]/5"
            startContent={<Plus size={16} />}
            onPress={onAddRoom}
          >
            Agregar otra habitación
          </Button>
        </div>
      )}
    </div>
  )
}
