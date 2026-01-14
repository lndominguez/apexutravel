'use client'

import { useState, useCallback } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'warning'
  })
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions({
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      type: 'warning',
      ...opts
    })
    setIsOpen(true)
    setIsLoading(false)

    return new Promise((resolve) => {
      setResolveCallback(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (resolveCallback) {
      resolveCallback(true)
      setResolveCallback(null)
    }
    setIsOpen(false)
  }, [resolveCallback])

  const handleCancel = useCallback(() => {
    if (resolveCallback) {
      resolveCallback(false)
      setResolveCallback(null)
    }
    setIsOpen(false)
  }, [resolveCallback])

  const ConfirmDialogComponent = useCallback(() => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={options.title}
      message={options.message}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      type={options.type}
      isLoading={isLoading}
    />
  ), [isOpen, options, isLoading, handleCancel, handleConfirm])

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
    setIsLoading
  }
}
