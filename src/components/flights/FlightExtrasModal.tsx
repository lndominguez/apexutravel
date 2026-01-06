'use client'

import { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Divider } from '@heroui/react'
import { Plus, Minus, Luggage, Briefcase } from 'lucide-react'

interface SelectedClass {
  type: string
  price: number
  currency: string
  baggage: {
    carry: string
    checked: string
  }
  seatSelection?: boolean
}

interface FlightExtrasModalProps {
  isOpen: boolean
  onClose: () => void
  flightNumber: string
  airlineName: string
  selectedClass: SelectedClass
  passengers: number
  onContinue: (extras: { additionalBaggage: number[]; selectedSeats?: string[] }) => void
}

export default function FlightExtrasModal({
  isOpen,
  onClose,
  flightNumber,
  airlineName,
  selectedClass,
  passengers,
  onContinue
}: FlightExtrasModalProps) {
  // Estado para maletas adicionales por pasajero
  const [additionalBaggage, setAdditionalBaggage] = useState<number[]>(Array(passengers).fill(0))
  
  // Precio por maleta adicional (esto debería venir del backend)
  const baggagePrice = 25 // USD por maleta

  const handleBaggageChange = (passengerIndex: number, increment: boolean) => {
    setAdditionalBaggage(prev => {
      const newBaggage = [...prev]
      if (increment) {
        newBaggage[passengerIndex] = Math.min(newBaggage[passengerIndex] + 1, 5) // Máximo 5 maletas adicionales
      } else {
        newBaggage[passengerIndex] = Math.max(newBaggage[passengerIndex] - 1, 0)
      }
      return newBaggage
    })
  }

  const totalAdditionalBaggage = additionalBaggage.reduce((sum, count) => sum + count, 0)
  const totalBaggageCost = totalAdditionalBaggage * baggagePrice

  const handleContinue = () => {
    onContinue({
      additionalBaggage,
      selectedSeats: undefined // TODO: Implementar selección de asientos
    })
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-background",
        header: "border-b border-divider",
        body: "py-6",
        footer: "border-t border-divider"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold">Configura tu vuelo</h3>
          <p className="text-sm text-foreground/60 font-normal">
            {airlineName} • Vuelo {flightNumber}
          </p>
        </ModalHeader>
        
        <ModalBody>
          {/* Resumen de clase seleccionada */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground/80">Clase seleccionada</div>
                <div className="text-lg font-bold text-primary capitalize">{selectedClass.type.replace('_', ' ')}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${selectedClass.price.toLocaleString()}</div>
                <div className="text-xs text-foreground/60">{selectedClass.currency}</div>
              </div>
            </div>
            
            <Divider className="my-3" />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase size={16} className="text-primary/70" />
                <span className="text-foreground/80">Equipaje de mano: {selectedClass.baggage.carry}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Luggage size={16} className="text-primary/70" />
                <span className="text-foreground/80">Equipaje facturado: {selectedClass.baggage.checked}</span>
              </div>
            </div>
          </div>

          {/* Maletas adicionales */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4">Maletas adicionales</h4>
            <p className="text-sm text-foreground/60 mb-4">
              Agrega maletas adicionales por ${baggagePrice} {selectedClass.currency} cada una
            </p>
            
            <div className="space-y-3">
              {Array.from({ length: passengers }).map((_, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-default-50 rounded-lg"
                >
                  <div>
                    <div className="font-semibold">Pasajero {index + 1}</div>
                    <div className="text-xs text-foreground/60">
                      {additionalBaggage[index] > 0 
                        ? `${additionalBaggage[index]} maleta${additionalBaggage[index] > 1 ? 's' : ''} adicional${additionalBaggage[index] > 1 ? 'es' : ''}`
                        : 'Sin maletas adicionales'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => handleBaggageChange(index, false)}
                      isDisabled={additionalBaggage[index] === 0}
                    >
                      <Minus size={16} />
                    </Button>
                    
                    <div className="w-12 text-center font-bold text-lg">
                      {additionalBaggage[index]}
                    </div>
                    
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => handleBaggageChange(index, true)}
                      isDisabled={additionalBaggage[index] === 5}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selección de asientos */}
          {selectedClass.seatSelection && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4">Selección de asientos</h4>
              <div className="bg-default-50 rounded-lg p-6 text-center">
                <p className="text-foreground/60">
                  La selección de asientos estará disponible en el siguiente paso
                </p>
              </div>
            </div>
          )}

          {/* Resumen de costos */}
          {totalAdditionalBaggage > 0 && (
            <div className="bg-default-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground/80">Clase {selectedClass.type.replace('_', ' ')}</span>
                <span className="font-semibold">${selectedClass.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground/80">
                  Maletas adicionales ({totalAdditionalBaggage})
                </span>
                <span className="font-semibold">${totalBaggageCost.toLocaleString()}</span>
              </div>
              <Divider className="my-2" />
              <div className="flex items-center justify-between">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold text-primary">
                  ${(selectedClass.price + totalBaggageCost).toLocaleString()} {selectedClass.currency}
                </span>
              </div>
            </div>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleContinue}>
            Continuar con datos de pasajeros
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
