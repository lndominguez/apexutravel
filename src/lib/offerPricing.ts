export function getMinOccupancyAdultPrice(capacityPrices: any): number {
  if (!capacityPrices || typeof capacityPrices !== 'object') return 0

  const preferredDouble = capacityPrices?.double?.adult
  if (typeof preferredDouble === 'number' && Number.isFinite(preferredDouble) && preferredDouble > 0) {
    return preferredDouble
  }

  const values: number[] = []
  for (const prices of Object.values(capacityPrices)) {
    if (!prices || typeof prices !== 'object') continue
    const adult = (prices as any).adult
    if (typeof adult === 'number' && Number.isFinite(adult)) {
      values.push(adult)
    }
  }

  const positive = values.filter((v) => v > 0)
  if (positive.length > 0) return Math.min(...positive)
  return values.length > 0 ? Math.min(...values) : 0
}

export function getRoomAdultBasePrice(room: any): number {
  if (!room) return 0

  const capacityMin = getMinOccupancyAdultPrice(room?.capacityPrices)
  if (typeof capacityMin === 'number' && Number.isFinite(capacityMin) && capacityMin > 0) return capacityMin

  const directAdult = room?.pricing?.adult
  if (typeof directAdult === 'number' && Number.isFinite(directAdult)) return directAdult

  const priceAdult = room?.priceAdult
  if (typeof priceAdult === 'number' && Number.isFinite(priceAdult)) return priceAdult

  return 0
}

export function getCheapestRoomAdultBasePrice(rooms: any[]): number {
  if (!Array.isArray(rooms) || rooms.length === 0) return 0
  const prices = rooms.map(getRoomAdultBasePrice)
  const positive = prices.filter((p) => p > 0)
  if (positive.length > 0) return Math.min(...positive)
  return prices.length > 0 ? Math.min(...prices) : 0
}
