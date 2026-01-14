import { motion } from 'framer-motion'
import { Input, RadioGroup, Radio, Textarea } from '@heroui/react'
import { DollarSign, Hotel as HotelIcon, MapPin, Star, TrendingUp, Percent, FileText, Sun, Moon } from 'lucide-react'
import { PackageJourneyState } from '../hooks/usePackageJourneyState'

interface HotelMarkupConfigStepProps {
  state: PackageJourneyState | any
  calculateTotalCost: () => number
  calculateTotalSelling: () => number
}

export function HotelMarkupConfigStep({ state, calculateTotalCost, calculateTotalSelling }: HotelMarkupConfigStepProps) {
  const costBase = calculateTotalCost()
  const precioVenta = calculateTotalSelling()
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-full flex flex-col"
    >
      {/* Info del hotel */}
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-dashed border-default-300">
        <HotelIcon size={16} className="text-success" />
        <p className="text-sm font-semibold">{state.selectedHotel?.resource?.name}</p>
        <div className="flex items-center gap-1.5 text-default-500 ml-auto">
          <MapPin size={10} />
          <span className="text-xs">{state.destination.city}</span>
          <span className="text-xs">•</span>
          <Star size={10} className="text-warning fill-warning" />
          <span className="text-xs">{state.selectedHotel?.resource?.stars}★</span>
        </div>
      </div>

      {/* Contenido dividido en 2 columnas */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Columna 1: Duración del paquete */}
          <div className="border-r border-dashed border-default-300 pr-8">
            <div className="flex items-center gap-2 mb-3">
              <Sun size={16} className="text-warning" />
              <h4 className="text-sm font-bold">Duración del Paquete</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                label="Días"
                value={state.days?.toString() || '5'}
                onValueChange={(value) => state.setDays?.(parseInt(value) || 5)}
                size="sm"
                min={1}
                startContent={<Sun size={14} className="text-warning" />}
              />
              
              <Input
                type="number"
                label="Noches"
                value={state.nights?.toString() || '4'}
                onValueChange={(value) => state.setNights?.(parseInt(value) || 4)}
                size="sm"
                min={1}
                startContent={<Moon size={14} className="text-primary" />}
              />
            </div>
            
            <p className="text-xs text-default-500 mt-2">
              El precio del hotel ya incluye estos días/noches
            </p>
          </div>

          {/* Columna 2: Configuración de Markup y Pricing */}
          <div className="pl-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-warning" />
                <h4 className="text-sm font-bold">Configuración de Markup</h4>
              </div>
              
              {/* Selectores horizontales */}
              <RadioGroup
                value={state.hotelMarkup.type}
                onValueChange={(value) => state.setHotelMarkup({ ...state.hotelMarkup, type: value })}
                orientation="horizontal"
              >
                <Radio value="percentage">
                  <div className="flex items-center gap-2">
                    <Percent size={16} className="text-primary" />
                    <span className="text-sm">Porcentaje</span>
                  </div>
                </Radio>
                
                <Radio value="fixed">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-success" />
                    <span className="text-sm">Monto Fijo</span>
                  </div>
                </Radio>
              </RadioGroup>
              
              {/* Input debajo - width reducido */}
              <div className="mt-3 max-w-[200px]">
                <Input
                  type="number"
                  label="Valor"
                  placeholder={state.hotelMarkup.type === 'percentage' ? '10' : '100'}
                  value={state.hotelMarkup.value.toString()}
                  onValueChange={(value) => state.setHotelMarkup({ ...state.hotelMarkup, value: parseFloat(value) || 0 })}
                  startContent={
                    state.hotelMarkup.type === 'percentage' ? (
                      <Percent size={16} className="text-primary" />
                    ) : (
                      <DollarSign size={16} className="text-success" />
                    )
                  }
                  size="sm"
                />
                <p className="text-xs text-default-500 mt-2">
                  {state.hotelMarkup.type === 'percentage' 
                    ? `${state.hotelMarkup.value}% sobre el costo`
                    : `+$${state.hotelMarkup.value} USD`
                  }
                </p>
              </div>
            </div>
            
            {/* Preview de Precios por Habitación */}
            <div className="p-4 bg-default-100 rounded-lg border border-default-200 max-h-[400px] overflow-y-auto">
              <h5 className="text-xs font-bold text-default-600 mb-3">Preview de Precios por Habitación</h5>
              
              <div className="space-y-4">
                {state.selectedHotel?.rooms?.map((room: any, idx: number) => {
                  const applyMarkup = (basePrice: number) => {
                    if (state.hotelMarkup.type === 'percentage') {
                      return basePrice + (basePrice * state.hotelMarkup.value / 100)
                    }
                    return basePrice + state.hotelMarkup.value
                  }
                  
                  return (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-default-200">
                      <p className="text-xs font-bold text-default-700 mb-2">{room.roomName}</p>
                      
                      {/* Precios Doble */}
                      {room.capacityPrices?.double && (
                        <div className="mb-2">
                          <p className="text-xs text-default-500 mb-1">Ocupación Doble:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-default-600">Adulto:</span>
                              <div className="flex items-center gap-1">
                                <span className="line-through text-default-400">${room.capacityPrices.double.adult}</span>
                                <span className="font-semibold text-success">${applyMarkup(room.capacityPrices.double.adult).toFixed(2)}</span>
                              </div>
                            </div>
                            {room.capacityPrices.double.child > 0 && (
                              <div>
                                <span className="text-default-600">Niño:</span>
                                <div className="flex items-center gap-1">
                                  <span className="line-through text-default-400">${room.capacityPrices.double.child}</span>
                                  <span className="font-semibold text-success">${applyMarkup(room.capacityPrices.double.child).toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Precios Single */}
                      {room.capacityPrices?.single && (
                        <div>
                          <p className="text-xs text-default-500 mb-1">Ocupación Simple:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-default-600">Adulto:</span>
                              <div className="flex items-center gap-1">
                                <span className="line-through text-default-400">${room.capacityPrices.single.adult}</span>
                                <span className="font-semibold text-success">${applyMarkup(room.capacityPrices.single.adult).toFixed(2)}</span>
                              </div>
                            </div>
                            {room.capacityPrices.single.child > 0 && (
                              <div>
                                <span className="text-default-600">Niño:</span>
                                <div className="flex items-center gap-1">
                                  <span className="line-through text-default-400">${room.capacityPrices.single.child}</span>
                                  <span className="font-semibold text-success">${applyMarkup(room.capacityPrices.single.child).toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {/* Resumen del Markup */}
                <div className="pt-3 border-t border-default-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-default-600">Markup aplicado:</span>
                    <span className="font-semibold text-primary">
                      {state.hotelMarkup.type === 'percentage' 
                        ? `+${state.hotelMarkup.value}%`
                        : `+$${state.hotelMarkup.value} USD`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
