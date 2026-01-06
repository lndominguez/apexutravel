'use client'

import { useState } from 'react'
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Input,
  Chip,
  Image,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  ButtonGroup
} from '@heroui/react'
import { Plus, Search, MapPin, Calendar, Users, LayoutGrid, List, Edit, Trash2, Eye } from 'lucide-react'
import { usePackages } from '@/swr'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { PageWrapper } from '@/components/PageWrapper'
import PackageFormModal from '@/components/packages/PackageFormModal'

function PackagesContent() {
  const [search, setSearch] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const { 
    packages, 
    isLoading,
    createPackage,
    updatePackage,
    deletePackage,
    isCreating,
    isUpdating
  } = usePackages({ limit: 50, search })

  const statusColorMap: Record<string, "success" | "warning" | "danger"> = {
    available: "success",
    limited: "warning",
    sold_out: "danger",
    suspended: "danger",
    expired: "danger"
  }

  const categoryLabels: Record<string, string> = {
    beach: 'Playa',
    adventure: 'Aventura',
    cultural: 'Cultural',
    romantic: 'Romántico',
    family: 'Familiar',
    luxury: 'Lujo',
    business: 'Negocios',
    wellness: 'Bienestar',
    cruise: 'Crucero'
  }

  const handleCreate = () => {
    setSelectedPackage(null)
    onOpen()
  }

  const handleEdit = (pkg: any) => {
    setSelectedPackage(pkg)
    onOpen()
  }

  const handleSubmit = async (data: any) => {
    try {
      if (selectedPackage) {
        await updatePackage(selectedPackage._id, data)
      } else {
        await createPackage(data)
      }
      handleClose()
    } catch (error: any) {
      console.error('Error al guardar paquete:', error)
      alert(error.message || 'Error al guardar el paquete')
    }
  }

  const handleClose = () => {
    setSelectedPackage(null)
    onClose()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Paquetes Turísticos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona paquetes completos de viaje
          </p>
        </div>
        <Button color="primary" startContent={<Plus size={20} />} onPress={handleCreate}>
          Nuevo Paquete
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Buscar paquetes..."
          value={search}
          onValueChange={setSearch}
          startContent={<Search size={20} />}
          className="max-w-md"
        />
        
        <ButtonGroup>
          <Button
            isIconOnly
            variant={viewMode === 'grid' ? 'solid' : 'bordered'}
            color={viewMode === 'grid' ? 'primary' : 'default'}
            onPress={() => setViewMode('grid')}
          >
            <LayoutGrid size={18} />
          </Button>
          <Button
            isIconOnly
            variant={viewMode === 'table' ? 'solid' : 'bordered'}
            color={viewMode === 'table' ? 'primary' : 'default'}
            onPress={() => setViewMode('table')}
          >
            <List size={18} />
          </Button>
        </ButtonGroup>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {packages.map((pkg: any) => (
            <Card key={pkg._id} className="hover:shadow-lg transition-shadow">
              <CardBody className="p-0">
                <div 
                  className="relative w-full h-48 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${pkg.images?.[0] || '/placeholder.jpg'})`
                  }}
                />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{pkg.name}</h3>
                    <Chip size="sm" color={statusColorMap[pkg.status]} variant="flat">
                      {pkg.status}
                    </Chip>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} />
                    {pkg.destination?.city}, {pkg.destination?.country}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {pkg.duration?.days}D/{pkg.duration?.nights}N
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      {pkg.availability?.minPeople || 1}-{pkg.availability?.maxPeople || 10} pax
                    </div>
                  </div>

                  <Chip size="sm" variant="flat">
                    {categoryLabels[pkg.category] || pkg.category}
                  </Chip>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {pkg.description}
                  </p>
                </div>
              </CardBody>
              <CardFooter className="flex justify-between items-center border-t">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    ${pkg.pricing?.sellingPricePerPerson?.double || pkg.pricing?.pricePerPerson?.double || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">por persona (doble)</p>
                </div>
                <Button size="sm" variant="flat" onPress={() => handleEdit(pkg)}>
                  Editar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Table aria-label="Tabla de paquetes">
          <TableHeader>
            <TableColumn>PAQUETE</TableColumn>
            <TableColumn>DESTINO</TableColumn>
            <TableColumn>DURACIÓN</TableColumn>
            <TableColumn>CATEGORÍA</TableColumn>
            <TableColumn>PRECIO</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody>
            {packages.map((pkg: any) => (
              <TableRow key={pkg._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      src={pkg.images?.[0] || '/placeholder.jpg'}
                      alt={pkg.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-semibold">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {pkg.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-primary" />
                    <span>{pkg.destination?.city}, {pkg.destination?.country}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-blue-500" />
                    <span>{pkg.duration?.days}D/{pkg.duration?.nights}N</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">
                    {categoryLabels[pkg.category] || pkg.category}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-bold text-primary">
                      ${pkg.pricing?.sellingPricePerPerson?.double || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">por persona</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={statusColorMap[pkg.status]} variant="flat">
                    {pkg.status}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      isIconOnly
                      onPress={() => handleEdit(pkg)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      isIconOnly
                      onPress={() => {
                        if (confirm('¿Estás seguro de eliminar este paquete?')) {
                          deletePackage(pkg._id)
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && packages.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron paquetes
        </div>
      )}

      <PackageFormModal
        isOpen={isOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        packageData={selectedPackage}
        isLoading={isCreating || isUpdating}
      />
    </div>
  )
}

export default function PackagesPage() {
  return (
    <CRMLayout>
      <PageWrapper>
        <PackagesContent />
      </PageWrapper>
    </CRMLayout>
  )
}
