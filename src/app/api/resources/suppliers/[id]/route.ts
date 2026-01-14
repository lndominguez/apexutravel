import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongoose'
import { Supplier } from '@/models'
import { User } from '@/models/User'

// GET /api/resources/suppliers/[id] - Obtener un proveedor por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    const supplier = await Supplier.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean()

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ supplier })
  } catch (error: any) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedor', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/resources/suppliers/[id] - Actualizar proveedor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    // Verificar permisos
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar proveedores' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Si se está actualizando el taxId, verificar que no exista otro con el mismo
    if (body.taxId) {
      const existingSupplier = await Supplier.findOne({
        taxId: body.taxId,
        _id: { $ne: id }
      })
      if (existingSupplier) {
        return NextResponse.json(
          { error: 'Ya existe otro proveedor con este RFC/NIT' },
          { status: 400 }
        )
      }
    }

    // Actualizar proveedor
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedBy: session.user.id
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean()

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Proveedor actualizado exitosamente',
      supplier
    })
  } catch (error: any) {
    console.error('Error updating supplier:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Error de validación', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar proveedor', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/resources/suppliers/[id] - Eliminar/desactivar proveedor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    
    // Verificar si es eliminación permanente
    const { searchParams } = new URL(request.url)
    const isPermanent = searchParams.get('permanent') === 'true'

    // Verificar permisos
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || !['super_admin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar proveedores' },
        { status: 403 }
      )
    }

    if (isPermanent) {
      // Eliminación permanente (solo para super_admin)
      if (currentUser.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Solo super_admin puede eliminar permanentemente' },
          { status: 403 }
        )
      }

      const supplier = await Supplier.findByIdAndDelete(id).lean()
      
      if (!supplier) {
        return NextResponse.json(
          { error: 'Proveedor no encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: 'Proveedor eliminado permanentemente',
        supplier
      })
    } else {
      // Desactivar el proveedor
      const supplier = await Supplier.findByIdAndUpdate(
        id,
        {
          status: 'inactive',
          updatedBy: session.user.id
        },
        { new: true }
      ).lean()

      if (!supplier) {
        return NextResponse.json(
          { error: 'Proveedor no encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: 'Proveedor desactivado exitosamente',
        supplier
      })
    }
  } catch (error: any) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Error al eliminar proveedor', details: error.message },
      { status: 500 }
    )
  }
}
