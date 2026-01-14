'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  CardBody, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Chip,
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Pagination
} from '@heroui/react'
import { Search, Filter, Eye, Calendar, Users, DollarSign, Package, Hotel, Plane } from 'lucide-react'
import Link from 'next/link'
import { CRMLayout } from '@/components/layout/CRMLayout'

interface Booking {
  _id: string
  bookingNumber: string
  type: 'package' | 'hotel' | 'flight'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  itemName: string
  contactInfo: {
    email: string
    phone: string
  }
  passengers: Array<{
    fullName: string
    type: string
  }>
  pricing: {
    total: number
    currency: string
  }
  createdAt: string
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded'
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchBookings()
  }, [statusFilter, typeFilter, currentPage])

  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)
      
      const res = await fetch(`/api/bookings?${params.toString()}`)
      const data = await res.json()
      
      if (data.success) {
        setBookings(data.bookings)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'package': return <Package size={16} />
      case 'hotel': return <Hotel size={16} />
      case 'flight': return <Plane size={16} />
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

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase()
    return (
      booking.bookingNumber.toLowerCase().includes(searchLower) ||
      booking.itemName.toLowerCase().includes(searchLower) ||
      booking.contactInfo.email.toLowerCase().includes(searchLower) ||
      booking.passengers.some(p => p.fullName.toLowerCase().includes(searchLower))
    )
  })

  return (
    <CRMLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Reservas</h1>
          <p className="text-gray-600">Gestiona todas las reservas del sistema</p>
        </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por número, nombre, email..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<Search size={18} />}
              classNames={{
                base: "md:col-span-2"
              }}
            />
            
            <Select
              placeholder="Estado"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0]
                setStatusFilter(selected ? String(selected) : '')
                setCurrentPage(1)
              }}
              startContent={<Filter size={18} />}
            >
              <SelectItem key="">Todos</SelectItem>
              <SelectItem key="pending">Pendiente</SelectItem>
              <SelectItem key="confirmed">Confirmada</SelectItem>
              <SelectItem key="cancelled">Cancelada</SelectItem>
              <SelectItem key="completed">Completada</SelectItem>
            </Select>
            
            <Select
              placeholder="Tipo"
              selectedKeys={typeFilter ? [typeFilter] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0]
                setTypeFilter(selected ? String(selected) : '')
                setCurrentPage(1)
              }}
              startContent={<Filter size={18} />}
            >
              <SelectItem key="">Todos</SelectItem>
              <SelectItem key="package">Paquete</SelectItem>
              <SelectItem key="hotel">Hotel</SelectItem>
              <SelectItem key="flight">Vuelo</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Tabla de reservas */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <Table aria-label="Tabla de reservas">
                <TableHeader>
                  <TableColumn>RESERVA</TableColumn>
                  <TableColumn>TIPO</TableColumn>
                  <TableColumn>SERVICIO</TableColumn>
                  <TableColumn>CLIENTE</TableColumn>
                  <TableColumn>PASAJEROS</TableColumn>
                  <TableColumn>TOTAL</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>FECHA</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No hay reservas">
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <div className="font-mono text-sm font-semibold text-primary">
                          {booking.bookingNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(booking.type)}
                          <span className="text-sm">{getTypeLabel(booking.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {booking.itemName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{booking.passengers[0]?.fullName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{booking.contactInfo.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users size={14} />
                          {booking.passengers.length}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">
                          ${booking.pricing.total.toLocaleString()} {booking.pricing.currency}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="sm" 
                          color={getStatusColor(booking.status)}
                          variant="flat"
                        >
                          {getStatusLabel(booking.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(booking.createdAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          as={Link}
                          href={`/admin/bookings/${booking._id}`}
                          size="sm"
                          variant="light"
                          isIconOnly
                        >
                          <Eye size={18} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="flex justify-center py-4">
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                    showControls
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning/10 p-3 rounded-lg">
                <Calendar size={24} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-3 rounded-lg">
                <Users size={24} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <DollarSign size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Mes</p>
                <p className="text-2xl font-bold">
                  ${bookings.reduce((sum, b) => sum + b.pricing.total, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-danger/10 p-3 rounded-lg">
                <Package size={24} className="text-danger" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reservas</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      </div>
    </CRMLayout>
  )
}
