'use client'

import { useRouter } from 'next/navigation'
import { Button, Card, CardBody, Link } from '@heroui/react'
import { Shield, Mail, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 50%, #0c3f5b 100%)'
    }}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#ec9c12]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f1c203]/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
        <CardBody className="p-8 sm:p-10 text-center">
          {/* Logo/Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{
              background: 'linear-gradient(135deg, #ec9c12 0%, #f59e0b 100%)'
            }}>
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#0c3f5b' }}>
              Registro por Invitación
            </h1>
            <p className="text-gray-600">
              El registro público está desactivado
            </p>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Solo por Invitación</h3>
                <p className="text-sm text-blue-800">
                  El registro de nuevas cuentas solo está disponible mediante invitación del administrador.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>¿Recibiste una invitación?</strong>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Revisa tu email y haz clic en el enlace de invitación para completar tu registro.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>¿Necesitas acceso?</strong>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Contacta con el administrador del sistema para solicitar una invitación.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">¿Ya tienes cuenta?</span>
            </div>
          </div>

          {/* Login Link */}
          <Button
            size="lg"
            variant="bordered"
            className="w-full font-semibold"
            style={{
              borderColor: '#0c3f5b',
              color: '#0c3f5b'
            }}
            onPress={() => router.push('/auth/login')}
            startContent={<ArrowLeft className="w-5 h-5" />}
          >
            Volver al Login
          </Button>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              © 2024 ApexuTravel. Todos los derechos reservados.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
