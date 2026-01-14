'use client'

import React from 'react'
import OfferPackageJourney from './package-journey'

interface OfferCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  offerType: 'flight' | 'hotel' | 'package' | 'transport' | 'activity'
}

/**
 * OfferCreator - SOLO para CREATE (crear nuevas ofertas)
 * Usado en páginas específicas (/offers/hotels, /offers/packages, etc)
 * Va directo al wizard con el tipo definido
 * 
 * IMPORTANTE: Para EDITAR usar modales específicos por tipo
 * (OfferHotelEditModal, OfferPackageEditModal, etc)
 */
export function OfferCreator({ 
  isOpen, 
  onClose, 
  onSubmit,
  offerType
}: OfferCreatorProps) {
  return (
    <OfferPackageJourney
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      offerType={offerType}
    />
  )
}
