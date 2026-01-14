# 🎯 Configuración de Items en Ofertas

## ⚠️ CONCEPTO CLAVE

Las configuraciones como **fechas, destino, noches, habitaciones** NO van a nivel de oferta, van **en cada ITEM individual**.

---

## 📊 Estructura Correcta

### Tab "Básico" (Nivel Oferta)
Solo contiene información general de la oferta:
- ✅ Tipo de oferta (hotel/flight/package)
- ✅ Nombre
- ✅ Código
- ✅ Descripción
- ✅ Estado (draft/published)

❌ **NO contiene**: fechas, noches, destinos, habitaciones

---

### Tab "Items" (Configuraciones Individuales)

Cada item agregado tiene sus **propias configuraciones** según su tipo:

#### 🏨 **Item tipo HOTEL**
```typescript
{
  inventoryId: "...",
  resourceType: "Hotel",
  hotelInfo: {
    resourceId: "...",
    name: "Hotel Riu Cancún",
    stars: 5,
    location: { city: "Cancún", country: "México" },
    
    // Configuraciones específicas del hotel:
    checkIn: "2026-02-15",      // Fecha de entrada
    checkOut: "2026-02-19",     // Fecha de salida
    nights: 4,                  // Noches de hospedaje
    rooms: [                    // Habitaciones seleccionadas
      {
        roomType: "...",
        roomName: "Junior Suite",
        quantity: 2
      }
    ]
  }
}
```

#### ✈️ **Item tipo VUELO**
```typescript
{
  inventoryId: "...",
  resourceType: "Flight",
  flightDetails: {
    route: { 
      from: "CDMX", 
      to: "Cancún" 
    },
    departureDate: "2026-02-15",  // Fecha de salida
    returnDate: "2026-02-19",     // Fecha de regreso (opcional)
    class: "economy",             // Clase del vuelo
    passengers: {
      adults: 2,
      children: 1,
      infants: 0
    }
  }
}
```

#### 🚌 **Item tipo TRANSPORTE**
```typescript
{
  inventoryId: "...",
  resourceType: "Transport",
  transportDetails: {
    type: "shuttle",              // Tipo de transporte
    route: { 
      from: "Aeropuerto", 
      to: "Hotel" 
    },
    date: "2026-02-15",          // Fecha del servicio
    time: "14:00",               // Hora del servicio
    passengers: 3
  }
}
```

#### 🎭 **Item tipo ACTIVIDAD**
```typescript
{
  inventoryId: "...",
  resourceType: "Activity",
  activityDetails: {
    name: "Tour Chichén Itzá",
    location: "Chichén Itzá, Yucatán",
    date: "2026-02-17",          // Fecha de la actividad
    duration: 8,                 // Duración en horas
    participants: 3
  }
}
```

---

## 🔄 Flujo de Trabajo

### 1. Usuario crea oferta
```
Tab Básico:
- Selecciona tipo: "Paquete"
- Nombre: "Cancún Todo Incluido"
- Descripción: "..."
- Estado: "Borrador"
```

### 2. Usuario agrega items
```
Tab Items:
- Click "Agregar Item"
- Selecciona "Hotel" del inventario
- Configura:
  ✓ Check-in: 15 Feb
  ✓ Check-out: 19 Feb
  ✓ Noches: 4 (calculado automático)
  ✓ Habitaciones: 2x Junior Suite
- Guarda item

- Click "Agregar Item"
- Selecciona "Vuelo" del inventario
- Configura:
  ✓ Salida: 15 Feb
  ✓ Regreso: 19 Feb
  ✓ Clase: Economy
  ✓ Pasajeros: 2 adultos, 1 niño
- Guarda item
```

### 3. Usuario configura pricing
```
Tab Pricing:
- Markup: 10% sobre todos los items
- Vigencia: 01 Ene - 31 Mar 2026
```

### 4. Sistema calcula precio
```
Hotel: $800 (4 noches × $200)
Vuelo: $600 (3 pasajeros × $200)
Total base: $1,400
Markup 10%: $140
Precio final: $1,540
```

---

## ✅ Ventajas de este Enfoque

1. **Flexibilidad**: Cada item tiene sus propias fechas y configuraciones
2. **Claridad**: No hay confusión sobre qué configuración aplica a qué
3. **Reutilización**: Puedes tener múltiples hoteles con diferentes fechas en el mismo paquete
4. **Validación**: Puedes validar que las fechas de vuelo coincidan con las del hotel

---

## 🎯 Ejemplo Real: Paquete Multi-Destino

```typescript
{
  type: "package",
  name: "México Mágico - 3 Ciudades",
  items: [
    // Hotel en CDMX
    {
      resourceType: "Hotel",
      hotelInfo: {
        name: "Hotel Zócalo Central",
        checkIn: "2026-03-01",
        checkOut: "2026-03-04",
        nights: 3
      }
    },
    // Vuelo CDMX → Cancún
    {
      resourceType: "Flight",
      flightDetails: {
        route: { from: "CDMX", to: "Cancún" },
        departureDate: "2026-03-04"
      }
    },
    // Hotel en Cancún
    {
      resourceType: "Hotel",
      hotelInfo: {
        name: "Hotel Riu Cancún",
        checkIn: "2026-03-04",
        checkOut: "2026-03-08",
        nights: 4
      }
    },
    // Vuelo Cancún → Guadalajara
    {
      resourceType: "Flight",
      flightDetails: {
        route: { from: "Cancún", to: "Guadalajara" },
        departureDate: "2026-03-08"
      }
    },
    // Hotel en Guadalajara
    {
      resourceType: "Hotel",
      hotelInfo: {
        name: "Hotel Morales",
        checkIn: "2026-03-08",
        checkOut: "2026-03-11",
        nights: 3
      }
    }
  ]
}
```

**Total**: 10 noches, 3 ciudades, 2 vuelos internos - cada uno con sus propias fechas y configuraciones.

---

**Última actualización:** Enero 2026
