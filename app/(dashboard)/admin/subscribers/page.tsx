'use client'

import { useState, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash, Building2, CheckCircle, Shield, FileSpreadsheet, Bell, Users, Settings, Loader2, Clock, Unlock, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog, DataTableLayout } from '@/components/shared';
import { SigtapImportModal } from '@/components/admin/sigtap-import-modal';
import Link from 'next/link'
import { toast } from 'sonner';
import { formatCNPJ } from '@/lib/format';

type SubscriptionStatus = 'ACTIVE' | 'OVERDUE' | 'TEMPORARY_UNBLOCK' | 'BLOCKED'

interface Subscriber {
  id: string
  name: string
  cnpj: string
  municipalityName: string
  email: string
  city: string
  stateAcronym: string
  subscriptionStatus: SubscriptionStatus
  _count: {
    userEmployments: number
    citizens: number
    regulations: number
  }
}

const subscriptionStatusConfig: Record<SubscriptionStatus, { label: string; className: string; icon: typeof CheckCircle }> = {
  ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
  OVERDUE: { label: 'Em Atraso', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300', icon: Clock },
  TEMPORARY_UNBLOCK: { label: 'Desbloqueio Temp.', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Unlock },
  BLOCKED: { label: 'Bloqueado', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: Ban },
}

export default function SubscribersPage() {
  const [search, setSearch] = useState('')
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sigtapModalOpen, setSigtapModalOpen] = useState(false)
  const [selectedSubscriber, setSelectedSubscriber] = useState<{ id: string; name: string } | null>(null)
  const [enteringSubscriber, setEnteringSubscriber] = useState<string | null>(null)

  const handleEnterSubscriber = async (subscriberId: string, subscriberName: string) => {
    setEnteringSubscriber(subscriberId)
    try {
      const response = await fetch('/api/admin/enter-subscriber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriberId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao entrar no assinante')
      }

      toast.success(`Gerenciando ${subscriberName}`)
      window.location.href = '/regulations'
    } catch (error) {
      console.error('Error entering subscriber:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao entrar no assinante')
    } finally {
      setEnteringSubscriber(null)
    }
  }

  const fetchSubscribers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/subscribers')
      if (!response.ok) throw new Error('Erro ao buscar assinantes')
      const data = await response.json()
      setSubscribers(data.subscribers || data.data || [])
    } catch (error) {
      console.error('Erro ao buscar assinantes:', error)
      toast.error('Erro ao carregar assinantes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const filtered = subscribers.filter((item) => {
    const term = search.toLowerCase()
    return item.name.toLowerCase().includes(term) ||
      (item.cnpj && item.cnpj.includes(search.replace(/\D/g, ''))) ||
      (item.municipalityName && item.municipalityName.toLowerCase().includes(term))
  })

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      const response = await fetch(`/api/admin/subscribers/${selectedId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir')
      toast.success('Assinante excluído com sucesso')
      setDeleteDialogOpen(false)
      fetchSubscribers()
    } catch (error) {
      console.error('Erro ao excluir assinante:', error)
      toast.error('Erro ao excluir assinante')
      setDeleteDialogOpen(false)
    }
  }

  const handleChangeStatus = async (id: string, newStatus: SubscriptionStatus) => {
    try {
      const response = await fetch(`/api/admin/subscribers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionStatus: newStatus })
      })
      if (!response.ok) throw new Error('Erro ao alterar status')
      toast.success(`Status alterado para "${subscriptionStatusConfig[newStatus].label}"`)
      fetchSubscribers()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do assinante')
    }
  }

  return (
    <DataTableLayout
      title="Assinantes"
      subtitle="Gerencie os assinantes do sistema"
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar por nome ou CNPJ..."
      actions={
        <Link href="/admin/subscribers/new">
          <Button className="h-9 bg-primary text-white hover:bg-primary/90 shadow-none rounded-md">
            <Building2 className="h-4 w-4 mr-2" />
            <span className="hidden xl:inline">Novo Assinante</span>
            <span className="xl:hidden">Novo</span>
          </Button>
        </Link>
      }
    >
      <Table>
        <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b-gray-100 dark:border-b-zinc-800">
            <TableHead className="pl-6 font-medium text-gray-600 dark:text-gray-400">Nome</TableHead>
            <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">CNPJ</TableHead>
            <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Município</TableHead>
            <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Usuários</TableHead>
            <TableHead className="font-medium text-gray-600 dark:text-gray-400">Assinatura</TableHead>
            <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j} className={j === 0 ? "pl-6" : j === 5 ? "pr-6" : ""}><Skeleton className="h-4 w-24" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p>Nenhum assinante encontrado</p>
                  <Link href="/admin/subscribers/new">
                    <Button variant="link" className="text-primary">Cadastrar novo</Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((item) => (
              <TableRow key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border-b-gray-50 dark:border-b-zinc-900 transition-colors cursor-pointer group">
                <TableCell className="font-medium text-gray-900 dark:text-gray-100 pl-6 py-3">{item.name}</TableCell>
                <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400 font-mono">
                  {formatCNPJ(item.cnpj)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-gray-500 dark:text-gray-400">
                  {item.city}{item.stateAcronym ? `/${item.stateAcronym}` : ''}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-gray-500 dark:text-gray-400">
                  {item._count?.userEmployments ?? 0}
                </TableCell>
                <TableCell>
                  {(() => {
                    const status = item.subscriptionStatus || 'ACTIVE'
                    const config = subscriptionStatusConfig[status]
                    const Icon = config.icon
                    return (
                      <Badge variant="secondary" className={config.className}>
                        <Icon className="mr-1 h-3 w-3" />{config.label}
                      </Badge>
                    )
                  })()}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={enteringSubscriber === item.id}
                      onClick={() => handleEnterSubscriber(item.id, item.name)}
                    >
                      {enteringSubscriber === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Gerenciar</span>
                        </>
                      )}
                    </Button>
                    <Link href={`/admin/subscribers/${item.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50">
                        <Edit className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/subscribers/${item.id}/users`}>
                            <Users className="mr-2 h-4 w-4" />Gerenciar Usuários
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/subscribers/${item.id}/roles`}>
                            <Shield className="mr-2 h-4 w-4" />Roles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/subscribers/${item.id}/notifications`}>
                            <Bell className="mr-2 h-4 w-4" />Notificações
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedSubscriber({ id: item.id, name: item.name })
                            setSigtapModalOpen(true)
                          }}
                        >
                          <FileSpreadsheet className="mr-2 h-4 w-4" />Importar SIGTAP
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/subscribers/${item.id}/import-citizens`}>
                            <Users className="mr-2 h-4 w-4" />Importar CSV Cidadãos
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {(Object.keys(subscriptionStatusConfig) as SubscriptionStatus[])
                          .filter(s => s !== item.subscriptionStatus)
                          .map(s => {
                            const cfg = subscriptionStatusConfig[s]
                            const Icon = cfg.icon
                            return (
                              <DropdownMenuItem key={s} onClick={() => handleChangeStatus(item.id, s)}>
                                <Icon className="mr-2 h-4 w-4" />{cfg.label}
                              </DropdownMenuItem>
                            )
                          })
                        }
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => { setSelectedId(item.id); setDeleteDialogOpen(true) }}
                        >
                          <Trash className="mr-2 h-4 w-4" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Assinante"
        description="Tem certeza que deseja excluir este assinante? Todos os dados serão perdidos permanentemente."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />

      {selectedSubscriber && (
        <SigtapImportModal
          open={sigtapModalOpen}
          onOpenChange={setSigtapModalOpen}
          subscriberId={selectedSubscriber.id}
          subscriberName={selectedSubscriber.name}
        />
      )}
    </DataTableLayout>
  )
}
