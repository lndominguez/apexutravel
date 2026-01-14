'use client'

import { useState, useMemo } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useConfirm } from '@/hooks/useConfirm'
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination
} from '@heroui/react'
import { Plus, Search, Filter, MoreVertical, Package, Calendar, DollarSign, X, Edit, Trash2, CircleSlash2, CircleCheckBig } from 'lucide-react'
import { useInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/swr'
import InventoryModal from '@/components/inventory/InventoryModal'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { PageWrapper } from '@/components/PageWrapper'

function InventoryContent() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<{
    resourceType?: 'Hotel' | 'Flight' | 'Transport'
    supplier?: string
    status?: 'active' | 'inactive' | 'sold_out'
  }>({
    status: 'active'
  })
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { inventory, pagination, isLoading, mutate } = useInventory({
    ...filters,
    page,
    limit: 20
  })

  // Filtrar inventory en el cliente por searchQuery
  const filteredInventory = useMemo(() => {
    if (!searchQuery) return inventory
    return inventory.filter((item: any) => 
      (item.inventoryCode && item.inventoryCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.inventoryName && item.inventoryName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [inventory, searchQuery])

  const handleCreate = () => {
    setSelectedItem(null)
    setShowModal(true)
  }

  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setShowModal(true)
  }

  const handleDeactivate = async (item: any) => {
    const confirmed = await confirm({
      title: 'Desactivar item',
      message: `¿Estás seguro de desactivar el item "${item.inventoryName || item.inventoryCode}"?`,
      confirmText: 'Desactivar',
      type: 'warning'
    })

    if (!confirmed) return

    try {
      await updateInventoryItem(item._id, { status: 'inactive' })
      notification.success('Item desactivado', 'El item se desactivó correctamente')
      mutate()
    } catch (error: any) {
      notification.error('Error al desactivar', error.message || 'No se pudo desactivar el item')
    }
  }

  const handleActivate = async (item: any) => {
    const confirmed = await confirm({
      title: 'Activar item',
      message: `¿Activar el item "${item.inventoryName || item.inventoryCode}"?`,
      confirmText: 'Activar',
      type: 'success'
    })

    if (!confirmed) return

    try {
      await updateInventoryItem(item._id, { status: 'active' })
      notification.success('Item activado', 'El item se activó correctamente')
      mutate()
    } catch (error: any) {
      notification.error('Error al activar', error.message || 'No se pudo activar el item')
    }
  }

  const notification = useNotification()
  const { confirm, ConfirmDialog } = useConfirm()

  const handleDelete = async (item: any) => {
    if (item.status !== 'inactive') {
      notification.error(
        'No se puede eliminar',
        'Para eliminar un item primero debes desactivarlo'
      )
      return
    }

    const confirmed = await confirm({
      title: 'Eliminar item',
      message: '¿Estás seguro de que deseas eliminar este item de inventario?',
      confirmText: 'Eliminar',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      await deleteInventoryItem(item._id)
      notification.success('Item eliminado', 'El item de inventario se eliminó correctamente')
      mutate()
    } catch (error: any) {
      notification.error('Error al eliminar', error.message || 'No se pudo eliminar el item')
    }
  }

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      if (selectedItem) {
        await updateInventoryItem(selectedItem._id, data)
        notification.success('Item actualizado', 'Los cambios se guardaron correctamente')
      } else {
        await createInventoryItem(data)
        notification.success('Item creado', 'El item se agregó al inventario correctamente')
      }
      setShowModal(false)
      mutate()
    } catch (error: any) {
      notification.error('Error al guardar', error.message || 'No se pudo guardar el item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'sold_out': return 'danger'
      default: return 'default'
    }
  }


  const formatCost = (item: any) => {
    if (item.resourceType === 'Hotel') {
      if (!item.rooms || item.rooms.length === 0) return '-'
      // Mostrar rango de precios si hay múltiples habitaciones
      const prices = item.rooms.map((r: any) => r.planCost || 0)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      if (minPrice === maxPrice) {
        return `$${minPrice}/noche`
      }
      return `$${minPrice} - $${maxPrice}/noche`
    }
    if (item.resourceType === 'Flight' && item.pricing?.adult?.cost) {
      return `$${item.pricing.adult.cost}/adulto`
    }
    if (item.resourceType === 'Transport' && item.pricing?.cost) {
      return `$${item.pricing.cost}`
    }
    return '-'
  }

  const getResourceName = (item: any) => {
    if (item.resourceType === 'Hotel') {
      return item.resource?.name || '-'
    }
    if (item.resourceType === 'Flight') {
      return `${item.resource?.origin} - ${item.resource?.destination}` || '-'
    }
    if (item.resourceType === 'Transport') {
      return item.resource?.name || `${item.resource?.route?.from} - ${item.resource?.route?.to}` || '-'
    }
    return '-'
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package size={28} className="text-primary" />
            Gestión de Inventario
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Administra el stock y disponibilidad de recursos por proveedor
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={handleCreate}
        >
          Nuevo Item
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 relative">
            {/* Search */}
            <Input
              placeholder="Buscar por código o nombre de inventario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search size={18} className="text-default-400" />}
              className="flex-1"
              isClearable
              onClear={() => setSearchQuery('')}
            />
            
            {/* Tipo de Recurso */}
            <Select
              placeholder="Tipo"
              selectedKeys={filters.resourceType ? [filters.resourceType] : []}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value as any })}
              className="w-40"
              startContent={<Filter size={16} />}
            >
              <SelectItem key="Hotel">Hotel</SelectItem>
              <SelectItem key="Flight">Vuelo</SelectItem>
              <SelectItem key="Transport">Transporte</SelectItem>
            </Select>

            {/* Estado */}
            <Select
              placeholder="Estado"
              selectedKeys={[filters.status || 'active']}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="w-40"
            >
              <SelectItem key="active">Activo</SelectItem>
              <SelectItem key="inactive">Inactivo</SelectItem>
              <SelectItem key="sold_out">Agotado</SelectItem>
            </Select>

            {/* Clear Filters Icon */}
            <Button
              isIconOnly
              variant="light"
              onPress={() => {
                setFilters({ status: 'active' })
                setSearchQuery('')
              }}
              title="Limpiar filtros"
            >
              <X size={18} />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Tabla */}
      <Table
        aria-label="Tabla de inventario"
        className="min-h-[400px]"
      >
            <TableHeader>
              <TableColumn>INVENTARIO</TableColumn>
              <TableColumn>TIPO</TableColumn>
              <TableColumn>PROVEEDOR</TableColumn>
              <TableColumn>HABITACIONES / COSTO</TableColumn>
              <TableColumn>STOCK</TableColumn>
              <TableColumn>VIGENCIA</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody
              items={filteredInventory}
              isLoading={isLoading}
              emptyContent="No hay items en el inventario"
            >
              {(item: any) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{item.inventoryName || '-'}</div>
                        <div className="font-mono text-xs text-default-500">{item.inventoryCode || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {item.resourceType}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.supplier?.businessName || item.supplier?.name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.resourceType === 'Hotel' && item.rooms && item.rooms.length > 0 ? (
                        <div className="space-y-1.5">
                          {item.rooms.map((room: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs font-medium text-default-600">{room.roomName}</span>
                              <Chip size="sm" color="success" variant="flat" className="font-semibold">
                                ${room.priceAdult}
                              </Chip>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} className="text-success" />
                          <span className="font-semibold text-success">{formatCost(item)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.resourceType === 'Hotel' && item.rooms && item.rooms.length > 0 ? (
                        <div className="space-y-1.5">
                          {item.rooms.map((room: any, idx: number) => (
                            <div key={idx}>
                              <Chip size="sm" color="primary" variant="flat">
                                {room.stock || 0}
                              </Chip>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Chip size="sm" color="primary" variant="flat">
                          {item.availability || 0}
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.resourceType === 'Hotel' && item.rooms && item.rooms.length > 0 ? (
                        <div className="space-y-1.5">
                          {item.rooms.map((room: any, idx: number) => {
                            const validFrom = room.validFrom ? new Date(room.validFrom) : null
                            const validTo = room.validTo ? new Date(room.validTo) : null
                            const isValidDate = validFrom && validTo && !isNaN(validFrom.getTime()) && !isNaN(validTo.getTime())
                            
                            return (
                              <div key={idx} className="flex items-center gap-1 text-xs">
                                <Calendar size={10} className="text-default-400 flex-shrink-0" />
                                <span className="text-xs">
                                  {isValidDate ? (
                                    `${validFrom.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - ${validTo.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`
                                  ) : '-'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar size={12} className="text-default-400" />
                          <span>
                            {item.validFrom && item.validTo ? (
                              `${new Date(item.validFrom).toLocaleDateString('es-ES')} - ${new Date(item.validTo).toLocaleDateString('es-ES')}`
                            ) : '-'}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(item.status)}
                        variant="flat"
                      >
                        {item.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          onAction={(key) => {
                            if (key === 'edit') handleEdit(item)
                            if (key === 'activate') handleActivate(item)
                            if (key === 'deactivate') handleDeactivate(item)
                            if (key === 'delete') handleDelete(item)
                          }}
                        >
                          <DropdownItem 
                            key="edit"
                            startContent={<Edit size={16} />}
                          >
                            Editar
                          </DropdownItem>

                          {item.status === 'active' ? (
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

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={pagination.pages}
            page={page}
            onChange={setPage}
          />
        </div>
      )}

      {/* Modal */}
      <InventoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        item={selectedItem}
        isLoading={isSubmitting}
      />
    </div>
  )
}

export default function InventoryPage() {
  return (
    <CRMLayout>
      <PageWrapper>
        <InventoryContent />
      </PageWrapper>
    </CRMLayout>
  )
}
