# Checklist de Migración de API

## ✅ Completados

### `/api/resources/suppliers/`
- ✅ `route.ts` (GET list, POST create)
- ✅ `[id]/route.ts` (GET, PUT, DELETE)

### `/api/resources/hotels/`
- ✅ `[id]/route.ts` (GET por ID) - Ya existe

## 📋 Por Crear/Migrar

### `/api/resources/` (Catálogo base SIN precios)

#### `hotels/`
- [ ] `route.ts` - GET (list), POST (create)
  - Fuente: Crear nuevo basado en modelo Hotel
  - Nota: Ya existe `[id]/route.ts`

#### `flights/`
- [ ] `route.ts` - GET (list), POST (create)
  - Fuente: Crear nuevo basado en modelo Flight
- [ ] `[id]/route.ts` - GET, PUT, DELETE
  - Fuente: Crear nuevo

#### `transports/`
- [ ] `route.ts` - GET (list), POST (create)
  - Fuente: Crear nuevo basado en modelo Transport
- [ ] `[id]/route.ts` - GET, PUT, DELETE
  - Fuente: Crear nuevo

#### `activities/`
- [ ] `route.ts` - GET (list), POST (create)
  - Fuente: Crear nuevo basado en modelo Activity
- [ ] `[id]/route.ts` - GET, PUT, DELETE
  - Fuente: Crear nuevo

---

### `/api/inventory/` (Precios por proveedor/temporada)

#### Mantener (ya existen):
- ✅ `hotels/route.ts` + `hotels/[id]/route.ts`
- ✅ `flights/route.ts` + `flights/[id]/route.ts`
- ✅ `transports/route.ts` + `transports/[id]/route.ts`

#### Eliminar (después de confirmar):
- ❌ `packages/` - Los packages NO van en inventory
- ❌ `suppliers/` - Ya movido a resources

#### Crear:
- [ ] `activities/route.ts` - GET (list), POST (create)
- [ ] `activities/[id]/route.ts` - GET, PUT, DELETE

---

### `/api/offers/` (Lo que ve el público)

#### Mantener (ya existen):
- ✅ `hotels/route.ts` + `hotels/[id]/route.ts`
- ✅ `packages/route.ts` + `packages/[id]/route.ts`

#### Crear:
- [ ] `flights/route.ts` - GET (list), POST (create)
- [ ] `flights/[id]/route.ts` - GET, PUT, DELETE
- [ ] `transports/route.ts` - GET (list), POST (create)
- [ ] `transports/[id]/route.ts` - GET, PUT, DELETE
- [ ] `activities/route.ts` - GET (list), POST (create)
- [ ] `activities/[id]/route.ts` - GET, PUT, DELETE

---

### `/api/public/` (API pública para usuarios finales)

#### Reorganizar en:

**`search/`** (Búsqueda/filtrado de ofertas)
- [ ] `hotels/route.ts` - GET search hotels
  - Fuente: Migrar de `public/hotels/route.ts`
- [ ] `flights/route.ts` - GET search flights
  - Fuente: Migrar de `public/flights/route.ts`
- [ ] `packages/route.ts` - GET search packages
  - Fuente: Migrar de `public/packages/route.ts`
- [ ] `activities/route.ts` - GET search activities
  - Fuente: Crear nuevo

**`booking/`** (Detalle + preparación de reserva)
- [ ] `hotels/[slug]/route.ts` - GET hotel detail
  - Fuente: Migrar de `public/hotels/[slug]/route.ts`
- [ ] `flights/[id]/route.ts` - GET flight detail
  - Fuente: Crear nuevo
- [ ] `packages/[id]/route.ts` - GET package detail
  - Fuente: Migrar de `public/packages/[id]/route.ts`
- [ ] `activities/[id]/route.ts` - GET activity detail
  - Fuente: Crear nuevo

**`checkout/`** (Confirmación/pago/creación)
- [ ] `route.ts` - POST create booking
  - Fuente: Migrar de `bookings/create/route.ts`

---

## 🔄 Actualizar Frontend (SWR Hooks)

Después de crear los nuevos endpoints, actualizar:

- [ ] `/src/swr/useSuppliers.ts` - Cambiar a `/api/resources/suppliers`
- [ ] Crear `/src/swr/useResources.ts` - Para hotels, flights, transports, activities
- [ ] Actualizar `/src/swr/useInventory.ts` - Verificar rutas
- [ ] Actualizar `/src/swr/useOffers.ts` - Agregar flights, transports, activities
- [ ] Crear `/src/swr/usePublicSearch.ts` - Para búsquedas públicas
- [ ] Crear `/src/swr/usePublicBooking.ts` - Para detalles de booking

---

## 🗑️ Eliminar (Después de confirmar que funciona)

- [ ] `/api/inventory/packages/` - Packages no van en inventory
- [ ] `/api/inventory/suppliers/` - Ya movido a resources
- [ ] `/api/public/hotels/route.ts` - Movido a search/hotels
- [ ] `/api/public/hotels/[slug]/route.ts` - Movido a booking/hotels
- [ ] `/api/public/flights/route.ts` - Movido a search/flights
- [ ] `/api/public/packages/route.ts` - Movido a search/packages
- [ ] `/api/public/packages/[id]/route.ts` - Movido a booking/packages

---

## ⚠️ Notas Importantes

1. **NO eliminar nada hasta confirmar que funciona**
2. **Mantener compatibilidad** - Los endpoints viejos seguirán funcionando
3. **Probar cada endpoint** después de crearlo
4. **Actualizar frontend gradualmente** - Un módulo a la vez
5. **Documentar cambios** en cada archivo migrado

---

## 🎯 Orden de Ejecución Recomendado

1. ✅ Crear `/api/resources/` completo
2. Crear endpoints faltantes en `/api/offers/`
3. Reorganizar `/api/public/` en search/booking/checkout
4. Actualizar SWR hooks del frontend
5. Probar exhaustivamente
6. Eliminar endpoints viejos
