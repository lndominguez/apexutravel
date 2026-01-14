'use client'

import { useEffect } from 'react'

export function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Solo ejecutar en el cliente después de la hidratación
    const applyTheme = () => {
      try {
        // Obtener preferencias guardadas
        const savedTheme = localStorage.getItem('theme') || 'light'
        // ColorScheme siempre ORANGE (ApexuCode)
        const colorScheme = 'orange'
        
        // Aplicar tema
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        
        // Aplicar esquema de color - Siempre ORANGE
        document.documentElement.setAttribute('data-color', 'orange')
        
        // Marcar como listo
        document.documentElement.setAttribute('data-theme-ready', 'true')
      } catch (e) {
        // Fallback en caso de error
        document.documentElement.setAttribute('data-color', 'orange')
        document.documentElement.setAttribute('data-theme-ready', 'true')
      }
    }

    // Aplicar tema inmediatamente
    applyTheme()
    
    // También aplicar cuando cambie el localStorage (para múltiples pestañas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' || e.key === 'colorScheme') {
        applyTheme()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return <>{children}</>
}
