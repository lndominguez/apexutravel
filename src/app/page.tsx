'use client'

import { Button, Chip, Card, CardBody } from '@heroui/react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Sparkles, Shield, HeartHandshake, Award, ArrowRight, Plane, Package, Hotel, TrendingUp, Globe2 } from 'lucide-react'
import SearchTabs from '@/components/public/SearchTabs'
import FeaturedPackages from '@/components/public/FeaturedPackages'
import FeaturedFlights from '@/components/public/FeaturedFlights'
import FeaturedHotels from '@/components/public/FeaturedHotels'
import DestinationsCarousel from '@/components/public/DestinationsCarousel'
import { Logo } from '@/components/common/Logo'

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen">
      {/* Hero Section - Pantalla Completa */}
      {/* En mobile usamos min-h-screen para que el hero crezca con el contenido y no se solape con la siguiente sección.
          En desktop mantenemos h-screen para el efecto de pantalla completa. */}
      <section className="relative min-h-screen lg:h-screen">
        {/* Video/Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1729350038150-495c628bd695?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",

              // backgroundImage: "url('/bg/banner-bg.jpg')",
              backgroundPosition: 'center 18%',
            }}
          />
          {/* Overlay con gradiente */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/55 via-indigo-900/50 to-rose-900/55" />

          {/* Patrón decorativo */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 10px 10px, rgba(255,255,255,0.75) 1.6px, transparent 1.6px)',
                backgroundSize: '30px 30px',
                opacity: 0.42,
                WebkitMaskImage: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 70%, rgba(255,255,255,0) 100%)',
                maskImage: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 70%, rgba(255,255,255,0) 100%)'
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 4px 4px, rgba(99,179,237,0.55) 1.1px, transparent 1.1px)',
                backgroundSize: '18px 18px',
                opacity: 0.32,
                WebkitMaskImage: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0) 100%)',
                maskImage: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0) 100%)'
              }}
            />
          </div>
        </div>

        {/* Header minimalista */}
        <div className="container mx-auto relative z-10 pt-6 px-4">
          <div className="flex items-center justify-between">
            <Logo size="lg" variant="light" showIcon={true} />

            <div className="flex items-center gap-3">
              {session ? (
                <Button
                  as={Link}
                  href="/dashboard"
                  size="md"
                  className="bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    as={Link}
                    href="/auth/login"
                    size="md"
                    variant="light"
                    className="text-white hover:bg-white/10 hidden sm:flex"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    as={Link}
                    href="/auth/register"
                    size="md"
                    className="bg-white text-primary hover:bg-white/90 font-semibold"
                  >
                    Registrarse
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="container mx-auto relative z-10 px-4 flex items-start pt-12 pb-12 lg:pt-45 lg:pb-20">
          <div className="w-full space-y-5">
            {/* Hero Content */}
            <div className="text-center space-y-3">
              {/* Título principal */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black text-white leading-tight">
                Regala viajes que hacen
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200">
                  latir el corazón
                </span>
              </h1>

              {/* Slogan */}
              <p className="text-base sm:text-lg md:text-xl text-white/85 max-w-2xl mx-auto font-medium">
                Cada pasaje, cada hotel, cada experiencia curada pensando en ti. Porque los mejores recuerdos merecen el viaje perfecto
              </p>
            </div>

            {/* Search Box */}
            <div className="w-full max-w-5xl mx-auto">
              <SearchTabs />
            </div>
          </div>
        </div>

      </section>

      {/* Viaja por el Mundo - Carousel */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-base uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <Globe2 size={20} />
              Viaja por el Mundo
            </p>
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Destinos que Enamoran
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre los lugares más increíbles de México y el mundo. Cada destino es una nueva historia por vivir.
            </p>
          </div>

          <DestinationsCarousel />
        </div>
      </section>

      {/* Paquetes Destacados */}
      <section id="packages" className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-secondary font-bold text-base uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <Package size={20} />
              Paquetes Todo Incluido
            </p>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Ofertas <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Irresistibles</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Paquetes completos con vuelo, hotel, tours y más. Todo lo que necesitas para unas vacaciones perfectas.
            </p>
          </div>
          <FeaturedPackages />
        </div>
      </section>

      {/* Hoteles de Lujo */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-base uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <Hotel size={20} />
              Hoteles Premium
            </p>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Hospedaje de <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Ensueño</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Los mejores resorts y hoteles boutique. Lujo, confort y experiencias inolvidables.
            </p>
          </div>
          <FeaturedHotels />
        </div>
      </section>


      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              ¿Por Qué Elegirnos?
            </h2>
            <p className="text-xl text-gray-600">
              Más de 10 años creando experiencias inolvidables
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Pago Seguro</h3>
              <p className="text-gray-600">
                Transacciones 100% seguras y protegidas
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeartHandshake className="text-secondary" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Mejor Precio</h3>
              <p className="text-gray-600">
                Garantizamos las mejores tarifas del mercado
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-success" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Experiencia</h3>
              <p className="text-gray-600">
                Más de 50,000 viajeros satisfechos
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-warning" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Atención 24/7</h3>
              <p className="text-gray-600">
                Soporte en todo momento durante tu viaje
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ¿Listo para tu Próxima Aventura?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Regístrate hoy y obtén un 10% de descuento en tu primer paquete
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              as={Link}
              href="/auth/register"
              size="lg"
              className="bg-white text-primary font-semibold"
            >
              Crear Cuenta Gratis
            </Button>
            <Button
              as={Link}
              href="#packages"
              size="lg"
              variant="bordered"
              className="border-white text-white"
            >
              Ver Ofertas
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={24} />
                <span className="text-xl font-bold">TravelCRM</span>
              </div>
              <p className="text-gray-400 text-base">
                Tu agencia de viajes de confianza desde 2014
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Servicios</h4>
              <ul className="space-y-2 text-base text-gray-400">
                <li><Link href="/packages" className="hover:text-white transition-colors">Paquetes</Link></li>
                <li><Link href="/flights" className="hover:text-white transition-colors">Vuelos</Link></li>
                <li><Link href="/hotels" className="hover:text-white transition-colors">Hoteles</Link></li>
                <li><Link href="/transports" className="hover:text-white transition-colors">Transportes</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Compañía</h4>
              <ul className="space-y-2 text-base text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">Nosotros</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Términos</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contacto</h4>
              <ul className="space-y-2 text-base text-gray-400">
                <li>contacto@travelcrm.com</li>
                <li>+52 998 123 4567</li>
                <li>Cancún, México</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 TravelCRM. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
