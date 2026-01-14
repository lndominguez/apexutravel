# Plan de Reorganización del Frontend

## 📊 Estructura Actual del Frontend

```
src/app/
├── resources/          # Catálogo base
│   ├── flights/page.tsx
│   ├── hotels/page.tsx
│   ├── suppliers/page.tsx
│   └── transports/page.tsx
│
├── inventory/          # Lista unificada de inventario
│   └── page.tsx        # Lista con TODOS los tipos (modal para crear)
│
├── offers/             # Ofertas públicas
│   ├── dashboard/page.tsx
│   ├── hotels/page.tsx
│   ├── packages/page.tsx (con [id])
│   └── flights/        # Vacío
│
├── hotels/             # Página pública de detalle
│   └── [slug]/page.tsx
│
├── packages/           # Página pública de detalle
│   └── [id]/page.tsx
│
├── booking/            # Preparación de reserva
│   └── flights/page.tsx
│
├── checkout/           # Confirmación de pago
│   └── page.tsx
│
└── search/             # Búsqueda pública
    ├── flights/page.tsx
    ├── hotels/page.tsx
    └── packages/page.tsx
```

---

## 🎯 Nueva Estructura Propuesta

```
src/app/
├── resources/          # ✅ Catálogo base (MANTENER estructura)
│   ├── hotels/page.tsx
│   ├── flights/page.tsx
│   ├── transports/page.tsx
│   ├── activities/page.tsx      # 🆕 CREAR
│   └── suppliers/page.tsx
│
├── inventory/          # ✅ Lista unificada (MANTENER como está)
│   └── page.tsx        # Lista con TODOS los tipos + modal para crear
│
├── offers/             # ✅ Ofertas (REORGANIZAR)
│   ├── dashboard/page.tsx       # Dashboard general de ofertas
│   ├── hotels/page.tsx
│   ├── flights/page.tsx         # 🆕 CREAR
│   ├── transports/page.tsx      # 🆕 CREAR
│   ├── activities/page.tsx      # 🆕 CREAR
│   └── packages/
│       ├── page.tsx             # Lista
│       └── [id]/page.tsx        # Detalle/edición
│
└── (public)/           # Páginas públicas (REORGANIZAR)
    ├── search/         # Búsqueda pública
    │   ├── page.tsx             # Landing/búsqueda general
    │   ├── hotels/page.tsx
    │   ├── flights/page.tsx
    │   ├── packages/page.tsx
    │   └── activities/page.tsx  # 🆕 CREAR
    │
    ├── hotels/         # Detalle de hotel
    │   └── [slug]/page.tsx
    │
    ├── packages/       # Detalle de paquete
    │   └── [id]/page.tsx
    │
    ├── flights/        # 🆕 Detalle de vuelo
    │   └── [id]/page.tsx
    │
    ├── activities/     # 🆕 Detalle de actividad
    │   └── [id]/page.tsx
    │
    ├── booking/        # Preparación de reserva (REORGANIZAR)
    │   ├── hotels/[slug]/page.tsx
    │   ├── flights/[id]/page.tsx
    │   ├── packages/[id]/page.tsx
    │   └── activities/[id]/page.tsx
    │
    └── checkout/       # Confirmación de pago
        └── page.tsx
```

---

## 🔄 Acciones a Realizar

### Fase 1: Crear Páginas Faltantes

#### Resources (1 página nueva)
- [ ] `src/app/resources/activities/page.tsx`

#### Offers (3 páginas nuevas)
- [ ] `src/app/offers/flights/page.tsx`
- [ ] `src/app/offers/transports/page.tsx`
- [ ] `src/app/offers/activities/page.tsx`

#### Public - Search (1 página nueva)
- [ ] `src/app/search/activities/page.tsx`

#### Public - Detail (2 páginas nuevas)
- [ ] `src/app/flights/[id]/page.tsx`
- [ ] `src/app/activities/[id]/page.tsx`

#### Public - Booking (4 páginas - reorganizar)
- [ ] Mover `src/app/booking/flights/page.tsx` → `src/app/booking/flights/[id]/page.tsx`
- [ ] Crear `src/app/booking/hotels/[slug]/page.tsx`
- [ ] Crear `src/app/booking/packages/[id]/page.tsx`
- [ ] Crear `src/app/booking/activities/[id]/page.tsx`

---

### Fase 2: Actualizar Rutas de API en Componentes Existentes

#### Componentes Públicos
- [ ] `src/app/hotels/[slug]/page.tsx` → Cambiar a `/api/public/booking/hotels/[slug]`
- [ ] `src/app/packages/[id]/page.tsx` → Cambiar a `/api/public/booking/packages/[id]`
- [ ] `src/app/search/hotels/page.tsx` → Cambiar a `/api/public/search/hotels`
- [ ] `src/app/search/flights/page.tsx` → Cambiar a `/api/public/search/flights`
- [ ] `src/app/search/packages/page.tsx` → Cambiar a `/api/public/search/packages`
- [ ] `src/components/public/FeaturedHotels.tsx` → Cambiar a `/api/public/search/hotels`

#### Componentes de Checkout
- [ ] `src/app/checkout/page.tsx` → Cambiar a `/api/public/checkout`

#### Componentes de Resources
- [ ] `src/app/resources/suppliers/page.tsx` → Ya usa `/api/resources/suppliers` ✅

---

### Fase 3: Actualizar SWR Hooks

- [x] `src/swr/useSuppliers.ts` → Ya actualizado ✅
- [ ] `src/swr/useOfferHotels.ts` → Verificar rutas
- [ ] `src/swr/useOfferPackages.ts` → Verificar rutas
- [ ] Crear `src/swr/usePublicSearch.ts` → Para búsquedas públicas
- [ ] Crear `src/swr/usePublicBooking.ts` → Para detalles de booking

---

## 📝 Notas Importantes

### Inventory
- ✅ **MANTENER como está** - Una sola página con lista unificada
- ✅ Modal para crear según tipo de inventario
- ✅ NO necesita subcarpetas por tipo

### Offers
- ✅ Cada tipo de oferta tiene su propia página de lista
- ✅ Modal para crear/editar ofertas
- ✅ Packages tiene subcarpeta [id] para detalle/edición

### Public (Search/Booking)
- ✅ Search = Búsqueda/filtrado de ofertas
- ✅ Booking = Detalle + preparación de reserva
- ✅ Checkout = Confirmación/pago

### Resources
- ✅ Cada tipo de recurso tiene su propia página
- ✅ Modal para crear/editar recursos

---

## 🎯 Prioridades

1. **ALTA** - Actualizar rutas de API en componentes existentes
2. **ALTA** - Crear páginas faltantes de offers (flights, transports, activities)
3. **MEDIA** - Crear páginas públicas de detalle (flights, activities)
4. **MEDIA** - Reorganizar booking con estructura correcta
5. **BAJA** - Crear página de activities en resources

---

## ✅ Resultado Final

Estructura del frontend alineada con la API:
- Resources → `/api/resources/`
- Inventory → `/api/inventory/` (unificado)
- Offers → `/api/offers/`
- Public Search → `/api/public/search/`
- Public Booking → `/api/public/booking/`
- Checkout → `/api/public/checkout/`
