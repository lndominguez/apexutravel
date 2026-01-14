'use client'

import React, { useState, useEffect } from 'react'
import { OfferTypeSelector } from './offer-journey/components/OfferTypeSelector'
import OfferPackageJourney from './package-journey'

interface UnifiedOfferCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

/**
 * UnifiedOfferCreator - SOLO para CREAR ofertas nuevas
 * Para EDITAR, usar los modales específicos de cada tipo
 */
export function UnifiedOfferCreator({ 
  isOpen, 
  onClose, 
  onSubmit
}: UnifiedOfferCreatorProps) {
  const [selectedType, setSelectedType] = useState<'flight' | 'hotel' | 'package' | 'transport' | 'activity' | null>(null)

  // Cuando selecciona un tipo en el selector
  const handleSelectType = (type: 'flight' | 'hotel' | 'package' | 'transport' | 'activity') => {
    setSelectedType(type)
  }

  // Cuando cierra el selector sin seleccionar nada
  const handleSelectorClose = () => {
    if (!selectedType) {
      onClose()
    }
  }

  // Cuando cierra el wizard o completa
  const handleClose = () => {
    setSelectedType(null)
    onClose()
  }

  // Cuando completa el journey
  const handleJourneySubmit = async (data: any) => {
    await onSubmit(data)
    setSelectedType(null)
  }

  // Reset cuando se cierra desde afuera
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null)
    }
  }, [isOpen])

  // Determinar qué modal mostrar
  const showSelector = isOpen && !selectedType
  const showWizard = isOpen && !!selectedType

  return (
    <>
      {/* Selector de tipo de oferta - solo para CREATE sin tipo seleccionado */}
      {showSelector && (
        <OfferTypeSelector
          isOpen={showSelector}
          onClose={handleSelectorClose}
          onSelectType={handleSelectType}
        />
      )}

      {/* Journey unificado - se muestra cuando hay selectedType */}
      {showWizard && (
        <OfferPackageJourney
          isOpen={showWizard}
          onClose={handleClose}
          onSubmit={handleJourneySubmit}
          offerType={selectedType}
        />
      )}
    </>
  )
}
