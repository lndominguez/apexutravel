// Tipos compartidos para notificaciones (sin dependencias de Mongoose)

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  BOOKING = 'booking',
  PAYMENT = 'payment',
  SYSTEM = 'system'
}

export enum NotificationCategory {
  BOOKINGS = 'bookings',
  PAYMENTS = 'payments',
  INVOICES = 'invoices',
  ADMINISTRATION = 'administration',
  INVENTORY = 'inventory',
  OFFERS = 'offers',
  USERS = 'users',
  SYSTEM = 'system'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface NotificationAction {
  label: string
  url: string
  type?: 'primary' | 'secondary'
}

export interface NotificationCreatedBy {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
  avatar?: string
}

export interface INotificationClient {
  _id: string
  userId: string
  type: NotificationType
  priority: NotificationPriority
  category?: NotificationCategory
  title: string
  message: string
  icon?: string
  imageUrl?: string
  action?: NotificationAction
  metadata?: Record<string, unknown>
  isRead: boolean
  readAt?: Date
  isPinned: boolean
  expiresAt?: Date
  sentVia: {
    inApp: boolean
    push: boolean
    email: boolean
  }
  pushSentAt?: Date
  emailSentAt?: Date
  createdBy?: NotificationCreatedBy
  createdAt: Date
  updatedAt: Date
}
