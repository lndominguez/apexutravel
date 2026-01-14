import { motion } from 'framer-motion'
import { 
  MapPin, 
  Hotel as HotelIcon, 
  DollarSign, 
  Plane, 
  Bus, 
  Activity, 
  Check,
  BadgeCheck
} from 'lucide-react'
import { JourneyStep } from '../hooks/usePackageJourneyState'

interface ProgressBarProps {
  currentStep: JourneyStep
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const displaySteps = [
    { key: 'destination', label: 'Destino', icon: MapPin, color: 'text-success' },
    { key: 'hotel', label: 'Hotel', icon: HotelIcon, color: 'text-warning' },
    { key: 'hotel-config', label: 'Pricing', icon: DollarSign, color: 'text-primary' },
    { key: 'flight-ida', label: 'Vuelo Ida', icon: Plane, color: 'text-primary' },
    { key: 'flight-vuelta', label: 'Vuelo Vuelta', icon: Plane, color: 'text-primary' },
    { key: 'transport-arrival', label: 'Llegada', icon: Bus, color: 'text-secondary' },
    { key: 'transport-departure', label: 'Salida', icon: Bus, color: 'text-secondary' },
    { key: 'activities', label: 'Actividades', icon: Activity, color: 'text-purple-500' },
    { key: 'summary', label: 'Finalizar', icon: Check, color: 'text-success' }
  ]
  
  let effectiveStep = currentStep
  if (currentStep === 'searching-hotels') effectiveStep = 'hotel'
  if (currentStep === 'searching-flights-ida') effectiveStep = 'flight-ida'
  if (currentStep === 'searching-flights-vuelta') effectiveStep = 'flight-vuelta'
  if (currentStep === 'searching-activities') effectiveStep = 'activities'
  
  const currentIndex = displaySteps.findIndex(s => s.key === effectiveStep)
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / displaySteps.length) * 100 : 0
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-default-200 -z-10" />
        <motion.div 
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary to-success -z-10"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
        
        {displaySteps.map((step, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          const Icon = step.icon
          
          return (
            <motion.div
              key={step.key}
              className="flex flex-col items-center gap-2 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: isCurrent ? 1.1 : 1, 
                opacity: 1 
              }}
              transition={{ delay: idx * 0.05 }}
            >
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300 relative z-10
                  ${
                    isCompleted
                      ? 'bg-gradient-to-br from-success to-success-600 text-white shadow-lg shadow-success/30'
                      : isCurrent
                      ? 'bg-gradient-to-br from-primary to-primary-600 text-white shadow-xl shadow-primary/50 ring-4 ring-primary/20'
                      : 'bg-default-100 text-default-400'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <BadgeCheck size={20} />
                  </motion.div>
                ) : (
                  <Icon size={isCurrent ? 20 : 16} />
                )}
                
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5,
                      ease: 'easeOut'
                    }}
                  />
                )}
              </motion.div>
              
              <motion.p
                className={`
                  text-[10px] font-medium text-center max-w-[60px] leading-tight
                  ${
                    isCurrent
                      ? 'text-primary font-bold'
                      : isCompleted
                      ? 'text-success'
                      : 'text-default-400'
                  }
                `}
                animate={{ 
                  y: isCurrent ? [0, -2, 0] : 0 
                }}
                transition={{ 
                  repeat: isCurrent ? Infinity : 0,
                  duration: 2,
                  ease: 'easeInOut'
                }}
              >
                {step.label}
              </motion.p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
