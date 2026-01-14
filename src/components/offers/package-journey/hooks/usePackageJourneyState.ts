import { useState, useEffect } from 'react'

export type JourneyStep = 
  | 'destination' 
  | 'searching-hotels'
  | 'hotel'
  | 'hotel-config'
  | 'searching-flights-ida'
  | 'flight-ida'
  | 'searching-flights-vuelta'
  | 'flight-vuelta'
  | 'transport-arrival'
  | 'transport-departure'
  | 'searching-activities'
  | 'activities'
  | 'summary'

export interface PackageJourneyState {
  // Journey state
  currentStep: JourneyStep
  setCurrentStep: (step: JourneyStep) => void
  isSearching: boolean
  setIsSearching: (value: boolean) => void
  
  // Basic info
  packageCode: string
  setPackageCode: (value: string) => void
  packageName: string
  setPackageName: (value: string) => void
  description: string
  setDescription: (value: string) => void
  days: number
  setDays: (value: number) => void
  nights: number
  setNights: (value: number) => void
  
  // Destination
  destination: { city: string; country: string }
  setDestination: (value: { city: string; country: string }) => void
  origin: string
  
  // Dates
  packageValidFrom: Date | null
  setPackageValidFrom: (value: Date | null) => void
  packageValidTo: Date | null
  setPackageValidTo: (value: Date | null) => void
  
  // Components selected
  flightIda: any
  setFlightIda: (value: any) => void
  flightVuelta: any
  setFlightVuelta: (value: any) => void
  selectedHotel: any
  setSelectedHotel: (value: any) => void
  hotelMarkup: { type: string; value: number }
  setHotelMarkup: (value: { type: string; value: number }) => void
  transportArrival: any
  setTransportArrival: (value: any) => void
  transportDeparture: any
  setTransportDeparture: (value: any) => void
  selectedActivities: any[]
  setSelectedActivities: (value: any[]) => void
  
  // Search results
  availableFlightsIda: any[]
  setAvailableFlightsIda: (value: any[]) => void
  availableFlightsVuelta: any[]
  setAvailableFlightsVuelta: (value: any[]) => void
  availableHotels: any[]
  setAvailableHotels: (value: any[]) => void
  availableTransports: any[]
  setAvailableTransports: (value: any[]) => void
  availableActivities: any[]
  setAvailableActivities: (value: any[]) => void
  
  // Search filters
  flightSearchTerm: string
  setFlightSearchTerm: (value: string) => void
  transportSearchTerm: string
  setTransportSearchTerm: (value: string) => void
  activitySearchTerm: string
  setActivitySearchTerm: (value: string) => void
  hotelSearchTerm: string
  setHotelSearchTerm: (value: string) => void
  
  // Helpers
  updateDurationFromDates: (start: Date | null, end: Date | null) => void
  resetState: () => void
}

export function usePackageJourneyState(packageData?: any): PackageJourneyState {
  const [currentStep, setCurrentStep] = useState<JourneyStep>('destination')
  const [isSearching, setIsSearching] = useState(false)
  
  const [packageCode, setPackageCode] = useState('')
  const [packageName, setPackageName] = useState('')
  const [description, setDescription] = useState('')
  const [days, setDays] = useState(5)
  const [nights, setNights] = useState(4)
  
  const [destination, setDestination] = useState({ city: '', country: '' })
  const origin = 'CDMX'
  
  const [packageValidFrom, setPackageValidFrom] = useState<Date | null>(null)
  const [packageValidTo, setPackageValidTo] = useState<Date | null>(null)
  
  const [flightIda, setFlightIda] = useState<any>(null)
  const [flightVuelta, setFlightVuelta] = useState<any>(null)
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const [hotelMarkup, setHotelMarkup] = useState({ type: 'percentage', value: 10 })
  const [transportArrival, setTransportArrival] = useState<any>(null)
  const [transportDeparture, setTransportDeparture] = useState<any>(null)
  const [selectedActivities, setSelectedActivities] = useState<any[]>([])
  
  const [availableFlightsIda, setAvailableFlightsIda] = useState<any[]>([])
  const [availableFlightsVuelta, setAvailableFlightsVuelta] = useState<any[]>([])
  const [availableHotels, setAvailableHotels] = useState<any[]>([])
  const [availableTransports, setAvailableTransports] = useState<any[]>([])
  const [availableActivities, setAvailableActivities] = useState<any[]>([])
  
  const [flightSearchTerm, setFlightSearchTerm] = useState('')
  const [transportSearchTerm, setTransportSearchTerm] = useState('')
  const [activitySearchTerm, setActivitySearchTerm] = useState('')
  const [hotelSearchTerm, setHotelSearchTerm] = useState('')
  
  const updateDurationFromDates = (start: Date | null, end: Date | null) => {
    if (!start || !end) return
    const diffMs = end.getTime() - start.getTime()
    if (diffMs <= 0) return
    const nightsCalc = Math.round(diffMs / (1000 * 60 * 60 * 24))
    setNights(nightsCalc)
    setDays(nightsCalc + 1)
  }
  
  const resetState = () => {
    setCurrentStep('destination')
    setPackageCode('')
    setPackageName('')
    setDescription('')
    setDestination({ city: '', country: '' })
    setDays(5)
    setNights(4)
    setFlightIda(null)
    setFlightVuelta(null)
    setSelectedHotel(null)
    setTransportArrival(null)
    setTransportDeparture(null)
    setSelectedActivities([])
    setHotelMarkup({ type: 'percentage', value: 10 })
  }
  
  // Load existing package data
  useEffect(() => {
    if (packageData) {
      setPackageCode(packageData.code || '')
      setPackageName(packageData.name || '')
      setDescription(packageData.description || '')
      setDays(packageData.duration?.days || 5)
      setNights(packageData.duration?.nights || 4)
      
      const hotelItem = packageData.items?.find((item: any) => item.resourceType === 'Hotel')
      if (hotelItem) {
        setDestination({
          city: hotelItem.hotelInfo?.location?.city || '',
          country: hotelItem.hotelInfo?.location?.country || ''
        })
        setSelectedHotel({
          _id: hotelItem.inventoryId,
          ...hotelItem
        })
      }
      
      const flightItems = packageData.items?.filter((item: any) => item.resourceType === 'Flight') || []
      if (flightItems.length > 0) {
        const idaFlight = flightItems.find((f: any) => f.flightInfo?.flightType === 'outbound')
        const vueltaFlight = flightItems.find((f: any) => f.flightInfo?.flightType === 'return')
        
        if (idaFlight) setFlightIda({ _id: idaFlight.inventoryId, ...idaFlight })
        if (vueltaFlight) setFlightVuelta({ _id: vueltaFlight.inventoryId, ...vueltaFlight })
      }
      
      const transportItems = packageData.items?.filter((item: any) => item.resourceType === 'Transport') || []
      if (transportItems.length > 0) {
        if (transportItems[0]) setTransportArrival({ _id: transportItems[0].inventoryId, ...transportItems[0] })
        if (transportItems[1]) setTransportDeparture({ _id: transportItems[1].inventoryId, ...transportItems[1] })
      }
      
      const activityItems = packageData.items?.filter((item: any) => item.resourceType === 'Activity') || []
      if (activityItems.length > 0) {
        setSelectedActivities(activityItems.map((a: any) => ({ _id: a.inventoryId, ...a })))
      }
      
      if (packageData.items?.[0]?.markup) {
        const markup = packageData.items[0].markup
        setHotelMarkup({
          type: markup.type || 'percentage',
          value: markup.value || 10
        })
      }
    } else {
      const timestamp = Date.now().toString().slice(-6)
      setPackageCode(`PKG-${timestamp}`)
    }
  }, [packageData])
  
  return {
    currentStep,
    setCurrentStep,
    isSearching,
    setIsSearching,
    packageCode,
    setPackageCode,
    packageName,
    setPackageName,
    description,
    setDescription,
    days,
    setDays,
    nights,
    setNights,
    destination,
    setDestination,
    origin,
    packageValidFrom,
    setPackageValidFrom,
    packageValidTo,
    setPackageValidTo,
    flightIda,
    setFlightIda,
    flightVuelta,
    setFlightVuelta,
    selectedHotel,
    setSelectedHotel,
    hotelMarkup,
    setHotelMarkup,
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
    availableHotels,
    setAvailableHotels,
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
    hotelSearchTerm,
    setHotelSearchTerm,
    updateDurationFromDates,
    resetState
  }
}
