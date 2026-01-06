'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ContentSkeleton } from '@/components/ContentSkeleton'

interface PageWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  minLoadingTime?: number
  skeletonType?: 'dashboard' | 'table' | 'cards' | 'form' | 'profile'
}

export function PageWrapper({ 
  children, 
  requireAuth = true,
  minLoadingTime = 800,
  skeletonType = 'dashboard'
}: PageWrapperProps) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [showContent, setShowContent] = useState(false)
  const [startTime] = useState(Date.now())

  const isLoading = authLoading || (requireAuth && !isAuthenticated)

  useEffect(() => {
    if (!isLoading) {
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
      
      const timer = setTimeout(() => {
        setShowContent(true)
      }, remainingTime)

      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isLoading, startTime, minLoadingTime])

  // Mostrar skeleton mientras se cargan los datos necesarios o durante el tiempo mínimo
  if (isLoading || !showContent) {
    return <ContentSkeleton type={skeletonType} />
  }

  // Si requiere autenticación pero no hay sesión, no mostrar nada
  // (el redirect se maneja en cada página)
  if (requireAuth && status === 'unauthenticated') {
    return null
  }

  return <>{children}</>
}
