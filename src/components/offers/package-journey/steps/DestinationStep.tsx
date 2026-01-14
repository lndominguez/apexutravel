import { motion } from 'framer-motion'
import { Card, CardBody, Divider, Autocomplete, AutocompleteItem } from '@heroui/react'
import { MapPin, Plane } from 'lucide-react'
import { PackageJourneyState } from '../hooks/usePackageJourneyState'

interface DestinationStepProps {
  state: PackageJourneyState
  allHotels: any[]
}

export function DestinationStep({ state, allHotels }: DestinationStepProps) {
  const uniqueCities = Array.from(
    new Set(
      allHotels
        .map((h: any) => h.resource?.location?.city)
        .filter(Boolean)
    )
  ).sort()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex items-center justify-center"
    >
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardBody className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <MapPin size={24} className="text-success" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold">¿A dónde vamos?</h3>
                  <p className="text-xs text-default-500">
                    Escribe y selecciona el destino del paquete
                  </p>
                </div>
              </div>

              <Divider />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-default-500">
                  <Plane size={12} className="text-primary" />
                  <span>El origen se configurará al seleccionar los vuelos</span>
                </div>

                <Autocomplete
                  label="Destino"
                  placeholder="Buscar ciudad..."
                  selectedKey={state.destination.city || null}
                  onSelectionChange={(key) => {
                    const city = String(key || '')
                    if (!city) return
                    const hotelWithCity = allHotels.find(
                      (h: any) => h.resource?.location?.city === city
                    )
                    const country = hotelWithCity?.resource?.location?.country || ''
                    state.setDestination({ city, country })
                  }}
                  startContent={<MapPin size={16} className="text-success" />}
                  isClearable
                  size="sm"
                  className="w-full"
                >
                  {uniqueCities.map((city: string) => (
                    <AutocompleteItem key={city}>
                      {city}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
