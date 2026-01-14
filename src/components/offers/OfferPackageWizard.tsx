'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress
} from '@heroui/react'
import { ArrowLeft, ArrowRight, Save, Check } from 'lucide-react'
import Step1BasicInfo from './wizard/Step1BasicInfo'
import Step2Components from './wizard/Step2Components'
import Step3Pricing from './wizard/Step3Pricing'
import Step4Details from './wizard/Step4Details'

interface OfferPackageWizardProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  package?: any
}

export default function OfferPackageWizard({ 
  isOpen, 
  onClose, 
  onSubmit, 
  package: packageData 
}: OfferPackageWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estado del formulario completo
  const [formData, setFormData] = useState({
    // Paso 1: Información básica
    name: '',
    code: '',
    description: '',
    destination: { city: '', country: '', region: '' },
    duration: { days: 3, nights: 2 },
    category: 'beach' as const,
    images: [] as string[],
    
    // Paso 2: Componentes
    components: {
      hotel: {
        inventoryItems: [] as any[],
        nights: 2,
        required: true
      },
      flights: [] as any[],
      transports: [] as any[],
      activities: [] as any[]
    },
    
    // Paso 3: Pricing
    pricing: {
      markup: {
        type: 'percentage' as const,
        value: 20
      },
      baseExample: {
        adults: 2,
        children: 0,
        roomConfig: '',
        totalCost: 0,
        totalSelling: 0,
        pricePerPerson: 0
      },
      currency: 'USD' as const
    },
    
    // Paso 4: Detalles finales
    validFrom: '',
    validTo: '',
    itinerary: [] as any[],
    included: [] as string[],
    notIncluded: [] as string[],
    policies: {
      cancellation: '',
      payment: '',
      changes: ''
    },
    requirements: {
      passport: false,
      visa: false,
      vaccination: [] as string[],
      minAge: undefined,
      maxAge: undefined
    },
    features: {
      hotelStars: undefined,
      includesFlights: false,
      includesTransfers: false,
      allInclusive: false,
      familyFriendly: false,
      petFriendly: false
    },
    featured: false,
    tags: [] as string[],
    status: 'draft' as const,
    notes: '',
    internalNotes: ''
  })

  // Cargar datos del paquete al editar
  useEffect(() => {
    if (packageData && isOpen) {
      setFormData({
        name: packageData.name || '',
        code: packageData.code || '',
        description: packageData.description || '',
        destination: packageData.destination || { city: '', country: '', region: '' },
        duration: packageData.duration || { days: 3, nights: 2 },
        category: packageData.category || 'beach',
        images: packageData.images || [],
        components: packageData.components || {
          hotel: { inventoryItems: [], nights: 2, required: true },
          flights: [],
          transports: [],
          activities: []
        },
        pricing: packageData.pricing || {
          markup: { type: 'percentage', value: 20 },
          baseExample: {
            adults: 2,
            children: 0,
            roomConfig: '',
            totalCost: 0,
            totalSelling: 0,
            pricePerPerson: 0
          },
          currency: 'USD'
        },
        validFrom: packageData.validFrom ? new Date(packageData.validFrom).toISOString().split('T')[0] : '',
        validTo: packageData.validTo ? new Date(packageData.validTo).toISOString().split('T')[0] : '',
        itinerary: packageData.itinerary || [],
        included: packageData.included || [],
        notIncluded: packageData.notIncluded || [],
        policies: packageData.policies || { cancellation: '', payment: '', changes: '' },
        requirements: packageData.requirements || {
          passport: false,
          visa: false,
          vaccination: [],
          minAge: undefined,
          maxAge: undefined
        },
        features: packageData.features || {
          hotelStars: undefined,
          includesFlights: false,
          includesTransfers: false,
          allInclusive: false,
          familyFriendly: false,
          petFriendly: false
        },
        featured: packageData.featured || false,
        tags: packageData.tags || [],
        status: packageData.status || 'draft',
        notes: packageData.notes || '',
        internalNotes: packageData.internalNotes || ''
      })
    }
  }, [packageData, isOpen])

  // Resetear al cerrar
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1)
      if (!packageData) {
        setFormData({
          name: '',
          code: '',
          description: '',
          destination: { city: '', country: '', region: '' },
          duration: { days: 3, nights: 2 },
          category: 'beach',
          images: [],
          components: {
            hotel: { inventoryItems: [], nights: 2, required: true },
            flights: [],
            transports: [],
            activities: []
          },
          pricing: {
            markup: { type: 'percentage', value: 20 },
            baseExample: {
              adults: 2,
              children: 0,
              roomConfig: '',
              totalCost: 0,
              totalSelling: 0,
              pricePerPerson: 0
            },
            currency: 'USD'
          },
          validFrom: '',
          validTo: '',
          itinerary: [],
          included: [],
          notIncluded: [],
          policies: { cancellation: '', payment: '', changes: '' },
          requirements: {
            passport: false,
            visa: false,
            vaccination: [],
            minAge: undefined,
            maxAge: undefined
          },
          features: {
            hotelStars: undefined,
            includesFlights: false,
            includesTransfers: false,
            allInclusive: false,
            familyFriendly: false,
            petFriendly: false
          },
          featured: false,
          tags: [],
          status: 'draft',
          notes: '',
          internalNotes: ''
        })
      }
    }
  }, [isOpen, packageData])

  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (saveAsDraft = false) => {
    setIsSubmitting(true)
    try {
      const submitData = {
        ...formData,
        status: saveAsDraft ? 'draft' : formData.status
      }
      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error('Error al guardar paquete:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: 'Información Básica', component: Step1BasicInfo },
    { number: 2, title: 'Componentes', component: Step2Components },
    { number: 3, title: 'Pricing', component: Step3Pricing },
    { number: 4, title: 'Detalles Finales', component: Step4Details }
  ]

  const CurrentStepComponent = steps[currentStep - 1].component
  const progress = (currentStep / 4) * 100

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      isDismissable={false}
      classNames={{
        base: "max-h-[90vh]",
        body: "p-0"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-3 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {packageData ? 'Editar Paquete' : 'Crear Nuevo Paquete'}
            </h2>
            <div className="text-sm text-default-500">
              Paso {currentStep} de 4
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              color="primary"
              className="max-w-full"
            />
            <div className="flex justify-between text-xs">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`flex-1 text-center ${
                    currentStep === step.number
                      ? 'text-primary font-semibold'
                      : currentStep > step.number
                      ? 'text-success'
                      : 'text-default-400'
                  }`}
                >
                  {step.title}
                </div>
              ))}
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="p-6">
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
          />
        </ModalBody>

        <ModalFooter className="border-t">
          <div className="flex justify-between w-full">
            <div>
              {currentStep > 1 && (
                <Button
                  variant="light"
                  onPress={handleBack}
                  startContent={<ArrowLeft size={18} />}
                  isDisabled={isSubmitting}
                >
                  Atrás
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="light"
                onPress={onClose}
                isDisabled={isSubmitting}
              >
                Cancelar
              </Button>
              
              {currentStep === 4 && (
                <Button
                  variant="flat"
                  onPress={() => handleSubmit(true)}
                  isLoading={isSubmitting}
                  startContent={<Save size={18} />}
                >
                  Guardar Borrador
                </Button>
              )}
              
              {currentStep < 4 ? (
                <Button
                  color="primary"
                  onPress={handleNext}
                  endContent={<ArrowRight size={18} />}
                  isDisabled={isSubmitting}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  color="primary"
                  onPress={() => handleSubmit(false)}
                  isLoading={isSubmitting}
                  startContent={<Check size={18} />}
                >
                  {packageData ? 'Actualizar Paquete' : 'Publicar Paquete'}
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
