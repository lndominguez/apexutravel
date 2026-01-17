'use client'

import { Card, CardBody } from '@heroui/react'
import useSWR from 'swr'
import Link from 'next/link'
import PackageCard from '@/components/packages/PackageCard'
import { Package } from 'lucide-react'

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Error al cargar paquetes')
  }
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch (e) {
    console.error('Error parsing JSON:', text)
    throw new Error('Respuesta inválida del servidor')
  }
}

export default function FeaturedPackages() {
  const { data, error, isLoading } = useSWR('/api/public/search/packages?status=published&featured=true&limit=8', fetcher)

  // Normalizar respuesta de la API
  const packages = data?.packages || []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="h-[500px]">
            <CardBody className="p-0">
              <div className="w-full h-56 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    )
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mb-6 rounded-full bg-default-100 flex items-center justify-center mx-auto">
          <Package size={40} className="text-default-400" />
        </div>
        <h3 className="text-2xl font-bold mb-2">No hay paquetes disponibles</h3>
        <p className="text-gray-500">Estamos preparando ofertas increíbles para ti</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.slice(0, 8).map((pkg: any) => (
          <PackageCard key={pkg._id} pkg={pkg} />
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <Link
          href="/search/packages"
          className="text-sm font-bold text-[#0c3f5b] hover:text-[#ec9c12] transition-colors"
        >
          Ver más paquetes
        </Link>
      </div>
    </div>
  )
}
