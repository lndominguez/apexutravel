'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Card, CardBody, Link } from '@heroui/react'
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
          setError('Email o contraseña incorrectos')
        } else if (result.error === 'Configuration') {
          setError('Error de configuración del sistema')
        } else {
          setError('Error al iniciar sesión')
        }
      } else if (result?.ok) {
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 50%, #0c3f5b 100%)'
    }}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#ec9c12]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f1c203]/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
        <CardBody className="p-8 sm:p-10">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{
              background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 100%)'
            }}>
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#0c3f5b' }}>
              Bienvenido
            </h1>
            <p className="text-gray-600">
              Inicia sesión en ApexuTravel
            </p>
          </div>

          {/* Success message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              placeholder="tu-email@ejemplo.com"
              value={email}
              onValueChange={setEmail}
              startContent={<Mail className="w-4 h-4 text-gray-400" />}
              variant="bordered"
              size="lg"
              isRequired
              isDisabled={isLoading}
              classNames={{
                input: 'text-base',
                inputWrapper: 'border-gray-300 hover:border-[#0c3f5b] focus-within:!border-[#0c3f5b]'
              }}
            />

            <div className="space-y-2">
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
                    tabIndex={-1}
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
                size="lg"
                isRequired
                isDisabled={isLoading}
                classNames={{
                  input: 'text-base',
                  inputWrapper: 'border-gray-300 hover:border-[#0c3f5b] focus-within:!border-[#0c3f5b]'
                }}
              />
              
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium"
                  style={{ color: '#ec9c12' }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">
                  {error}
                </span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 100%)'
              }}
              isLoading={isLoading}
              isDisabled={!email || !password}
              endContent={!isLoading && <ArrowRight className="w-5 h-5" />}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              © 2024 ApexuTravel. Todos los derechos reservados.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
