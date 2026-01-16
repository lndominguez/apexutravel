'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'

interface AdminNotificationsFilters {
  page?: number
  limit?: number
  search?: string
  type?: string
  priority?: string
  userId?: string
  userEmail?: string
  createdBy?: string
  createdByEmail?: string
  dateFrom?: string
  dateTo?: string
  includeDismissed?: boolean
}

interface AdminNotificationsResponse {
  success: boolean
  data: any[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`)
  }

  if (data?.success === false) {
    throw new Error(data?.error || 'Request failed')
  }

  return data
}

export function useAdminNotifications(filters: AdminNotificationsFilters = {}) {
  const { status } = useSession()

  const shouldFetch = status === 'authenticated'

  const buildUrl = () => {
    const queryParams = new URLSearchParams()

    if (filters.page) queryParams.set('page', filters.page.toString())
    if (filters.limit) queryParams.set('limit', filters.limit.toString())
    if (filters.search) queryParams.set('search', filters.search)
    if (filters.type) queryParams.set('type', filters.type)
    if (filters.priority) queryParams.set('priority', filters.priority)

    if (filters.userId) queryParams.set('userId', filters.userId)
    if (filters.userEmail) queryParams.set('userEmail', filters.userEmail)

    if (filters.createdBy) queryParams.set('createdBy', filters.createdBy)
    if (filters.createdByEmail) queryParams.set('createdByEmail', filters.createdByEmail)

    if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) queryParams.set('dateTo', filters.dateTo)

    if (filters.includeDismissed !== undefined) {
      queryParams.set('includeDismissed', String(filters.includeDismissed))
    }

    const queryString = queryParams.toString()
    return `/api/admin/notifications${queryString ? `?${queryString}` : ''}`
  }

  const url = shouldFetch ? buildUrl() : null

  const { data, error, isLoading, mutate, isValidating } = useSWR<AdminNotificationsResponse>(
    url,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )

  const deleteNotificationGlobal = async (notificationId: string) => {
    const response = await fetch(`/api/admin/notifications/${notificationId}`, {
      method: 'DELETE'
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || 'Error al eliminar notificación')
    }

    await mutate()
    return true
  }

  return {
    notifications: data?.data || [],
    pagination: data?.pagination || null,
    isLoading,
    isValidating,
    error,
    mutate,
    deleteNotificationGlobal
  }
}
