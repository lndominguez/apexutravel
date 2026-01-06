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
import { Plus, Search, MoreVertical, Hotel as HotelIcon, MapPin, Star, Edit, Trash2, DollarSign } from 'lucide-react'
import { useHotels } from '@/swr'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { PageWrapper } from '@/components/PageWrapper'
import HotelModal from '@/components/hotels/HotelModal'

function HotelsContent() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const { 
    hotels, 
    pagination, 
    isLoading,
    isDeleting,
    createHotel,
    updateHotel,
    deleteHotel,
    isCreating,
    isUpdating
  } = useHotels({ 
    page, 
    limit: 20, 
    search,
    status: statusFilter,
    category: categoryFilter ? parseInt(categoryFilter) : undefined
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

  const handleDelete = async (hotel: any) => {
    if (confirm(`¿Desactivar hotel "${hotel.name}"?`)) {
      await deleteHotel(hotel._id)
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

  const getMinPrice = (roomTypes: any[]) => {
    if (!roomTypes || roomTypes.length === 0) return 0
    const prices = roomTypes.flatMap(rt => 
      (rt.plans || []).map((p: any) => p.pricePerNight?.sellingPrice || 0)
    )
    return prices.length > 0 ? Math.min(...prices) : 0
  }

  const getRoomCount = (roomTypes: any[]) => {
    if (!roomTypes || roomTypes.length === 0) return 0
    return roomTypes.reduce((sum, rt) => sum + (rt.totalRooms || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hoteles</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona hoteles y alojamientos
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
          placeholder="Categoría"
          className="max-w-xs"
          selectedKeys={categoryFilter ? [categoryFilter] : []}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <SelectItem key="">Todas las categorías</SelectItem>
          <SelectItem key="3">3 Estrellas</SelectItem>
          <SelectItem key="4">4 Estrellas</SelectItem>
          <SelectItem key="5">5 Estrellas</SelectItem>
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
      <Table aria-label="Tabla de hoteles">
        <TableHeader>
          <TableColumn>HOTEL</TableColumn>
          <TableColumn>UBICACIÓN</TableColumn>
          <TableColumn>CATEGORÍA</TableColumn>
          <TableColumn>HABITACIONES</TableColumn>
          <TableColumn>PRECIO DESDE</TableColumn>
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <HotelIcon size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{hotel.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {hotel.supplier?.name || 'Sin proveedor'}
                    </p>
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
                  {[...Array(hotel.category || 0)].map((_, i) => (
                    <Star key={i} size={14} className="fill-warning text-warning" />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{getRoomCount(hotel.roomTypes)}</p>
                <p className="text-xs text-muted-foreground">
                  {hotel.roomTypes?.length || 0} tipo(s)
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 font-semibold text-success">
                  <DollarSign size={16} />
                  {getMinPrice(hotel.roomTypes).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">por noche</p>
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
                      isDisabled={isDeleting}
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    onAction={(key) => {
                      if (key === 'edit') handleEdit(hotel)
                      if (key === 'delete') handleDelete(hotel)
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
