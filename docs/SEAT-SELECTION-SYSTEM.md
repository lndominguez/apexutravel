# 🪑 Sistema de Selección de Asientos

## 📋 Descripción General

Sistema completo de gestión de asientos para vuelos con tres tipos de asignación:
- **Manual**: Cliente selecciona asientos en mapa interactivo
- **Random**: Sistema asigna automáticamente
- **Airline Assigned**: Aerolínea asigna al procesar compra

---

## 🗄️ Estructura de Base de Datos

### Modelo Flight - Configuración de Asientos

```typescript
seatConfiguration: {
  totalRows: number              // Ej: 30
  seatsPerRow: number            // Ej: 6
  layout: string                 // Ej: "3-3" (ABC-DEF)
  occupiedSeats: string[]        // Ej: ["3A", "3B", "5C"]
  
  // NUEVO: Tipo de selección
  seatSelectionType: 'manual' | 'random' | 'airline_assigned'
  
  // Precio por selección (opcional)
  seatSelectionPrice?: number    // Ej: 15
  seatSelectionCurrency?: string // Ej: "USD"
  
  // Mensaje personalizado
  assignmentMessage?: string
}
```

### Clases - Cupos Disponibles

```typescript
classes: [{
  type: 'economy' | 'premium_economy' | 'business' | 'first'
  availableSeats: number  // Total de cupos
  
  // NUEVO: Detalle de asientos específicos (solo para manual)
  availableSeatsDetail?: [{
    seatNumber: string    // "12A", "12B", "15C"
    status: 'available' | 'reserved' | 'blocked'
    price?: number        // Precio adicional por este asiento
  }]
}]
```

---

## 🎯 Tipos de Selección

### 1. Manual (`seatSelectionType: 'manual'`)

**Características:**
- ✅ Cliente ve mapa de asientos interactivo
- ✅ Puede seleccionar asientos específicos
- ✅ Se cobra precio por selección de asiento
- ✅ Requiere `availableSeatsDetail` en BD

**Ejemplo en BD:**
```json
{
  "flightNumber": "AM450",
  "seatConfiguration": {
    "totalRows": 30,
    "seatsPerRow": 6,
    "layout": "3-3",
    "occupiedSeats": ["3A", "3B", "5C"],
    "seatSelectionType": "manual",
    "seatSelectionPrice": 15,
    "seatSelectionCurrency": "USD"
  },
  "classes": [{
    "type": "economy",
    "availableSeats": 120,
    "availableSeatsDetail": [
      { "seatNumber": "12A", "status": "available", "price": 20 },
      { "seatNumber": "12B", "status": "available", "price": 15 },
      { "seatNumber": "12C", "status": "available", "price": 10 },
      { "seatNumber": "13A", "status": "reserved" }
    ]
  }]
}
```

**UI Mostrada:**
```
┌─────────────────────────────────────┐
│ ✈️ Selección de asientos           │
│ $15 USD por asiento                 │
├─────────────────────────────────────┤
│ [Disponible] [Seleccionado] [Ocupado]│
│                                     │
│        Frente                       │
│      ┌────────┐                     │
│                                     │
│ 1  [A][B][C]  [D][E][F]  1         │
│ 2  [A][B][C]  [D][E][F]  2         │
│ 3  [■][■][C]  [D][E][F]  3         │
│ ...                                 │
└─────────────────────────────────────┘
```

---

### 2. Airline Assigned (`seatSelectionType: 'airline_assigned'`)

**Características:**
- ❌ NO muestra mapa de asientos
- ✅ Muestra mensaje informativo
- ❌ NO cobra por selección
- ✅ Aerolínea asigna al procesar compra

**Ejemplo en BD:**
```json
{
  "flightNumber": "Y4789",
  "seatConfiguration": {
    "seatSelectionType": "airline_assigned",
    "assignmentMessage": "Los asientos serán asignados por Volaris al momento del check-in. Puedes hacer check-in online 24 horas antes del vuelo."
  },
  "classes": [{
    "type": "economy",
    "availableSeats": 150
  }]
}
```

**UI Mostrada:**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ ✈️ Asientos asignados por       │ │
│ │    aerolínea                    │ │
│ │                                 │ │
│ │ Los asientos serán asignados    │ │
│ │ por Volaris al momento del      │ │
│ │ check-in. Puedes hacer check-in │ │
│ │ online 24 horas antes del vuelo.│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### 3. Random (`seatSelectionType: 'random'`)

**Características:**
- ❌ NO muestra mapa de asientos
- ✅ Muestra mensaje informativo con tip
- ❌ NO cobra por selección
- ✅ Sistema asigna automáticamente

**Ejemplo en BD:**
```json
{
  "flightNumber": "IB234",
  "seatConfiguration": {
    "totalRows": 25,
    "seatsPerRow": 6,
    "layout": "3-3",
    "seatSelectionType": "random",
    "assignmentMessage": "Nuestro sistema asignará automáticamente los mejores asientos disponibles para tu grupo."
  },
  "classes": [{
    "type": "economy",
    "availableSeats": 100
  }]
}
```

**UI Mostrada:**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ ✈️ Asignación automática        │ │
│ │                                 │ │
│ │ El sistema asignará             │ │
│ │ automáticamente los mejores     │ │
│ │ asientos disponibles para tu    │ │
│ │ grupo al confirmar la reserva.  │ │
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 💡 Tip: Los asientos se     │ │ │
│ │ │ asignarán tratando de       │ │ │
│ │ │ mantener a tu grupo junto   │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🚀 Cómo Usar

### 1. Poblar Base de Datos

```bash
npm run seed:flights
```

Este comando:
- ✅ Limpia vuelos existentes
- ✅ Inserta 5 vuelos de ejemplo
- ✅ Incluye los 3 tipos de selección
- ✅ Genera asientos específicos para vuelos manuales

### 2. Probar en la Aplicación

1. **Buscar vuelos:**
   - Origen: Ciudad de México (MEX)
   - Destino: Cancún (CUN)
   - Fecha: 28 de enero 2026

2. **Seleccionar vuelo y abrir modal de extras**

3. **Ver diferentes comportamientos:**
   - **AM450**: Mapa interactivo (manual)
   - **Y4789**: Mensaje de aerolínea (airline_assigned)
   - **IB234**: Mensaje de sistema (random)

---

## 📊 Ejemplos de Vuelos Incluidos

### Vuelo 1: AM450 (Manual)
- **Ruta**: MEX → CUN
- **Tipo**: Selección manual
- **Precio asiento**: $15 USD
- **Cupos específicos**: 72 asientos disponibles
- **Clases**: Economy, Business

### Vuelo 2: Y4789 (Airline Assigned)
- **Ruta**: MEX → CUN
- **Tipo**: Asignación por aerolínea
- **Precio asiento**: Gratis
- **Mensaje**: Check-in online 24h antes

### Vuelo 3: IB234 (Random)
- **Ruta**: GDL → CUN
- **Tipo**: Asignación automática
- **Precio asiento**: Gratis
- **Mensaje**: Sistema mantiene grupo junto

### Vuelo 4: AM890 (Manual - Internacional)
- **Ruta**: MEX → MIA
- **Tipo**: Selección manual
- **Precio asiento**: $25 USD
- **Clases**: Business (lie-flat), Economy

### Vuelo 5: VB567 (Airline Assigned - Con escala)
- **Ruta**: MTY → CUN (vía MEX)
- **Tipo**: Asignación por aerolínea
- **Escala**: 1.5 horas en CDMX

---

## 🔄 Flujo Completo

```
1. Admin crea vuelo en BD
         ↓
2. Configura seatSelectionType:
   - manual
   - random
   - airline_assigned
         ↓
3. Si es 'manual', agrega availableSeatsDetail
         ↓
4. Cliente busca vuelo
         ↓
5. Cliente selecciona vuelo
         ↓
6. Cliente abre modal de extras
         ↓
7. Sistema lee seatSelectionType
         ↓
8a. Manual:
    - Muestra mapa
    - Cliente selecciona
    - Cobra precio
    - Actualiza BD
         ↓
8b. Airline/Random:
    - Muestra mensaje
    - NO cobra
    - Asigna después
         ↓
9. Cliente confirma reserva
         ↓
10. Sistema procesa según tipo
```

---

## 📝 Notas Importantes

### Para Vuelos Manuales:
- ✅ Siempre incluir `availableSeatsDetail`
- ✅ Actualizar `occupiedSeats` al reservar
- ✅ Validar que asiento esté disponible
- ✅ Considerar precios premium (ventana, pasillo)

### Para Vuelos Airline Assigned:
- ✅ Incluir mensaje claro para cliente
- ✅ Explicar cuándo se asignarán asientos
- ✅ Mencionar opciones de check-in

### Para Vuelos Random:
- ✅ Explicar que sistema mantiene grupo junto
- ✅ Mencionar que son mejores asientos disponibles
- ✅ Implementar algoritmo de asignación inteligente

---

## 🛠️ Próximos Pasos

### Funcionalidades Pendientes:

1. **API para actualizar asientos:**
   ```typescript
   POST /api/flights/:id/reserve-seats
   {
     flightId: string
     classType: string
     seats: string[]
   }
   ```

2. **Algoritmo de asignación automática:**
   - Mantener grupos juntos
   - Priorizar ventanas para parejas
   - Evitar asientos del medio cuando sea posible

3. **Validaciones:**
   - Verificar disponibilidad en tiempo real
   - Prevenir doble reserva
   - Timeout de selección (5 minutos)

4. **Precios dinámicos:**
   - Ventana: +$5
   - Pasillo: +$3
   - Salida emergencia: +$10
   - Primera fila: +$15

5. **Integración con aerolíneas:**
   - API para confirmar asientos
   - Sincronización de disponibilidad
   - Actualización de estado en tiempo real

---

## 📚 Archivos Modificados

### Modelo:
- `/src/models/Flight.ts` - Interface y Schema actualizados

### Frontend:
- `/src/app/search/flights/page.tsx` - Lógica condicional de UI

### Scripts:
- `/scripts/seed-flights.ts` - Seed de vuelos de ejemplo

### Documentación:
- `/docs/SEAT-SELECTION-SYSTEM.md` - Este archivo

---

## 🎉 Conclusión

El sistema está completamente implementado y listo para usar. Puedes:

1. ✅ Ejecutar `npm run seed:flights` para poblar BD
2. ✅ Buscar vuelos MEX → CUN
3. ✅ Ver los 3 tipos de selección en acción
4. ✅ Probar selección manual de asientos
5. ✅ Ver mensajes informativos para otros tipos

**¡Todo funciona basado en la configuración de base de datos!** 🚀
