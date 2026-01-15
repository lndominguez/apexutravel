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
  Card,
  CardBody,
  Chip
} from '@heroui/react'
import { Package, Hotel, Plane, DollarSign, ArrowLeft, ArrowRight, Calendar, Star, Bus, MapPin } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import ItemSelectionModal from './ItemSelectionModal'

interface UnifiedOfferModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  offerData?: any
  mode?: 'create' | 'edit'
}

export default function UnifiedOfferModal({
  isOpen,
  onClose,
  onSave,
  offerData,
  mode = 'create'
}: UnifiedOfferModalProps) {
  const notification = useNotification()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isItemSelectionOpen, setIsItemSelectionOpen] = useState(false)

  // Helper para calcular precio con markup
  const applyMarkup = (basePrice: number) => {
    if (markupType === 'percentage') {
      return basePrice + (basePrice * markupValue / 100)
    }
    return basePrice + markupValue
  }

  // PASO 1: Tipo de Oferta
  const [offerType, setOfferType] = useState<'package' | 'hotel' | 'flight'>('package')

  // PASO 2: Items y Pricing
  const [items, setItems] = useState<any[]>([])
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const [resourceData, setResourceData] = useState<any>(null)
  const [loadingResource, setLoadingResource] = useState(false)
  const [pricingCalculation, setPricingCalculation] = useState<'perNight' | 'fullPackage'>('perNight')
  const [nights, setNights] = useState(3)
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage')
  const [markupValue, setMarkupValue] = useState(10)
  const [hasValidity, setHasValidity] = useState(false)
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')

  // Calcular días automáticamente
  const days = nights + 1

  // PASO 3: Detalles finales
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [isLoadingOfferData, setIsLoadingOfferData] = useState(false)
  const [coverImage, setCoverImage] = useState<string>('')

  // Fetch del recurso (hotel) cuando se selecciona un item
  useEffect(() => {
    const fetchResource = async () => {
      if (selectedItemIndex === null || !items[selectedItemIndex]) {
        setResourceData(null)
        return
      }

      const item = items[selectedItemIndex]
      const resourceId = item.hotelInfo.resourceId

      if (!resourceId) {
        setResourceData(null)
        return
      }

      setLoadingResource(true)
      try {
        const response = await fetch(`/api/resources/hotels/${resourceId}`)
        if (response.ok) {
          const result = await response.json()
          console.log("DATA_",result.data)
          setResourceData(result.data)
        } else {
          console.error('Error fetching hotel resource')
          setResourceData(null)
        }
      } catch (error) {
        console.error('Error fetching hotel resource:', error)
        setResourceData(null)
      } finally {
        setLoadingResource(false)
      }
    }

    fetchResource()
  }, [selectedItemIndex, items])

  // Inicializar coverImage con la primera foto del hotel cuando se carga resourceData
  useEffect(() => {
    if (resourceData && resourceData.photos && resourceData.photos.length > 0 && !coverImage) {
      setCoverImage(resourceData.photos[0])
    }
  }, [resourceData])

  // Establecer pricingCalculation automáticamente según el tipo de oferta
  useEffect(() => {
    if (offerType === 'package') {
      setPricingCalculation('fullPackage')
    } else if (offerType === 'hotel') {
      setPricingCalculation('perNight')
    }
  }, [offerType])

  useEffect(() => {
    const normalizeOfferItems = (rawItems: any[]) => {
      return (rawItems || []).map((item: any) => {
        const inventoryId = typeof item.inventoryId === 'object'
          ? (item.inventoryId?._id || item.inventoryId)
          : item.inventoryId

        if (item.resourceType === 'Hotel') {
          const inventory = item.inventory || item.inventoryId
          const hotelResource = item.hotelResource || item.inventoryId?.resource

          return {
            ...item,
            inventoryId,
            mandatory: item.mandatory ?? true,
            hotelInfo: {
              resourceId: item.hotelInfo?.resourceId || hotelResource?._id || inventory?.resource?._id || inventory?.resource,
              name: item.hotelInfo?.name || hotelResource?.name || inventory?.resource?.name || item.inventoryName,
              stars: item.hotelInfo?.stars || hotelResource?.stars || inventory?.resource?.stars || 0,
              location: item.hotelInfo?.location || hotelResource?.location || inventory?.resource?.location || { city: '', country: '' },
              rooms: item.hotelInfo?.rooms || inventory?.rooms || [],
              pricingMode: item.hotelInfo?.pricingMode || inventory?.pricingMode,
              description: item.hotelInfo?.description || hotelResource?.description || inventory?.resource?.description || '',
              amenities: item.hotelInfo?.amenities || hotelResource?.amenities || inventory?.resource?.amenities || []
            }
          }
        }

        if (item.resourceType === 'Transport') {
          const raw = item.transportInfo || item.transportOrActivity || {}
          return {
            ...item,
            inventoryId,
            mandatory: item.mandatory ?? true,
            transportInfo: {
              ...raw,
              basePrice: raw.basePrice ?? raw.pricing?.adult ?? 0
            }
          }
        }

        if (item.resourceType === 'Activity') {
          const raw = item.activityInfo || item.transportOrActivity || {}
          return {
            ...item,
            inventoryId,
            mandatory: item.mandatory ?? true,
            activityInfo: {
              ...raw,
              name: raw.name ?? raw.type ?? item.activityInfo?.name,
              basePrice: raw.basePrice ?? raw.pricing?.adult ?? 0
            }
          }
        }

        return {
          ...item,
          inventoryId,
          mandatory: item.mandatory ?? true
        }
      })
    }

    const fetchFullOfferData = async () => {
      if (!isOpen || !offerData || mode !== 'edit') return

      setIsLoadingOfferData(true)
      try {
        const type = offerData.type || 'package'
        const id = offerData._id
        if (!id) return

        let url = ''
        if (type === 'package') url = `/api/offers/packages/${id}`
        else if (type === 'hotel') url = `/api/offers/hotels/${id}`
        else if (type === 'flight') url = `/api/offers/flights/${id}`
        else if (type === 'transport') url = `/api/offers/transports/${id}`
        else url = ''

        const fullData = url
          ? await (async () => {
              const res = await fetch(url)
              if (!res.ok) return offerData
              const json = await res.json()
              return json.offer || json.package || json.hotel || json
            })()
          : offerData

        setCurrentStep(1)
        setOfferType(fullData.type || 'package')

        const normalizedItems = normalizeOfferItems(fullData.items || [])
        setItems(normalizedItems)
        setSelectedItemIndex(normalizedItems.length > 0 ? 0 : null)

        setNights(fullData.duration?.nights || 3)

        setMarkupType(fullData.markup?.type || 'percentage')
        setMarkupValue(fullData.markup?.value || 10)

        const hasValidDates = fullData.validFrom || fullData.validTo
        setHasValidity(!!hasValidDates && fullData.type !== 'package')
        setValidFrom(fullData.validFrom ? new Date(fullData.validFrom).toISOString().split('T')[0] : '')
        setValidTo(fullData.validTo ? new Date(fullData.validTo).toISOString().split('T')[0] : '')

        setName(fullData.name || '')
        setCode(fullData.code || '')
        setDescription(fullData.description || '')
        setStatus((fullData.status as any) || 'draft')
        setCoverImage(fullData.coverPhoto || '')
      } catch (error) {
        console.error('Error loading offer data for edit:', error)
      } finally {
        setIsLoadingOfferData(false)
      }
    }

    fetchFullOfferData()
  }, [isOpen, offerData, mode])

  const handleClose = () => {
    setCurrentStep(1)
    setOfferType('package')
    setItems([])
    setMarkupType('percentage')
    setMarkupValue(10)
    setHasValidity(false)
    setValidFrom('')
    setValidTo('')
    setName('')
    setCode('')
    setDescription('')
    setStatus('draft')
    setCoverImage('')
    setIsItemSelectionOpen(false)
    onClose()
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (items.length === 0) {
        notification.error('Items requeridos', 'Debes agregar al menos un item')
        return
      }
      setCurrentStep(3)
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleAddItem = (item: any) => {
    setItems([...items, item])
  }

  const handleSave = async () => {
    if (!name.trim()) {
      notification.error('Nombre requerido', 'Debes ingresar un nombre para la oferta')
      return
    }

    // Extraer destino del primer item
    const destination = items[0]?.hotelInfo?.location?.city ||
      items[0]?.flightDetails?.route?.to ||
      'Sin destino'

    setIsSaving(true)

    try {
      // Calcular precio de venta total
      let totalBasePrice = 0
      for (const item of items) {
        if (item.resourceType === 'Hotel' && item.hotelInfo?.rooms && item.hotelInfo.rooms.length > 0) {
          // Buscar precio más barato de habitación doble
          let cheapestPrice = null
          for (const room of item.hotelInfo.rooms) {
            if (room.capacityPrices?.double?.adult) {
              const price = room.capacityPrices.double.adult
              if (cheapestPrice === null || price < cheapestPrice) {
                cheapestPrice = price
              }
            }
          }
          if (cheapestPrice !== null && cheapestPrice > 0) {
            totalBasePrice += cheapestPrice
          }
        }
      }

      // Aplicar markup
      const totalSalePrice = totalBasePrice > 0 ? applyMarkup(totalBasePrice) : 0

      const payload: any = {
        destination,
        type: offerType,
        name,
        code: code || `${offerType.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        description,
        status,
        markup: {
          type: markupType,
          value: markupValue
        },
        items,
        coverPhoto: coverImage || null,
        pricing: {
          currency: 'USD',
          basePrice: totalBasePrice,
          finalPrice: totalSalePrice
        }
      }

      if (offerType === 'package' || offerType === 'hotel') {
        payload.duration = { nights }
      }

      if (hasValidity && offerType !== 'package') {
        payload.validFrom = validFrom ? new Date(validFrom) : undefined
        payload.validTo = validTo ? new Date(validTo) : undefined
      }

      await onSave(payload)
      handleClose()
    } catch (error: any) {
      notification.error('Error', error.message || 'Error al guardar la oferta')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        base: 'max-h-[92vh]',
        body: 'py-4 px-8'
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-4 border-b border-default-200 px-8">
          <h2 className="text-2xl font-bold text-default-900">
            {mode === 'create' ? 'Crear Nueva Oferta' : 'Editar Oferta'}
          </h2>
          <p className="text-sm text-default-500">
            Completa los siguientes pasos para configurar tu oferta
          </p>
        </ModalHeader>

        <ModalBody>
          {/* Indicador de pasos mejorado */}
          <div className="relative mb-6">
            <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
              {/* Paso 1 */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep === 1
                  ? 'bg-primary text-white shadow-lg shadow-primary/50 scale-110'
                  : currentStep > 1
                    ? 'bg-success text-white'
                    : 'bg-default-200 text-default-500'
                  }`}>
                  {currentStep > 1 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : '1'}
                  {currentStep === 1 && (
                    <span className="absolute -inset-1 rounded-full bg-primary/20 animate-ping" />
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium transition-colors ${currentStep === 1 ? 'text-primary' : currentStep > 1 ? 'text-success' : 'text-default-400'
                    }`}>
                    Tipo de Oferta
                  </p>
                </div>
              </div>

              {/* Línea conectora 1-2 */}
              <div className="flex-1 h-0.5 mx-4 mb-4 relative">
                <div className="absolute inset-0 bg-default-200" />
                <div className={`absolute inset-0 bg-gradient-to-r from-success to-primary transition-all duration-500 ${currentStep > 1 ? 'w-full' : 'w-0'
                  }`} />
              </div>

              {/* Paso 2 */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep === 2
                  ? 'bg-primary text-white shadow-lg shadow-primary/50 scale-110'
                  : currentStep > 2
                    ? 'bg-success text-white'
                    : 'bg-default-200 text-default-500'
                  }`}>
                  {currentStep > 2 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : '2'}
                  {currentStep === 2 && (
                    <span className="absolute -inset-1 rounded-full bg-primary/20 animate-ping" />
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium transition-colors ${currentStep === 2 ? 'text-primary' : currentStep > 2 ? 'text-success' : 'text-default-400'
                    }`}>
                    Configuración
                  </p>
                </div>
              </div>

              {/* Línea conectora 2-3 */}
              <div className="flex-1 h-0.5 mx-4 mb-4 relative">
                <div className="absolute inset-0 bg-default-200" />
                <div className={`absolute inset-0 bg-gradient-to-r from-primary to-success transition-all duration-500 ${currentStep > 2 ? 'w-full' : 'w-0'
                  }`} />
              </div>

              {/* Paso 3 */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep === 3
                  ? 'bg-primary text-white shadow-lg shadow-primary/50 scale-110'
                  : 'bg-default-200 text-default-500'
                  }`}>
                  3
                  {currentStep === 3 && (
                    <span className="absolute -inset-1 rounded-full bg-primary/20 animate-ping" />
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium transition-colors ${currentStep === 3 ? 'text-primary' : 'text-default-400'
                    }`}>
                    Detalles Finales
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PASO 1: Tipo de Oferta */}
          {currentStep === 1 && (
            <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-default-900">Selecciona el Tipo de Oferta</h3>
                <p className="text-sm text-default-500">Elige el tipo de producto que deseas crear</p>
              </div>

              <div className="max-w-2xl mx-auto">
                {mode === 'create' ? (
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setOfferType('package')}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${offerType === 'package'
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105'
                        : 'border-default-200 hover:border-primary/30 hover:shadow-lg hover:scale-102'
                        }`}
                    >
                      {offerType === 'package' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${offerType === 'package' ? 'bg-primary/15' : 'bg-default-100 group-hover:bg-primary/10'
                        }`}>
                        <Package size={32} className={`transition-colors ${offerType === 'package' ? 'text-primary' : 'text-default-400 group-hover:text-primary'}`} />
                      </div>
                      <p className={`font-bold text-center text-lg mb-1 transition-colors ${offerType === 'package' ? 'text-primary' : 'text-default-700 group-hover:text-primary'}`}>Paquete</p>
                      <p className="text-xs text-default-500 text-center">
                        Combo completo
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOfferType('hotel')}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${offerType === 'hotel'
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105'
                        : 'border-default-200 hover:border-primary/30 hover:shadow-lg hover:scale-102'
                        }`}
                    >
                      {offerType === 'hotel' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${offerType === 'hotel' ? 'bg-primary/15' : 'bg-default-100 group-hover:bg-primary/10'
                        }`}>
                        <Hotel size={32} className={`transition-colors ${offerType === 'hotel' ? 'text-primary' : 'text-default-400 group-hover:text-primary'}`} />
                      </div>
                      <p className={`font-bold text-center text-lg mb-1 transition-colors ${offerType === 'hotel' ? 'text-primary' : 'text-default-700 group-hover:text-primary'}`}>Hotel</p>
                      <p className="text-xs text-default-500 text-center">
                        Solo alojamiento
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOfferType('flight')}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${offerType === 'flight'
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105'
                        : 'border-default-200 hover:border-primary/30 hover:shadow-lg hover:scale-102'
                        }`}
                    >
                      {offerType === 'flight' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${offerType === 'flight' ? 'bg-primary/15' : 'bg-default-100 group-hover:bg-primary/10'
                        }`}>
                        <Plane size={32} className={`transition-colors ${offerType === 'flight' ? 'text-primary' : 'text-default-400 group-hover:text-primary'}`} />
                      </div>
                      <p className={`font-bold text-center text-lg mb-1 transition-colors ${offerType === 'flight' ? 'text-primary' : 'text-default-700 group-hover:text-primary'}`}>Vuelo</p>
                      <p className="text-xs text-default-500 text-center">
                        Solo transporte aéreo
                      </p>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      disabled
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-default ${offerType === 'package'
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105'
                        : 'border-default-200 bg-default-50 opacity-70'
                        }`}
                    >
                      {offerType === 'package' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${offerType === 'package' ? 'bg-primary/15' : 'bg-default-100'
                        }`}>
                        <Package size={32} className={`transition-colors ${offerType === 'package' ? 'text-primary' : 'text-default-400'}`} />
                      </div>
                      <p className={`font-bold text-center text-lg mb-1 transition-colors ${offerType === 'package' ? 'text-primary' : 'text-default-700'}`}>Paquete</p>
                      <p className="text-xs text-default-500 text-center">Combo completo</p>
                    </button>

                    <button
                      type="button"
                      disabled
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-default ${offerType === 'hotel'
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105'
                        : 'border-default-200 bg-default-50 opacity-70'
                        }`}
                    >
                      {offerType === 'hotel' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${offerType === 'hotel' ? 'bg-primary/15' : 'bg-default-100'
                        }`}>
                        <Hotel size={32} className={`transition-colors ${offerType === 'hotel' ? 'text-primary' : 'text-default-400'}`} />
                      </div>
                      <p className={`font-bold text-center text-lg mb-1 transition-colors ${offerType === 'hotel' ? 'text-primary' : 'text-default-700'}`}>Hotel</p>
                      <p className="text-xs text-default-500 text-center">Solo alojamiento</p>
                    </button>

                    <button
                      type="button"
                      disabled
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-default ${offerType === 'flight'
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105'
                        : 'border-default-200 bg-default-50 opacity-70'
                        }`}
                    >
                      {offerType === 'flight' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${offerType === 'flight' ? 'bg-primary/15' : 'bg-default-100'
                        }`}>
                        <Plane size={32} className={`transition-colors ${offerType === 'flight' ? 'text-primary' : 'text-default-400'}`} />
                      </div>
                      <p className={`font-bold text-center text-lg mb-1 transition-colors ${offerType === 'flight' ? 'text-primary' : 'text-default-700'}`}>Vuelo</p>
                      <p className="text-xs text-default-500 text-center">Solo vuelos</p>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: Items y Pricing - Layout 2 Columnas */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Layout 2 Columnas */}
              <div className="grid grid-cols-12 gap-4">
                {/* COLUMNA IZQUIERDA: Lista de Items */}
                <div className="col-span-4">
                  <Card className="border border-default-200 shadow-sm h-full">
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-sm">Items Seleccionados</h3>
                          <p className="text-xs text-default-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          isIconOnly
                          onPress={() => setIsItemSelectionOpen(true)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </Button>
                      </div>

                      {items.length === 0 ? (
                        <div className="text-center py-8 bg-default-50 rounded-lg border border-dashed border-default-300">
                          <div className="w-12 h-12 mx-auto mb-2 bg-default-200 rounded-full flex items-center justify-center">
                            {offerType === 'package' && <Package size={24} className="text-default-400" />}
                            {offerType === 'hotel' && <Hotel size={24} className="text-default-400" />}
                            {offerType === 'flight' && <Plane size={24} className="text-default-400" />}
                          </div>
                          <p className="text-xs text-default-600 font-medium mb-1">Sin items</p>
                          <p className="text-xs text-default-400">Agrega items para comenzar</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                          {items.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedItemIndex(idx)}
                              className={`w-full text-left p-2.5 rounded-lg border transition-all ${selectedItemIndex === idx
                                ? 'bg-primary/10 border-primary shadow-sm'
                                : 'bg-default-50 border-default-200 hover:border-primary/30 hover:bg-default-100'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded ${selectedItemIndex === idx ? 'bg-primary/20' : 'bg-default-200'}`}>
                                  {item.resourceType === 'Hotel' && <Hotel size={16} className={selectedItemIndex === idx ? 'text-primary' : 'text-default-600'} />}
                                  {item.resourceType === 'Flight' && <Plane size={16} className={selectedItemIndex === idx ? 'text-primary' : 'text-default-600'} />}
                                  {item.resourceType === 'Transport' && <Bus size={16} className={selectedItemIndex === idx ? 'text-primary' : 'text-default-600'} />}
                                  {item.resourceType === 'Activity' && <MapPin size={16} className={selectedItemIndex === idx ? 'text-primary' : 'text-default-600'} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold truncate ${selectedItemIndex === idx ? 'text-primary' : 'text-default-900'}`}>
                                    {item.hotelInfo?.name || item.flightDetails?.route?.from || item.transportInfo?.type || item.activityInfo?.name || 'Item'}
                                  </p>
                                  <p className="text-xs text-default-500 truncate">
                                    {item.resourceType}
                                  </p>
                                </div>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const newItems = items.filter((_, i) => i !== idx)
                                    setItems(newItems)
                                    // Ajustar selectedItemIndex
                                    if (selectedItemIndex === idx) {
                                      setSelectedItemIndex(null)
                                    } else if (selectedItemIndex !== null && selectedItemIndex > idx) {
                                      setSelectedItemIndex(selectedItemIndex - 1)
                                    }
                                  }}
                                  className="min-w-6 w-6 h-6 flex items-center justify-center rounded-md text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>

                {/* COLUMNA DERECHA: Detalle del Item */}
                <div className="col-span-8">
                  <Card className="border border-default-200 shadow-sm h-full">
                    <CardBody className="p-4">
                      {selectedItemIndex === null || !items[selectedItemIndex] ? (
                        <div className="flex items-center justify-center h-full min-h-[400px] bg-default-50 rounded-lg">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 bg-default-200 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-default-600 mb-1">Selecciona un item</p>
                            <p className="text-xs text-default-400">Haz clic en un item de la lista para ver sus detalles</p>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const item = items[selectedItemIndex]
                          return (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                              {/* Contenido según tipo de item */}
                              {item.resourceType === 'Hotel' && (
                                <div className="space-y-4">
                                  {/* Header con Imagen Principal y Overlay de Info */}
                                  {resourceData && resourceData.photos && resourceData.photos.length > 0 && (() => {
                                  // Calcular precio más barato
                                  let cheapestPrice = null
                                  if (item.hotelInfo?.rooms && item.hotelInfo.rooms.length > 0) {
                                    for (const room of item.hotelInfo.rooms) {
                                      if (room.capacityPrices?.double?.adult) {
                                        const price = room.capacityPrices.double.adult
                                        if (cheapestPrice === null || price < cheapestPrice) {
                                          cheapestPrice = price
                                        }
                                      }
                                    }
                                  }
                                  
                                  const displayImage = coverImage || resourceData.photos[0]
                                  
                                  return (
                                    <div className="relative w-full h-64 bg-default-900 rounded-lg overflow-hidden border border-default-200">
                                      {/* Imagen de fondo */}
                                      <img
                                        src={displayImage}
                                        alt={resourceData.name || 'Hotel'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                      />
                                      
                                      {/* Overlay con gradiente */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                      
                                      {/* Información sobre la imagen */}
                                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                        <div className="flex items-end justify-between">
                                          <div className="flex-1">
                                            <Chip size="sm" variant="flat" className="bg-white/20 backdrop-blur-sm text-white mb-2">
                                              {item.resourceType}
                                            </Chip>
                                            <h3 className="font-bold text-2xl text-white mb-1 drop-shadow-lg">
                                              {item.hotelInfo?.name || 'Hotel'}
                                            </h3>
                                            {item.hotelInfo?.location && (
                                              <div className="flex items-center gap-1.5 text-sm text-white/90">
                                                <MapPin size={14} />
                                                <span>{item.hotelInfo.location.city}, {item.hotelInfo.location.country}</span>
                                              </div>
                                            )}
                                            {item.hotelInfo?.stars && (
                                              <div className="flex items-center gap-1 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                  <Star
                                                    key={i}
                                                    size={14}
                                                    className={i < item.hotelInfo.stars ? 'fill-amber-400 text-amber-400' : 'text-white/30'}
                                                  />
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Precio destacado */}
                                          {cheapestPrice !== null && cheapestPrice > 0 && (
                                            <div className="text-right bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                                              <p className="text-xs text-white/80 mb-1">Desde</p>
                                              <p className="text-3xl font-bold text-white">
                                                ${applyMarkup(cheapestPrice).toFixed(0)}
                                              </p>
                                              <p className="text-xs text-white/60 line-through">
                                                ${cheapestPrice.toFixed(0)}
                                              </p>
                                              <p className="text-xs text-white/80 mt-0.5">por noche</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })()}

                                  {/* Galería de Fotos del Hotel Real - Selección de Portada */}
                                  {resourceData && resourceData.photos && resourceData.photos.length > 0 ? (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-semibold text-default-900">Galería de Fotos</p>
                                        <p className="text-xs text-default-500">Click para seleccionar portada</p>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        {resourceData.photos.map((img: string, i: number) => (
                                          <div 
                                            key={i} 
                                            onClick={() => setCoverImage(img)}
                                            className={`relative aspect-video bg-default-200 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                                              (coverImage === img || (!coverImage && i === 0)) 
                                                ? 'border-primary shadow-lg shadow-primary/30 scale-105' 
                                                : 'border-default-200 hover:border-primary/50'
                                            }`}
                                          >
                                            <img
                                              src={img}
                                              alt={`${resourceData.name} ${i + 1}`}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                                              }}
                                            />
                                            {/* Indicador de portada */}
                                            {(coverImage === img || (!coverImage && i === 0)) && (
                                              <div className="absolute top-1 right-1 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Portada
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : loadingResource ? (
                                    <div className="p-4 bg-default-50 rounded-lg border border-default-200 text-center">
                                      <div className="w-12 h-12 mx-auto mb-2 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                      <p className="text-xs text-default-500">Cargando fotos...</p>
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-default-50 rounded-lg border border-dashed border-default-300 text-center">
                                      <svg className="w-12 h-12 mx-auto mb-2 text-default-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <p className="text-xs text-default-500">No hay fotos disponibles</p>
                                    </div>
                                  )}

                                  {/* Habitaciones Disponibles */}
                                  {item.hotelInfo.rooms && item.hotelInfo.rooms.length > 0 && (
                                    <div>
                                      <p className="text-sm font-semibold text-default-900 mb-2">Habitaciones Disponibles</p>
                                      <div className="space-y-2">
                                        {item.hotelInfo.rooms.map((room: any, idx: number) => (
                                          <div key={idx} className="p-3 bg-default-50 rounded-lg border border-default-200">
                                            <div className="flex items-start justify-between mb-2">
                                              <div>
                                                <p className="font-semibold text-sm text-default-900">{room.roomName}</p>
                                                
                                              </div>
                                              {room.stock !== undefined && (
                                                <Chip size="sm" variant="flat" color={room.stock > 0 ? 'success' : 'danger'}>
                                                  {room.stock > 0 ? `${room.stock} disponibles` : 'Agotado'}
                                                </Chip>
                                              )}
                                            </div>

                                            {/* Precios por ocupación */}
                                            {room.capacityPrices && (
                                              <div className="grid grid-cols-2 gap-2 mt-2">
                                                {room.capacityPrices.double && (
                                                  <div className="p-2 bg-white rounded border border-default-200">
                                                    <p className="text-xs text-default-500 mb-1">Doble</p>
                                                    <div className="flex items-baseline gap-2">
                                                      <p className="text-sm font-bold text-default-900">
                                                        ${applyMarkup(room.capacityPrices.double.adult || 0).toFixed(0)}
                                                      </p>
                                                      <p className="text-xs text-default-400 line-through">
                                                        ${room.capacityPrices.double.adult || 0}
                                                      </p>
                                                    </div>
                                                    <p className="text-xs text-default-500">/noche</p>
                                                  </div>
                                                )}
                                                {room.capacityPrices.single && (
                                                  <div className="p-2 bg-white rounded border border-default-200">
                                                    <p className="text-xs text-default-500 mb-1">Sencilla</p>
                                                    <div className="flex items-baseline gap-2">
                                                      <p className="text-sm font-bold text-default-900">
                                                        ${applyMarkup(room.capacityPrices.single.adult || 0).toFixed(0)}
                                                      </p>
                                                      <p className="text-xs text-default-400 line-through">
                                                        ${room.capacityPrices.single.adult || 0}
                                                      </p>
                                                    </div>
                                                    <p className="text-xs text-default-500">/noche</p>
                                                  </div>
                                                )}
                                                {room.capacityPrices.triple && (
                                                  <div className="p-2 bg-white rounded border border-default-200">
                                                    <p className="text-xs text-default-500 mb-1">Triple</p>
                                                    <div className="flex items-baseline gap-2">
                                                      <p className="text-sm font-bold text-default-900">
                                                        ${applyMarkup(room.capacityPrices.triple.adult || 0).toFixed(0)}
                                                      </p>
                                                      <p className="text-xs text-default-400 line-through">
                                                        ${room.capacityPrices.triple.adult || 0}
                                                      </p>
                                                    </div>
                                                    <p className="text-xs text-default-500">/noche</p>
                                                  </div>
                                                )}
                                                {room.capacityPrices.quad && (
                                                  <div className="p-2 bg-white rounded border border-default-200">
                                                    <p className="text-xs text-default-500 mb-1">Cuádruple</p>
                                                    <div className="flex items-baseline gap-2">
                                                      <p className="text-sm font-bold text-default-900">
                                                        ${applyMarkup(room.capacityPrices.quad.adult || 0).toFixed(0)}
                                                      </p>
                                                      <p className="text-xs text-default-400 line-through">
                                                        ${room.capacityPrices.quad.adult || 0}
                                                      </p>
                                                    </div>
                                                    <p className="text-xs text-default-500">/noche</p>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}


                                  {/* Descripción */}
                                  {item.hotelInfo.description && (
                                    <div>
                                      <p className="text-sm font-semibold text-default-900 mb-2">Descripción</p>
                                      <p className="text-xs text-default-600 leading-relaxed">{item.hotelInfo.description}</p>
                                    </div>
                                  )}

                                  {/* Amenidades si existen */}
                                  {item.hotelInfo.amenities && item.hotelInfo.amenities.length > 0 && (
                                    <div>
                                      <p className="text-sm font-semibold text-default-900 mb-2">Amenidades</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {item.hotelInfo.amenities.slice(0, 8).map((amenity: string, i: number) => (
                                          <Chip key={i} size="sm" variant="flat" className="text-xs">
                                            {amenity}
                                          </Chip>
                                        ))}
                                        {item.hotelInfo.amenities.length > 8 && (
                                          <Chip size="sm" variant="flat" className="text-xs">
                                            +{item.hotelInfo.amenities.length - 8} más
                                          </Chip>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {item.resourceType === 'Flight' && item.flightDetails && (
                                <div className="space-y-3">
                                  {/* Ruta */}
                                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                                    <div className="text-center">
                                      <p className="text-xs text-default-500">Origen</p>
                                      <p className="text-lg font-bold text-primary">{item.flightDetails.route?.from || 'N/A'}</p>
                                    </div>
                                    <Plane size={20} className="text-primary" />
                                    <div className="text-center">
                                      <p className="text-xs text-default-500">Destino</p>
                                      <p className="text-lg font-bold text-primary">{item.flightDetails.route?.to || 'N/A'}</p>
                                    </div>
                                  </div>

                                  {/* Precios */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                                      <p className="text-xs text-default-500 mb-1">Precio Proveedor</p>
                                      <p className="text-lg font-bold text-default-900">
                                        ${item.flightDetails.basePrice || 0}
                                        <span className="text-xs font-normal text-default-500 ml-1">/pasajero</span>
                                      </p>
                                    </div>
                                    <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                                      <p className="text-xs text-success-700 mb-1">Precio de Venta</p>
                                      <p className="text-lg font-bold text-success-900">
                                        ${applyMarkup(item.flightDetails.basePrice || 0).toFixed(2)}
                                        <span className="text-xs font-normal text-success-700 ml-1">/pasajero</span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Info adicional */}
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {item.flightDetails.airline && (
                                      <div className="p-2 bg-default-50 rounded">
                                        <span className="text-default-500">Aerolínea:</span>
                                        <span className="font-semibold text-default-900 ml-1">{item.flightDetails.airline}</span>
                                      </div>
                                    )}
                                    {item.flightDetails.class && (
                                      <div className="p-2 bg-default-50 rounded">
                                        <span className="text-default-500">Clase:</span>
                                        <span className="font-semibold text-default-900 ml-1">{item.flightDetails.class}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {item.resourceType === 'Transport' && item.transportInfo && (
                                <div className="space-y-3">
                                  {/* Tipo de transporte */}
                                  <div className="p-3 bg-primary/5 rounded-lg">
                                    <p className="text-xs text-default-500 mb-1">Tipo de Transporte</p>
                                    <p className="text-lg font-bold text-primary">{item.transportInfo.type || 'N/A'}</p>
                                  </div>

                                  {/* Capacidad */}
                                  {item.transportInfo.capacity && (
                                    <div className="p-2 bg-default-50 rounded-lg">
                                      <p className="text-xs text-default-500">Capacidad</p>
                                      <p className="font-semibold text-default-900">{item.transportInfo.capacity} pasajeros</p>
                                    </div>
                                  )}

                                  {/* Precios */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                                      <p className="text-xs text-default-500 mb-1">Precio Proveedor</p>
                                      <p className="text-lg font-bold text-default-900">${item.transportInfo.basePrice || 0}</p>
                                    </div>
                                    <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                                      <p className="text-xs text-success-700 mb-1">Precio de Venta</p>
                                      <p className="text-lg font-bold text-success-900">${applyMarkup(item.transportInfo.basePrice || 0).toFixed(2)}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {item.resourceType === 'Activity' && item.activityInfo && (
                                <div className="space-y-3">
                                  {/* Tipo de actividad */}
                                  <div className="p-3 bg-primary/5 rounded-lg">
                                    <p className="text-xs text-default-500 mb-1">Actividad</p>
                                    <p className="text-lg font-bold text-primary">{item.activityInfo.name || 'N/A'}</p>
                                  </div>

                                  {/* Duración */}
                                  {item.activityInfo.duration && (
                                    <div className="p-2 bg-default-50 rounded-lg">
                                      <p className="text-xs text-default-500">Duración</p>
                                      <p className="font-semibold text-default-900">{item.activityInfo.duration}</p>
                                    </div>
                                  )}

                                  {/* Precios */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                                      <p className="text-xs text-default-500 mb-1">Precio Proveedor</p>
                                      <p className="text-lg font-bold text-default-900">
                                        ${item.activityInfo.basePrice || 0}
                                        <span className="text-xs font-normal text-default-500 ml-1">/persona</span>
                                      </p>
                                    </div>
                                    <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                                      <p className="text-xs text-success-700 mb-1">Precio de Venta</p>
                                      <p className="text-lg font-bold text-success-900">
                                        ${applyMarkup(item.activityInfo.basePrice || 0).toFixed(2)}
                                        <span className="text-xs font-normal text-success-700 ml-1">/persona</span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Descripción */}
                                  {item.activityInfo.description && (
                                    <div>
                                      <p className="text-xs font-semibold text-default-700 mb-1">Descripción</p>
                                      <p className="text-xs text-default-600 leading-relaxed">{item.activityInfo.description}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })()
                      )}
                    </CardBody>
                  </Card>
                </div>
              </div>

              {/* Configuración según tipo de oferta */}
              <div className="border border-default-200 rounded-lg p-5">
                <div className="grid grid-cols-2 gap-6 divide-x divide-dashed divide-default-300">
                  {/* COLUMNA IZQUIERDA: Configuración específica por tipo */}
                  <div className="pr-6">
                    {offerType === 'package' ? (
                      // PAQUETES: Solo Noches/Días
                      <>
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Calendar size={20} className="text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-default-900">Configuración del Paquete</h3>
                            <p className="text-xs text-default-500">Duración y tipo de precio</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {/* Duración del Paquete */}
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-xs font-semibold text-default-900 mb-3">Duración del Paquete</p>
                            <div className="space-y-3">
                              <Input
                                type="number"
                                label="Noches"
                                value={nights.toString()}
                                onChange={(e) => setNights(parseInt(e.target.value) || 1)}
                                min={1}
                                variant="bordered"
                                size="sm"
                                description="Cantidad de noches del paquete"
                                startContent={<Calendar size={16} className="text-default-400" />}
                              />
                              <div className="flex items-center gap-2 text-xs text-default-600 bg-default-100 px-3 py-2 rounded-lg">
                                <span className="font-medium">Días:</span>
                                <span className="font-bold text-primary">{days}</span>
                                <span className="text-default-400">(calculado automáticamente)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      // HOTELES: Vigencia opcional
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-warning/10 rounded-lg">
                              <Calendar size={20} className="text-warning" />
                            </div>
                            <div>
                              <h3 className="font-bold text-default-900">Vigencia (Opcional)</h3>
                              <p className="text-xs text-default-500">Período de validez</p>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <span className="text-xs font-medium text-default-600 group-hover:text-primary transition-colors">
                              {hasValidity ? 'On' : 'Off'}
                            </span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={hasValidity}
                                onChange={(e) => setHasValidity(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-default-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-default-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                          </label>
                        </div>
                        {hasValidity && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                type="date"
                                label="Fecha Inicio"
                                value={validFrom}
                                onChange={(e) => setValidFrom(e.target.value)}
                                variant="bordered"
                                size="sm"
                              />
                              <Input
                                type="date"
                                label="Fecha Fin"
                                value={validTo}
                                onChange={(e) => setValidTo(e.target.value)}
                                min={validFrom}
                                variant="bordered"
                                size="sm"
                              />
                            </div>
                          </div>
                        )}
                        {!hasValidity && (
                          <div className="flex items-center justify-center h-32 text-center">
                            <p className="text-xs text-default-400">Activa la vigencia para definir un período de validez</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* COLUMNA DERECHA: Markup (siempre visible) */}
                  <div className="pl-6">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <DollarSign size={20} className="text-success" />
                      </div>
                      <div>
                        <h3 className="font-bold text-default-900">Configuración de Markup</h3>
                        <p className="text-xs text-default-500">Define tu ganancia</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Select
                        label="Tipo de Markup"
                        selectedKeys={[markupType]}
                        onChange={(e) => setMarkupType(e.target.value as any)}
                        variant="bordered"
                        size="sm"
                      >
                        <SelectItem key="percentage">Porcentaje (%)</SelectItem>
                        <SelectItem key="fixed">Monto Fijo (USD)</SelectItem>
                      </Select>
                      <Input
                        type="number"
                        label="Valor del Markup"
                        placeholder="Ingresa el valor"
                        value={markupValue.toString()}
                        onChange={(e) => setMarkupValue(parseFloat(e.target.value) || 0)}
                        endContent={
                          <span className="text-default-500 font-semibold">
                            {markupType === 'percentage' ? '%' : 'USD'}
                          </span>
                        }
                        variant="bordered"
                        size="sm"
                        classNames={{
                          input: "text-lg font-semibold"
                        }}
                      />
                      <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                        <p className="text-xs text-success-800">
                          El markup se aplica sobre los precios del inventario
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Detalles Finales */}
          {currentStep === 3 && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-default-900">Detalles de la Oferta</h3>
                <p className="text-sm text-default-500">Completa la información que verán tus clientes</p>
              </div>

              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-7 space-y-5">
                  <Card className="border border-default-200 shadow-sm">
                    <CardBody className="p-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <DollarSign size={20} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-default-900">Información</h3>
                          <p className="text-xs text-default-500">Nombre, estado y descripción</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Input
                          label="Nombre de la Oferta"
                          placeholder="Ej: Cancún Todo Incluido 2026"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          isRequired
                          variant="bordered"
                          description="Este nombre se mostrará a los clientes"
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Código (Opcional)"
                            placeholder="Auto-generado"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            variant="bordered"
                            description="Déjalo vacío para auto-generar"
                          />
                          <Select
                            label="Estado de Publicación"
                            selectedKeys={[status]}
                            onChange={(e) => setStatus(e.target.value as any)}
                            variant="bordered"
                          >
                            <SelectItem key="draft">📝 Borrador</SelectItem>
                            <SelectItem key="published">🌐 Publicado</SelectItem>
                            <SelectItem key="archived">📦 Archivado</SelectItem>
                          </Select>
                        </div>

                        <Textarea
                          label="Descripción"
                          placeholder="Describe los detalles de tu oferta, qué incluye, beneficios, etc..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          minRows={4}
                          variant="bordered"
                          description="Una buena descripción ayuda a vender mejor"
                        />
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="border border-default-200 shadow-sm">
                    <CardBody className="p-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="p-2 bg-warning/10 rounded-lg">
                          <Calendar size={20} className="text-warning" />
                        </div>
                        <div>
                          <h3 className="font-bold text-default-900">Configuración</h3>
                          <p className="text-xs text-default-500">Duración y markup</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-default-50 rounded-lg border border-default-200">
                          <p className="text-xs font-medium text-default-500 uppercase tracking-wide mb-1.5">Duración</p>
                          {offerType === 'package' || offerType === 'hotel' ? (
                            <p className="font-bold text-default-900">
                              {nights} noche{nights !== 1 ? 's' : ''}
                              <span className="text-default-400 font-normal"> • </span>
                              {days} día{days !== 1 ? 's' : ''}
                            </p>
                          ) : (
                            <p className="font-bold text-default-900">N/A</p>
                          )}
                          <p className="text-xs text-default-500 mt-1">
                            {offerType === 'package' || offerType === 'hotel' ? 'Días se calculan automáticamente' : 'No aplica para este tipo'}
                          </p>
                        </div>

                        <div className="p-4 bg-default-50 rounded-lg border border-default-200">
                          <p className="text-xs font-medium text-default-500 uppercase tracking-wide mb-1.5">Markup</p>
                          <p className="font-bold text-default-900">
                            +{markupType === 'percentage' ? `${markupValue}%` : `$${markupValue}`}
                          </p>
                          <p className="text-xs text-default-500 mt-1">Aplicado sobre el total base</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                <div className="col-span-5 space-y-5">
                  <Card className="border border-default-200 shadow-sm overflow-hidden">
                    <CardBody className="p-0">
                      <div className="p-5 border-b border-default-200 bg-default-50">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {offerType === 'package' ? (
                              <Package size={20} className="text-primary" />
                            ) : offerType === 'hotel' ? (
                              <Hotel size={20} className="text-primary" />
                            ) : (
                              <Plane size={20} className="text-primary" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-default-900">Portada</h3>
                            <p className="text-xs text-default-500">Vista previa</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        {coverImage ? (
                          <div className="relative w-full aspect-video bg-default-900 rounded-xl overflow-hidden border border-default-200">
                            <img
                              src={coverImage}
                              alt={name || 'Cover'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full aspect-video rounded-xl border-2 border-dashed border-default-300 bg-default-50 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-12 h-12 mx-auto mb-2 bg-default-200 rounded-full flex items-center justify-center">
                                {offerType === 'package' && <Package size={24} className="text-default-500" />}
                                {offerType === 'hotel' && <Hotel size={24} className="text-default-500" />}
                                {offerType === 'flight' && <Plane size={24} className="text-default-500" />}
                              </div>
                              <p className="text-xs text-default-500 font-medium">Sin portada seleccionada</p>
                              <p className="text-xs text-default-400 mt-1">Puedes elegirla en el paso 2</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>

                  {/* Resumen */}
                  <Card className="bg-gradient-to-br from-primary/5 to-success/5 border border-default-200 shadow-md">
                    <CardBody className="p-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-default-900">Resumen</h3>
                          <p className="text-xs text-default-500">Verifica antes de finalizar</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-white rounded-lg border border-default-200 shadow-sm">
                          <p className="text-xs font-medium text-default-500 uppercase tracking-wide mb-1.5">Tipo</p>
                          <p className="font-bold text-default-900">
                            {offerType === 'package' ? '📦 Paquete' : offerType === 'hotel' ? '🏨 Hotel' : '✈️ Vuelo'}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-default-200 shadow-sm">
                          <p className="text-xs font-medium text-default-500 uppercase tracking-wide mb-1.5">Estado</p>
                          <p className="font-bold text-default-900">
                            {status === 'draft' ? '📝 Borrador' : status === 'published' ? '🌐 Publicado' : '📦 Archivado'}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-default-200 shadow-sm">
                          <p className="text-xs font-medium text-default-500 uppercase tracking-wide mb-1.5">Items</p>
                          <p className="font-bold text-default-900">
                            {items.length}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-default-200 shadow-sm">
                          <p className="text-xs font-medium text-default-500 uppercase tracking-wide mb-1.5">Duración</p>
                          <p className="font-bold text-default-900">
                            {offerType === 'package' || offerType === 'hotel' ? `${nights}N / ${days}D` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-gradient-to-r from-success/10 to-primary/10 border border-success/20 rounded-lg">
                        <p className="text-xs text-default-700 flex items-center gap-2">
                          <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>
                            {mode === 'create'
                              ? 'Todo listo para crear tu oferta. Haz clic en el botón de abajo para finalizar.'
                              : 'Todo listo para guardar los cambios. Haz clic en el botón de abajo para finalizar.'}
                          </span>
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="border-t border-default-200 py-4 px-8 bg-default-50/50">
          <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
            <div>
              {currentStep > 1 && (
                <Button
                  variant="flat"
                  startContent={<ArrowLeft size={18} />}
                  onPress={handlePrevStep}
                  size="lg"
                  className="font-medium"
                >
                  Back
                </Button>
              )}
            </div>
            
            {/* Resumen de Precios en Footer - Visible en todos los pasos */}
            {(() => {
              // Calcular precio total base sumando todos los items
              let totalBasePrice = 0
              
              for (const item of items) {
                if (item.resourceType === 'Hotel') {
                  // Debug: ver estructura del item
                  console.log('🏨 HOTEL ITEM:', {
                    hotelInfo_rooms: item.hotelInfo?.rooms,
                    inventory_rooms: item.inventory?.rooms,
                    inventoryId_rooms: item.inventoryId?.rooms,
                    full_item: item
                  })
                  
                  // Buscar rooms en múltiples ubicaciones posibles
                  const rooms = item.hotelInfo?.rooms || 
                                item.inventory?.rooms || 
                                item.inventoryId?.rooms || 
                                []
                  
                  console.log('🔍 ROOMS ENCONTRADOS:', rooms)
                  
                  if (rooms.length > 0) {
                    // Buscar precio más barato de habitación doble
                    let cheapestPrice = null
                    for (const room of rooms) {
                      if (room.capacityPrices?.double?.adult) {
                        const price = room.capacityPrices.double.adult
                        if (cheapestPrice === null || price < cheapestPrice) {
                          cheapestPrice = price
                        }
                      }
                    }
                    if (cheapestPrice !== null && cheapestPrice > 0) {
                      totalBasePrice += cheapestPrice
                    }
                  }
                }
                
                // Agregar otros tipos de items
                if (item.resourceType === 'Flight' && item.flightDetails?.basePrice) {
                  totalBasePrice += item.flightDetails.basePrice
                }
                
                if (item.resourceType === 'Transport' && item.transportInfo?.basePrice) {
                  totalBasePrice += item.transportInfo.basePrice
                }
                
                if (item.resourceType === 'Activity' && item.activityInfo?.basePrice) {
                  totalBasePrice += item.activityInfo.basePrice
                }
              }
              
              const totalSalePrice = totalBasePrice > 0 ? applyMarkup(totalBasePrice) : 0
              
              return (
                <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-default-100 to-success/5 rounded-lg border border-default-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-default-600">Base:</span>
                    <span className="text-lg font-bold text-default-900">${totalBasePrice.toFixed(2)}</span>
                  </div>
                  <div className="w-px h-8 bg-default-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-success-700">Sale:</span>
                    <span className="text-lg font-bold text-success-900">${totalSalePrice.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-default-500">
                    {items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''}` : 'No items'} • +{markupType === 'percentage' ? `${markupValue}%` : `$${markupValue}`}
                  </div>
                </div>
              )
            })()}

            <div className="flex gap-3">
              <Button
                variant="light"
                onPress={handleClose}
                size="lg"
                className="font-medium"
              >
                Cancel
              </Button>
              {currentStep < 3 ? (
                <Button
                  color="primary"
                  endContent={<ArrowRight size={18} />}
                  onPress={handleNextStep}
                  size="lg"
                  className="font-semibold px-10 shadow-lg shadow-success/30"
                >
                  Next
                </Button>
              ) : (
                <Button
                  color="success"
                  onPress={handleSave}
                  isLoading={isSaving}
                  isDisabled={!name.trim()}
                  size="lg"
                  className="font-semibold px-8 shadow-lg shadow-success/30"
                  startContent={!isSaving && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                >
                  {mode === 'create' ? 'Create' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>

      <ItemSelectionModal
        isOpen={isItemSelectionOpen}
        onClose={() => setIsItemSelectionOpen(false)}
        onSelect={handleAddItem}
        offerType={offerType}
      />
    </Modal>
  )
}
