'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAdminUsers } from '@/swr'
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button, 
  Chip,
  Avatar,
  Input,
  Select,
  SelectItem,
  Spinner,
  Badge,
  Divider,
  Tabs,
  Tab,
  ScrollShadow,
  Textarea,
  Switch
} from '@heroui/react'
import { 
  Users, 
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Shield,
  Clock,
  Phone,
  Building,
  Mail,
  Key,
  Settings,
  User,
  Send,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { UserModal } from '@/components/users/UserModal'
import { InvitationModal } from '@/components/users/InvitationModal'
import { TableSkeleton } from '@/components/ContentSkeleton'
import { useToast } from '@/hooks/useToast'
import { Toast, ToastContainer } from '@/components/ui/Toast'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@heroui/react'

export default function UsersPage() {
  const { user: currentUser, isLoading: userLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  
  // Estados principales
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('profile')
  
  // Usar hook simple para usuarios admin
  const { 
    users, 
    pagination, 
    isLoading: usersLoading, 
    error: usersError,
    createUser: createUserAction,
    updateUser: updateUserAction,
    deleteUser: deleteUserAction,
    generateInvitation: generateInvitationAction,
    resendInvitation: resendInvitationAction
  } = useAdminUsers({
    page: 1,
    limit: 50,
    search: searchTerm || undefined,
    role: selectedRole !== 'all' ? selectedRole : undefined
  })
  


  // Estados para modales
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [invitationModalOpen, setInvitationModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [superAdminPassword, setSuperAdminPassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Toast notifications
  const toast = useToast()
  
  // Estados para edición
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Filtrar usuarios para la lista
  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = !searchTerm || 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && user.isActive) ||
      (selectedStatus === 'inactive' && !user.isActive) ||
      (selectedStatus === 'pending' && !user.isActive && user.hasInvitation)
    
    return matchesSearch && matchesRole && matchesStatus
  }) || []
  
  // Debug: Log del filtrado
  console.log('🔍 Filtered Users Debug:', {
    rawUsers: users?.length || 0,
    filteredUsers: filteredUsers?.length || 0,
    searchTerm,
    selectedRole,
    selectedStatus,
    users: users?.map((u: any) => ({ email: u.email, role: u.role, isActive: u.isActive }))
  })

  // Funciones de manejo
  const handleUserSelect = (user: any) => {
    setSelectedUser(user)
    setEditData(user)
    setIsEditing(false)
    setActiveTab('profile')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleCreateUser = () => {
    setUserModalOpen(true)
  }

  const handleSaveUser = async (userData: any) => {
    try {
      await createUserAction(userData)
      setUserModalOpen(false)
      toast.success('Usuario creado exitosamente')
    } catch (error) {
      console.error('Error al crear usuario:', error)
      toast.error('Error al crear usuario')
    }
  }

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user)
    setSuperAdminPassword('')
    setDeleteModalOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    if (currentUser?.role !== 'super_admin' && !superAdminPassword) {
      toast.error('Debes ingresar la contraseña del super administrador')
      return
    }
    
    setIsDeleting(true)
    
    try {
      await deleteUserAction(userToDelete._id, superAdminPassword || undefined)
      if (selectedUser?._id === userToDelete._id) {
        setSelectedUser(null)
      }
      toast.success('Usuario eliminado exitosamente')
      setDeleteModalOpen(false)
      setUserToDelete(null)
      setSuperAdminPassword('')
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar usuario'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGenerateInvitation = async (invitationData: any) => {
    try {
      const result = await generateInvitationAction(invitationData)
      setInvitationModalOpen(false)
      if (result?.emailSent) {
        toast.success('Invitación enviada exitosamente por email')
      } else {
        toast.info('Invitación creada. Copia el link manualmente.')
      }
    } catch (error) {
      console.error('Error al generar invitación:', error)
      toast.error('Error al generar invitación')
    }
  }

  const handleResendInvitation = async (userId: string) => {
    try {
      const result = await resendInvitationAction(userId)
      if (result?.emailSent) {
        toast.success('Invitación reenviada exitosamente por email')
      } else {
        toast.warning('No se pudo enviar el email. Verifica la configuración de correo.')
      }
    } catch (error) {
      console.error('Error al reenviar invitación:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al reenviar invitación'
      toast.error(errorMessage)
    }
  }

  const handleUpdateProfile = async () => {
    if (!selectedUser) return
    
    try {
      await updateUserAction(selectedUser._id, editData)
      setSelectedUser({ ...selectedUser, ...editData })
      setIsEditing(false)
      toast.success('Perfil actualizado exitosamente')
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      toast.error('Error al actualizar perfil')
    }
  }

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword || newPassword !== confirmPassword) return
    
    try {
      await updateUserAction(selectedUser._id, { password: newPassword })
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Contraseña actualizada exitosamente')
    } catch (error) {
      console.error('Error al cambiar contraseña:', error)
      toast.error('Error al cambiar contraseña')
    }
  }

  const getStatusColor = (user: any) => {
    if (user.isActive) return 'success'
    if (user.hasInvitation) return 'warning'
    return 'danger'
  }

  const getStatusLabel = (user: any) => {
    if (user.isActive) return 'Activo'
    if (user.hasInvitation) return 'Pendiente'
    return 'Inactivo'
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'danger'
      case 'admin': return 'warning'
      case 'manager': return 'primary'
      case 'agent': return 'success'
      default: return 'default'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'manager': return 'Manager'
      case 'agent': return 'Agente'
      case 'viewer': return 'Solo Lectura'
      default: return role
    }
  }

  if (userLoading || usersLoading) {
    return (
      <CRMLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      <div className="h-full flex flex-col p-6 gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-sm text-muted-foreground">
              Administra usuarios, roles, permisos e invitaciones desde una sola vista
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              color="default" 
              variant="bordered"
              startContent={<UserPlus size={16} />}
              onPress={() => setInvitationModalOpen(true)}
            >
              Invitar Usuario
            </Button>
            <Button 
              color="primary"
              startContent={<Plus size={16} />}
              onPress={() => setUserModalOpen(true)}
            >
              Nuevo Usuario
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{users?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold text-success">{users?.filter((u: any) => u.isActive)?.length || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-warning">{users?.filter((u: any) => u.invitationToken && !u.isEmailVerified)?.length || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nuevos</p>
                  <p className="text-2xl font-bold text-secondary">{users?.filter((u: any) => {
                    const oneMonthAgo = new Date()
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
                    return new Date(u.createdAt) > oneMonthAgo
                  })?.length || 0}</p>
                </div>
                <UserPlus className="h-8 w-8 text-secondary" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Vista de Dos Columnas */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Columna Izquierda - Lista de Usuarios */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3 px-4">
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-4">Lista de Usuarios</h3>
                  
                  {/* Filtros */}
                  <div className="w-full space-y-3">
                    <div className="w-full">
                      <Input
                        placeholder="Buscar usuarios..."
                        startContent={<Search size={16} />}
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        size="sm"
                        autoComplete="off"
                        name="user-search"
                        id="user-search"
                        classNames={{
                          base: "w-full",
                          mainWrapper: "w-full",
                          inputWrapper: "w-full"
                        }}
                      />
                    </div>
                    
                    <div className="w-full flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Rol</label>
                        <Select
                          placeholder="Todos"
                          selectedKeys={[selectedRole]}
                          onSelectionChange={(keys) => setSelectedRole(Array.from(keys)[0] as string)}
                          size="sm"
                          startContent={<Shield size={14} />}
                          classNames={{
                            base: "w-full",
                            mainWrapper: "w-full"
                          }}
                        >
                          <SelectItem key="all">Todos</SelectItem>
                          <SelectItem key="super_admin">Super Admin</SelectItem>
                          <SelectItem key="admin">Admin</SelectItem>
                          <SelectItem key="manager">Manager</SelectItem>
                          <SelectItem key="agent">Agente</SelectItem>
                          <SelectItem key="viewer">Viewer</SelectItem>
                        </Select>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Estado</label>
                        <Select
                          placeholder="Todos"
                          selectedKeys={[selectedStatus]}
                          onSelectionChange={(keys) => setSelectedStatus(Array.from(keys)[0] as string)}
                          size="sm"
                          startContent={<CheckCircle size={14} />}
                          classNames={{
                            base: "w-full",
                            mainWrapper: "w-full"
                          }}
                        >
                          <SelectItem key="all">Todos</SelectItem>
                          <SelectItem key="active">Activos</SelectItem>
                          <SelectItem key="pending">Pendientes</SelectItem>
                          <SelectItem key="inactive">Inactivos</SelectItem>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <Divider />
              
              <CardBody className="p-0">
                <ScrollShadow className="h-full">
                  {usersLoading ? (
                    <div className="p-2">
                      <TableSkeleton rows={6} />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron usuarios</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredUsers.map((user: any) => (
                        <div
                          key={user._id}
                          onClick={() => handleUserSelect(user)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedUser?._id === user._id ? 'bg-primary/10 border border-primary/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={user.avatar}
                              name={`${user.firstName} ${user.lastName}`}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Chip 
                                  size="sm" 
                                  color={getRoleColor(user.role)}
                                  variant="flat"
                                  className="text-xs"
                                >
                                  {getRoleLabel(user.role)}
                                </Chip>
                                <Chip 
                                  size="sm" 
                                  color={getStatusColor(user)}
                                  variant="dot"
                                  className="text-xs"
                                >
                                  {getStatusLabel(user)}
                                </Chip>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollShadow>
              </CardBody>
            </Card>
          </div>

          {/* Columna Derecha - Detalles del Usuario */}
          <div className="lg:col-span-2">
            <Card className="h-full w-full">
              {selectedUser ? (
                <>
                  <CardHeader className="pb-3 w-full">
                    <div className="w-full flex items-center justify-between px-6">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar
                          src={selectedUser.avatar}
                          name={`${selectedUser.firstName} ${selectedUser.lastName}`}
                          size="lg"
                          className="flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Chip 
                              size="sm" 
                              color={getRoleColor(selectedUser.role)}
                              variant="flat"
                            >
                              {getRoleLabel(selectedUser.role)}
                            </Chip>
                            <Chip 
                              size="sm" 
                              color={getStatusColor(selectedUser)}
                              variant="dot"
                            >
                              {getStatusLabel(selectedUser)}
                            </Chip>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {/* Botón de reenviar invitación solo para usuarios pendientes */}
                        {getStatusLabel(selectedUser) === 'Pendiente' && (
                          <Button
                            size="sm"
                            color="warning"
                            variant="bordered"
                            startContent={<Send size={16} />}
                            onPress={() => handleResendInvitation(selectedUser._id)}
                          >
                            Reenviar Invitación
                          </Button>
                        )}
                        
                        {isEditing ? (
                          <Button
                            size="sm"
                            variant="bordered"
                            startContent={<X size={16} />}
                            onPress={() => {
                              setIsEditing(false)
                              setEditData(selectedUser)
                              setNewPassword('')
                              setConfirmPassword('')
                            }}
                          >
                            Cancelar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="bordered"
                            startContent={<Edit size={16} />}
                            onPress={() => setIsEditing(true)}
                          >
                            Editar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          color="danger"
                          variant="bordered"
                          startContent={<Trash2 size={16} />}
                          onPress={() => handleDeleteUser(selectedUser)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <Divider />
                  
                  <CardBody>
                    <Tabs 
                      selectedKey={activeTab} 
                      onSelectionChange={(key) => setActiveTab(key as string)}
                      className="w-full"
                    >
                      <Tab key="profile" title={
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          Perfil
                        </div>
                      }>
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Nombre</label>
                              <Input
                                value={isEditing ? editData.firstName : selectedUser.firstName}
                                onChange={(e) => isEditing && setEditData({...editData, firstName: e.target.value})}
                                isDisabled={!isEditing}
                                variant={isEditing ? "bordered" : "flat"}
                                classNames={{
                                  input: !isEditing ? "text-foreground" : "",
                                  inputWrapper: !isEditing ? "bg-default-100" : ""
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Apellido</label>
                              <Input
                                value={isEditing ? editData.lastName : selectedUser.lastName}
                                onChange={(e) => isEditing && setEditData({...editData, lastName: e.target.value})}
                                isDisabled={!isEditing}
                                variant={isEditing ? "bordered" : "flat"}
                                classNames={{
                                  input: !isEditing ? "text-foreground" : "",
                                  inputWrapper: !isEditing ? "bg-default-100" : ""
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Email</label>
                              <Input
                                value={selectedUser.email}
                                isDisabled
                                variant="flat"
                                startContent={<Mail size={16} />}
                                classNames={{
                                  input: "text-foreground",
                                  inputWrapper: "bg-default-100"
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Teléfono</label>
                              <Input
                                value={isEditing ? editData.phone : selectedUser.phone || ''}
                                onChange={(e) => isEditing && setEditData({...editData, phone: e.target.value})}
                                isDisabled={!isEditing}
                                variant={isEditing ? "bordered" : "flat"}
                                startContent={<Phone size={16} />}
                                classNames={{
                                  input: !isEditing ? "text-foreground" : "",
                                  inputWrapper: !isEditing ? "bg-default-100" : ""
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Departamento</label>
                              <Input
                                value={isEditing ? editData.department : selectedUser.department || ''}
                                onChange={(e) => isEditing && setEditData({...editData, department: e.target.value})}
                                isDisabled={!isEditing}
                                variant={isEditing ? "bordered" : "flat"}
                                startContent={<Building size={16} />}
                                classNames={{
                                  input: !isEditing ? "text-foreground" : "",
                                  inputWrapper: !isEditing ? "bg-default-100" : ""
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Posición</label>
                              <Input
                                value={isEditing ? editData.position : selectedUser.position || ''}
                                onChange={(e) => isEditing && setEditData({...editData, position: e.target.value})}
                                isDisabled={!isEditing}
                                variant={isEditing ? "bordered" : "flat"}
                                classNames={{
                                  input: !isEditing ? "text-foreground" : "",
                                  inputWrapper: !isEditing ? "bg-default-100" : ""
                                }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-2 block">Rol</label>
                            <Select
                              selectedKeys={[isEditing ? editData.role : selectedUser.role]}
                              onSelectionChange={(keys) => isEditing && setEditData({...editData, role: Array.from(keys)[0]})}
                              isDisabled={!isEditing}
                              variant={isEditing ? "bordered" : "flat"}
                              startContent={<Shield size={16} />}
                              classNames={{
                                trigger: !isEditing ? "bg-default-100" : "",
                                value: !isEditing ? "text-foreground" : ""
                              }}
                            >
                              <SelectItem key="super_admin">Super Admin</SelectItem>
                              <SelectItem key="admin">Admin</SelectItem>
                              <SelectItem key="manager">Manager</SelectItem>
                              <SelectItem key="agent">Agente</SelectItem>
                              <SelectItem key="viewer">Solo Lectura</SelectItem>
                            </Select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch 
                              isSelected={isEditing ? editData.isActive : selectedUser.isActive}
                              onValueChange={(value) => isEditing && setEditData({...editData, isActive: value})}
                              isDisabled={!isEditing}
                            />
                            <span className="text-sm font-medium">Usuario activo</span>
                          </div>
                          
                          {isEditing && (
                            <div className="flex gap-2 pt-4 border-t border-divider">
                              <Button color="primary" onPress={handleUpdateProfile} size="sm">
                                Guardar Cambios
                              </Button>
                              <Button variant="bordered" onPress={() => {
                                setIsEditing(false)
                                setEditData(selectedUser)
                              }} size="sm">
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      </Tab>
                      
                      <Tab 
                        key="password" 
                        title={
                          <div className="flex items-center gap-2">
                            <Key size={16} />
                            Contraseña
                          </div>
                        }
                      >
                        <div className="space-y-6 mt-4 max-w-2xl">
                          {!isEditing && (
                            <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                              <p className="text-sm text-warning-600 flex items-center gap-2">
                                <Key size={16} />
                                Activa el modo edición para cambiar la contraseña
                              </p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Nueva Contraseña</label>
                              <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Ingresa nueva contraseña"
                                autoComplete="new-password"
                                name="new-password"
                                id="new-password"
                                isDisabled={!isEditing}
                                variant={isEditing ? "bordered" : "flat"}
                                classNames={{
                                  input: !isEditing ? "text-foreground" : "",
                                  inputWrapper: !isEditing ? "bg-default-100" : ""
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Confirmar Contraseña</label>
                              <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirma la contraseña"
                                autoComplete="new-password"
                                name="confirm-password"
                                id="confirm-password"
                                isDisabled={!isEditing}
                                variant={isEditing ? "bordered" : "flat"}
                                classNames={{
                                  input: !isEditing ? "text-foreground" : "",
                                  inputWrapper: !isEditing ? "bg-default-100" : ""
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Button 
                              color="primary"
                              onPress={handleChangePassword}
                              isDisabled={!isEditing || !newPassword || newPassword !== confirmPassword}
                            >
                              Cambiar Contraseña
                            </Button>
                            {newPassword && confirmPassword && newPassword !== confirmPassword && (
                              <span className="text-danger text-xs">Las contraseñas no coinciden</span>
                            )}
                          </div>
                        </div>
                      </Tab>
                      
                      <Tab key="activity" title={
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          Actividad
                        </div>
                      }>
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Último Login</label>
                              <p className="text-sm">
                                {selectedUser.lastLogin 
                                  ? new Date(selectedUser.lastLogin).toLocaleString()
                                  : 'Nunca'
                                }
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Fecha de Registro</label>
                              <p className="text-sm">
                                {new Date(selectedUser.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Última Actualización</label>
                              <p className="text-sm">
                                {new Date(selectedUser.updatedAt).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Email Verificado</label>
                              <p className="text-sm">
                                {selectedUser.isEmailVerified ? 'Sí' : 'No'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Tab>
                    </Tabs>
                  </CardBody>
                </>
              ) : (
                <CardBody className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Selecciona un usuario</h3>
                    <p className="text-sm">
                      Haz clic en un usuario de la lista para ver y editar sus detalles
                    </p>
                  </div>
                </CardBody>
              )}
            </Card>
          </div>
        </div>

        {/* Modales */}
        <UserModal
          isOpen={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          onSave={handleSaveUser}
          user={null}
          mode="create"
        />

        <InvitationModal
          isOpen={invitationModalOpen}
          onClose={() => setInvitationModalOpen(false)}
          onGenerate={handleGenerateInvitation}
        />

        {/* Modal de Confirmación de Eliminación */}
        <Modal 
          isOpen={deleteModalOpen} 
          onClose={() => {
            if (!isDeleting) {
              setDeleteModalOpen(false)
              setUserToDelete(null)
              setSuperAdminPassword('')
            }
          }}
          size="md"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-danger" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Confirmar Eliminación</h2>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
                </p>
                <p className="text-sm text-danger">
                  Esta acción eliminará al usuario permanentemente del sistema.
                </p>

                {currentUser?.role !== 'super_admin' && (
                  <Input
                    type="password"
                    label="Contraseña del Super Administrador"
                    placeholder="Ingresa la contraseña del super admin"
                    value={superAdminPassword}
                    onValueChange={setSuperAdminPassword}
                    startContent={<Key className="h-4 w-4 text-default-400" />}
                    isRequired
                    variant="bordered"
                  />
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="light" 
                onPress={() => {
                  setDeleteModalOpen(false)
                  setUserToDelete(null)
                  setSuperAdminPassword('')
                }}
                isDisabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                color="danger" 
                onPress={confirmDeleteUser}
                startContent={<Trash2 size={16} />}
                isLoading={isDeleting}
                isDisabled={isDeleting}
              >
                Eliminar Usuario
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Toast Notifications */}
        <ToastContainer>
          {toast.toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              onClose={() => toast.removeToast(t.id)}
            />
          ))}
        </ToastContainer>
      </div>
    </CRMLayout>
  )
}
