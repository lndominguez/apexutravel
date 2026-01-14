# Estado de SWR Hooks - Rutas de API

## ✅ Hooks Correctos (No necesitan cambios)

### Resources (Catálogo base)
- ✅ **useSuppliers.ts** → `/api/resources/suppliers` ✅ CORRECTO

### Inventory (Precios por proveedor/temporada)
- ✅ **useHotels.ts** → `/api/inventory/hotels` ✅ CORRECTO
- ✅ **useFlights.ts** → `/api/inventory/flights` ✅ CORRECTO
- ✅ **useTransports.ts** → `/api/inventory/transports` ✅ CORRECTO
- ✅ **useInventory.ts** → `/api/inventory` ✅ CORRECTO (unificado)

### Offers (Lo que ve el público)
- ✅ **useOfferHotels.ts** → `/api/offers/hotels` ✅ CORRECTO
- ✅ **useOfferPackages.ts** → `/api/offers/packages` ✅ CORRECTO

### Admin
- ✅ **useAdminUsers.ts** → `/api/admin/users` ✅ CORRECTO
- ✅ **useDashboardStats.ts** → `/api/dashboard/stats` ✅ CORRECTO
- ✅ **useCurrentUser.ts** → `/api/account/me` ✅ CORRECTO

---

## ⚠️ Hooks Problemáticos

### usePackages.ts - ❌ OBSOLETO/DUPLICADO
**Ruta actual:** `/api/inventory/packages`  
**Problema:** Packages NO van en inventory según la nueva arquitectura  
**Solución:** Este hook está duplicado con `useOfferPackages.ts`

**Opciones:**
1. **Eliminar `usePackages.ts`** - Ya existe `useOfferPackages.ts` que es correcto
2. **Renombrar a `useResourcePackages.ts`** - Si se necesita para catálogo base de packages (sin precios)

**Recomendación:** Verificar si algún componente usa `usePackages.ts` y migrar a `useOfferPackages.ts`

---

## 📋 Hooks Faltantes (Opcionales)

Si se necesitan en el futuro, crear:

### Resources (Catálogo base)
- [ ] `useResourceHotels.ts` → `/api/resources/hotels` (catálogo de hoteles sin precios)
- [ ] `useResourceFlights.ts` → `/api/resources/flights` (catálogo de vuelos sin precios)
- [ ] `useResourceTransports.ts` → `/api/resources/transports` (catálogo de transportes sin precios)

### Offers
- [ ] `useOfferFlights.ts` → `/api/offers/flights` (ofertas de vuelos)
- [ ] `useOfferTransports.ts` → `/api/offers/transports` (ofertas de transportes)

**Nota:** Actualmente no son necesarios porque:
- Los componentes de resources pueden usar fetch directo
- Los componentes de offers pueden usar SWR inline si es simple

---

## 🔍 Verificación de Componentes

### Componentes que usan usePackages.ts (VERIFICAR)
Buscar en el código qué componentes importan `usePackages` y migrarlos a `useOfferPackages`:

```bash
grep -r "from '@/swr'" src/app src/components | grep usePackages
```

Si ningún componente lo usa, eliminar `usePackages.ts`.

---

## 📊 Resumen

**Total de hooks:** 13  
**Correctos:** 11 ✅  
**Problemáticos:** 1 ⚠️ (usePackages.ts duplicado)  
**Faltantes opcionales:** 5 (no urgentes)

**Acción requerida:**
1. Verificar uso de `usePackages.ts`
2. Migrar componentes a `useOfferPackages.ts`
3. Eliminar `usePackages.ts` si no se usa

---

## ✅ Conclusión

**Todos los SWR hooks principales están correctamente configurados** para usar las nuevas rutas de API organizadas. Solo queda resolver el caso de `usePackages.ts` que está duplicado/obsoleto.
