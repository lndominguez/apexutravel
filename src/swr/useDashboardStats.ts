'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'

// Fetcher para SWR
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// Hook SWR para estadísticas del dashboard
export function useDashboardStats() {
  const { status } = useSession()
  
  // Solo hacer fetch si está autenticado
  const shouldFetch = status === 'authenticated'
  
  const {
    data,
    error,
    isLoading,
    mutate,
    isValidating
  } = useSWR(
    shouldFetch ? '/api/dashboard/stats' : null,
    fetcher,
    {
      // Configuración para estadísticas
      refreshInterval: 120000, // Cada 2 minutos
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      dedupingInterval: 30000, // 30 segundos
      
      // Configuración de errores
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      
      // Fallback data mientras carga
      fallbackData: {
        // Valores por defecto seguros
        totalRevenue: 0,
        monthlyRevenue: 0,
        dailyRevenue: 0,
        totalContracts: 0,
        contractsThisMonth: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        totalExpenses: 0,
        monthlyProfit: 0,
        pendingCommissions: 0,
        paidCommissions: 0,
        commissionRate: 0,
        emailsSent: 0,
        emailOpenRate: 0,
        emailCampaigns: 0
      },
      
      // Callbacks
      onSuccess: (data) => {
        console.log('📊 Dashboard stats updated:', {
          revenue: data?.totalRevenue || 0,
          contracts: data?.totalContracts || 0,
          users: data?.activeUsers || 0
        })
      },
      
      onError: (error) => {
        console.error('❌ Error fetching dashboard stats:', error)
      }
    }
  )

  // Función para forzar actualización de estadísticas
  const refreshStats = async () => {
    console.log('🔄 Refreshing dashboard stats...')
    return await mutate()
  }

  // Función para invalidar estadísticas (útil después de cambios importantes)
  const invalidateStats = async () => {
    console.log('🗑️ Invalidating dashboard stats cache...')
    return await mutate(undefined, true)
  }

  return {
    // Datos con fallback seguro
    stats: data || {
      totalRevenue: 0,
      monthlyRevenue: 0,
      dailyRevenue: 0,
      totalContracts: 0,
      contractsThisMonth: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      totalExpenses: 0,
      monthlyProfit: 0,
      pendingCommissions: 0,
      paidCommissions: 0,
      commissionRate: 0,
      emailsSent: 0,
      emailOpenRate: 0,
      emailCampaigns: 0
    },
    
    // Estados
    isLoading,
    isValidating,
    error,
    
    // Funciones
    refreshStats,
    invalidateStats,
    
    // SWR mutate directo
    mutate
  }
}
