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

export function useFlights(params?: {
  page?: number
  limit?: number
  search?: string
  supplier?: string
  status?: string
  departureAirport?: string
  arrivalAirport?: string
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.set('page', params.page.toString())
  if (params?.limit) queryParams.set('limit', params.limit.toString())
  if (params?.search) queryParams.set('search', params.search)
  if (params?.supplier) queryParams.set('supplier', params.supplier)
  if (params?.status) queryParams.set('status', params.status)
  if (params?.departureAirport) queryParams.set('departureAirport', params.departureAirport)
  if (params?.arrivalAirport) queryParams.set('arrivalAirport', params.arrivalAirport)

  const url = `/api/inventory/flights?${queryParams.toString()}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  })

  const createFlight = async (flightData: any) => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/inventory/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flightData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear vuelo')
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

  const updateFlight = async (id: string, flightData: any) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/inventory/flights/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flightData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar vuelo')
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

  const deleteFlight = async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/inventory/flights/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar vuelo')
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
    flights: data?.flights || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
    createFlight,
    updateFlight,
    deleteFlight,
    isCreating,
    isUpdating,
    isDeleting
  }
}

export function useFlight(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/inventory/flights/${id}` : null,
    fetcher
  )

  return {
    flight: data?.flight,
    isLoading,
    error,
    mutate
  }
}
