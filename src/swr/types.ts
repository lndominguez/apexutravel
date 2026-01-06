// Tipos compartidos para hooks SWR

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'super_admin' | 'admin' | 'manager' | 'agent' | 'viewer'
  phone?: string
  avatar?: string
  department?: string
  position?: string
  commissionRate?: number
  preferences?: UserPreferences
  isActive: boolean
  isEmailVerified: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark'
  colorScheme: 'blue' | 'red' | 'green' | 'purple'
  language: string
}

export interface UserFilters {
  page?: number
  limit?: number
  search?: string
  role?: string
  department?: string
  isActive?: boolean
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface DashboardStats {
  // Financieros
  totalRevenue: number
  monthlyRevenue: number
  dailyRevenue: number
  totalExpenses: number
  monthlyProfit: number
  
  // Contratos
  totalContracts: number
  contractsThisMonth: number
  
  // Usuarios
  activeUsers: number
  newUsersThisMonth: number
  
  // Comisiones
  pendingCommissions: number
  paidCommissions: number
  commissionRate: number
  
  // Email
  emailsSent: number
  emailOpenRate: number
  emailCampaigns: number
}

export interface AdminUsersResponse {
  data: User[]
  pagination: Pagination
}

export interface SWRError {
  status?: number
  message: string
}

// Configuraciones SWR comunes
export const SWR_CONFIG = {
  // Para datos críticos de usuario (seguridad)
  CRITICAL: {
    refreshInterval: 30000, // 30 segundos
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    dedupingInterval: 5000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  },
  
  // Para datos administrativos
  ADMIN: {
    refreshInterval: 60000, // 1 minuto
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    dedupingInterval: 10000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  },
  
  // Para estadísticas y dashboards
  STATS: {
    refreshInterval: 120000, // 2 minutos
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    dedupingInterval: 30000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  }
} as const
