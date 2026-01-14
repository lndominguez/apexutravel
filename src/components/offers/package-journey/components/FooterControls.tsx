import { Button, Divider } from '@heroui/react'
import { ChevronRight, Check, X } from 'lucide-react'
import { JourneyStep } from '../hooks/usePackageJourneyState'

interface FooterControlsProps {
  currentStep: JourneyStep
  isSearching: boolean
  isLoading?: boolean
  canGoBack: boolean
  canGoNext: boolean
  onBack: () => void
  onNext: () => void
  onCancel: () => void
}

export function FooterControls({
  currentStep,
  isSearching,
  isLoading,
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  onCancel
}: FooterControlsProps) {
  const displaySteps = [
    { key: 'destination', label: 'Destino' },
    { key: 'hotel', label: 'Hotel' },
    { key: 'hotel-config', label: 'Pricing' },
    { key: 'flight-ida', label: 'Vuelo Ida' },
    { key: 'flight-vuelta', label: 'Vuelo Vuelta' },
    { key: 'transport-arrival', label: 'Llegada' },
    { key: 'transport-departure', label: 'Salida' },
    { key: 'activities', label: 'Actividades' },
    { key: 'summary', label: 'Resumen' }
  ]
  const currentIndex = displaySteps.findIndex(s => s.key === currentStep)
  const progress = ((currentIndex + 1) / displaySteps.length) * 100

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="relative w-16 h-16">
          <svg className="transform -rotate-90" width="64" height="64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-default-200"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
              className="text-primary transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      <Divider orientation="vertical" className="h-10" />

      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          isDisabled={!canGoBack}
          onPress={onBack}
          title="Atrás"
        >
          <ChevronRight size={18} className="rotate-180" />
        </Button>
        
        <Button
          isIconOnly
          size="sm"
          color="primary"
          isDisabled={!canGoNext}
          onPress={onNext}
          isLoading={isLoading}
          title={currentStep === 'summary' ? 'Crear' : 'Siguiente'}
        >
          {currentStep === 'summary' ? <Check size={18} /> : <ChevronRight size={18} />}
        </Button>
        
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="danger"
          onPress={onCancel}
          title="Cancelar"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  )
}
