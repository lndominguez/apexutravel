'use client'

import { useState } from 'react'
import { Card, CardBody, Input, Chip, Button, Select, SelectItem, Switch } from '@heroui/react'
import { Hotel, Users, Bed, Plus, X, Package, Moon } from 'lucide-react'

interface CapacityPricing {
  adult: number
  child: number
  infant: number
}

interface RoomConfig {
  roomName: string
  stock: number
  capacityPrices: { [key: string]: CapacityPricing }
}

interface HotelInventoryFormProps {
  hotel: any
  roomConfigs: { [key: string]: RoomConfig }
  onRoomConfigChange: (configs: any) => void
  pricingMode: 'per_night' | 'package'
  onPricingModeChange: (mode: 'per_night' | 'package') => void
}

export default function HotelInventoryForm({
  hotel,
  roomConfigs,
  onRoomConfigChange,
  pricingMode,
  onPricingModeChange
}: HotelInventoryFormProps) {
  const [selectedRoomToAdd, setSelectedRoomToAdd] = useState<string>('')

  const addRoomConfig = (roomId: string) => {
    if (!roomId || roomConfigs[roomId]) return
    
    const room = hotel.roomTypes.find((r: any) => (r._id || r.id) === roomId)
    if (!room) return

    // Inicializar con precios vacíos para cada capacidad
    const initialCapacityPrices: { [key: string]: CapacityPricing } = {}
    const occupancies = Array.isArray(room.occupancy) ? room.occupancy : []
    occupancies.forEach((occ: string) => {
      initialCapacityPrices[occ] = { adult: 0, child: 0, infant: 0 }
    })

    onRoomConfigChange({
      ...roomConfigs,
      [roomId]: {
        roomName: room.name,
        stock: 0,
        capacityPrices: initialCapacityPrices
      }
    })
    setSelectedRoomToAdd('')
  }

  const removeRoomConfig = (roomId: string) => {
    const newConfigs = { ...roomConfigs }
    delete newConfigs[roomId]
    onRoomConfigChange(newConfigs)
  }

  const updateRoomConfig = (roomId: string, field: keyof RoomConfig, value: any) => {
    const currentConfig = roomConfigs[roomId] || {
      roomName: '',
      stock: 0,
      capacityPrices: {}
    }

    onRoomConfigChange({
      ...roomConfigs,
      [roomId]: {
        ...currentConfig,
        [field]: value
      }
    })
  }

  const updateCapacityPrice = (roomId: string, capacity: string, personType: 'adult' | 'child' | 'infant', price: number) => {
    const currentConfig = roomConfigs[roomId] || {
      roomName: '',
      stock: 0,
      capacityPrices: {}
    }

    const currentCapacityPricing = currentConfig.capacityPrices[capacity] || { adult: 0, child: 0, infant: 0 }

    onRoomConfigChange({
      ...roomConfigs,
      [roomId]: {
        ...currentConfig,
        capacityPrices: {
          ...currentConfig.capacityPrices,
          [capacity]: {
            ...currentCapacityPricing,
            [personType]: price
          }
        }
      }
    })
  }


  const getOccupancyLabel = (occupancy: string) => {
    const labels: { [key: string]: string } = {
      'single': 'Simple',
      'double': 'Doble',
      'triple': 'Triple',
      'quad': 'Cuádruple'
    }
    return labels[occupancy] || occupancy
  }


  if (!hotel?.roomTypes || hotel.roomTypes.length === 0) {
    return (
      <div className="text-center text-default-500 py-8">
        Este hotel no tiene tipos de habitación configurados
      </div>
    )
  }

  const availableRooms = hotel.roomTypes.filter((room: any) => {
    const roomId = room._id || room.id
    return !roomConfigs[roomId]
  })

  const addedRoomIds = Object.keys(roomConfigs)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Hotel size={20} className="text-primary" />
            <h3 className="font-semibold text-lg">Configuración de Inventario</h3>
            <Chip size="sm" variant="flat" color="primary">{addedRoomIds.length} configuradas</Chip>
          </div>
          
          <div className="flex items-center gap-2">
            <Moon size={16} className={pricingMode === 'per_night' ? 'text-primary' : 'text-default-400'} />
            <Switch
              size="sm"
              isSelected={pricingMode === 'package'}
              onValueChange={(checked) => onPricingModeChange(checked ? 'package' : 'per_night')}
            />
            <Package size={16} className={pricingMode === 'package' ? 'text-primary' : 'text-default-400'} />
            <span className="text-xs font-medium text-default-600">
              {pricingMode === 'package' ? 'Precio x Oferta' : 'Precio x Noche'}
            </span>
          </div>
        </div>
        
        {availableRooms.length > 0 && (
          <div className="flex gap-2 items-center">
            <Select
              placeholder="Seleccionar habitación"
              size="sm"
              className="w-64"
              selectedKeys={selectedRoomToAdd ? [selectedRoomToAdd] : []}
              onChange={(e) => setSelectedRoomToAdd(e.target.value)}
            >
              {availableRooms.map((room: any) => (
                <SelectItem key={room._id || room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </Select>
            <Button
              color="primary"
              size="sm"
              startContent={<Plus size={16} />}
              onPress={() => addRoomConfig(selectedRoomToAdd)}
              isDisabled={!selectedRoomToAdd}
            >
              Añadir
            </Button>
          </div>
        )}
      </div>

      {addedRoomIds.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center text-default-400">
            <Hotel size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay habitaciones configuradas</p>
            <p className="text-xs mt-1">Usa el selector de arriba para añadir habitaciones</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {addedRoomIds.map((roomId) => {
            const room = hotel.roomTypes.find((r: any) => (r._id || r.id) === roomId)
            if (!room) return null
            
            const config = roomConfigs[roomId]
            const occupancies = Array.isArray(room.occupancy) ? room.occupancy : []

            return (
            <Card key={roomId}>
              <CardBody className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{room.name}</h4>
                    <p className="text-xs text-default-500 line-clamp-1">{room.description}</p>
                  </div>
                  <div className="flex gap-2 items-end">
                    <Input
                      type="number"
                      label="Stock"
                      size="sm"
                      className="w-20"
                      min="0"
                      value={config.stock?.toString() || '0'}
                      onChange={(e) => updateRoomConfig(roomId, 'stock', parseInt(e.target.value) || 0)}
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => removeRoomConfig(roomId)}
                      className="min-w-unit-8 w-8 h-8"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>

                {/* Precios por Capacidad */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Bed size={16} className="text-primary" />
                    <h5 className="text-xs font-semibold text-default-600">PRECIOS POR CAPACIDAD</h5>
                  </div>
                  
                  {occupancies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {occupancies.map((occ: string) => {
                        const pricing = config.capacityPrices[occ] || { adult: 0, child: 0, infant: 0 }
                        return (
                          <div key={occ} className="border border-default-200 rounded-lg p-3 bg-default-50">
                            <h6 className="text-xs font-semibold text-default-700 mb-3 flex items-center gap-1 justify-center">
                              <Users size={14} />
                              {getOccupancyLabel(occ)}
                            </h6>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                label="Adulto"
                                size="sm"
                                startContent="$"
                                value={pricing.adult?.toString() || '0'}
                                onChange={(e) => updateCapacityPrice(roomId, occ, 'adult', parseFloat(e.target.value) || 0)}
                              />
                              <Input
                                type="number"
                                label="Niño"
                                size="sm"
                                startContent="$"
                                value={pricing.child?.toString() || '0'}
                                onChange={(e) => updateCapacityPrice(roomId, occ, 'child', parseFloat(e.target.value) || 0)}
                              />
                              <Input
                                type="number"
                                label="Infante"
                                size="sm"
                                startContent="$"
                                value={pricing.infant?.toString() || '0'}
                                onChange={(e) => updateCapacityPrice(roomId, occ, 'infant', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-default-400">Sin capacidades configuradas</p>
                  )}
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
      )}
    </div>
  )
}
