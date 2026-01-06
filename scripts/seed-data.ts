import mongoose from 'mongoose'
import { Supplier, Flight, Hotel, Transport, Package } from '../src/models'
import { User } from '../src/models/User'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm'

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Conectado a MongoDB')

    // Buscar usuario super_admin existente
    const adminUser = await User.findOne({ role: 'super_admin' })
    
    if (!adminUser) {
      console.log('❌ No hay usuario super_admin en la base de datos.')
      console.log('💡 El script necesita un usuario para asignar como createdBy')
      return
    }

    console.log(`✅ Usando usuario: ${adminUser.email}`)

    // 1. CREAR PROVEEDORES
    console.log('\n📦 Creando proveedores...')
    
    const aeromexico = await Supplier.create({
      name: 'Aeroméxico',
      legalName: 'Aerovías de México S.A. de C.V.',
      type: 'airline',
      email: 'contacto@aeromexico.com',
      phone: '+52 55 5133 4000',
      taxId: 'AMX123456789',
      address: {
        street: 'Av. Paseo de la Reforma 445',
        city: 'Ciudad de México',
        state: 'CDMX',
        country: 'México',
        postalCode: '06500'
      },
      contacts: [],
      paymentTerms: {
        method: 'credit',
        creditDays: 30,
        currency: 'MXN'
      },
      defaultMarkup: 15,
      status: 'active',
      createdBy: adminUser._id
    })

    const meliaHotels = await Supplier.create({
      name: 'Meliá Hotels International',
      legalName: 'Meliá Hotels International S.A.',
      type: 'hotel_chain',
      email: 'reservas@melia.com',
      phone: '+52 998 881 1100',
      taxId: 'MEL987654321',
      address: {
        street: 'Blvd. Kukulcan Km 16.5',
        city: 'Cancún',
        state: 'Quintana Roo',
        country: 'México',
        postalCode: '77500'
      },
      contacts: [],
      paymentTerms: {
        method: 'prepaid',
        currency: 'MXN'
      },
      defaultMarkup: 25,
      status: 'active',
      createdBy: adminUser._id
    })

    const transportCancun = await Supplier.create({
      name: 'Cancún Airport Transportation',
      legalName: 'Transportes Turísticos del Caribe S.A.',
      type: 'transport_company',
      email: 'reservas@cancuntransport.com',
      phone: '+52 998 123 4567',
      taxId: 'TTC456789123',
      address: {
        street: 'Aeropuerto Internacional de Cancún',
        city: 'Cancún',
        state: 'Quintana Roo',
        country: 'México',
        postalCode: '77500'
      },
      contacts: [],
      paymentTerms: {
        method: 'prepaid',
        currency: 'MXN'
      },
      defaultMarkup: 30,
      status: 'active',
      createdBy: adminUser._id
    })

    console.log('✅ 3 Proveedores creados')

    // 2. CREAR VUELOS
    console.log('\n✈️  Creando vuelos...')
    
    const vueloIda = await Flight.create({
      supplier: aeromexico._id,
      flightNumber: 'AM 501',
      airline: 'Aeroméxico',
      departure: {
        airport: 'MEX',
        city: 'Ciudad de México',
        country: 'México',
        terminal: '2',
        dateTime: new Date('2024-12-20T08:00:00')
      },
      arrival: {
        airport: 'CUN',
        city: 'Cancún',
        country: 'México',
        terminal: '3',
        dateTime: new Date('2024-12-20T10:30:00')
      },
      duration: 150,
      stops: 0,
      classes: [
        {
          type: 'economy',
          availableSeats: 120,
          costPrice: 3500,
          costCurrency: 'MXN',
          markup: 20,
          sellingPrice: 4200,
          sellingCurrency: 'MXN',
          baggage: {
            carry: '1 x 10kg',
            checked: '1 x 23kg'
          },
          amenities: ['Snack', 'Bebidas']
        },
        {
          type: 'business',
          availableSeats: 20,
          costPrice: 8000,
          costCurrency: 'MXN',
          markup: 30,
          sellingPrice: 10400,
          sellingCurrency: 'MXN',
          baggage: {
            carry: '2 x 10kg',
            checked: '2 x 32kg'
          },
          amenities: ['Comida gourmet', 'Bebidas premium', 'Asiento reclinable']
        }
      ],
      cancellationPolicy: 'Cancelación con cargo del 50% hasta 24 horas antes',
      changePolicy: 'Cambios permitidos con cargo de $500 MXN',
      refundable: false,
      status: 'available',
      createdBy: adminUser._id
    })

    const vueloVuelta = await Flight.create({
      supplier: aeromexico._id,
      flightNumber: 'AM 502',
      airline: 'Aeroméxico',
      departure: {
        airport: 'CUN',
        city: 'Cancún',
        country: 'México',
        terminal: '3',
        dateTime: new Date('2024-12-23T18:00:00')
      },
      arrival: {
        airport: 'MEX',
        city: 'Ciudad de México',
        country: 'México',
        terminal: '2',
        dateTime: new Date('2024-12-23T20:30:00')
      },
      duration: 150,
      stops: 0,
      classes: [
        {
          type: 'economy',
          availableSeats: 115,
          costPrice: 3500,
          costCurrency: 'MXN',
          markup: 20,
          sellingPrice: 4200,
          sellingCurrency: 'MXN',
          baggage: {
            carry: '1 x 10kg',
            checked: '1 x 23kg'
          },
          amenities: ['Snack', 'Bebidas']
        }
      ],
      cancellationPolicy: 'Cancelación con cargo del 50% hasta 24 horas antes',
      changePolicy: 'Cambios permitidos con cargo de $500 MXN',
      refundable: false,
      status: 'available',
      createdBy: adminUser._id
    })

    console.log('✅ 2 Vuelos creados')

    // 3. CREAR HOTELES
    console.log('\n🏨 Creando hoteles...')
    
    const hotel = await Hotel.create({
      supplier: meliaHotels._id,
      name: 'Paradisus Cancún',
      category: 5,
      location: {
        address: 'Blvd. Kukulcan Km 16.5, Zona Hotelera',
        city: 'Cancún',
        state: 'Quintana Roo',
        country: 'México',
        postalCode: '77500',
        coordinates: {
          latitude: 21.1619,
          longitude: -86.8515
        },
        zone: 'Zona Hotelera'
      },
      phone: '+52 998 881 1100',
      email: 'reservas@paradisuscancun.com',
      website: 'https://www.melia.com/paradisus-cancun',
      description: 'Resort de lujo todo incluido frente al mar Caribe con servicio excepcional y amenidades de primera clase',
      amenities: ['Piscina infinity', 'WiFi gratuito', 'Spa de lujo', 'Gimnasio 24h', '5 Restaurantes', '3 Bares', 'Playa privada', 'Kids club'],
      roomTypes: [
        {
          name: 'Suite Junior Vista al Mar',
          description: 'Habitación elegante con balcón privado y vista panorámica al Caribe',
          capacity: {
            adults: 2,
            children: 1
          },
          size: 45,
          bedType: '1 King o 2 Queen',
          amenities: ['Balcón', 'Minibar premium', 'TV 55"', 'Aire acondicionado', 'Caja fuerte', 'Cafetera Nespresso'],
          totalRooms: 50,
          availableRooms: 45,
          plans: [
            {
              type: 'all_inclusive',
              costPerNight: 150,
              costCurrency: 'USD',
              markup: 25,
              sellingPricePerNight: 187.50,
              sellingCurrency: 'USD',
              minNights: 2
            }
          ],
          images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800']
        }
      ],
      checkIn: '15:00',
      checkOut: '12:00',
      cancellationPolicy: 'Cancelación gratuita hasta 48 horas antes del check-in',
      childPolicy: 'Niños menores de 12 años gratis compartiendo habitación con adultos',
      petPolicy: 'No se permiten mascotas',
      rating: 9.2,
      reviews: 1547,
      status: 'active',
      images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'],
      tags: ['playa', 'lujo', 'todo-incluido', 'familiar'],
      createdBy: adminUser._id
    })

    console.log('✅ 1 Hotel creado')

    // 4. CREAR TRANSPORTES
    console.log('\n🚗 Creando transportes...')
    
    const transporte = await Transport.create({
      supplier: transportCancun._id,
      name: 'Traslado Aeropuerto - Hotel (Van de Lujo)',
      type: 'van',
      description: 'Servicio de traslado privado en van de lujo con aire acondicionado, WiFi y conductor bilingüe',
      capacity: {
        passengers: 8,
        luggage: 8
      },
      route: {
        origin: {
          type: 'airport',
          name: 'Aeropuerto Internacional de Cancún',
          address: 'Carretera Cancún-Chetumal Km 22',
          city: 'Cancún',
          country: 'México'
        },
        destination: {
          type: 'hotel',
          name: 'Zona Hotelera Cancún',
          address: 'Blvd. Kukulcan',
          city: 'Cancún',
          country: 'México'
        },
        distance: 25,
        estimatedDuration: 30
      },
      schedule: {
        type: 'on_demand',
        frequency: 'Disponible 24/7'
      },
      pricing: {
        costPrice: 50,
        costCurrency: 'USD',
        costType: 'per_vehicle',
        markup: 30,
        sellingPrice: 65,
        sellingCurrency: 'USD',
        sellingType: 'per_vehicle'
      },
      amenities: ['Aire acondicionado', 'WiFi gratuito', 'Agua embotellada', 'Conductor bilingüe', 'Asientos de cuero'],
      availability: {
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        maxBookingsPerDay: 20,
        currentBookings: 3
      },
      cancellationPolicy: 'Cancelación gratuita hasta 24 horas antes del servicio',
      waitingTime: 15,
      status: 'active',
      images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800'],
      tags: ['aeropuerto', 'privado', 'lujo'],
      createdBy: adminUser._id
    })

    console.log('✅ 1 Transporte creado')

    // 5. CREAR PAQUETES
    console.log('\n📦 Creando paquetes...')
    
    const paquete1 = await Package.create({
      name: 'Cancún Todo Incluido 3 Días / 2 Noches',
      description: 'Disfruta de 3 días y 2 noches en el paraíso caribeño. Incluye vuelos redondos desde Ciudad de México, hotel 5 estrellas todo incluido y traslados privados. Perfecto para una escapada rápida al Caribe.',
      destination: {
        city: 'Cancún',
        country: 'México',
        region: 'Caribe Mexicano'
      },
      duration: {
        days: 3,
        nights: 2
      },
      category: 'all_inclusive',
      components: {
        flights: [
          {
            flight: vueloIda._id,
            type: 'outbound',
            costPrice: 3500,
            sellingPrice: 4200
          },
          {
            flight: vueloVuelta._id,
            type: 'return',
            costPrice: 3500,
            sellingPrice: 4200
          }
        ],
        hotels: [
          {
            hotel: hotel._id,
            roomType: 'Suite Junior Vista al Mar',
            plan: 'all_inclusive',
            nights: 2,
            costPrice: 300,
            sellingPrice: 375
          }
        ]
      },
      itinerary: [
        {
          day: 1,
          title: 'Llegada a Cancún',
          description: 'Llegada al aeropuerto, traslado al hotel y check-in',
          activities: ['Traslado al hotel', 'Check-in', 'Bienvenida con bebida tropical', 'Tarde libre en la playa'],
          meals: {
            breakfast: false,
            lunch: false,
            dinner: true
          },
          accommodation: 'Paradisus Cancún'
        },
        {
          day: 2,
          title: 'Día libre en el resort',
          description: 'Día completo para disfrutar de todas las amenidades del resort',
          activities: ['Desayuno buffet', 'Playa y piscina', 'Actividades acuáticas', 'Cena en restaurante a la carta'],
          meals: {
            breakfast: true,
            lunch: true,
            dinner: true
          },
          accommodation: 'Paradisus Cancún'
        },
        {
          day: 3,
          title: 'Check-out y regreso',
          description: 'Último desayuno y traslado al aeropuerto',
          activities: ['Desayuno', 'Check-out', 'Traslado al aeropuerto', 'Vuelo de regreso'],
          meals: {
            breakfast: true,
            lunch: false,
            dinner: false
          }
        }
      ],
      pricing: {
        totalCost: 7400,
        packageMarkup: 15,
        baseSellingPrice: 8705,
        pricePerPerson: {
          single: 8705,
          double: 8705
        },
        currency: 'MXN'
      },
      availability: {
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-03-31'),
        maxParticipants: 100,
        minParticipants: 1,
        currentBookings: 12,
        status: 'available'
      },
      included: [
        'Vuelos redondos CDMX - Cancún en clase económica',
        'Hotel 5 estrellas régimen Todo Incluido (2 noches)',
        'Impuestos hoteleros',
        'Seguro de viaje básico'
      ],
      notIncluded: [
        'Bebidas alcohólicas premium no incluidas en el plan',
        'Tours y excursiones opcionales',
        'Propinas para guías y personal',
        'Gastos personales'
      ],
      cancellationPolicy: 'Cancelación gratuita hasta 7 días antes del viaje. Después se aplica cargo del 50%',
      paymentPolicy: '50% al momento de la reserva, 50% restante 15 días antes del viaje',
      suppliers: [aeromexico._id, meliaHotels._id],
      images: [
        'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'
      ],
      featured: true,
      tags: ['playa', 'todo-incluido', 'cancun', 'caribe', 'oferta'],
      status: 'active',
      createdBy: adminUser._id
    })

    console.log('✅ 1 Paquete creado')

    console.log('\n🎉 ¡Datos de ejemplo creados exitosamente!')
    console.log('\n📊 Resumen:')
    console.log(`- Proveedores: 3`)
    console.log(`- Vuelos: 2`)
    console.log(`- Hoteles: 1`)
    console.log(`- Transportes: 1`)
    console.log(`- Paquetes: 1`)
    console.log('\n✅ Ahora puedes ver el landing funcionando en http://localhost:3000')
    console.log('✅ Los paquetes aparecerán en la sección "Paquetes Destacados"')

  } catch (error: any) {
    console.error('\n❌ Error al crear datos:', error.message)
    if (error.errors) {
      console.error('\n📋 Detalles de validación:')
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`)
      })
    }
  } finally {
    await mongoose.disconnect()
    console.log('\n👋 Desconectado de MongoDB')
  }
}

seedData()
