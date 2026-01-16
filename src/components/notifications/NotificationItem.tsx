'use client'

import { Card, CardBody, Button, Chip, Avatar } from '@heroui/react'
import {
  Pin,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Package,
  CreditCard,
  Settings,
  ExternalLink
} from 'lucide-react'
import { INotificationClient, NotificationType } from '@/types/notification'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const notificationIcons: Record<NotificationType, any> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  booking: Package,
  payment: CreditCard,
  system: Settings
}

const notificationColors: Record<NotificationType, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  info: 'primary',
  success: 'success',
  warning: 'warning',
  error: 'danger',
  booking: 'primary',
  payment: 'success',
  system: 'default'
}

interface NotificationItemProps {
  notification: INotificationClient
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string, isPinned: boolean) => void
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onTogglePin
}: NotificationItemProps) {
  const IconComponent = notificationIcons[notification.type]
  const color = notificationColors[notification.type]

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
  }

  return (
    <Card
      className={`
        ${!notification.isRead ? 'bg-primary/5 border-l-4 border-primary' : ''}
        ${notification.isPinned ? 'border-t-4 border-warning' : ''}
      `}
    >
      <CardBody className="gap-3">
        <div className="flex gap-3">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-${color}/10 flex-shrink-0`}>
            <IconComponent className={`w-6 h-6 text-${color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-base font-semibold">
                {notification.title}
              </h4>
              <div className="flex items-center gap-2">
                {!notification.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
                {notification.priority === 'urgent' && (
                  <Chip size="sm" color="danger" variant="flat">
                    Urgente
                  </Chip>
                )}
                {notification.priority === 'high' && (
                  <Chip size="sm" color="warning" variant="flat">
                    Alta
                  </Chip>
                )}
              </div>
            </div>

            <p className="text-sm text-default-600 mb-2">
              {notification.message}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-default-400">
                {getTimeAgo(notification.createdAt)}
              </span>

              <div className="flex items-center gap-2">
                {!notification.isRead && onMarkAsRead && (
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => onMarkAsRead(notification._id)}
                  >
                    Marcar como leída
                  </Button>
                )}

                {notification.action && (
                  <Button
                    size="sm"
                    color={notification.action.type === 'primary' ? 'primary' : 'default'}
                    variant="flat"
                    endContent={<ExternalLink className="w-4 h-4" />}
                    as="a"
                    href={notification.action.url}
                  >
                    {notification.action.label}
                  </Button>
                )}

                {onTogglePin && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onTogglePin(notification._id, !notification.isPinned)}
                  >
                    <Pin className={`w-4 h-4 ${notification.isPinned ? 'fill-warning text-warning' : ''}`} />
                  </Button>
                )}

                {onDelete && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => onDelete(notification._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
