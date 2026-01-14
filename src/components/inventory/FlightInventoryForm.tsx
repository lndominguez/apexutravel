'use client'

import { Input } from '@heroui/react'
import { Plane, DollarSign } from 'lucide-react'

const FLIGHT_CLASSES = [
  { value: 'economy', label: 'Económica' },
  { value: 'premium_economy', label: 'Económica Premium' },
  { value: 'business', label: 'Ejecutiva' },
  { value: 'first', label: 'Primera Clase' }
]

const FLIGHT_TYPES = [
  { value: 'one_way', label: 'Solo Ida' },
  { value: 'round_trip', label: 'Ida y Vuelta' }
]

interface FlightInventoryFormProps {
  flightConfig: {
    class: string
    flightType: string
    adult: { cost: number }
    child: { cost: number }
    infant: { cost: number }
    availability: number
  }
  onConfigChange: (config: any) => void
}

export default function FlightInventoryForm({
  flightConfig,
  onConfigChange
}: FlightInventoryFormProps) {
  
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Plane size={20} className="text-primary" />
        Configuración de Vuelo
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">Clase</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-default-200 bg-default-50"
            value={flightConfig.class}
            onChange={(e) => onConfigChange({ ...flightConfig, class: e.target.value })}
          >
            {FLIGHT_CLASSES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Tipo de Vuelo</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-default-200 bg-default-50"
            value={flightConfig.flightType}
            onChange={(e) => onConfigChange({ ...flightConfig, flightType: e.target.value })}
          >
            {FLIGHT_TYPES.map(ft => (
              <option key={ft.value} value={ft.value}>{ft.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="Asientos Disponibles"
          type="number"
          min="0"
          value={flightConfig.availability.toString()}
          onChange={(e) => onConfigChange({
            ...flightConfig,
            availability: parseInt(e.target.value) || 0
          })}
          size="sm"
        />
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-sm">Costos por Tipo de Pasajero</p>
        
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Costo Adulto"
            type="number"
            step="0.01"
            startContent={<DollarSign size={16} />}
            value={flightConfig.adult.cost.toString()}
            onChange={(e) => onConfigChange({
              ...flightConfig,
              adult: { cost: parseFloat(e.target.value) || 0 }
            })}
            size="sm"
          />
          <Input
            label="Costo Niño"
            type="number"
            step="0.01"
            startContent={<DollarSign size={16} />}
            value={flightConfig.child.cost.toString()}
            onChange={(e) => onConfigChange({
              ...flightConfig,
              child: { cost: parseFloat(e.target.value) || 0 }
            })}
            size="sm"
          />
          <Input
            label="Costo Infante"
            type="number"
            step="0.01"
            startContent={<DollarSign size={16} />}
            value={flightConfig.infant.cost.toString()}
            onChange={(e) => onConfigChange({
              ...flightConfig,
              infant: { cost: parseFloat(e.target.value) || 0 }
            })}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}
