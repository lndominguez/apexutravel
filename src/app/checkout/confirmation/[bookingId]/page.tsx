'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardBody, Button, Divider, Chip } from '@heroui/react'
import { CheckCircle2, Mail, Phone, Calendar, Users, MapPin, Download, Home } from 'lucide-react'
import { SearchLayout } from '@/components/layout/SearchLayout'

export default function ConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/bookings/${resolvedParams.bookingId}`, { cache: 'no-store' })
        const data = await res.json()
        
        if (data.success) {
          setBooking(data.data)
        }
      } catch (error) {
        console.error('Error loading booking:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBooking()
  }, [resolvedParams.bookingId])
  
  if (isLoading) {
    return (
      <SearchLayout moduleTitle="Confirmación" moduleIcon="check-circle">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando confirmación...</p>
          </div>
        </div>
      </SearchLayout>
    )
  }
  
  if (!booking) {
    return (
      <SearchLayout moduleTitle="Confirmación" moduleIcon="check-circle">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">No se encontró la reserva</p>
            <Button color="primary" onPress={() => router.push('/')} className="mt-4">
              Volver al inicio
            </Button>
          </div>
        </div>
      </SearchLayout>
    )
  }
  
  return (
    <SearchLayout moduleTitle="Confirmación" moduleIcon="check-circle">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header de éxito */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">¡Reserva Confirmada!</h1>
            <p className="text-gray-600">
              Hemos recibido tu solicitud de reserva exitosamente
            </p>
          </div>
          
          {/* Número de reserva */}
          <Card className="mb-6">
            <CardBody className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Número de Reserva</p>
              <p className="text-3xl font-black text-primary">{booking.bookingNumber}</p>
              <p className="text-xs text-gray-500 mt-2">Guarda este número para futuras referencias</p>
            </CardBody>
          </Card>
          
          {/* Información de la reserva */}
          <Card className="mb-6">
            <CardBody className="p-6">
              <h2 className="font-bold text-xl mb-4">Detalles de tu Reserva</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de salida</p>
                    <p className="font-semibold">
                      {booking.startDate ? new Date(booking.startDate).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Por confirmar'}
                    </p>
                  </div>
                </div>
                
                <Divider />
                
                <div className="flex items-start gap-3">
                  <Users size={20} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Pasajeros</p>
                    <p className="font-semibold">
                      {booking.pricing.adults + booking.pricing.children + booking.pricing.infants} persona{booking.pricing.adults + booking.pricing.children + booking.pricing.infants > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.pricing.adults} adulto{booking.pricing.adults > 1 ? 's' : ''}
                      {booking.pricing.children > 0 ? `, ${booking.pricing.children} niño${booking.pricing.children > 1 ? 's' : ''}` : ''}
                      {booking.pricing.infants > 0 ? `, ${booking.pricing.infants} infante${booking.pricing.infants > 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                </div>
                
                <Divider />
                
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email de contacto</p>
                    <p className="font-semibold">{booking.contactInfo.email}</p>
                  </div>
                </div>
                
                <Divider />
                
                <div className="flex items-start gap-3">
                  <Phone size={20} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-semibold">{booking.contactInfo.phone}</p>
                  </div>
                </div>
                
                <Divider />
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-3xl font-black text-primary">${booking.pricing.total.toLocaleString()}</span>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Estado de pago */}
          <Card className="mb-6">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1">Estado del Pago</p>
                  <p className="text-sm text-gray-600">Un agente se pondrá en contacto contigo</p>
                </div>
                <Chip color="warning" variant="flat">Pendiente</Chip>
              </div>
            </CardBody>
          </Card>
          
          {/* Próximos pasos */}
          <Card className="mb-6">
            <CardBody className="p-6">
              <h3 className="font-bold text-lg mb-4">Próximos Pasos</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-semibold">Confirmación por email</p>
                    <p className="text-sm text-gray-600">Recibirás un email de confirmación en {booking.contactInfo.email}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-semibold">Contacto de nuestro agente</p>
                    <p className="text-sm text-gray-600">Un agente se comunicará contigo en las próximas 24 horas</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-semibold">Completar el pago</p>
                    <p className="text-sm text-gray-600">El agente te ayudará a completar el proceso de pago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <p className="font-semibold">Confirmación final</p>
                    <p className="text-sm text-gray-600">Recibirás todos los documentos de tu viaje</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              color="primary"
              size="lg"
              className="flex-1"
              startContent={<Home size={20} />}
              onPress={() => router.push('/')}
            >
              Volver al Inicio
            </Button>
            <Button
              variant="bordered"
              size="lg"
              className="flex-1"
              startContent={<Download size={20} />}
              isDisabled
            >
              Descargar Confirmación
            </Button>
          </div>
          
          {/* Nota de ayuda */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-blue-900">
              ¿Tienes preguntas? Contáctanos al <strong>+52 123 456 7890</strong> o <strong>soporte@tuagencia.com</strong>
            </p>
          </div>
        </div>
      </div>
    </SearchLayout>
  )
}
