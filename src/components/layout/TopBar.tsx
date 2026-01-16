'use client'

import { 
  Settings, 
  LogOut,
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
import { NotificationCenter } from '@/components/notifications'


interface TopBarProps {
  onMenuClick: () => void
  isCollapsed: boolean
}

export function TopBar({ onMenuClick, isCollapsed }: TopBarProps) {
  const { user } = useCurrentUser() // ✅ Datos en tiempo real
  const {
    theme,
    updateTheme
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
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 px-4 lg:px-6">
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

          {/* Notifications */}
          <NotificationCenter />

          {/* User info */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>

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
