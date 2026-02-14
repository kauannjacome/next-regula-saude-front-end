'use client'

import { useState, useEffect, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Edit, Trash, Calendar, Plus, QrCode, Eye, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog, DataTableLayout, StatusBadge } from '@/components/shared';
import Link from 'next/link'
import { toast } from 'sonner';
import { ListActionModal } from '../regulations/components/list-action-modal';
import apiClient from '@/lib/api/api-client'

import type { Schedule } from '@/types'

// Mapeamento local removido em favor do componente StatusBadge

export default function SchedulesPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Modo lixeira (via URL query param)
  const isTrashMode = searchParams.get('trash') === 'true'
  const isSystemManager = session?.user?.isSystemManager === true

  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Seleção em Lista
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [listModalOpen, setListModalOpen] = useState(false)

  // Acordeão - linhas expandidas
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Expandir/contrair linha do acordeão
  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const fetchSchedules = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      // Modo lixeira - apenas para System Manager
      if (isTrashMode && isSystemManager) params.set('trash', 'true')

      const response = await apiClient.get(`/schedules?${params.toString()}`)
      // API retorna { data: [], pagination: {} }
      const rawData = response.data?.data || response.data || []
      setSchedules(Array.isArray(rawData) ? rawData : [])
    } catch (error) {
      console.error('Error fetching schedules:', error)
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTrashMode])

  const filtered = schedules.filter((item) =>
    item.regulation?.citizen?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.professional?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await apiClient.delete(`/schedules/${selectedId}`)
      toast.success('Agendamento excluído com sucesso')
      setDeleteDialogOpen(false)
      setSelectedId(null)
      fetchSchedules()
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Erro ao excluir agendamento')
    }
  }

  // Função para restaurar item da lixeira
  const handleRestore = async (id: number) => {
    try {
      const response = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Schedule', id: String(id) })
      })
      if (!response.ok) throw new Error('Erro ao restaurar')

      toast.success('Agendamento restaurado com sucesso')
      fetchSchedules()
    } catch (error) {
      console.error('Erro ao restaurar:', error)
      toast.error('Erro ao restaurar agendamento')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // FUNÇÕES DE SELEÇÃO
  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map(r => r.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <DataTableLayout
      title={isTrashMode ? 'Lixeira - Agendamentos' : 'Agendamentos'}
      subtitle={isTrashMode ? 'Itens excluídos (mais recentes primeiro)' : undefined}
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar por cidadão ou profissional..."
      actions={
        !isTrashMode && (
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <Button
                className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => setListModalOpen(true)}
              >
                <QrCode className="h-4 w-4" />
                Link / QR Code ({selectedIds.length})
              </Button>
            )}
            <Link href="/schedules/new">
              <Button className="h-9 bg-primary text-white hover:bg-primary/90 shadow-none rounded-md">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden xl:inline">Novo Agendamento</span>
                <span className="xl:hidden">Novo</span>
              </Button>
            </Link>
          </div>
        )
      }
    >
      <Table>
        <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b-gray-100 dark:border-b-zinc-800">
            <TableHead className="w-10"></TableHead>
            {!isTrashMode && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="font-medium text-gray-600 dark:text-gray-400">Cidadão</TableHead>
            <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">Profissional</TableHead>
            <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Status</TableHead>
            <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
               <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                {!isTrashMode && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isTrashMode ? 5 : 6} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p>{isTrashMode ? 'Nenhum item na lixeira' : 'Nenhum agendamento encontrado'}</p>
                  {!isTrashMode && (
                    <Link href="/schedules/new">
                      <Button variant="link" className="text-primary">Criar novo</Button>
                    </Link>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((item: any) => {
              return (
                <Fragment key={item.id}>
                  <TableRow
                    className={cn(
                      "hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border-b-gray-50 dark:border-b-zinc-900 transition-colors cursor-pointer group",
                      selectedIds.includes(item.id) && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
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
                    {!isTrashMode && (
                      <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100 py-3" onClick={() => !isTrashMode && toggleSelect(item.id)}>
                      <div className="flex flex-col gap-1">
                        <span>{item.regulation?.citizen?.name || '-'}</span>
                        <div className="lg:hidden flex items-center gap-2 mt-1">
                           <StatusBadge status={item.status} type="schedule" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400" onClick={() => !isTrashMode && toggleSelect(item.id)}>
                      {item.professional?.name || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell" onClick={() => !isTrashMode && toggleSelect(item.id)}>
                      <StatusBadge status={item.status} type="schedule" />
                    </TableCell>
                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
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
                            <Link href={`/schedules/${item.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Eye className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Ver</span>
                              </Button>
                            </Link>
                            <Link href={`/schedules/${item.id}/edit`}>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50">
                                <Edit className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Editar</span>
                              </Button>
                            </Link>
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
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Linha expandida com detalhes */}
                  {expandedRows.has(item.id) && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-gray-100 dark:border-b-zinc-800">
                      <TableCell colSpan={isTrashMode ? 5 : 6} className="py-3 px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs block">Data/Hora</span>
                            <span className="text-xs">{formatDate(item.scheduledDate)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs block">Profissional</span>
                            <span className="text-xs">{item.professional?.name || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs block">Status</span>
                            <StatusBadge status={item.status} type="schedule" />
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs block">Regulação</span>
                            <span className="text-xs font-mono">{item.regulation?.id || '-'}</span>
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
              )
            })
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Agendamento"
        description="Tem certeza que deseja excluir este agendamento?"
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />

      <ListActionModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        selectedIds={selectedIds}
        type="SCHEDULE"
        onSuccess={() => {
          setSelectedIds([])
          fetchSchedules()
        }}
      />
    </DataTableLayout>
  )
}
