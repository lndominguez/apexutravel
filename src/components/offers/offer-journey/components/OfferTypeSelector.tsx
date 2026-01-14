import { Modal, ModalContent, ModalHeader, ModalBody, Card, CardBody } from '@heroui/react'
import { Plane, Hotel as HotelIcon, Package, Bus, Palmtree } from 'lucide-react'

interface OfferTypeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectType: (type: 'flight' | 'hotel' | 'package' | 'transport' | 'activity') => void
}

const offerTypes = [
  {
    type: 'flight' as const,
    label: 'Vuelo',
    description: 'Vuelos individuales',
    icon: Plane,
    color: 'from-blue-500 to-blue-600',
    iconColor: 'text-blue-600'
  },
  {
    type: 'hotel' as const,
    label: 'Hotel',
    description: 'Alojamiento individual',
    icon: HotelIcon,
    color: 'from-green-500 to-green-600',
    iconColor: 'text-green-600'
  },
  {
    type: 'package' as const,
    label: 'Paquete',
    description: 'Paquete completo',
    icon: Package,
    color: 'from-purple-500 to-purple-600',
    iconColor: 'text-purple-600'
  },
  {
    type: 'transport' as const,
    label: 'Transporte',
    description: 'Traslados y tours',
    icon: Bus,
    color: 'from-orange-500 to-orange-600',
    iconColor: 'text-orange-600'
  },
  {
    type: 'activity' as const,
    label: 'Actividad',
    description: 'Excursiones y actividades',
    icon: Palmtree,
    color: 'from-pink-500 to-pink-600',
    iconColor: 'text-pink-600'
  }
]

export function OfferTypeSelector({ isOpen, onClose, onSelectType }: OfferTypeSelectorProps) {
  const handleSelect = (type: typeof offerTypes[number]['type']) => {
    onSelectType(type)
    // No cerrar aquí - el componente padre controla el cierre
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
      classNames={{
        base: "bg-white",
        backdrop: "bg-black/50"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b pb-4">
          <h2 className="text-2xl font-bold">Crear Nueva Oferta</h2>
          <p className="text-sm text-default-500 font-normal">
            Selecciona el tipo de oferta que deseas crear
          </p>
        </ModalHeader>
        
        <ModalBody className="py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {offerTypes.map(({ type, label, description, icon: Icon, color, iconColor }) => (
              <Card
                key={type}
                isPressable
                isHoverable
                onPress={() => handleSelect(type)}
                className="hover:scale-105 transition-transform cursor-pointer"
              >
                <CardBody className="p-0 overflow-hidden">
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${color} h-24 flex items-center justify-center`}>
                    <Icon size={48} className="text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 text-center">
                    <h3 className={`font-bold text-lg mb-1 ${iconColor}`}>
                      {label}
                    </h3>
                    <p className="text-xs text-default-500">
                      {description}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
