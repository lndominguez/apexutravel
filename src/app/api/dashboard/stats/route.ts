import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDatabase from '@/lib/db/mongoose'
import { User } from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    await connectToDatabase()

    // Obtener estadísticas reales de la base de datos
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const newUsersThisMonth = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    })

    // Por ahora, datos simulados para otras métricas
    // TODO: Implementar cuando tengamos las colecciones correspondientes
    const stats = {
      // Usuarios (datos reales)
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      
      // CRM (simulado - implementar cuando tengamos leads/deals)
      totalLeads: 36,
      newLeadsThisMonth: 15,
      conversionRate: 24.5,
      totalDeals: 12,
      dealsThisMonth: 5,
      
      // Finanzas (simulado - implementar cuando tengamos bookings/payments)
      totalRevenue: 125000,
      revenueThisMonth: 45000,
      totalContracts: 45,
      contractsThisMonth: 8,
      monthlyRevenue: 45000,
      dailyRevenue: 1500,
      totalExpenses: 12000,
      monthlyProfit: 33000,
      
      // Comisiones (simulado)
      pendingCommissions: 5400,
      paidCommissions: 12000,
      commissionRate: 12.5,
      
      // Inventario (simulado - implementar cuando tengamos inventory)
      totalProducts: 156,
      activeProducts: 142,
      lowStockProducts: 8,
      
      // Actividad reciente (simulado)
      recentActivity: [
        {
          id: 1,
          type: 'user_registered',
          description: 'Nuevo usuario registrado',
          user: 'María González',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        },
        {
          id: 2,
          type: 'booking_created',
          description: 'Nueva reserva creada',
          user: 'Carlos Ruiz',
          amount: 2500,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
        },
        {
          id: 3,
          type: 'payment_received',
          description: 'Pago recibido',
          user: 'Ana López',
          amount: 1800,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
        }
      ],
      
      // Métricas de rendimiento
      performance: {
        responseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
        uptime: 99.9,
        errorRate: 0.1,
        lastUpdated: new Date()
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
