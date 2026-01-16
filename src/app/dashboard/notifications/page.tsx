'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  Tabs,
  Tab,
  Chip,
  Spinner
} from '@heroui/react'
import { Bell, CheckCheck, Filter, Send } from 'lucide-react'
import { useNotifications } from '@/swr'
import { NotificationItem } from '@/components/notifications'
import { NotificationSender } from '@/components/notifications/NotificationSender'
import { PageWrapper } from '@/components/PageWrapper'

export default function NotificationsPage() {
  const [selectedTab, setSelectedTab] = useState('all')
  const [isSenderOpen, setIsSenderOpen] = useState(false)
  
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    togglePin,
    mutate 
  } = useNotifications({
    unreadOnly: selectedTab === 'unread',
    includeDismissed: true
  })

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-7 h-7" />
              Notificaciones
            </h1>
            <p className="text-sm text-default-500 mt-1">
              Gestiona todas tus notificaciones
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                color="primary"
                variant="flat"
                startContent={<CheckCheck className="w-4 h-4" />}
                onPress={handleMarkAllAsRead}
              >
                Marcar todas como leídas
              </Button>
            )}
            <Button
              color="primary"
              startContent={<Send className="w-4 h-4" />}
              onPress={() => setIsSenderOpen(true)}
            >
              Nueva Notificación
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-primary" />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Sin leer</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <Chip color="danger" variant="flat" size="lg">
                {unreadCount}
              </Chip>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Leídas</p>
                <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
              </div>
              <CheckCheck className="w-8 h-8 text-success" />
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              color="primary"
              variant="underlined"
            >
              <Tab
                key="all"
                title={
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span>Todas</span>
                    <Chip size="sm" variant="flat">{notifications.length}</Chip>
                  </div>
                }
              />
              <Tab
                key="unread"
                title={
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>Sin leer</span>
                    {unreadCount > 0 && (
                      <Chip size="sm" color="danger" variant="flat">{unreadCount}</Chip>
                    )}
                  </div>
                }
              />
            </Tabs>
          </CardBody>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-12">
                <Bell className="w-16 h-16 text-default-300 mb-4" />
                <p className="text-lg font-semibold text-default-600">
                  {selectedTab === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
                </p>
                <p className="text-sm text-default-500">
                  {selectedTab === 'unread' ? '¡Estás al día!' : 'Las notificaciones aparecerán aquí'}
                </p>
              </CardBody>
            </Card>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onTogglePin={(id, isPinned) => togglePin(id, isPinned)}
              />
            ))
          )}
        </div>
      </div>

      {/* Notification Sender Modal */}
      <NotificationSender
        isOpen={isSenderOpen}
        onClose={() => setIsSenderOpen(false)}
        onSuccess={() => mutate()}
      />
    </PageWrapper>
  )
}
