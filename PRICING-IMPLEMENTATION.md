# Implementación de Precios Diferenciados por Tipo de Pasajero

## ✅ Completado

### 1. Modelo de Datos (Flight.ts)
- ✅ Actualizado interface `IFlight` con estructura `pricing`
- ✅ Agregados precios diferenciados:
  - `pricing.adult.sellingPrice` - Adultos (12+ años)
  - `pricing.child.sellingPrice` - Niños (2-11 años)
  - `pricing.infant.sellingPrice` - Bebés (0-23 meses)
- ✅ Mantenidos campos legacy (`sellingPrice`, `sellingCurrency`) por compatibilidad
- ✅ Actualizado schema de Mongoose con validaciones

### 2. Script de Migración
- ✅ Creado `scripts/migrate-flight-pricing.ts`
- ✅ Lógica de migración automática:
  - Adultos: Precio actual (100%)
  - Niños: 75% del precio adulto
  - Bebés: 10% del precio adulto
- ✅ Documentación en `scripts/README-PRICING-MIGRATION.md`

## 🔄 Pendiente

### 3. API de Búsqueda
**Archivos a modificar:**
- `/src/app/api/flights/search/route.ts`

**Cambios necesarios:**
- Aceptar parámetros de tipos de pasajeros:
  - `adults` (número de adultos)
  - `children` (número de niños)
  - `infants` (número de bebés)
- Calcular precio total considerando tipos de pasajeros
- Retornar desglose de precios en respuesta

### 4. Componente de Búsqueda (SearchPanel)
**Archivo:** `/src/components/search/SearchPanel.tsx`

**Cambios necesarios:**
- Reemplazar input simple de "Pasajeros" con selector detallado:
  - Adultos (min: 1)
  - Niños (min: 0)
  - Bebés (min: 0)
- Validación: Al menos 1 adulto requerido
- Pasar tipos de pasajeros separados a la API

### 5. Cards de Resultados
**Archivos:**
- `/src/components/flights/FlightResultCard.tsx`
- `/src/components/flights/RoundtripFlightCard.tsx`

**Cambios necesarios:**
- Calcular precio total usando estructura `pricing`:
  ```typescript
  const totalPrice = 
    (class.pricing.adult.sellingPrice * adults) +
    (class.pricing.child.sellingPrice * children) +
    (class.pricing.infant.sellingPrice * infants)
  ```
- Mostrar desglose si hay diferentes tipos de pasajeros

### 6. Página de Booking
**Archivo:** `/src/app/booking/flights/page.tsx`

**Cambios necesarios:**
- Recibir tipos de pasajeros desde URL params
- Actualizar resumen de precios con desglose por tipo
- Mostrar información clara de precios diferenciados

## 📋 Orden de Implementación Recomendado

1. **Ejecutar migración de datos** (una sola vez)
   ```bash
   npx tsx scripts/migrate-flight-pricing.ts
   ```

2. **Actualizar SearchPanel** para capturar tipos de pasajeros

3. **Actualizar API de búsqueda** para calcular precios correctamente

4. **Actualizar FlightResultCard y RoundtripFlightCard** para mostrar precios

5. **Actualizar página de booking** para reflejar precios diferenciados

6. **Testing completo** del flujo end-to-end

## 🎯 Ejemplo de Flujo Completo

### Usuario busca:
- 2 adultos
- 1 niño
- 1 bebé
- Vuelo MEX → CUN (Economy)

### Precio Economy:
- Adulto: $500
- Niño: $375 (75%)
- Bebé: $50 (10%)

### Cálculo:
```
Total = (500 × 2) + (375 × 1) + (50 × 1)
Total = 1000 + 375 + 50
Total = $1,425
```

### Desglose mostrado:
```
2 adultos × $500 = $1,000
1 niño × $375 = $375
1 bebé × $50 = $50
─────────────────────────
Total: $1,425
```

## 🔧 Configuración de Porcentajes

Los porcentajes actuales son:
- Niños: **75%** del precio adulto
- Bebés: **10%** del precio adulto

Estos se pueden ajustar en:
- Script de migración: `scripts/migrate-flight-pricing.ts` (líneas 48, 53)
- Inventory manual: Al crear/editar vuelos en el sistema

## ⚠️ Notas Importantes

1. **Compatibilidad**: Los campos `sellingPrice` y `sellingCurrency` se mantienen para no romper código existente
2. **Migración gradual**: El sistema puede funcionar con ambas estructuras durante la transición
3. **Validación**: Siempre verificar que `pricing` existe antes de usarlo, con fallback a `sellingPrice`
4. **Bebés**: Generalmente no ocupan asiento, por eso el precio bajo (solo tasas aeroportuarias)
