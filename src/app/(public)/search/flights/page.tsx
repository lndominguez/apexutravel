'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { SearchLayout } from '@/components/layout/SearchLayout'
import SearchPanel from '@/components/search/SearchPanel'
import FlightResultsList from '@/components/flights/FlightResultsList'
import NoReturnFlightsAlert from '@/components/flights/NoReturnFlightsAlert'
import { FlightData } from '@/components/flights/FlightResultCard'
import { Button } from '@heroui/react'
import { Plane, AlertCircle } from 'lucide-react'

export default function FlightsSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<FlightData[]>([])
  const [returnFlights, setReturnFlights] = useState<FlightData[]>([])
  const [currentSearchParams, setCurrentSearchParams] = useState<any>(null)
  const [tripType, setTripType] = useState<'roundtrip' | 'one-way'>('one-way')
  const [alternativeDates, setAlternativeDates] = useState<any[]>([])
  const [showNoReturnAlert, setShowNoReturnAlert] = useState(false)
  const [userClosedAlert, setUserClosedAlert] = useState(false)
  const lastSearchRef = useRef<string>('')

  // Calcular total de pasajeros desde los parámetros de búsqueda
  const totalPassengers = useMemo(() => {
    if (!currentSearchParams) return 1
    return (currentSearchParams.adults || 1) + (currentSearchParams.children || 0) + (currentSearchParams.infants || 0)
  }, [currentSearchParams])

  // Parsear parámetros iniciales de la URL
  const initialValues = useMemo(() => {
    if (!searchParams) return undefined
    
    return {
      origin: searchParams.get('origin') || undefined,
      destination: searchParams.get('destination') || undefined,
      tripType: (searchParams.get('tripType') as 'roundtrip' | 'one-way') || undefined,
      departureDate: searchParams.get('departureDate') || undefined,
      returnDate: searchParams.get('returnDate') || undefined,
      adults: searchParams.get('adults') ? parseInt(searchParams.get('adults')!) : undefined,
      children: searchParams.get('children') ? parseInt(searchParams.get('children')!) : undefined,
      infants: searchParams.get('infants') ? parseInt(searchParams.get('infants')!) : undefined,
    }
  }, [searchParams])

  const handleSearchChange = useCallback(async (params: any) => {
    // Validar que tenemos los parámetros mínimos
    if (!params.origin || !params.destination || !params.departureDate) {
      return
    }

    // Para roundtrip, validar que haya fecha de retorno
    if (params.tripType === 'roundtrip' && !params.returnDate) {
      return
    }

    // Crear un hash único de los parámetros para evitar búsquedas duplicadas
    const searchHash = JSON.stringify({
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate?.toString(),
      returnDate: params.returnDate?.toString(),
      tripType: params.tripType,
      passengers: (params.adults || 1) + (params.children || 0) + (params.infants || 0)
    })

    // Si es la misma búsqueda, no hacer nada
    if (lastSearchRef.current === searchHash) {
      return
    }

    lastSearchRef.current = searchHash
    setCurrentSearchParams(params)
    setTripType(params.tripType || 'one-way')
    
    // Actualizar URL con los parámetros de búsqueda
    const urlParams = new URLSearchParams()
    urlParams.set('origin', params.origin)
    urlParams.set('destination', params.destination)
    urlParams.set('tripType', params.tripType || 'one-way')
    urlParams.set('departureDate', params.departureDate?.toString() || '')
    if (params.returnDate) {
      urlParams.set('returnDate', params.returnDate.toString())
    }
    urlParams.set('adults', (params.adults || 1).toString())
    if (params.children) urlParams.set('children', params.children.toString())
    if (params.infants) urlParams.set('infants', params.infants.toString())
    if (params.directOnly) urlParams.set('directOnly', 'true')
    
    router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false })
    
    setIsLoading(true)
    
    try {
      // Calcular total de pasajeros
      const totalPassengers = (params.adults || 1) + (params.children || 0) + (params.infants || 0)
      
      // Búsqueda de vuelos de ida
      const outboundParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        adults: (params.adults || 1).toString(),
        children: (params.children || 0).toString(),
        infants: (params.infants || 0).toString()
      })

      const outboundResponse = await fetch(`/api/flights/search?${outboundParams}`)
      const outboundData = await outboundResponse.json()

      if (outboundData.success) {
        setResults(outboundData.flights || [])
        console.log(`✅ ${outboundData.flights?.length || 0} vuelos de ida encontrados`)
      } else {
        console.error('Error en búsqueda de ida:', outboundData.error)
        setResults([])
      }

      // Si es roundtrip, buscar vuelos de regreso
      if (params.tripType === 'roundtrip' && params.returnDate) {
        const returnParams = new URLSearchParams({
          origin: params.destination, // Invertido
          destination: params.origin,  // Invertido
          departureDate: params.returnDate.toString(),
          adults: (params.adults || 1).toString(),
          children: (params.children || 0).toString(),
          infants: (params.infants || 0).toString(),
          searchAlternatives: 'true' // Buscar fechas alternativas si no hay vuelos
        })
        
        console.log('🔍 Buscando vuelos de retorno con parámetros:', {
          origin: params.destination,
          destination: params.origin,
          date: params.returnDate.toString(),
          passengers: totalPassengers
        })

        const returnResponse = await fetch(`/api/flights/search?${returnParams}`)
        const returnData = await returnResponse.json()

        if (returnData.success) {
          setReturnFlights(returnData.flights || [])
          console.log(`✅ ${returnData.flights?.length || 0} vuelos de regreso encontrados`)
          
          // Si no hay vuelos de regreso, mostrar alert (con o sin alternativas)
          if (returnData.flights.length === 0) {
            console.log('⚠️ No hay vuelos de regreso')
            setAlternativeDates(returnData.alternativeDates || [])
            setShowNoReturnAlert(true)
            setUserClosedAlert(false) // Reset cuando hay nueva búsqueda
            
            if (returnData.alternativeDates && returnData.alternativeDates.length > 0) {
              console.log(`   Hay ${returnData.alternativeDates.length} fechas alternativas disponibles`)
            } else {
              console.log('   No hay fechas alternativas disponibles')
            }
          } else {
            setAlternativeDates([])
            setShowNoReturnAlert(false)
            setUserClosedAlert(false)
          }
        } else {
          console.error('Error en búsqueda de regreso:', returnData.error)
          setReturnFlights([])
          setAlternativeDates([])
          setShowNoReturnAlert(false)
          setUserClosedAlert(false)
        }
      } else {
        // Limpiar vuelos de retorno si no es roundtrip
        setReturnFlights([])
        setAlternativeDates([])
        setShowNoReturnAlert(false)
      }
    } catch (error) {
      console.error('Error buscando vuelos:', error)
      setResults([])
      setReturnFlights([])
    } finally {
      setIsLoading(false)
    }
  }, [router, pathname])

  const handleSelectFlight = (bookingData: any) => {
    console.log('✅ Reserva completada:', bookingData)
    console.log('📋 Datos de la reserva:')
    console.log('  - Vuelo de ida:', bookingData.outbound.flight.flightNumber)
    console.log('  - Clase de ida:', bookingData.outbound.selectedClass?.type)
    console.log('  - Precio de ida:', bookingData.outbound.selectedClass?.price)
    
    if (bookingData.return) {
      console.log('  - Vuelo de regreso:', bookingData.return.flight.flightNumber)
      console.log('  - Clase de regreso:', bookingData.return.selectedClass?.type)
      console.log('  - Precio de regreso:', bookingData.return.selectedClass?.price)
    }
    
    console.log('  - Pasajeros:', bookingData.passengers?.length || 0)
    
    // TODO: Navegar a página de resumen y pago con todos los datos
    // router.push('/booking/summary', { state: bookingData })
  }

  // Manejar selección de fecha alternativa
  const handleSelectAlternativeDate = (newDate: string) => {
    if (currentSearchParams) {
      console.log('📅 Fecha alternativa seleccionada:', newDate)
      
      // Actualizar la fecha de retorno y buscar de nuevo
      const updatedParams = {
        ...currentSearchParams,
        returnDate: newDate,
        tripType: 'roundtrip' // Asegurar que sigue siendo roundtrip
      }
      
      setShowNoReturnAlert(false)
      setUserClosedAlert(false)
      handleSearchChange(updatedParams)
    }
  }

  // Convertir a viaje de solo ida
  const handleConvertToOneWay = () => {
    if (currentSearchParams) {
      console.log('✈️ Convirtiendo a viaje de solo ida')
      
      const updatedParams = {
        ...currentSearchParams,
        tripType: 'one-way',
        returnDate: null
      }
      
      setShowNoReturnAlert(false)
      setUserClosedAlert(false)
      setAlternativeDates([])
      handleSearchChange(updatedParams)
    }
  }

  const handleCloseAlert = () => {
    setShowNoReturnAlert(false)
    setUserClosedAlert(true)
  }

  const handleReopenAlert = () => {
    setShowNoReturnAlert(true)
    setUserClosedAlert(false)
  }

  // Crear una key única basada en los parámetros para forzar re-render del SearchPanel
  const searchPanelKey = useMemo(() => {
    if (!searchParams) return 'default'
    return `${searchParams.get('tripType')}-${searchParams.get('returnDate')}-${searchParams.get('departureDate')}`
  }, [searchParams])

  return (
    <SearchLayout
      moduleTitle="Búsqueda de Vuelos"
      moduleIcon={<Plane size={24} />}
      moduleDescription="Encuentra los mejores vuelos al mejor precio"
      searchPanel={
        <SearchPanel 
          key={searchPanelKey}
          onSearchChange={handleSearchChange} 
          initialValues={initialValues} 
        />
      }
    >
      <div className="py-6 space-y-4">
        {/* Banner informativo cuando el usuario cerró el modal */}
        {userClosedAlert && currentSearchParams && currentSearchParams.returnDate && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-warning flex-shrink-0" size={20} />
              <p className="text-sm text-foreground/80">
                No hay vuelos de regreso disponibles para el{' '}
                <span className="font-semibold">
                  {new Date(currentSearchParams.returnDate).toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                {alternativeDates.length > 0 
                  ? `. Hay ${alternativeDates.length} ${alternativeDates.length === 1 ? 'fecha alternativa' : 'fechas alternativas'} disponibles.`
                  : '. No hay fechas alternativas cercanas disponibles.'
                }
              </p>
            </div>
            <Button
              size="sm"
              color="warning"
              variant="flat"
              onPress={handleReopenAlert}
            >
              Ver
            </Button>
          </div>
        )}

        {/* Lista de resultados */}
        <FlightResultsList
          results={results}
          returnFlights={returnFlights}
          isLoading={isLoading}
          tripType={tripType}
          passengers={totalPassengers}
          adults={currentSearchParams?.adults}
          children={currentSearchParams?.children}
          infants={currentSearchParams?.infants}
          onSelectFlight={handleSelectFlight}
        />

        {/* Modal de no hay vuelos de retorno */}
        {currentSearchParams && (
          <NoReturnFlightsAlert
            isOpen={showNoReturnAlert}
            onClose={handleCloseAlert}
            requestedDate={currentSearchParams.returnDate}
            origin={currentSearchParams.origin}
            destination={currentSearchParams.destination}
            alternativeDates={alternativeDates}
            onSelectAlternative={handleSelectAlternativeDate}
            onConvertToOneWay={handleConvertToOneWay}
          />
        )}
      </div>
    </SearchLayout>
  )
}
