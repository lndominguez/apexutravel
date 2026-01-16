'use client'

import { HeroUIProvider } from '@heroui/react'
import { SessionProvider } from 'next-auth/react'
import { SWRConfig } from 'swr'
import { Toaster } from 'sonner'
import { GlobalLoading } from '@/components/GlobalLoading'
import { ClientThemeProvider } from '@/components/ClientThemeProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { PushNotificationInitializer } from '@/components/notifications/PushNotificationInitializer'
import type { Session } from 'next-auth'

/**
 * Providers principales de la aplicación
 * 
 * - SessionProvider: Maneja la autenticación con NextAuth
 * - SWRConfig: Configuración global para datos (NO para autenticación)
 * - HeroUIProvider: Componentes de UI
 * - ClientThemeProvider: Temas y preferencias visuales
 */
export function Providers({ children, session }: { 
  children: React.ReactNode
  session?: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <SWRConfig
        value={{
          // Configuración para datos de la aplicación (inventario, usuarios, etc.)
          // NO para autenticación (eso lo maneja NextAuth)
          revalidateOnFocus: true,
          revalidateOnReconnect: true,
          dedupingInterval: 2000,
          errorRetryCount: 3,
          errorRetryInterval: 5000,
          
          // Fetcher por defecto
          fetcher: async (url: string) => {
            const res = await fetch(url)
            if (!res.ok) {
              const error: any = new Error('Error en la petición')
              error.status = res.status
              throw error
            }
            return res.json()
          },
          
          // Callback global para errores
          onError: (error) => {
            console.error('🚨 SWR Error:', error)
            
            // Si es error 401, la sesión expiró
            if (error.status === 401) {
              console.warn('⚠️ Sesión expirada - redirigiendo a login')
              window.location.href = '/auth/signin'
            }
          }
        }}
      >
        <HeroUIProvider>
          <ClientThemeProvider>
            <ThemeProvider>
              <GlobalLoading>
                <Toaster position="top-right" offset={72} richColors closeButton />
                <PushNotificationInitializer />
                {children}
              </GlobalLoading>
            </ThemeProvider>
          </ClientThemeProvider>
        </HeroUIProvider>
      </SWRConfig>
    </SessionProvider>
  )
}