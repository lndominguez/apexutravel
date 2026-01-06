'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardBody, CardHeader, Divider } from '@heroui/react'
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const toggleVisibility = () => setIsVisible(!isVisible)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password: password,
        redirect: false,
      })

      if (result?.error) {
        console.error('Login error:', result.error)
        if (result.error === 'CredentialsSignin') {
          setError('Email o contraseña incorrectos. Verifica tus credenciales.')
        } else if (result.error === 'Configuration') {
          setError('Error de configuración. Contacta al administrador.')
        } else {
          setError('Error al iniciar sesión. Intenta nuevamente.')
        }
      } else if (result?.ok) {
        // Login exitoso - redirigir al dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="flex flex-col gap-3 pb-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Iniciar Sesión
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Accede a tu panel de administración
            </p>
          </div>
        </CardHeader>
        
        <CardBody className="space-y-6">
          {/* Credenciales de prueba */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Credenciales de prueba
              </span>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Email:</strong> admin@test.com</p>
              <p><strong>Contraseña:</strong> admin123</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="Ingresa tu email"
              value={email}
              onValueChange={setEmail}
              startContent={<Mail className="w-4 h-4 text-gray-400" />}
              variant="bordered"
              isRequired
              isDisabled={isLoading}
            />

            <Input
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={password}
              onValueChange={setPassword}
              startContent={<Lock className="w-4 h-4 text-gray-400" />}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                >
                  {isVisible ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              }
              type={isVisible ? "text" : "password"}
              variant="bordered"
              isRequired
              isDisabled={isLoading}
            />

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </span>
              </div>
            )}

            <Button
              type="submit"
              color="primary"
              size="lg"
              className="w-full font-semibold"
              isLoading={isLoading}
              isDisabled={!email || !password}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <Divider />

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Problemas para acceder?{' '}
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Contacta al administrador
              </span>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
