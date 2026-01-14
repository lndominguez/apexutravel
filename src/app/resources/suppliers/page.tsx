'use client'

import { useEffect, useState, useMemo } from 'react'
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
import { Plus, Search, MoreVertical, Building2, Mail, Phone, Filter, Eye, Edit, Trash2, CheckCircle2, Power, CircleSlash2, CircleCheckBig } from 'lucide-react'
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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const notification = useNotification()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const { 
    suppliers, 
    pagination, 
    isLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    mutate,
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

  useEffect(() => {
    // Safety: liberar bloqueo del menú si la operación ya terminó
    if (!isDeleting && !isUpdating) {
      setDeletingId(null)
    }
  }, [isDeleting, isUpdating])

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

  const handleDeactivate = async (supplier: any) => {
    const confirmed = await confirm({
      title: 'Desactivar proveedor',
      message: `¿Estás seguro de desactivar el proveedor "${supplier.name}"?`,
      confirmText: 'Desactivar',
      type: 'warning'
    })

    if (!confirmed) return

    setDeletingId(supplier._id)
    try {
      await deleteSupplier(supplier._id)
      notification.success('Proveedor desactivado', 'El proveedor se desactivó correctamente')
    } catch (error: any) {
      console.error('Error al desactivar:', error)
      notification.error('Error al desactivar', error.message || 'No se pudo desactivar el proveedor')
    } finally {
      setDeletingId(null)
    }
  }

  const handleActivate = async (supplier: any) => {
    const confirmed = await confirm({
      title: 'Activar proveedor',
      message: `¿Activar el proveedor "${supplier.name}"?`,
      confirmText: 'Activar',
      type: 'success'
    })

    if (!confirmed) return

    setDeletingId(supplier._id)
    try {
      await updateSupplier(supplier._id, { status: 'active' })
      notification.success('Proveedor activado', 'El proveedor se activó correctamente')
    } catch (error: any) {
      console.error('Error al activar:', error)
      notification.error('Error al activar', error.message || 'No se pudo activar el proveedor')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePermanentDelete = async (supplier: any) => {
    const confirmed = await confirm({
      title: '⚠️ Eliminar permanentemente',
      message: `¿Estás seguro de ELIMINAR PERMANENTEMENTE el proveedor "${supplier.name}"?\n\nEsta acción NO se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    })

    if (!confirmed) return

    setDeletingId(supplier._id)
    try {
      const res = await fetch(`/api/resources/suppliers/${supplier._id}/permanent`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar proveedor')
      }
      
      await mutate()
      notification.success('Proveedor eliminado', 'El proveedor se eliminó permanentemente')
    } catch (error: any) {
      console.error('Error al eliminar:', error)
      notification.error('Error al eliminar', error.message || 'No se pudo eliminar el proveedor')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSave = async (supplierData: any) => {
    try {
      if (modalMode === 'create') {
        await createSupplier(supplierData)
        notification.success('Proveedor creado', 'El proveedor se creó correctamente')
      } else {
        await updateSupplier(selectedSupplier._id, supplierData)
        notification.success('Proveedor actualizado', 'Los cambios se guardaron correctamente')
      }
      onClose()
    } catch (error: any) {
      throw error // El modal manejará el error
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />

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
                  {supplier.logo ? (
                    <div className="relative h-12 w-12 flex-shrink-0">
                      <img 
                        src={supplier.logo} 
                        alt={supplier.name}
                        className="h-full w-full rounded-lg object-cover ring-2 ring-primary/20"
                        onError={(e) => {
                          // Fallback si la imagen falla
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.innerHTML = `
                            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
                                <path d="M3 21h18"/>
                                <path d="M9 8h1"/>
                                <path d="M14 8h1"/>
                                <path d="M6 21V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/>
                              </svg>
                            </div>
                          `
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 ring-2 ring-primary/10">
                      <Building2 size={24} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{supplier.name}</p>
                    {supplier.legalName && (
                      <p className="text-sm text-muted-foreground truncate">{supplier.legalName}</p>
                    )}
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
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    onAction={(key) => {
                      if (key === 'edit') handleEdit(supplier)
                      if (key === 'activate') handleActivate(supplier)
                      if (key === 'deactivate') handleDeactivate(supplier)
                      if (key === 'delete') handlePermanentDelete(supplier)
                    }}
                  >
                    <DropdownItem 
                      key="edit"
                      startContent={<Edit size={16} />}
                    >
                      Editar
                    </DropdownItem>
                    
                    {supplier.status === 'active' ? (
                      <DropdownItem 
                        key="deactivate" 
                        className="text-warning data-[hover=true]:text-white"
                        color="warning"
                        startContent={<CircleSlash2 size={16} />}
                      >
                        Desactivar
                      </DropdownItem>
                    ) : (
                      <>
                        <DropdownItem 
                          key="activate" 
                          className="text-success data-[hover=true]:text-white"
                          color="success"
                          startContent={<CircleCheckBig size={16} />}
                        >
                          Activar
                        </DropdownItem>
                        <DropdownItem 
                          key="delete" 
                          className="text-danger data-[hover=true]:text-white" 
                          color="danger"
                          startContent={<Trash2 size={16} />}
                        >
                          Eliminar
                        </DropdownItem>
                      </>
                    )}
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
