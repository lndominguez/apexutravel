# 🌱 Scripts de Seed

## Seed de Inventario

Este script llena la base de datos con datos realistas para el sistema de agencia de viajes.

### 📦 Contenido

El script crea:

- **30 Vuelos** 
  - Rutas nacionales e internacionales
  - Múltiples aerolíneas (Aeroméxico, Volaris, VivaAerobus, Interjet)
  - Clases económica y business
  - Precios realistas en MXN

- **5 Hoteles de Lujo**
  - Grand Oasis Cancún (5⭐ - Todo Incluido)
  - Secrets The Vine Cancún (5⭐ - Solo Adultos)
  - Hotel Xcaret México (5⭐ - Ecológico con parques)
  - Marquis Los Cabos (5⭐ - Lujo frente al mar)
  - Rosewood Mayakoba (5⭐ - Ultra lujo)
  - Múltiples tipos de habitación
  - Planes desde desayuno hasta todo incluido
  - Imágenes reales de Unsplash

- **6 Paquetes Turísticos**
  - Cancún Todo Incluido (5D/4N)
  - Riviera Maya Romántica (7D/6N)
  - Los Cabos Aventura (6D/5N)
  - Ruta Maya Cultural (8D/7N)
  - Puerto Vallarta Familiar (5D/4N)
  - Holbox Eco Paradise (4D/3N)
  - Itinerarios detallados día por día
  - Precios por persona (doble, single, triple, niños)
  - Imágenes de destinos

- **3 Proveedores**
  - Aerolíneas Mexicanas
  - Hoteles Paradisus
  - Viajes Premium

### 🚀 Cómo Ejecutar

```bash
npm run seed:inventory
```

### ⚠️ Importante

- **Este script ELIMINA todos los datos existentes** de vuelos, hoteles, paquetes y proveedores
- Asegúrate de tener tu archivo `.env` configurado con `MONGODB_URI`
- Las imágenes son URLs de Unsplash (requieren conexión a internet)

### 📸 Imágenes

Todas las imágenes son de Unsplash y están optimizadas para web:
- Hoteles: Fotos de resorts de lujo
- Paquetes: Destinos turísticos de México
- Alta calidad y relevantes al contenido

### 🎯 Uso Recomendado

1. Ejecuta el seed después de configurar tu base de datos
2. Usa estos datos para:
   - Probar el sistema completo
   - Demostrar funcionalidades
   - Desarrollar el frontend con datos realistas
   - Presentaciones y demos

### 🔄 Re-ejecutar

Puedes ejecutar el script las veces que quieras. Cada vez:
- Limpia los datos anteriores
- Crea datos frescos
- Mantiene la consistencia

### 💡 Personalización

Para modificar los datos:
1. Edita `scripts/seed-inventory.ts`
2. Cambia destinos, precios, fechas, etc.
3. Ejecuta nuevamente el script

---

**Creado para**: Sistema de Agencia de Viajes  
**Última actualización**: Diciembre 2024
