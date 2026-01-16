'use client'

import { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Chip
} from '@heroui/react'
import { Send, X } from 'lucide-react'
import { NotificationType, NotificationPriority } from '@/types/notification'
import { toast } from 'sonner'

interface NotificationSenderProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  recipientId?: string
  recipientName?: string
}

export function NotificationSender({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  onSuccess
}: NotificationSenderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: NotificationType.INFO,
    priority: NotificationPriority.MEDIUM,
    title: '',
    message: '',
    icon: '',
    actionLabel: '',
    actionUrl: '',
    isPinned: false,
    sendPush: false,
    sendEmail: false
  })

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Título y mensaje son requeridos')
      return
    }

    setIsLoading(true)

    try {
      const payload: any = {
        userId: recipientId,
        type: formData.type,
        priority: formData.priority,
        title: formData.title,
        message: formData.message,
        isPinned: formData.isPinned,
        sentVia: {
          inApp: true,
          push: formData.sendPush,
          email: formData.sendEmail
        }
      }

      if (formData.icon) {
        payload.icon = formData.icon
      }

      if (formData.actionLabel && formData.actionUrl) {
        payload.action = {
          label: formData.actionLabel,
          url: formData.actionUrl,
          type: 'primary'
        }
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Error al enviar notificación')
      }

      toast.success('Notificación enviada exitosamente')
      
      setFormData({
        type: NotificationType.INFO,
        priority: NotificationPriority.MEDIUM,
        title: '',
        message: '',
        icon: '',
        actionLabel: '',
        actionUrl: '',
        isPinned: false,
        sendPush: false,
        sendEmail: false
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al enviar notificación:', error)
      toast.error('Error al enviar notificación')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Enviar Notificación</h2>
          {recipientName && (
            <p className="text-sm text-default-500">Para: {recipientName}</p>
          )}
        </ModalHeader>

        <ModalBody className="gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo"
              placeholder="Selecciona el tipo"
              selectedKeys={[formData.type]}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationType })}
            >
              <SelectItem key={NotificationType.INFO}>
                Información
              </SelectItem>
              <SelectItem key={NotificationType.SUCCESS}>
                Éxito
              </SelectItem>
              <SelectItem key={NotificationType.WARNING}>
                Advertencia
              </SelectItem>
              <SelectItem key={NotificationType.ERROR}>
                Error
              </SelectItem>
              <SelectItem key={NotificationType.BOOKING}>
                Reserva
              </SelectItem>
              <SelectItem key={NotificationType.PAYMENT}>
                Pago
              </SelectItem>
              <SelectItem key={NotificationType.SYSTEM}>
                Sistema
              </SelectItem>
            </Select>

            <Select
              label="Prioridad"
              placeholder="Selecciona la prioridad"
              selectedKeys={[formData.priority]}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as NotificationPriority })}
            >
              <SelectItem key={NotificationPriority.LOW}>
                Baja
              </SelectItem>
              <SelectItem key={NotificationPriority.MEDIUM}>
                Media
              </SelectItem>
              <SelectItem key={NotificationPriority.HIGH}>
                Alta
              </SelectItem>
              <SelectItem key={NotificationPriority.URGENT}>
                Urgente
              </SelectItem>
            </Select>
          </div>

          <Input
            label="Título"
            placeholder="Título de la notificación"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            isRequired
            maxLength={100}
          />

          <Textarea
            label="Mensaje"
            placeholder="Mensaje de la notificación"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            isRequired
            maxLength={500}
            minRows={3}
          />

          <Input
            label="Icono (opcional)"
            placeholder="Nombre del icono de Lucide (ej: Bell, Info)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          />

          <div className="border-t border-divider pt-4">
            <p className="text-sm font-semibold mb-3">Acción (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Texto del botón"
                placeholder="Ver detalles"
                value={formData.actionLabel}
                onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
              />
              <Input
                label="URL"
                placeholder="/dashboard/bookings/123"
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t border-divider pt-4">
            <p className="text-sm font-semibold mb-3">Opciones</p>
            <div className="flex flex-col gap-3">
              <Switch
                isSelected={formData.isPinned}
                onValueChange={(value) => setFormData({ ...formData, isPinned: value })}
              >
                <div className="flex flex-col">
                  <span className="text-sm">Fijar notificación</span>
                  <span className="text-xs text-default-500">Aparecerá al inicio de la lista</span>
                </div>
              </Switch>

              <Switch
                isSelected={formData.sendPush}
                onValueChange={(value) => setFormData({ ...formData, sendPush: value })}
              >
                <div className="flex flex-col">
                  <span className="text-sm">Enviar push notification</span>
                  <span className="text-xs text-default-500">Notificación en dispositivo</span>
                </div>
              </Switch>

              <Switch
                isSelected={formData.sendEmail}
                onValueChange={(value) => setFormData({ ...formData, sendEmail: value })}
              >
                <div className="flex flex-col">
                  <span className="text-sm">Enviar por email</span>
                  <span className="text-xs text-default-500">Copia por correo electrónico</span>
                </div>
              </Switch>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="light"
            onPress={onClose}
            startContent={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            startContent={!isLoading && <Send className="w-4 h-4" />}
          >
            Enviar Notificación
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
