'use client'

import { useState, useEffect } from 'react';
import { Edit, Trash, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, ConfirmDialog, DataTableLayout } from '@/components/shared';
import Link from 'next/link'
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'

interface CareGroup {
  id: number
  uuid: string
  name: string
  description?: string | null
  subscriberId?: number | null
  createdAt: string
  _count?: { cares: number }
}

export default function CareGroupsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [careGroups, setCareGroups] = useState<CareGroup[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const fetchCareGroups = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get('/groups', {
        params: debouncedSearch ? { search: debouncedSearch } : undefined,
      })
      setCareGroups(response.data.data || [])
    } catch (error) {
      console.error('Error fetching care groups:', error)
      toast.error('Erro ao carregar grupos de atendimento')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCareGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 400)

    return () => clearTimeout(timer)
  }, [search])

  const filtered = careGroups.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await apiClient.delete(`/groups/${selectedId}`)
      setCareGroups((prev) => prev.filter((item) => item.id !== selectedId))
      toast.success('Grupo de atendimento excluido com sucesso')
    } catch (error) {
      console.error('Error deleting care group:', error)
      toast.error('Erro ao excluir grupo de atendimento')
    } finally {
      setDeleteDialogOpen(false)
      setSelectedId(null)
    }
  }

  // RENDERIZAÇÃO: O que é mostrado na tela
  return (
    <DataTableLayout
      title="Grupos de Atendimento"
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar por nome..."
      actions={
        <Link href="/care-groups/new">
          <Button className="h-9 bg-primary text-white hover:bg-primary/90 shadow-none rounded-md">
            <Heart className="h-4 w-4 mr-2" />
            Novo Grupo
          </Button>
        </Link>
      }
    >
      <Table>
        <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b-gray-100 dark:border-b-zinc-800">
            <TableHead className="font-medium text-gray-600 dark:text-gray-400 pl-6">Nome</TableHead>
            <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">Descrição</TableHead>
            <TableHead className="font-medium text-gray-600 dark:text-gray-400">Status</TableHead>
            <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Heart className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p>Nenhum grupo encontrado</p>
                  <Link href="/care-groups/new">
                    <Button variant="link" className="text-primary">Cadastrar novo</Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((item) => (
              <TableRow key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border-b-gray-50 dark:border-b-zinc-900 transition-colors cursor-pointer group">
                <TableCell className="font-medium text-gray-900 dark:text-gray-100 pl-6 py-3">
                  {item.name}
                </TableCell>
                <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400">
                  {item.description}
                </TableCell>
                <TableCell>
                  <StatusBadge status="Ativo" />
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/care-groups/${item.id}/edit`}>
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
        title="Excluir Grupo"
        description="Tem certeza que deseja excluir este grupo de atendimento?"
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </DataTableLayout>
  )
}
