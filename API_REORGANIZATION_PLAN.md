# Plan de Reorganización de API

## 📊 Estructura Actual (Análisis)

### `/api/inventory/` (ACTUAL)
- `route.ts` - GET/POST general (unificado para todos los tipos)
- `[id]/route.ts` - GET/PUT/DELETE por ID (unificado)
- `flights/route.ts` + `flights/[id]/route.ts`
- `hotels/route.ts` + `hotels/[id]/route.ts`
- `packages/route.ts` + `packages/[id]/route.ts` ❌ (packages NO van en inventory)
- `suppliers/route.ts` + `suppliers/[id]/route.ts` ❌ (suppliers van en resources)
- `transports/route.ts` + `transports/[id]/route.ts`

### `/api/offers/` (ACTUAL)
- `hotels/route.ts` + `hotels/[id]/route.ts`
- `packages/route.ts` + `packages/[id]/route.ts`

### `/api/resources/` (ACTUAL)
- `hotels/[id]/route.ts` (solo GET por ID)

### `/api/public/` (ACTUAL)
- `flights/route.ts`
- `hotels/route.ts` + `hotels/[slug]/route.ts`
- `packages/route.ts` + `packages/[id]/route.ts`

### Otros endpoints relevantes
- `/api/flights/` - search y [id]
- `/api/search/` - flights y packages
- `/api/bookings/` - create y [id]

---

## 🎯 Nueva Estructura (Objetivo)

```
api/
├── resources/          # Catálogo base SIN precios
│   ├── hotels/
│   │   ├── route.ts           # GET (list), POST (create)
│   │   └── [id]/route.ts      # GET, PUT, DELETE
│   ├── flights/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── transports/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── activities/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── suppliers/
│       ├── route.ts
│       └── [id]/route.ts
│
├── inventory/          # Precios por proveedor/temporada
│   ├── hotels/
│   │   ├── route.ts           # GET (list), POST (create)
│   │   └── [id]/route.ts      # GET, PUT, DELETE
│   ├── flights/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── transports/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── activities/
│       ├── route.ts
│       └── [id]/route.ts
│
├── offers/             # Lo que ve el público
│   ├── hotels/
│   │   ├── route.ts           # GET (list), POST (create)
│   │   └── [id]/route.ts      # GET, PUT, DELETE
│   ├── flights/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── transports/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── activities/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── packages/
│       ├── route.ts
│       └── [id]/route.ts
│
└── public/             # API pública para usuarios finales
    ├── search/         # Búsqueda/filtrado de ofertas
    │   ├── hotels/route.ts
    │   ├── flights/route.ts
    │   ├── packages/route.ts
    │   └── activities/route.ts
    ├── booking/        # Detalle + preparación de reserva
    │   ├── hotels/[slug]/route.ts
    │   ├── flights/[id]/route.ts
    │   ├── packages/[id]/route.ts
    │   └── activities/[id]/route.ts
    └── checkout/       # Confirmación/pago/creación
        └── route.ts
```

---

## 📋 Plan de Migración

### Fase 1: Crear nueva estructura (sin romper la actual)
1. ✅ Crear `/api/resources/` completo
2. ✅ Reorganizar `/api/inventory/` por tipo
3. ✅ Reorganizar `/api/offers/` por tipo
4. ✅ Reorganizar `/api/public/` (search, booking, checkout)

### Fase 2: Migrar código
1. Copiar lógica de endpoints actuales a nuevos
2. Mantener endpoints viejos funcionando (compatibilidad)
3. Actualizar frontend para usar nuevos endpoints

### Fase 3: Limpieza (después de probar)
1. Eliminar endpoints viejos
2. Eliminar carpetas vacías

---

## 🔄 Mapeo de Migraciones

### Resources (Catálogo base)
- `inventory/suppliers/*` → `resources/suppliers/*`
- Crear `resources/hotels/*` (completo)
- Crear `resources/flights/*`
- Crear `resources/transports/*`
- Crear `resources/activities/*`

### Inventory (Precios)
- `inventory/hotels/*` → mantener
- `inventory/flights/*` → mantener
- `inventory/transports/*` → mantener
- `inventory/packages/*` → ❌ ELIMINAR (packages no van en inventory)
- Crear `inventory/activities/*`

### Offers (Público)
- `offers/hotels/*` → mantener
- `offers/packages/*` → mantener
- Crear `offers/flights/*`
- Crear `offers/transports/*`
- Crear `offers/activities/*`

### Public (API pública)
- `public/hotels/*` → `public/search/hotels/` + `public/booking/hotels/`
- `public/flights/*` → `public/search/flights/` + `public/booking/flights/`
- `public/packages/*` → `public/search/packages/` + `public/booking/packages/`
- Crear `public/checkout/`

---

## ⚠️ Importante
- NO eliminar nada hasta confirmar que funciona
- Mantener compatibilidad con frontend actual
- Probar cada endpoint después de migrar
- Actualizar SWR hooks en frontend
