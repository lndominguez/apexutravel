# Organización de Rutas Públicas

## 📊 Arquitectura de API Pública

```
/api/public/
├── search/         # Búsqueda/filtrado de ofertas
│   ├── hotels/
│   ├── flights/
│   └── packages/
├── booking/        # Detalle + preparación de reserva
│   ├── hotels/[slug]/
│   ├── flights/[id]/
│   └── packages/[id]/
└── checkout/       # Confirmación/pago/creación
    └── POST
```

---

## 🔍 SEARCH - Búsqueda y Filtrado

### Propósito
Listar y filtrar ofertas disponibles para el público.

### Endpoints

#### `GET /api/public/search/hotels`
**Parámetros:**
- `limit` - Cantidad de resultados (default: 50)
- `city` - Filtrar por ciudad
- `status` - Estado (default: 'published')
- `minPrice` - Precio mínimo
- `maxPrice` - Precio máximo

**Respuesta:**
```json
{
  "success": true,
  "hotels": [...],
  "total": 10
}
```

**Componentes que lo usan:**
- ✅ `src/app/search/hotels/page.tsx`
- ✅ `src/components/public/FeaturedHotels.tsx`

---

#### `GET /api/public/search/flights`
**Parámetros:**
- `limit` - Cantidad de resultados (default: 50)
- `origin` - Origen del vuelo
- `destination` - Destino del vuelo
- `status` - Estado (default: 'published')

**Respuesta:**
```json
{
  "success": true,
  "flights": [...],
  "total": 5
}
```

**Componentes que lo usan:**
- ⏳ Pendiente crear página de búsqueda de vuelos

---

#### `GET /api/public/search/packages`
**Parámetros:**
- `limit` - Cantidad de resultados (default: 50)
- `destination` - Filtrar por destino
- `status` - Estado (default: 'published')
- `minPrice` - Precio mínimo
- `maxPrice` - Precio máximo

**Respuesta:**
```json
{
  "success": true,
  "packages": [...],
  "total": 8
}
```

**Componentes que lo usan:**
- ✅ `src/app/search/packages/page.tsx`

---

## 📋 BOOKING - Detalle y Preparación

### Propósito
Mostrar detalles completos de una oferta específica para preparar la reserva.

### Endpoints

#### `GET /api/public/booking/hotels/[slug]`
**Parámetros:**
- `slug` - Slug o ID del hotel

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Hotel Paradise",
    "items": [{
      "hotelInfo": {
        "photos": [...],
        "location": {...}
      },
      "selectedRooms": [{
        "images": [...],
        "pricing": {...}
      }]
    }]
  }
}
```

**Componentes que lo usan:**
- ✅ `src/app/hotels/[slug]/page.tsx`

**Características:**
- ✅ Populate profundo de inventoryId.resource
- ✅ Enriquece selectedRooms con imágenes de roomTypes
- ✅ Agrega fotos del hotel si no existen

---

#### `GET /api/public/booking/flights/[id]`
**Parámetros:**
- `id` - ID del vuelo

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Vuelo a Cancún",
    "items": [...]
  }
}
```

**Componentes que lo usan:**
- ⏳ Pendiente crear página de detalle de vuelo

---

#### `GET /api/public/booking/packages/[id]`
**Parámetros:**
- `id` - ID del paquete

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Paquete Caribe",
    "items": [...]
  }
}
```

**Componentes que lo usan:**
- ✅ `src/app/packages/[id]/page.tsx`
- ✅ `src/app/checkout/page.tsx` (para cargar datos)

---

## 💳 CHECKOUT - Confirmación y Pago

### Propósito
Crear la reserva final después de la confirmación del usuario.

### Endpoint

#### `POST /api/public/checkout`
**Body:**
```json
{
  "type": "package|flight|hotel",
  "itemId": "...",
  "passengers": [...],
  "contactInfo": {...},
  "pricing": {...},
  "startDate": "2024-01-15",
  "paymentMethod": "pending"
}
```

**Respuesta:**
```json
{
  "success": true,
  "bookingId": "...",
  "bookingNumber": "BK1234567890",
  "message": "Reserva creada exitosamente"
}
```

**Componentes que lo usan:**
- ✅ `src/app/checkout/page.tsx`

---

## 📁 Estructura del Frontend

```
src/app/
├── search/                 # Páginas de búsqueda pública
│   ├── hotels/page.tsx     ✅ Usa /api/public/search/hotels
│   ├── flights/page.tsx    ⏳ Pendiente crear
│   └── packages/page.tsx   ✅ Usa /api/public/search/packages
│
├── hotels/                 # Detalle público de hotel
│   └── [slug]/page.tsx     ✅ Usa /api/public/booking/hotels/[slug]
│
├── flights/                # Detalle público de vuelo
│   └── [id]/page.tsx       ⏳ Pendiente crear
│
├── packages/               # Detalle público de paquete
│   └── [id]/page.tsx       ✅ Usa /api/public/booking/packages/[id]
│
└── checkout/               # Confirmación de reserva
    └── page.tsx            ✅ Usa /api/public/checkout
```

---

## ✅ Estado Actual

### Completado
- ✅ Estructura de API organizada (search, booking, checkout)
- ✅ Endpoints de search para hotels, flights, packages
- ✅ Endpoints de booking para hotels, flights, packages
- ✅ Endpoint de checkout
- ✅ Componentes actualizados:
  - `search/hotels/page.tsx`
  - `search/packages/page.tsx`
  - `hotels/[slug]/page.tsx`
  - `packages/[id]/page.tsx`
  - `checkout/page.tsx`
  - `components/public/FeaturedHotels.tsx`

### Pendiente
- ⏳ Crear página de búsqueda de vuelos (`search/flights/page.tsx`)
- ⏳ Crear página de detalle de vuelo (`flights/[id]/page.tsx`)
- ⏳ Actualizar checkout para soportar hotels y flights (actualmente solo packages)

---

## 🎯 Reglas de Oro

**SEARCH** = Lista / Filtros  
**BOOKING** = Detalle + Preparación de reserva  
**CHECKOUT** = Confirmación / Pago / Creación de booking

---

## 📊 Flujo Completo del Usuario

```
1. Landing Page
   └─ FeaturedHotels (usa /api/public/search/hotels)

2. Búsqueda
   ├─ /search/hotels → /api/public/search/hotels
   ├─ /search/flights → /api/public/search/flights
   └─ /search/packages → /api/public/search/packages

3. Detalle
   ├─ /hotels/[slug] → /api/public/booking/hotels/[slug]
   ├─ /flights/[id] → /api/public/booking/flights/[id]
   └─ /packages/[id] → /api/public/booking/packages/[id]

4. Checkout
   └─ /checkout → /api/public/checkout (POST)
```

---

## ✅ Conclusión

La estructura de rutas públicas está **completamente organizada** siguiendo la arquitectura definida:
- **Search** para búsqueda y filtrado
- **Booking** para detalles y preparación
- **Checkout** para confirmación y creación

Todos los componentes principales están actualizados y funcionando. Solo faltan páginas opcionales de vuelos.
