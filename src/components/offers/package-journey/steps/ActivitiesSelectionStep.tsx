import { motion } from 'framer-motion'
import { Card, CardBody, Button, Input, Checkbox } from '@heroui/react'
import { Activity, Search, ChevronRight } from 'lucide-react'
import { PackageJourneyState } from '../hooks/usePackageJourneyState'

interface ActivitiesSelectionStepProps {
  state: PackageJourneyState
  onContinue: () => void
}

export function ActivitiesSelectionStep({ state, onContinue }: ActivitiesSelectionStepProps) {
  const filteredActivities = state.availableActivities.filter((activity: any) => {
    if (!state.activitySearchTerm) return true
    const q = state.activitySearchTerm.toLowerCase()
    const text = [
      activity.inventoryName,
      activity.resource?.name,
      activity.resource?.description,
      activity.resource?.location?.city
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
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <CardBody className="p-6 text-center">
          <Activity className="mx-auto mb-3 text-purple-500" size={40} />
          <h3 className="text-xl font-bold mb-2">¡Aventuras Inolvidables!</h3>
          <p className="text-default-600">
            Selecciona las actividades que incluirá tu paquete
          </p>
        </CardBody>
      </Card>

      <Input
        size="sm"
        placeholder="Buscar actividad por nombre o destino..."
        value={state.activitySearchTerm}
        onValueChange={state.setActivitySearchTerm}
        startContent={<Search size={16} className="text-default-400" />}
      />

      <div className="grid gap-3 max-h-80 overflow-y-auto">
        {filteredActivities.map((activity: any) => {
          const isSelected = state.selectedActivities.find(a => a._id === activity._id)
          
          return (
            <Card 
              key={activity._id}
              isPressable
              onPress={() => {
                if (isSelected) {
                  state.setSelectedActivities(state.selectedActivities.filter(a => a._id !== activity._id))
                } else {
                  state.setSelectedActivities([...state.selectedActivities, activity])
                }
              }}
              className={`transition-all ${isSelected ? 'border-2 border-purple-500 bg-purple-500/5' : ''}`}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox isSelected={!!isSelected} />
                    <div>
                      <p className="font-semibold">{activity.inventoryName}</p>
                      <p className="text-xs text-default-500">
                        {activity.resource?.location?.city || state.destination.city}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">
                      ${activity.pricing?.cost || activity.pricing?.adult?.cost || 0}
                    </p>
                    <p className="text-xs text-default-500">por persona</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <Button
        color="primary"
        size="lg"
        fullWidth
        endContent={<ChevronRight size={20} />}
        onPress={onContinue}
      >
        Ver Resumen Final
      </Button>
    </motion.div>
  )
}
