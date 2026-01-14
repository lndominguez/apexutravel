'use client'

import useSWR from 'swr'
import { useState } from 'react'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error fetching data')
  }
  return res.json()
}

export function useHotels(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  city?: string
  stars?: number
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.set('page', params.page.toString())
  if (params?.limit) queryParams.set('limit', params.limit.toString())
  if (params?.search) queryParams.set('search', params.search)
  if (params?.status) queryParams.set('status', params.status)
  if (params?.city) queryParams.set('city', params.city)
  if (params?.stars) queryParams.set('stars', params.stars.toString())

  const url = `/api/inventory/hotels?${queryParams.toString()}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  })

  const createHotel = async (hotelData: any) => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/inventory/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotelData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear hotel')
      }

      const result = await res.json()
      await mutate()
      return result
    } catch (error) {
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  const updateHotel = async (id: string, hotelData: any) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/inventory/hotels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotelData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar hotel')
      }

      const result = await res.json()
      await mutate()
      return result
    } catch (error) {
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteHotel = async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/inventory/hotels/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar hotel')
      }

      const result = await res.json()
      await mutate()
      return result
    } catch (error) {
      throw error
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    hotels: data?.hotels || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
    createHotel,
    updateHotel,
    deleteHotel,
    isCreating,
    isUpdating,
    isDeleting
  }
}

export function useHotel(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/inventory/hotels/${id}` : null,
    fetcher
  )

  return {
    hotel: data?.hotel,
    isLoading,
    error,
    mutate
  }
}
