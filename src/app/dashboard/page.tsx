'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardStats } from '@/swr'
import Link from 'next/link'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  FileText,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MoreVertical
} from 'lucide-react'
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button,
  Avatar,
  Progress,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Badge
} from '@heroui/react'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { PageWrapper } from '@/components/PageWrapper'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'danger'
}

function MetricCard({ title, value, change, changeLabel, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger'
  }

  return (
    <Card className="hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-background to-muted/20">
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2 font-medium">{title}</p>
            <p className="text-3xl font-bold text-foreground mb-3">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-2 text-sm font-medium ${
                change > 0 ? 'text-success' : 'text-danger'
              }`}>
                <div className={`p-1 rounded-full ${
                  change > 0 ? 'bg-success/10' : 'bg-danger/10'
                }`}>
                  {change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
                <span>{Math.abs(change)}% {changeLabel}</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-xl ${colorClasses[color]} shadow-lg`}>
            <Icon size={28} />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const { stats, isLoading: isStatsLoading, refreshStats } = useDashboardStats()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  const dashboardStats = stats

  const metrics = [
    {
      title: 'Contratos del Mes',
      value: dashboardStats.contractsThisMonth || 0,
      change: 15.3,
      changeLabel: 'vs mes anterior',
      icon: FileText,
      color: 'primary' as const
    },
    {
      title: 'Ingresos Mensuales',
      value: `$${(dashboardStats.totalRevenue || 0).toLocaleString()}`,
      change: 12.5,
      changeLabel: 'vs mes anterior',
      icon: DollarSign,
      color: 'success' as const
    },
    {
      title: 'Utilidad del Mes',
      value: `$${(dashboardStats.monthlyProfit || 0).toLocaleString()}`,
      change: 8.7,
      changeLabel: 'vs mes anterior',
      icon: TrendingUp,
      color: 'success' as const
    },
    {
      title: 'Usuarios Activos',
      value: dashboardStats.activeUsers || 0,
      change: dashboardStats.newUsersThisMonth || 0,
      changeLabel: 'nuevos este mes',
      icon: Users,
      color: 'primary' as const
    }
  ]

  const recentDeals = [
    {
      id: '1',
      title: 'Viaje Familiar a Cancún',
      client: 'Carlos Rodríguez',
      stage: 'Negociación',
      value: '$5,200',
      probability: 75,
      nextAction: 'Llamada de seguimiento',
      dueDate: 'Hoy'
    },
    {
      id: '2',
      title: 'Paquete Europeo 2 semanas',
      client: 'María González',
      stage: 'Propuesta',
      value: '$8,900',
      probability: 50,
      nextAction: 'Enviar cotización detallada',
      dueDate: 'Mañana'
    },
    {
      id: '3',
      title: 'Luna de Miel en Maldivas',
      client: 'Ana Martínez',
      stage: 'Calificado',
      value: '$6,500',
      probability: 25,
      nextAction: 'Reunión de presentación',
      dueDate: '3 días'
    }
  ]

  const upcomingTasks = [
    {
      id: '1',
      title: 'Llamada con Carlos Rodríguez',
      type: 'Llamada',
      time: '10:00 AM',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Reunión con equipo de ventas',
      type: 'Reunión',
      time: '2:00 PM',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Enviar cotización a María González',
      type: 'Email',
      time: '4:00 PM',
      priority: 'low'
    }
  ]

  return (
    <CRMLayout>
      <PageWrapper skeletonType="dashboard">
        <div className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-[#0c3f5b]">
                  ¡Bienvenido, {user?.firstName || 'Usuario'}!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Aquí está el resumen de tu actividad reciente
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Dropdown>
                  <DropdownTrigger>
                    <Button 
                      variant="bordered" 
                      size="md"
                      className="bg-background/50 backdrop-blur-sm border-primary/30 hover:bg-primary/10"
                    >
                      Últimos 7 días
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Time range">
                    <DropdownItem key="24h">Últimas 24 horas</DropdownItem>
                    <DropdownItem key="7d">Últimos 7 días</DropdownItem>
                    <DropdownItem key="30d">Últimos 30 días</DropdownItem>
                    <DropdownItem key="90d">Últimos 90 días</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                
                <Button 
                  color="primary" 
                  size="md"
                  startContent={<Plus size={18} />}
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  Nuevo Deal
                </Button>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Deals - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/10">
              <CardHeader className="flex justify-between items-center pb-4">
                <h2 className="text-2xl font-bold text-foreground">Deals Recientes</h2>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="light">
                    Ver Todos
                  </Button>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Deals options">
                      <DropdownItem key="refresh">Actualizar</DropdownItem>
                      <DropdownItem key="export">Exportar</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </CardHeader>
              <CardBody>
                <Table aria-label="Recent deals" removeWrapper>
                  <TableHeader>
                    <TableColumn>DEAL</TableColumn>
                    <TableColumn>CLIENTE</TableColumn>
                    <TableColumn>VALOR</TableColumn>
                    <TableColumn>PROBABILIDAD</TableColumn>
                    <TableColumn>PRÓXIMA ACCIÓN</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {recentDeals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{deal.title}</p>
                            <Chip size="sm" variant="flat" className="mt-1">
                              {deal.stage}
                            </Chip>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar size="sm" name={deal.client} className="flex-shrink-0" />
                            <span className="text-sm">{deal.client}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{deal.value}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={deal.probability} 
                              size="sm" 
                              className="max-w-[60px]"
                              color={deal.probability > 50 ? 'success' : 'warning'}
                            />
                            <span className="text-sm text-muted-foreground">{deal.probability}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm text-foreground">{deal.nextAction}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={12} />
                              {deal.dueDate}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </div>

          {/* Upcoming Tasks */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/10">
              <CardHeader className="flex justify-between items-center pb-4">
                <h2 className="text-xl font-bold text-foreground">Próximas Tareas</h2>
                <Button size="sm" variant="light">
                  Ver Todas
                </Button>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-muted/20 hover:shadow-md transition-all duration-200">
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          task.priority === 'high' ? 'bg-danger' :
                          task.priority === 'medium' ? 'bg-warning' : 'bg-success'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Chip size="sm" variant="flat">
                            {task.type}
                          </Chip>
                          <span className="text-xs text-muted-foreground">{task.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/10">
              <CardHeader className="pb-4">
                <h2 className="text-xl font-bold text-foreground">Actividad Hoy</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-muted/20 to-transparent">
                    <span className="text-sm font-medium text-muted-foreground">Llamadas realizadas</span>
                    <span className="font-bold text-lg text-foreground">8</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-muted/20 to-transparent">
                    <span className="text-sm font-medium text-muted-foreground">Emails enviados</span>
                    <span className="font-bold text-lg text-foreground">12</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-muted/20 to-transparent">
                    <span className="text-sm font-medium text-muted-foreground">Reuniones completadas</span>
                    <span className="font-bold text-lg text-foreground">3</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-success/10 to-transparent border border-success/20">
                    <span className="text-sm font-medium text-muted-foreground">Nuevos deals</span>
                    <span className="font-bold text-lg text-success">+2</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
        </div>
      </PageWrapper>
    </CRMLayout>
  )
}
