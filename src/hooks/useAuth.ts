'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect } from 'react'
import { useCurrentUser } from '@/swr/useCurrentUser'

/**
 * Hook simplificado de autenticación
 * 
 * Usa NextAuth como única fuente de verdad.
 * No requiere SWR ni llamadas adicionales a APIs.
 * 
 * @returns Datos de sesión y funciones de autenticación
 */
export function useAuth() {
  const { data: session, status, update } = useSession()
  
  // Obtener datos en tiempo real de SWR
  const { user: swrUser, isLoading: swrLoading } = useCurrentUser()
  
  // Usar datos de SWR si están disponibles, sino usar sesión
  const user = swrUser || session?.user
  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading' || swrLoading
  
  // SWR ya maneja el polling y revalidación automática
  // No necesitamos polling adicional aquí

  /**
   * Actualizar sesión desde la base de datos
   * Usa el trigger 'update' de NextAuth que ejecuta el callback jwt()
   */
  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 Actualizando sesión...')
      await update()
      console.log('✅ Sesión actualizada')
    } catch (error) {
      console.error('❌ Error actualizando sesión:', error)
      throw error
    }
  }, [update])

  /**
   * Actualizar preferencias del usuario
   * Actualiza en BD y luego refresca la sesión
   */
  const updatePreferences = useCallback(async (preferences: any) => {
    try {
      const response = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      if (!response.ok) {
        throw new Error('Error actualizando preferencias')
      }

      // Refrescar sesión para obtener nuevos datos
      await refreshSession()
      
      return await response.json()
    } catch (error) {
      console.error('❌ Error actualizando preferencias:', error)
      throw error
    }
  }, [refreshSession])

  /**
   * Actualizar perfil del usuario
   * Actualiza en BD y luego refresca la sesión
   */
  const updateProfile = useCallback(async (profileData: any) => {
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error('Error actualizando perfil')
      }

      // Refrescar sesión para obtener nuevos datos
      await refreshSession()
      
      return await response.json()
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error)
      throw error
    }
  }, [refreshSession])

  return {
    // Datos de sesión
    session,
    user,
    status,
    isAuthenticated,
    isLoading,
    
    // Funciones
    refreshSession,
    updatePreferences,
    updateProfile,
    
    // Helpers
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    userRole: user?.role
  }
}
