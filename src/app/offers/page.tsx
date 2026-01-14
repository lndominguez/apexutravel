'use client'

import { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useConfirm } from '@/hooks/useConfirm'
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  useDisclosure,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@heroui/react'
import { Plus, Search, Filter, Edit, Trash2, MoreVertical, Package, Hotel, Plane, MapPin, Calendar, DollarSign } from 'lucide-react'
import { useOfferPackages } from '@/swr'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { PageWrapper } from '@/components/PageWrapper'
import UnifiedOfferModal from '@/components/offers/UnifiedOfferModal'

function OffersContent() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('') // Filtro por tipo
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure()
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  
  const { 
    packages: offers, 
    pagination,
    isLoading,
    createPackage: createOffer,
    updatePackage: updateOffer,
    deletePackage: deleteOffer,
    mutate
  } = useOfferPackages({ 
    page,
    limit: 20, 
    search,
    status: statusFilter as any
  })
  
  // Filtrar por tipo en el cliente
  const filteredOffers = typeFilter 
    ? offers?.filter((offer: any) => offer.type === typeFilter)
    : offers

  const statusColorMap: Record<string, "success" | "warning" | "danger" | "default"> = {
    published: "success",
    draft: "warning",
    archived: "danger"
  }

  const statusLabels: Record<string, string> = {
    published: 'Publicado',
    draft: 'Borrador',
    archived: 'Archivado'
  }

  const typeLabels: Record<string, string> = {
    package: 'Paquete',
    hotel: 'Hotel',
    flight: 'Vuelo'
  }

  const typeIcons: Record<string, any> = {
    package: Package,
    hotel: Hotel,
    flight: Plane
  }

  const notification = useNotification()
  const { confirm, ConfirmDialog } = useConfirm()

  const handleCreate = () => {
    setSelectedOffer(null)
    setModalMode('create')
    onModalOpen()
  }

  const handleEdit = (offer: any) => {
    setSelectedOffer(offer)
    setModalMode('edit')
    onModalOpen()
  }

  const handleSaveOffer = async (data: any) => {
    try {
      if (modalMode === 'create') {
        await createOffer(data)
        notification.success('Oferta creada', 'La oferta se creó correctamente')
      } else {
        if (!selectedOffer) return
        await updateOffer(selectedOffer._id, data)
        notification.success('Oferta actualizada', 'Los cambios se guardaron correctamente')
      }
      onModalClose()
      setSelectedOffer(null)
      mutate()
    } catch (error: any) {
      console.error('Error al guardar oferta:', error)
      throw error
    }
  }

  const handleModalClose = () => {
    setSelectedOffer(null)
    onModalClose()
  }

  const handlePublish = async (offer: any) => {
    const confirmed = await confirm({
      title: 'Publicar oferta',
      message: `¿Publicar la oferta "${offer.name}"? Será visible para el público.`,
      confirmText: 'Publicar',
      type: 'success'
    })

    if (!confirmed) return

    try {
      await updateOffer(offer._id, { status: 'published' })
      notification.success('Oferta publicada', 'La oferta ahora es visible en el landing')
      mutate()
    } catch (error: any) {
      notification.error('Error al publicar', error.message || 'No se pudo publicar la oferta')
    }
  }

  const handleArchive = async (offer: any) => {
    const confirmed = await confirm({
      title: 'Archivar oferta',
      message: `¿Archivar la oferta "${offer.name}"? Ya no será visible.`,
      confirmText: 'Archivar',
      type: 'warning'
    })

    if (!confirmed) return

    try {
      await updateOffer(offer._id, { status: 'archived' })
      notification.success('Oferta archivada', 'La oferta se archivó correctamente')
      mutate()
    } catch (error: any) {
      notification.error('Error al archivar', error.message || 'No se pudo archivar la oferta')
    }
  }

  const handleUnpublish = async (offer: any) => {
    const confirmed = await confirm({
      title: 'Despublicar oferta',
      message: `¿Volver la oferta "${offer.name}" a borrador?`,
      confirmText: 'Despublicar',
      type: 'warning'
    })

    if (!confirmed) return

    try {
      await updateOffer(offer._id, { status: 'draft' })
      notification.success('Oferta despublicada', 'La oferta volvió a borrador')
      mutate()
    } catch (error: any) {
      notification.error('Error al despublicar', error.message || 'No se pudo despublicar la oferta')
    }
  }

  const handleDelete = async (offer: any) => {
    if (offer.status === 'published') {
      notification.error(
        'No se puede eliminar',
        'Para eliminar una oferta publicada primero debes archivarla'
      )
      return
    }

    const confirmed = await confirm({
      title: 'Eliminar oferta',
      message: `¿Eliminar permanentemente "${offer.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      await deleteOffer(offer._id)
      notification.success('Oferta eliminada', 'La oferta se eliminó correctamente')
      mutate()
    } catch (error: any) {
      notification.error('Error al eliminar', error.message || 'No se pudo eliminar la oferta')
    }
  }

  const TypeIcon = ({ type }: { type: string }) => {
    const Icon = typeIcons[type] || Package
    return <Icon size={18} />
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package size={28} className="text-primary" />
            Ofertas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona todas tus ofertas: paquetes, hoteles y vuelos
          </p>
        </div>
        <Button color="primary" startContent={<Plus size={20} />} onPress={handleCreate}>
          Nueva Oferta
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Buscar ofertas..."
              value={search}
              onValueChange={setSearch}
              startContent={<Search size={18} className="text-default-400" />}
              className="flex-1"
              isClearable
              onClear={() => setSearch('')}
            />
            
            <Select
              placeholder="Tipo"
              selectedKeys={typeFilter ? [typeFilter] : []}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-48"
              startContent={<Filter size={16} />}
            >
              <SelectItem key="">Todos</SelectItem>
              <SelectItem key="package">Paquetes</SelectItem>
              <SelectItem key="hotel">Hoteles</SelectItem>
              <SelectItem key="flight">Vuelos</SelectItem>
            </Select>

            <Select
              placeholder="Estado"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            >
              <SelectItem key="">Todos</SelectItem>
              <SelectItem key="draft">Borrador</SelectItem>
              <SelectItem key="published">Publicado</SelectItem>
              <SelectItem key="archived">Archivado</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Lista de ofertas */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-default-500">Cargando ofertas...</p>
        </div>
      ) : !filteredOffers || filteredOffers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Package size={48} className="mx-auto text-default-300 mb-3" />
            <p className="text-default-500 mb-2">No hay ofertas</p>
            <p className="text-sm text-default-400">
              {search || typeFilter || statusFilter
                ? 'Intenta ajustar los filtros'
                : 'Crea tu primera oferta para comenzar'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map((offer: any) => (
            <Card key={offer._id} className="hover:shadow-lg transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TypeIcon type={offer.type} />
                    </div>
                    <div>
                      <Chip size="sm" variant="flat" color="primary">
                        {typeLabels[offer.type] || offer.type}
                      </Chip>
                    </div>
                  </div>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreVertical size={18} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="edit"
                        startContent={<Edit size={16} />}
                        onPress={() => handleEdit(offer)}
                      >
                        Editar
                      </DropdownItem>
                      {offer.status === 'draft' ? (
                        <DropdownItem
                          key="publish"
                          color="success"
                          onPress={() => handlePublish(offer)}
                        >
                          Publicar
                        </DropdownItem>
                      ) : null}
                      {offer.status === 'published' ? (
                        <DropdownItem
                          key="unpublish"
                          onPress={() => handleUnpublish(offer)}
                        >
                          Despublicar
                        </DropdownItem>
                      ) : null}
                      {offer.status !== 'archived' ? (
                        <DropdownItem
                          key="archive"
                          onPress={() => handleArchive(offer)}
                        >
                          Archivar
                        </DropdownItem>
                      ) : null}
                      <DropdownItem
                        key="delete"
                        color="danger"
                        startContent={<Trash2 size={16} />}
                        onPress={() => handleDelete(offer)}
                      >
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>

                <h3 className="font-semibold text-lg mb-2">{offer.name}</h3>
                
                {offer.description && (
                  <p className="text-sm text-default-600 mb-3 line-clamp-2">
                    {offer.description}
                  </p>
                )}

                <div className="space-y-2 mb-3">
                  {offer.items && offer.items.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-default-500">
                      <Package size={14} />
                      <span>{offer.items.length} componente{offer.items.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {offer.pricing?.finalPrice && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <DollarSign size={14} />
                      <span>${offer.pricing.finalPrice.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-default-200">
                  <Chip
                    size="sm"
                    color={statusColorMap[offer.status]}
                    variant="flat"
                  >
                    {statusLabels[offer.status]}
                  </Chip>
                  <span className="text-xs text-default-400">
                    {offer.code}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={pagination.pages}
            page={page}
            onChange={setPage}
          />
        </div>
      )}

      {/* Modal unificado */}
      <UnifiedOfferModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveOffer}
        offerData={selectedOffer}
        mode={modalMode}
      />
    </div>
  )
}

export default function OffersPage() {
  return (
    <CRMLayout>
      <PageWrapper>
        <OffersContent />
      </PageWrapper>
    </CRMLayout>
  )
}
