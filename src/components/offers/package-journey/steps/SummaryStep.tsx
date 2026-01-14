import { motion } from 'framer-motion'
import { Card, CardBody, Input, Textarea, Chip } from '@heroui/react'
import { 
  Check, 
  Package, 
  Sparkles, 
  MapPin, 
  Clock, 
  Plane, 
  Hotel as HotelIcon, 
  Bus, 
  Activity, 
  Calendar
} from 'lucide-react'
import { PackageJourneyState } from '../hooks/usePackageJourneyState'

interface SummaryStepProps {
  state: PackageJourneyState
  totalCost: number
  totalSelling: number
}

export function SummaryStep({ state, totalCost, totalSelling }: SummaryStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col"
    >
      {/* Header simple */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dashed border-default-300">
        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
          <Check size={16} className="text-success" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Resumen del Paquete</h3>
          <p className="text-xs text-default-500">Revisa y confirma los detalles</p>
        </div>
      </div>

      {/* Contenido centrado */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-2xl space-y-4">
          {/* Información del Paquete */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-primary" />
              <h4 className="font-bold text-sm">Información del Paquete</h4>
            </div>
              
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {state.packageCode && (
                  <Input
                    label="Código"
                    value={state.packageCode}
                    isReadOnly
                    size="sm"
                  />
                )}
                
                <Input
                  label="Nombre del Paquete"
                  placeholder="Ej: Cancún Paraíso - 5 días"
                  value={state.packageName}
                  onValueChange={state.setPackageName}
                  isRequired
                  size="sm"
                  startContent={<Sparkles size={14} className="text-warning" />}
                  className={state.packageCode ? '' : 'col-span-2'}
                />
              </div>
              
              <Textarea
                label="Descripción"
                placeholder="Describe el paquete..."
                value={state.description}
                onValueChange={state.setDescription}
                minRows={2}
                size="sm"
              />
                
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-success" />
                  <span className="text-default-500">Destino:</span>
                  <span className="font-semibold">{state.destination.city}</span>
                </div>
                <span className="text-default-300">|</span>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-primary" />
                  <span className="text-default-500">Duración:</span>
                  <span className="font-semibold">{state.days}D/{state.nights}N</span>
                </div>
              </div>
                
              {state.packageValidFrom && state.packageValidTo && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-warning" />
                  <span className="text-default-500">Vigencia:</span>
                  <span className="font-semibold">
                    {state.packageValidFrom.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {state.packageValidTo.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Línea divisoria */}
          <div className="border-t border-dashed border-default-300" />

          {/* Componentes Incluidos */}
          <div>
            <h4 className="font-bold text-sm mb-3">Componentes Incluidos</h4>
              
            <div className="space-y-2">
                {state.flightIda && (
                  <div className="flex items-center gap-2 text-sm">
                    <Plane size={16} className="text-primary" />
                    <span>Vuelo Ida: {state.flightIda.inventoryName}</span>
                    <span className="ml-auto font-semibold text-success">
                      ${state.flightIda.pricing?.adult?.cost || 0}
                    </span>
                  </div>
                )}
                
                {state.flightVuelta && (
                  <div className="flex items-center gap-2 text-sm">
                    <Plane size={16} className="text-primary" />
                    <span>Vuelo Vuelta: {state.flightVuelta.inventoryName}</span>
                    <span className="ml-auto font-semibold text-success">
                      ${state.flightVuelta.pricing?.adult?.cost || 0}
                    </span>
                  </div>
                )}
                
              {state.selectedHotel && (
                <div className="flex items-center gap-2 text-sm">
                  <HotelIcon size={16} className="text-success" />
                  <div className="flex-1">
                    <span className="font-semibold">{state.selectedHotel.resource?.name}</span>
                  </div>
                  <Chip size="sm" color="success" variant="flat">Incluido</Chip>
                </div>
              )}
                
                {state.transportArrival && (
                  <div className="flex items-center gap-2 text-sm">
                    <Bus size={16} className="text-secondary" />
                    <span>Traslado Llegada</span>
                    <span className="ml-auto font-semibold text-success">
                      ${state.transportArrival.pricing?.cost || 0}
                    </span>
                  </div>
                )}
                
                {state.transportDeparture && (
                  <div className="flex items-center gap-2 text-sm">
                    <Bus size={16} className="text-secondary" />
                    <span>Traslado Salida</span>
                    <span className="ml-auto font-semibold text-success">
                      ${state.transportDeparture.pricing?.cost || 0}
                    </span>
                  </div>
                )}
                
              {state.selectedActivities?.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Activity size={16} className="text-purple-500" />
                  <span>{activity.inventoryName}</span>
                  <span className="ml-auto font-semibold text-success">
                    ${activity.pricing?.cost || activity.pricing?.adult?.cost || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
