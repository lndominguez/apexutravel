import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import { Package } from '@/models'

// Deshabilitar caché de Next.js para esta ruta
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/public/packages/[id] - Obtener un paquete por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params

    const pkg = await Package.findById(id)
      .select('-createdBy -updatedBy -__v')
      .lean()

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: 'Paquete no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: pkg
    })

  } catch (error: any) {
    console.error('Error en /api/public/packages/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener el paquete' },
      { status: 500 }
    )
  }
}
