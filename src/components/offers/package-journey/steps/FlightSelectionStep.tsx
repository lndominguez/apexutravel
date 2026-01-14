import { motion } from 'framer-motion'
import { Card, CardBody, Button, Input, Chip } from '@heroui/react'
import { Plane, SkipForward, Search } from 'lucide-react'
import { PackageJourneyState } from '../hooks/usePackageJourneyState'

interface FlightSelectionStepProps {
  state: PackageJourneyState
  type: 'ida' | 'vuelta'
  flights: any[]
  onSelect: (flight: any) => void
  onSkip: () => void
}

export function FlightSelectionStep({ state, type, flights, onSelect, onSkip }: FlightSelectionStepProps) {
  const filteredFlights = flights.filter((flight: any) => {
    if (!state.flightSearchTerm) return true
    const q = state.flightSearchTerm.toLowerCase()
    const text = [
      flight.inventoryName,
      flight.resource?.airline?.name,
      flight.resource?.flightNumber,
      flight.configuration?.class
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return text.includes(q)
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <Card className="bg-primary/5">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane size={24} className="text-primary" />
              <div>
                <h3 className="font-bold">Vuelo de {type === 'ida' ? 'Ida' : 'Vuelta'}</h3>
                <p className="text-sm text-default-500">
                  {type === 'ida' 
                    ? `${state.origin} → ${state.destination.city}`
                    : `${state.destination.city} → ${state.origin}`
                  }
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="flat"
              color="warning"
              startContent={<SkipForward size={16} />}
              onPress={onSkip}
            >
              Omitir
            </Button>
          </div>
        </CardBody>
      </Card>

      <Input
        size="sm"
        placeholder="Buscar por aerolínea, ruta o código..."
        value={state.flightSearchTerm}
        onValueChange={state.setFlightSearchTerm}
        startContent={<Search size={16} className="text-default-400" />}
      />

      {filteredFlights.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-default-500 mb-4">
              {state.flightSearchTerm
                ? 'No hay resultados que coincidan con tu búsqueda'
                : 'No encontramos vuelos disponibles para esta ruta'}
            </p>
            <Button
              color="primary"
              variant="flat"
              onPress={onSkip}
            >
              Continuar sin vuelo de {type}
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {filteredFlights.map((flight: any) => (
            <Card 
              key={flight._id}
              isPressable
              onPress={() => onSelect(flight)}
              className="hover:border-primary transition-colors"
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{flight.inventoryName}</p>
                    <p className="text-sm text-default-500">
                      {flight.resource?.airline?.name} - {flight.resource?.flightNumber}
                    </p>
                    <Chip size="sm" variant="flat" className="mt-1">
                      {flight.configuration?.class}
                    </Chip>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">
                      ${flight.pricing?.adult?.cost || 0}
                    </p>
                    <p className="text-xs text-default-500">por adulto</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}
