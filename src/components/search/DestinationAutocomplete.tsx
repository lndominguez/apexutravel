'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { Autocomplete, AutocompleteItem, AutocompleteSection } from '@heroui/react'
import { MapPin, Globe } from 'lucide-react'

interface Destination {
  city: string
  state: string
  country: string
  value: string
  label: string
}

interface GroupedDestinations {
  country: string
  destinations: Destination[]
}

interface DestinationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: React.ReactNode
}

export default function DestinationAutocomplete({
  value,
  onChange,
  placeholder = 'Buscar destino...',
  icon
}: DestinationAutocompleteProps) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const searchDestinations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setDestinations([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/search/destinations?q=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (data.success) {
        setDestinations(data.destinations || [])
      }
    } catch (error) {
      console.error('Error buscando destinos:', error)
      setDestinations([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (newValue.length >= 2) {
      // Debounce de 300ms
      debounceTimerRef.current = setTimeout(() => {
        searchDestinations(newValue)
      }, 300)
    } else {
      setDestinations([])
    }
  }

  const handleSelectionChange = (key: React.Key | null) => {
    if (key) {
      const selected = destinations.find(dest => dest.value === key)
      if (selected) {
        onChange(selected.city)
        setInputValue(selected.city)
      }
    }
  }

  // Permitir búsqueda libre (sin seleccionar del dropdown)
  const handleBlur = () => {
    if (inputValue && inputValue !== value) {
      onChange(inputValue)
    }
  }

  // Agrupar destinos por país
  const groupedDestinations = useMemo(() => {
    const groups = new Map<string, Destination[]>()
    
    destinations.forEach(dest => {
      if (!groups.has(dest.country)) {
        groups.set(dest.country, [])
      }
      groups.get(dest.country)!.push(dest)
    })
    
    return Array.from(groups.entries()).map(([country, dests]) => ({
      country,
      destinations: dests
    }))
  }, [destinations])

  const getIcon = () => {
    if (icon) return icon
    return <MapPin size={18} className="text-primary" />
  }

  return (
    <Autocomplete
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onSelectionChange={handleSelectionChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      isLoading={isLoading}
      startContent={getIcon()}
      variant="flat"
      className="w-full"
      allowsCustomValue
      listboxProps={{
        emptyContent: inputValue.length >= 2 ? "No se encontraron destinos" : "Escribe al menos 2 caracteres"
      }}
    >
      {groupedDestinations.map((group) => (
        <AutocompleteSection
          key={group.country}
          title={group.country}
          classNames={{
            heading: "flex items-center gap-2 text-xs font-semibold text-foreground/70 px-2 py-1"
          }}
        >
          {group.destinations.map((item) => (
            <AutocompleteItem
              key={item.value}
              textValue={item.label}
              startContent={<MapPin size={16} className="text-primary" />}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.city}</span>
                {item.state && (
                  <span className="text-xs text-muted-foreground">{item.state}</span>
                )}
              </div>
            </AutocompleteItem>
          ))}
        </AutocompleteSection>
      ))}
    </Autocomplete>
  )
}
