import { JourneyStep } from '../hooks/usePackageJourneyState'

/**
 * Configuración de steps según el tipo de oferta
 * Define qué pasos debe seguir cada tipo de oferta en el wizard
 */

export const STEPS_BY_OFFER_TYPE: Record<
  'flight' | 'hotel' | 'package' | 'transport' | 'activity',
  JourneyStep[]
> = {
  // HOTEL: Solo destino, buscar hotel, seleccionar hotel, configurar pricing, resumen
  hotel: [
    'destination',
    'searching-hotels',
    'hotel',
    'hotel-config',
    'summary'
  ],
  
  // FLIGHT: Destino, buscar vuelo ida, seleccionar ida, buscar vuelta, seleccionar vuelta, resumen
  flight: [
    'destination',
    'searching-flights-ida',
    'flight-ida',
    'searching-flights-vuelta',
    'flight-vuelta',
    'summary'
  ],
  
  // TRANSPORT: Destino, seleccionar transporte llegada, seleccionar transporte salida, resumen
  transport: [
    'destination',
    'transport-arrival',
    'transport-departure',
    'summary'
  ],
  
  // ACTIVITY: Destino, buscar actividades, seleccionar actividades, resumen
  activity: [
    'destination',
    'searching-activities',
    'activities',
    'summary'
  ],
  
  // PACKAGE: Flujo completo con todos los pasos
  package: [
    'destination',
    'searching-hotels',
    'hotel',
    'hotel-config',
    'searching-flights-ida',
    'flight-ida',
    'searching-flights-vuelta',
    'flight-vuelta',
    'transport-arrival',
    'transport-departure',
    'searching-activities',
    'activities',
    'summary'
  ]
}

/**
 * Obtiene los steps para un tipo de oferta
 */
export function getStepsForOfferType(
  offerType: 'flight' | 'hotel' | 'package' | 'transport' | 'activity'
): JourneyStep[] {
  return STEPS_BY_OFFER_TYPE[offerType] || STEPS_BY_OFFER_TYPE.package
}

/**
 * Verifica si un step está incluido en un tipo de oferta
 */
export function isStepIncluded(
  offerType: 'flight' | 'hotel' | 'package' | 'transport' | 'activity',
  step: JourneyStep
): boolean {
  return STEPS_BY_OFFER_TYPE[offerType].includes(step)
}

/**
 * Obtiene el step inicial para un tipo de oferta
 */
export function getInitialStep(
  offerType: 'flight' | 'hotel' | 'package' | 'transport' | 'activity'
): JourneyStep {
  return STEPS_BY_OFFER_TYPE[offerType][0]
}

/**
 * Obtiene el siguiente step válido según el tipo de oferta
 */
export function getNextStep(
  offerType: 'flight' | 'hotel' | 'package' | 'transport' | 'activity',
  currentStep: JourneyStep
): JourneyStep | null {
  const steps = STEPS_BY_OFFER_TYPE[offerType]
  const currentIndex = steps.indexOf(currentStep)
  
  if (currentIndex === -1 || currentIndex === steps.length - 1) {
    return null
  }
  
  return steps[currentIndex + 1]
}

/**
 * Obtiene el step anterior válido según el tipo de oferta
 */
export function getPreviousStep(
  offerType: 'flight' | 'hotel' | 'package' | 'transport' | 'activity',
  currentStep: JourneyStep
): JourneyStep | null {
  const steps = STEPS_BY_OFFER_TYPE[offerType]
  const currentIndex = steps.indexOf(currentStep)
  
  if (currentIndex <= 0) {
    return null
  }
  
  return steps[currentIndex - 1]
}
