'use client'

import { Button, Chip } from '@heroui/react'
import { Plus, X, Bed, Eye } from 'lucide-react'
import { useState } from 'react'
import { RoomSelectionModal } from './RoomSelectionModal'

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
  onAddRoom: (roomData?: Partial<RoomReservation>) => void
  onRemoveRoom: (id: string) => void
  onUpdateRoom: (id: string, updates: Partial<RoomReservation>) => void
  calculateRoomPrice: (reservation: RoomReservation) => number
}

// Reglas estándar de la industria hotelera:
// - Adultos (18+) y Niños (2-17) SÍ cuentan para la ocupancy
// - Infantes (0-2) NO cuentan para ocupancy (no ocupan cama)
// - El tipo de habitación define la cantidad EXACTA de personas:
//   * Single = 1 persona (1 adulto o 1 niño)
//   * Double = 2 personas (2 adultos, 1 adulto + 1 niño, o 2 niños)
//   * Triple = 3 personas
//   * Quad = 4 personas
// - Una persona NO puede reservar una habitación doble (el hotel perdería dinero)
// - El precio es por tipo de habitación, no por capacidad máxima
const OCCUPANCY_LIMITS: Record<string, { maxOccupancy: number; maxInfants: number }> = {
  single: { maxOccupancy: 1, maxInfants: 2 },   // 1 persona (adulto o niño) + hasta 2 infantes
  double: { maxOccupancy: 2, maxInfants: 2 },   // 2 personas (adultos/niños) + hasta 2 infantes
  triple: { maxOccupancy: 3, maxInfants: 2 },   // 3 personas (adultos/niños) + hasta 2 infantes
  quad: { maxOccupancy: 4, maxInfants: 2 }      // 4 personas (adultos/niños) + hasta 2 infantes
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingRoomIndex, setViewingRoomIndex] = useState<number | null>(null)
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null)

  const handleSelectRoom = (roomIndex: number, adults: number, children: number, infants: number) => {
    // Determinar la ocupancy según la cantidad de personas
    const totalGuests = adults + children
    const room = selectedRooms[roomIndex]
    
    let occupancy = 'double'
    if (room?.occupancy && room.occupancy.length > 0) {
      // Buscar la ocupancy que mejor se ajuste
      if (totalGuests === 1 && room.occupancy.includes('single')) occupancy = 'single'
      else if (totalGuests === 2 && room.occupancy.includes('double')) occupancy = 'double'
      else if (totalGuests === 3 && room.occupancy.includes('triple')) occupancy = 'triple'
      else if (totalGuests === 4 && room.occupancy.includes('quad')) occupancy = 'quad'
      else occupancy = room.occupancy[0]
    }

    if (editingReservationId) {
      onUpdateRoom(editingReservationId, {
        roomIndex,
        occupancy,
        adults,
        children,
        infants
      })
    } else {
      // Agregar nueva habitación con todos los datos
      onAddRoom({
        roomIndex,
        occupancy,
        adults,
        children,
        infants
      })
    }
    
    // Cerrar el modal
    setIsModalOpen(false)
    setEditingReservationId(null)
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
            onPress={() => {
              setEditingReservationId(null)
              setViewingRoomIndex(null)
              setIsModalOpen(true)
            }}
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
            const currentOccupancy = reservation.adults + reservation.children

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
              <div key={reservation.id} className="bg-white border-2 border-[#0c3f5b] rounded-xl p-4 shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-[#0c3f5b] rounded-lg">
                        <Bed size={16} className="text-white" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">Habitación {index + 1}</span>
                    </div>
                    <p className="text-sm text-default-700 font-medium ml-8">{room?.name || 'Sin nombre'}</p>
                    <p className="text-xs text-default-500 ml-8">
                      {reservation.adults} adulto{reservation.adults !== 1 ? 's' : ''}
                      {reservation.children > 0 && `, ${reservation.children} niño${reservation.children !== 1 ? 's' : ''}`}
                      {reservation.infants > 0 && `, ${reservation.infants} infante${reservation.infants !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => {
                        setEditingReservationId(reservation.id)
                        setViewingRoomIndex(reservation.roomIndex)
                        setIsModalOpen(true)
                      }}
                      title="Ver detalles"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => onRemoveRoom(reservation.id)}
                      title="Eliminar"
                    >
                      <X size={16} />
                    </Button>
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
            onPress={() => {
              setEditingReservationId(null)
              setViewingRoomIndex(null)
              setIsModalOpen(true)
            }}
          >
            Agregar otra habitación
          </Button>
        </div>
      )}

      {/* Modal de selección de habitaciones */}
      <RoomSelectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setViewingRoomIndex(null)
          setEditingReservationId(null)
        }}
        availableRooms={selectedRooms}
        onSelectRoom={handleSelectRoom}
        selectedRoomIndexes={viewingRoomIndex !== null ? [viewingRoomIndex] : []}
      />
    </div>
  )
}
