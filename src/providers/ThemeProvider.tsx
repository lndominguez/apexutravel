'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentUser } from '@/swr/useCurrentUser'
import { ThemeMode, ColorScheme } from '@/types/user'

// Contexto de tema
interface ThemeContextType {
  theme: ThemeMode
  colorScheme: ColorScheme
  language: string
  updateTheme: (theme: ThemeMode) => Promise<void>
  updateColorScheme: (colorScheme: ColorScheme) => Promise<void>
  updateLanguage: (language: string) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | null>(null)

// Valores por defecto
const DEFAULT_PREFERENCES = {
  theme: ThemeMode.LIGHT,
  colorScheme: ColorScheme.ORANGE,
  language: 'es'
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { isAuthenticated } = useAuth()
  const { user, isLoading: userLoading } = useCurrentUser() // ✅ Datos en tiempo real
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  // Estado de preferencias - ColorScheme siempre ORANGE (ApexuCode)
  const [theme, setTheme] = useState<ThemeMode>(DEFAULT_PREFERENCES.theme)
  const [language, setLanguage] = useState<string>(DEFAULT_PREFERENCES.language)
  const colorScheme = ColorScheme.ORANGE // Siempre fijo en ApexuCode

  // Cargar preferencias del usuario o localStorage (SOLO UNA VEZ)
  useEffect(() => {
    if (hasInitialized) return
    
    // Cargar desde localStorage
    const savedTheme = localStorage.getItem('theme')
    const savedLanguage = localStorage.getItem('language')

    if (savedTheme && Object.values(ThemeMode).includes(savedTheme as ThemeMode)) {
      setTheme(savedTheme as ThemeMode)
    }
    if (savedLanguage) setLanguage(savedLanguage)
    
    setIsLoading(false)
    setHasInitialized(true)
  }, [hasInitialized])

  // Sincronizar con preferencias del usuario cuando cambie la sesión
  // PERO NO sobrescribir cambios locales recientes
  useEffect(() => {
    if (!hasInitialized) return
    if (!isAuthenticated || !user?.preferences) return
    
    // Obtener preferencias de la sesión
    const userTheme = (user.preferences.theme as ThemeMode) || DEFAULT_PREFERENCES.theme
    const userLanguage = user.preferences.language || DEFAULT_PREFERENCES.language
    
    // Verificar localStorage para evitar sobrescribir cambios recientes
    const localTheme = localStorage.getItem('theme')
    
    // Solo actualizar si localStorage coincide con BD (ya sincronizado)
    // o si no hay valor local
    if (!localTheme || localTheme === userTheme) {
      if (theme !== userTheme) {
        console.log('🎨 Sincronizando tema desde sesión:', userTheme)
        setTheme(userTheme)
      }
    }
    
    if (language !== userLanguage) {
      console.log('🌐 Sincronizando idioma desde sesión:', userLanguage)
      setLanguage(userLanguage)
    }
  }, [isAuthenticated, user?.preferences, hasInitialized])

  // Aplicar tema al DOM
  useEffect(() => {
    if (theme === ThemeMode.DARK) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Aplicar esquema de color al DOM - Siempre ORANGE
  useEffect(() => {
    document.documentElement.setAttribute('data-color', ColorScheme.ORANGE)
    localStorage.setItem('colorScheme', ColorScheme.ORANGE)
  }, [])

  // Aplicar idioma
  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  // Función para actualizar tema
  const handleUpdateTheme = async (newTheme: ThemeMode) => {
    // Actualizar estado local primero (optimistic update)
    setTheme(newTheme)
    
    // Si hay sesión, actualizar en la API (pero NO refrescar sesión)
    if (isAuthenticated && user?.id) {
      try {
        await fetch('/api/account/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme })
        })
        console.log('✅ Tema actualizado en BD:', newTheme)
      } catch (error) {
        console.error('❌ Error updating theme:', error)
        // Revertir en caso de error
        setTheme(theme)
      }
    }
  }

  // Función para actualizar esquema de color - Deshabilitada (siempre ORANGE)
  const handleUpdateColorScheme = async (newColorScheme: ColorScheme) => {
    console.log('⚠️ El cambio de color está deshabilitado. El sistema usa colores ApexuCode fijos.')
    return
  }

  // Función para actualizar idioma
  const handleUpdateLanguage = async (newLanguage: string) => {
    // Actualizar estado local primero (optimistic update)
    setLanguage(newLanguage)
    
    // Si hay sesión, actualizar en la API (pero NO refrescar sesión)
    if (isAuthenticated && user?.id) {
      try {
        await fetch('/api/account/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLanguage })
        })
        console.log('✅ Idioma actualizado en BD:', newLanguage)
      } catch (error) {
        console.error('❌ Error updating language:', error)
        // Revertir en caso de error
        setLanguage(language)
      }
    }
  }

  const contextValue: ThemeContextType = {
    theme,
    colorScheme,
    language,
    updateTheme: handleUpdateTheme,
    updateColorScheme: handleUpdateColorScheme,
    updateLanguage: handleUpdateLanguage,
    isLoading
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook para usar el contexto de tema
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
