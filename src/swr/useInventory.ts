import useSWR from 'swr'

interface InventoryFilters {
  resourceType?: 'Hotel' | 'Flight' | 'Transport' | 'Activity'
  supplier?: string
  status?: 'active' | 'inactive' | 'sold_out'
  season?: 'low' | 'regular' | 'high' | 'peak'
  validDate?: string
  pricingMode?: 'per_night' | 'package'
  inventoryCode?: string
  page?: number
  limit?: number
}

interface InventoryItem {
  _id: string
  resource: any
  resourceType: 'Hotel' | 'Flight' | 'Transport' | 'Activity'
  supplier: {
    _id: string
    name: string
    businessName: string
    type: string
    contact?: any
  }
  // Para Hoteles: array de habitaciones
  rooms?: {
    roomType: string
    roomName: string
    capacityPrices?: {
      single?: {
        adult: number
        child: number
        infant: number
      }
      double?: {
        adult: number
        child: number
        infant: number
      }
      triple?: {
        adult: number
        child: number
        infant: number
      }
      quad?: {
        adult: number
        child: number
        infant: number
      }
    }
    stock: number
    _id?: string
  }[]
  // Para Vuelos y Transportes: configuración única
  configuration?: {
    class?: string
    flightType?: string
    serviceType?: string
  }
  pricing?: {
    // Para Vuelos
    adult?: {
      cost: number
      sellingPrice?: number
    }
    child?: {
      cost: number
      sellingPrice?: number
    }
    infant?: {
      cost: number
      sellingPrice?: number
    }
    // Para Transportes
    cost?: number
    sellingPrice?: number
  }
  availability?: number
  validFrom: string
  validTo: string
  season?: string
  notes?: string
  status: string
  createdAt: string
  updatedAt: string
}

interface InventoryResponse {
  items: InventoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Error al cargar inventario')
  return res.json()
})

export function useInventory(filters: InventoryFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.resourceType) params.append('resourceType', filters.resourceType)
  if (filters.supplier) params.append('supplier', filters.supplier)
  if (filters.status) params.append('status', filters.status)
  if (filters.season) params.append('season', filters.season)
  if (filters.validDate) params.append('validDate', filters.validDate)
  if (filters.pricingMode) params.append('pricingMode', filters.pricingMode)
  if (filters.inventoryCode) params.append('inventoryCode', filters.inventoryCode)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  const queryString = params.toString()
  const url = `/api/inventory${queryString ? `?${queryString}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<InventoryResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000
  })

  return {
    inventory: data?.items || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate
  }
}

export function useInventoryItem(id: string | null) {
  const url = id ? `/api/inventory/${id}` : null
  
  const { data, error, isLoading, mutate } = useSWR<InventoryItem>(url, fetcher, {
    revalidateOnFocus: false
  })

  return {
    item: data,
    isLoading,
    isError: error,
    mutate
  }
}

export async function createInventoryItem(data: any) {
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al crear item de inventario')
  }

  return response.json()
}

export async function updateInventoryItem(id: string, data: any) {
  const response = await fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al actualizar item de inventario')
  }

  return response.json()
}

export async function deleteInventoryItem(id: string) {
  const response = await fetch(`/api/inventory/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al eliminar item de inventario')
  }

  return response.json()
}

export type { InventoryItem, InventoryFilters, InventoryResponse }
