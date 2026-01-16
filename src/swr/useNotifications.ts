import useSWR from 'swr'
import { INotificationClient } from '@/types/notification'

interface NotificationServerResponse {
  _id: { $oid: string } | string
  userId: { $oid: string } | string
  type: string
  priority: string
  category?: string
  title: string
  message: string
  icon?: string
  imageUrl?: string
  action?: {
    label: string
    url: string
    type?: 'primary' | 'secondary'
  }
  metadata?: Record<string, unknown>
  isRead: boolean
  readAt?: string
  isPinned: boolean
  expiresAt?: string
  sentVia: {
    inApp: boolean
    push: boolean
    email: boolean
  }
  pushSentAt?: string
  emailSentAt?: string
  createdBy?: {
    _id: { $oid: string } | string
    firstName?: string
    lastName?: string
    email?: string
    avatar?: string
  } | { $oid: string } | string
  createdAt: string
  updatedAt: string
}

interface NotificationsResponse {
  success: boolean
  data: NotificationServerResponse[]
  unreadCount: number
  error?: string
}

interface UnreadCountResponse {
  success: boolean
  count: number
  error?: string
}

interface UseNotificationsOptions {
  limit?: number
  skip?: number
  unreadOnly?: boolean
  includeDismissed?: boolean
  refreshInterval?: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage = data?.error || `Request failed (${response.status})`
    throw new Error(errorMessage)
  }

  if (data?.success === false) {
    throw new Error(data?.error || 'Request failed')
  }

  return data
}

// Helper para convertir ObjectId a string
const normalizeId = (id: unknown): string => {
  if (!id) return ''
  if (typeof id === 'string') return id
  if (typeof id === 'object' && (id as any).$oid) return (id as any).$oid
  if (typeof (id as any).toString === 'function') return (id as any).toString()
  return String(id)
}

// Normalizar createdBy
const normalizeCreatedBy = (createdBy: any) => {
  if (!createdBy) return undefined
  
  // Si es un objeto con información del usuario
  if (typeof createdBy === 'object' && (createdBy.firstName || createdBy.lastName || createdBy.email)) {
    return {
      _id: normalizeId(createdBy._id),
      firstName: createdBy.firstName,
      lastName: createdBy.lastName,
      email: createdBy.email,
      avatar: createdBy.avatar
    }
  }
  
  // Si es solo un ID, devolver undefined (no tenemos info del usuario)
  return undefined
}

// Convertir respuesta del servidor a formato cliente
const normalizeNotification = (notif: NotificationServerResponse): INotificationClient => ({
  _id: normalizeId(notif._id),
  userId: normalizeId(notif.userId),
  type: notif.type as any,
  priority: notif.priority as any,
  category: notif.category as any,
  title: notif.title,
  message: notif.message,
  icon: notif.icon,
  imageUrl: notif.imageUrl,
  action: notif.action,
  metadata: notif.metadata,
  isRead: notif.isRead,
  readAt: notif.readAt ? new Date(notif.readAt) : undefined,
  isPinned: notif.isPinned,
  expiresAt: notif.expiresAt ? new Date(notif.expiresAt) : undefined,
  sentVia: notif.sentVia,
  pushSentAt: notif.pushSentAt ? new Date(notif.pushSentAt) : undefined,
  emailSentAt: notif.emailSentAt ? new Date(notif.emailSentAt) : undefined,
  createdBy: normalizeCreatedBy(notif.createdBy),
  createdAt: new Date(notif.createdAt),
  updatedAt: new Date(notif.updatedAt)
})

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    limit = 50,
    skip = 0,
    unreadOnly = false,
    includeDismissed = false,
    refreshInterval = 30000
  } = options
  
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
    unreadOnly: unreadOnly.toString(),
    includeDismissed: includeDismissed.toString()
  })

  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    `/api/notifications?${params}`,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })

      if (!response.ok) throw new Error('Error al marcar como leída')

      await mutate()
      return true
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
      return false
    }
  }

  const togglePin = async (notificationId: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned })
      })

      if (!response.ok) throw new Error('Error al cambiar pin')

      await mutate()
      return true
    } catch (error) {
      console.error('Error al cambiar pin de notificación:', error)
      return false
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar')

      await mutate()
      return true
    } catch (error) {
      console.error('Error al eliminar notificación:', error)
      return false
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Error al marcar todas como leídas')

      await mutate()
      return true
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error)
      return false
    }
  }

  return {
    notifications: data?.data?.map(normalizeNotification) || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isError: error,
    mutate,
    markAsRead,
    togglePin,
    deleteNotification,
    markAllAsRead
  }
}

export function useUnreadCount() {
  const { data, error, isLoading, mutate } = useSWR<UnreadCountResponse>(
    '/api/notifications/unread-count',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  return {
    count: data?.count || 0,
    isLoading,
    isError: error,
    mutate
  }
}
