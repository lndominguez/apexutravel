'use client'

import { useState } from 'react'
import { Button, Spinner, Select, SelectItem } from '@heroui/react'
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import FlightResultCard, { FlightData } from './FlightResultCard'
import RoundtripFlightCard from './RoundtripFlightCard'

interface BookingData {
  outbound: {
    flight: FlightData
    selectedClass?: any
    extras?: any
  }
  return?: {
    flight: FlightData
    selectedClass?: any
    extras?: any
  }
  passengers?: any[]
}

interface FlightResultsListProps {
  results: FlightData[]
  returnFlights?: FlightData[]
  isLoading?: boolean
  tripType?: 'roundtrip' | 'one-way'
  passengers: number // Total (legacy)
  adults?: number
  children?: number
  infants?: number
  onSelectFlight: (bookingData: BookingData) => void
}

export default function FlightResultsList({ 
  results, 
  returnFlights = [],
  isLoading = false,
  tripType = 'one-way',
  passengers,
  adults,
  children,
  infants,
  onSelectFlight 
}: FlightResultsListProps) {
  const [sortBy, setSortBy] = useState('price')

  // Helper para obtener el precio más bajo de un vuelo
  const getLowestPrice = (flight: FlightData): number => {
    if (!flight.classes || flight.classes.length === 0) return 0
    return Math.min(...flight.classes.map(c => c.sellingPrice))
  }

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return getLowestPrice(a) - getLowestPrice(b)
      case 'duration':
        return a.duration - b.duration
      case 'departure':
        const dateA = new Date(a.departure.dateTime).getTime()
        const dateB = new Date(b.departure.dateTime).getTime()
        return dateA - dateB
      default:
        return 0
    }
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Spinner size="lg" color="primary" />
        <p className="text-foreground/60 font-medium">Buscando los mejores vuelos...</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center">
          <SlidersHorizontal size={32} className="text-default-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">No se encontraron vuelos</h3>
          <p className="text-foreground/60">
            Intenta ajustar tus filtros o fechas de búsqueda
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with results count and sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-divider">
        <div>
          <h2 className="text-2xl font-bold">
            {results.length} {results.length === 1 ? 'vuelo encontrado' : 'vuelos encontrados'}
          </h2>
          <p className="text-sm text-foreground/60 mt-1">
            Mostrando las mejores opciones para tu búsqueda
          </p>
        </div>

        <Select
          size="sm"
          label="Ordenar por"
          selectedKeys={new Set([sortBy])}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full sm:w-48"
          startContent={<ArrowUpDown size={16} />}
        >
          <SelectItem key="price">Precio (menor a mayor)</SelectItem>
          <SelectItem key="duration">Duración</SelectItem>
          <SelectItem key="departure">Hora de salida</SelectItem>
        </Select>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {tripType === 'roundtrip' && returnFlights.length > 0 ? (
          sortedResults.map((outboundFlight) => {
            // Para roundtrip, emparejamos cada vuelo de ida con todos los de regreso
            return returnFlights.map((returnFlight) => (
              <RoundtripFlightCard
                key={`${outboundFlight._id}-${returnFlight._id}`}
                outboundFlight={outboundFlight}
                returnFlight={returnFlight}
                passengers={passengers}
                adults={adults}
                children={children}
                infants={infants}
                onSelect={onSelectFlight}
              />
            ))
          })
        ) : (
          sortedResults.map((flight) => (
            <FlightResultCard
              key={flight._id}
              flight={flight}
              passengers={passengers}
              adults={adults}
              children={children}
              infants={infants}
              onSelect={onSelectFlight}
            />
          ))
        )}
      </div>

      {/* Load more (if needed) */}
      {results.length > 10 && (
        <div className="flex justify-center pt-6">
          <Button variant="flat" size="lg">
            Cargar más resultados
          </Button>
        </div>
      )}
    </div>
  )
}
