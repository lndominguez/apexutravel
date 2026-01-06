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

export function usePackages(params?: {
  page?: number
  limit?: number
  status?: string
  category?: string
  country?: string
  search?: string
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.set('page', params.page.toString())
  if (params?.limit) queryParams.set('limit', params.limit.toString())
  if (params?.status) queryParams.set('status', params.status)
  if (params?.category) queryParams.set('category', params.category)
  if (params?.country) queryParams.set('country', params.country)
  if (params?.search) queryParams.set('search', params.search)

  const url = `/api/inventory/packages?${queryParams.toString()}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  })

  const createPackage = async (packageData: any) => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/inventory/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear paquete')
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

  const updatePackage = async (id: string, packageData: any) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/inventory/packages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      })

      if (!res.ok) {
        const error = await res.json()
        console.error('Error al actualizar paquete:', error)
        
        // Mostrar detalles específicos de validación si existen
        if (error.fields && error.fields.length > 0) {
          const fieldErrors = error.fields.map((f: any) => `${f.field}: ${f.message}`).join(', ')
          throw new Error(`${error.error} - ${fieldErrors}`)
        }
        
        throw new Error(error.details || error.error || 'Error al actualizar paquete')
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

  const deletePackage = async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/inventory/packages/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar paquete')
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
    packages: data?.packages || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
    createPackage,
    updatePackage,
    deletePackage,
    isCreating,
    isUpdating,
    isDeleting
  }
}

export function usePackage(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/inventory/packages/${id}` : null,
    fetcher
  )

  return {
    package: data?.package,
    isLoading,
    error,
    mutate
  }
}
