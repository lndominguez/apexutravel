'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'

interface UserFilters {
  page?: number
  limit?: number
  search?: string
  role?: string
}

// Fetcher para SWR
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// Hook SWR para gestión de usuarios administrativos
export function useAdminUsers(filters: UserFilters = {}) {
  const { status } = useSession()
  
  // Construir URL con parámetros
  const buildUrl = () => {
    const queryParams = new URLSearchParams()
    if (filters.page) queryParams.set('page', filters.page.toString())
    if (filters.limit) queryParams.set('limit', filters.limit.toString())
    if (filters.search) queryParams.set('search', filters.search)
    if (filters.role) queryParams.set('role', filters.role)

    const queryString = queryParams.toString()
    return `/api/admin/users${queryString ? `?${queryString}` : ''}`
  }

  // Solo hacer fetch si está autenticado
  const shouldFetch = status === 'authenticated'
  const url = shouldFetch ? buildUrl() : null

  const {
    data,
    error,
    isLoading,
    mutate,
    isValidating
  } = useSWR(url, fetcher, {
    // Configuración para datos administrativos
    refreshInterval: 60000, // Cada minuto (menos frecuente que usuario actual)
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    dedupingInterval: 10000,
    
    // Configuración de errores
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    
    // Callbacks
    onSuccess: (data) => {
      console.log('👥 Admin users data updated:', {
        rawData: data,
        usersCount: data?.users?.length || 0,
        dataCount: data?.data?.length || 0,
        pagination: data?.pagination,
        structure: Object.keys(data || {})
      })
    },
    
    onError: (error) => {
      console.error('❌ Error fetching admin users:', error)
    }
  })

  // CRUD Operations con invalidación automática
  const createUser = async (userData: any) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      if (!response.ok) throw new Error('Error creating user')

      const result = await response.json()
      
      // Revalidar lista de usuarios
      await mutate()
      
      console.log('✅ User created and list updated')
      return result
    } catch (error) {
      console.error('❌ Error creating user:', error)
      throw error
    }
  }

  const updateUser = async (userId: string, updates: any) => {
    try {
      console.log('🔄 Updating user:', { userId, updates })
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      console.log('📡 Update response:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ API Error:', errorData)
        throw new Error(`Error updating user: ${response.status} - ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Update successful:', result)
      
      // Revalidar lista de usuarios
      await mutate()
      
      console.log('✅ User updated and list refreshed')
      return result
    } catch (error) {
      console.error('❌ Error updating user:', error)
      throw error
    }
  }

  const deleteUser = async (userId: string, superAdminPassword?: string) => {
    try {
      console.log('🗑️ Deleting user:', userId)
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ superAdminPassword })
      })

      console.log('📡 Delete response:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || response.statusText)
      }

      const result = await response.json()
      console.log('✅ Delete successful:', result)
      
      // Revalidar lista de usuarios
      await mutate()
      
      console.log('✅ User deleted and list refreshed')
      return result
    } catch (error) {
      console.error('❌ Error deleting user:', error)
      throw error
    }
  }

  const generateInvitation = async (invitationData: any) => {
    try {
      const response = await fetch('/api/admin/users/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitationData)
      })

      if (!response.ok) throw new Error('Error generating invitation')

      const result = await response.json()
      
      // Revalidar lista para mostrar invitación pendiente
      await mutate()
      
      console.log('✅ Invitation generated and list updated')
      return result
    } catch (error) {
      console.error('❌ Error generating invitation:', error)
      throw error
    }
  }

  const resendInvitation = async (userId: string) => {
    try {
      console.log('📧 Resending invitation for user:', userId)
      
      const response = await fetch('/api/admin/users/invitations/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId: userId })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Resend failed:', result)
        throw new Error(result.error || 'Error al reenviar invitación')
      }

      console.log('✅ Invitation resent successfully:', result)
      
      // Revalidar lista
      await mutate()
      
      return result
    } catch (error) {
      console.error('❌ Error resending invitation:', error)
      throw error
    }
  }

  return {
    // Datos (la API devuelve 'users' no 'data')
    users: data?.users || [],
    pagination: data?.pagination || null,
    
    // Estados
    isLoading,
    isValidating,
    error,
    
    // CRUD functions
    createUser,
    updateUser,
    deleteUser,
    generateInvitation,
    resendInvitation,
    
    // Utility functions
    refreshUsers: mutate,
    
    // SWR mutate directo (para casos avanzados)
    mutate
  }
}
