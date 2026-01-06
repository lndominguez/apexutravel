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

export function useTransports(params?: {
  page?: number
  limit?: number
  search?: string
  supplier?: string
  status?: string
  type?: string
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
  if (params?.type) queryParams.set('type', params.type)

  const url = `/api/inventory/transports?${queryParams.toString()}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  })

  const createTransport = async (transportData: any) => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/inventory/transports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transportData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear transporte')
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

  const updateTransport = async (id: string, transportData: any) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/inventory/transports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transportData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar transporte')
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

  const deleteTransport = async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/inventory/transports/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar transporte')
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
    transports: data?.transports || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
    createTransport,
    updateTransport,
    deleteTransport,
    isCreating,
    isUpdating,
    isDeleting
  }
}

export function useTransport(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/inventory/transports/${id}` : null,
    fetcher
  )

  return {
    transport: data?.transport,
    isLoading,
    error,
    mutate
  }
}
