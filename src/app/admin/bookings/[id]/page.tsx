'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  CardBody,
  Button,
  Chip,
  Select,
  SelectItem,
  Textarea,
  Input,
  Divider,
  Spinner,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from '@heroui/react'
import {
  ArrowLeft,
  Package,
  Hotel,
  Plane,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  CreditCard,
  FileText,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  AlertTriangle,
  Download,
  Printer,
  Send,
  MoreVertical,
  Edit,
  Paperclip,
  Building2,
  Bed,
  User as UserIcon
} from 'lucide-react'
import Link from 'next/link'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { useNotification } from '@/hooks/useNotification'

interface Booking {
  _id: string
  bookingNumber: string
  type: 'package' | 'hotel' | 'flight'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  itemId: string
  itemType: string
  itemName: string
  passengers: Array<{
    type: 'adult' | 'child' | 'infant'
    fullName: string
    dateOfBirth: string
    passport: string
    nationality: string
    passportPhoto?: string
  }>
  contactInfo: {
    email: string
    phone: string
    country: string
    city: string
  }
  details?: {
    hotel?: {
      roomIndex: number
      roomName: string
      occupancy: string
      checkIn: Date
      checkOut: Date
      nights: number
    }
    package?: {
      destination: string
      startDate: Date
      duration: {
        days: number
        nights: number
      }
    }
    flight?: {
      origin: string
      destination: string
      departureDate: Date
      returnDate?: Date
      class: string
    }
  }
  pricing: {
    adults: number
    children: number
    infants: number
    subtotal: number
    taxes?: number
    fees?: number
    total: number
    currency: string
  }
  paymentMethod: 'pending' | 'paypal' | 'card' | 'cash' | 'transfer'
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded'
  paymentDate?: string
  transactionId?: string
  invoiceNumber?: string
  invoiceDate?: string
  invoiceUrl?: string
  notes?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  createdBy?: {
    firstName: string
    lastName: string
    email: string
  }
  assignedAgent?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const notification = useNotification()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados editables
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchBooking()
  }, [params.id])

  const fetchBooking = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`)
      const data = await res.json()

      if (data.success && data.booking) {
        setBooking(data.booking)
        setStatus(data.booking.status)
        setPaymentStatus(data.booking.paymentStatus)
        setPaymentMethod(data.booking.paymentMethod)
        setTransactionId(data.booking.transactionId || '')
        setAdminNotes(data.booking.adminNotes || '')
      } else {
        notification.error('Error', 'No se pudo cargar la reserva')
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      notification.error('Error', 'Error al cargar la reserva')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paymentStatus,
          paymentMethod,
          transactionId: transactionId || undefined,
          adminNotes: adminNotes || undefined,
          paymentDate: paymentStatus === 'paid' ? new Date().toISOString() : undefined
        })
      })

      const data = await res.json()

      if (data.success) {
        notification.success('Guardado', 'Reserva actualizada correctamente')
        setBooking(data.booking)
      } else {
        notification.error('Error', data.error || 'No se pudo actualizar')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      notification.error('Error', 'Error al actualizar la reserva')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        notification.success('Eliminado', 'Reserva eliminada correctamente')
        router.push('/admin/bookings')
      } else {
        notification.error('Error', data.error || 'No se pudo eliminar')
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
      notification.error('Error', 'Error al eliminar la reserva')
    } finally {
      setIsDeleting(false)
      onDeleteClose()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'confirmed': return 'success'
      case 'cancelled': return 'danger'
      case 'completed': return 'primary'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'confirmed': return 'Confirmada'
      case 'cancelled': return 'Cancelada'
      case 'completed': return 'Completada'
      default: return status
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'partial': return 'secondary'
      case 'paid': return 'success'
      case 'refunded': return 'danger'
      default: return 'default'
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'partial': return 'Parcial'
      case 'paid': return 'Pagado'
      case 'refunded': return 'Reembolsado'
      default: return status
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'package': return <Package size={18} />
      case 'hotel': return <Hotel size={18} />
      case 'flight': return <Plane size={18} />
      default: return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'package': return 'Paquete'
      case 'hotel': return 'Hotel'
      case 'flight': return 'Vuelo'
      default: return type
    }
  }

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" />
        </div>
      </CRMLayout>
    )
  }

  if (!booking) {
    return (
      <CRMLayout>
        <div className="p-6">
          <div className="text-center py-20">
            <XCircle size={64} className="mx-auto text-danger mb-4" />
            <h2 className="text-2xl font-bold mb-2">Reserva no encontrada</h2>
            <Button as={Link} href="/admin/bookings" color="primary" className="mt-4">
              Volver a Reservas
            </Button>
          </div>
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            as={Link}
            href="/admin/bookings"
            variant="light"
            startContent={<ArrowLeft size={18} />}
            className="mb-4"
          >
            Volver
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">Reserva #{booking.bookingNumber}</h1>
              <Chip 
                size="md" 
                color={getStatusColor(booking.status)} 
                variant="flat"
                startContent={<CheckCircle size={14} />}
              >
                {getStatusLabel(booking.status)}
              </Chip>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="bordered"
                startContent={<Download size={18} />}
              >
                Export
              </Button>
              <Button
                variant="bordered"
                startContent={<Printer size={18} />}
              >
                Print
              </Button>
              <Button
                color="primary"
                onPress={handleSave}
                isLoading={isSaving}
              >
                Guardar Cambios
              </Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="bordered">
                    <MoreVertical size={18} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="email" startContent={<Send size={16} />}>
                    Enviar Email
                  </DropdownItem>
                  <DropdownItem 
                    key="delete" 
                    color="danger" 
                    startContent={<Trash2 size={16} />}
                    onPress={onDeleteOpen}
                  >
                    Eliminar
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>

          {/* Info básica */}
          <div className="flex items-center gap-6 text-sm text-default-600">
            <span className="flex items-center gap-2">
              Ordenado: <span className="font-medium text-default-900">Via Website</span>
            </span>
            <span className="flex items-center gap-2">
              {getTypeIcon(booking.type)}
              <span className="font-medium">{getTypeLabel(booking.type)}</span>
            </span>
            <span className="flex items-center gap-2">
              Creada: <span className="font-medium text-default-900">
                {new Date(booking.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente */}
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={booking.passengers[0]?.fullName || 'Cliente'}
                      size="lg"
                      className="bg-primary text-white"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{booking.passengers[0]?.fullName || 'N/A'}</h3>
                        <CheckCircle size={16} className="text-success" />
                      </div>
                      <p className="text-sm text-default-600">Individual</p>
                      <Button
                        size="sm"
                        variant="light"
                        startContent={<Edit size={14} />}
                        className="mt-1 h-7 px-2"
                      >
                        Change Customer
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="bordered"
                      startContent={<Paperclip size={14} />}
                    >
                      ({booking.passengers.length}) Attachments
                    </Button>
                    <Button
                      size="sm"
                      variant="bordered"
                      startContent={<Mail size={14} />}
                    >
                      Send Email
                    </Button>
                    <Button
                      size="sm"
                      variant="bordered"
                      startContent={<Phone size={14} />}
                    >
                      {booking.contactInfo.phone}
                    </Button>
                  </div>
                </div>

                {/* Timeline de progreso */}
                <div className="mt-8 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-default-600">ESTADO DE LA RESERVA</span>
                  </div>
                  <div className="relative">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="h-1 bg-default-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ 
                              width: booking.status === 'pending' ? '25%' : 
                                     booking.status === 'confirmed' ? '75%' : 
                                     booking.status === 'completed' ? '100%' : '0%' 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-3">
                      <div className="flex flex-col items-start">
                        <div className={`w-3 h-3 rounded-full mb-1 ${booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'completed' ? 'bg-primary' : 'bg-default-300'}`} />
                        <span className="text-xs font-medium">Creada</span>
                        <span className="text-xs text-default-500">
                          {new Date(booking.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mb-1 ${booking.status === 'confirmed' || booking.status === 'completed' ? 'bg-primary' : 'bg-default-300'}`} />
                        <span className="text-xs font-medium">Confirmada</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`w-3 h-3 rounded-full mb-1 ${booking.status === 'completed' ? 'bg-primary' : 'bg-default-300'}`} />
                        <span className="text-xs font-medium">Completada</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ubicación/Detalles */}
                {booking.details?.hotel && (
                  <div className="flex items-start gap-3 p-4 bg-default-50 rounded-lg">
                    <Building2 size={20} className="text-default-600 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">{booking.itemName}</p>
                      <p className="text-sm text-default-600">
                        {booking.details.hotel.roomName} • {booking.details.hotel.nights} noches
                      </p>
                    </div>
                  </div>
                )}

                {booking.details?.package && (
                  <div className="flex items-start gap-3 p-4 bg-default-50 rounded-lg">
                    <MapPin size={20} className="text-default-600 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">{booking.itemName}</p>
                      <p className="text-sm text-default-600">
                        {booking.details.package.destination} • {booking.details.package.duration.nights}N/{booking.details.package.duration.days}D
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Tabla de Pasajeros */}
            <Card className="shadow-sm">
              <CardBody className="p-0">
                <div className="p-6 pb-4">
                  <h3 className="text-lg font-bold">Pasajeros ({booking.passengers.length})</h3>
                </div>
                <Table 
                  aria-label="Pasajeros"
                  removeWrapper
                  classNames={{
                    th: "bg-default-50 text-default-600 font-semibold text-xs",
                    td: "py-4"
                  }}
                >
                  <TableHeader>
                    <TableColumn>PASAJERO</TableColumn>
                    <TableColumn>TIPO</TableColumn>
                    <TableColumn>PASAPORTE</TableColumn>
                    <TableColumn>NACIONALIDAD</TableColumn>
                    <TableColumn>DOCUMENTO</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {booking.passengers.map((passenger, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={passenger.fullName}
                              size="sm"
                              className="bg-default-200"
                            />
                            <div>
                              <p className="font-medium">{passenger.fullName}</p>
                              <p className="text-xs text-default-500">
                                {new Date(passenger.dateOfBirth).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" variant="flat">
                            {passenger.type === 'adult' ? 'Adulto' : passenger.type === 'child' ? 'Niño' : 'Infante'}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{passenger.passport}</span>
                        </TableCell>
                        <TableCell>{passenger.nationality}</TableCell>
                        <TableCell>
                          {passenger.passportPhoto ? (
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              startContent={<Eye size={14} />}
                              onPress={() => window.open(passenger.passportPhoto, '_blank')}
                            >
                              Ver
                            </Button>
                          ) : (
                            <Chip size="sm" color="warning" variant="flat">
                              Sin foto
                            </Chip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totales */}
                <div className="border-t border-default-200">
                  <div className="p-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-default-600">Subtotal</span>
                      <span className="font-medium">${booking.pricing.subtotal.toLocaleString()}</span>
                    </div>
                    {booking.pricing.taxes && booking.pricing.taxes > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-default-600">Impuestos</span>
                        <span className="font-medium">${booking.pricing.taxes.toLocaleString()}</span>
                      </div>
                    )}
                    {booking.pricing.fees && booking.pricing.fees > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-default-600">Cargos adicionales</span>
                        <span className="font-medium text-danger">-${booking.pricing.fees.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Notas */}
            {booking.notes && (
              <Card className="shadow-sm">
                <CardBody className="p-6">
                  <h3 className="text-sm font-semibold text-default-600 mb-3">NOTAS DEL CLIENTE</h3>
                  <p className="text-sm text-default-700">{booking.notes}</p>
                </CardBody>
              </Card>
            )}

            {/* Notas Administrativas */}
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <h3 className="text-sm font-semibold text-default-600 mb-3">NOTAS ADMINISTRATIVAS</h3>
                <Textarea
                  placeholder="Agrega notas internas..."
                  value={adminNotes}
                  onValueChange={setAdminNotes}
                  variant="bordered"
                  minRows={3}
                  classNames={{
                    input: "text-sm"
                  }}
                />
              </CardBody>
            </Card>
          </div>

          {/* Columna Lateral - Pagos */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <h3 className="text-sm font-semibold text-default-600 mb-4">STATUS:</h3>
                <Select
                  selectedKeys={[status]}
                  onChange={(e) => setStatus(e.target.value)}
                  variant="bordered"
                  size="sm"
                  classNames={{
                    trigger: "h-10"
                  }}
                >
                  <SelectItem key="pending">Pendiente</SelectItem>
                  <SelectItem key="confirmed">Confirmada</SelectItem>
                  <SelectItem key="completed">Completada</SelectItem>
                  <SelectItem key="cancelled">Cancelada</SelectItem>
                </Select>
              </CardBody>
            </Card>

            {/* Invoice */}
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} className="text-default-600" />
                  <h3 className="font-semibold">Invoice</h3>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-default-600">
                    {booking.invoiceNumber || 'INV-' + booking.bookingNumber}
                  </span>
                  <span className="text-lg font-bold">
                    ${booking.pricing.total.toLocaleString()}
                  </span>
                </div>
                <Divider className="my-4" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-default-600">Pagado</span>
                    <span className="text-sm font-semibold text-success">
                      ${(booking.paymentStatus === 'paid' ? booking.pricing.total : 
                         booking.paymentStatus === 'partial' ? booking.pricing.total * 0.5 : 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-default-600">Pendiente</span>
                    <span className="text-sm font-semibold text-warning">
                      ${(booking.paymentStatus === 'paid' ? 0 : 
                         booking.paymentStatus === 'partial' ? booking.pricing.total * 0.5 : 
                         booking.pricing.total).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button
                  color="success"
                  variant="flat"
                  className="w-full mt-4"
                  size="sm"
                >
                  Registrar Pago
                </Button>
              </CardBody>
            </Card>

            {/* Payment Details */}
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <h3 className="text-sm font-semibold text-default-600 mb-4">DETALLES DE PAGO</h3>
                <div className="space-y-4">
                  <Select
                    label="Estado de Pago"
                    selectedKeys={[paymentStatus]}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    variant="bordered"
                    size="sm"
                  >
                    <SelectItem key="pending">Pendiente</SelectItem>
                    <SelectItem key="partial">Parcial</SelectItem>
                    <SelectItem key="paid">Pagado</SelectItem>
                    <SelectItem key="refunded">Reembolsado</SelectItem>
                  </Select>

                  <Select
                    label="Método de Pago"
                    selectedKeys={[paymentMethod]}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    variant="bordered"
                    size="sm"
                  >
                    <SelectItem key="pending">Pendiente</SelectItem>
                    <SelectItem key="paypal">PayPal</SelectItem>
                    <SelectItem key="card">Tarjeta</SelectItem>
                    <SelectItem key="cash">Efectivo</SelectItem>
                    <SelectItem key="transfer">Transferencia</SelectItem>
                  </Select>

                  <Input
                    label="ID de Transacción"
                    placeholder="TXN123456"
                    value={transactionId}
                    onValueChange={setTransactionId}
                    variant="bordered"
                    size="sm"
                    startContent={<CreditCard size={16} />}
                  />

                  {booking.paymentDate && (
                    <div className="pt-3 border-t border-default-200">
                      <p className="text-xs text-default-600 mb-1">Fecha de pago</p>
                      <p className="text-sm font-medium">
                        {new Date(booking.paymentDate).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Contacto */}
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <h3 className="text-sm font-semibold text-default-600 mb-4">INFORMACIÓN DE CONTACTO</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-default-400" />
                    <span className="text-default-700">{booking.contactInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-default-400" />
                    <span className="text-default-700">{booking.contactInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-default-400" />
                    <span className="text-default-700">
                      {booking.contactInfo.city}, {booking.contactInfo.country}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <Modal 
        isOpen={isDeleteOpen} 
        onClose={onDeleteClose}
        size="sm"
      >
        <ModalContent>
          <ModalHeader className="flex gap-3 items-center text-danger">
            <AlertTriangle size={20} />
            <span>Confirmar Eliminación</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-700">
              ¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.
            </p>
            <div className="p-3 bg-danger/10 rounded-lg border border-danger/20 mt-2">
              <p className="font-semibold text-sm">#{booking.bookingNumber}</p>
              <p className="text-xs text-default-600">{booking.itemName}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose} size="sm">
              Cancelar
            </Button>
            <Button 
              color="danger" 
              onPress={handleDelete}
              isLoading={isDeleting}
              size="sm"
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </CRMLayout>
  )
}
