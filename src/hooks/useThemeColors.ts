'use client'

import { useTheme } from '@/providers/ThemeProvider'

export function useThemeColors() {
  const { colorScheme } = useTheme()

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'blue':
        return {
          // Gradientes principales
          headerGradient: 'from-blue-600 via-blue-700 to-blue-800',
          cardGradient: 'from-blue-500 to-blue-600',
          lightGradient: 'from-blue-50 to-blue-100',
          
          // Colores sólidos
          primary: 'blue-600',
          primaryLight: 'blue-100',
          primaryDark: 'blue-800',
          
          // Backgrounds
          bgGradient: 'from-slate-50 via-blue-50 to-blue-100',
          cardBg: 'bg-blue-500',
          
          // Borders y acentos
          border: 'border-blue-200',
          accent: 'text-blue-600',
          
          // Chips y badges
          chipColor: 'primary' as const
        }
      
      case 'red':
        return {
          headerGradient: 'from-red-600 via-red-700 to-red-800',
          cardGradient: 'from-red-500 to-red-600',
          lightGradient: 'from-red-50 to-red-100',
          
          primary: 'red-600',
          primaryLight: 'red-100',
          primaryDark: 'red-800',
          
          bgGradient: 'from-slate-50 via-red-50 to-red-100',
          cardBg: 'bg-red-500',
          
          border: 'border-red-200',
          accent: 'text-red-600',
          
          chipColor: 'danger' as const
        }
      
      case 'green':
        return {
          headerGradient: 'from-emerald-600 via-emerald-700 to-emerald-800',
          cardGradient: 'from-emerald-500 to-emerald-600',
          lightGradient: 'from-emerald-50 to-emerald-100',
          
          primary: 'emerald-600',
          primaryLight: 'emerald-100',
          primaryDark: 'emerald-800',
          
          bgGradient: 'from-slate-50 via-emerald-50 to-emerald-100',
          cardBg: 'bg-emerald-500',
          
          border: 'border-emerald-200',
          accent: 'text-emerald-600',
          
          chipColor: 'success' as const
        }
      
      case 'purple':
        return {
          headerGradient: 'from-purple-600 via-purple-700 to-purple-800',
          cardGradient: 'from-purple-500 to-purple-600',
          lightGradient: 'from-purple-50 to-purple-100',
          
          primary: 'purple-600',
          primaryLight: 'purple-100',
          primaryDark: 'purple-800',
          
          bgGradient: 'from-slate-50 via-purple-50 to-purple-100',
          cardBg: 'bg-purple-500',
          
          border: 'border-purple-200',
          accent: 'text-purple-600',
          
          chipColor: 'secondary' as const
        }
      
      default:
        return {
          headerGradient: 'from-blue-600 via-blue-700 to-blue-800',
          cardGradient: 'from-blue-500 to-blue-600',
          lightGradient: 'from-blue-50 to-blue-100',
          
          primary: 'blue-600',
          primaryLight: 'blue-100',
          primaryDark: 'blue-800',
          
          bgGradient: 'from-slate-50 via-blue-50 to-blue-100',
          cardBg: 'bg-blue-500',
          
          border: 'border-blue-200',
          accent: 'text-blue-600',
          
          chipColor: 'primary' as const
        }
    }
  }

  return getColorClasses()
}
