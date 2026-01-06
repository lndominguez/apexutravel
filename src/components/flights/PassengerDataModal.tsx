'use client'

import { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Divider } from '@heroui/react'
import { User, Mail, Phone, Calendar } from 'lucide-react'

interface PassengerData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  documentType: string
  documentNumber: string
  nationality: string
}

interface PassengerDataModalProps {
  isOpen: boolean
  onClose: () => void
  passengers: number
  flightNumber: string
  airlineName: string
  onContinue: (passengersData: PassengerData[]) => void
}

const documentTypes = [
  { value: 'passport', label: 'Pasaporte' },
  { value: 'id', label: 'Cédula/DNI' },
  { value: 'license', label: 'Licencia de conducir' }
]

export default function PassengerDataModal({
  isOpen,
  onClose,
  passengers,
  flightNumber,
  airlineName,
  onContinue
}: PassengerDataModalProps) {
  const [passengersData, setPassengersData] = useState<PassengerData[]>(
    Array.from({ length: passengers }, () => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      documentType: 'passport',
      documentNumber: '',
      nationality: ''
    }))
  )

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleInputChange = (index: number, field: keyof PassengerData, value: string) => {
    setPassengersData(prev => {
      const newData = [...prev]
      newData[index] = { ...newData[index], [field]: value }
      return newData
    })
    
    // Limpiar error del campo
    const errorKey = `${index}-${field}`
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    
    passengersData.forEach((passenger, index) => {
      if (!passenger.firstName.trim()) {
        newErrors[`${index}-firstName`] = 'Nombre requerido'
      }
      if (!passenger.lastName.trim()) {
        newErrors[`${index}-lastName`] = 'Apellido requerido'
      }
      if (index === 0 && !passenger.email.trim()) {
        newErrors[`${index}-email`] = 'Email requerido para el pasajero principal'
      }
      if (index === 0 && passenger.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email)) {
        newErrors[`${index}-email`] = 'Email inválido'
      }
      if (!passenger.documentNumber.trim()) {
        newErrors[`${index}-documentNumber`] = 'Número de documento requerido'
      }
      if (!passenger.dateOfBirth) {
        newErrors[`${index}-dateOfBirth`] = 'Fecha de nacimiento requerida'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validateForm()) {
      onContinue(passengersData)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-background",
        header: "border-b border-divider",
        body: "py-6",
        footer: "border-t border-divider"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold">Datos de pasajeros</h3>
          <p className="text-sm text-foreground/60 font-normal">
            {airlineName} • Vuelo {flightNumber}
          </p>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {passengersData.map((passenger, index) => (
              <div key={index} className="border border-divider rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User size={20} className="text-primary" />
                  Pasajero {index + 1}
                  {index === 0 && (
                    <span className="text-xs font-normal text-foreground/60 ml-2">
                      (Contacto principal)
                    </span>
                  )}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <Input
                    label="Nombre"
                    placeholder="Ingresa el nombre"
                    value={passenger.firstName}
                    onValueChange={(value) => handleInputChange(index, 'firstName', value)}
                    isInvalid={!!errors[`${index}-firstName`]}
                    errorMessage={errors[`${index}-firstName`]}
                    isRequired
                    variant="bordered"
                  />
                  
                  {/* Apellido */}
                  <Input
                    label="Apellido"
                    placeholder="Ingresa el apellido"
                    value={passenger.lastName}
                    onValueChange={(value) => handleInputChange(index, 'lastName', value)}
                    isInvalid={!!errors[`${index}-lastName`]}
                    errorMessage={errors[`${index}-lastName`]}
                    isRequired
                    variant="bordered"
                  />
                  
                  {/* Email (solo pasajero principal) */}
                  {index === 0 && (
                    <Input
                      label="Email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={passenger.email}
                      onValueChange={(value) => handleInputChange(index, 'email', value)}
                      isInvalid={!!errors[`${index}-email`]}
                      errorMessage={errors[`${index}-email`]}
                      isRequired
                      variant="bordered"
                      startContent={<Mail size={16} className="text-foreground/50" />}
                    />
                  )}
                  
                  {/* Teléfono (solo pasajero principal) */}
                  {index === 0 && (
                    <Input
                      label="Teléfono"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={passenger.phone}
                      onValueChange={(value) => handleInputChange(index, 'phone', value)}
                      variant="bordered"
                      startContent={<Phone size={16} className="text-foreground/50" />}
                    />
                  )}
                  
                  {/* Fecha de nacimiento */}
                  <Input
                    label="Fecha de nacimiento"
                    type="date"
                    value={passenger.dateOfBirth}
                    onValueChange={(value) => handleInputChange(index, 'dateOfBirth', value)}
                    isInvalid={!!errors[`${index}-dateOfBirth`]}
                    errorMessage={errors[`${index}-dateOfBirth`]}
                    isRequired
                    variant="bordered"
                    startContent={<Calendar size={16} className="text-foreground/50" />}
                  />
                  
                  {/* Tipo de documento */}
                  <Select
                    label="Tipo de documento"
                    placeholder="Selecciona el tipo"
                    selectedKeys={[passenger.documentType]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string
                      handleInputChange(index, 'documentType', value)
                    }}
                    isRequired
                    variant="bordered"
                  >
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>
                  
                  {/* Número de documento */}
                  <Input
                    label="Número de documento"
                    placeholder="Ingresa el número"
                    value={passenger.documentNumber}
                    onValueChange={(value) => handleInputChange(index, 'documentNumber', value)}
                    isInvalid={!!errors[`${index}-documentNumber`]}
                    errorMessage={errors[`${index}-documentNumber`]}
                    isRequired
                    variant="bordered"
                  />
                  
                  {/* Nacionalidad */}
                  <Input
                    label="Nacionalidad"
                    placeholder="Ej: Mexicana"
                    value={passenger.nationality}
                    onValueChange={(value) => handleInputChange(index, 'nationality', value)}
                    variant="bordered"
                  />
                </div>
                
                {index < passengersData.length - 1 && (
                  <Divider className="mt-4" />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Importante:</strong> Asegúrate de que los nombres coincidan exactamente con los documentos de identidad que usarás para viajar.
            </p>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleContinue}>
            Continuar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
