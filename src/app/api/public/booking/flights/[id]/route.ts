import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const flight = await Offer.findOne({ _id: id, type: 'flight', status: 'published' }).populate('items.inventoryId', 'inventoryName resource pricing').lean()
    if (!flight) return NextResponse.json({ success: false, error: 'Vuelo no encontrado' }, { status: 404 })
    return NextResponse.json({ success: true, data: flight })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Error al obtener vuelo' }, { status: 500 })
  }
}
