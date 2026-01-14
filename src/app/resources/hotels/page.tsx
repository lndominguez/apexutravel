'use client'

import { useEffect, useState } from 'react'
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
import { Plus, Search, MoreVertical, Hotel as HotelIcon, MapPin, Star, Edit, Trash2, DollarSign, Power, CirclePause, CirclePlay, CircleCheck, CircleCheckBig, CircleSlash2 } from 'lucide-react'
import { useHotels } from '@/swr'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { PageWrapper } from '@/components/PageWrapper'
import HotelModal from '@/components/hotels/HotelModal'
import { useNotification } from '@/hooks/useNotification'
import { useConfirm } from '@/hooks/useConfirm'

function HotelsContent() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const [actionHotelId, setActionHotelId] = useState<string | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const notification = useNotification()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const { 
    hotels, 
    pagination, 
    isLoading,
    isDeleting,
    createHotel,
    updateHotel,
    deleteHotel,
    mutate,
    isCreating,
    isUpdating
  } = useHotels({ 
    page, 
    limit: 20, 
    search,
    status: statusFilter,
    stars: categoryFilter ? parseInt(categoryFilter) : undefined
  })

  const statusColorMap: Record<string, "success" | "warning"> = {
    active: "success",
    inactive: "warning"
  }

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo'
  }

  useEffect(() => {
    // Safety: liberar bloqueo del menú si la operación ya terminó
    if (!isDeleting && !isUpdating) {
      setActionHotelId(null)
    }
  }, [isDeleting, isUpdating])

  const handleDeactivate = async (hotel: any) => {
    const confirmed = await confirm({
      title: 'Inactivar hotel',
      message: `¿Inactivar hotel "${hotel.name}"?`,
      confirmText: 'Inactivar',
      type: 'warning'
    })

    if (!confirmed) return

    setActionHotelId(hotel._id)
    try {
      await deleteHotel(hotel._id)
      notification.success('Hotel inactivado', 'El hotel se inactivó correctamente')
    } catch (error: any) {
      console.error('Error al inactivar hotel:', error)
      notification.error('Error al inactivar', error.message || 'No se pudo inactivar el hotel')
    } finally {
      setActionHotelId(null)
    }
  }

  const handleActivate = async (hotel: any) => {
    const confirmed = await confirm({
      title: 'Activar hotel',
      message: `¿Activar hotel "${hotel.name}"?`,
      confirmText: 'Activar',
      type: 'success'
    })

    if (!confirmed) return

    setActionHotelId(hotel._id)
    try {
      await updateHotel(hotel._id, { status: 'active' })
      notification.success('Hotel activado', 'El hotel se activó correctamente')
    } catch (error: any) {
      console.error('Error al activar hotel:', error)
      notification.error('Error al activar', error.message || 'No se pudo activar el hotel')
    } finally {
      setActionHotelId(null)
    }
  }

  const handlePermanentDelete = async (hotel: any) => {
    const confirmed = await confirm({
      title: '⚠️ Eliminar permanentemente',
      message: `¿Eliminar permanentemente el hotel "${hotel.name}"?\n\nEsta acción NO se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    })

    if (!confirmed) return

    setActionHotelId(hotel._id)
    try {
      const res = await fetch(`/api/inventory/hotels/${hotel._id}?permanent=true`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar hotel')
      }

      // refrescar lista
      await mutate()
      notification.success('Hotel eliminado', 'El hotel se eliminó permanentemente')
    } catch (error: any) {
      console.error('Error al eliminar hotel:', error)
      notification.error('Error al eliminar', error.message || 'No se pudo eliminar el hotel')
    } finally {
      setActionHotelId(null)
    }
  }

  const handleEdit = (hotel: any) => {
    setSelectedHotel(hotel)
    onOpen()
  }

  const handleCreate = () => {
    setSelectedHotel(null)
    onOpen()
  }

  const handleSubmit = async (data: any) => {
    if (selectedHotel) {
      await updateHotel(selectedHotel._id, data)
    } else {
      await createHotel(data)
    }
    onClose()
  }


  return (
    <div className="space-y-6">
      <ConfirmDialog />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hoteles</h1>
          <p className="text-muted-foreground mt-1">
            Catálogo de hoteles (sin precios ni proveedores)
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onPress={handleCreate}
        >
          Nuevo Hotel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Buscar hoteles..."
          value={search}
          onValueChange={setSearch}
          startContent={<Search size={20} />}
          className="max-w-md"
          isClearable
          onClear={() => setSearch('')}
        />
        
        <Select
          placeholder="Estrellas"
          className="max-w-xs"
          selectedKeys={new Set([categoryFilter || 'all'])}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys as Set<string>)[0] || 'all'
            setCategoryFilter(selected === 'all' ? '' : selected)
          }}
        >
          <SelectItem key="all">Todas las estrellas</SelectItem>
          <SelectItem key="3">⭐⭐⭐ 3 Estrellas</SelectItem>
          <SelectItem key="4">⭐⭐⭐⭐ 4 Estrellas</SelectItem>
          <SelectItem key="5">⭐⭐⭐⭐⭐ 5 Estrellas</SelectItem>
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
        </Select>
      </div>

      {/* Table */}
      <Table aria-label="Tabla de hoteles">
        <TableHeader>
          <TableColumn>HOTEL</TableColumn>
          <TableColumn>UBICACIÓN</TableColumn>
          <TableColumn>CATEGORÍA</TableColumn>
          <TableColumn>TIPOS DE HABITACIÓN</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          items={hotels}
          isLoading={isLoading}
          emptyContent="No hay hoteles"
        >
          {(hotel: any) => (
            <TableRow key={hotel._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {hotel.photos?.[0] ? (
                    <img
                      src={hotel.photos[0]}
                      alt={hotel.name}
                      className="h-12 w-12 flex-shrink-0 rounded-lg object-cover ring-2 ring-primary/20"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <HotelIcon size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{hotel.name}</p>
                    {hotel.chain && (
                      <p className="text-sm text-muted-foreground truncate">
                        {hotel.chain}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-muted-foreground" />
                  <div>
                    <p className="font-medium">{hotel.location?.city}</p>
                    <p className="text-xs text-muted-foreground">{hotel.location?.country}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {[...Array(hotel.stars || 0)].map((_, i) => (
                    <Star key={i} size={14} className="fill-warning text-warning" />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{hotel.roomTypes?.length || 0}</p>
                <p className="text-xs text-muted-foreground">tipo(s)</p>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={statusColorMap[hotel.status] || 'default'}
                  variant="flat"
                >
                  {statusLabels[hotel.status] || hotel.status}
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
                      if (key === 'edit') handleEdit(hotel)
                      if (key === 'activate') handleActivate(hotel)
                      if (key === 'deactivate') handleDeactivate(hotel)
                      if (key === 'delete') handlePermanentDelete(hotel)
                    }}
                  >
                    <DropdownItem 
                      key="edit"
                      startContent={<Edit size={16} />}
                    >
                      Editar
                    </DropdownItem>

                    {hotel.status === 'active' ? (
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

      <HotelModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        hotel={selectedHotel}
        isLoading={isCreating || isUpdating}
      />
    </div>
  )
}

export default function HotelsPage() {
  return (
    <CRMLayout>
      <PageWrapper>
        <HotelsContent />
      </PageWrapper>
    </CRMLayout>
  )
}
