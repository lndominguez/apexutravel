# 🏗️ Arquitectura Unificada de Ofertas

## 📋 Resumen Ejecutivo

**UN SOLO MODAL** para crear y editar TODAS las ofertas. Los items se cargan dinámicamente desde el inventario por API.

---

## 🎯 Principios Clave

### 1. **Una Oferta = Múltiples Items**
- Una oferta puede tener múltiples items (hoteles, vuelos, transportes, actividades)
- Cada item es un componente que se obtiene del inventario
- Los items se cargan dinámicamente por API (no se copian en la oferta)

### 2. **Sincronización Automática**
- La oferta solo guarda **referencias** (`inventoryId`) a los items
- Los datos reales (precios, habitaciones, stock) se obtienen en tiempo real del inventario
- Cualquier cambio en el inventario se refleja automáticamente en la oferta

### 3. **PricingMode Determina el Comportamiento**
Cada item del inventario tiene un `pricingMode` que define cómo se calcula el precio:

#### **Package Mode**
- Precio **FIJO** (no se multiplica por noches)
- Fórmula: `precioInventario + markup`
- Ejemplo: Paquete Cancún 5 días/4 noches = $1000 + 10% markup = $1100 (siempre)

#### **Hotel Mode**
- Precio **POR NOCHE** (se multiplica por noches seleccionadas)
- Fórmula: `(precioInventario * noches) + markup`
- Ejemplo: Hotel $100/noche × 4 noches = $400 + 10% markup = $440

---

## 🗂️ Estructura de Datos

### Modelo Offer (Simplificado)

```typescript
{
  type: 'package' | 'hotel' | 'flight',
  name: string,
  code: string,
  description: string,
  status: 'draft' | 'published',
  
  // Markup a nivel de oferta (se aplica sobre todos los items)
  markup: {
    type: 'percentage' | 'fixed',
    value: number
  },
  
  // Vigencia de la oferta
  validFrom: Date,
  validTo: Date,
  
  // Items (referencias al inventario con configuraciones individuales)
  items: [
    {
      inventoryId: ObjectId,
      resourceType: 'Hotel' | 'Flight' | 'Transport' | 'Activity',
      mandatory: boolean,
      
      // ⚠️ IMPORTANTE: Configuraciones específicas por ITEM
      // Cada item tiene sus propias configuraciones según su tipo:
      
      // Para Hotel:
      hotelInfo?: {
        resourceId: ObjectId,
        name: string,
        stars: number,
        location: { city, country },
        checkIn: Date,      // Fecha de entrada
        checkOut: Date,     // Fecha de salida
        nights: number,     // Noches de hospedaje
        rooms: [...]        // Habitaciones seleccionadas
      },
      
      // Para Flight:
      flightDetails?: {
        route: { from, to },
        departureDate: Date,
        returnDate?: Date,
        class: string
      },
      
      // Para Transport:
      transportDetails?: {
        type: string,
        route: { from, to },
        date: Date
      },
      
      // Para Activity:
      activityDetails?: {
        name: string,
        location: string,
        date: Date,
        duration: number
      }
    }
  ],
  
  validFrom: Date,
  validTo: Date
}
```

---

## 🔄 Flujo de Trabajo

### Creación de Oferta

```
1. Usuario abre UnifiedOfferModal (modo create)
   ↓
2. Selecciona tipo de oferta (package/hotel/flight)
   ↓
3. Llena información básica (nombre, descripción, noches)
   ↓
4. Agrega items desde el inventario
   - Se abre modal de selección
   - Busca en inventario por tipo y pricingMode
   - Selecciona item
   - Solo guarda inventoryId + metadata mínima
   ↓
5. Configura markup (% o fijo)
   ↓
6. Guarda oferta
   - Payload solo incluye referencias
   - NO copia precios ni habitaciones
```

### Edición de Oferta

```
1. Usuario abre UnifiedOfferModal (modo edit)
   ↓
2. Modal carga datos de la oferta
   ↓
3. Para cada item, hace fetch a:
   - /api/inventory/[id] → Datos del inventario
   - /api/resources/hotels/[id] → Datos del hotel
   ↓
4. Muestra habitaciones y precios reales del inventario
   ↓
5. Usuario puede:
   - Editar metadata (nombre, descripción, markup)
   - Agregar/quitar items
   - Cambiar vigencia
   ↓
6. Al guardar, solo actualiza metadata
   - Items siguen siendo referencias
```

### Display Público (Booking)

```
1. Cliente ve oferta en landing page
   ↓
2. API pública reconstruye datos:
   - GET /api/public/booking/packages/[slug]
   - Fetch inventario por inventoryId
   - Aplica markup de la oferta
   - Calcula precio según pricingMode
   ↓
3. Cliente selecciona opciones (noches, ocupación)
   ↓
4. Precio se calcula dinámicamente:
   - Package: precio fijo + markup
   - Hotel: (precio × noches) + markup
```

---

## 📁 Componentes

### Componentes Activos

1. **UnifiedOfferModal** (`/components/offers/UnifiedOfferModal.tsx`)
   - Modal único para crear/editar ofertas
   - Se adapta según tipo de oferta
   - Tabs: Básico, Items, Pricing

2. **ProviderPackageQuickCreate** (DEPRECADO - mantener por ahora)
   - Formulario rápido legacy
   - Será reemplazado por UnifiedOfferModal

### Componentes Legacy (No Usar)

1. **OfferPackageJourneyLegacy** (renombrado)
   - Wizard de 9 steps
   - Mantener por referencia
   - NO USAR en producción

2. **OfferPackageEditModal** (DEPRECADO)
   - Modal específico de edición
   - Será reemplazado por UnifiedOfferModal

---

## 🎨 Tipos de Ofertas y Cálculo de Precios

### **Oferta tipo PAQUETE**
- ✅ Puede agregar **múltiples tipos** de items:
  - Hoteles (todos los hoteles del inventario)
  - Vuelos
  - Transportes
  - Actividades
- ❌ **NO tiene vigencia** (validFrom/validTo)
- 💰 **Cálculo de Precio**: Precio fijo total del combo
  - El precio NO se multiplica por noches
  - Es un precio cerrado por el paquete completo
  - Ejemplo: $1,500 por el paquete de 4 noches (precio fijo)
- Fórmula: `(suma de items) + markup = precio final fijo`

### **Oferta tipo HOTEL**
- ✅ Solo puede agregar items de tipo **Hotel** del inventario
- ✅ Muestra **todos los hoteles** disponibles (sin filtro de pricingMode)
- ❌ NO muestra vuelos, transportes ni actividades
- ✅ **Puede tener vigencia** (opcional, con switch)
- 💰 **Cálculo de Precio**: Por noche
  - El precio se multiplica por las noches que el cliente elija
  - Ejemplo: $200/noche × 4 noches = $800
- Fórmula: `(precioHotel × nights) + markup`

> **⚠️ IMPORTANTE:** Los hoteles son visibles tanto para ofertas de tipo "hotel" como para "package" porque el precio final se define en los ajustes de la oferta (markup), no en el inventario. El tipo de oferta determina cómo se calcula el precio de venta.

### **Oferta tipo VUELO**
- ✅ Solo puede agregar items de tipo **Flight** del inventario
- ❌ NO muestra hoteles, transportes ni actividades
- ✅ **Puede tener vigencia** (opcional, con switch)
- 💰 **Cálculo de Precio**: Fijo por pasajero
  - Precio fijo, no se multiplica
  - Ejemplo: $300 por pasajero
- Fórmula: `precioVuelo + markup`

### **Tabla Comparativa**

| Aspecto | Hotel | Vuelo | Paquete |
|---------|-------|-------|---------|
| **Items Permitidos** | Solo hoteles | Solo vuelos | Hotel+Vuelo+Transporte+Actividad |
| **PricingMode** | hotel | - | package |
| **Precio** | Por noche | Fijo | Fijo |
| **Fórmula** | `(base × nights) + markup` | `base + markup` | `base + markup` |
| **Duración** | Variable (cliente elige) | - | Fija (4 noches) |
| **Booking** | Rango de fechas flexible | Fecha específica | Fecha fija de salida |

---

## 🔧 APIs Clave

### Admin APIs

```typescript
// Crear oferta
POST /api/offers/packages
Body: { name, type, markup, items: [{ inventoryId }], ... }

// Editar oferta
PUT /api/offers/packages/[id]
Body: { name, markup, validFrom, validTo, ... }

// Obtener oferta (con inventario poblado)
GET /api/offers/packages/[id]
Response: { ...offer, items: [{ inventory: {...}, hotelResource: {...} }] }
```

### Public APIs

```typescript
// Buscar ofertas (con fotos del hotel)
GET /api/public/search/packages
Response: { packages: [{ ...offer, items: [{ hotelInfo: { photos: [...] } }] }] }

// Detalle de oferta (reconstruye desde inventario)
GET /api/public/booking/packages/[slug]
Response: { ...offer, items: [{ selectedRooms: [...] }] }  // reconstruido en runtime
```

---

## ✅ Checklist de Implementación

- [x] Modelo Offer simplificado (solo inventoryId)
- [x] Campo days como virtual (nights + 1)
- [x] Markup a nivel top
- [x] API pública reconstruye desde inventario
- [ ] UnifiedOfferModal completo
- [ ] Modal de selección de items
- [ ] Lógica de pricingMode en booking
- [ ] Migrar páginas a usar UnifiedOfferModal
- [ ] Deprecar componentes legacy

---

## 🚀 Próximos Pasos

1. **Completar UnifiedOfferModal**
   - Agregar modal de selección de items
   - Implementar carga dinámica de inventario
   - Mostrar habitaciones y precios reales

2. **Actualizar Páginas**
   - `/offers/packages` → usar UnifiedOfferModal
   - Quitar referencias a modales legacy

3. **Implementar PricingMode en Booking**
   - Detectar pricingMode del item
   - Aplicar fórmula correcta (fijo vs por noche)

4. **Testing**
   - Crear oferta package → verificar precio fijo
   - Crear oferta hotel → verificar precio por noche
   - Cambiar inventario → verificar sincronización

---

## 📝 Notas Importantes

- **NO borrar OfferPackageJourneyLegacy** - mantener por referencia
- **UN SOLO MODAL** para todo - no crear modales específicos
- **Items se cargan por API** - no copiar datos en la oferta
- **PricingMode es clave** - define comportamiento del precio
- **Days siempre es nights + 1** - no editable

---

**Última actualización:** Enero 2026
**Autor:** Equipo de Desarrollo
