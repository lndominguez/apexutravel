'use client'

import { useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from '@heroui/react'
import { Hotel as HotelIcon } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useInventory } from '@/swr'
import { useConfirm } from '@/hooks/useConfirm'
import { useNotification } from '@/hooks/useNotification'
import { useHotelJourneyState } from './hooks/useHotelJourneyState'
import { DestinationStep } from '../package-journey/steps/DestinationStep'
import { HotelSelectionStep } from '../package-journey/steps/HotelSelectionStep'
import { HotelMarkupConfigStep } from '../package-journey/steps/HotelMarkupConfigStep'
import { HotelSummaryStep } from './steps/HotelSummaryStep'

interface SearchingAnimationProps {
  message: string
}

function SearchingAnimation({ message }: SearchingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-lg text-default-600">{message}</p>
    </div>
  )
}

interface OfferHotelJourneyProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  hotel?: any
  isLoading?: boolean
}

export default function OfferHotelJourney({
  isOpen,
  onClose,
  onSubmit,
  hotel,
  isLoading = false
}: OfferHotelJourneyProps) {
  const state = useHotelJourneyState(hotel)
  const { confirm, ConfirmDialog } = useConfirm()
  const notification = useNotification()
  
  const { inventory: allHotels } = useInventory({ resourceType: 'Hotel', status: 'active', pricingMode: 'per_night', limit: 500 })

  useEffect(() => {
    if (!isOpen && !hotel) {
      state.resetState()
    }
  }, [isOpen, hotel])

  const searchHotels = (city: string) => {
    state.setIsSearching(true)
    
    setTimeout(() => {
      const filtered = allHotels.filter((h: any) => {
        const hotelCity = h.resource?.location?.city || ''
        return hotelCity.toLowerCase() === city.toLowerCase()
      })
      
      state.setAvailableHotels(filtered)
      state.setCurrentStep('hotel')
      state.setIsSearching(false)
    }, 1500)
  }

  const handleStartJourney = () => {
    if (!state.destination.city) {
      notification.error('Error', 'Por favor selecciona un destino')
      return
    }
    state.setCurrentStep('searching-hotels')
    searchHotels(state.destination.city)
  }

  const handleSelectHotel = (hotel: any) => {
    state.setSelectedHotel(hotel)
    state.setCurrentStep('hotel-config')
  }

  const calculateTotalCost = () => {
    if (!state.selectedHotel) return 0
    
    // El inventario de hoteles usa rooms con priceAdult
    // Usamos la primera habitación disponible para el cálculo base
    const firstRoom = state.selectedHotel.rooms?.[0]
    if (!firstRoom) return 0
    
    const pricePerNight = firstRoom.priceAdult || 0
    return pricePerNight * state.nights
  }

  const calculateTotalSelling = () => {
    const cost = calculateTotalCost()
    if (state.hotelMarkup.type === 'percentage') {
      return cost + (cost * state.hotelMarkup.value / 100)
    }
    return cost + state.hotelMarkup.value
  }

  const handleSubmit = async () => {
    const totalCost = calculateTotalCost()
    const totalSelling = calculateTotalSelling()

    const offerData = {
      code: state.packageCode,
      name: state.packageName,
      description: state.description,
      category: state.category,
      type: 'hotel',
      duration: {
        days: state.days,
        nights: state.nights
      },
      destination: state.destination,
      validFrom: state.packageValidFrom,
      validTo: state.packageValidTo,
      items: [
        {
          type: 'Hotel',
          resourceType: 'Hotel',
          inventoryId: state.selectedHotel._id,
          inventoryName: state.selectedHotel.inventoryName,
          resource: state.selectedHotel.resource,
          selectedRooms: state.selectedHotel.rooms?.map((room: any) => {
            const roomId = room._id
            const roomDates = state.useRoomSpecificAvailability && state.roomAvailabilityDates?.[roomId]
            
            return {
              ...room,
              // Si hay disponibilidad por habitación configurada, usar esas fechas
              // Si no, se usarán las fechas globales de la oferta (validFrom/validTo)
              validFrom: roomDates?.validFrom || undefined,
              validTo: roomDates?.validTo || undefined
            }
          }),
          quantity: 1,
          nights: state.nights,
          markup: state.hotelMarkup
        }
      ],
      pricing: {
        cost: totalCost,
        selling: totalSelling,
        commission: totalSelling - totalCost
      }
    }

    await onSubmit(offerData)
  }

  const canGoBack = () => {
    return state.currentStep !== 'destination' && state.currentStep !== 'searching-hotels'
  }

  const canGoNext = () => {
    switch (state.currentStep) {
      case 'destination':
        return !!state.destination.city
      case 'hotel':
        return !!state.selectedHotel
      case 'hotel-config':
        return !!state.packageName && !!state.selectedHotel && !!state.packageValidFrom && !!state.packageValidTo
      case 'summary':
        return !!state.packageName && !!state.selectedHotel
      default:
        return false
    }
  }

  const handleBack = () => {
    switch (state.currentStep) {
      case 'hotel':
        state.setCurrentStep('destination')
        break
      case 'hotel-config':
        state.setCurrentStep('hotel')
        break
      case 'summary':
        state.setCurrentStep('hotel-config')
        break
    }
  }

  const handleNext = async () => {
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
        // Actualizar días/noches basado en fechas
        if (state.packageValidFrom && state.packageValidTo) {
          state.updateDurationFromDates(state.packageValidFrom, state.packageValidTo)
        }
        state.setCurrentStep('summary')
        break
      case 'summary':
        await handleSubmit()
        break
    }
  }

  const handleCancel = async () => {
    if (state.currentStep === 'destination' && !hotel) {
      onClose()
      return
    }
    
    const confirmed = await confirm({
      title: hotel ? 'Cancelar edición' : 'Cancelar creación de oferta',
      message: hotel 
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

  // Progress calculation
  const steps = ['destination', 'hotel', 'hotel-config', 'summary']
  let effectiveStep = state.currentStep
  if (state.currentStep === 'searching-hotels') effectiveStep = 'hotel'
  const currentIndex = steps.indexOf(effectiveStep)
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0

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
              <HotelIcon size={24} className="text-primary" />
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {hotel ? 'Editar Oferta de Hotel' : 'Crear Oferta de Hotel'}
                </h2>
                <p className="text-sm text-default-500 font-normal">
                  {state.packageName || (hotel ? 'Editando...' : 'Nueva oferta de hotel')}
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
            {/* Progress indicator */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-default-500 mb-2">
                <span>Paso {currentIndex + 1} de {steps.length}</span>
                <span>{Math.round(progress)}% completado</span>
              </div>
              <div className="h-2 bg-default-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-success transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            <div className="flex-1 min-h-0">
              <AnimatePresence mode="wait">
                {state.currentStep === 'destination' && (
                  <DestinationStep state={state} allHotels={allHotels} />
                )}
                
                {state.currentStep === 'searching-hotels' && (
                  <SearchingAnimation message={`Buscando hoteles en ${state.destination.city}...`} />
                )}

                {state.currentStep === 'hotel' && (
                  <HotelSelectionStep state={state} onSelectHotel={handleSelectHotel} />
                )}

                {state.currentStep === 'hotel-config' && (
                  <HotelMarkupConfigStep 
                    state={state} 
                    calculateTotalCost={calculateTotalCost}
                    calculateTotalSelling={calculateTotalSelling}
                  />
                )}
                
                {state.currentStep === 'summary' && (
                  <HotelSummaryStep 
                    state={state}
                    totalCost={totalCost}
                    totalSelling={totalSelling}
                  />
                )}
              </AnimatePresence>
            </div>
          </ModalBody>

          <ModalFooter className="border-t py-3 px-6">
            <div className="flex items-center justify-between w-full">
              {/* Left side - Summary info */}
              <div className="flex items-center gap-3">
                {hasBasicInfo ? (
                  <>
                    <div className="text-xs">
                      <p className="text-default-500">Total</p>
                      <p className="font-bold text-success text-lg">${totalSelling.toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-default-400 italic">Completa los pasos...</p>
                )}
              </div>

              {/* Right side - Controls */}
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-default-600 hover:text-default-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canGoBack()}
                  onClick={handleBack}
                >
                  Atrás
                </button>
                
                <button
                  className="px-6 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canGoNext()}
                  onClick={handleNext}
                >
                  {state.currentStep === 'summary' ? 'Crear Oferta' : 'Siguiente'}
                </button>
                
                <button
                  className="px-4 py-2 text-sm font-medium text-danger hover:bg-danger-50 rounded-lg"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
