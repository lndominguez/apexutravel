'use client'

import { Check } from 'lucide-react'
import { BookingStepConfig } from '@/types/booking'

interface BookingProgressProps {
  steps: BookingStepConfig[]
}

export default function BookingProgress({ steps }: BookingProgressProps) {
  return (
    <div className="bg-white border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-200
                    ${step.completed
                      ? 'bg-green-500 text-white'
                      : step.current
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {step.completed ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span
                  className={`
                    text-xs mt-2 font-medium hidden md:block
                    ${step.current ? 'text-primary' : step.completed ? 'text-green-600' : 'text-gray-500'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-gray-200 relative">
                  <div
                    className={`
                      absolute inset-0 bg-green-500 transition-all duration-300
                      ${step.completed ? 'w-full' : 'w-0'}
                    `}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
