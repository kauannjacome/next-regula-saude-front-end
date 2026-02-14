'use client'

import { useState, Fragment, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Edit, Trash, UserPlus, Users as UsersIcon, ChevronDown, ChevronUp, RotateCcw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, ConfirmDialog, DataTableLayout } from '@/components/shared';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link'
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'
import { useSession } from 'next-auth/react'
import { useCachedUsers } from '@/hooks/use-cached-data'

interface User {
  id: string
  uuid: string
  name: string
  email: string
  status: string
  createdAt: string
  deletedAt?: string | null
  position: string
  registryType?: string
  registryNumber?: string
  registryState?: string
  employments?: Array<{
    tenantRole?: { name: string; displayName: string }
  }>
}

interface PendingEmployment {
  id: number
  userId: string
  userName: string
  userEmail: string
  userCpf: string
  userPhone: string
  unitName: string | null
  type: 'INVITE' | 'SELF_REGISTRATION'
  invitedByName: string | null
  requestedByName: string | null
  createdAt: string
}

interface TenantRole {
  id: string
  name: string
  displayName: string
  priority: number
}

export default function UsersPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const isTrashMode = searchParams.get('trash') === 'true'
  const isSystemManager = session?.user?.isSystemManager === true

  // Users tab state
  const [search, setSearch] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [trashData, setTrashData] = useState<User[]>([])
  const [trashLoading, setTrashLoading] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Pending tab state
  const [pendingEmployments, setPendingEmployments] = useState<PendingEmployment[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedEmployment, setSelectedEmployment] = useState<PendingEmployment | null>(null)
  const [roles, setRoles] = useState<TenantRole[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [respondLoading, setRespondLoading] = useState(false)

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const { data: cachedUsers, isLoading: cacheLoading, refetch: fetchUsers } = useCachedUsers()

  const fetchTrashData = async () => {
    try {
      setTrashLoading(true)
      const response = await apiClient.get('/users?trash=true')
      setTrashData(response.data.data || [])
    } catch (error) {
      console.error('Erro ao buscar lixeira:', error)
      toast.error('Erro ao carregar lixeira')
    } finally {
      setTrashLoading(false)
    }
  }

  const fetchPendingEmployments = useCallback(async () => {
    try {
      setPendingLoading(true)
      const response = await apiClient.get('/employments/pending')
      setPendingEmployments(response.data || [])
    } catch (error) {
      console.error('Erro ao buscar pendentes:', error)
    } finally {
      setPendingLoading(false)
    }
  }, [])

  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiClient.get('/roles')
      setRoles(response.data || [])
    } catch (error) {
      console.error('Erro ao buscar papéis:', error)
    }
  }, [])

  useEffect(() => {
    if (isTrashMode && isSystemManager) {
      fetchTrashData()
    }
  }, [isTrashMode, isSystemManager])

  useEffect(() => {
    fetchPendingEmployments()
    fetchRoles()
  }, [fetchPendingEmployments, fetchRoles])

  const users = isTrashMode ? trashData : cachedUsers
  const isLoading = isTrashMode ? trashLoading : cacheLoading
  const canDelete = session?.user?.isSystemManager || (session?.user?.permissions || []).includes('users.delete')

  const filtered = users.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await apiClient.delete(`/users/${selectedId}`)
      toast.success('Usuário excluído com sucesso')
      setDeleteDialogOpen(false)
      setSelectedId(null)
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      const message = error?.response?.data?.error || 'Erro ao excluir usuário'
      toast.error(message)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'User', id: String(id) })
      })
      if (!response.ok) throw new Error('Erro ao restaurar')
      toast.success('Usuário restaurado com sucesso')
      fetchTrashData()
    } catch (error) {
      console.error('Erro ao restaurar:', error)
      toast.error('Erro ao restaurar usuário')
    }
  }

  const handleAccept = async () => {
    if (!selectedEmployment || !selectedRoleId) {
      toast.error('Selecione um papel')
      return
    }

    setRespondLoading(true)
    try {
      await apiClient.patch(`/employments/${selectedEmployment.id}/respond`, {
        action: 'ACCEPT',
        roleId: selectedRoleId,
      })
      toast.success('Solicitação aceita com sucesso')
      setAcceptDialogOpen(false)
      setSelectedEmployment(null)
      setSelectedRoleId('')
      fetchPendingEmployments()
      fetchUsers()
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Erro ao aceitar solicitação'
      toast.error(message)
    } finally {
      setRespondLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedEmployment) return

    setRespondLoading(true)
    try {
      await apiClient.patch(`/employments/${selectedEmployment.id}/respond`, {
        action: 'REJECT',
      })
      toast.success('Solicitação rejeitada')
      setRejectDialogOpen(false)
      setSelectedEmployment(null)
      fetchPendingEmployments()
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Erro ao rejeitar solicitação'
      toast.error(message)
    } finally {
      setRespondLoading(false)
    }
  }

  const pendingCount = pendingEmployments.length

  return (
    <Tabs defaultValue="users" className="w-full">
      <DataTableLayout
        title={isTrashMode ? 'Lixeira - Usuários' : 'Usuários'}
        subtitle={isTrashMode ? 'Itens excluídos (mais recentes primeiro)' : undefined}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Buscar por nome ou email..."
        actions={
          <div className="flex items-center gap-2">
            <TabsList>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-1.5">
                Solicitações
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            {!isTrashMode && (
              <Link href="/users/new" className="w-full sm:w-auto">
                <Button className="w-full h-9 bg-primary text-white hover:bg-primary/90 shadow-none rounded-md">
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden xl:inline">Novo Usuário</span>
                  <span className="xl:hidden">Novo</span>
                </Button>
              </Link>
            )}
          </div>
        }
      >
        <TabsContent value="users" className="mt-0">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-b-gray-100 dark:border-b-zinc-800">
                <TableHead className="w-10"></TableHead>
                <TableHead className="font-medium text-gray-600 dark:text-gray-400">Nome</TableHead>
                <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">Email</TableHead>
                <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Papel</TableHead>
                <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Status</TableHead>
                <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <UsersIcon className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                      <p>{isTrashMode ? 'Nenhum item na lixeira' : 'Nenhum usuário encontrado'}</p>
                      {!isTrashMode && (
                        <Link href="/users/new">
                          <Button variant="link" className="text-primary">Cadastrar novo</Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <Fragment key={item.id}>
                    <TableRow className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border-b-gray-50 dark:border-b-zinc-900 transition-colors cursor-pointer group">
                      <TableCell className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleRow(item.id)}
                        >
                          {expandedRows.has(item.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100 py-3">
                        <div className="flex flex-col gap-1">
                          <span>{item.name}</span>
                          <span className="md:hidden text-xs text-muted-foreground">{item.email}</span>
                          <div className="lg:hidden flex items-center gap-2 mt-1">
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300">
                              {item.employments?.[0]?.tenantRole?.displayName || item.employments?.[0]?.tenantRole?.name || '-'}
                             </span>
                             <StatusBadge status={item.status || 'INACTIVE'} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400">
                        {item.email}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300">
                          {item.employments?.[0]?.tenantRole?.displayName || item.employments?.[0]?.tenantRole?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <StatusBadge status={item.status || 'INACTIVE'} />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          {isTrashMode && isSystemManager ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleRestore(item.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Restaurar</span>
                            </Button>
                          ) : (
                            <>
                              <Link href={`/users/${item.id}/edit`}>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50">
                                  <Edit className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Editar</span>
                                </Button>
                              </Link>
                              {canDelete && item.id !== session?.user?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedId(item.id)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(item.id) && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-gray-100 dark:border-b-zinc-800">
                        <TableCell colSpan={6} className="py-3 px-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground text-xs block">Cargo</span>
                              <span className="text-xs">{item.position || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Registro Profissional</span>
                              <span className="text-xs font-mono">
                                {item.registryType && item.registryNumber
                                  ? `${item.registryType} ${item.registryNumber}/${item.registryState || ''}`
                                  : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Status</span>
                              <StatusBadge status={item.status || 'INACTIVE'} />
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Data de Cadastro</span>
                              <span className="text-xs">
                                {item.createdAt
                                  ? new Date(item.createdAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : '-'}
                              </span>
                            </div>
                            {isTrashMode && item.deletedAt && (
                              <div>
                                <span className="text-muted-foreground text-xs block">Excluído em</span>
                                <span className="text-xs text-red-500">
                                  {new Date(item.deletedAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-b-gray-100 dark:border-b-zinc-800">
                <TableHead className="font-medium text-gray-600 dark:text-gray-400">Nome</TableHead>
                <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">Email</TableHead>
                <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">CPF</TableHead>
                <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Tipo</TableHead>
                <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">Data</TableHead>
                <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : pendingEmployments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                      <p>Nenhuma solicitação pendente</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pendingEmployments.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border-b-gray-50 dark:border-b-zinc-900 transition-colors">
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100 py-3">
                      <div className="flex flex-col gap-1">
                        <span>{emp.userName}</span>
                        <span className="md:hidden text-xs text-muted-foreground">{emp.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400">
                      {emp.userEmail}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {emp.userCpf || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={emp.type === 'SELF_REGISTRATION' ? 'secondary' : 'outline'} className="text-xs">
                        {emp.type === 'SELF_REGISTRATION' ? 'Auto-cadastro' : 'Convite'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(emp.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setSelectedEmployment(emp)
                            setSelectedRoleId('')
                            setAcceptDialogOpen(true)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Aceitar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedEmployment(emp)
                            setRejectDialogOpen(true)
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Rejeitar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </DataTableLayout>

      {/* Delete user dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Usuário"
        description="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />

      {/* Accept dialog with role selection */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aceitar Solicitação</DialogTitle>
            <DialogDescription>
              Selecione o papel para <strong>{selectedEmployment?.userName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Email:</span> {selectedEmployment?.userEmail}</p>
              {selectedEmployment?.userCpf && (
                <p><span className="text-muted-foreground">CPF:</span> {selectedEmployment.userCpf}</p>
              )}
              {selectedEmployment?.unitName && (
                <p><span className="text-muted-foreground">Unidade:</span> {selectedEmployment.unitName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select onValueChange={setSelectedRoleId} value={selectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)} disabled={respondLoading}>
              Cancelar
            </Button>
            <Button onClick={handleAccept} disabled={respondLoading || !selectedRoleId}>
              {respondLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Aceitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <ConfirmDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title="Rejeitar Solicitação"
        description={`Tem certeza que deseja rejeitar a solicitação de ${selectedEmployment?.userName}?`}
        confirmLabel="Rejeitar"
        onConfirm={handleReject}
        variant="destructive"
      />
    </Tabs>
  )
}
