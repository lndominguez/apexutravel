import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import Offer from '@/models/Offer'
import { User } from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await connectDB()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const filters: any = { type: 'flight' }
    if (status) filters.status = status
    if (search) filters.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }]
    const skip = (page - 1) * limit
    const [offers, total] = await Promise.all([
      Offer.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('createdBy', 'firstName lastName email').lean(),
      Offer.countDocuments(filters)
    ])
    return NextResponse.json({ offers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener ofertas de vuelos', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await connectDB()
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }
    const body = await request.json()
    if (!body.name || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos: name, items' }, { status: 400 })
    }
    const newOffer = await Offer.create({ ...body, type: 'flight', createdBy: session.user.id })
    const populatedOffer = await Offer.findById(newOffer._id).populate('createdBy', 'firstName lastName email').lean()
    return NextResponse.json({ message: 'Oferta de vuelo creada exitosamente', offer: populatedOffer }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Error de validación', details: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error al crear oferta', details: error.message }, { status: 500 })
  }
}
