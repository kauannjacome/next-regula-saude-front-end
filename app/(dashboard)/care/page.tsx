// ==========================================
// PÁGINA: LISTAGEM DE CUIDADOS
// ==========================================
// Esta é a tela onde o usuário visualiza todos os planos de cuidado cadastrados
// Cuidados = protocolos, ações e procedimentos de cuidado para cidadãos
// Exemplos: "Cuidado Pós-Operatório", "Cuidado com Hipertensão", "Cuidado Domiciliar"
// Permite buscar, filtrar e gerenciar cuidados
// 'use client' = página interativa que roda no navegador

'use client'

import { useState, useEffect, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Edit, Trash, Heart, Plus, Eye, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, ConfirmDialog, DataTableLayout } from '@/components/shared';
import Link from 'next/link'
import { toast } from 'sonner';              // Biblioteca para notificações
import apiClient from '@/lib/api/api-client'    // Cliente HTTP para requisições

// TIPO: Define a estrutura de um cuidado
interface Care {
  id: string              // ID interno do banco
  uuid: string            // ID único universal
  name: string            // Nome do cuidado (ex: "Cuidado Pós-Operatório")
  description?: string    // Descrição detalhada (opcional)
  type: string            // Tipo (ex: "Clínico", "Domiciliar", "Pós-Operatório")
  status: string          // Status (ex: "Ativo", "Inativo")
  createdAt: string       // Data de cadastro
  deletedAt?: string | null  // Data de exclusão (soft delete)
}

// FUNÇÃO AUXILIAR: Mapear status do banco (ACTIVE/INACTIVE) para display (Ativo/Inativo)
const mapStatusToDisplay = (status: string): string => {
  if (status === 'ACTIVE') return 'Ativo'
  if (status === 'INACTIVE') return 'Inativo'
  return status // Fallback para qualquer outro valor
}

// COMPONENTE PRINCIPAL DA PÁGINA
export default function CarePage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Modo lixeira (via URL query param)
  const isTrashMode = searchParams.get('trash') === 'true'
  const isSystemManager = session?.user?.isSystemManager === true

  // ESTADOS: Variáveis que quando mudam, atualizam a tela
  const [search, setSearch] = useState('')                       // Texto digitado na busca
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)               // Se está carregando dados
  const [care, setCare] = useState<Care[]>([])                   // Lista de cuidados do banco
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false) // Se diálogo de exclusão está aberto
  const [selectedId, setSelectedId] = useState<string | null>(null) // ID do cuidado a ser excluído

  // PAGINAÇÃO
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)

  // Acordeão - linhas expandidas
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Expandir/contrair linha do acordeão
  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // FUNÇÃO: Buscar cuidados do banco de dados via API
  const fetchCare = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('page', String(currentPage))
      params.set('limit', String(pageSize))
      // Modo lixeira - apenas para System Manager
      if (isTrashMode && isSystemManager) params.set('trash', 'true')

      const response = await apiClient.get(`/care?${params.toString()}`)
      const rawData = response.data.data || []
      const careData = rawData.map((item: any) => ({
        ...item,
        status: mapStatusToDisplay(item.status)
      }))
      setCare(careData)
      setTotal(response.data.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching care:', error)
      toast.error('Erro ao carregar cuidados')
    } finally {
      setIsLoading(false)
    }
  }

  // EFEITO: Buscar quando página ou modo lixeira muda
  useEffect(() => {
    fetchCare()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isTrashMode, isSystemManager, debouncedSearch])

  // EFEITO: Debounce na busca por texto
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage((prev) => (prev === 1 ? prev : 1))
      setDebouncedSearch(search.trim())
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Calcular paginação
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (currentPage - 1) * pageSize

  // FUNÇÃO: Excluir cuidado do banco de dados
  const handleDelete = async () => {
    if (!selectedId) return

    try {
      await apiClient.delete(`/care/${selectedId}`)
      toast.success('Cuidado excluído com sucesso')
      setDeleteDialogOpen(false)
      setSelectedId(null)
      fetchCare()  // Atualizar lista
    } catch (error) {
      console.error('Error deleting care:', error)
      toast.error('Erro ao excluir cuidado')
    }
  }

  // Função para restaurar item da lixeira
  const handleRestore = async (id: string) => {
    try {
      const response = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Care', id: String(id) })
      })
      if (!response.ok) throw new Error('Erro ao restaurar')

      toast.success('Cuidado restaurado com sucesso')
      fetchCare()
    } catch (error) {
      console.error('Erro ao restaurar:', error)
      toast.error('Erro ao restaurar cuidado')
    }
  }

  // RENDERIZAÇÃO: O que é mostrado na tela
  return (
    <DataTableLayout
      title={isTrashMode ? 'Lixeira - Planos de Cuidado' : 'Planos de Cuidado'}
      subtitle={isTrashMode ? 'Itens excluídos (mais recentes primeiro)' : undefined}
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar cuidados..."
      actions={
        !isTrashMode && (
          <Link href="/care/new" className="w-full sm:w-auto">
            <Button className="w-full h-9 bg-primary text-white hover:bg-primary/90 shadow-none rounded-md">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden xl:inline">Novo Cuidado</span>
              <span className="xl:hidden">Novo</span>
            </Button>
          </Link>
        )
      }
      bottomBar={
        !isLoading && total > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + pageSize, total)} de {total} resultados
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )
      }
    >
      <Table>
        <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b-gray-100 dark:border-b-zinc-800">
            <TableHead className="w-10"></TableHead>
            <TableHead className="font-medium text-gray-600 dark:text-gray-400">Nome</TableHead>
            <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">Tipo</TableHead>
            <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Status</TableHead>
            <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : care.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Heart className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p>{isTrashMode ? 'Nenhum item na lixeira' : 'Nenhum cuidado encontrado'}</p>
                  {!isTrashMode && (
                    <Link href="/care/new">
                      <Button variant="link" className="text-primary">Criar novo</Button>
                    </Link>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            care.map((item) => (
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
                      <div className="md:hidden flex flex-wrap gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300">
                          {item.type}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300">
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <StatusBadge status={item.status} />
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
                          <Link href={`/care/${item.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Eye className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Ver</span>
                            </Button>
                          </Link>
                          <Link href={`/care/${item.id}/edit`}>
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
                          <span className="text-muted-foreground text-xs block">Tipo</span>
                          <span className="text-xs">{item.type || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Status</span>
                          <StatusBadge status={item.status} />
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
                        {/* Descrição - ocupa toda a largura */}
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
        title="Excluir Cuidado"
        description="Tem certeza que deseja excluir este plano de cuidado? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </DataTableLayout>
  )
}
