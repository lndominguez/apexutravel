'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button, 
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  User
} from '@heroui/react'
import { 
  Shield,
  Users,
  Edit,
  Save
} from 'lucide-react'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { TableSkeleton } from '@/components/ContentSkeleton'
import { usePermissions, useRouteProtection } from '@/hooks/usePermissions'

const ROLES = [
  { key: 'super_admin', label: 'Super Admin', color: 'danger' as const },
  { key: 'admin', label: 'Admin', color: 'warning' as const },
  { key: 'manager', label: 'Manager', color: 'primary' as const },
  { key: 'agent', label: 'Agent', color: 'success' as const },
  { key: 'viewer', label: 'Viewer', color: 'default' as const }
]

export default function RolesAdminPage() {
  const { user, session, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { canManageUsers, userRole, canAccessAdmin } = usePermissions()
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Manejar redirecciones
  useEffect(() => {
    if (isLoading) return
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to signin')
      router.push('/auth/signin')
      return
    }
    
    if (!canAccessAdmin) {
      console.log('Access denied to admin panel, redirecting to dashboard')
      router.push('/dashboard')
      return
    }
    
    console.log('Access granted to admin roles page')
  }, [status, session, canAccessAdmin, userRole, router])

  // Cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/admin/users')
        const data = await response.json()
        
        if (data.success) {
          setUsers(data.data.users)
        }
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadUsers()
    }
  }, [user])

  // Actualizar rol de usuario
  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId)
    
    try {
      const response = await fetch(`/api/account/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: newRole
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Actualizar la lista local
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ))
        alert('Rol actualizado exitosamente')
      } else {
        alert('Error al actualizar rol: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Error al actualizar rol')
    } finally {
      setUpdating(null)
    }
  }

  // Obtener color del rol
  const getRoleColor = (role: string) => {
    const roleConfig = ROLES.find(r => r.key === role)
    return roleConfig?.color || 'default'
  }

  // Obtener label del rol
  const getRoleLabel = (role: string) => {
    const roleConfig = ROLES.find(r => r.key === role)
    return roleConfig?.label || role
  }

  if (status === 'loading' || loading) {
    return (
      <CRMLayout>
        <TableSkeleton rows={5} />
      </CRMLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <CRMLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Gestión de Roles</h1>
          <p className="text-muted-foreground">
            Administra los roles y permisos de los usuarios del sistema
          </p>
        </div>
      </div>

      {/* Información del usuario actual */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} />
            Tu Usuario Actual
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-4">
            <User
              name={`${user.firstName} ${user.lastName}`}
              description={user.email}
              avatarProps={{
                src: (user as any).avatar,
                size: "lg"
              }}
            />
            <div className="flex items-center gap-3">
              <Chip
                color={getRoleColor(user.role)}
                variant="flat"
                size="lg"
              >
                {getRoleLabel(user.role)}
              </Chip>
              <div className="text-sm text-muted-foreground">
                ID: {user.id}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Todos los Usuarios</h2>
        </CardHeader>
        <CardBody>
          <Table aria-label="Tabla de usuarios y roles">
            <TableHeader>
              <TableColumn>USUARIO</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>ROL ACTUAL</TableColumn>
              <TableColumn>CAMBIAR ROL</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <User
                      name={`${user.firstName} ${user.lastName}`}
                      description={user.department || 'Sin departamento'}
                      avatarProps={{
                        src: user.avatar,
                        size: "sm"
                      }}
                    />
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      color={getRoleColor(user.role)}
                      variant="flat"
                      size="sm"
                    >
                      {getRoleLabel(user.role)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="sm"
                      selectedKeys={[user.role]}
                      onSelectionChange={(keys) => {
                        const newRole = Array.from(keys)[0] as string
                        if (newRole !== user.role) {
                          updateUserRole(user._id, newRole)
                        }
                      }}
                      isDisabled={updating === user._id}
                      className="w-32"
                    >
                      {ROLES.map((role) => (
                        <SelectItem key={role.key}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="bordered"
                        startContent={<Edit size={14} />}
                        onPress={() => router.push(`/admin/users?selected=${user._id}`)}
                      >
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Información sobre roles */}
      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Descripción de Roles</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES.map((role) => (
              <div key={role.key} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Chip color={role.color} variant="flat" size="sm">
                    {role.label}
                  </Chip>
                </div>
                <div className="text-sm text-muted-foreground">
                  {role.key === 'super_admin' && 'Acceso total al sistema, puede gestionar todo'}
                  {role.key === 'admin' && 'Acceso administrativo completo, gestión de usuarios e inventario'}
                  {role.key === 'manager' && 'Gestión de inventario, reportes y ventas'}
                  {role.key === 'agent' && 'Acceso a ventas y gestión de clientes'}
                  {role.key === 'viewer' && 'Solo lectura, acceso limitado para consultas'}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </CRMLayout>
  )
}
