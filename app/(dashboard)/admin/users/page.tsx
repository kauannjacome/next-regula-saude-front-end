'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/shared/page-header'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Lock,
  Unlock,
  Shield,
  ShieldOff,
  KeyRound,
  RotateCcw,
  Crown,
  AlertTriangle,
  Copy,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Shuffle,
} from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string | null
  cpf: string | null
  isBlocked: boolean
  isPasswordTemp: boolean
  twoFactorEnabled: boolean
  isSystemManager: boolean | null
  numberTry: number | null
  createdAt: string
  employment: {
    subscriber: { id: number; name: string }
    role: { id: string; displayName: string; color: string | null } | null
  } | null
}

interface Filters {
  subscribers: { id: number; name: string }[]
  roles: { id: string; name: string }[]
}

export default function AdminUsersPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filters, setFilters] = useState<Filters | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterSubscriber, setFilterSubscriber] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: string; userName: string } | null>(null)
  const [isActioning, setIsActioning] = useState(false)

  // Temp password modal
  const [tempPasswordModal, setTempPasswordModal] = useState<{ userId: string; userName: string; email: string } | null>(null)
  const [tempPassword, setTempPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [resetAlso2FA, setResetAlso2FA] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user?.isSystemManager) {
      router.push('/')
      return
    }
    fetchUsers()
  }, [session, sessionStatus, router, page, filterSubscriber, filterStatus])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '50')
      if (search) params.set('search', search)
      if (filterSubscriber !== 'all') params.set('subscriberId', filterSubscriber)
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        if (!filters) {
          setFilters(data.filters)
        }
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const handleAction = async () => {
    if (!confirmAction) return

    setIsActioning(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: confirmAction.userId,
          action: confirmAction.action
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchUsers()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erro ao executar ação')
    } finally {
      setIsActioning(false)
      setConfirmAction(null)
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'block': return 'Bloquear usuário'
      case 'unblock': return 'Desbloquear usuário'
      case 'reset_tries': return 'Resetar tentativas de login'
      case 'force_2fa': return 'Forçar reconfiguração de 2FA'
      default: return action
    }
  }

  // Gerar senha aleatória
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTempPassword(password)
  }

  // Copiar senha
  const handleCopyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
      toast.success('Senha copiada!')
    }
  }

  // Salvar senha temporária
  const handleSaveTempPassword = async () => {
    if (!tempPasswordModal || !tempPassword) return

    if (tempPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setIsSavingPassword(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tempPasswordModal.userId,
          action: 'set_temp_password',
          tempPassword,
          reset2FA: resetAlso2FA
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          resetAlso2FA
            ? `Senha temporária definida e 2FA resetado para ${tempPasswordModal.userName}`
            : `Senha temporária definida para ${tempPasswordModal.userName}`
        )
        setTempPasswordModal(null)
        setTempPassword('')
        setShowPassword(false)
        setResetAlso2FA(false)
        fetchUsers()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Erro ao definir senha temporária')
    } finally {
      setIsSavingPassword(false)
    }
  }

  // Fechar modal de senha temporária
  const closeTempPasswordModal = () => {
    setTempPasswordModal(null)
    setTempPassword('')
    setShowPassword(false)
    setResetAlso2FA(false)
  }

  if (sessionStatus === 'loading') {
    return <CardSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Usuários"
        description={`${total} usuários no sistema`}
        icon={Users}
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch}>Buscar</Button>
        </div>

        <Select value={filterSubscriber} onValueChange={(v) => { setFilterSubscriber(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Assinante" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Assinantes</SelectItem>
            {filters?.subscribers.map((sub) => (
              <SelectItem key={sub.id} value={String(sub.id)}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="blocked">Bloqueados</SelectItem>
            <SelectItem value="no2fa">Sem 2FA</SelectItem>
            <SelectItem value="temp_password">Senha Temporária</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => { setPage(1); fetchUsers(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <CardSkeleton />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum usuário encontrado"
          description="Não há usuários com os filtros selecionados"
        />
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Assinante</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.isSystemManager && (
                          <Crown className="h-4 w-4 text-purple-600" />
                        )}
                        <div>
                          <p className="font-medium">{user.name || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.employment?.subscriber.name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.employment?.role ? (
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: user.employment.role.color || undefined }}
                          className="text-white"
                        >
                          {user.employment.role.displayName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Badge variant="destructive">
                          <Lock className="h-3 w-3 mr-1" />
                          Bloqueado
                        </Badge>
                      ) : user.isPasswordTemp ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          <KeyRound className="h-3 w-3 mr-1" />
                          Senha Temp.
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      )}
                      {(user.numberTry || 0) > 0 && (
                        <span className="ml-2 text-xs text-amber-600">
                          ({user.numberTry} tentativas)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.twoFactorEnabled ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          <ShieldOff className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={!!user.isSystemManager && user.id !== session?.user?.id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.isBlocked ? (
                            <DropdownMenuItem onClick={() => setConfirmAction({ userId: user.id, action: 'unblock', userName: user.name || user.email || '' })}>
                              <Unlock className="h-4 w-4 mr-2" />
                              Desbloquear
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setConfirmAction({ userId: user.id, action: 'block', userName: user.name || user.email || '' })}>
                              <Lock className="h-4 w-4 mr-2" />
                              Bloquear
                            </DropdownMenuItem>
                          )}
                          {(user.numberTry || 0) > 0 && (
                            <DropdownMenuItem onClick={() => setConfirmAction({ userId: user.id, action: 'reset_tries', userName: user.name || user.email || '' })}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Resetar Tentativas
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setTempPasswordModal({ userId: user.id, userName: user.name || 'Usuário', email: user.email || '' })}>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Definir Senha Temporária
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmAction({ userId: user.id, action: 'force_2fa', userName: user.name || user.email || '' })}>
                            <Shield className="h-4 w-4 mr-2" />
                            Forçar Reconfig. 2FA
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages} ({total} usuários)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction ? getActionLabel(confirmAction.action) : ''}
        description={`Tem certeza que deseja ${confirmAction ? getActionLabel(confirmAction.action).toLowerCase() : ''} para "${confirmAction?.userName}"?`}
        confirmText="Confirmar"
        onConfirm={handleAction}
        isLoading={isActioning}
        variant={confirmAction?.action === 'block' ? 'destructive' : 'default'}
      />

      {/* Temp Password Modal */}
      <Dialog open={!!tempPasswordModal} onOpenChange={closeTempPasswordModal}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Definir Senha Temporária
            </DialogTitle>
            <DialogDescription>
              Defina uma senha temporária para <strong>{tempPasswordModal?.userName}</strong>
              {tempPasswordModal?.email && (
                <span className="block text-xs mt-1">{tempPasswordModal.email}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="temp-password">Nova Senha Temporária</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="temp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Digite a senha..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  title="Gerar senha aleatória"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyPassword}
                  disabled={!tempPassword}
                  title="Copiar senha"
                >
                  {copiedPassword ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres. O usuário será obrigado a trocar a senha no próximo login.
              </p>
            </div>

            {tempPassword && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Anote a senha antes de salvar! Ela não poderá ser visualizada depois.</span>
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reset-2fa-admin"
                checked={resetAlso2FA}
                onCheckedChange={(checked) => setResetAlso2FA(checked === true)}
              />
              <label
                htmlFor="reset-2fa-admin"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Resetar 2FA também
              </label>
            </div>

            {resetAlso2FA && (
              <p className="text-xs text-amber-600">
                O usuário precisará configurar o 2FA novamente após o login.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeTempPasswordModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTempPassword}
              disabled={!tempPassword || tempPassword.length < 6 || isSavingPassword}
            >
              {isSavingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Senha'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
