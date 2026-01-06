'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, Chip } from '@heroui/react'

export default function DebugInventoryPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [flightsRes, hotelsRes, packagesRes] = await Promise.all([
          fetch('/api/inventory/flights?limit=5'),
          fetch('/api/inventory/hotels?limit=5'),
          fetch('/api/inventory/packages?limit=5')
        ])

        const flights = await flightsRes.json()
        const hotels = await hotelsRes.json()
        const packages = await packagesRes.json()

        setData({ flights, hotels, packages })
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-8">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">🔍 Debug Inventario</h1>

        {/* Vuelos */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">✈️ Vuelos</h2>
              <Chip color={data?.flights?.flights?.length > 0 ? 'success' : 'danger'}>
                {data?.flights?.flights?.length || 0} encontrados
              </Chip>
            </div>
            
            {data?.flights?.flights?.length > 0 ? (
              <div className="space-y-4">
                {data.flights.flights.map((flight: any) => (
                  <div key={flight._id} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                    <p className="font-bold">{flight.flightNumber}</p>
                    <p className="text-sm text-gray-600">
                      {flight.departure?.city || 'N/A'} → {flight.arrival?.city || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Aeropuertos: {flight.departure?.airport || 'N/A'} → {flight.arrival?.airport || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {flight.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-red-600">❌ No hay vuelos en la base de datos</p>
            )}
          </CardBody>
        </Card>

        {/* Hoteles */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">🏨 Hoteles</h2>
              <Chip color={data?.hotels?.hotels?.length > 0 ? 'success' : 'danger'}>
                {data?.hotels?.hotels?.length || 0} encontrados
              </Chip>
            </div>
            
            {data?.hotels?.hotels?.length > 0 ? (
              <div className="space-y-4">
                {data.hotels.hotels.map((hotel: any) => (
                  <div key={hotel._id} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
                    <p className="font-bold">{hotel.name}</p>
                    <p className="text-sm text-gray-600">
                      {hotel.location?.city || 'N/A'}, {hotel.location?.country || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {hotel.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-red-600">❌ No hay hoteles en la base de datos</p>
            )}
          </CardBody>
        </Card>

        {/* Paquetes */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">📦 Paquetes</h2>
              <Chip color={data?.packages?.packages?.length > 0 ? 'success' : 'danger'}>
                {data?.packages?.packages?.length || 0} encontrados
              </Chip>
            </div>
            
            {data?.packages?.packages?.length > 0 ? (
              <div className="space-y-4">
                {data.packages.packages.map((pkg: any) => (
                  <div key={pkg._id} className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50">
                    <p className="font-bold">{pkg.name}</p>
                    <p className="text-sm text-gray-600">
                      Destino: {pkg.destination?.city || pkg.destination || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {pkg.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-red-600">❌ No hay paquetes en la base de datos</p>
            )}
          </CardBody>
        </Card>

        {/* Resumen */}
        <Card>
          <CardBody className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-xl font-bold mb-4">📊 Resumen</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-black text-blue-600">
                  {data?.flights?.flights?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Vuelos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-green-600">
                  {data?.hotels?.hotels?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Hoteles</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-purple-600">
                  {data?.packages?.packages?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Paquetes</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
