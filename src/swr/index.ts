// Barrel export para todos los hooks SWR
// Permite importar desde @/swr en lugar de rutas específicas

// Hooks SWR
export { useCurrentUser } from './useCurrentUser' // Restaurado para tiempo real
export { useAdminUsers } from './useAdminUsers'
export { useDashboardStats } from './useDashboardStats'

// Hooks de inventario
export { useSuppliers, useSupplier } from '@/swr/useSuppliers'
export { useFlights, useFlight } from '@/swr/useFlights'
export { useHotels, useHotel } from '@/swr/useHotels'
export { useTransports, useTransport } from '@/swr/useTransports'
export { useInventory, useInventoryItem, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/swr/useInventory'
export type { InventoryItem, InventoryFilters } from '@/swr/useInventory'
export { useOfferPackages, useOfferPackage } from '@/swr/useOfferPackages'
export { useOfferHotels, useOfferHotel } from '@/swr/useOfferHotels'

// Tipos compartidos
export type {
  User,
  UserPreferences,
  UserFilters,
  Pagination,
  DashboardStats,
  AdminUsersResponse,
  SWRError
} from './types'

// Configuraciones SWR
export { SWR_CONFIG } from './types'

// Re-export de utilidades comunes
export { mutate } from 'swr'
