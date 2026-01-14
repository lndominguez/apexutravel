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

export function useSuppliers(params?: {
  page?: number
  limit?: number
  search?: string
  type?: string
  status?: string
  country?: string
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.set('page', params.page.toString())
  if (params?.limit) queryParams.set('limit', params.limit.toString())
  if (params?.search) queryParams.set('search', params.search)
  if (params?.type) queryParams.set('type', params.type)
  if (params?.status) queryParams.set('status', params.status)
  if (params?.country) queryParams.set('country', params.country)

  const url = `/api/resources/suppliers?${queryParams.toString()}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  })

  // Crear proveedor
  const createSupplier = async (supplierData: any) => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/resources/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear proveedor')
      }

      const result = await res.json()
      await mutate() // Revalidar la lista
      return result
    } catch (error) {
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  // Actualizar proveedor
  const updateSupplier = async (id: string, supplierData: any) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/resources/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar proveedor')
      }

      const result = await res.json()
      await mutate() // Revalidar la lista
      return result
    } catch (error) {
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  // Eliminar proveedor
  const deleteSupplier = async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/resources/suppliers/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar proveedor')
      }

      const result = await res.json()
      await mutate() // Revalidar la lista
      return result
    } catch (error) {
      throw error
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    suppliers: data?.suppliers || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
    // Funciones CRUD
    createSupplier,
    updateSupplier,
    deleteSupplier,
    // Estados de loading
    isCreating,
    isUpdating,
    isDeleting
  }
}

export function useSupplier(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/resources/suppliers/${id}` : null,
    fetcher
  )

  return {
    supplier: data?.supplier,
    isLoading,
    error,
    mutate
  }
}
