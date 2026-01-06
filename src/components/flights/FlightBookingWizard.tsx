'use client'

import { useState } from 'react'
import ClassSelectionModal from './ClassSelectionModal'
import FlightExtrasModal from './FlightExtrasModal'
import PassengerDataModal from './PassengerDataModal'
import { FlightData } from './FlightResultCard'

type BookingStep = 
  | 'select-class-outbound'
  | 'configure-extras-outbound'
  | 'passenger-data'
  | 'select-class-return'
  | 'configure-extras-return'
  | 'complete'

interface SelectedClassData {
  type: string
  price: number
  currency: string
  baggage: {
    carry: string
    checked: string
  }
  seatSelection?: boolean
  amenities: string[]
}

interface ExtrasData {
  additionalBaggage: number[]
  selectedSeats?: string[]
}

interface PassengerData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  documentType: string
  documentNumber: string
  nationality: string
}

interface BookingData {
  outbound: {
    flight: FlightData
    selectedClass?: SelectedClassData
    extras?: ExtrasData
  }
  return?: {
    flight: FlightData
    selectedClass?: SelectedClassData
    extras?: ExtrasData
  }
  passengers?: PassengerData[]
}

interface FlightBookingWizardProps {
  isOpen: boolean
  outboundFlight: FlightData
  returnFlight?: FlightData
  passengers: number
  onComplete: (bookingData: BookingData) => void
  onCancel: () => void
}

export default function FlightBookingWizard({
  isOpen,
  outboundFlight,
  returnFlight,
  passengers,
  onComplete,
  onCancel
}: FlightBookingWizardProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('select-class-outbound')
  const [bookingData, setBookingData] = useState<BookingData>({
    outbound: { flight: outboundFlight },
    return: returnFlight ? { flight: returnFlight } : undefined
  })

  // Handlers para cada paso
  const handleOutboundClassSelected = (classType: string, price: number, currency: string) => {
    const selectedClassData = outboundFlight.classes.find(c => c.type === classType)
    if (!selectedClassData) return

    setBookingData(prev => ({
      ...prev,
      outbound: {
        ...prev.outbound,
        selectedClass: {
          type: classType,
          price,
          currency,
          baggage: selectedClassData.baggage,
          seatSelection: selectedClassData.seatSelection,
          amenities: selectedClassData.amenities
        }
      }
    }))
    
    setCurrentStep('configure-extras-outbound')
  }

  const handleOutboundExtrasConfigured = (extras: ExtrasData) => {
    setBookingData(prev => ({
      ...prev,
      outbound: {
        ...prev.outbound,
        extras
      }
    }))
    
    setCurrentStep('passenger-data')
  }

  const handlePassengerDataCompleted = (passengersData: PassengerData[]) => {
    setBookingData(prev => ({
      ...prev,
      passengers: passengersData
    }))
    
    // Si hay vuelo de retorno, ir a selección de clase de retorno
    if (returnFlight) {
      setCurrentStep('select-class-return')
    } else {
      // Si no hay retorno, completar
      setCurrentStep('complete')
      onComplete({
        ...bookingData,
        passengers: passengersData
      })
    }
  }

  const handleReturnClassSelected = (classType: string, price: number, currency: string) => {
    if (!returnFlight) return
    
    const selectedClassData = returnFlight.classes.find(c => c.type === classType)
    if (!selectedClassData) return

    setBookingData(prev => ({
      ...prev,
      return: {
        ...prev.return!,
        selectedClass: {
          type: classType,
          price,
          currency,
          baggage: selectedClassData.baggage,
          seatSelection: selectedClassData.seatSelection,
          amenities: selectedClassData.amenities
        }
      }
    }))
    
    setCurrentStep('configure-extras-return')
  }

  const handleReturnExtrasConfigured = (extras: ExtrasData) => {
    setBookingData(prev => ({
      ...prev,
      return: {
        ...prev.return!,
        extras
      }
    }))
    
    // Completar proceso
    setCurrentStep('complete')
    onComplete({
      ...bookingData,
      return: {
        ...bookingData.return!,
        extras
      }
    })
  }

  const handleCancel = () => {
    setCurrentStep('select-class-outbound')
    setBookingData({
      outbound: { flight: outboundFlight },
      return: returnFlight ? { flight: returnFlight } : undefined
    })
    onCancel()
  }

  // No renderizar nada si el wizard no está abierto
  if (!isOpen) return null

  return (
    <>
      {/* Paso 1: Selección de clase de IDA */}
      <ClassSelectionModal
        isOpen={currentStep === 'select-class-outbound'}
        onClose={handleCancel}
        flightNumber={outboundFlight.flightNumber}
        airlineName={outboundFlight.airline.name}
        classes={outboundFlight.classes}
        defaultClass="economy"
        onSelectClass={handleOutboundClassSelected}
      />

      {/* Paso 2: Configuración de extras de IDA */}
      {bookingData.outbound.selectedClass && (
        <FlightExtrasModal
          isOpen={currentStep === 'configure-extras-outbound'}
          onClose={handleCancel}
          flightNumber={outboundFlight.flightNumber}
          airlineName={outboundFlight.airline.name}
          selectedClass={bookingData.outbound.selectedClass}
          passengers={passengers}
          onContinue={handleOutboundExtrasConfigured}
        />
      )}

      {/* Paso 3: Datos de pasajeros */}
      <PassengerDataModal
        isOpen={currentStep === 'passenger-data'}
        onClose={handleCancel}
        passengers={passengers}
        flightNumber={outboundFlight.flightNumber}
        airlineName={outboundFlight.airline.name}
        onContinue={handlePassengerDataCompleted}
      />

      {/* Paso 4: Selección de clase de RETORNO (si aplica) */}
      {returnFlight && (
        <ClassSelectionModal
          isOpen={currentStep === 'select-class-return'}
          onClose={handleCancel}
          flightNumber={returnFlight.flightNumber}
          airlineName={returnFlight.airline.name}
          classes={returnFlight.classes}
          defaultClass="economy"
          onSelectClass={handleReturnClassSelected}
        />
      )}

      {/* Paso 5: Configuración de extras de RETORNO (si aplica) */}
      {returnFlight && bookingData.return?.selectedClass && (
        <FlightExtrasModal
          isOpen={currentStep === 'configure-extras-return'}
          onClose={handleCancel}
          flightNumber={returnFlight.flightNumber}
          airlineName={returnFlight.airline.name}
          selectedClass={bookingData.return.selectedClass}
          passengers={passengers}
          onContinue={handleReturnExtrasConfigured}
        />
      )}
    </>
  )
}
