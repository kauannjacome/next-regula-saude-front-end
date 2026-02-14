'use client'

import { useState, useEffect, Fragment } from 'react';
import { Trash, FolderOpen, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog, DataTableLayout } from '@/components/shared';
import Link from 'next/link'
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'

interface Group {
  id: number
  uuid: string
  name: string
  description?: string
  subscriberId?: number
  createdAt: string
  _count?: {
    cares: number
  }
}

export default function GroupsPage() {
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

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

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/groups')
      // API retorna { data: [], pagination: {} }
      const rawData = response.data?.data || response.data || []
      setGroups(Array.isArray(rawData) ? rawData : [])
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Erro ao carregar grupos')
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = groups.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async () => {
    if (!selectedId) return

    try {
      await apiClient.delete(`/groups/${selectedId}`)
      toast.success('Grupo excluído com sucesso')
      setDeleteDialogOpen(false)
      setSelectedId(null)
      fetchGroups()
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Erro ao excluir grupo')
    }
  }

  // RENDERIZAÇÃO: O que é mostrado na tela
  return (
    <DataTableLayout
      title="Grupos"
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar por nome..."
    >
      <Table>
        <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b-gray-100 dark:border-b-zinc-800">
            <TableHead className="w-10"></TableHead>
            <TableHead className="font-medium text-gray-600 dark:text-gray-400">Nome</TableHead>
            <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Qtd. Procedimentos</TableHead>
            <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <FolderOpen className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p>Nenhum grupo encontrado</p>
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
                  <TableCell className="hidden lg:table-cell text-gray-500 dark:text-gray-400">
                    {item._count?.cares || 0}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/groups/${item.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Ver</span>
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
                    </div>
                  </TableCell>
                </TableRow>
                {/* Linha expandida com detalhes */}
                {expandedRows.has(item.id) && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-gray-100 dark:border-b-zinc-800">
                    <TableCell colSpan={4} className="py-3 px-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block">Qtd. Procedimentos</span>
                          <span className="text-xs">{item._count?.cares || 0}</span>
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
        title="Excluir Grupo"
        description="Tem certeza que deseja excluir este grupo?"
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </DataTableLayout>
  )
}
