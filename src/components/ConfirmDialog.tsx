'use client'

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@heroui/react'
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  isLoading = false
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    if (!isLoading) {
      onClose()
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="text-danger" size={48} />
      case 'warning':
        return <AlertTriangle className="text-warning" size={48} />
      case 'info':
        return <Info className="text-primary" size={48} />
      case 'success':
        return <CheckCircle className="text-success" size={48} />
      default:
        return <AlertTriangle className="text-warning" size={48} />
    }
  }

  const getButtonProps = () => {
    switch (type) {
      case 'danger':
        return { 
          color: 'danger' as const,
          className: 'text-white'
        }
      case 'warning':
        return { 
          color: 'warning' as const,
          className: 'text-white'
        }
      case 'info':
        return { 
          color: 'primary' as const,
          className: 'text-white'
        }
      case 'success':
        return { 
          color: 'success' as const,
          className: 'text-white'
        }
      default:
        return { 
          color: 'primary' as const,
          className: 'text-white'
        }
    }
  }

  const buttonProps = getButtonProps()

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      isDismissable={!isLoading}
      hideCloseButton={isLoading}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
        <ModalBody>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <p className="text-sm text-default-600 flex-1 whitespace-pre-wrap">{message}</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="light" 
            onPress={onClose}
            isDisabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            color={buttonProps.color}
            className={buttonProps.className}
            onPress={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
