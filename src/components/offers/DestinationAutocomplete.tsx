'use client'

import { useState, useMemo } from 'react'
import { Autocomplete, AutocompleteItem } from '@heroui/react'
import { MapPin } from 'lucide-react'

interface DestinationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  hotels: any[]
}

export default function DestinationAutocomplete({ value, onChange, hotels }: DestinationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)

  // Extraer destinos únicos de los hoteles
  const destinations = useMemo(() => {
    if (!hotels || hotels.length === 0) return []

    const uniqueDestinations = new Set<string>()
    
    hotels.forEach((item: any) => {
      const hotel = item.resource
      if (hotel?.city && hotel?.country) {
        const destination = `${hotel.city}, ${hotel.country}`
        uniqueDestinations.add(destination)
      }
    })

    return Array.from(uniqueDestinations).sort()
  }, [hotels])

  const handleSelectionChange = (key: any) => {
    if (key) {
      onChange(key as string)
      setInputValue(key as string)
    }
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    onChange(value)
  }

  return (
    <Autocomplete
      label="Destino"
      placeholder="Ej: Cancún, México"
      value={value}
      inputValue={inputValue}
      onSelectionChange={handleSelectionChange}
      onInputChange={handleInputChange}
      startContent={<MapPin size={18} className="text-default-400" />}
      isRequired
      labelPlacement="outside"
      description={destinations.length > 0 ? `${destinations.length} destinos disponibles` : 'Cargando destinos...'}
    >
      {destinations.map((dest) => (
        <AutocompleteItem key={dest}>
          {dest}
        </AutocompleteItem>
      ))}
    </Autocomplete>
  )
}
