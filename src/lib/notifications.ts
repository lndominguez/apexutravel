import { Notification } from '@/models'
import { NotificationType, NotificationPriority, NotificationCategory } from '@/types/notification'
import { sendPushNotification } from './push-notifications'
import mongoose from 'mongoose'

interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId
  createdBy?: string | mongoose.Types.ObjectId
  type: NotificationType
  priority: NotificationPriority
  category?: NotificationCategory
  title: string
  message: string
  icon?: string
  action?: {
    label: string
    url: string
    type?: 'primary' | 'secondary'
  }
  metadata?: Record<string, unknown>
  targetRoles?: string[]
  isPinned?: boolean
  sendPush?: boolean
  sendEmail?: boolean
}

/**
 * Crear una notificación en la base de datos
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await Notification.create({
      userId: typeof params.userId === 'string' 
        ? new mongoose.Types.ObjectId(params.userId) 
        : params.userId,
      createdBy: params.createdBy
        ? (typeof params.createdBy === 'string'
          ? new mongoose.Types.ObjectId(params.createdBy)
          : params.createdBy)
        : undefined,
      type: params.type,
      priority: params.priority,
      category: params.category,
      title: params.title,
      message: params.message,
      icon: params.icon,
      action: params.action,
      metadata: params.metadata,
      targetRoles: params.targetRoles,
      isPinned: params.isPinned || false,
      sentVia: {
        inApp: true,
        push: params.sendPush || false,
        email: params.sendEmail || false
      }
    })

    console.log('✅ Notificación creada:', notification._id)

    // Enviar push notification si está habilitado
    if (params.sendPush) {
      sendPushNotification({
        userId: params.userId,
        title: params.title,
        body: params.message,
        icon: params.icon,
        clickAction: params.action?.url,
        data: {
          notificationId: notification._id.toString(),
          type: params.type,
          priority: params.priority
        }
      }).catch(error => {
        console.error('❌ Error enviando push notification:', error)
      })
    }

    return notification
  } catch (error) {
    console.error('❌ Error creando notificación:', error)
    throw error
  }
}

/**
 * Notificación para nueva reserva (al cliente)
 */
export async function notifyNewBooking(params: {
  userId: string | mongoose.Types.ObjectId
  bookingNumber: string
  bookingId: string
  itemName: string
  itemType: string
  totalPrice: number
  currency: string
}) {
  const typeLabel = params.itemType === 'package' ? 'paquete' : 
                    params.itemType === 'hotel' ? 'hotel' : 'vuelo'

  return createNotification({
    userId: params.userId,
    type: NotificationType.BOOKING,
    priority: NotificationPriority.HIGH,
    category: NotificationCategory.BOOKINGS,
    title: '🎉 Reserva creada exitosamente',
    message: `Tu reserva ${params.bookingNumber} para ${params.itemName} ha sido creada. Total: ${params.currency} ${params.totalPrice.toFixed(2)}`,
    icon: 'Package',
    action: {
      label: 'Ver reserva',
      url: `/bookings/${params.bookingId}`,
      type: 'primary'
    },
    metadata: {
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber,
      itemType: params.itemType,
      totalPrice: params.totalPrice
    },
    isPinned: true
  })
}

/**
 * Notificación de reserva confirmada
 */
export async function notifyBookingConfirmed(params: {
  userId: string | mongoose.Types.ObjectId
  bookingNumber: string
  bookingId: string
  itemName: string
}) {
  return createNotification({
    userId: params.userId,
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.HIGH,
    title: '✅ Reserva confirmada',
    message: `Tu reserva ${params.bookingNumber} para ${params.itemName} ha sido confirmada. ¡Prepárate para tu viaje!`,
    icon: 'CheckCircle',
    action: {
      label: 'Ver detalles',
      url: `/bookings/${params.bookingId}`,
      type: 'primary'
    },
    metadata: {
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber
    },
    isPinned: true
  })
}

/**
 * Notificación de reserva cancelada
 */
export async function notifyBookingCancelled(params: {
  userId: string | mongoose.Types.ObjectId
  bookingNumber: string
  bookingId: string
  itemName: string
  reason?: string
}) {
  return createNotification({
    userId: params.userId,
    type: NotificationType.WARNING,
    priority: NotificationPriority.HIGH,
    title: '⚠️ Reserva cancelada',
    message: `Tu reserva ${params.bookingNumber} para ${params.itemName} ha sido cancelada.${params.reason ? ` Motivo: ${params.reason}` : ''}`,
    icon: 'AlertTriangle',
    action: {
      label: 'Ver detalles',
      url: `/bookings/${params.bookingId}`,
      type: 'secondary'
    },
    metadata: {
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber,
      reason: params.reason
    },
    isPinned: true
  })
}

/**
 * Notificación de pago recibido
 */
export async function notifyPaymentReceived(params: {
  userId: string | mongoose.Types.ObjectId
  bookingNumber: string
  bookingId: string
  amount: number
  currency: string
  paymentMethod: string
}) {
  return createNotification({
    userId: params.userId,
    type: NotificationType.PAYMENT,
    priority: NotificationPriority.MEDIUM,
    title: '💳 Pago recibido',
    message: `Hemos recibido tu pago de ${params.currency} ${params.amount.toFixed(2)} para la reserva ${params.bookingNumber}.`,
    icon: 'CreditCard',
    action: {
      label: 'Ver recibo',
      url: `/bookings/${params.bookingId}`,
      type: 'primary'
    },
    metadata: {
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber,
      amount: params.amount,
      paymentMethod: params.paymentMethod
    }
  })
}

/**
 * Notificación de recordatorio de pago pendiente
 */
export async function notifyPaymentReminder(params: {
  userId: string | mongoose.Types.ObjectId
  bookingNumber: string
  bookingId: string
  amount: number
  currency: string
  daysRemaining: number
}) {
  return createNotification({
    userId: params.userId,
    type: NotificationType.WARNING,
    priority: NotificationPriority.HIGH,
    title: '⏰ Recordatorio de pago',
    message: `Tienes un pago pendiente de ${params.currency} ${params.amount.toFixed(2)} para la reserva ${params.bookingNumber}. Vence en ${params.daysRemaining} días.`,
    icon: 'AlertCircle',
    action: {
      label: 'Realizar pago',
      url: `/bookings/${params.bookingId}/payment`,
      type: 'primary'
    },
    metadata: {
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber,
      amount: params.amount,
      daysRemaining: params.daysRemaining
    },
    isPinned: true
  })
}

/**
 * Notificación para administradores de nueva reserva
 */
export async function notifyAdminNewBooking(params: {
  adminUserId: string | mongoose.Types.ObjectId
  createdBy?: string | mongoose.Types.ObjectId
  bookingNumber: string
  bookingId: string
  customerName: string
  itemName: string
  totalPrice: number
  currency: string
}) {
  return createNotification({
    userId: params.adminUserId,
    createdBy: params.createdBy,
    type: NotificationType.BOOKING,
    priority: NotificationPriority.HIGH,
    category: NotificationCategory.BOOKINGS,
    title: '🔔 Nueva reserva recibida',
    message: `${params.customerName} ha creado una reserva ${params.bookingNumber} para ${params.itemName}. Total: ${params.currency} ${params.totalPrice.toFixed(2)}`,
    icon: 'Bell',
    action: {
      label: 'Revisar',
      url: `/admin/bookings/${params.bookingId}`,
      type: 'primary'
    },
    metadata: {
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber,
      customerName: params.customerName,
      totalPrice: params.totalPrice
    },
    targetRoles: ['super_admin', 'admin'],
    isPinned: true,
    sendPush: true
  })
}

/**
 * Notificación para admin que actualizó una reserva
 */
export async function notifyAdminBookingUpdate(params: {
  adminUserId: string | mongoose.Types.ObjectId
  createdBy?: string | mongoose.Types.ObjectId
  bookingNumber: string
  bookingId: string
  action: string
  itemName: string
}) {
  return createNotification({
    userId: params.adminUserId,
    createdBy: params.createdBy,
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    category: NotificationCategory.BOOKINGS,
    title: '✅ Reserva actualizada',
    message: `Has actualizado la reserva ${params.bookingNumber} (${params.itemName}): ${params.action}`,
    icon: 'CheckCircle',
    action: {
      label: 'Ver',
      url: `/admin/bookings/${params.bookingId}`,
      type: 'primary'
    },
    metadata: {
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber,
      action: params.action
    },
    targetRoles: ['super_admin', 'admin', 'manager'],
    sendPush: true
  })
}

/**
 * Notificación genérica del sistema
 */
export async function notifySystem(params: {
  userId: string | mongoose.Types.ObjectId
  title: string
  message: string
  priority?: NotificationPriority
  action?: {
    label: string
    url: string
  }
}) {
  return createNotification({
    userId: params.userId,
    type: NotificationType.SYSTEM,
    priority: params.priority || NotificationPriority.MEDIUM,
    title: params.title,
    message: params.message,
    icon: 'Settings',
    action: params.action,
    metadata: {}
  })
}
