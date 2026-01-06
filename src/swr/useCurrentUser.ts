'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'

// Fetcher optimizado
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    throw new Error('Error fetching user data')
  }
  return response.json()
}

/**
 * Hook SWR para datos del usuario en TIEMPO REAL
 * 
 * Este hook mantiene los datos del usuario sincronizados automáticamente:
 * - Revalida cada 10 segundos
 * - Revalida al volver a la pestaña
 * - Revalida al reconectar
 * 
 * Úsalo cuando necesites datos frescos del usuario (rol, permisos, preferencias)
 */
export function useCurrentUser() {
  const { data: session, status, update } = useSession()
  const isAuthenticated = status === 'authenticated'
  const previousUserRef = useRef<any>(null)
  
  // Solo hacer fetch si está autenticado
  const shouldFetch = isAuthenticated && session?.user?.id
  
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR(
    shouldFetch ? '/api/account/me' : null,
    fetcher,
    {
      // CONFIGURACIÓN PARA TIEMPO REAL
      refreshInterval: 10000, // Cada 10 segundos
      revalidateOnFocus: true, // Al volver a la pestaña
      revalidateOnReconnect: true, // Al reconectar internet
      revalidateIfStale: true, // Si los datos están obsoletos
      dedupingInterval: 2000, // Evitar requests duplicados en 2s
      
      // Configuración de errores
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      shouldRetryOnError: true,
      
      // Callbacks
      onSuccess: async (data) => {
        console.log('✅ Usuario actualizado (SWR):', {
          id: data.user?.id,
          role: data.user?.role,
          preferences: data.user?.preferences
        })
        
        // Detectar cambios importantes (rol, permisos, etc.)
        const currentUser = data.user
        const previousUser = previousUserRef.current
        
        if (previousUser && currentUser) {
          const hasRoleChanged = previousUser.role !== currentUser.role
          const hasPreferencesChanged = JSON.stringify(previousUser.preferences) !== JSON.stringify(currentUser.preferences)
          
          if (hasRoleChanged || hasPreferencesChanged) {
            console.log('🔄 Cambios detectados - Actualizando sesión de NextAuth')
            await update() // Actualizar sesión de NextAuth
          }
        }
        
        // Guardar referencia para próxima comparación
        previousUserRef.current = currentUser
      },
      
      onError: (error) => {
        console.error('❌ Error fetching user:', error)
      }
    }
  )

  // Función para forzar actualización
  const refreshUser = async () => {
    console.log('🔄 Forzando actualización de usuario...')
    await mutate()
  }

  // Función para actualizar usuario localmente (optimistic update)
  const updateUser = async (updates: any) => {
    if (!data?.user) return
    
    // Actualización optimista
    await mutate(
      { ...data, user: { ...data.user, ...updates } },
      false // No revalidar aún
    )
    
    // Revalidar después para confirmar
    setTimeout(() => mutate(), 100)
  }

  return {
    // Datos
    user: data?.user || null,
    
    // Estados
    isLoading: isLoading || status === 'loading',
    isValidating,
    error,
    isAuthenticated,
    
    // Funciones
    refreshUser,
    updateUser,
    mutate,
    
    // Helpers
    isAdmin: data?.user?.role === 'admin' || data?.user?.role === 'super_admin',
    isSuperAdmin: data?.user?.role === 'super_admin',
    userRole: data?.user?.role
  }
}
