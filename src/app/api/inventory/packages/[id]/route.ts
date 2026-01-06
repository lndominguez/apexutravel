import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { Package } from '@/models'
import { User } from '@/models/User'

// GET /api/inventory/packages/[id] - Obtener un paquete
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const packageData = await Package.findById(id)
      .populate('components.flights.flight', 'flightNumber airline departure arrival pricing')
      .populate('components.hotels.hotel', 'name location category roomTypes')
      .populate('components.transports.transport', 'type route capacity pricing')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean()

    if (!packageData) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ package: packageData })
  } catch (error: any) {
    console.error('Error fetching package:', error)
    return NextResponse.json(
      { error: 'Error al obtener paquete', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/inventory/packages/[id] - Actualizar paquete
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 PUT request para paquete ID:', id)
    
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar paquetes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    console.log('📥 Datos recibidos en API:', JSON.stringify(body, null, 2))

    // Verificar si el paquete existe antes de actualizar
    const existingPackage = await Package.findById(id)
    console.log('📦 Paquete existente encontrado:', existingPackage ? 'SÍ' : 'NO')
    
    if (!existingPackage) {
      console.error('❌ Paquete no encontrado con ID:', id)
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      )
    }

    // Mantener la estructura de precios que viene del formulario
    // El nuevo modal envía: costPerPerson, sellingPricePerPerson, markup, currency
    const updateData = {
      ...body,
      updatedBy: session.user.id
    }
    
    console.log('💾 Datos a guardar:', JSON.stringify(updateData, null, 2))

    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('components.flights.flight', 'flightNumber airline departure arrival')
      .populate('components.hotels.hotel', 'name location category')
      .populate('components.transports.transport', 'type route')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .lean()

    if (!updatedPackage) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Paquete actualizado exitosamente',
      package: updatedPackage
    })
  } catch (error: any) {
    console.error('Error updating package:', error)

    if (error.name === 'ValidationError') {
      // Extraer detalles específicos de los campos que fallaron
      const validationErrors = Object.keys(error.errors || {}).map(key => ({
        field: key,
        message: error.errors[key].message
      }))
      
      return NextResponse.json(
        { 
          error: 'Error de validación', 
          details: error.message,
          fields: validationErrors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar paquete', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/inventory/packages/[id] - Desactivar paquete (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar paquetes' },
        { status: 403 }
      )
    }

    const deletedPackage = await Package.findByIdAndUpdate(
      id,
      { 
        status: 'inactive',
        updatedBy: session.user.id
      },
      { new: true }
    ).lean()

    if (!deletedPackage) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Paquete desactivado exitosamente',
      package: deletedPackage
    })
  } catch (error: any) {
    console.error('Error deleting package:', error)
    return NextResponse.json(
      { error: 'Error al eliminar paquete', details: error.message },
      { status: 500 }
    )
  }
}
