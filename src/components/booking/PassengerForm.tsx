'use client'

import { useState } from 'react'
import { Card, CardBody, Input, Select, SelectItem, Button, Divider } from '@heroui/react'
import { User, Plus, Trash2 } from 'lucide-react'
import { PassengerInfo, ContactInfo } from '@/types/booking'

interface PassengerFormProps {
  passengers: PassengerInfo[]
  contact: ContactInfo
  onPassengersChange: (passengers: PassengerInfo[]) => void
  onContactChange: (contact: ContactInfo) => void
  onContinue: () => void
}

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss']
const COUNTRIES = ['US', 'MX', 'CA', 'GB', 'ES', 'FR', 'DE', 'IT']

export default function PassengerForm({
  passengers,
  contact,
  onPassengersChange,
  onContactChange,
  onContinue
}: PassengerFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    const updated = [...passengers]
    updated[index] = { ...updated[index], [field]: value }
    onPassengersChange(updated)
  }

  const addPassenger = () => {
    const newPassenger: PassengerInfo = {
      id: `passenger-${Date.now()}`,
      type: 'adult',
      title: 'Mr',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: 'US'
    }
    onPassengersChange([...passengers, newPassenger])
  }

  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      onPassengersChange(passengers.filter((_, i) => i !== index))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    passengers.forEach((p, idx) => {
      if (!p.firstName.trim()) newErrors[`${idx}-firstName`] = 'Required'
      if (!p.lastName.trim()) newErrors[`${idx}-lastName`] = 'Required'
      if (!p.dateOfBirth) newErrors[`${idx}-dob`] = 'Required'
    })

    if (!contact.email.trim()) newErrors['contact-email'] = 'Required'
    if (!contact.phone.trim()) newErrors['contact-phone'] = 'Required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validate()) {
      onContinue()
    }
  }

  return (
    <div className="space-y-6">
      {/* Passengers */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Passenger details</h2>
        <p className="text-sm text-gray-600">
          Enter the required information for each traveler and be sure that it exactly matches the government-issued ID presented at the airport.
        </p>

        {passengers.map((passenger, index) => (
          <Card key={passenger.id}>
            <CardBody className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold">
                    Passenger {index + 1} · {passenger.type === 'adult' ? 'Adult' : passenger.type === 'child' ? 'Child' : 'Infant'}
                  </h3>
                </div>
                {passengers.length > 1 && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => removePassenger(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select
                  label="Title"
                  selectedKeys={passenger.title ? [passenger.title] : []}
                  onChange={(e) => updatePassenger(index, 'title', e.target.value as any)}
                  size="sm"
                >
                  {TITLES.map(title => (
                    <SelectItem key={title}>
                      {title}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  label="First name"
                  placeholder="As shown on ID"
                  value={passenger.firstName}
                  onChange={(e) => updatePassenger(index, 'firstName', e.target.value)}
                  isInvalid={!!errors[`${index}-firstName`]}
                  errorMessage={errors[`${index}-firstName`]}
                  size="sm"
                  classNames={{ base: 'md:col-span-1.5' }}
                />

                <Input
                  label="Last name"
                  placeholder="As shown on ID"
                  value={passenger.lastName}
                  onChange={(e) => updatePassenger(index, 'lastName', e.target.value)}
                  isInvalid={!!errors[`${index}-lastName`]}
                  errorMessage={errors[`${index}-lastName`]}
                  size="sm"
                  classNames={{ base: 'md:col-span-1.5' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="date"
                  label="Date of birth"
                  value={passenger.dateOfBirth}
                  onChange={(e) => updatePassenger(index, 'dateOfBirth', e.target.value)}
                  isInvalid={!!errors[`${index}-dob`]}
                  errorMessage={errors[`${index}-dob`]}
                  size="sm"
                />

                <Select
                  label="Nationality"
                  selectedKeys={[passenger.nationality]}
                  onChange={(e) => updatePassenger(index, 'nationality', e.target.value)}
                  size="sm"
                >
                  {COUNTRIES.map(country => (
                    <SelectItem key={country}>
                      {country}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  label="Passport number (optional)"
                  placeholder="123456789"
                  value={passenger.passportNumber || ''}
                  onChange={(e) => updatePassenger(index, 'passportNumber', e.target.value)}
                  size="sm"
                />
              </div>
            </CardBody>
          </Card>
        ))}

        <Button
          variant="bordered"
          startContent={<Plus className="w-4 h-4" />}
          onPress={addPassenger}
        >
          Add another passenger
        </Button>
      </div>

      <Divider />

      {/* Contact Information */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Contact information</h2>
        <p className="text-sm text-gray-600">
          Receive booking confirmation and updates
        </p>

        <Card>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="email"
                label="Email address"
                placeholder="your@email.com"
                value={contact.email}
                onChange={(e) => onContactChange({ ...contact, email: e.target.value })}
                isInvalid={!!errors['contact-email']}
                errorMessage={errors['contact-email']}
                size="sm"
              />

              <div className="flex gap-2">
                <Select
                  label="Code"
                  selectedKeys={[contact.countryCode || '+1']}
                  onChange={(e) => onContactChange({ ...contact, countryCode: e.target.value })}
                  size="sm"
                  className="w-28"
                >
                  <SelectItem key="+1">+1</SelectItem>
                  <SelectItem key="+52">+52</SelectItem>
                  <SelectItem key="+44">+44</SelectItem>
                  <SelectItem key="+34">+34</SelectItem>
                </Select>

                <Input
                  type="tel"
                  label="Phone number"
                  placeholder="555-1234"
                  value={contact.phone}
                  onChange={(e) => onContactChange({ ...contact, phone: e.target.value })}
                  isInvalid={!!errors['contact-phone']}
                  errorMessage={errors['contact-phone']}
                  size="sm"
                  className="flex-1"
                />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          color="primary"
          size="lg"
          onPress={handleContinue}
          className="px-12"
        >
          Continue to baggage
        </Button>
      </div>
    </div>
  )
}
