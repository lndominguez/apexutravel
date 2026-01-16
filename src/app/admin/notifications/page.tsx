'use client'

import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox
} from '@heroui/react'
import { Bell, Trash2, Eye, SlidersHorizontal, X, Shield, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { CRMLayout } from '@/components/layout/CRMLayout'
import { useAdminNotifications } from '@/swr'
import { useAuth } from '@/hooks/useAuth'

type PopulatedUser = {
  _id?: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
}

type AdminNotification = {
  _id: string
  title: string
  message: string
  type: string
  priority: string
  createdAt: string | Date
  dismissedAt?: string | Date
  userId?: PopulatedUser | string
  createdBy?: PopulatedUser | string
  metadata?: Record<string, unknown>
}

const formatDateTime = (value: unknown) => {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-ES')
}

const formatUserLabel = (u?: PopulatedUser | string) => {
  if (!u) return '—'
  if (typeof u === 'string') return u
  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim()
  return name || u.email || u._id || '—'
}

export default function AdminNotificationsPage() {
  const { isSuperAdmin } = useAuth()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)

  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [priority, setPriority] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [createdByEmail, setCreatedByEmail] = useState('')
  const [includeDismissed, setIncludeDismissed] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [superAdminMode, setSuperAdminMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const [selected, setSelected] = useState<AdminNotification | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filters = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      type: type || undefined,
      priority: priority || undefined,
      userEmail: userEmail || undefined,
      createdByEmail: createdByEmail || undefined,
      includeDismissed,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    }),
    [page, limit, search, type, priority, userEmail, createdByEmail, includeDismissed, dateFrom, dateTo]
  )

  const { notifications, pagination, isLoading, error, deleteNotificationGlobal, mutate } =
    useAdminNotifications(filters)

  const resetFilters = () => {
    setPage(1)
    setLimit(25)
    setSearch('')
    setType('')
    setPriority('')
    setUserEmail('')
    setCreatedByEmail('')
    setIncludeDismissed(true)
    setDateFrom('')
    setDateTo('')
    setShowAdvanced(false)
  }

  const handleVerifySuperAdmin = async () => {
    if (!password.trim()) {
      toast.error('Ingresa el password del super_admin')
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch('/api/admin/verify-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Password incorrecto')
      }

      setSuperAdminMode(true)
      setShowPasswordModal(false)
      setPassword('')
      toast.success('Modo Super Admin activado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al verificar password')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDelete = async (notif: AdminNotification) => {
    if (!superAdminMode) {
      toast.error('Debes acceder en modo Super Admin para eliminar')
      return
    }

    const ok = confirm('¿Eliminar esta notificación definitivamente?')
    if (!ok) return

    try {
      await deleteNotificationGlobal(notif._id)
      toast.success('Notificación eliminada')
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(notif._id)
        return next
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  const handleDeleteMultiple = async () => {
    if (!superAdminMode) {
      toast.error('Debes acceder en modo Super Admin para eliminar')
      return
    }

    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos una notificación')
      return
    }

    const ok = confirm(`¿Eliminar ${selectedIds.size} notificaciones definitivamente?`)
    if (!ok) return

    const errors: string[] = []
    for (const id of Array.from(selectedIds)) {
      try {
        await deleteNotificationGlobal(id)
      } catch (e) {
        errors.push(id)
      }
    }

    if (errors.length === 0) {
      toast.success(`${selectedIds.size} notificaciones eliminadas`)
      setSelectedIds(new Set())
    } else {
      toast.error(`${errors.length} notificaciones no pudieron eliminarse`)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set((notifications as AdminNotification[]).map((n) => n._id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <CRMLayout>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Bell className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">Notificaciones (Admin)</h1>
          <p className="text-sm text-default-500">Revisa y filtra notificaciones globales del sistema</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!superAdminMode ? (
            <Button
              color="warning"
              variant="flat"
              startContent={<Shield size={18} />}
              onPress={() => setShowPasswordModal(true)}
            >
              Acceder como Super Admin
            </Button>
          ) : (
            <Button
              color="success"
              variant="flat"
              startContent={<Shield size={18} />}
              onPress={() => setSuperAdminMode(false)}
            >
              Modo Super Admin (Activo)
            </Button>
          )}
          <Button variant="flat" onPress={() => mutate()}>
            Refrescar
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                label="Buscar"
                placeholder="Título o mensaje"
                value={search}
                onValueChange={(v) => {
                  setPage(1)
                  setSearch(v)
                }}
                className="flex-1 min-w-[200px]"
              />

              <Select
                label="Tipo"
                placeholder="Todos"
                selectedKeys={type ? [type] : []}
                onSelectionChange={(keys) => {
                  const v = (Array.from(keys)[0] as string) || ''
                  setPage(1)
                  setType(v)
                }}
                className="w-full sm:w-[160px]"
              >
                <SelectItem key="">Todos</SelectItem>
                <SelectItem key="info">Info</SelectItem>
                <SelectItem key="success">Success</SelectItem>
                <SelectItem key="warning">Warning</SelectItem>
                <SelectItem key="error">Error</SelectItem>
                <SelectItem key="booking">Booking</SelectItem>
                <SelectItem key="payment">Payment</SelectItem>
                <SelectItem key="system">System</SelectItem>
              </Select>

              <Select
                label="Prioridad"
                placeholder="Todas"
                selectedKeys={priority ? [priority] : []}
                onSelectionChange={(keys) => {
                  const v = (Array.from(keys)[0] as string) || ''
                  setPage(1)
                  setPriority(v)
                }}
                className="w-full sm:w-[160px]"
              >
                <SelectItem key="">Todas</SelectItem>
                <SelectItem key="low">Low</SelectItem>
                <SelectItem key="medium">Medium</SelectItem>
                <SelectItem key="high">High</SelectItem>
                <SelectItem key="urgent">Urgent</SelectItem>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Switch
                isSelected={includeDismissed}
                onValueChange={(v) => {
                  setPage(1)
                  setIncludeDismissed(v)
                }}
              >
                Incluir archivadas
              </Switch>

              <Select
                label="Por página"
                selectedKeys={[String(limit)]}
                onSelectionChange={(keys) => {
                  const v = parseInt(String(Array.from(keys)[0] || '25'), 10)
                  setPage(1)
                  setLimit(v)
                }}
                className="w-full sm:w-[140px]"
              >
                <SelectItem key="10">10</SelectItem>
                <SelectItem key="25">25</SelectItem>
                <SelectItem key="50">50</SelectItem>
                <SelectItem key="100">100</SelectItem>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-divider">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="flat"
                  size="sm"
                  startContent={<SlidersHorizontal size={16} />}
                  onPress={() => setShowAdvanced((p) => !p)}
                >
                  {showAdvanced ? 'Ocultar' : 'Mostrar'} filtros avanzados
                </Button>

                <Button
                  variant="light"
                  size="sm"
                  startContent={<X size={16} />}
                  onPress={resetFilters}
                >
                  Limpiar
                </Button>

                {superAdminMode && selectedIds.size > 0 && (
                  <Button
                    color="danger"
                    size="sm"
                    variant="flat"
                    startContent={<Trash size={16} />}
                    onPress={handleDeleteMultiple}
                  >
                    Eliminar {selectedIds.size} seleccionadas
                  </Button>
                )}
              </div>
            </div>

            {showAdvanced && (
              <div className="p-4 rounded-lg bg-default-50 border border-divider">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      label="Destinatario (email)"
                      placeholder="user@..."
                      value={userEmail}
                      onValueChange={(v) => {
                        setPage(1)
                        setUserEmail(v)
                      }}
                      className="flex-1"
                    />

                    <Input
                      label="Creado por (email)"
                      placeholder="creator@..."
                      value={createdByEmail}
                      onValueChange={(v) => {
                        setPage(1)
                        setCreatedByEmail(v)
                      }}
                      className="flex-1"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      label="Desde"
                      type="date"
                      value={dateFrom}
                      onValueChange={(v) => {
                        setPage(1)
                        setDateFrom(v)
                      }}
                      className="flex-1"
                    />

                    <Input
                      label="Hasta"
                      type="date"
                      value={dateTo}
                      onValueChange={(v) => {
                        setPage(1)
                        setDateTo(v)
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-6 text-danger">
              {(error as any)?.message || 'Error cargando notificaciones'}
            </div>
          ) : (
            <>
              <div className="w-full" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table aria-label="Tabla de notificaciones admin" className="min-w-[980px]">
                  <TableHeader>
                    <TableColumn width={superAdminMode ? 50 : 0} className={superAdminMode ? '' : 'hidden'}>
                      {superAdminMode && (
                        <Checkbox
                          isSelected={selectedIds.size === notifications.length && notifications.length > 0}
                          onValueChange={toggleSelectAll}
                        />
                      )}
                    </TableColumn>
                    <TableColumn>TÍTULO</TableColumn>
                    <TableColumn>TIPO</TableColumn>
                    <TableColumn>PRIORIDAD</TableColumn>
                    <TableColumn>DESTINATARIO</TableColumn>
                    <TableColumn>CREADO POR</TableColumn>
                    <TableColumn>FECHA</TableColumn>
                    <TableColumn>ACCIONES</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No hay notificaciones">
                    {(notifications as AdminNotification[]).map((n) => (
                      <TableRow key={n._id}>
                        <TableCell className={superAdminMode ? '' : 'hidden'}>
                          {superAdminMode && (
                            <Checkbox
                              isSelected={selectedIds.has(n._id)}
                              onValueChange={() => toggleSelect(n._id)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[360px] truncate font-medium">{n.title}</div>
                          <div className="text-xs text-default-500 max-w-[360px] truncate">{n.message}</div>
                        </TableCell>
                        <TableCell>{n.type}</TableCell>
                        <TableCell>{n.priority}</TableCell>
                        <TableCell>{formatUserLabel(n.userId)}</TableCell>
                        <TableCell>{formatUserLabel(n.createdBy)}</TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDateTime(n.createdAt)}</div>
                          {n.dismissedAt && <div className="text-xs text-default-500">Archivada</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => setSelected(n)}
                            >
                              <Eye size={18} />
                            </Button>
                            {superAdminMode && (
                              <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                isIconOnly
                                onPress={() => handleDelete(n)}
                              >
                                <Trash2 size={18} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!!pagination && (pagination.pages || 0) > 1 && (
                <div className="flex justify-center py-4">
                  <Pagination
                    total={pagination.pages || 1}
                    page={page}
                    onChange={setPage}
                    showControls
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showPasswordModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowPasswordModal(false)
            setPassword('')
          }
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Shield size={20} />
            Acceder como Super Admin
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500 mb-4">
              Ingresa el password del super_admin para habilitar las funciones de eliminación.
            </p>
            <Input
              type="password"
              label="Password Super Admin"
              placeholder="Ingresa el password"
              value={password}
              onValueChange={setPassword}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerifySuperAdmin()
                }
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setShowPasswordModal(false)
                setPassword('')
              }}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleVerifySuperAdmin}
              isLoading={isVerifying}
            >
              Verificar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={!!selected} onOpenChange={(open) => {
        if (!open) setSelected(null)
      }} size="2xl">
        <ModalContent>
          <ModalHeader>Detalle de notificación</ModalHeader>
          <ModalBody>
            {selected && (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-default-500">Título</div>
                  <div className="font-semibold">{selected.title}</div>
                </div>
                <div>
                  <div className="text-sm text-default-500">Mensaje</div>
                  <div className="whitespace-pre-wrap">{selected.message}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-default-500">Tipo</div>
                    <div>{selected.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-default-500">Prioridad</div>
                    <div>{selected.priority}</div>
                  </div>
                  <div>
                    <div className="text-sm text-default-500">Destinatario</div>
                    <div>{formatUserLabel(selected.userId)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-default-500">Creado por</div>
                    <div>{formatUserLabel(selected.createdBy)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-default-500">Fecha</div>
                    <div>{formatDateTime(selected.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-default-500">Archivada</div>
                    <div>{selected.dismissedAt ? formatDateTime(selected.dismissedAt) : 'No'}</div>
                  </div>
                </div>
                {selected.metadata && (
                  <div>
                    <div className="text-sm text-default-500">Metadata</div>
                    <pre className="text-xs bg-default-100 p-3 rounded-lg overflow-auto">
                      {JSON.stringify(selected.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </CRMLayout>
  )
}
