'use client'

import { useState, useCallback, useRef } from 'react'
import { Autocomplete, AutocompleteItem } from '@heroui/react'
import { MapPin, Plane, Building2, Package as PackageIcon } from 'lucide-react'

type LocationType =
  | 'airport'
  | 'hotel'
  | 'package'
  | 'flight-origin'
  | 'flight-destination'
  | 'country-group'
  | 'state-group'
  | 'city-group'

interface Location {
  type: LocationType
  city: string
  country: string
  value: string
  label: string
  iata?: string
  category: string
  subtitle?: string
  level?: 'country' | 'state' | 'city' | 'airport'
  isHeader?: boolean
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'origin' | 'destination' | 'all'
  icon?: React.ReactNode
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Buscar ciudad o aeropuerto...',
  type = 'all',
  icon
}: LocationAutocompleteProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setLocations([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/search/locations?q=${encodeURIComponent(query)}&type=${type}`)
      const data = await res.json()

      if (data.success) {
        setLocations(data.locations || [])
      }
    } catch (error) {
      console.error('Error buscando ubicaciones:', error)
      setLocations([])
    } finally {
      setIsLoading(false)
    }
  }, [type])

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (newValue.length >= 2) {
      // Debounce de 300ms
      debounceTimerRef.current = setTimeout(() => {
        searchLocations(newValue)
      }, 300)
    } else {
      setLocations([])
    }
  }

  const handleSelectionChange = (key: React.Key | null) => {
    if (key) {
      const selected = locations.find(loc => loc.value === key)
      if (selected) {
        // Formato consistente: IATA ciudad
        const displayValue = selected.iata 
          ? `${selected.iata} ${selected.city}` 
          : selected.city || selected.label
        onChange(displayValue)
        setInputValue(displayValue)
      }
    }
  }

  const getIcon = (location: Location) => {
    if (location.isHeader || location.type === 'city-group') {
      return <MapPin size={18} className="text-amber-500" />
    }

    switch (location.type) {
      case 'airport':
        return <Plane size={18} className="text-primary-500" />
      case 'flight-origin':
      case 'flight-destination':
        return <Plane size={18} className="text-primary-500" />
      case 'hotel':
        return <Building2 size={18} className="text-primary-600" />
      case 'package':
        return <PackageIcon size={18} className="text-primary-600" />
      default:
        return <MapPin size={18} className="text-primary-500" />
    }
  }

  // Renderizar el valor del input con formato (IATA en negrita)
  const renderInputValue = () => {
    if (!inputValue) return null
    
    // Detectar si el valor tiene formato "IATA ciudad"
    const parts = inputValue.split(' ')
    if (parts.length >= 2 && parts[0].length === 3 && parts[0] === parts[0].toUpperCase()) {
      const iata = parts[0]
      const city = parts.slice(1).join(' ')
      return (
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-primary/70">{iata}</span>
          <span className="font-medium">{city}</span>
        </div>
      )
    }
    
    return inputValue
  }

  return (
    <Autocomplete
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onSelectionChange={handleSelectionChange}
      items={locations}
      label={placeholder}
      placeholder={`Seleccionar ${placeholder}`}
      isLoading={isLoading}
      size="sm"
      variant="flat"
      startContent={icon}
       
      listboxProps={{
        emptyContent: inputValue.length < 2 
          ? 'Escribe al menos 2 caracteres' 
          : 'No se encontraron resultados'
      }}
    >
      {(location) => (
        <AutocompleteItem
          key={location.value}
          textValue={location.iata ? `${location.iata} ${location.city}` : location.label}
          startContent={getIcon(location)}
        
          description={location.subtitle}
          classNames={{
            base: 'data-[hover=true]:bg-default-100',
            title: 'text-sm'
          }}
        >
          <div className="flex items-center gap-1.5">
            {location.iata ? (
              <>
                <span className="font-bold text-primary/70">{location.iata}</span>
                <span className="font-medium text-foreground">{location.city}</span>
              </>
            ) : (
              <span className="font-semibold">{location.label}</span>
            )}
          </div>
        </AutocompleteItem>
      )}
    </Autocomplete>
  )
}