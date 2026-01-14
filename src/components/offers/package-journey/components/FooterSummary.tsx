import { Divider } from '@heroui/react'
import { Package, MapPin } from 'lucide-react'

interface FooterSummaryProps {
  destination: { city: string; country: string }
  totalCost: number
  totalSelling: number
  hasBasicInfo: boolean
}

export function FooterSummary({ destination, totalCost, totalSelling, hasBasicInfo }: FooterSummaryProps) {
  const commission = totalSelling - totalCost

  if (!hasBasicInfo) {
    return (
      <div className="flex items-center gap-2 text-default-400">
        <Package size={14} />
        <p className="text-xs italic">Completa los pasos...</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <MapPin size={12} className="text-success" />
        <div>
          <p className="text-xs font-bold">{destination.city}</p>
        </div>
      </div>

      <Divider orientation="vertical" className="h-6" />

      <div>
        <p className="text-xs text-default-500">Costo</p>
        <p className="text-sm font-bold text-default-700">${totalCost.toFixed(2)}</p>
      </div>

      <div>
        <p className="text-xs text-default-500">Comisión</p>
        <p className="text-sm font-bold text-primary">${commission.toFixed(2)}</p>
      </div>

      <div>
        <p className="text-xs text-default-500">Venta</p>
        <p className="text-base font-bold text-success">${totalSelling.toFixed(2)}</p>
      </div>
    </div>
  )
}
