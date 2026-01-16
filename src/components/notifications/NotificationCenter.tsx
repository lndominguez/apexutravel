'use client'

import { useState } from 'react'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Button,
  Badge,
  Avatar,
  Chip,
  Spinner,
  ScrollShadow
} from '@heroui/react'
import {
  Bell,
  Check,
  CheckCheck,
  Pin,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Package,
  CreditCard,
  Settings
} from 'lucide-react'
import { useNotifications } from '@/swr'
import { INotificationClient, NotificationType, NotificationCategory } from '@/types/notification'
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

const categoryLabels: Record<NotificationCategory, string> = {
  bookings: 'Reservas',
  payments: 'Pagos',
  invoices: 'Facturas',
  administration: 'Administración',
  inventory: 'Inventario',
  offers: 'Ofertas',
  users: 'Usuarios',
  system: 'Sistema'
}

const categoryColors: Record<NotificationCategory, string> = {
  bookings: 'bg-blue-100 text-blue-700',
  payments: 'bg-green-100 text-green-700',
  invoices: 'bg-purple-100 text-purple-700',
  administration: 'bg-orange-100 text-orange-700',
  inventory: 'bg-cyan-100 text-cyan-700',
  offers: 'bg-pink-100 text-pink-700',
  users: 'bg-indigo-100 text-indigo-700',
  system: 'bg-gray-100 text-gray-700'
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    mutate,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    togglePin
  } = useNotifications({ refreshInterval: 10000 })

  const handleMarkAsRead = async (notification: INotificationClient) => {
    if (!notification.isRead) {
      await markAsRead(notification._id)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDelete = async (notificationId: string, e?: unknown) => {
    if (e && typeof (e as any).stopPropagation === 'function') {
      ;(e as any).stopPropagation()
    }
    await deleteNotification(notificationId)
  }

  const handleTogglePin = async (notification: INotificationClient, e?: unknown) => {
    if (e && typeof (e as any).stopPropagation === 'function') {
      ;(e as any).stopPropagation()
    }
    await togglePin(notification._id, !notification.isPinned)
  }

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
  }

  const getCreatedByName = (createdBy?: any) => {
    if (!createdBy) return null
    if (typeof createdBy === 'string') return null
    const name = `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim()
    return name || createdBy.email || null
  }

  const renderNotificationIcon = (notification: INotificationClient) => {
    const IconComponent = notificationIcons[notification.type]
    const color = notificationColors[notification.type]
    
    return (
      <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-${color}/10`}>
        <IconComponent className={`w-5 h-5 text-${color}`} />
      </div>
    )
  }

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (open) {
          mutate()
        }
      }}
      placement="bottom-end"
      classNames={{
        content: 'w-[420px] p-0'
      }}
    >
      <DropdownTrigger>
        <Button
          isIconOnly
          variant="light"
          radius="full"
          className="relative"
        >
          <Badge
            content={unreadCount > 0 ? unreadCount : ''}
            color="danger"
            size="sm"
            isInvisible={unreadCount === 0}
            shape="circle"
          >
            <Bell className="w-5 h-5" />
          </Badge>
        </Button>
      </DropdownTrigger>

      <DropdownMenu
        aria-label="Notificaciones"
        className="p-0"
        closeOnSelect={false}
        itemClasses={{
          base: 'gap-4 p-3 data-[hover=true]:bg-default-100'
        }}
      >
        <DropdownSection
          showDivider
          classNames={{
            heading: 'px-4 pt-3 pb-2',
            group: 'p-0'
          }}
        >
          <DropdownItem
            key="header"
            isReadOnly
            className="cursor-default opacity-100 hover:bg-transparent"
            textValue="Header"
          >
            <div className="flex items-center justify-between px-4 py-2">
              <div>
                <h3 className="text-lg font-semibold">Notificaciones</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-default-500">{unreadCount} sin leer</p>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<CheckCheck className="w-4 h-4" />}
                  onPress={handleMarkAllAsRead}
                >
                  Marcar todas
                </Button>
              )}
            </div>
          </DropdownItem>
        </DropdownSection>

        <DropdownSection
          classNames={{
            group: 'p-0 max-h-[400px] overflow-y-auto'
          }}
        >
          {isLoading ? (
            <DropdownItem key="loading" isReadOnly textValue="Cargando">
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" />
              </div>
            </DropdownItem>
          ) : isError ? (
            <DropdownItem key="error" isReadOnly textValue="Error">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-10 h-10 text-danger mb-2" />
                <p className="text-sm text-danger">No se pudieron cargar notificaciones</p>
                <p className="text-xs text-default-500 mt-1">Revisa sesión / permisos o consola del servidor</p>
              </div>
            </DropdownItem>
          ) : notifications.length === 0 ? (
            <DropdownItem key="empty" isReadOnly textValue="Sin notificaciones">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-12 h-12 text-default-300 mb-2" />
                <p className="text-sm text-default-500">No tienes notificaciones</p>
              </div>
            </DropdownItem>
          ) : (
            notifications.map((notification) => (
              <DropdownItem
                key={notification._id}
                textValue={notification.title}
                className={`
                  relative cursor-pointer py-2
                  ${!notification.isRead ? 'bg-primary/5' : ''}
                  ${notification.isPinned ? 'border-l-4 border-warning' : ''}
                `}
                onPress={() => handleMarkAsRead(notification)}
              >
                <div className="flex gap-2.5 w-full">
                  {renderNotificationIcon(notification)}
                  
                  <div className="flex-1 min-w-0">
                    {/* Header: Título y tiempo en una línea */}
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {!notification.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                        <h4 className={`text-[13px] font-semibold truncate ${!notification.isRead ? 'text-foreground' : 'text-default-700'}`}>
                          {notification.title}
                        </h4>
                      </div>
                      <span className="text-[11px] text-default-400 flex-shrink-0">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>

                    {/* Mensaje compacto con info inline */}
                    <p className="text-[12px] text-default-600 line-clamp-2 mb-1 leading-snug">
                      {notification.message}
                    </p>
                    
                    {/* Footer compacto: Categoría, Usuario, Acción, Botones */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {notification.category && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColors[notification.category]}`}>
                            {categoryLabels[notification.category]}
                          </span>
                        )}
                        {getCreatedByName(notification.createdBy) && (
                          <span className="text-[10px] text-default-500">
                            por <span className="font-semibold text-default-700">{getCreatedByName(notification.createdBy)}</span>
                          </span>
                        )}
                        {notification.priority === 'urgent' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-danger-100 text-danger-700 font-bold uppercase">
                            Urgente
                          </span>
                        )}
                        {notification.priority === 'high' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning-100 text-warning-700 font-semibold uppercase">
                            Alta
                          </span>
                        )}
                        {notification.action && (
                          <>
                            <span className="text-[10px] text-default-300">•</span>
                            <a
                              href={notification.action.url}
                              className="text-[10px] text-primary hover:underline font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {notification.action.label}
                            </a>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-0.5">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="h-5 w-5 min-w-5"
                          onClick={(e) => handleTogglePin(notification, e)}
                        >
                          <Pin className={`w-2.5 h-2.5 ${notification.isPinned ? 'fill-warning text-warning' : ''}`} />
                        </Button>
                        
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          className="h-5 w-5 min-w-5"
                          onClick={(e) => handleDelete(notification._id, e)}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownItem>
            ))
          )}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  )
}
