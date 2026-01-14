'use client'

import { useState } from 'react'
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
import { Plus, Search, MoreVertical, Car, MapPin, Users, Edit, Trash2, DollarSign } from 'lucide-react'
import { useTransports } from '@/swr'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { PageWrapper } from '@/components/PageWrapper'
import TransportModal from '@/components/transports/TransportModal'

function TransportsContent() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedTransport, setSelectedTransport] = useState<any>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const { 
    transports, 
    pagination, 
    isLoading,
    isDeleting,
    createTransport,
    updateTransport,
    deleteTransport,
    isCreating,
    isUpdating
  } = useTransports({ 
    page, 
    limit: 20, 
    search,
    status: statusFilter,
    type: typeFilter
  })

  const statusColorMap: Record<string, "success" | "warning" | "danger"> = {
    active: "success",
    inactive: "warning",
    maintenance: "danger"
  }

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    maintenance: 'Mantenimiento'
  }

  const typeLabels: Record<string, string> = {
    private_car: 'Auto Privado',
    shared_shuttle: 'Shuttle Compartido',
    luxury_van: 'Van de Lujo',
    bus: 'Autobús',
    limousine: 'Limusina'
  }

  const handleDelete = async (transport: any) => {
    if (confirm(`¿Desactivar transporte "${transport.name}"?`)) {
      await deleteTransport(transport._id)
    }
  }

  const handleEdit = (transport: any) => {
    setSelectedTransport(transport)
    onOpen()
  }

  const handleCreate = () => {
    setSelectedTransport(null)
    onOpen()
  }

  const handleSubmit = async (data: any) => {
    if (selectedTransport) {
      await updateTransport(selectedTransport._id, data)
    } else {
      await createTransport(data)
    }
    onClose()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transportes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona servicios de transporte terrestre
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onPress={handleCreate}
        >
          Nuevo Transporte
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Buscar transportes..."
          value={search}
          onValueChange={setSearch}
          startContent={<Search size={20} />}
          className="max-w-md"
          isClearable
          onClear={() => setSearch('')}
        />
        
        <Select
          placeholder="Tipo"
          className="max-w-xs"
          selectedKeys={typeFilter ? [typeFilter] : []}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <SelectItem key="">Todos los tipos</SelectItem>
          <SelectItem key="private_car">Auto Privado</SelectItem>
          <SelectItem key="shared_shuttle">Shuttle Compartido</SelectItem>
          <SelectItem key="luxury_van">Van de Lujo</SelectItem>
          <SelectItem key="bus">Autobús</SelectItem>
          <SelectItem key="limousine">Limusina</SelectItem>
        </Select>

        <Select
          placeholder="Estado"
          className="max-w-xs"
          selectedKeys={statusFilter ? [statusFilter] : []}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <SelectItem key="">Todos los estados</SelectItem>
          <SelectItem key="active">Activo</SelectItem>
          <SelectItem key="inactive">Inactivo</SelectItem>
          <SelectItem key="maintenance">Mantenimiento</SelectItem>
        </Select>
      </div>

      {/* Table */}
      <Table aria-label="Tabla de transportes">
        <TableHeader>
          <TableColumn>TRANSPORTE</TableColumn>
          <TableColumn>RUTA</TableColumn>
          <TableColumn>TIPO</TableColumn>
          <TableColumn>CAPACIDAD</TableColumn>
          <TableColumn>PRECIO</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          items={transports}
          isLoading={isLoading}
          emptyContent="No hay transportes"
        >
          {(transport: any) => (
            <TableRow key={transport._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Car size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{transport.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {transport.supplier?.name || 'Sin proveedor'}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {transport.route?.origin?.city || 'N/A'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={12} />
                      {transport.route?.destination?.city || 'N/A'}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {typeLabels[transport.type] || transport.type}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Users size={14} className="text-muted-foreground" />
                  <span className="font-medium">{transport.capacity?.passengers || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {transport.capacity?.luggage || 0} maletas
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 font-semibold text-success">
                  <DollarSign size={16} />
                  {transport.pricing?.sellingPrice?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transport.pricing?.unit || 'por viaje'}
                </p>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={statusColorMap[transport.status] || 'default'}
                  variant="flat"
                >
                  {statusLabels[transport.status] || transport.status}
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
                      if (key === 'edit') handleEdit(transport)
                      if (key === 'delete') handleDelete(transport)
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
                      Desactivar
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

      <TransportModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        transport={selectedTransport}
        isLoading={isCreating || isUpdating}
      />
    </div>
  )
}

export default function TransportsPage() {
  return (
    <CRMLayout>
      <PageWrapper>
        <TransportsContent />
      </PageWrapper>
    </CRMLayout>
  )
}
