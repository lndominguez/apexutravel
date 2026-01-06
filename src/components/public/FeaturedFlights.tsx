'use client'

import { Card, CardBody, CardFooter, Chip, Button, Skeleton } from '@heroui/react'
import { Plane, Clock, Calendar, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function FeaturedFlights() {
  const { data, error, isLoading } = useSWR('/api/public/flights?status=available&limit=6', fetcher)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardBody className="p-6">
              <Skeleton className="rounded-lg h-32 mb-4" />
              <Skeleton className="rounded-lg h-4 w-3/4 mb-2" />
              <Skeleton className="rounded-lg h-4 w-1/2" />
            </CardBody>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data?.flights || data.flights.length === 0) {
    return (
      <div className="text-center py-12">
        <Plane size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 mb-4">No hay vuelos disponibles en este momento</p>
        <Button as={Link} href="/search/flights" color="primary" variant="flat">
          Buscar Vuelos
        </Button>
      </div>
    )
  }

  const flights = (data?.flights || []).slice(0, 6)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {flights.map((flight: any) => {
        const lowestPrice = Math.min(...(flight.classes || []).map((c: any) => c.sellingPrice || 0))
        const discount = flight.classes[0]?.discount || 0

        return (
          <Card
            key={flight._id}
            isPressable
            as={Link}
            href={`/search/flights?origin=${flight.departure.city}&destination=${flight.arrival.city}`}
            className="group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary"
          >
            <CardBody className="p-6">
              {/* Header con aerolínea y descuento */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Plane size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      {typeof flight.airline === 'string' ? flight.airline : flight.airline?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">{flight.flightNumber}</p>
                  </div>
                </div>
                {discount > 0 && (
                  <Chip
                    color="danger"
                    variant="flat"
                    size="sm"
                    startContent={<TrendingDown size={14} />}
                  >
                    -{discount}%
                  </Chip>
                )}
              </div>

              {/* Ruta */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-2xl font-black text-gray-900">{flight.departure.city}</p>
                    <p className="text-xs text-gray-500">{flight.departure.airport}</p>
                  </div>
                  <div className="px-4">
                    <Plane size={24} className="text-primary rotate-90" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-2xl font-black text-gray-900">{flight.arrival.city}</p>
                    <p className="text-xs text-gray-500">{flight.arrival.airport}</p>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{new Date(flight.departure.dateTime).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{flight.duration}</span>
                </div>
                <Chip size="sm" variant="flat" color={flight.type === 'direct' ? 'success' : 'warning'}>
                  {flight.type === 'direct' ? 'Directo' : 'Con escalas'}
                </Chip>
              </div>
            </CardBody>

            <CardFooter className="bg-gradient-to-r from-gray-50 to-gray-100 border-t px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-xs text-gray-500">Desde</p>
                  <p className="text-2xl font-black text-primary">
                    ${lowestPrice.toLocaleString('es-MX')}
                    <span className="text-sm font-normal text-gray-500"> MXN</span>
                  </p>
                </div>
                <Button
                  color="primary"
                  variant="shadow"
                  size="sm"
                  className="group-hover:scale-105 transition-transform"
                >
                  Ver Vuelo
                </Button>
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
