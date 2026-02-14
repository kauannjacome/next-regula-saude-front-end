// ==========================================
// PÁGINA: LISTAGEM DE UNIDADES DE SAÚDE
// ==========================================
// Esta é a tela onde o usuário visualiza todas as unidades de saúde cadastradas
// Exemplos: UBS Centro, Hospital Municipal, Clínica da Família, PSF Norte, etc
// Permite buscar, filtrar e gerenciar unidades
// Usa cache Zustand para carregamento rápido
// 'use client' = página interativa que roda no navegador

'use client'

import { useState, Fragment, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Edit, Trash, Building2, Eye, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog, DataTableLayout } from '@/components/shared';
import Link from 'next/link'
import { toast } from 'sonner';              // Biblioteca para notificações
import apiClient from '@/lib/api/api-client'    // Cliente HTTP para requisições
import { useCachedUnits } from '@/hooks/use-cached-data'

// TIPO: Define a estrutura de uma unidade de saúde
interface Unit {
  id: number          // ID interno do banco
  uuid: string        // ID único universal
  name: string        // Nome da unidade (ex: "UBS Centro", "Hospital Municipal")
  subscriberId: number // ID do assinante/cliente (multi-tenancy)
  createdAt: string   // Data de cadastro
  deletedAt?: string | null  // Data de exclusão (soft delete)
}

// COMPONENTE PRINCIPAL DA PÁGINA
export default function UnitsPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Modo lixeira (via URL query param)
  const isTrashMode = searchParams.get('trash') === 'true'
  const isSystemManager = session?.user?.isSystemManager === true

  // ESTADOS: Variáveis que quando mudam, atualizam a tela
  const [search, setSearch] = useState('')                       // Texto digitado na busca
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false) // Se diálogo de exclusão está aberto
  const [selectedId, setSelectedId] = useState<number | null>(null) // ID da unidade a ser excluída

  // Estado para dados em modo lixeira (bypass cache)
  const [trashData, setTrashData] = useState<Unit[]>([])
  const [trashLoading, setTrashLoading] = useState(false)

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

  // Usar cache Zustand para carregamento rápido (modo normal)
  const { data: cachedUnits, isLoading: cacheLoading, refetch: fetchUnits } = useCachedUnits()

  // Buscar dados da lixeira
  const fetchTrashData = async () => {
    try {
      setTrashLoading(true)
      const response = await apiClient.get('/units?trash=true')
      setTrashData(response.data.data || [])
    } catch (error) {
      console.error('Erro ao buscar lixeira:', error)
      toast.error('Erro ao carregar lixeira')
    } finally {
      setTrashLoading(false)
    }
  }

  // Efeito para buscar dados quando modo lixeira muda
  useEffect(() => {
    if (isTrashMode && isSystemManager) {
      fetchTrashData()
    }
  }, [isTrashMode, isSystemManager])

  // Determinar quais dados usar
  const units = isTrashMode ? trashData : cachedUnits
  const isLoading = isTrashMode ? trashLoading : cacheLoading

  // FILTRAR UNIDADES: Aplica busca em tempo real no nome
  const filtered = units.filter((item) => {
    return item.name.toLowerCase().includes(search.toLowerCase())
  })

  // FUNÇÃO: Excluir unidade do banco de dados
  const handleDelete = async () => {
    if (!selectedId) return

    try {
      await apiClient.delete(`/units/${selectedId}`)
      toast.success('Unidade excluída com sucesso')
      setDeleteDialogOpen(false)
      setSelectedId(null)
      fetchUnits()  // Atualizar lista
    } catch (error) {
      console.error('Error deleting unit:', error)
      toast.error('Erro ao excluir unidade')
    }
  }

  // Função para restaurar item da lixeira
  const handleRestore = async (id: number) => {
    try {
      const response = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Unit', id: String(id) })
      })
      if (!response.ok) throw new Error('Erro ao restaurar')

      toast.success('Unidade restaurada com sucesso')
      fetchTrashData()
    } catch (error) {
      console.error('Erro ao restaurar:', error)
      toast.error('Erro ao restaurar unidade')
    }
  }

  // RENDERIZAÇÃO: O que é mostrado na tela
  return (
    <DataTableLayout
      title={isTrashMode ? 'Lixeira - Unidades' : 'Unidades'}
      subtitle={isTrashMode ? 'Itens excluídos (mais recentes primeiro)' : undefined}
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar por nome..."
      actions={
        !isTrashMode && (
          <Link href="/units/new">
            <Button className="h-9 bg-primary text-white hover:bg-primary/90 shadow-none rounded-md">
              <Building2 className="h-4 w-4 mr-2" />
              <span className="hidden xl:inline">Nova Unidade</span>
              <span className="xl:hidden">Nova</span>
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
            <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p>{isTrashMode ? 'Nenhum item na lixeira' : 'Nenhuma unidade encontrada'}</p>
                  {!isTrashMode && (
                    <Link href="/units/new">
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
                          <Link href={`/units/${item.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Eye className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Ver</span>
                            </Button>
                          </Link>
                          <Link href={`/units/${item.id}/edit`}>
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
                    <TableCell colSpan={3} className="py-3 px-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block">ID</span>
                          <span className="text-xs font-mono">{item.uuid || item.id}</span>
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Unidade"
        description="Tem certeza que deseja excluir esta unidade?"
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </DataTableLayout>
  )
}
