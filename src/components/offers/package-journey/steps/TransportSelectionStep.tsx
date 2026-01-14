import { motion } from 'framer-motion'
import { Card, CardBody, Button } from '@heroui/react'
import { Bus } from 'lucide-react'
import { PackageJourneyState } from '../hooks/usePackageJourneyState'

interface TransportSelectionStepProps {
  state: PackageJourneyState
  type: 'arrival' | 'departure'
  onSelect: (transport: any) => void
  onSkip: () => void
}

export function TransportSelectionStep({ state, type, onSelect, onSkip }: TransportSelectionStepProps) {
  const filteredTransports = state.availableTransports.filter((transport: any) => {
    if (!state.transportSearchTerm) return true
    const q = state.transportSearchTerm.toLowerCase()
    const text = [
      transport.inventoryName,
      transport.configuration?.serviceType,
      transport.resource?.route?.from,
      transport.resource?.route?.to
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
      <Card className="bg-secondary/5">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bus size={24} className="text-secondary" />
              <div>
                <h3 className="font-bold">Transporte</h3>
                <p className="text-sm text-default-500">
                  {type === 'arrival' ? 'Aeropuerto → Hotel' : 'Hotel → Aeropuerto'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="flat"
              color="default"
              onPress={onSkip}
            >
              No incluir
            </Button>
          </div>
        </CardBody>
      </Card>

      {filteredTransports.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-default-500 mb-4">
              {state.transportSearchTerm
                ? 'No hay transportes que coincidan con tu búsqueda'
                : 'No encontramos servicios de transporte disponibles'}
            </p>
            <Button color="primary" variant="flat" onPress={onSkip}>
              Continuar
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 max-h-80 overflow-y-auto">
          {filteredTransports.map((transport: any) => (
            <Card 
              key={transport._id}
              isPressable
              onPress={() => onSelect(transport)}
              className="hover:border-secondary transition-colors"
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{transport.inventoryName}</p>
                    <p className="text-sm text-default-500">
                      {transport.configuration?.serviceType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">
                      ${transport.pricing?.cost || 0}
                    </p>
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
