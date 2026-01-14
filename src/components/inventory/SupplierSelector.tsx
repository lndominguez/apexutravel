'use client'

import { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  Avatar
} from '@heroui/react'
import { Search, X, Building2 } from 'lucide-react'

interface SupplierSelectorProps {
  selectedSupplier: any | null
  suppliers: any[]
  onSupplierSelect: (supplier: any) => void
  onSupplierRemove: () => void
}

export default function SupplierSelector({
  selectedSupplier,
  suppliers,
  onSupplierSelect,
  onSupplierRemove
}: SupplierSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSuppliers = suppliers.filter((supplier: any) => {
    const query = searchQuery.toLowerCase()
    return (
      supplier.businessName?.toLowerCase().includes(query) ||
      supplier.name?.toLowerCase().includes(query) ||
      supplier.email?.toLowerCase().includes(query)
    )
  })

  const handleSelectSupplier = (supplier: any) => {
    onSupplierSelect(supplier)
    setIsModalOpen(false)
    setSearchQuery('')
  }

  return (
    <>
      {/* Botón oculto para abrir modal desde fuera */}
      <button
        data-open-supplier
        onClick={() => setIsModalOpen(true)}
        className="hidden"
      />
      
      {/* Selector Box */}
      <div>
        <label className="text-sm font-semibold mb-2 block">Proveedor *</label>
        
        {selectedSupplier ? (
          <div className="flex items-center gap-3 p-3 border-2 border-primary bg-primary/5 rounded-lg">
            <Avatar
              src={selectedSupplier.logo}
              name={(selectedSupplier.businessName || selectedSupplier.name)?.[0]}
              className="bg-primary/10 text-primary"
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {selectedSupplier.businessName || selectedSupplier.name}
              </p>
              <p className="text-xs text-default-500 truncate">{selectedSupplier.email}</p>
            </div>
            <div className="flex gap-1">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setIsModalOpen(true)}
                className="text-default-500 min-w-unit-8 w-8 h-8"
              >
                <Building2 size={14} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={onSupplierRemove}
                className="min-w-unit-8 w-8 h-8"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-16 border-2 border-dashed border-default-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-default-400 hover:text-primary"
          >
            <Building2 size={20} />
            <span className="text-sm font-medium">Seleccionar Proveedor</span>
          </button>
        )}
      </div>

      {/* Modal de Selección */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSearchQuery('')
        }}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Seleccionar Proveedor</h3>
                <p className="text-sm text-default-500 font-normal">
                  Elige el proveedor para este inventario
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            <Input
              placeholder="Buscar proveedor por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search size={18} className="text-default-400" />}
              isClearable
              onClear={() => setSearchQuery('')}
              className="mb-4"
            />

            <div className="space-y-1">
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-8 text-default-400">
                  <p>No se encontraron proveedores</p>
                </div>
              ) : (
                filteredSuppliers.map((supplier: any) => (
                  <button
                    key={supplier._id}
                    onClick={() => handleSelectSupplier(supplier)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedSupplier?._id === supplier._id
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'hover:bg-default-100 border-2 border-transparent'
                    }`}
                  >
                    <Avatar
                      src={supplier.logo}
                      name={(supplier.businessName || supplier.name)?.[0]}
                      className="bg-primary/10 text-primary flex-shrink-0"
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {supplier.businessName || supplier.name}
                      </p>
                      <p className="text-xs text-default-500 truncate">{supplier.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
