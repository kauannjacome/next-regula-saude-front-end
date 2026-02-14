'use client'

import { useState, Fragment, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Edit, Trash, Folder, Eye, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog, DataTableLayout } from '@/components/shared';
import Link from 'next/link'
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'
import { useCachedFolders } from '@/hooks/use-cached-data'

interface FolderItem {
  id: number
  uuid: string
  name: string
  idCode?: string
  description?: string
  subscriberId: number
  responsibleId?: string
  responsible?: {
    id: string
    name: string
  }
  startDate?: string
  endDate?: string
  createdAt: string
  deletedAt?: string | null
  _count?: {
    regulations: number
  }
}

export default function FoldersPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Modo lixeira (via URL query param)
  const isTrashMode = searchParams.get('trash') === 'true'
  const isSystemManager = session?.user?.isSystemManager === true

  const [search, setSearch] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Estado para dados em modo lixeira (bypass cache)
  const [trashData, setTrashData] = useState<FolderItem[]>([])
  const [trashLoading, setTrashLoading] = useState(false)

  // Acordeão - linhas expandidas
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Usar cache Zustand para carregamento rápido (modo normal)
  const { data: cachedFolders, isLoading: cacheLoading, refetch: fetchFolders } = useCachedFolders()

  // Buscar dados da lixeira
  const fetchTrashData = async () => {
    try {
      setTrashLoading(true)
      const response = await apiClient.get('/folders?trash=true')
      setTrashData(response.data.data || [])
    } catch (error) {
      console.error('Erro ao buscar lixeira:', error)
      toast.error('Erro ao carregar lixeira')
    } finally {
      setTrashLoading(false)
    }
  }

  // Forçar recarregamento na montagem para garantir dados atualizados
  // Efeito para buscar dados quando modo lixeira muda
  useEffect(() => {
    if (isTrashMode && isSystemManager) {
      fetchTrashData()
    }
  }, [isTrashMode, isSystemManager])

  // Determinar quais dados usar
  const folders = isTrashMode ? trashData : cachedFolders
  const isLoading = isTrashMode ? trashLoading : cacheLoading

  const filtered = folders.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async () => {
    if (!selectedId) return

    try {
      await apiClient.delete(`/folders/${selectedId}`)
      toast.success('Pasta excluída com sucesso')
      setDeleteDialogOpen(false)
      setSelectedId(null)
      fetchFolders()
    } catch (error) {
      console.error('Error deleting folder:', error)
      toast.error('Erro ao excluir pasta')
    }
  }

  // Função para restaurar item da lixeira
  const handleRestore = async (id: number) => {
    try {
      const response = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Folder', id: String(id) })
      })
      if (!response.ok) throw new Error('Erro ao restaurar')

      toast.success('Pasta restaurada com sucesso')
      fetchTrashData()
    } catch (error) {
      console.error('Erro ao restaurar:', error)
      toast.error('Erro ao restaurar pasta')
    }
  }

  // RENDERIZAÇÃO: O que é mostrado na tela
  return (
    <DataTableLayout
      title={isTrashMode ? 'Lixeira - Pastas' : 'Pastas'}
      subtitle={isTrashMode ? 'Itens excluídos (mais recentes primeiro)' : undefined}
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar por nome..."
      actions={
        !isTrashMode && (
          <Link href="/folders/new">
            <Button className="h-9 bg-primary text-white hover:bg-primary/90 shadow-none rounded-md">
              <Folder className="h-4 w-4 mr-2" />
              Nova Pasta
            </Button>
          </Link>
        )
      }
    >
      <Table>
        <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b-gray-100 dark:border-b-zinc-800">
            <TableHead className="w-10"></TableHead>
            <TableHead className="font-medium text-gray-600 dark:text-gray-400">Nome</TableHead>
            <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">Código</TableHead>
            <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Qtd. Regulações</TableHead>
            <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Folder className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p>{isTrashMode ? 'Nenhum item na lixeira' : 'Nenhuma pasta encontrada'}</p>
                  {!isTrashMode && (
                    <Link href="/folders/new">
                      <Button variant="link" className="text-primary">Cadastrar nova</Button>
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
                    {item.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400">
                    {item.idCode || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-gray-500 dark:text-gray-400">
                    {item._count?.regulations || 0}
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
                          <Link href={`/folders/${item.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Eye className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Ver</span>
                            </Button>
                          </Link>
                          <Link href={`/folders/${item.id}/edit`}>
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
                    <TableCell colSpan={5} className="py-3 px-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block">Código</span>
                          <span className="text-xs font-mono">{item.idCode || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Responsável</span>
                          <span className="text-xs">{item.responsible?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Qtd. Regulações</span>
                          <span className="text-xs">{item._count?.regulations || 0}</span>
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
                        {/* Descrição */}
                        {item.description && (
                          <div className="col-span-2 md:col-span-4">
                            <span className="text-muted-foreground text-xs block">Descrição</span>
                            <span className="text-xs">{item.description}</span>
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Pasta"
        description="Tem certeza que deseja excluir esta pasta?"
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </DataTableLayout>
  )
}
