import useSWR from 'swr'
import { useSession } from 'next-auth/react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface OfferPackageFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'draft' | 'active' | 'inactive' | 'archived'
  category?: string
  featured?: boolean
  destination?: string
}

export function useOfferPackages(filters: OfferPackageFilters = {}) {
  const { status } = useSession()

  const buildUrl = () => {
    const queryParams = new URLSearchParams()
    if (filters.page) queryParams.set('page', filters.page.toString())
    if (filters.limit) queryParams.set('limit', filters.limit.toString())
    if (filters.search) queryParams.set('search', filters.search)
    if (filters.status) queryParams.set('status', filters.status)
    if (filters.category) queryParams.set('category', filters.category)
    if (filters.featured !== undefined) queryParams.set('featured', filters.featured.toString())
    if (filters.destination) queryParams.set('destination', filters.destination)

    const queryString = queryParams.toString()
    return `/api/offers/packages${queryString ? `?${queryString}` : ''}`
  }

  const shouldFetch = status === 'authenticated'
  const url = shouldFetch ? buildUrl() : null

  const {
    data,
    error,
    isLoading,
    mutate,
    isValidating
  } = useSWR(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000
  })

  // CRUD Operations
  const createPackage = async (packageData: any) => {
    try {
      const response = await fetch('/api/offers/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear paquete')
      }

      const result = await response.json()
      await mutate()
      return result
    } catch (error) {
      console.error('Error creating package:', error)
      throw error
    }
  }

  const updatePackage = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/offers/packages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar paquete')
      }

      const result = await response.json()
      await mutate()
      return result
    } catch (error) {
      console.error('Error updating package:', error)
      throw error
    }
  }

  const deletePackage = async (id: string) => {
    try {
      const response = await fetch(`/api/offers/packages/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar paquete')
      }

      const result = await response.json()
      await mutate()
      return result
    } catch (error) {
      console.error('Error deleting package:', error)
      throw error
    }
  }

  return {
    packages: data?.packages || [],
    pagination: data?.pagination || null,
    isLoading,
    isValidating,
    error,
    createPackage,
    updatePackage,
    deletePackage,
    mutate
  }
}

// Hook para obtener un paquete individual
export function useOfferPackage(id: string | null) {
  const { status } = useSession()
  const shouldFetch = status === 'authenticated' && id
  const url = shouldFetch ? `/api/offers/packages/${id}` : null

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  return {
    package: data || null,
    isLoading,
    error,
    mutate
  }
}
