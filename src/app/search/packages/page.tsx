'use client'

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardBody, CardFooter, Chip, Button } from '@heroui/react'
import { Package } from 'lucide-react'
import { SearchLayout } from '@/components/layout/SearchLayout'
import PackageSearchPanel from '@/components/search/PackageSearchPanel'
import PackageCard from '@/components/packages/PackageCard'

function PackageSearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialDestination = searchParams.get('destination') || ''
  const initialCategory = searchParams.get('category') || ''
  const initialPassengers = parseInt(searchParams.get('passengers') || '1')
  const initialAdults = parseInt(searchParams.get('adults') || String(initialPassengers))
  const initialChildren = parseInt(searchParams.get('children') || '0')
  const initialInfants = parseInt(searchParams.get('infants') || '0')

  // Usar API pública en lugar del hook privado
  const [packages, setPackages] = useState<any[]>([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(true)

  useEffect(() => {
    async function fetchPackages() {
      // Obtener todos los parámetros de la URL
      const urlDestination = searchParams.get('destination')
      const urlCategory = searchParams.get('category')
      const urlMinPrice = searchParams.get('minPrice')
      const urlMaxPrice = searchParams.get('maxPrice')
      const urlHotelStars = searchParams.get('hotelStars')
      const urlIncludesFlights = searchParams.get('includesFlights')
      const urlWifi = searchParams.get('wifi')
      const urlDuration = searchParams.get('duration')

      // Solo buscar si hay al menos un parámetro de búsqueda
      if (!urlDestination && !urlCategory && !urlMinPrice && !urlMaxPrice && !urlHotelStars && !urlDuration && !urlIncludesFlights && !urlWifi) {
        setPackages([])
        setIsLoadingPackages(false)
        return
      }

      try {
        setIsLoadingPackages(true)
        const qs = new URLSearchParams({ limit: '100', status: 'active' })

        // Agregar todos los parámetros que existan
        if (urlDestination) qs.set('destination', urlDestination)
        if (urlCategory) qs.set('category', urlCategory)
        if (urlMinPrice) qs.set('minPrice', urlMinPrice)
        if (urlMaxPrice) qs.set('maxPrice', urlMaxPrice)
        if (urlHotelStars) qs.set('hotelStars', urlHotelStars)
        if (urlIncludesFlights) qs.set('includesFlights', urlIncludesFlights)
        if (urlWifi) qs.set('wifi', urlWifi)
        if (urlDuration) qs.set('duration', urlDuration)

        const res = await fetch(`/api/public/packages?${qs.toString()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        const data = await res.json()
        if (data.success) {
          setPackages(data.packages || [])
        }
      } catch (error) {
        console.error('Error fetching packages:', error)
      } finally {
        setIsLoadingPackages(false)
      }
    }
    fetchPackages()
  }, [searchParams])

  // Memoizar handleSearch para evitar ciclo infinito
  const handleSearch = useCallback((params: any) => {
    // Construir URL con parámetros de búsqueda
    const qs = new URLSearchParams()
    if (params.destination) qs.set('destination', params.destination)
    if (params.adults) qs.set('adults', String(params.adults))
    if (params.children) qs.set('children', String(params.children))
    if (params.infants) qs.set('infants', String(params.infants))
    if (params.allInclusive) qs.set('category', 'all_inclusive')
    if (params.minPrice !== undefined) qs.set('minPrice', String(params.minPrice))
    if (params.maxPrice !== undefined) qs.set('maxPrice', String(params.maxPrice))
    if (params.hotelStars && params.hotelStars.length > 0) qs.set('hotelStars', params.hotelStars.join(','))
    if (params.includesFlights !== undefined) qs.set('includesFlights', String(params.includesFlights))
    if (params.wifi !== undefined) qs.set('wifi', String(params.wifi))
    if (params.duration) qs.set('duration', params.duration)
    
    router.push(`/search/packages?${qs.toString()}`)
  }, [router])

  // Memoizar initialValues para evitar recreación
  const initialValues = useMemo(() => ({
    destination: initialDestination,
    adults: initialAdults,
    children: initialChildren,
    infants: initialInfants,
    allInclusive: initialCategory === 'all_inclusive'
  }), [initialDestination, initialAdults, initialChildren, initialInfants, initialCategory])

  // SearchPanel para paquetes
  const searchPanel = useMemo(() => (
    <PackageSearchPanel
      onSearchChange={handleSearch}
      initialValues={initialValues}
    />
  ), [handleSearch, initialValues])

  return (
    <SearchLayout
      moduleTitle="Paquetes Turísticos"
      moduleIcon={<Package size={24} />}
      moduleDescription={initialDestination ? `Resultados para "${initialDestination}"` : 'Explora nuestros paquetes todo incluido'}
      searchPanel={searchPanel}
    >
      <div className="py-6">
            {/* Mostrar mensaje inicial si no hay búsqueda */}
            {!initialDestination && !initialCategory && !isLoadingPackages ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <Package size={48} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Encuentra tu paquete ideal
                </h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  Utiliza el panel de búsqueda para explorar nuestros paquetes turísticos. 
                  Puedes buscar por país, ciudad o nombre del paquete.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Chip variant="flat" color="primary">México</Chip>
                  <Chip variant="flat" color="primary">Cancún</Chip>
                  <Chip variant="flat" color="primary">Playa del Carmen</Chip>
                  <Chip variant="flat" color="primary">Todo Incluido</Chip>
                </div>
              </div>
            ) : (
              <>
                {/* Contador de resultados */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {isLoadingPackages ? 'Buscando...' : `${packages?.length || 0} paquetes encontrados`}
                  </p>
                </div>

                {/* Grid de paquetes */}
                {isLoadingPackages ? (
                  <div className="space-y-6">
                    {/* Loading header elegante */}
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <Package className="absolute inset-0 m-auto text-primary" size={32} />
                      </div>
                      <p className="mt-6 text-lg font-semibold text-foreground">Buscando paquetes perfectos...</p>
                      <p className="mt-2 text-sm text-muted-foreground">Esto solo tomará un momento</p>
                    </div>
                    
                    {/* Skeleton cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardBody className="p-0">
                            <div className="relative">
                              <div className="w-full h-48 bg-gradient-to-br from-default-100 via-default-200 to-default-100 animate-pulse" />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                            </div>
                            <div className="p-4 space-y-3">
                              <div className="h-6 bg-default-200 rounded animate-pulse" />
                              <div className="h-4 bg-default-200 rounded w-3/4 animate-pulse" />
                              <div className="h-4 bg-default-200 rounded w-1/2 animate-pulse" />
                            </div>
                          </CardBody>
                          <CardFooter className="border-t">
                            <div className="h-10 bg-default-200 rounded w-full animate-pulse" />
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : packages && packages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {packages.map((pkg: any) => (
                      <PackageCard key={pkg._id} pkg={pkg} />
                    ))}
                  </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-20 h-20 mb-6 rounded-full bg-default-100 flex items-center justify-center">
                  <Package size={40} className="text-default-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  No se encontraron paquetes
                </h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  No hay paquetes que coincidan con tu búsqueda. 
                  Intenta con otro destino o ajusta los filtros.
                </p>
                <Button
                  variant="flat"
                  color="primary"
                  onPress={() => router.push('/search/packages')}
                >
                  Limpiar búsqueda
                </Button>
              </div>
            )}
              </>
            )}
      </div>
    </SearchLayout>
  )
}

export default function PackageSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <PackageSearchContent />
    </Suspense>
  )
}
