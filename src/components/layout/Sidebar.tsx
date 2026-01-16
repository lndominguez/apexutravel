'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import {
  LayoutDashboard,
  Users,
  User,
  Settings,
  Shield,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Package,
  Plane,
  Hotel,
  Car,
  MapPin,
  Search,
  Bell,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  Home,
  Boxes,
  Luggage
} from 'lucide-react'
import { Button, Input, Badge } from '@heroui/react'
import { Logo } from '@/components/common/Logo'

// Tipos para navegación
interface NavigationItem {
  name: string
  href: string
  icon: any
  current: boolean
  badge: null | string | number
  description: string
  requiresPermission?: 'admin' | 'manager' | 'agent'
  subItems?: NavigationItem[]
}

interface NavigationSection {
  name: string
  items: NavigationItem[]
}

// Navegación organizada por secciones
const navigationSections: NavigationSection[] = [
  {
    name: 'Principal',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        current: false,
        badge: null,
        description: 'Panel principal de control'
      },
      {
        name: 'Recursos',
        href: '/resources',
        icon: Boxes,
        current: false,
        badge: null,
        description: 'Catálogo base sin precios',
        subItems: [
          {
            name: 'Vuelos',
            href: '/resources/flights',
            icon: Plane,
            current: false,
            badge: null,
            description: 'Catálogo de vuelos (sin precios)'
          },
          {
            name: 'Hoteles',
            href: '/resources/hotels',
            icon: Hotel,
            current: false,
            badge: null,
            description: 'Catálogo de hoteles (sin precios)'
          },
          {
            name: 'Transportes',
            href: '/resources/transports',
            icon: Car,
            current: false,
            badge: null,
            description: 'Catálogo de transportes (sin precios)'
          },
          {
            name: 'Proveedores',
            href: '/resources/suppliers',
            icon: MapPin,
            current: false,
            badge: null,
            description: 'Gestión de proveedores'
          }
        ]
      },
      {
        name: 'Inventario',
        href: '/inventory',
        icon: Package,
        current: false,
        badge: null,
        description: 'Precios por proveedor/temporada'
      },
      {
        name: 'Offers',
        href: '/offers',
        icon: Luggage,
        current: false,
        badge: null,
        description: 'Gestión de ofertas públicas'
      }
    ]
  },
  {
    name: 'Ventas',
    items: [
      {
        name: 'Reservas',
        href: '/admin/bookings',
        icon: Search,
        current: false,
        badge: null,
        description: 'Gestión de reservas y ventas'
      }
    ]
  },
  {
    name: 'Administración',
    items: [
      {
        name: 'Usuarios',
        href: '/admin/users',
        icon: Users,
        current: false,
        badge: null,
        description: 'Gestión de usuarios',
        requiresPermission: 'admin'
      },
      {
        name: 'Notificaciones',
        href: '/admin/notifications',
        icon: Bell,
        current: false,
        badge: null,
        description: 'Panel de notificaciones',
        requiresPermission: 'admin'
      },
      {
        name: 'Roles y Permisos',
        href: '/admin/roles',
        icon: Shield,
        current: false,
        badge: null,
        description: 'Administrar roles de usuario',
        requiresPermission: 'admin'
      }
    ]
  },
  {
    name: 'Mi Cuenta',
    items: [
      {
        name: 'Mi Perfil',
        href: '/account/profile',
        icon: User,
        current: false,
        badge: null,
        description: 'Mi información personal'
      },
      {
        name: 'Preferencias',
        href: '/account/preferences',
        icon: Settings,
        current: false,
        badge: null,
        description: 'Configuración personal'
      }
    ]
  }
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth() // ✅ Datos en tiempo real
  const { canAccessAdmin, hasPermission } = usePermissions()
  const [expandedItems, setExpandedItems] = useState<string[]>([]) // Se auto-expande según ruta

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  // Auto-expandir menús según la ruta actual
  useEffect(() => {
    const itemsToExpand: string[] = []

    navigationSections.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some(subItem =>
            pathname === subItem.href || pathname.startsWith(subItem.href + '/')
          )
          if (hasActiveSubItem) {
            itemsToExpand.push(item.name)
          }
        }
      })
    })

    setExpandedItems(itemsToExpand)
  }, [pathname])

  // Filtrar y procesar secciones de navegación
  const processedSections = navigationSections.map(section => ({
    ...section,
    items: section.items
      .filter(item => {
        // Filtrar por permisos
        if (item.requiresPermission === 'admin') {
          return canAccessAdmin
        }
        if (item.href.startsWith('/inventory') || item.href.startsWith('/resources') ||
          item.href.startsWith('/packages') || item.href.startsWith('/offers')) {
          return hasPermission('INVENTORY', 'VIEW')
        }
        // Otras rutas siempre visibles
        return true
      })
      .map(item => {
        // Determinar si el item está activo
        let isCurrentItem = false

        // Si tiene subitems, marcar padre activo si algún subitem está activo
        if (item.subItems) {
          // Verificar coincidencia exacta con el padre
          isCurrentItem = pathname === item.href

          // O si algún subitem está activo
          if (!isCurrentItem) {
            isCurrentItem = item.subItems.some(subItem =>
              pathname === subItem.href || pathname.startsWith(subItem.href + '/')
            )
          }
        } else {
          // Para items sin subitems, usar coincidencia exacta o startsWith
          isCurrentItem = pathname === item.href || pathname.startsWith(item.href + '/')
        }

        return {
          ...item,
          current: isCurrentItem
        }
      })
  })).filter(section => section.items.length > 0) // Solo mostrar secciones con elementos

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-all duration-300 ease-in-out
        lg:relative lg:translate-x-0 flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center">
              <Logo size="sm" variant="default" showText={!isCollapsed} />
            </div>
            <div className="flex items-center gap-1">
              {!isCollapsed && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="lg:hidden"
                  onPress={onClose}
                >
                  <X size={16} />
                </Button>
              )}
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="hidden lg:flex"
                onPress={onToggleCollapse}
              >
                <Menu size={16} />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-4 px-3 pb-4 overflow-y-auto">
            {processedSections.map((section) => (
              <div key={section.name}>
                {/* Section Header */}
                {!isCollapsed && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.name}
                    </h3>
                  </div>
                )}

                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.name}>
                      {/* Main Item */}
                      <button
                        onClick={() => {
                          if (item.subItems && !isCollapsed) {
                            toggleExpanded(item.name)
                          } else {
                            router.push(item.href)
                          }
                        }}
                        className={`
                          w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors
                          ${item.current
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }
                          ${isCollapsed ? 'justify-center' : ''}
                        `}
                        title={isCollapsed ? item.name : item.description}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                          <item.icon size={18} />
                          {!isCollapsed && <span>{item.name}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isCollapsed && item.badge && (
                            <Badge size="sm" variant={item.current ? "solid" : "flat"}>
                              {item.badge}
                            </Badge>
                          )}
                          {!isCollapsed && item.subItems && (
                            expandedItems.includes(item.name) ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </button>

                      {/* Sub Items */}
                      {!isCollapsed && item.subItems && expandedItems.includes(item.name) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.subItems.map((subItem) => (
                            <button
                              key={subItem.name}
                              onClick={() => router.push(subItem.href)}
                              className={`
                                w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                                ${pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }
                              `}
                              title={subItem.description}
                            >
                              <subItem.icon size={16} />
                              <span>{subItem.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Separator between sections */}
                {!isCollapsed && section !== processedSections[processedSections.length - 1] && (
                  <div className="my-4 border-t border-border/50" />
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
