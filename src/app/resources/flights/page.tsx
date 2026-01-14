'use client'

import { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useConfirm } from '@/hooks/useConfirm'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Select,
  SelectItem,
  useDisclosure
} from '@heroui/react'
import { Plus, Search, MoreVertical, Plane, MapPin, Calendar, Edit, Trash2, DollarSign } from 'lucide-react'
import { useFlights } from '@/swr'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { PageWrapper } from '@/components/PageWrapper'
// import { FlightModal } from '@/components/flights/FlightModal'

function FlightsContent() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedFlight, setSelectedFlight] = useState<any>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const notification = useNotification()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const { 
    flights, 
    pagination, 
    isLoading,
    createFlight,
    updateFlight,
    deleteFlight,
    isCreating,
    isDeleting
  } = useFlights({ 
    page, 
    limit: 20, 
    search,
    status: statusFilter
  })

  const statusColorMap: Record<string, "success" | "warning" | "danger"> = {
    available: "success",
    limited: "warning",
    sold_out: "danger",
    cancelled: "danger"
  }

  const statusLabels: Record<string, string> = {
    available: 'Disponible',
    limited: 'Limitado',
    sold_out: 'Agotado',
    cancelled: 'Cancelado'
  }

  const handleCreate = () => {
    setSelectedFlight(null)
    setModalMode('create')
    onOpen()
  }

  const handleEdit = (flight: any) => {
    setSelectedFlight(flight)
    setModalMode('edit')
    onOpen()
  }

  const handleDelete = async (flight: any) => {
    const confirmed = await confirm({
      title: 'Cancelar vuelo',
      message: '¿Estás seguro de eliminar este vuelo?',
      confirmText: 'Cancelar vuelo',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      await deleteFlight(flight._id)
      notification.success('Vuelo cancelado', 'El vuelo se canceló correctamente')
    } catch (error: any) {
      notification.error('Error al cancelar', error.message || 'No se pudo cancelar el vuelo')
    }
  }

  const handleSubmit = async (flightData: any) => {
    try {
      if (modalMode === 'create') {
        await createFlight(flightData)
        notification.success('Vuelo creado', 'El vuelo se creó correctamente')
      } else {
        await updateFlight(selectedFlight._id, flightData)
        notification.success('Vuelo actualizado', 'Los cambios se guardaron correctamente')
      }
      onClose()
    } catch (error: any) {
      notification.error('Error al guardar', error.message || 'No se pudo guardar el vuelo')
      throw error
    }
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('es-MX', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMinPrice = (classes: any[]) => {
    if (!classes || classes.length === 0) return 0
    return Math.min(...classes.map(c => c.sellingPrice || 0))
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vuelos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona vuelos y tarifas aéreas
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onPress={handleCreate}
          isLoading={isCreating}
        >
          Nuevo Vuelo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Buscar vuelos..."
          value={search}
          onValueChange={setSearch}
          startContent={<Search size={20} />}
          className="max-w-md"
          isClearable
          onClear={() => setSearch('')}
        />
        
        <Select
          placeholder="Estado"
          className="max-w-xs"
          selectedKeys={statusFilter ? [statusFilter] : []}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <SelectItem key="">Todos los estados</SelectItem>
          <SelectItem key="available">Disponible</SelectItem>
          <SelectItem key="limited">Limitado</SelectItem>
          <SelectItem key="sold_out">Agotado</SelectItem>
          <SelectItem key="cancelled">Cancelado</SelectItem>
        </Select>
      </div>

      {/* Table */}
      <Table aria-label="Tabla de vuelos">
        <TableHeader>
          <TableColumn>VUELO</TableColumn>
          <TableColumn>RUTA</TableColumn>
          <TableColumn>SALIDA</TableColumn>
          <TableColumn>LLEGADA</TableColumn>
          <TableColumn>PRECIO DESDE</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          items={flights}
          isLoading={isLoading}
          emptyContent="No hay vuelos"
        >
          {(flight: any) => (
            <TableRow key={flight._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Plane size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{flight.flightNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {typeof flight.airline === 'string' ? flight.airline : flight.airline?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{flight.departure?.airport}</span>
                  <MapPin size={14} className="text-muted-foreground" />
                  <span className="font-medium">{flight.arrival?.airport}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {flight.departure?.city} → {flight.arrival?.city}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} />
                  {formatDateTime(flight.departure?.dateTime)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} />
                  {formatDateTime(flight.arrival?.dateTime)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 font-semibold text-success">
                  <DollarSign size={16} />
                  {getMinPrice(flight.classes || []).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {flight.classes?.length || 0} clase(s)
                </p>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={statusColorMap[flight.status] || 'default'}
                  variant="flat"
                >
                  {statusLabels[flight.status] || flight.status}
                </Chip>
              </TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button 
                      isIconOnly 
                      size="sm" 
                      variant="light"
                      isDisabled={isDeleting}
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    onAction={(key) => {
                      if (key === 'edit') handleEdit(flight)
                      if (key === 'delete') handleDelete(flight)
                    }}
                  >
                    <DropdownItem 
                      key="edit"
                      startContent={<Edit size={16} />}
                    >
                      Editar
                    </DropdownItem>
                    <DropdownItem 
                      key="delete" 
                      className="text-danger" 
                      color="danger"
                      startContent={<Trash2 size={16} />}
                    >
                      Cancelar
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={pagination.pages}
            page={page}
            onChange={setPage}
          />
        </div>
      )}

      {/* Modal */}
      {/* <FlightModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSave}
        flight={selectedFlight}
        mode={modalMode}
      /> */}
    </div>
  )
}

export default function FlightsPage() {
  return (
    <CRMLayout>
      <PageWrapper>
        <FlightsContent />
      </PageWrapper>
    </CRMLayout>
  )
}
