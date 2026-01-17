'use client'

import { useEffect } from 'react'
import { Card, CardBody } from '@heroui/react'
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-danger" />
      case 'info':
        return <Info className="w-5 h-5 text-primary" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />
    }
  }

  const getColor = () => {
    switch (type) {
      case 'success':
        return 'border-success/20 bg-success/5'
      case 'error':
        return 'border-danger/20 bg-danger/5'
      case 'info':
        return 'border-primary/20 bg-primary/5'
      case 'warning':
        return 'border-warning/20 bg-warning/5'
    }
  }

  return (
    <Card className={`${getColor()} border shadow-lg animate-in slide-in-from-top-5`}>
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <p className="flex-1 text-sm font-medium">{message}</p>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardBody>
    </Card>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {children}
    </div>
  )
}
