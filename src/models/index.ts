// Barrel export para todos los modelos de Mongoose
// Permite importar desde @/models en lugar de rutas específicas

// Modelos de usuarios y autenticación
export { default as User } from './User'
export type { IUser } from './User'
export { UserRole, ThemeMode, ColorScheme } from './User'
export type { UserPreferences } from './User'

// Modelos de inventario
export { default as Supplier } from './Supplier'
export type { ISupplier } from './Supplier'

export { default as Flight } from './Flight'
export type { IFlight } from './Flight'

export { default as Hotel } from './Hotel'
export type { IHotel } from './Hotel'

export { default as Transport } from './Transport'
export type { ITransport } from './Transport'

export { default as Package } from './Package'
export type { IPackage } from './Package'

// Modelos de inventario (legacy - mantener por compatibilidad si es necesario)
export { default as Inventory } from './Inventory'

// Modelos de inventario específicos por tipo de recurso
export { default as InventoryHotel } from './InventoryHotel'
export { default as InventoryFlight } from './InventoryFlight'
export { default as InventoryTransport } from './InventoryTransport'

// Modelos de ofertas
export { default as OfferPackage } from './OfferPackage'
export type { IOfferPackage } from './OfferPackage'
