import { useState } from 'react'
import { JourneyStep } from '../../package-journey/hooks/usePackageJourneyState'

export type HotelJourneyStep = 
  | 'destination' 
  | 'searching-hotels'
  | 'hotel'
  | 'hotel-config'
  | 'summary'

export interface HotelJourneyState {
  // Navigation
  currentStep: JourneyStep
  setCurrentStep: (step: JourneyStep) => void
  isSearching: boolean
  setIsSearching: (searching: boolean) => void
  
  // Package info
  packageName: string
  setPackageName: (name: string) => void
  packageDescription: string
  setPackageDescription: (description: string) => void
  packageCode: string
  setPackageCode: (code: string) => void
  category: string
  setCategory: (category: string) => void
  
  // Compatibility props for shared steps (not used in hotel journey but needed for type compatibility)
  description: string
  setDescription: (desc: string) => void
  origin: string
  flightIda: any
  setFlightIda: (value: any) => void
  flightVuelta: any
  setFlightVuelta: (value: any) => void
  transportArrival: any
  setTransportArrival: (value: any) => void
  transportDeparture: any
  setTransportDeparture: (value: any) => void
  selectedActivities: any[]
  setSelectedActivities: (value: any[]) => void
  availableFlightsIda: any[]
  setAvailableFlightsIda: (value: any[]) => void
  availableFlightsVuelta: any[]
  setAvailableFlightsVuelta: (value: any[]) => void
  availableTransports: any[]
  setAvailableTransports: (value: any[]) => void
  availableActivities: any[]
  setAvailableActivities: (value: any[]) => void
  flightSearchTerm: string
  setFlightSearchTerm: (value: string) => void
  transportSearchTerm: string
  setTransportSearchTerm: (value: string) => void
  activitySearchTerm: string
  setActivitySearchTerm: (value: string) => void
  
  // Destination
  destination: {
    city: string
    country: string
  }
  setDestination: (dest: { city: string; country: string }) => void
  
  // Duration
  days: number
  nights: number
  setDays: (days: number) => void
  setNights: (nights: number) => void
  
  // Offer validity
  packageValidFrom: Date | null
  packageValidTo: Date | null
  setPackageValidFrom: (date: Date | null) => void
  setPackageValidTo: (date: Date | null) => void
  
  // Hotel
  availableHotels: any[]
  setAvailableHotels: (hotels: any[]) => void
  selectedHotel: any
  setSelectedHotel: (hotel: any) => void
  hotelSearchTerm: string
  setHotelSearchTerm: (term: string) => void
  
  // Hotel markup configuration
  hotelMarkup: {
    type: string
    value: number
  }
  setHotelMarkup: (markup: { type: string; value: number }) => void
  
  // Disponibilidad por habitación
  useRoomSpecificAvailability: boolean
  setUseRoomSpecificAvailability: (value: boolean) => void
  roomAvailabilityDates: Record<string, { validFrom: Date | null; validTo: Date | null }>
  setRoomAvailabilityDate: (roomId: string, field: 'validFrom' | 'validTo', date: Date | null) => void
  
  // Helpers
  updateDurationFromDates: (start: Date | null, end: Date | null) => void
  
  // Utility
  resetState: () => void
}

const initialState = {
  packageName: '',
  packageDescription: '',
  packageCode: '',
  category: '',
  description: '',
  origin: 'CDMX',
  destination: { city: '', country: '' },
  days: 1,
  nights: 1,
  packageValidFrom: null,
  packageValidTo: null,
  availableHotels: [],
  selectedHotel: null,
  hotelSearchTerm: '',
  hotelMarkup: { type: 'percentage' as const, value: 20 },
  flightIda: null,
  flightVuelta: null,
  transportArrival: null,
  transportDeparture: null,
  selectedActivities: [],
  availableFlightsIda: [],
  availableFlightsVuelta: [],
  availableTransports: [],
  availableActivities: [],
  flightSearchTerm: '',
  transportSearchTerm: '',
  activitySearchTerm: ''
}

export function useHotelJourneyState(hotelData?: any): HotelJourneyState {
  const [currentStep, setCurrentStep] = useState<JourneyStep>('destination')
  const [isSearching, setIsSearching] = useState(false)
  
  const [packageName, setPackageName] = useState(hotelData?.name || '')
  const [packageDescription, setPackageDescription] = useState(hotelData?.description || '')
  const [packageCode, setPackageCode] = useState(hotelData?.code || '')
  const [category, setCategory] = useState(hotelData?.category || '')
  const [description, setDescription] = useState(hotelData?.description || '')
  const [origin] = useState('CDMX')
  
  const [destination, setDestination] = useState(
    hotelData?.destination || initialState.destination
  )
  
  const [days, setDays] = useState(hotelData?.duration?.days || 1)
  const [nights, setNights] = useState(hotelData?.duration?.nights || 1)
  
  const [packageValidFrom, setPackageValidFrom] = useState<Date | null>(
    hotelData?.validFrom ? new Date(hotelData.validFrom) : null
  )
  const [packageValidTo, setPackageValidTo] = useState<Date | null>(
    hotelData?.validTo ? new Date(hotelData.validTo) : null
  )
  
  const [availableHotels, setAvailableHotels] = useState<any[]>([])
  const [selectedHotel, setSelectedHotel] = useState(hotelData?.items?.find((i: any) => i.type === 'Hotel') || null)
  const [hotelSearchTerm, setHotelSearchTerm] = useState('')
  
  const [hotelMarkup, setHotelMarkup] = useState(
    hotelData?.items?.[0]?.markup || initialState.hotelMarkup
  )
  
  // Disponibilidad por habitación
  const [useRoomSpecificAvailability, setUseRoomSpecificAvailability] = useState(false)
  const [roomAvailabilityDates, setRoomAvailabilityDates] = useState<Record<string, { validFrom: Date | null; validTo: Date | null }>>({})
  
  const setRoomAvailabilityDate = (roomId: string, field: 'validFrom' | 'validTo', date: Date | null) => {
    setRoomAvailabilityDates(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: date
      }
    }))
  }
  
  // Compatibility states (not used but needed for type compatibility)
  const [flightIda, setFlightIda] = useState(null)
  const [flightVuelta, setFlightVuelta] = useState(null)
  const [transportArrival, setTransportArrival] = useState(null)
  const [transportDeparture, setTransportDeparture] = useState(null)
  const [selectedActivities, setSelectedActivities] = useState<any[]>([])
  const [availableFlightsIda, setAvailableFlightsIda] = useState<any[]>([])
  const [availableFlightsVuelta, setAvailableFlightsVuelta] = useState<any[]>([])
  const [availableTransports, setAvailableTransports] = useState<any[]>([])
  const [availableActivities, setAvailableActivities] = useState<any[]>([])
  const [flightSearchTerm, setFlightSearchTerm] = useState('')
  const [transportSearchTerm, setTransportSearchTerm] = useState('')
  const [activitySearchTerm, setActivitySearchTerm] = useState('')

  const updateDurationFromDates = (start: Date | null, end: Date | null) => {
    if (!start || !end) return
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    setDays(diffDays)
    setNights(diffDays - 1)
  }

  const resetState = () => {
    setCurrentStep('destination')
    setIsSearching(false)
    setPackageName('')
    setPackageDescription('')
    setPackageCode('')
    setCategory('')
    setDescription('')
    setDestination(initialState.destination)
    setDays(1)
    setNights(1)
    setPackageValidFrom(null)
    setPackageValidTo(null)
    setAvailableHotels([])
    setSelectedHotel(null)
    setHotelSearchTerm('')
    setHotelMarkup(initialState.hotelMarkup)
    setUseRoomSpecificAvailability(false)
    setRoomAvailabilityDates({})
    setFlightIda(null)
    setFlightVuelta(null)
    setTransportArrival(null)
    setTransportDeparture(null)
    setSelectedActivities([])
    setAvailableFlightsIda([])
    setAvailableFlightsVuelta([])
    setAvailableTransports([])
    setAvailableActivities([])
    setFlightSearchTerm('')
    setTransportSearchTerm('')
    setActivitySearchTerm('')
  }

  return {
    currentStep,
    setCurrentStep,
    isSearching,
    setIsSearching,
    packageName,
    setPackageName,
    packageDescription,
    setPackageDescription,
    packageCode,
    setPackageCode,
    category,
    setCategory,
    description,
    setDescription,
    origin,
    destination,
    setDestination,
    days,
    setDays,
    nights,
    setNights,
    packageValidFrom,
    setPackageValidFrom,
    packageValidTo,
    setPackageValidTo,
    availableHotels,
    setAvailableHotels,
    selectedHotel,
    setSelectedHotel,
    hotelSearchTerm,
    setHotelSearchTerm,
    hotelMarkup,
    setHotelMarkup,
    useRoomSpecificAvailability,
    setUseRoomSpecificAvailability,
    roomAvailabilityDates,
    setRoomAvailabilityDate,
    flightIda,
    setFlightIda,
    flightVuelta,
    setFlightVuelta,
    transportArrival,
    setTransportArrival,
    transportDeparture,
    setTransportDeparture,
    selectedActivities,
    setSelectedActivities,
    availableFlightsIda,
    setAvailableFlightsIda,
    availableFlightsVuelta,
    setAvailableFlightsVuelta,
    availableTransports,
    setAvailableTransports,
    availableActivities,
    setAvailableActivities,
    flightSearchTerm,
    setFlightSearchTerm,
    transportSearchTerm,
    setTransportSearchTerm,
    activitySearchTerm,
    setActivitySearchTerm,
    updateDurationFromDates,
    resetState
  }
}
