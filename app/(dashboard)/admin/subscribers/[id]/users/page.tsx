'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  Edit,
  Trash,
  MoreHorizontal,
  Shield,
  Lock,
  Unlock,
  KeyRound,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface User {
  id: string
  name: string
  email: string
  cpf?: string
  phone?: string
  role?: string
  roleDisplayName?: string
  status: string
  isBlocked: boolean
  twoFactorEnabled: boolean
  createdAt: string
}

interface TenantRole {
  id: string
  name: string
  displayName: string
}

interface Subscriber {
  id: number
  name: string
}

export default function SubscriberUsersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: subscriberId } = use(params)
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<TenantRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Estados do modal de criar/editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    roleId: '',
    password: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Estados do modal de deletar
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Estados do dialog de reset de senha
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ userId: string; userName: string; email: string } | null>(null)
  const [resetAlso2FA, setResetAlso2FA] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  // Verificar permissão
  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user?.isSystemManager) {
      router.push('/')
      return
    }
    fetchData()
  }, [session, sessionStatus, router, subscriberId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [subResponse, usersResponse, rolesResponse] = await Promise.all([
        fetch(`/api/admin/subscribers/${subscriberId}`),
        fetch(`/api/admin/subscribers/${subscriberId}/users?includeAll=true`),
        fetch(`/api/tenant/roles?subscriberId=${subscriberId}`),
      ])

      if (!subResponse.ok) throw new Error('Assinante não encontrado')
      const subData = await subResponse.json()
      setSubscriber(subData)

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || usersData || [])
      }

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        setRoles(rolesData.roles || rolesData.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do assinante')
      router.push('/admin/subscribers')
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      roleId: '',
      password: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      cpf: user.cpf || '',
      phone: user.phone || '',
      roleId: '', // Será preenchido pelo select
      password: '',
    })
    setModalOpen(true)
  }

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios')
      return
    }

    if (!editingUser && !formData.password) {
      toast.error('Senha é obrigatória para novos usuários')
      return
    }

    if (!editingUser && !formData.roleId) {
      toast.error('Selecione um perfil para o usuário')
      return
    }

    setIsSaving(true)
    try {
      const url = editingUser
        ? `/api/admin/subscribers/${subscriberId}/users/${editingUser.id}`
        : `/api/admin/subscribers/${subscriberId}/users`

      const method = editingUser ? 'PUT' : 'POST'

      const body: Record<string, string | number> = {
        name: formData.name,
        email: formData.email,
        subscriberId: parseInt(subscriberId),
      }

      if (formData.cpf) body.cpf = formData.cpf
      if (formData.phone) body.phone = formData.phone
      if (formData.roleId) body.roleId = formData.roleId
      if (formData.password) body.password = formData.password

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar usuário')
      }

      toast.success(
        editingUser ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso'
      )
      setModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar usuário')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUserId) return

    try {
      const response = await fetch(
        `/api/admin/subscribers/${subscriberId}/users/${selectedUserId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir usuário')
      }

      toast.success('Usuário excluído com sucesso')
      setDeleteDialogOpen(false)
      setSelectedUserId(null)
      fetchData()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir usuário')
    }
  }

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      const response = await fetch(`/api/admin/users`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: isBlocked ? 'unblock' : 'block',
        }),
      })

      if (!response.ok) throw new Error('Erro ao alterar status')

      toast.success(isBlocked ? 'Usuário desbloqueado' : 'Usuário bloqueado')
      fetchData()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordDialog) return

    setIsResettingPassword(true)
    try {
      const response = await fetch(`/api/users/${resetPasswordDialog.userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset2FA: resetAlso2FA }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao resetar senha')
      }

      const data = await response.json()
      toast.success(
        `Senha temporária para ${resetPasswordDialog.userName}: ${data.tempPassword}${resetAlso2FA ? ' (2FA resetado)' : ''}`,
        { duration: 15000 }
      )
      setResetPasswordDialog(null)
      setResetAlso2FA(false)
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao resetar senha')
    } finally {
      setIsResettingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Usuários - ${subscriber?.name || 'Assinante'}`}
        description="Gerencie os usuários deste assinante"
        backHref="/admin/subscribers"
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openCreateModal}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-10 w-10" />
                    <p>Nenhum usuário encontrado</p>
                    <Button variant="link" onClick={openCreateModal}>
                      Criar primeiro usuário
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline">
                      {user.roleDisplayName || user.role || 'Sem perfil'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge variant="destructive">Bloqueado</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetPasswordDialog({ userId: user.id, userName: user.name, email: user.email })}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Resetar Senha
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                        >
                          {user.isBlocked ? (
                            <>
                              <Unlock className="mr-2 h-4 w-4" />
                              Desbloquear
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              Bloquear
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="w-[95vw] sm:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Atualize os dados do usuário'
                : 'Preencha os dados para criar um novo usuário'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleId">Perfil {!editingUser && '*'}</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.displayName || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Senha inicial do usuário"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? 'Salvando...' : editingUser ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Usuário"
        description="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDeleteUser}
        variant="destructive"
      />

      {/* Dialog de Reset de Senha */}
      <Dialog open={!!resetPasswordDialog} onOpenChange={(open) => {
        if (!open) {
          setResetPasswordDialog(null)
          setResetAlso2FA(false)
        }
      }}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Resetar Senha
            </DialogTitle>
            <DialogDescription>
              Uma senha temporária será gerada para <strong>{resetPasswordDialog?.userName}</strong>.
              {resetPasswordDialog?.email && (
                <span className="block text-xs mt-1">{resetPasswordDialog.email}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              O usuário será obrigado a trocar a senha no próximo login.
            </p>

            {(session?.user?.isSystemManager || session?.user?.permissions?.includes('users.reset_2fa')) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reset-2fa"
                  checked={resetAlso2FA}
                  onCheckedChange={(checked) => setResetAlso2FA(checked === true)}
                />
                <label
                  htmlFor="reset-2fa"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Resetar 2FA também
                </label>
              </div>
            )}

            {resetAlso2FA && (
              <p className="text-xs text-amber-600">
                O usuário precisará configurar o 2FA novamente após o login.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setResetPasswordDialog(null); setResetAlso2FA(false) }}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={isResettingPassword}>
              {isResettingPassword ? 'Resetando...' : 'Resetar Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
