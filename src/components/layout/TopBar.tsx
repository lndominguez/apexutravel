'use client'

import { 
  Settings, 
  LogOut,
  Palette,
  Moon,
  Sun,
  Menu
} from 'lucide-react'
import { 
  Button, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Avatar
} from '@heroui/react'
import { signOut } from 'next-auth/react'
import { useCurrentUser } from '@/swr/useCurrentUser'
import { useTheme } from '@/providers/ThemeProvider'
import { ThemeMode, ColorScheme } from '@/types/user'
import { Logo } from '@/components/common/Logo'


interface TopBarProps {
  onMenuClick: () => void
  isCollapsed: boolean
}

export function TopBar({ onMenuClick, isCollapsed }: TopBarProps) {
  const { user } = useCurrentUser() // ✅ Datos en tiempo real
  const {
    theme,
    updateTheme,
    colorScheme,
    updateColorScheme
  } = useTheme()

  const handleLogout = async () => {
    // Limpiar localStorage al hacer logout
    localStorage.removeItem('theme')
    localStorage.removeItem('colorScheme')
    localStorage.removeItem('language')
    
    // Hacer logout con NextAuth
    await signOut({ callbackUrl: '/auth/login' })
  }

  const toggleDarkMode = async () => {
    const newTheme = theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK
    await updateTheme(newTheme)
  }

  const changeColorScheme = async (colorScheme: ColorScheme) => {
    await updateColorScheme(colorScheme)
  }

  const colorSchemes = [
    { key: ColorScheme.BLUE, label: 'Azul', color: 'bg-blue-500' },
    { key: ColorScheme.RED, label: 'Rojo', color: 'bg-red-500' },
    { key: ColorScheme.GREEN, label: 'Verde', color: 'bg-green-500' },
    { key: ColorScheme.PURPLE, label: 'Púrpura', color: 'bg-purple-500' }
  ]
  
  return (
    <div className="bg-background border-b border-border">
      <div className="flex items-center justify-between h-16">
        {/* Left section */}
        <div className="flex items-center gap-4 px-4 lg:px-6">
          {/* Mobile menu button */}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="lg:hidden"
            onPress={onMenuClick}
          >
            <Menu size={16} />
          </Button>
          
          {/* Logo */}
          <Logo size="sm" variant="default" showIcon={true} />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 px-4 lg:px-6">
          {/* User info */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>

          {/* Theme Toggle */}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onClick={toggleDarkMode}
            title={theme === ThemeMode.DARK ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === ThemeMode.DARK ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          {/* Color Scheme Selector */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                title="Cambiar esquema de color"
              >
                <Palette size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Esquemas de color">
              {colorSchemes.map((scheme) => (
                <DropdownItem
                  key={scheme.key}
                  startContent={
                    <div className={`w-3 h-3 rounded-full ${scheme.color}`} />
                  }
                  onClick={() => changeColorScheme(scheme.key)}
                  className={colorScheme === scheme.key ? 'bg-primary-50' : ''}
                >
                  {scheme.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* User menu */}
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <Avatar
                  size="sm"
                  name={`${user?.firstName} ${user?.lastName}`}
                  src={user?.avatar}
                  className="w-6 h-6"
                />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem key="profile" href="/profile">
                Mi Perfil
              </DropdownItem>
              <DropdownItem key="settings" href="/settings" startContent={<Settings size={16} />}>
                Configuración
              </DropdownItem>
              <DropdownItem 
                key="logout" 
                onClick={handleLogout}
                className="text-danger"
                startContent={<LogOut size={16} />}
              >
                Cerrar Sesión
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  )
}
