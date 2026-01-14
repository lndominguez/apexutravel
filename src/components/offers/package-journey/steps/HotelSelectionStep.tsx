import { motion } from 'framer-motion'
import { Card, CardBody, Input, Image, Chip, Button } from '@heroui/react'
import { Hotel as HotelIcon, Search, X, Star, MapPin, Calendar, Package, RefreshCw, Trash2, CheckCircle } from 'lucide-react'
import { PackageJourneyState } from '../hooks/usePackageJourneyState'
import { getRoomAdultBasePrice } from '@/lib/offerPricing'

interface HotelSelectionStepProps {
  state: PackageJourneyState
  onSelectHotel: (hotel: any) => void
}

export function HotelSelectionStep({ state, onSelectHotel }: HotelSelectionStepProps) {
  const filteredHotels = state.availableHotels.filter((hotel: any) => {
    if (!state.hotelSearchTerm) return true
    const q = state.hotelSearchTerm.toLowerCase()
    const textParts = [
      hotel.resource?.name,
      hotel.inventoryName,
      hotel.resource?.location?.city,
      hotel.configuration?.plan,
      hotel.configuration?.roomType
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return textParts.includes(q)
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col gap-2"
    >
      {/* Header compacto con filtros mejorados */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 bg-default-50 rounded-lg p-2 border border-default-200"
      >
          <div className="flex items-center gap-2 bg-success/10 rounded-md px-2.5 py-1.5 border border-success/30">
            <MapPin size={14} className="text-success" />
            <div>
              <p className="text-xs font-bold text-success">{state.destination.city}</p>
              <p className="text-[10px] text-default-500">{filteredHotels.length} de {state.availableHotels.length}</p>
            </div>
          </div>
          
          <div className="h-6 w-px bg-default-300" />
          
          <Input
            size="sm"
            variant="flat"
            placeholder="Buscar hotel, plan, ubicación..."
            value={state.hotelSearchTerm}
            onValueChange={state.setHotelSearchTerm}
            startContent={<Search size={14} className="text-primary" />}
            isClearable
            onClear={() => state.setHotelSearchTerm('')}
            className="flex-1 max-w-md"
            classNames={{
              input: 'text-xs',
              inputWrapper: 'h-8 bg-white border border-default-200 hover:border-primary'
            }}
          />
          
          <Chip 
            size="sm" 
            variant="flat" 
            color="primary"
            startContent={<HotelIcon size={12} />}
            className="text-[10px] font-semibold"
          >
            Hoteles disponibles
          </Chip>
        </motion.div>

      {/* Hotel seleccionado con botones de acción */}
      {state.selectedHotel && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3"
        >
          <Card className="border-2 border-success bg-success-50/50">
            <CardBody className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-default-100 flex-shrink-0">
                    {state.selectedHotel.resource?.photos?.[0] ? (
                      <img
                        src={state.selectedHotel.resource.photos[0]}
                        alt={state.selectedHotel.resource.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HotelIcon size={20} className="text-default-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={16} className="text-success" />
                      <h4 className="font-bold text-sm text-success-700">Hotel Seleccionado</h4>
                    </div>
                    <p className="text-sm font-semibold text-default-800">
                      {state.selectedHotel.resource?.name || state.selectedHotel.inventoryName}
                    </p>
                    <p className="text-xs text-default-600 flex items-center gap-1">
                      <MapPin size={10} />
                      {state.selectedHotel.resource?.location?.city}, {state.selectedHotel.resource?.location?.country}
                    </p>
                    {state.selectedHotel.rooms && (
                      <p className="text-xs text-default-500 mt-1">
                        {state.selectedHotel.rooms.length} habitación{state.selectedHotel.rooms.length !== 1 ? 'es' : ''} disponible{state.selectedHotel.rooms.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<RefreshCw size={14} />}
                    onPress={state.handleRefreshHotelInfo}
                    isLoading={state.isRefreshingHotel}
                  >
                    Recargar Info
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    startContent={<Trash2 size={14} />}
                    onPress={state.handleRemoveHotel}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {filteredHotels.length === 0 ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="text-center p-6 bg-danger/5 rounded-lg border border-danger/20 max-w-sm">
            <X size={24} className="mx-auto text-danger mb-2" />
            <p className="font-semibold text-sm text-default-700">Sin resultados</p>
            <p className="text-xs text-default-500 mt-1">Prueba con otro término de búsqueda</p>
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-4">
          <div className="flex flex-wrap justify-between gap-3">
            {filteredHotels.map((hotel: any) => {
              const cheapestRoom = hotel.rooms?.length > 0
                ? [...hotel.rooms].sort((a: any, b: any) => getRoomAdultBasePrice(a) - getRoomAdultBasePrice(b))[0]
                : null

              const pricePerNight = cheapestRoom ? getRoomAdultBasePrice(cheapestRoom) : (hotel.pricing?.costPerNight || 0)
              
              // Calcular stock total sumando el stock de todas las habitaciones
              const totalStock = hotel.rooms?.reduce((sum: number, room: any) => sum + (room.stock || 0), 0) || hotel.availability || 0
              
              return (
                <motion.div
                  key={hotel._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="w-[calc(25%-0.75rem)]"
                >
                  <Card
                    isPressable
                    onPress={() => onSelectHotel(hotel)}
                    className="border border-default-200 hover:border-success hover:shadow-lg transition-all h-full"
                  >
                    <CardBody className="p-0 flex flex-col">
                      {/* Imagen más compacta */}
                      <div className="w-full aspect-[16/9] overflow-hidden bg-default-100 relative">
                        {hotel.resource?.photos?.[0] || hotel.resource?.logo ? (
                          <img
                            src={hotel.resource.photos?.[0] || hotel.resource.logo}
                            alt={hotel.resource.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HotelIcon size={16} className="text-default-400" />
                          </div>
                        )}
                        
                        {/* Badge de precio en esquina superior derecha */}
                        <div className="absolute top-1.5 right-1.5 bg-success text-white px-2 py-0.5 rounded shadow-lg">
                          <p className="text-xs font-bold">${pricePerNight}/n</p>
                        </div>
                        
                        {/* Badge de stock en esquina superior izquierda */}
                        <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-md flex items-center gap-0.5">
                          <Package size={10} className="text-success" />
                          <span className="text-[10px] font-bold text-default-700">{totalStock}</span>
                        </div>
                        
                        {/* Badge de habitaciones en esquina inferior derecha */}
                        {hotel.rooms?.length > 1 && (
                          <div className="absolute bottom-1.5 right-1.5 bg-secondary/90 backdrop-blur-sm text-white w-14 h-6 rounded flex items-center justify-center shadow-md">
                            <span className="text-[10px] font-bold">{hotel.rooms.length} rooms</span>
                          </div>
                        )}
                      </div>

                      {/* Información principal */}
                      <div className="p-2 flex flex-col gap-1.5">
                        {/* Header: Nombre y estrellas */}
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-bold text-xs text-default-800 leading-tight line-clamp-2 flex-1" title={hotel.resource?.name}>
                            {hotel.resource?.name}
                          </h4>
                          {hotel.resource?.stars && (
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {[...Array(hotel.resource.stars)].map((_, i) => (
                                <Star key={i} size={8} className="fill-warning text-warning" />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Ubicación */}
                        <div className="flex items-center gap-1 text-default-600">
                          <MapPin size={10} className="flex-shrink-0" />
                          <span className="text-[10px] truncate">
                            {hotel.resource?.location?.city}, {hotel.resource?.location?.country}
                          </span>
                        </div>
                        
                        {/* Fechas de disponibilidad */}
                        {cheapestRoom?.validFrom && cheapestRoom?.validTo && (
                          <div className="flex items-center gap-1 bg-primary/10 rounded px-1.5 py-1 border border-primary/20">
                            <Calendar size={10} className="text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] text-primary font-semibold">Disponible</p>
                              <p className="text-[10px] font-medium text-default-700 truncate">
                                {new Date(cheapestRoom.validFrom).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(cheapestRoom.validTo).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Tags: Solo Plan */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {hotel.configuration?.plan && (
                            <Chip size="sm" variant="flat" color="primary" className="text-[9px] h-4 px-1.5">
                              {hotel.configuration.plan}
                            </Chip>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}
