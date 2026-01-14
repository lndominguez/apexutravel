'use client'

import { useState } from 'react'
import { Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Radio, RadioGroup } from '@heroui/react'
import { Search } from 'lucide-react'

interface HotelPackageSelectorProps {
  hotels: any[]
  selectedHotel: any | null
  onSelect: (hotel: any) => void
  isLoading?: boolean
}

export default function HotelPackageSelector({ 
  hotels, 
  selectedHotel, 
  onSelect,
  isLoading = false 
}: HotelPackageSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredHotels = hotels?.filter((item: any) => {
    const hotelName = item.resource?.name?.toLowerCase() || ''
    const inventoryName = item.inventoryName?.toLowerCase() || ''
    const supplierName = item.supplier?.name?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()
    
    return hotelName.includes(search) || inventoryName.includes(search) || supplierName.includes(search)
  }) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hotels || hotels.length === 0) {
    return (
      <div className="text-center py-12 text-default-500">
        <p>No hay hoteles disponibles con precio de paquete</p>
        <p className="text-xs mt-2">Crea inventario de hotel con modalidad "Precio x Oferta"</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Buscar hotel..."
        startContent={<Search size={18} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="sm"
      />

      <RadioGroup
        value={selectedHotel?._id || ''}
        onValueChange={(value) => {
          const hotel = filteredHotels.find((h: any) => h._id === value)
          if (hotel) onSelect(hotel)
        }}
      >
        <div className="border rounded-lg max-h-[400px] overflow-y-auto">
          <Table
            removeWrapper
            aria-label="Tabla de hoteles"
          >
            <TableHeader>
              <TableColumn>HOTEL</TableColumn>
              <TableColumn>INVENTARIO</TableColumn>
              <TableColumn>UBICACIÓN</TableColumn>
              <TableColumn>HABITACIONES</TableColumn>
              <TableColumn>PROVEEDOR</TableColumn>
              <TableColumn width={50}></TableColumn>
            </TableHeader>
            <TableBody emptyContent="No se encontraron hoteles">
              {filteredHotels.map((item: any) => {
                const hotel = item.resource
                return (
                  <TableRow 
                    key={item._id}
                    className="cursor-pointer hover:bg-default-100"
                    onClick={() => onSelect(item)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{hotel?.name || 'Sin nombre'}</p>
                        {hotel?.stars && (
                          <p className="text-xs text-default-500">{'⭐'.repeat(hotel.stars)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{item.inventoryName}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{hotel?.city || 'N/A'}, {hotel?.country || 'N/A'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{item.rooms?.length || 0}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{item.supplier?.name || 'N/A'}</p>
                    </TableCell>
                    <TableCell>
                      <Radio value={item._id} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </RadioGroup>
      
      <p className="text-xs text-default-500">
        {filteredHotels.length} {filteredHotels.length === 1 ? 'hotel disponible' : 'hoteles disponibles'}
      </p>
    </div>
  )
}
