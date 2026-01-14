'use client'

import { ReactNode, useState, useEffect } from 'react'
import { 
  LogOut,
  Moon,
  Sun,
  User as UserIcon,
  LogIn,
  Menu,
  X,
  UserPlus,
  SlidersHorizontal
} from 'lucide-react'
import { 
  Button, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Avatar,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody
} from '@heroui/react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/providers/ThemeProvider'
import { ThemeMode, ColorScheme } from '@/types/user'
import { Logo } from '@/components/common/Logo'

interface SearchLayoutProps {
  children: ReactNode
  moduleTitle: string
  moduleIcon: ReactNode
  moduleDescription?: string
  searchPanel?: ReactNode
}

export function SearchLayout({ children, moduleTitle, moduleIcon, moduleDescription, searchPanel }: SearchLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchPanelOpen, setSearchPanelOpen] = useState(false)
  const {
    theme,
    updateTheme
  } = useTheme()

  const handleLogout = async () => {
    localStorage.removeItem('theme')
    localStorage.removeItem('colorScheme')
    localStorage.removeItem('language')
    await signOut({ callbackUrl: '/auth/login' })
  }

  const toggleDarkMode = async () => {
    const newTheme = theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK
    await updateTheme(newTheme)
  }

  // Cerrar menú mobile cuando se cambia a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640 && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileMenuOpen])

  return (
    <div className="min-h-screen bg-background">
      {/* TopBar */}
      <div className="bg-background sticky top-0 z-50 shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left section - Logo */}
            <div className="cursor-pointer" onClick={() => router.push('/')}>
              <Logo size="sm" variant="default" showText={true} />
            </div>

            {/* Right section - User actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Menu Button - Solo visible en mobile */}
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="sm:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>

              {/* Desktop Controls - Ocultos en mobile */}
              <div className="hidden sm:flex items-center gap-3">
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

                {/* User section */}
                {session?.user ? (
                  <>
                    {/* User info (desktop) */}
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-sm font-medium text-foreground">
                        {session.user.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {session.user.email}
                      </span>
                    </div>

                    {/* User menu */}
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <Avatar
                            size="sm"
                            name={session.user.name || undefined}
                            src={session.user.image || undefined}
                            className="w-6 h-6"
                          />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="User menu">
                        <DropdownItem 
                          key="dashboard" 
                          onClick={() => router.push('/dashboard')}
                          startContent={<UserIcon size={16} />}
                        >
                          Dashboard
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
                  </>
                ) : (
                  <>
                    {/* Botones cuando NO está logueado */}
                    <Button
                      size="sm"
                      variant="light"
                      onClick={() => router.push('/auth/login')}
                    >
                      Iniciar Sesión
                    </Button>
                    <Button
                      size="sm"
                      color="primary"
                      className="font-semibold"
                      onClick={() => router.push('/auth/register')}
                    >
                      Registrarse
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Solo visible cuando está abierto */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border bg-background">
            <div className="px-4 py-3 space-y-3">
              {/* Theme Toggle Mobile */}
              <button
                onClick={() => {
                  toggleDarkMode()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {theme === ThemeMode.DARK ? <Sun size={18} /> : <Moon size={18} />}
                <span className="text-sm font-medium">
                  {theme === ThemeMode.DARK ? 'Modo Claro' : 'Modo Oscuro'}
                </span>
              </button>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* User Actions Mobile */}
              {session?.user ? (
                <>
                  {/* User Info */}
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>

                  {/* Dashboard */}
                  <button
                    onClick={() => {
                      router.push('/dashboard')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <UserIcon size={18} />
                    <span className="text-sm font-medium">Dashboard</span>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-danger/10 text-danger transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Login */}
                  <button
                    onClick={() => {
                      router.push('/auth/login')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <LogIn size={18} />
                    <span className="text-sm font-medium">Iniciar Sesión</span>
                  </button>

                  {/* Register */}
                  <button
                    onClick={() => {
                      router.push('/auth/register')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <UserPlus size={18} />
                    <span className="text-sm font-medium">Registrarse</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Línea de color primario */}
        <div className="h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
      </div>

      {/* Franja de información del módulo */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50">
        <div className="w-full px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto py-4 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Icono del módulo */}
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              {moduleIcon}
            </div>
            
            {/* Información del módulo */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                {moduleTitle}
              </h1>
              {moduleDescription && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                  {moduleDescription}
                </p>
              )}
            </div>

            {/* Botón de filtros/búsqueda (solo mobile si hay searchPanel) */}
            {searchPanel && (
              <Button
                isIconOnly
                size="sm"
                variant="bordered"
                className="lg:hidden"
                onClick={() => setSearchPanelOpen(!searchPanelOpen)}
              >
                <SlidersHorizontal size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content con sidebar */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex w-full">
          {/* Sidebar de búsqueda - Desktop */}
          {searchPanel && (
            <aside className="hidden lg:block w-72 xl:w-80 overflow-y-auto sticky top-[calc(3.5rem+1px)] h-[calc(100vh-3.5rem-1px)] border-r border-divider">
              <div className="p-6">
                {searchPanel}
              </div>
            </aside>
          )}

          {/* Contenido principal */}
          <main className="flex-1 min-w-0 px-3 sm:px-4 lg:px-6">
            {children}
          </main>
        </div>
      </div>

        {/* Drawer de búsqueda - Mobile */}
        {searchPanel && (
          <Drawer 
            isOpen={searchPanelOpen} 
            onOpenChange={setSearchPanelOpen}
            placement="right"
            size="sm"
            backdrop='blur'
          >
            <DrawerContent>
              {(onClose) => (
                <>
                   <DrawerHeader className="flex flex-col gap-1 border-b border-divider">Filtrar busqueda</DrawerHeader>
                  <DrawerBody className="pb-8">
                    {searchPanel}
                  </DrawerBody>
                </>
              )}
            </DrawerContent>
          </Drawer>
        )}
    </div>
  )
}
