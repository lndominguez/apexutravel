'use client'

import { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Progress } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Building2, DollarSign, CheckCircle, RefreshCw, Trash2 } from 'lucide-react'
import { useInventory } from '@/swr'
import { DestinationStep } from './package-journey/steps/DestinationStep'
import { HotelSelectionStep } from './package-journey/steps/HotelSelectionStep'
import { HotelMarkupConfigStep } from './package-journey/steps/HotelMarkupConfigStep'
import { SummaryStep } from './package-journey/steps/SummaryStep'

interface ProviderPackageQuickCreateProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export default function ProviderPackageQuickCreate({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: ProviderPackageQuickCreateProps) {
  const [currentStep, setCurrentStep] = useState<'destination' | 'hotel' | 'hotel-config' | 'summary'>('destination')
  
  // State
  const [destination, setDestination] = useState({ city: '', country: '' })
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const [hotelMarkup, setHotelMarkup] = useState({ type: 'percentage', value: 10 })
  const [packageName, setPackageName] = useState('')
  const [description, setDescription] = useState('')
  const [nights, setNights] = useState(4)
  const [hotelSearchTerm, setHotelSearchTerm] = useState('')
  const [availableHotels, setAvailableHotels] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isRefreshingHotel, setIsRefreshingHotel] = useState(false)

  const { inventory: allHotels } = useInventory({ 
    resourceType: 'Hotel', 
    status: 'active', 
    pricingMode: 'package',
    limit: 500 
  })

  const searchHotels = (destCity: string) => {
    setIsSearching(true)
    setTimeout(() => {
      const filtered = (allHotels || []).filter((h: any) => {
        const hotelCity = h.resource?.location?.city || ''
        const hotelCountry = h.resource?.location?.country || ''
        return hotelCity.toLowerCase().includes(destCity.toLowerCase()) ||
               hotelCountry.toLowerCase().includes(destCity.toLowerCase())
      })
      setAvailableHotels(filtered)
      setCurrentStep('hotel')
      setIsSearching(false)
    }, 1000)
  }

  const handleStartJourney = () => {
    if (!destination.city) return
    searchHotels(destination.city)
  }

  const handleClose = () => {
    setCurrentStep('destination')
    setDestination({ city: '', country: '' })
    setSelectedHotel(null)
    setHotelMarkup({ type: 'percentage', value: 10 })
    setPackageName('')
    setDescription('')
    setNights(4)
    setHotelSearchTerm('')
    setAvailableHotels([])
    onClose()
  }

  const handleNext = () => {
    if (currentStep === 'destination') handleStartJourney()
    else if (currentStep === 'hotel' && selectedHotel) setCurrentStep('hotel-config')
    else if (currentStep === 'hotel-config') setCurrentStep('summary')
  }

  const handleBack = () => {
    if (currentStep === 'hotel') setCurrentStep('destination')
    else if (currentStep === 'hotel-config') setCurrentStep('hotel')
    else if (currentStep === 'summary') setCurrentStep('hotel-config')
  }

  const handleRefreshHotelInfo = async () => {
    if (!selectedHotel?.resource?._id && !selectedHotel?.resource) {
      alert('No se encontró el ID del recurso del hotel')
      return
    }

    const resourceId = selectedHotel.resource?._id || selectedHotel.resource
    setIsRefreshingHotel(true)
    
    try {
      const response = await fetch(`/api/resources/hotels/${resourceId}`)
      const data = await response.json()

      if (data.success && data.data) {
        const hotelResource = data.data
        
        // Actualizar selectedHotel con datos frescos del recurso
        setSelectedHotel({
          ...selectedHotel,
          resource: {
            ...selectedHotel.resource,
            name: hotelResource.name,
            stars: hotelResource.stars,
            location: hotelResource.location,
            photos: hotelResource.photos || [],
            policies: hotelResource.policies || selectedHotel.resource?.policies,
            amenities: hotelResource.amenities || []
          }
        })
        
        alert('✅ Información del hotel actualizada desde el recurso')
      } else {
        alert('❌ No se pudo obtener la información del hotel')
      }
    } catch (error) {
      console.error('Error refreshing hotel:', error)
      alert('❌ Ocurrió un error al recargar la información del hotel')
    } finally {
      setIsRefreshingHotel(false)
    }
  }

  const handleRemoveHotel = () => {
    if (!confirm('¿Estás seguro de quitar el hotel? Tendrás que seleccionar otro.')) {
      return
    }
    
    setSelectedHotel(null)
    setCurrentStep('hotel')
  }

  const handleSubmit = async () => {
    // Generar código único del paquete
    const timestamp = Date.now().toString().slice(-6)
    const code = `PKG-PROV-${timestamp}`
    
    const packageData = {
      code,
      name: packageName,
      description,
      type: 'package',
      coverPhoto: selectedHotel?.resource?.photos?.[0] || '',
      duration: {
        nights
      },
      markup: {
        type: hotelMarkup.type,
        value: hotelMarkup.value
      },
      items: [
        {
          inventoryId: selectedHotel?._id,
          resourceType: 'Hotel',
          mandatory: true,
          hotelInfo: {
            resourceId: selectedHotel?.resource?._id || selectedHotel?.resource,
            name: selectedHotel?.resource?.name || selectedHotel?.inventoryName,
            stars: selectedHotel?.resource?.stars || 0,
            location: {
              city: destination.city,
              country: destination.country || selectedHotel?.resource?.location?.country || ''
            }
          }
        }
      ],
      pricing: {
        currency: 'USD',
        basePrice: calculateTotalCost(),
        finalPrice: calculateTotalSelling()
      },
      rules: {
        allowRoomChange: true,
        allowFeatureChange: true,
        allowDatesChange: false,
        allowSeatSelection: false
      },
      availability: {
        type: 'inventory_based'
      },
      status: 'draft'
    }
    
    await onSubmit(packageData)
  }

  const canGoNext = () => {
    if (currentStep === 'destination') return !!destination.city
    if (currentStep === 'hotel') return !!selectedHotel
    if (currentStep === 'hotel-config') return hotelMarkup.value > 0
    return true
  }

  const canSubmit = () => packageName.trim() !== ''

  const calculateTotalCost = () => {
    if (!selectedHotel?.rooms?.length) return 0
    // Obtener la habitación más barata (doble adulto como referencia)
    const cheapest = [...selectedHotel.rooms].sort((a: any, b: any) => 
      (a.capacityPrices?.double?.adult || 0) - (b.capacityPrices?.double?.adult || 0)
    )[0]
    return cheapest?.capacityPrices?.double?.adult || 0
  }

  const calculateTotalSelling = () => {
    const base = calculateTotalCost()
    if (hotelMarkup.type === 'percentage') {
      return base + (base * hotelMarkup.value / 100)
    }
    return base + hotelMarkup.value
  }

  const days = nights + 1

  const state = {
    destination,
    setDestination,
    selectedHotel,
    setSelectedHotel,
    hotelMarkup,
    setHotelMarkup,
    packageName,
    setPackageName,
    description,
    setDescription,
    days,
    nights,
    setNights,
    hotelSearchTerm,
    setHotelSearchTerm,
    availableHotels,
    currentStep,
    isSearching,
    setIsSearching,
    isRefreshingHotel,
    handleRefreshHotelInfo,
    handleRemoveHotel
  }

  const quickSteps = [
    { id: 'destination', label: 'Destino', icon: MapPin },
    { id: 'hotel', label: 'Hotel', icon: Building2 },
    { id: 'hotel-config', label: 'Configuración', icon: DollarSign },
    { id: 'summary', label: 'Resumen', icon: CheckCircle }
  ]

  const currentStepIndex = quickSteps.findIndex(s => s.id === currentStep)
  const progressPercentage = ((currentStepIndex + 1) / quickSteps.length) * 100

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="5xl"
      scrollBehavior="inside"
      isDismissable={false}
    >
      <ModalContent>
        <ModalHeader>
          <div className="w-full space-y-4">
            <h2 className="text-xl font-bold">Crear Paquete Rápido</h2>
            
            {/* Progress Bar Simple */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                {quickSteps.map((step, idx) => {
                  const Icon = step.icon
                  const isActive = idx === currentStepIndex
                  const isCompleted = idx < currentStepIndex
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-1 flex-1">
                      <motion.div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-success text-white'
                            : isActive
                            ? 'bg-primary text-white scale-110'
                            : 'bg-default-200 text-default-400'
                        }`}
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Icon size={18} />
                      </motion.div>
                      <span className={`text-xs font-medium ${
                        isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-default-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              <Progress 
                value={progressPercentage} 
                color="primary"
                size="sm"
              />
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <AnimatePresence mode="wait">
            {currentStep === 'destination' && (
              <DestinationStep 
                state={state as any}
                allHotels={allHotels || []}
              />
            )}

            {currentStep === 'hotel' && (
              <HotelSelectionStep
                state={state as any}
                onSelectHotel={setSelectedHotel}
              />
            )}

            {currentStep === 'hotel-config' && (
              <HotelMarkupConfigStep
                state={state as any}
                calculateTotalCost={calculateTotalCost}
                calculateTotalSelling={calculateTotalSelling}
              />
            )}

            {currentStep === 'summary' && (
              <SummaryStep
                state={state as any}
                totalCost={calculateTotalCost()}
                totalSelling={calculateTotalSelling()}
              />
            )}
          </AnimatePresence>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="light"
            onPress={currentStep === 'destination' ? handleClose : handleBack}
          >
            {currentStep === 'destination' ? 'Cancelar' : 'Atrás'}
          </Button>
          
          {currentStep !== 'summary' ? (
            <Button
              color="primary"
              onPress={handleNext}
              isDisabled={!canGoNext() || isSearching}
              isLoading={isSearching}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              color="success"
              onPress={handleSubmit}
              isLoading={isLoading}
              isDisabled={!canSubmit()}
            >
              Crear Paquete
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
