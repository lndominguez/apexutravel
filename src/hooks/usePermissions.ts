import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/models/User'

// Definir permisos por módulo
export const PERMISSIONS = {
  // Gestión de usuarios
  USERS: {
    VIEW: ['super_admin', 'admin', 'manager'],
    CREATE: ['super_admin', 'admin'],
    EDIT: ['super_admin', 'admin'],
    DELETE: ['super_admin', 'admin'],
    MANAGE_ROLES: ['super_admin', 'admin']
  },
  
  // Gestión de inventario
  INVENTORY: {
    VIEW: ['super_admin', 'admin', 'manager', 'agent'],
    CREATE: ['super_admin', 'admin', 'manager'],
    EDIT: ['super_admin', 'admin', 'manager'],
    DELETE: ['super_admin', 'admin'],
    PUBLISH: ['super_admin', 'admin', 'manager']
  },
  
  // Administración del sistema
  ADMIN: {
    ACCESS_ADMIN_PANEL: ['super_admin', 'admin'],
    MANAGE_SYSTEM: ['super_admin'],
    VIEW_LOGS: ['super_admin', 'admin'],
    MANAGE_SETTINGS: ['super_admin', 'admin']
  },
  
  // Reportes y analytics
  REPORTS: {
    VIEW_ALL: ['super_admin', 'admin', 'manager'],
    VIEW_OWN: ['super_admin', 'admin', 'manager', 'agent'],
    EXPORT: ['super_admin', 'admin', 'manager']
  }
} as const

export type PermissionModule = keyof typeof PERMISSIONS
export type PermissionAction<T extends PermissionModule> = keyof typeof PERMISSIONS[T]

export function usePermissions() {
  const { user } = useAuth() // ✅ Datos en tiempo real
  
  const userRole = user?.role
  
  // Verificar si el usuario tiene un permiso específico
  const hasPermission = <T extends PermissionModule>(
    module: T, 
    action: PermissionAction<T>
  ): boolean => {
    if (!userRole) return false
    
    const allowedRoles = PERMISSIONS[module][action] as readonly string[]
    return allowedRoles.includes(userRole)
  }
  
  // Verificar si el usuario tiene cualquiera de los roles especificados
  const hasAnyRole = (roles: string[]): boolean => {
    if (!userRole) return false
    return roles.includes(userRole)
  }
  
  // Verificar si el usuario es admin o super admin
  const isAdmin = (): boolean => {
    return hasAnyRole(['super_admin', 'admin'])
  }
  
  // Verificar si el usuario es super admin
  const isSuperAdmin = (): boolean => {
    return userRole === 'super_admin'
  }
  
  // Obtener nivel de acceso del usuario (0-4, donde 4 es super_admin)
  const getAccessLevel = (): number => {
    switch (userRole) {
      case 'super_admin': return 4
      case 'admin': return 3
      case 'manager': return 2
      case 'agent': return 1
      case 'viewer': return 0
      default: return -1
    }
  }
  
  // Verificar si puede acceder a una ruta específica
  const canAccessRoute = (route: string): boolean => {
    if (!userRole) return false
    
    // Rutas públicas (siempre accesibles)
    const publicRoutes = ['/dashboard', '/account/profile', '/account/preferences']
    if (publicRoutes.includes(route)) return true
    
    // Rutas de administración
    if (route.startsWith('/admin')) {
      return hasPermission('ADMIN', 'ACCESS_ADMIN_PANEL')
    }
    
    // Rutas de usuarios (ahora en admin)
    if (route.startsWith('/admin/users')) {
      return hasPermission('USERS', 'VIEW')
    }
    
    // Rutas de inventario
    if (route.startsWith('/inventory')) {
      return hasPermission('INVENTORY', 'VIEW')
    }
    
    // Por defecto, permitir acceso
    return true
  }
  
  // Obtener rutas disponibles para el usuario
  const getAvailableRoutes = () => {
    const routes = []
    
    // Dashboard siempre disponible
    routes.push('/dashboard')
    
    // Inventario
    if (hasPermission('INVENTORY', 'VIEW')) {
      routes.push('/inventory')
    }
    
    // Usuarios (ahora en admin)
    if (hasPermission('USERS', 'VIEW')) {
      routes.push('/admin/users')
    }
    
    // Administración
    if (hasPermission('ADMIN', 'ACCESS_ADMIN_PANEL')) {
      routes.push('/admin/roles')
    }
    
    // Perfil personal
    routes.push('/account/profile', '/account/preferences')
    
    return routes
  }
  
  return {
    userRole,
    hasPermission,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    getAccessLevel,
    canAccessRoute,
    getAvailableRoutes,
    
    // Permisos específicos comunes
    canManageUsers: hasPermission('USERS', 'MANAGE_ROLES'),
    canCreateInventory: hasPermission('INVENTORY', 'CREATE'),
    canDeleteInventory: hasPermission('INVENTORY', 'DELETE'),
    canAccessAdmin: hasPermission('ADMIN', 'ACCESS_ADMIN_PANEL')
  }
}

// Hook para proteger rutas
export function useRouteProtection<T extends PermissionModule>(
  requiredModule: T, 
  requiredAction: PermissionAction<T>
) {
  const { hasPermission } = usePermissions()
  const { isAuthenticated, isLoading } = useAuth() // ✅ Datos en tiempo real
  
  const hasAccess = hasPermission(requiredModule, requiredAction)
  
  return {
    isLoading,
    isAuthenticated,
    hasAccess,
    shouldRedirect: !isLoading && (!isAuthenticated || !hasAccess)
  }
}
