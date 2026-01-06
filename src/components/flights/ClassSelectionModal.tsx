'use client'

import { Modal, ModalContent, ModalHeader, ModalBody, Button, Chip } from '@heroui/react'
import { Check, Briefcase, Luggage, Wifi, Utensils, Tv, Zap, Users } from 'lucide-react'

interface FlightClass {
  type: 'economy' | 'premium_economy' | 'business' | 'first'
  availableSeats: number
  sellingPrice: number
  sellingCurrency: string
  baggage: {
    carry: string
    checked: string
  }
  seatSelection?: boolean
  amenities: string[]
}

interface ClassSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  flightNumber: string
  airlineName: string
  classes: FlightClass[]
  defaultClass?: string
  onSelectClass: (classType: string, price: number, currency: string) => void
}

const getAmenityIcon = (amenity: string) => {
  const amenityLower = amenity.toLowerCase()
  if (amenityLower.includes('wifi')) return <Wifi size={14} />
  if (amenityLower.includes('meal') || amenityLower.includes('dining') || amenityLower.includes('snack')) return <Utensils size={14} />
  if (amenityLower.includes('entertainment')) return <Tv size={14} />
  if (amenityLower.includes('usb') || amenityLower.includes('charging') || amenityLower.includes('power')) return <Zap size={14} />
  if (amenityLower.includes('lounge')) return <Users size={14} />
  return null
}

const translateClassType = (type: string): string => {
  const translations: { [key: string]: string } = {
    'economy': 'Económica',
    'premium_economy': 'Económica Premium',
    'business': 'Ejecutiva',
    'first': 'Primera Clase'
  }
  return translations[type] || type
}

const getClassColor = (type: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
  const colors: { [key: string]: "default" | "primary" | "secondary" | "success" | "warning" | "danger" } = {
    'economy': 'default',
    'premium_economy': 'primary',
    'business': 'secondary',
    'first': 'warning'
  }
  return colors[type] || 'default'
}

export default function ClassSelectionModal({
  isOpen,
  onClose,
  flightNumber,
  airlineName,
  classes,
  defaultClass = 'economy',
  onSelectClass
}: ClassSelectionModalProps) {
  
  const handleSelectClass = (classType: string, price: number, currency: string) => {
    onSelectClass(classType, price, currency)
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-background",
        header: "border-b border-divider",
        body: "py-6",
        closeButton: "hover:bg-default/50"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold">Selecciona tu clase de viaje</h3>
          <p className="text-sm text-foreground/60 font-normal">
            {airlineName} • Vuelo {flightNumber}
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((flightClass) => {
              const isDefault = flightClass.type === defaultClass
              const isLowSeats = flightClass.availableSeats <= 5
              
              return (
                <div
                  key={flightClass.type}
                  className={`relative border-2 rounded-xl p-4 transition-all hover:shadow-lg ${
                    isDefault 
                      ? 'border-primary bg-primary/5' 
                      : 'border-divider hover:border-primary/50'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Chip 
                        size="sm" 
                        color={getClassColor(flightClass.type)}
                        variant="flat"
                        className="mb-2"
                      >
                        {translateClassType(flightClass.type)}
                      </Chip>
                      {isDefault && (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <Check size={12} />
                          <span>Precio mostrado</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        ${flightClass.sellingPrice.toLocaleString()}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {flightClass.sellingCurrency}
                      </div>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mb-3">
                    {isLowSeats ? (
                      <Chip size="sm" color="warning" variant="flat" className="text-xs">
                        Solo {flightClass.availableSeats} asientos disponibles
                      </Chip>
                    ) : (
                      <div className="text-xs text-foreground/60">
                        {flightClass.availableSeats} asientos disponibles
                      </div>
                    )}
                  </div>

                  {/* Baggage */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Briefcase size={14} className="text-foreground/60" />
                      <span className="text-foreground/80">Equipaje de mano: {flightClass.baggage.carry}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Luggage size={14} className="text-foreground/60" />
                      <span className="text-foreground/80">Equipaje facturado: {flightClass.baggage.checked}</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  {flightClass.amenities.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-foreground/80 mb-2">Servicios incluidos:</div>
                      <div className="flex flex-wrap gap-2">
                        {flightClass.amenities.map((amenity, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-1 text-xs text-foreground/70 bg-default/30 rounded-full px-2 py-1"
                          >
                            {getAmenityIcon(amenity)}
                            <span className="capitalize">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seat Selection Info */}
                  {flightClass.seatSelection !== undefined && (
                    <div className="text-xs text-foreground/60 mb-4">
                      {flightClass.seatSelection 
                        ? '✓ Selección de asiento disponible' 
                        : '• Asiento asignado automáticamente'}
                    </div>
                  )}

                  {/* Select Button */}
                  <Button
                    color={isDefault ? "primary" : "default"}
                    variant={isDefault ? "solid" : "bordered"}
                    className="w-full"
                    onPress={() => handleSelectClass(
                      flightClass.type, 
                      flightClass.sellingPrice, 
                      flightClass.sellingCurrency
                    )}
                  >
                    {isDefault ? 'Continuar con esta clase' : 'Seleccionar'}
                  </Button>
                </div>
              )
            })}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
