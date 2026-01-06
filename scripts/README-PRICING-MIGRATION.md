# Migración de Precios Diferenciados por Tipo de Pasajero

## Descripción

Este script migra la estructura de precios de vuelos para soportar precios diferenciados por tipo de pasajero:
- **Adultos** (12+ años): Precio completo
- **Niños** (2-11 años): 75% del precio adulto
- **Bebés** (0-23 meses): 10% del precio adulto

## Estructura Nueva

### Antes:
```typescript
classes: [{
  sellingPrice: 500,
  sellingCurrency: 'USD'
}]
```

### Después:
```typescript
classes: [{
  pricing: {
    adult: {
      sellingPrice: 500,
      sellingCurrency: 'USD'
    },
    child: {
      sellingPrice: 375,  // 75% del adulto
      sellingCurrency: 'USD'
    },
    infant: {
      sellingPrice: 50,   // 10% del adulto
      sellingCurrency: 'USD'
    }
  },
  // Mantiene sellingPrice por compatibilidad
  sellingPrice: 500,
  sellingCurrency: 'USD'
}]
```

## Cómo Ejecutar

### 1. Asegúrate de tener las variables de entorno configuradas:
```bash
MONGODB_URI=mongodb://localhost:27017/travel-agency
```

### 2. Ejecuta el script:
```bash
npx tsx scripts/migrate-flight-pricing.ts
```

### 3. Verifica los resultados:
El script mostrará:
- ✅ Vuelos migrados exitosamente
- ❌ Errores (si los hay)
- 📊 Resumen total

## Notas Importantes

1. **Backup**: Haz un backup de la base de datos antes de ejecutar
2. **Compatibilidad**: Los campos `sellingPrice` y `sellingCurrency` se mantienen por compatibilidad
3. **Porcentajes**: Los porcentajes son configurables en el script:
   - Niños: 75% (línea 48)
   - Bebés: 10% (línea 53)

## Próximos Pasos

Después de ejecutar la migración:

1. ✅ Actualizar API de búsqueda para aceptar tipos de pasajeros
2. ✅ Actualizar componentes de búsqueda (SearchPanel)
3. ✅ Actualizar cálculos de precio en FlightResultCard
4. ✅ Actualizar cálculos de precio en RoundtripFlightCard
5. ✅ Actualizar página de booking para mostrar precios diferenciados

## Rollback

Si necesitas revertir la migración, puedes ejecutar:
```javascript
db.flights.updateMany(
  {},
  { $unset: { "classes.$[].pricing": "" } }
)
```
