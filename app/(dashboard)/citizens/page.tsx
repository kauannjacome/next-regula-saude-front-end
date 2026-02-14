// ==========================================
// PÁGINA: LISTAGEM DE CIDAD?OS
// ==========================================
// Esta é a tela onde o usuário visualiza todos os cidadãos cadastrados
// Permite buscar, filtrar e gerenciar cidadãos
// 'use client' = página interativa que roda no navegador

'use client'

import { useState, useEffect, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, Edit, Trash, Eye, Users, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog, DataTableLayout, CanPerform } from '@/components/shared';
import Link from 'next/link'
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'
import { format } from 'date-fns';

// TIPO: Define a estrutura de um cidadão
interface Citizen {
  id: number          // ID interno do banco
  uuid: string        // ID único universal
  name: string        // Nome completo
  cpf: string         // CPF
  cns?: string        // Cartão Nacional de Saúde (opcional)
  birthDate: string   // Data de nascimento
  phone?: string      // Telefone (opcional)
  email?: string      // Email (opcional)
  city?: string       // Cidade (opcional)
  createdAt: string   // Data de cadastro
  deletedAt?: string | null  // Data de exclusão (soft delete)
}

// COMPONENTE PRINCIPAL DA PÁGINA
export default function CitizensPage() {
  // HOOKS
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Modo lixeira (via URL query param)
  const isTrashMode = searchParams.get('trash') === 'true'
  const isSystemManager = session?.user?.isSystemManager === true

  // ESTADOS: Variáveis que quando mudam, atualizam a tela
  const [search, setSearch] = useState('')                      // Texto digitado na busca
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)              // Se está carregando dados
  const [citizens, setCitizens] = useState<Citizen[]>([])       // Lista de cidadãos do banco
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)  // Se diálogo de exclusão está aberto
  const [selectedCitizen, setSelectedCitizen] = useState<number | null>(null)  // ID do cidadão a ser excluído

  // PAGINAÇÃO
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)

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

  // FUNÇÃO: Buscar cidadãos do banco de dados via API
  const fetchCitizens = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('page', String(currentPage))
      params.set('limit', String(pageSize))
      // Modo lixeira - apenas para System Manager
      if (isTrashMode && isSystemManager) params.set('trash', 'true')

      const response = await apiClient.get(`/citizens?${params.toString()}`)
      setCitizens(response.data.data || [])
      setTotal(response.data.pagination?.total || 0)
    } catch (error) {
      console.error('Erro ao buscar cidadãos:', error)
      toast.error('Erro ao carregar cidadãos')
    } finally {
      setIsLoading(false)
    }
  }

  // EFEITO: Buscar quando página ou modo lixeira muda
  useEffect(() => {
    fetchCitizens()
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

  // FUNÇÃO: Excluir cidadão do banco de dados
  const handleDelete = async () => {
    // Se nenhum cidadão foi selecionado, não fazer nada
    if (!selectedCitizen) return

    try {
      // Fazer requisição DELETE para /api/citizens/[id]
      await apiClient.delete(`/citizens/${selectedCitizen}`)
      // Mostrar mensagem de sucesso
      toast.success('Cidadão excluído com sucesso')
      // Fechar diálogo
      setDeleteDialogOpen(false)
      setSelectedCitizen(null)
      // Atualizar lista de cidadãos
      fetchCitizens()
    } catch (error) {
      // Se deu erro, mostrar notificação
      console.error('❌ Erro ao excluir cidadão:', error)
      toast.error('Erro ao excluir cidadão')
    }
  }

  // FUNÇÃO: Abrir diálogo de confirmação de exclusão
  const openDeleteDialog = (id: number) => {
    setSelectedCitizen(id)       // Salvar qual cidadão será excluído
    setDeleteDialogOpen(true)    // Abrir diálogo
  }

  // FUNÇÃO: Restaurar item da lixeira
  const handleRestore = async (id: number) => {
    try {
      const response = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Citizen', id: String(id) })
      })
      if (!response.ok) throw new Error('Erro ao restaurar')

      toast.success('Cidadão restaurado com sucesso')
      fetchCitizens()
    } catch (error) {
      console.error('Erro ao restaurar:', error)
      toast.error('Erro ao restaurar cidadão')
    }
  }

  // RENDERIZAÇÃO: O que é mostrado na tela
  return (
    <DataTableLayout
      title={isTrashMode ? 'Lixeira - Cidadãos' : 'Cidadãos'}
      subtitle={isTrashMode ? 'Itens excluídos (mais recentes primeiro)' : undefined}
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar cidadãos..."
      actions={
        !isTrashMode && (
          <CanPerform resource="citizens" action="create">
            <Link href="/citizens/new" className="w-full sm:w-auto">
              <Button className="w-full h-9 bg-primary text-white hover:bg-primary/90 shadow-none rounded-md">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden xl:inline">Novo Cidadão</span>
                <span className="xl:hidden">Novo</span>
              </Button>
            </Link>
          </CanPerform>
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
            <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">CPF</TableHead>
            <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Telefone</TableHead>
            <TableHead className="hidden lg:table-cell font-medium text-gray-600 dark:text-gray-400">Cidade</TableHead>
            <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : citizens.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p>Nenhum cidadão encontrado</p>
                  <Link href="/citizens/new">
                    <Button variant="link" className="text-primary">Cadastrar novo</Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            citizens.map((citizen) => (
              <Fragment key={citizen.id}>
                <TableRow className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border-b-gray-50 dark:border-b-zinc-900 transition-colors cursor-pointer group">
                  <TableCell className="py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleRow(citizen.id)}
                    >
                      {expandedRows.has(citizen.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100 py-3">
                    <div className="flex flex-col">
                      <span>{citizen.name}</span>
                      <span className="md:hidden text-xs text-muted-foreground">{citizen.cpf}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400">{citizen.cpf}</TableCell>
                  <TableCell className="hidden lg:table-cell text-gray-500 dark:text-gray-400">{citizen.phone || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-gray-500 dark:text-gray-400">{citizen.city || '-'}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      {isTrashMode && isSystemManager ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleRestore(citizen.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Restaurar</span>
                        </Button>
                      ) : (
                        <>
                          <CanPerform resource="citizens" action="view">
                            <Link href={`/citizens/${citizen.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Eye className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Ver</span>
                              </Button>
                            </Link>
                          </CanPerform>
                          <CanPerform resource="citizens" action="update">
                            <Link href={`/citizens/${citizen.id}/edit`}>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50">
                                <Edit className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Editar</span>
                              </Button>
                            </Link>
                          </CanPerform>
                          <CanPerform resource="citizens" action="delete">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => openDeleteDialog(citizen.id)}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </CanPerform>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {/* Linha expandida com detalhes */}
                {expandedRows.has(citizen.id) && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-gray-100 dark:border-b-zinc-800">
                    <TableCell colSpan={6} className="py-3 px-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block">Data de Nascimento</span>
                          <span className="text-xs">
                            {citizen.birthDate ? format(new Date(citizen.birthDate), 'dd/MM/yyyy') : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">CNS</span>
                          <span className="text-xs font-mono">{citizen.cns || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Email</span>
                          <span className="text-xs">{citizen.email || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Data de Cadastro</span>
                          <span className="text-xs">
                            {citizen.createdAt ? format(new Date(citizen.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                          </span>
                        </div>
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
        title="Excluir Cidadão"
        description="Tem certeza que deseja excluir este cidadão? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </DataTableLayout>
  )
}

