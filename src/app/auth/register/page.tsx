'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardBody, CardHeader, Link, Select, SelectItem } from '@heroui/react'
import { Eye, EyeOff } from 'lucide-react'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'

// Tipos para los parámetros de Formik
interface FieldProps {
  field: {
    name: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  }
  meta: {
    touched: boolean
    error: string | undefined
  }
}

interface SelectFieldProps {
  field: {
    name: string
    value: string
    onChange: (...args: unknown[]) => void
    onBlur: (...args: unknown[]) => void
  }
  meta: {
    touched: boolean
    error: string | undefined
  }
}

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required('El nombre es requerido'),
  lastName: Yup.string().required('El apellido es requerido'),
  email: Yup.string().email('Email inválido').required('El email es requerido'),
  password: Yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es requerida'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), ''], 'Las contraseñas deben coincidir')
    .required('Confirma tu contraseña'),
  phone: Yup.string().optional(),
  role: Yup.string().oneOf(['agent', 'manager'], 'Rol inválido').required('El rol es requerido')
})

export default function RegisterPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const toggleVisibility = () => setIsVisible(!isVisible)
  const toggleVisibilityConfirm = () => setIsVisibleConfirm(!isVisibleConfirm)

  const handleSubmit = async (values: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
    phone?: string
    role: string
  }) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email.toLowerCase(),
          password: values.password,
          phone: values.phone || undefined,
          role: values.role
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al crear la cuenta')
      } else {
        setSuccess('¡Cuenta creada exitosamente! Redirigiendo al login...')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch {
      setError('Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center pb-0">
          <h1 className="text-2xl font-bold text-center">CRM Travel</h1>
          <p className="text-gray-600 text-center">Crea tu cuenta</p>
        </CardHeader>
        <CardBody className="pt-6">
          <Formik
            initialValues={{
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              confirmPassword: '',
              phone: '',
              role: 'agent'
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field name="firstName">
                    {({ field, meta }: FieldProps) => (
                      <Input
                        {...field}
                      label="Nombre"
                      placeholder="Juan"
                      variant="bordered"
                      isInvalid={meta.touched && !!meta.error}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    />
                    )}
                  </Field>

                  <Field name="lastName">
                    {({ field, meta }: FieldProps) => (
                      <Input
                        {...field}
                        label="Apellido"
                        placeholder="Pérez"
                        variant="bordered"
                        isInvalid={meta.touched && !!meta.error}
                        errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      />
                    )}
                  </Field>
                </div>

                <Field name="email">
                  {({ field, meta }: FieldProps) => (
                    <Input
                      {...field}
                      type="email"
                      label="Email"
                      placeholder="tu@email.com"
                      variant="bordered"
                      isInvalid={meta.touched && !!meta.error}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    />
                  )}
                </Field>

                <Field name="phone">
                  {({ field, meta }: FieldProps) => (
                    <Input
                      {...field}
                      type="tel"
                      label="Teléfono (opcional)"
                      placeholder="+52 123 456 7890"
                      variant="bordered"
                      isInvalid={meta.touched && !!meta.error}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    />
                  )}
                </Field>

                <Field name="role">
                  {({ field, meta }: SelectFieldProps) => (
                    <Select
                      {...field}
                      label="Rol"
                      placeholder="Selecciona tu rol"
                      variant="bordered"
                      isInvalid={meta.touched && !!meta.error}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    >
                      <SelectItem key="agent">
                        Agente de Ventas
                      </SelectItem>
                      <SelectItem key="manager">
                        Gerente
                      </SelectItem>
                    </Select>
                  )}
                </Field>

                <Field name="password">
                  {({ field, meta }: FieldProps) => (
                    <Input
                      {...field}
                      label="Contraseña"
                      placeholder="Mínimo 6 caracteres"
                      variant="bordered"
                      type={isVisible ? 'text' : 'password'}
                      isInvalid={meta.touched && !!meta.error}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      endContent={
                        <button
                          className="focus:outline-none"
                          type="button"
                          onClick={toggleVisibility}
                          aria-label="toggle password visibility"
                        >
                          {isVisible ? (
                            <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                          ) : (
                            <Eye className="text-2xl text-default-400 pointer-events-none" />
                          )}
                        </button>
                      }
                    />
                  )}
                </Field>

                <Field name="confirmPassword">
                  {({ field, meta }: FieldProps) => (
                    <Input
                      {...field}
                      label="Confirmar Contraseña"
                      placeholder="Repite tu contraseña"
                      variant="bordered"
                      type={isVisibleConfirm ? 'text' : 'password'}
                      isInvalid={meta.touched && !!meta.error}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      endContent={
                        <button
                          className="focus:outline-none"
                          type="button"
                          onClick={toggleVisibilityConfirm}
                          aria-label="toggle confirm password visibility"
                        >
                          {isVisibleConfirm ? (
                            <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                          ) : (
                            <Eye className="text-2xl text-default-400 pointer-events-none" />
                          )}
                        </button>
                      }
                    />
                  )}
                </Field>

                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-green-500 text-sm text-center">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  color="primary"
                  fullWidth
                  isLoading={isSubmitting || isLoading}
                  className="font-semibold"
                >
                  Crear Cuenta
                </Button>
              </Form>
            )}
          </Formik>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
