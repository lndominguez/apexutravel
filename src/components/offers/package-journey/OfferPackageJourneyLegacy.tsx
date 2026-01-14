'use client'

import { useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from '@heroui/react'
import { Package, Hotel as HotelIcon, Plane, Bus, Palmtree } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useInventory } from '@/swr'
import { useConfirm } from '@/hooks/useConfirm'
import { useNotification } from '@/hooks/useNotification'
import { usePackageJourneyState } from './hooks/usePackageJourneyState'
import { SearchingAnimation } from './components/SearchingAnimation'
import { ProgressBar } from './components/ProgressBar'
import { FooterControls } from './components/FooterControls'
import { FooterSummary } from './components/FooterSummary'
import { DestinationStep } from './steps/DestinationStep'
import { HotelSelectionStep } from './steps/HotelSelectionStep'
import { HotelMarkupConfigStep } from './steps/HotelMarkupConfigStep'
import { FlightSelectionStep } from './steps/FlightSelectionStep'
import { TransportSelectionStep } from './steps/TransportSelectionStep'
import { ActivitiesSelectionStep } from './steps/ActivitiesSelectionStep'
import { SummaryStep } from './steps/SummaryStep'
import { getStepsForOfferType, isStepIncluded, getNextStep, getPreviousStep, getInitialStep } from './config/stepsConfig'

interface OfferPackageJourneyProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  package?: any
  isLoading?: boolean
  offerType?: 'flight' | 'hotel' | 'package' | 'transport' | 'activity'
}

export default function OfferPackageJourney({ 
  isOpen, 
  onClose, 
  onSubmit, 
  package: packageData,
  isLoading,
  offerType = 'package'
}: OfferPackageJourneyProps) {
  const { confirm, ConfirmDialog } = useConfirm()
  const notification = useNotification()
  const state = usePackageJourneyState(packageData)
  
  const { inventory: allFlights } = useInventory({ resourceType: 'Flight', status: 'active', limit: 500 })
  const { inventory: allHotels } = useInventory({ resourceType: 'Hotel', status: 'active', pricingMode: 'package', limit: 500 })
  const { inventory: allTransports } = useInventory({ resourceType: 'Transport', status: 'active', limit: 500 })
  const { inventory: allActivities } = useInventory({ resourceType: 'Activity', status: 'active', limit: 500 })

  useEffect(() => {
    if (!isOpen && !packageData) {
      state.resetState()
    }
  }, [isOpen, packageData])

  // Inicializar step según tipo de oferta
  useEffect(() => {
    if (isOpen && offerType && !packageData) {
      const initialStep = getInitialStep(offerType)
      state.setCurrentStep(initialStep)
    }
  }, [isOpen, offerType])

  const searchFlights = (type: 'outbound' | 'return', originCity: string, destCity: string) => {
    state.setIsSearching(true)
    
    setTimeout(() => {
      const filtered = allFlights.filter((f: any) => {
        const flightOrigin = f.resource?.departure?.city || ''
        const flightDest = f.resource?.arrival?.city || ''
        const flightType = f.configuration?.flightType || ''
        
        return (
          flightOrigin.toLowerCase().includes(originCity.toLowerCase()) &&
          flightDest.toLowerCase().includes(destCity.toLowerCase()) &&
          flightType === type
        )
      })
      
      if (type === 'outbound') {
        state.setAvailableFlightsIda(filtered.slice(0, 10))
        state.setCurrentStep('flight-ida')
      } else {
        state.setAvailableFlightsVuelta(filtered.slice(0, 10))
        state.setCurrentStep('flight-vuelta')
      }
      
      state.setIsSearching(false)
    }, 2000)
  }

  const searchHotels = (destCity: string) => {
    state.setIsSearching(true)
    
    setTimeout(() => {
      const filtered = allHotels.filter((h: any) => {
        const hotelCity = h.resource?.location?.city || ''
        const hotelCountry = h.resource?.location?.country || ''
        const searchLower = destCity.toLowerCase()
        
        return (
          hotelCity.toLowerCase().includes(searchLower) ||
          hotelCountry.toLowerCase().includes(searchLower) ||
          h.inventoryName?.toLowerCase().includes(searchLower)
        )
      })
      
      state.setAvailableHotels(filtered)
      state.setCurrentStep('hotel')
      state.setIsSearching(false)
    }, 2000)
  }

  const searchTransports = (destCity: string) => {
    state.setIsSearching(true)
    
    setTimeout(() => {
      const filtered = allTransports.filter((t: any) => {
        const route = t.resource?.route || {}
        return (
          route.from?.toLowerCase().includes('aeropuerto') ||
          route.to?.toLowerCase().includes('aeropuerto') ||
          route.from?.toLowerCase().includes(destCity.toLowerCase()) ||
          route.to?.toLowerCase().includes(destCity.toLowerCase())
        )
      })
      
      state.setAvailableTransports(filtered.slice(0, 10))
      state.setIsSearching(false)
    }, 1500)
  }

  const searchActivities = (destCity: string) => {
    state.setIsSearching(true)
    
    setTimeout(() => {
      const filtered = allActivities.filter((a: any) => {
        const activityLocation = a.resource?.location?.city || ''
        const activityCountry = a.resource?.location?.country || ''
        const searchLower = destCity.toLowerCase()
        
        return (
          activityLocation.toLowerCase().includes(searchLower) ||
          activityCountry.toLowerCase().includes(searchLower) ||
          a.inventoryName?.toLowerCase().includes(searchLower)
        )
      })
      
      state.setAvailableActivities(filtered)
      state.setCurrentStep('activities')
      state.setIsSearching(false)
    }, 1500)
  }

  const handleStartJourney = () => {
    if (!state.destination.city) {
      notification.error('Error', 'Por favor selecciona un destino')
      return
    }
    
    // Navegar al siguiente step según el tipo de oferta
    const nextStep = getNextStep(offerType, 'destination')
    if (!nextStep) return
    
    // Ejecutar acción correspondiente según el siguiente step
    switch (nextStep) {
      case 'searching-hotels':
        state.setCurrentStep('searching-hotels')
        searchHotels(state.destination.city)
        break
      case 'searching-flights-ida':
        state.setCurrentStep('searching-flights-ida')
        searchFlights('outbound', 'CDMX', state.destination.city)
        break
      case 'transport-arrival':
        state.setCurrentStep('transport-arrival')
        searchTransports(state.destination.city)
        break
      case 'searching-activities':
        state.setCurrentStep('searching-activities')
        searchActivities(state.destination.city)
        break
      default:
        state.setCurrentStep(nextStep)
    }
  }

  const handleSelectHotel = (hotel: any) => {
    state.setSelectedHotel(hotel)
    state.setCurrentStep('hotel-config')
  }
  
  const handleContinueAfterHotelConfig = () => {
    if (!state.selectedHotel) return
    
    // Para hotel, ir directo a summary
    // Para package, continuar con vuelos
    const nextStep = getNextStep(offerType, 'hotel-config')
    if (!nextStep) return
    
    switch (nextStep) {
      case 'searching-flights-ida':
        state.setCurrentStep('searching-flights-ida')
        searchFlights('outbound', 'CDMX', state.destination.city)
        break
      case 'summary':
        state.setCurrentStep('summary')
        break
      default:
        state.setCurrentStep(nextStep)
    }
  }

  const handleSelectFlightIda = (flight: any) => {
    state.setFlightIda(flight)
    state.setCurrentStep('searching-flights-vuelta')
    searchFlights('return', state.destination.city, 'CDMX')
  }

  const handleSkipFlightIda = () => {
    state.setCurrentStep('searching-flights-vuelta')
    searchFlights('return', state.destination.city, 'CDMX')
  }

  const handleSelectFlightVuelta = (flight: any) => {
    state.setFlightVuelta(flight)
    state.setCurrentStep('transport-arrival')
    searchTransports(state.destination.city)
  }

  const handleSkipFlightVuelta = () => {
    state.setCurrentStep('transport-arrival')
    searchTransports(state.destination.city)
  }

  const handleSelectTransportArrival = (transport: any) => {
    state.setTransportArrival(transport)
    state.setCurrentStep('transport-departure')
  }

  const handleSkipTransportArrival = () => {
    state.setCurrentStep('transport-departure')
  }

  const handleSelectTransportDeparture = (transport: any) => {
    state.setTransportDeparture(transport)
    state.setCurrentStep('searching-activities')
    searchActivities(state.destination.city)
  }

  const handleSkipTransportDeparture = () => {
    state.setCurrentStep('searching-activities')
    searchActivities(state.destination.city)
  }

  const handleContinueToSummary = () => {
    state.setCurrentStep('summary')
  }

  const calculateTotalCost = () => {
    let total = 0
    
    if (state.flightIda) total += state.flightIda.pricing?.adult?.cost || 0
    if (state.flightVuelta) total += state.flightVuelta.pricing?.adult?.cost || 0
    
    if (state.selectedHotel && state.selectedHotel.rooms?.length > 0) {
      const nightsCount = state.nights > 0 ? state.nights : 1
      const getRoomAdultBase = (room: any) => {
        if (room?.priceAdult != null) return room.priceAdult || 0
        if (room?.capacityPrices) {
          const preferred = room.capacityPrices.double?.adult ?? room.capacityPrices.single?.adult
          if (preferred != null) return preferred || 0
          const firstKey = Object.keys(room.capacityPrices)[0]
          return firstKey ? (room.capacityPrices[firstKey]?.adult || 0) : 0
        }
        return 0
      }

      const cheapestRoom = [...state.selectedHotel.rooms].sort((a: any, b: any) =>
        getRoomAdultBase(a) - getRoomAdultBase(b)
      )[0]

      const costPerNight = getRoomAdultBase(cheapestRoom)
      total += costPerNight * nightsCount
    }
    
    if (state.transportArrival) total += state.transportArrival.pricing?.cost || 0
    if (state.transportDeparture) total += state.transportDeparture.pricing?.cost || 0
    
    state.selectedActivities.forEach(a => total += (a.pricing?.cost || a.pricing?.adult?.cost || 0))
    
    return total
  }

  const calculateTotalSelling = () => {
    const cost = calculateTotalCost()
    const multiplier = state.hotelMarkup.type === 'percentage' 
      ? (1 + state.hotelMarkup.value / 100)
      : 1
    
    const hotelExtra = state.hotelMarkup.type === 'fixed' ? state.hotelMarkup.value : 0
    
    return (cost * multiplier) + hotelExtra
  }

  const handleSubmit = async () => {
    if (!state.packageName || !state.destination.city || !state.selectedHotel) {
      notification.error('Faltan datos', 'Completa todos los pasos requeridos')
      return
    }

    const getRoomAdultBase = (room: any) => {
      if (room?.priceAdult != null) return room.priceAdult || 0
      if (room?.capacityPrices) {
        const preferred = room.capacityPrices.double?.adult ?? room.capacityPrices.single?.adult
        if (preferred != null) return preferred || 0
        const firstKey = Object.keys(room.capacityPrices)[0]
        return firstKey ? (room.capacityPrices[firstKey]?.adult || 0) : 0
      }
      return 0
    }

    if (state.packageValidFrom && state.packageValidTo) {
      if (state.packageValidFrom >= state.packageValidTo) {
        notification.error('Fechas inválidas', 'La fecha de inicio debe ser anterior a la fecha de fin')
        return
      }

      const cheapestRoom = [...state.selectedHotel.rooms].sort((a: any, b: any) =>
        getRoomAdultBase(a) - getRoomAdultBase(b)
      )[0]

      if (cheapestRoom?.validFrom && cheapestRoom?.validTo) {
        const roomStart = new Date(cheapestRoom.validFrom)
        const roomEnd = new Date(cheapestRoom.validTo)

        if (state.packageValidFrom < roomStart || state.packageValidTo > roomEnd) {
          notification.error(
            'Fechas fuera de rango',
            `Las fechas deben estar entre ${roomStart.toLocaleDateString('es-ES')} y ${roomEnd.toLocaleDateString('es-ES')} (disponibilidad de ${cheapestRoom.roomName})`
          )
          return
        }
      }
    }

    const code = `PKG-${Date.now().toString().slice(-8)}`
    const hotelLocation = state.selectedHotel.resource?.location || {}
    const destinationCity = hotelLocation.city || state.destination.city || 'Ciudad'
    const destinationCountry = hotelLocation.country || state.destination.country || 'País'

    const items: any[] = []

    items.push({
      inventoryId: state.selectedHotel._id,
      resourceType: 'Hotel',
      mandatory: true,
      hotelInfo: {
        resourceId: state.selectedHotel.resource,
        name: state.selectedHotel.inventoryName,
        stars: state.selectedHotel.stars || 0,
        location: {
          city: state.destination.city,
          country: state.destination.country
        }
      }
    })
    
    if (state.flightIda || state.flightVuelta) {
      items.push({
        inventoryId: state.flightIda?._id || state.flightVuelta?._id,
        resourceType: 'Flight',
        mandatory: true,
        flightDetails: {
          route: {
            from: state.origin,
            to: state.destination.city
          },
          schedule: {
            departure: new Date(),
            return: state.flightVuelta ? new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) : undefined
          },
          class: 'economy',
          seat: {
            assignmentType: 'auto',
            allowSelection: true
          },
          baggage: {
            carryOn: true,
            checked: true
          },
          pricing: {
            adult: (state.flightIda?.pricing?.adult?.cost || 0) + (state.flightVuelta?.pricing?.adult?.cost || 0),
            child: (state.flightIda?.pricing?.child?.cost || 0) + (state.flightVuelta?.pricing?.child?.cost || 0),
            infant: (state.flightIda?.pricing?.infant?.cost || 0) + (state.flightVuelta?.pricing?.infant?.cost || 0)
          }
        }
      })
    }
    
    if (state.transportArrival) {
      items.push({
        inventoryId: state.transportArrival._id,
        resourceType: 'Transport',
        mandatory: true,
        transportOrActivity: {
          type: 'shuttle',
          route: {
            from: 'Aeropuerto',
            to: 'Hotel'
          },
          direction: 'one_way',
          pricing: {
            adult: state.transportArrival.pricing?.cost || 0,
            child: (state.transportArrival.pricing?.cost || 0) * 0.8,
            infant: 0
          }
        }
      })
    }
    
    if (state.transportDeparture) {
      items.push({
        inventoryId: state.transportDeparture._id,
        resourceType: 'Transport',
        mandatory: true,
        transportOrActivity: {
          type: 'shuttle',
          route: {
            from: 'Hotel',
            to: 'Aeropuerto'
          },
          direction: 'one_way',
          pricing: {
            adult: state.transportDeparture.pricing?.cost || 0,
            child: (state.transportDeparture.pricing?.cost || 0) * 0.8,
            infant: 0
          }
        }
      })
    }
    
    const data = {
      code,
      name: state.packageName,
      description: state.description || `${offerType === 'hotel' ? 'Hotel' : offerType === 'flight' ? 'Vuelo' : offerType === 'package' ? 'Paquete turístico' : offerType === 'transport' ? 'Transporte' : 'Actividad'} a ${state.destination.city}`,
      slug: state.packageName.toLowerCase().replace(/\s+/g, '-'),
      type: offerType,
      
      duration: {
        nights: state.nights
      },
      
      markup: {
        type: state.hotelMarkup.type,
        value: state.hotelMarkup.value
      },
      
      items,
      
      pricing: {
        currency: 'USD',
        base: {
          adult: calculateTotalCost(),
          child: calculateTotalCost() * 0.8,
          infant: 0
        },
        adjustments: {
          capacity: { simple: 0, double: 50, triple: 80 },
          features: { balcony: 20, ocean_view: 40 }
        },
        finalPrice: calculateTotalSelling()
      },
      
      rules: {
        allowRoomChange: true,
        allowFeatureChange: true,
        allowDatesChange: false,
        allowSeatSelection: true
      },
      
      availability: {
        type: 'inventory_based',
        quantity: state.selectedHotel?.availability || 10,
        minPax: 1,
        maxPax: 10
      },
      
      validFrom: (() => {
        if (state.packageValidFrom) return state.packageValidFrom
        const cheapestRoom = [...state.selectedHotel.rooms].sort((a: any, b: any) =>
          getRoomAdultBase(a) - getRoomAdultBase(b)
        )[0]
        return new Date(cheapestRoom?.validFrom || Date.now())
      })(),
      validTo: (() => {
        if (state.packageValidTo) return state.packageValidTo
        const cheapestRoom = [...state.selectedHotel.rooms].sort((a: any, b: any) =>
          getRoomAdultBase(a) - getRoomAdultBase(b)
        )[0]
        return new Date(cheapestRoom?.validTo || Date.now() + 90 * 24 * 60 * 60 * 1000)
      })(),
      
      status: 'draft'
    }
    
    await onSubmit(data)
  }

  const canGoBack = (): boolean => {
    return state.currentStep !== 'destination' && !state.isSearching
  }

  const canGoNext = (): boolean => {
    switch (state.currentStep) {
      case 'destination':
        return !!state.destination.city
      case 'hotel':
        return state.selectedHotel !== null
      case 'hotel-config':
        return state.hotelMarkup.value > 0
      case 'summary':
        return state.packageName.trim() !== ''
      default:
        return true
    }
  }

  const handleBack = () => {
    if (!canGoBack()) return
    
    // Usar lógica dinámica según offerType
    const previousStep = getPreviousStep(offerType, state.currentStep)
    if (!previousStep) return
    
    // Reset de datos si vuelve a destination
    if (previousStep === 'destination') {
      state.setSelectedHotel(null)
      state.setHotelMarkup({ type: 'percentage', value: 0 })
    }
    
    state.setCurrentStep(previousStep)
  }

  const handleNext = () => {
    if (!canGoNext()) return
    
    switch (state.currentStep) {
      case 'destination':
        handleStartJourney()
        break
      case 'hotel':
        if (state.selectedHotel) {
          state.setCurrentStep('hotel-config')
        }
        break
      case 'hotel-config':
        handleContinueAfterHotelConfig()
        break
      case 'flight-ida':
        if (state.flightIda) {
          const nextStep = getNextStep(offerType, 'flight-ida')
          if (nextStep === 'searching-flights-vuelta') {
            state.setCurrentStep('searching-flights-vuelta')
            searchFlights('return', state.destination.city, 'CDMX')
          } else if (nextStep) {
            state.setCurrentStep(nextStep)
          }
        }
        break
      case 'flight-vuelta':
        if (state.flightVuelta) {
          const nextStep = getNextStep(offerType, 'flight-vuelta')
          if (nextStep === 'transport-arrival') {
            state.setCurrentStep('transport-arrival')
            searchTransports(state.destination.city)
          } else if (nextStep) {
            state.setCurrentStep(nextStep)
          }
        }
        break
      case 'transport-arrival':
        if (state.transportArrival) {
          const nextStep = getNextStep(offerType, 'transport-arrival')
          if (nextStep) state.setCurrentStep(nextStep)
        }
        break
      case 'transport-departure':
        if (state.transportDeparture) {
          const nextStep = getNextStep(offerType, 'transport-departure')
          if (nextStep === 'searching-activities') {
            state.setCurrentStep('searching-activities')
            searchActivities(state.destination.city)
          } else if (nextStep) {
            state.setCurrentStep(nextStep)
          }
        }
        break
      case 'activities':
        state.setCurrentStep('summary')
        break
      case 'summary':
        handleSubmit()
        break
    }
  }

  const handleCancel = async () => {
    if (state.currentStep === 'destination' && !packageData) {
      onClose()
      return
    }
    
    const confirmed = await confirm({
      title: packageData ? 'Cancelar edición' : 'Cancelar creación de paquete',
      message: packageData 
        ? '¿Estás seguro? Se perderán los cambios realizados.'
        : '¿Estás seguro? Se perderá toda la información ingresada hasta ahora.',
      confirmText: 'Sí, cancelar',
      cancelText: 'No, continuar',
      type: 'danger'
    })
    
    if (confirmed) {
      onClose()
    }
  }

  const hasBasicInfo = state.destination.city && state.selectedHotel
  const totalCost = hasBasicInfo ? calculateTotalCost() : 0
  const totalSelling = hasBasicInfo ? calculateTotalSelling() : 0

  return (
    <>
      <ConfirmDialog />
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        size="5xl"
        scrollBehavior="inside"
        isDismissable={false}
        hideCloseButton
        classNames={{
          base: 'h-[92vh]',
          body: 'p-4'
        }}
      >
        <ModalContent>
          <ModalHeader className="border-b">
            <div className="flex items-center gap-3 w-full">
              {offerType === 'hotel' && <HotelIcon size={24} className="text-success" />}
              {offerType === 'flight' && <Plane size={24} className="text-primary" />}
              {offerType === 'package' && <Package size={24} className="text-purple-600" />}
              {offerType === 'transport' && <Bus size={24} className="text-orange-600" />}
              {offerType === 'activity' && <Palmtree size={24} className="text-pink-600" />}
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {packageData ? 
                    `Editar ${offerType === 'hotel' ? 'Hotel' : offerType === 'flight' ? 'Vuelo' : offerType === 'package' ? 'Paquete' : offerType === 'transport' ? 'Transporte' : 'Actividad'}` :
                    `Crear ${offerType === 'hotel' ? 'Hotel' : offerType === 'flight' ? 'Vuelo' : offerType === 'package' ? 'Paquete' : offerType === 'transport' ? 'Transporte' : 'Actividad'}`
                  }
                </h2>
                <p className="text-sm text-default-500 font-normal">
                  {state.packageName || (packageData ? 'Editando...' : `Nuevo ${offerType === 'hotel' ? 'hotel' : offerType === 'flight' ? 'vuelo' : offerType === 'package' ? 'paquete' : offerType === 'transport' ? 'transporte' : 'actividad'}`)}
                </p>
              </div>
              {state.destination.city && (
                <div className="flex items-center gap-2">
                  <Chip size="sm" color="success" variant="flat">
                    {state.destination.city}
                  </Chip>
                  <Chip size="sm" variant="flat">
                    {state.days}D/{state.nights}N
                  </Chip>
                </div>
              )}
            </div>
          </ModalHeader>

          <ModalBody className="p-4 flex flex-col gap-3">
            <ProgressBar currentStep={state.currentStep} />
            
            <div className="flex-1 min-h-0">
              <AnimatePresence mode="wait">
                {state.currentStep === 'destination' && (
                  <DestinationStep state={state} allHotels={allHotels} />
                )}
                
                {isStepIncluded(offerType, 'searching-hotels') && state.currentStep === 'searching-hotels' && (
                  <SearchingAnimation message={`Buscando hoteles en ${state.destination.city}...`} />
                )}
                {isStepIncluded(offerType, 'hotel') && state.currentStep === 'hotel' && (
                  <HotelSelectionStep state={state} onSelectHotel={handleSelectHotel} />
                )}
                {isStepIncluded(offerType, 'hotel-config') && state.currentStep === 'hotel-config' && (
                  <HotelMarkupConfigStep 
                    state={state} 
                    calculateTotalCost={calculateTotalCost}
                    calculateTotalSelling={calculateTotalSelling}
                  />
                )}
                
                {isStepIncluded(offerType, 'searching-flights-ida') && state.currentStep === 'searching-flights-ida' && (
                  <SearchingAnimation message="Buscando vuelos de ida..." />
                )}
                {isStepIncluded(offerType, 'flight-ida') && state.currentStep === 'flight-ida' && (
                  <FlightSelectionStep 
                    state={state}
                    type="ida"
                    flights={state.availableFlightsIda}
                    onSelect={handleSelectFlightIda}
                    onSkip={handleSkipFlightIda}
                  />
                )}
                
                {isStepIncluded(offerType, 'searching-flights-vuelta') && state.currentStep === 'searching-flights-vuelta' && (
                  <SearchingAnimation message="Buscando vuelos de vuelta..." />
                )}
                {isStepIncluded(offerType, 'flight-vuelta') && state.currentStep === 'flight-vuelta' && (
                  <FlightSelectionStep 
                    state={state}
                    type="vuelta"
                    flights={state.availableFlightsVuelta}
                    onSelect={handleSelectFlightVuelta}
                    onSkip={handleSkipFlightVuelta}
                  />
                )}
                
                {isStepIncluded(offerType, 'transport-arrival') && state.currentStep === 'transport-arrival' && (
                  <TransportSelectionStep 
                    state={state}
                    type="arrival"
                    onSelect={handleSelectTransportArrival}
                    onSkip={handleSkipTransportArrival}
                  />
                )}
                {isStepIncluded(offerType, 'transport-departure') && state.currentStep === 'transport-departure' && (
                  <TransportSelectionStep 
                    state={state}
                    type="departure"
                    onSelect={handleSelectTransportDeparture}
                    onSkip={handleSkipTransportDeparture}
                  />
                )}
                
                {isStepIncluded(offerType, 'searching-activities') && state.currentStep === 'searching-activities' && (
                  <SearchingAnimation message="Buscando actividades increíbles..." />
                )}
                {isStepIncluded(offerType, 'activities') && state.currentStep === 'activities' && (
                  <ActivitiesSelectionStep 
                    state={state}
                    onContinue={handleContinueToSummary}
                  />
                )}
                
                {state.currentStep === 'summary' && (
                  <SummaryStep 
                    state={state}
                    totalCost={totalCost}
                    totalSelling={totalSelling}
                  />
                )}
              </AnimatePresence>
            </div>
          </ModalBody>

          <ModalFooter className="border-t py-2 px-6">
            <div className="flex items-center justify-between w-full">
              <FooterSummary 
                destination={state.destination}
                totalCost={totalCost}
                totalSelling={totalSelling}
                hasBasicInfo={hasBasicInfo}
              />
              
              <FooterControls 
                currentStep={state.currentStep}
                isSearching={state.isSearching}
                isLoading={isLoading}
                canGoBack={canGoBack()}
                canGoNext={canGoNext()}
                onBack={handleBack}
                onNext={handleNext}
                onCancel={handleCancel}
              />
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
