'use client'

import { Input } from '@heroui/react'
import { Bus, DollarSign } from 'lucide-react'

const SERVICE_TYPES = [
  { value: 'private', label: 'Privado' },
  { value: 'shared', label: 'Compartido' },
  { value: 'luxury', label: 'Lujo' },
  { value: 'shuttle', label: 'Shuttle' }
]

interface TransportInventoryFormProps {
  transportConfig: {
    serviceType: string
    cost: number
    availability: number
  }
  onConfigChange: (config: any) => void
}

export default function TransportInventoryForm({
  transportConfig,
  onConfigChange
}: TransportInventoryFormProps) {
  
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Bus size={20} className="text-primary" />
        Configuración de Transporte
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">Tipo de Servicio</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-default-200 bg-default-50"
            value={transportConfig.serviceType}
            onChange={(e) => onConfigChange({ ...transportConfig, serviceType: e.target.value })}
          >
            {SERVICE_TYPES.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="Costo (Proveedor)"
          type="number"
          step="0.01"
          startContent={<DollarSign size={16} />}
          value={transportConfig.cost.toString()}
          onChange={(e) => onConfigChange({
            ...transportConfig,
            cost: parseFloat(e.target.value) || 0
          })}
          size="sm"
        />
        <Input
          label="Unidades Disponibles"
          type="number"
          min="0"
          value={transportConfig.availability.toString()}
          onChange={(e) => onConfigChange({
            ...transportConfig,
            availability: parseInt(e.target.value) || 0
          })}
          size="sm"
        />
      </div>
    </div>
  )
}
