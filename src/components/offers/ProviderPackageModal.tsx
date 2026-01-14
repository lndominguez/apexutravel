'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  RadioGroup,
  Radio
} from '@heroui/react'
import { Package, DollarSign, Building2, Plus, Plane, Bus, Activity } from 'lucide-react'
import { useInventory } from '@/swr'

interface ProviderPackageModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  packageData?: any
}

export default function ProviderPackageModal({
  isOpen,
  onClose,
  onSubmit,
  packageData
}: ProviderPackageModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [destination, setDestination] = useState('')
  const [supplier, setSupplier] = useState('')
  const [category, setCategory] = useState('')
  const [days, setDays] = useState(3)
  const [nights, setNights] = useState(2)
  
  // Items del inventario
  const [selectedHotelId, setSelectedHotelId] = useState('')
  const [flightIncluded, setFlightIncluded] = useState(false)
  const [transportIncluded, setTransportIncluded] = useState<'no' | 'oneway' | 'return' | 'both'>('no')
  const [activities, setActivities] = useState<string[]>([])
  const [newActivity, setNewActivity] = useState('')
  
  // Precios
  const [priceAdult, setPriceAdult] = useState(0)
  const [priceChild, setPriceChild] = useState(0)
  const [priceInfant, setPriceInfant] = useState(0)
  
  // Markup opcional
  const [markup, setMarkup] = useState(0)
  
  // Cargar solo hoteles del inventario
  const { inventory: hotels } = useInventory({ resourceType: 'Hotel', status: 'active' })

  useEffect(() => {
    if (packageData) {
      setName(packageData.name || '')
      setCode(packageData.code || '')
      setDescription(packageData.description || '')
      setDestination(packageData.destination || '')
      setSupplier(packageData.supplier || '')
      setCategory(packageData.category || '')
      setDays(packageData.duration?.days || 3)
      setNights(packageData.duration?.nights || 2)
      setSelectedHotelId(packageData.hotelInventoryId || '')
      setFlightIncluded(packageData.flightIncluded || false)
      setTransportIncluded(packageData.transportIncluded || 'no')
      setActivities(packageData.activities || [])
      setPriceAdult(packageData.pricing?.adult || 0)
      setPriceChild(packageData.pricing?.child || 0)
      setPriceInfant(packageData.pricing?.infant || 0)
      setMarkup(packageData.markup || 0)
    } else {
      handleReset()
    }
  }, [packageData, isOpen])

  const handleReset = () => {
    setName('')
    setCode('')
    setDescription('')
    setDestination('')
    setSupplier('')
    setCategory('')
    setDays(3)
    setNights(2)
    setSelectedHotelId('')
    setFlightIncluded(false)
    setTransportIncluded('no')
    setActivities([])
    setNewActivity('')
    setPriceAdult(0)
    setPriceChild(0)
    setPriceInfant(0)
    setMarkup(0)
  }

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      setActivities([...activities, newActivity.trim()])
      setNewActivity('')
    }
  }

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const finalPriceAdult = priceAdult * (1 + markup / 100)
    const finalPriceChild = priceChild * (1 + markup / 100)
    const finalPriceInfant = priceInfant * (1 + markup / 100)

    const data = {
      type: 'PROVIDER',
      name,
      code,
      description,
      destination,
      supplier,
      category,
      duration: {
        days,
        nights
      },
      hotelInventoryId: selectedHotelId || undefined,
      flightIncluded,
      transportIncluded,
      activities: activities.length > 0 ? activities : undefined,
      pricing: {
        adult: priceAdult,
        child: priceChild,
        infant: priceInfant
      },
      finalPricing: {
        adult: finalPriceAdult,
        child: finalPriceChild,
        infant: finalPriceInfant
      },
      markup,
      status: 'draft'
    }

    onSubmit(data)
    handleReset()
  }

  const isValid = name && destination && priceAdult > 0 && selectedHotelId

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <Package className="text-primary" size={24} />
              {packageData ? 'Editar Paquete de Proveedor' : 'Nuevo Paquete de Proveedor'}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {/* Información básica */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Nombre del Paquete"
                    placeholder="Ej: Cancún Todo Incluido 3 Días"
                    value={name}
                    onValueChange={setName}
                    isRequired
                    startContent={<Package size={18} />}
                  />
                  <Input
                    label="Código"
                    placeholder="PKG-001"
                    value={code}
                    onValueChange={setCode}
                  />
                </div>

                <Textarea
                  label="Descripción"
                  placeholder="Describe el paquete..."
                  value={description}
                  onValueChange={setDescription}
                  minRows={3}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Destino"
                    placeholder="Ej: Cancún, México"
                    value={destination}
                    onValueChange={setDestination}
                    isRequired
                    startContent={<Building2 size={18} />}
                  />
                  <Input
                    label="Proveedor"
                    placeholder="Nombre del proveedor"
                    value={supplier}
                    onValueChange={setSupplier}
                  />
                </div>

                <Select
                  label="Categoría"
                  placeholder="Selecciona una categoría"
                  selectedKeys={category ? [category] : []}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <SelectItem key="beach">Playa</SelectItem>
                  <SelectItem key="adventure">Aventura</SelectItem>
                  <SelectItem key="cultural">Cultural</SelectItem>
                  <SelectItem key="romantic">Romántico</SelectItem>
                  <SelectItem key="family">Familiar</SelectItem>
                  <SelectItem key="luxury">Lujo</SelectItem>
                  <SelectItem key="business">Negocios</SelectItem>
                  <SelectItem key="wellness">Bienestar</SelectItem>
                  <SelectItem key="cruise">Crucero</SelectItem>
                </Select>

                {/* Duración */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    label="Días"
                    value={String(days)}
                    onValueChange={(val) => setDays(parseInt(val) || 0)}
                    min={1}
                  />
                  <Input
                    type="number"
                    label="Noches"
                    value={String(nights)}
                    onValueChange={(val) => setNights(parseInt(val) || 0)}
                    min={0}
                  />
                </div>

                {/* Componentes del Inventario */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4 text-lg">Componentes del Paquete</h3>
                  
                  {/* Hotel - REQUERIDO */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Building2 size={18} className="text-primary" />
                      Hotel (Requerido)
                    </h4>
                    <Select
                      label="Selecciona un hotel del inventario"
                      placeholder="Buscar hotel..."
                      selectedKeys={selectedHotelId ? [selectedHotelId] : []}
                      onChange={(e) => setSelectedHotelId(e.target.value)}
                      isRequired
                    >
                      {hotels.map((hotel: any) => (
                        <SelectItem key={hotel._id}>
                          {hotel.resource?.name || 'Hotel sin nombre'}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Vuelo - OPCIONAL */}
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={flightIncluded}
                        onChange={(e) => setFlightIncluded(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Plane size={18} className="text-primary" />
                      <span className="font-semibold">Vuelo incluido</span>
                    </label>
                  </div>

                  {/* Transporte - OPCIONAL */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Bus size={18} className="text-primary" />
                      Transporte
                    </h4>
                    <RadioGroup
                      value={transportIncluded}
                      onValueChange={(val) => setTransportIncluded(val as 'no' | 'oneway' | 'return' | 'both')}
                      orientation="horizontal"
                    >
                      <Radio value="no">No incluido</Radio>
                      <Radio value="oneway">Solo ida</Radio>
                      <Radio value="return">Solo vuelta</Radio>
                      <Radio value="both">Ambas rutas</Radio>
                    </RadioGroup>
                  </div>

                  {/* Actividades - OPCIONALES */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Activity size={18} className="text-primary" />
                      Actividades Incluidas (Opcional)
                    </h4>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ej: Tour a ruinas mayas, Snorkel"
                          value={newActivity}
                          onValueChange={setNewActivity}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddActivity()}
                          size="sm"
                        />
                        <Button
                          color="primary"
                          size="sm"
                          isIconOnly
                          onPress={handleAddActivity}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      {activities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {activities.map((activity, idx) => (
                            <Chip
                              key={idx}
                              onClose={() => handleRemoveActivity(idx)}
                              variant="flat"
                              color="warning"
                              size="sm"
                            >
                              {activity}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Precios del proveedor */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign size={18} className="text-primary" />
                    Precios del Proveedor (Costo)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      label="Adulto"
                      value={String(priceAdult)}
                      onValueChange={(val) => setPriceAdult(parseFloat(val) || 0)}
                      min={0}
                      step={0.01}
                      isRequired
                      startContent={<span className="text-sm">$</span>}
                      endContent={<span className="text-xs text-gray-500">USD</span>}
                    />
                    <Input
                      type="number"
                      label="Niño"
                      value={String(priceChild)}
                      onValueChange={(val) => setPriceChild(parseFloat(val) || 0)}
                      min={0}
                      step={0.01}
                      startContent={<span className="text-sm">$</span>}
                      endContent={<span className="text-xs text-gray-500">USD</span>}
                    />
                    <Input
                      type="number"
                      label="Infante"
                      value={String(priceInfant)}
                      onValueChange={(val) => setPriceInfant(parseFloat(val) || 0)}
                      min={0}
                      step={0.01}
                      startContent={<span className="text-sm">$</span>}
                      endContent={<span className="text-xs text-gray-500">USD</span>}
                    />
                  </div>
                </div>

                {/* Markup */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Markup (Opcional)</h3>
                  <Input
                    type="number"
                    label="Porcentaje de ganancia"
                    value={String(markup)}
                    onValueChange={(val) => setMarkup(parseFloat(val) || 0)}
                    min={0}
                    step={0.1}
                    endContent={<span className="text-xs text-gray-500">%</span>}
                  />
                </div>

                {/* Precios finales */}
                {markup > 0 && (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 text-success">Precios de Venta al Público</h3>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Adulto</p>
                        <p className="text-lg font-bold text-success">
                          ${(priceAdult * (1 + markup / 100)).toFixed(2)} USD
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Niño</p>
                        <p className="text-lg font-bold text-success">
                          ${(priceChild * (1 + markup / 100)).toFixed(2)} USD
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Infante</p>
                        <p className="text-lg font-bold text-success">
                          ${(priceInfant * (1 + markup / 100)).toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button 
                color="primary" 
                onPress={handleSubmit}
                isDisabled={!isValid}
              >
                {packageData ? 'Actualizar' : 'Crear'} Paquete
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
