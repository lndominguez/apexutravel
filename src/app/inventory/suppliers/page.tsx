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
import { Plus, Search, MoreVertical, Building2, Mail, Phone, Filter, Eye, Edit, Trash2 } from 'lucide-react'
import { useSuppliers } from '@/swr'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { PageWrapper } from '@/components/PageWrapper'
import { SupplierModal } from '@/components/suppliers/SupplierModal'

function SuppliersContent() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const { 
    suppliers, 
    pagination, 
    isLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    isCreating,
    isUpdating,
    isDeleting
  } = useSuppliers({ 
    page, 
    limit: 20, 
    search,
    type: typeFilter,
    status: statusFilter
  })

  const statusColorMap: Record<string, "success" | "warning" | "danger"> = {
    active: "success",
    inactive: "warning",
    suspended: "danger"
  }

  const typeLabels: Record<string, string> = {
    airline: 'Aerolínea',
    hotel_chain: 'Cadena Hotelera',
    tour_operator: 'Tour Operator',
    transport_company: 'Empresa de Transporte',
    activity_provider: 'Proveedor de Actividades',
    insurance_company: 'Aseguradora',
    other_agency: 'Otra Agencia'
  }

  const statusLabels: Record<string, string> = {
    pending_approval: 'Pendiente',
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido'
  }

  // Handlers
  const handleCreate = () => {
    setSelectedSupplier(null)
    setModalMode('create')
    onOpen()
  }

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier)
    setModalMode('edit')
    onOpen()
  }

  const handleDelete = async (supplier: any) => {
    if (!confirm(`¿Estás seguro de desactivar el proveedor "${supplier.name}"?`)) {
      return
    }

    try {
      await deleteSupplier(supplier._id)
      alert('Proveedor desactivado exitosamente')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleSave = async (supplierData: any) => {
    try {
      if (modalMode === 'create') {
        await createSupplier(supplierData)
        alert('Proveedor creado exitosamente')
      } else {
        await updateSupplier(selectedSupplier._id, supplierData)
        alert('Proveedor actualizado exitosamente')
      }
      onClose()
    } catch (error: any) {
      throw error // El modal manejará el error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona aerolíneas, hoteles y operadores turísticos
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onPress={handleCreate}
          isLoading={isCreating}
        >
          Nuevo Proveedor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Buscar proveedores..."
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
          startContent={<Filter size={18} />}
        >
          <SelectItem key="">Todos los tipos</SelectItem>
          <SelectItem key="airline">Aerolínea</SelectItem>
          <SelectItem key="hotel_chain">Cadena Hotelera</SelectItem>
          <SelectItem key="tour_operator">Tour Operator</SelectItem>
          <SelectItem key="transport_company">Empresa de Transporte</SelectItem>
          <SelectItem key="activity_provider">Proveedor de Actividades</SelectItem>
          <SelectItem key="insurance_company">Aseguradora</SelectItem>
          <SelectItem key="other_agency">Otra Agencia</SelectItem>
        </Select>

        <Select
          placeholder="Estado"
          className="max-w-xs"
          selectedKeys={statusFilter ? [statusFilter] : []}
          onChange={(e) => setStatusFilter(e.target.value)}
          startContent={<Filter size={18} />}
        >
          <SelectItem key="">Todos los estados</SelectItem>
          <SelectItem key="active">Activo</SelectItem>
          <SelectItem key="pending_approval">Pendiente</SelectItem>
          <SelectItem key="inactive">Inactivo</SelectItem>
          <SelectItem key="suspended">Suspendido</SelectItem>
        </Select>
      </div>

      {/* Table */}
      <Table aria-label="Tabla de proveedores">
        <TableHeader>
          <TableColumn>PROVEEDOR</TableColumn>
          <TableColumn>TIPO</TableColumn>
          <TableColumn>CONTACTO</TableColumn>
          <TableColumn>PAÍS</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          items={suppliers}
          isLoading={isLoading}
          emptyContent="No hay proveedores"
        >
          {(supplier: any) => (
            <TableRow key={supplier._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-sm text-muted-foreground">{supplier.legalName}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {typeLabels[supplier.type] || supplier.type}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} />
                    {supplier.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={14} />
                    {supplier.phone}
                  </div>
                </div>
              </TableCell>
              <TableCell>{supplier.address?.country}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={statusColorMap[supplier.status] || 'default'}
                  variant="flat"
                >
                  {statusLabels[supplier.status] || supplier.status}
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
                      if (key === 'edit') handleEdit(supplier)
                      if (key === 'delete') handleDelete(supplier)
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

      {/* Modal de Crear/Editar */}
      <SupplierModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSave}
        supplier={selectedSupplier}
        mode={modalMode}
      />
    </div>
  )
}

export default function SuppliersPage() {
  return (
    <CRMLayout>
      <PageWrapper>
        <SuppliersContent />
      </PageWrapper>
    </CRMLayout>
  )
}
