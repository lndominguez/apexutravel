# 🔄 Flujo Condicionado de Ofertas

## 📊 Diagrama de Flujo

```
Usuario abre UnifiedOfferModal
         ↓
Selecciona TIPO de oferta
         ↓
    ┌────┴────┐
    ↓         ↓         ↓
  HOTEL    VUELO    PAQUETE
    │         │         │
    ↓         ↓         ↓
```

### 🏨 **Si selecciona HOTEL**

```
Tab Items muestra:
┌─────────────────────────────────────┐
│ ℹ️ Oferta de Hotel                  │
│ ✅ Solo hoteles (pricingMode: hotel)│
└─────────────────────────────────────┘

Botón: "Agregar Hotel"
         ↓
Modal busca en inventario:
  - resourceType: "Hotel"
  - pricingMode: "hotel"
         ↓
Usuario selecciona hotel
         ↓
Se guarda solo:
  {
    inventoryId: "...",
    resourceType: "Hotel",
    hotelInfo: { name, stars, location }
  }
```

**Comportamiento en Booking:**
- Precio se multiplica por noches que el cliente elija
- Fórmula: `(precioHotel × nights) + markup`

---

### ✈️ **Si selecciona VUELO**

```
Tab Items muestra:
┌─────────────────────────────────────┐
│ ℹ️ Oferta de Vuelo                  │
│ ✅ Solo vuelos del inventario       │
└─────────────────────────────────────┘

Botón: "Agregar Vuelo"
         ↓
Modal busca en inventario:
  - resourceType: "Flight"
         ↓
Usuario selecciona vuelo
         ↓
Se guarda solo:
  {
    inventoryId: "...",
    resourceType: "Flight",
    flightDetails: { route, class }
  }
```

**Comportamiento en Booking:**
- Precio fijo por pasajero
- Fórmula: `precioVuelo + markup`

---

### 📦 **Si selecciona PAQUETE**

```
Tab Items muestra:
┌─────────────────────────────────────────────────┐
│ ℹ️ Oferta de Paquete                            │
│ ✅ Múltiples items:                             │
│    - Hoteles (pricingMode: package)            │
│    - Vuelos                                     │
│    - Transportes                                │
│    - Actividades                                │
└─────────────────────────────────────────────────┘

Botón: "Agregar Item"
         ↓
Modal muestra OPCIONES:
  ┌─ Agregar Hotel (pricingMode: package)
  ├─ Agregar Vuelo
  ├─ Agregar Transporte
  └─ Agregar Actividad
         ↓
Usuario selecciona tipo y luego item
         ↓
Se guarda:
  {
    inventoryId: "...",
    resourceType: "Hotel|Flight|Transport|Activity",
    hotelInfo: { ... } // según el tipo
  }
```

**Comportamiento en Booking:**
- Precio FIJO (NO se multiplica por noches)
- Fórmula: `(hotel + vuelo + transporte + actividades) + markup`

---

## 🔑 Diferencia Clave: PricingMode

### **Hotel con pricingMode = "hotel"**
```typescript
// Solo para ofertas tipo HOTEL
{
  type: "hotel",
  items: [{
    inventoryId: "...",
    resourceType: "Hotel",
    // Este hotel tiene pricingMode: "hotel" en el inventario
  }]
}
// Precio: $100/noche × 4 noches = $400 + markup
```

### **Hotel con pricingMode = "package"**
```typescript
// Solo para ofertas tipo PAQUETE
{
  type: "package",
  items: [{
    inventoryId: "...",
    resourceType: "Hotel",
    // Este hotel tiene pricingMode: "package" en el inventario
  }]
}
// Precio: $500 (fijo, no importa cuántas noches) + markup
```

---

## 🎯 Reglas de Validación

### Al agregar items:

**Oferta HOTEL:**
- ✅ Permitir: Hoteles con `pricingMode: "hotel"`
- ❌ Bloquear: Vuelos, transportes, actividades
- ❌ Bloquear: Hoteles con `pricingMode: "package"`

**Oferta VUELO:**
- ✅ Permitir: Vuelos del inventario
- ❌ Bloquear: Hoteles, transportes, actividades

**Oferta PAQUETE:**
- ✅ Permitir: Hoteles con `pricingMode: "package"`
- ✅ Permitir: Vuelos, transportes, actividades
- ❌ Bloquear: Hoteles con `pricingMode: "hotel"`

---

## 📝 Ejemplo Práctico

### Escenario 1: Crear Oferta de Hotel

```
1. Usuario selecciona tipo: "Hotel"
2. Tab Items solo muestra opción de agregar hoteles
3. Modal de selección filtra: pricingMode = "hotel"
4. Usuario selecciona "Hotel Riu Cancún"
5. Se guarda referencia al inventario
6. En booking: Cliente elige 5 noches
7. Precio: $150/noche × 5 = $750 + 10% markup = $825
```

### Escenario 2: Crear Oferta de Paquete

```
1. Usuario selecciona tipo: "Paquete"
2. Tab Items permite agregar múltiples tipos
3. Usuario agrega:
   - Hotel (pricingMode: package): $800
   - Vuelo: $300
   - Transporte: $50
4. Total base: $1,150
5. En booking: Cliente reserva (precio fijo)
6. Precio: $1,150 + 10% markup = $1,265
   (No importa si son 3, 5 o 7 noches)
```

---

## ✅ Checklist de Implementación

- [x] UnifiedOfferModal con tabs condicionados
- [x] Tab Items muestra info contextual según tipo
- [x] Botón "Agregar" cambia texto según tipo
- [x] Documento de arquitectura actualizado
- [ ] ItemSelectionModal con filtros por tipo y pricingMode
- [ ] Integración completa en UnifiedOfferModal
- [ ] Lógica de pricing en APIs de booking
- [ ] Testing de flujos completos

---

**Última actualización:** Enero 2026
