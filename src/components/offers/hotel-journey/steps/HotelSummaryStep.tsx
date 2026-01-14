import { Card, CardBody, Chip } from '@heroui/react'
import { Hotel as HotelIcon, MapPin, Calendar, Star, DollarSign, Users } from 'lucide-react'
import { HotelJourneyState } from '../hooks/useHotelJourneyState'

interface HotelSummaryStepProps {
  state: HotelJourneyState
  totalCost: number
  totalSelling: number
}

export function HotelSummaryStep({ state, totalCost, totalSelling }: HotelSummaryStepProps) {
  const commission = totalSelling - totalCost

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <HotelIcon size={32} className="text-success" />
            </div>
          </div>
          <h3 className="text-2xl font-bold">Resumen de la Oferta</h3>
          <p className="text-default-500">
            Revisa los detalles antes de crear la oferta
          </p>
        </div>

        {/* Información General */}
        <Card>
          <CardBody className="p-6 space-y-4">
            <h4 className="font-bold text-lg flex items-center gap-2">
              <HotelIcon size={20} className="text-primary" />
              Información General
            </h4>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-default-500">Nombre</p>
                <p className="font-semibold text-lg">{state.packageName || 'Sin nombre'}</p>
              </div>

              {state.packageDescription && (
                <div>
                  <p className="text-sm text-default-500">Descripción</p>
                  <p className="text-default-700">{state.packageDescription}</p>
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-success" />
                  <span className="text-default-500">Destino:</span>
                  <span className="font-semibold">{state.destination.city}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-primary" />
                  <span className="text-default-500">Duración:</span>
                  <span className="font-semibold">{state.days}D / {state.nights}N</span>
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
          </CardBody>
        </Card>

        {/* Hotel Incluido */}
        {state.selectedHotel && (
          <Card>
            <CardBody className="p-6 space-y-4">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <HotelIcon size={20} className="text-success" />
                Hotel Incluido
              </h4>

              <div className="flex gap-4">
                {state.selectedHotel.resource?.images?.[0] && (
                  <img
                    src={state.selectedHotel.resource.images[0]}
                    alt={state.selectedHotel.resource?.name}
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-bold text-lg">{state.selectedHotel.resource?.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: state.selectedHotel.resource?.stars || 0 }).map((_, i) => (
                        <Star key={i} size={14} className="fill-warning text-warning" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-default-500">
                    <MapPin size={14} />
                    <span>{state.selectedHotel.resource?.location?.city}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users size={14} className="text-default-400" />
                    <span className="text-default-500">Habitaciones disponibles:</span>
                    <Chip size="sm" color="success" variant="flat">
                      {state.selectedHotel.stock || 0}
                    </Chip>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Pricing */}
        <Card className="bg-gradient-to-br from-success-50 to-primary-50 border-2 border-success">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <DollarSign size={20} className="text-success" />
                Precio Final
              </h4>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-default-600">Costo base</span>
                <span className="text-lg font-semibold">${totalCost.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-default-600">Markup ({state.hotelMarkup.type === 'percentage' ? `${state.hotelMarkup.value}%` : 'Fijo'})</span>
                <span className="text-lg font-semibold text-primary">+${commission.toFixed(2)}</span>
              </div>

              <div className="border-t border-success/20 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Precio de Venta</span>
                  <span className="text-2xl font-bold text-success">${totalSelling.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
