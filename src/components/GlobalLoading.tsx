'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Plane } from 'lucide-react'

interface GlobalLoadingProps {
  children: React.ReactNode
}

export function GlobalLoading({ children }: GlobalLoadingProps) {
  const { isLoading } = useAuth()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Mostrar contenido cuando todo esté listo
    if (!isLoading) {
      // Delay mínimo para suavizar la transición y mostrar el loading
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!showContent) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <style jsx>{`
          @keyframes spin-smooth {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spin-smooth {
            animation: spin-smooth 2s linear infinite;
          }
        `}</style>
        <div className="flex flex-col items-center gap-6">
          {/* Logo con círculo de carga */}
          <div className="relative">
            {/* Círculo exterior de carga animado */}
            <div className="absolute -inset-2 w-24 h-24 border-4 border-transparent border-t-primary border-r-primary/70 border-b-primary/30 rounded-full spin-smooth"></div>
            
            {/* Círculo medio */}
            <div className="absolute -inset-1 w-22 h-22 border-2 border-primary/20 rounded-full"></div>
            
            {/* Logo central */}
            <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-xl">
              <Plane className="h-8 w-8 text-primary-foreground animate-pulse" />
            </div>
          </div>

          {/* Texto */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Travel CRM</h1>
            <p className="text-sm text-muted-foreground animate-pulse">Iniciando sistema...</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
