import useSWR from 'swr'
import { useSession } from 'next-auth/react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface OfferHotelFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'draft' | 'published' | 'archived'
  destination?: string
}

export function useOfferHotels(filters: OfferHotelFilters = {}) {
  const { status } = useSession()

  const buildUrl = () => {
    const queryParams = new URLSearchParams()
    if (filters.page) queryParams.set('page', filters.page.toString())
    if (filters.limit) queryParams.set('limit', filters.limit.toString())
    if (filters.search) queryParams.set('search', filters.search)
    if (filters.status) queryParams.set('status', filters.status)
    if (filters.destination) queryParams.set('destination', filters.destination)

    const queryString = queryParams.toString()
    return `/api/offers/hotels${queryString ? `?${queryString}` : ''}`
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
  const createHotel = async (hotelData: any) => {
    try {
      const response = await fetch('/api/offers/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotelData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear oferta de hotel')
      }

      const result = await response.json()
      await mutate()
      return result
    } catch (error) {
      console.error('Error creating hotel offer:', error)
      throw error
    }
  }

  const updateHotel = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/offers/hotels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar oferta')
      }

      const result = await response.json()
      await mutate()
      return result
    } catch (error) {
      console.error('Error updating hotel offer:', error)
      throw error
    }
  }

  const deleteHotel = async (id: string) => {
    try {
      const response = await fetch(`/api/offers/hotels/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar oferta')
      }

      const result = await response.json()
      await mutate()
      return result
    } catch (error) {
      console.error('Error deleting hotel offer:', error)
      throw error
    }
  }

  return {
    hotels: data?.hotels || [],
    pagination: data?.pagination || null,
    isLoading,
    isValidating,
    error,
    createHotel,
    updateHotel,
    deleteHotel,
    mutate
  }
}

export function useOfferHotel(id: string | null) {
  const { status } = useSession()
  const shouldFetch = status === 'authenticated' && id
  const url = shouldFetch ? `/api/offers/hotels/${id}` : null

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  return {
    hotel: data || null,
    isLoading,
    error,
    mutate
  }
}
