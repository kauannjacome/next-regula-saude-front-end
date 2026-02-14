// ==========================================
// PÁGINA: LISTAGEM DE REGULAÇÕES (TABELA)
// ==========================================
// Tabela completa de regulações com todas as funcionalidades:
// - Busca e filtros
// - Ações: Visualizar, Imprimir, Alterar Status, Upload, Duplicar, Excluir
// - Modo lixeira com restaurar/excluir permanente
// - WebSocket para atualizações em tempo real
// - Paginação
// 'use client' = página interativa que roda no navegador

'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Filter, Eye, Printer, Tags, FileText, Copy, Trash2, MoreHorizontal, Edit, Calendar, List, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import Link from 'next/link'
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ConfirmDialog, DataTableLayout, StatusBadge, PriorityBadge } from '@/components/shared';
import { RegulationFilters } from './components/regulation-filters';
import { UpdateStatusModal } from './components/update-status-modal';
import { ListActionModal } from './components/list-action-modal';
import { ScheduleFormModal } from './components/schedule-form-modal';
import { PrintTemplateModal } from '@/components/templates/print-template-modal';
import { DateRange } from 'react-day-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// TIPOS
interface Regulation {
  id: number
  protocolNumber?: number | null
  citizen: {
    id: number
    name: string
    cpf?: string
    birthDate?: string
    phone?: string
  } | null
  cares: {
    care: {
      id: number
      name: string
      acronym?: string | null
    }
  }[]
  status: string | null
  priority: string | null
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
  notes?: string | null
  clinicalIndication?: string | null
  cid?: string | null
  creator?: {
    id: string
    name: string
  } | null
  responsible?: {
    id: number
    name: string
  } | null
}

// Formatar número de protocolo
const formatProtocol = (num?: number | null) => {
  if (!num) return '-'
  const year = new Date().getFullYear()
  return `${String(num).padStart(6, '0')}/${year}`
}

// CONFIGURAÇÃO DE CORES E LABELS REMOVIDA (USANDO lib/constants.ts e componentes compartilhados)

// COMPONENTE PRINCIPAL
export default function RegulationsPage() {
  // HOOKS
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Modo lixeira (via URL query param)
  const isTrashMode = searchParams.get('trash') === 'true'
  const isSystemManager = session?.user?.isSystemManager === true

  // ESTADOS
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [regulations, setRegulations] = useState<Regulation[]>([])
  const [filteredData, setFilteredData] = useState<Regulation[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [requestDateRange, setRequestDateRange] = useState<DateRange | undefined>()
  const [selectedUnit, setSelectedUnit] = useState('all')
  const [selectedCreatedBy, setSelectedCreatedBy] = useState('all')
  const [selectedResponsible, setSelectedResponsible] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState('all')

  // Modais
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedRegulation, setSelectedRegulation] = useState<Regulation | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string | number } | null>(null)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalFromApi, setTotalFromApi] = useState(0)

  // Seleção em Lista
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [listModalOpen, setListModalOpen] = useState(false)

  // Acordeão - linhas expandidas
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Modal de Impressão
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printRegulation, setPrintRegulation] = useState<{ id: number; citizenName: string } | null>(null)

  // Modal de Agendamento em Lote
  const [batchScheduleModalOpen, setBatchScheduleModalOpen] = useState(false)

  // FUNÇÃO: Buscar regulações da API (com cancelamento de requests antigos)
  const abortRef = useRef<AbortController | null>(null)

  const fetchRegulations = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (selectedStatuses.length === 1) params.set('status', selectedStatuses[0])
      if (selectedPriority !== 'all') params.set('priority', selectedPriority)
      if (selectedUnit !== 'all') params.set('unitId', selectedUnit)
      if (selectedCreatedBy !== 'all') params.set('createdById', selectedCreatedBy)
      if (selectedResponsible !== 'all') params.set('responsibleId', selectedResponsible)
      if (selectedSupplier !== 'all') params.set('supplierId', selectedSupplier)
      if (dateRange?.from) params.set('dateFrom', dateRange.from.toISOString())
      if (dateRange?.to) params.set('dateTo', dateRange.to.toISOString())
      if (requestDateRange?.from) params.set('requestDateFrom', requestDateRange.from.toISOString())
      if (requestDateRange?.to) params.set('requestDateTo', requestDateRange.to.toISOString())
      params.set('page', String(currentPage))
      params.set('limit', String(pageSize))
      // Modo lixeira - apenas para System Manager
      if (isTrashMode && isSystemManager) params.set('trash', 'true')

      const response = await fetch(`/api/regulations?${params.toString()}`, {
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Erro ao buscar regulações')
      const data = await response.json()
      setRegulations(data.data || [])
      setTotalFromApi(data.pagination?.total || 0)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Erro ao buscar regulações:', error)
      toast.error('Erro ao carregar regulações')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, isTrashMode, currentPage, selectedStatuses, selectedPriority, selectedUnit, selectedCreatedBy, selectedResponsible, selectedSupplier, dateRange, requestDateRange, pageSize, isSystemManager])

  // EFEITO: Carregar dados quando filtros mudam
  // Evitar erro de hidratação com componentes Radix
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchRegulations()
  }, [fetchRegulations])

  // EFEITO: Debounce na busca por texto (reset page to 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage((prev) => (prev === 1 ? prev : 1))
      setDebouncedSearch(search.trim())
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // EFEITO: Atualizar dados filtrados (filtros client-side restantes)
  useEffect(() => {
    setFilteredData(regulations)
  }, [regulations])

  // FUNÇÃO: Alterar status
  const handleStatusChange = async (regulationId: string | number, newStatus: string, sendWhatsapp: boolean, whatsappTemplateId?: string) => {
    try {
      const response = await fetch(`/api/regulations/${regulationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, sendWhatsapp, whatsappTemplateId })
      })
      if (!response.ok) throw new Error('Erro ao atualizar status')

      const data = await response.json()

      // Verificar resultado do WhatsApp
      if (sendWhatsapp && data.whatsappResult) {
        const { whatsappResult } = data

        if (whatsappResult.success) {
          // Sucesso total
          toast.success('Status atualizado e mensagem WhatsApp enviada com sucesso!')
        } else if (whatsappResult.attempted) {
          // Status foi atualizado, mas WhatsApp falhou
          toast.success('Status atualizado com sucesso', {
            description: 'Porém a mensagem WhatsApp não foi enviada'
          })

          // Mostrar erro específico em outro toast
          const errorMessages: Record<string, { title: string; description: string }> = {
            'WHATSAPP_DISCONNECTED': {
              title: 'WhatsApp desconectado',
              description: 'Reconecte o WhatsApp em Administração → WhatsApp → Conexão'
            },
            'NO_PHONE': {
              title: 'Telefone não encontrado',
              description: 'O cidadão não possui telefone cadastrado'
            },
            'TEMPLATE_NOT_FOUND': {
              title: 'Template não encontrado',
              description: 'Crie um template em WhatsApp → Meus Templates'
            },
            'NOTIFICATION_DISABLED': {
              title: 'Notificação desativada',
              description: 'Ative as notificações em WhatsApp → Mensagens Automáticas'
            },
            'SEND_ERROR': {
              title: 'Erro ao enviar mensagem',
              description: whatsappResult.error || 'Tente novamente mais tarde'
            }
          }

          const errorInfo = errorMessages[whatsappResult.errorCode || 'SEND_ERROR']
          toast.error(errorInfo.title, {
            description: errorInfo.description,
            duration: 8000
          })
        }
      } else {
        // Sem WhatsApp, apenas status atualizado
        toast.success('Status atualizado com sucesso')
      }

      fetchRegulations()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  // FUNÇÃO: Confirmar exclusão (soft delete)
  const confirmDelete = (id: string | number) => {
    setDeleteConfirmation({ id })
  }

  // FUNÇÃO: Executar exclusão (soft delete)
  const handleDelete = async (id: string | number) => {
    try {
      const response = await fetch(`/api/regulations/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir')

      toast.success('Regulação excluída com sucesso')
      fetchRegulations()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir regulação')
    }
  }

  // FUNÇÃO: Restaurar item da lixeira
  const handleRestore = async (id: string | number) => {
    try {
      const response = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Regulation', id: String(id) })
      })
      if (!response.ok) throw new Error('Erro ao restaurar')

      toast.success('Regulação restaurada com sucesso')
      fetchRegulations()
    } catch (error) {
      console.error('Erro ao restaurar:', error)
      toast.error('Erro ao restaurar regulação')
    }
  }

  // FUNÇÃO: Abrir modal de impressão
  const handlePrint = (regulation: Regulation) => {
    setPrintRegulation({
      id: regulation.id,
      citizenName: regulation.citizen?.name || 'Paciente'
    })
    setPrintModalOpen(true)
  }

  // CALCULAR ÍNDICES DE PAGINAÇÃO (paginação feita no servidor)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredData
  const totalPages = Math.ceil(totalFromApi / pageSize)

  // VERIFICAR SE HÁ FILTROS ATIVOS
  const hasActiveFilters =
    selectedStatuses.length > 0 ||
    selectedPriority !== 'all' ||
    dateRange !== undefined ||
    requestDateRange !== undefined ||
    selectedUnit !== 'all' ||
    selectedCreatedBy !== 'all' ||
    selectedResponsible !== 'all' ||
    selectedSupplier !== 'all'

  // Contar filtros ativos
  const activeFiltersCount = [
    selectedStatuses.length > 0,
    selectedPriority !== 'all',
    dateRange !== undefined,
    requestDateRange !== undefined,
    selectedUnit !== 'all',
    selectedCreatedBy !== 'all',
    selectedResponsible !== 'all',
    selectedSupplier !== 'all',
  ].filter(Boolean).length

  // LIMPAR FILTROS
  const clearFilters = () => {
    setSelectedStatuses([])
    setSelectedPriority('all')
    setDateRange(undefined)
    setRequestDateRange(undefined)
    setSelectedUnit('all')
    setSelectedCreatedBy('all')
    setSelectedResponsible('all')
    setSelectedSupplier('all')
  }

  // FUNÇÕES DE SELEÇÃO
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedData.map(r => r.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Expandir/contrair linha do acordeão
  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // RENDERIZAÇÃO
  return (
      <DataTableLayout
        title={isTrashMode ? 'Lixeira - Regulações' : 'Regulações'}
        subtitle={isTrashMode ? 'Itens excluídos (mais recentes primeiro)' : 'Gerencie todas as regulações do sistema'}
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar por cidadão, CPF ou procedimento..."
      filters={
        <>
          {/* Dropdown de Listas - ao lado esquerdo do Filtros */}
          {!isTrashMode && mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedIds.length > 0 ? 'default' : 'outline'}
                  className="h-9"
                >
                  <List className="h-4 w-4 mr-2" />
                  Listas
                  {selectedIds.length > 0 && (
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {selectedIds.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Acoes em Lista</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    if (selectedIds.length > 0) setBatchScheduleModalOpen(true)
                    else toast.info('Selecione um ou mais itens para agendar')
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar {selectedIds.length > 0 && `(${selectedIds.length})`}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (selectedIds.length > 0) setListModalOpen(true)
                    else toast.info('Selecione um ou mais itens para criar uma lista')
                  }}
                >
                  <List className="h-4 w-4 mr-2" />
                  Adicionar Lista {selectedIds.length > 0 && `(${selectedIds.length})`}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/lists">
                    <FileText className="h-4 w-4 mr-2" />
                    Minhas Listas
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {mounted && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant={hasActiveFilters ? 'default' : 'outline'} className="h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <RegulationFilters
                    selectedStatuses={selectedStatuses}
                    onStatusChange={setSelectedStatuses}
                    selectedPriority={selectedPriority}
                    onPriorityChange={setSelectedPriority}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    requestDateRange={requestDateRange}
                    onRequestDateRangeChange={setRequestDateRange}
                    selectedUnit={selectedUnit}
                    onUnitChange={setSelectedUnit}
                    selectedCreatedBy={selectedCreatedBy}
                    onCreatedByChange={setSelectedCreatedBy}
                    selectedResponsible={selectedResponsible}
                    onResponsibleChange={setSelectedResponsible}
                    selectedSupplier={selectedSupplier}
                    onSupplierChange={setSelectedSupplier}
                    onClear={clearFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}

          {!isTrashMode && (
            <Link href="/regulations/new">
              <Button className="h-9 bg-primary text-white hover:bg-primary/90 shadow-none rounded-md">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden xl:inline">Nova Regulação</span>
                <span className="xl:hidden">Nova</span>
              </Button>
            </Link>
          )}
        </>
      }
      bottomBar={
        !loading && totalFromApi > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, totalFromApi)} de {totalFromApi} resultados
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
      <div className="w-full overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b-gray-100 dark:border-b-zinc-800">
            <TableHead className="w-10"></TableHead>
            <TableHead className="w-[50px] pl-2">
              <Checkbox
                checked={selectedIds.length > 0 && selectedIds.length === paginatedData.length}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead className="font-medium text-gray-600 dark:text-gray-400">Cidadão</TableHead>
            <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">Cuidados</TableHead>
            <TableHead className="font-medium text-gray-600 dark:text-gray-400">Status</TableHead>
            <TableHead className="hidden md:table-cell font-medium text-gray-600 dark:text-gray-400">Prioridade</TableHead>
            <TableHead className="text-right pr-6 font-medium text-gray-600 dark:text-gray-400">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-b-gray-50 dark:border-b-zinc-900">
                <TableCell><div className="h-4 w-4 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" /></TableCell>
                <TableCell className="pl-2"><div className="h-4 w-4 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-32 animate-pulse" /></TableCell>
                <TableCell className="hidden md:table-cell"><div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-24 animate-pulse" /></TableCell>
                <TableCell><div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-20 animate-pulse" /></TableCell>
                <TableCell className="hidden md:table-cell"><div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-16 animate-pulse" /></TableCell>
                <TableCell className="pr-6"><div className="h-8 w-8 bg-gray-100 dark:bg-zinc-800 rounded ml-auto animate-pulse" /></TableCell>
              </TableRow>
            ))
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p>{isTrashMode ? 'Nenhuma regulação na lixeira' : 'Nenhuma regulação encontrada'}</p>
                  {!isTrashMode && (
                    <Link href="/regulations/new">
                      <Button variant="link" className="text-primary">Cadastrar nova</Button>
                    </Link>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((regulation) => (
              <Fragment key={regulation.id}>
                <TableRow
                  className={cn(
                    "hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border-b-gray-50 dark:border-b-zinc-900 transition-colors cursor-pointer group",
                    selectedIds.includes(regulation.id) && "bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                >
                  <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleRow(regulation.id)}
                    >
                      {expandedRows.has(regulation.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="pl-2 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(regulation.id)}
                      onCheckedChange={() => toggleSelect(regulation.id)}
                    />
                  </TableCell>
                  <TableCell className="py-3" onClick={() => toggleSelect(regulation.id)}>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{regulation.citizen?.name || 'Sem cidadão'}</div>
                      <div className="text-sm text-gray-500">{regulation.citizen?.cpf}</div>
                      {/* Mostrar data de exclusão no modo lixeira */}
                      {isTrashMode && regulation.deletedAt && (
                        <div className="text-xs text-red-500 mt-1">
                          Excluído em {new Date(regulation.deletedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell" onClick={() => toggleSelect(regulation.id)}>
                    {(() => {
                      const careList = regulation.cares || []
                      if (careList.length === 0) return <span className="text-sm text-gray-400">-</span>
                      if (careList.length === 1) {
                        return (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {careList[0].care?.acronym || careList[0].care?.name}
                          </Badge>
                        )
                      }
                      return (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {careList.length} cuidados
                        </Badge>
                      )
                    })()}
                  </TableCell>
                  <TableCell onClick={() => toggleSelect(regulation.id)}>
                    <StatusBadge status={regulation.status || ''} type="regulation" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell" onClick={() => toggleSelect(regulation.id)}>
                    <PriorityBadge priority={regulation.priority || ''} showLabel={false} />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      {isTrashMode ? (
                        /* Modo lixeira: botão de restaurar */
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleRestore(regulation.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restaurar
                        </Button>
                      ) : (
                        /* Modo normal: ações padrão */
                        <>
                          <Link href={`/regulations/${regulation.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Eye className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Ver</span>
                            </Button>
                          </Link>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 px-2 text-gray-600 hover:text-gray-700">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="hidden sm:inline ml-1">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePrint(regulation)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRegulation(regulation)
                                  setStatusModalOpen(true)
                                }}
                              >
                                <Tags className="h-4 w-4 mr-2" />
                                Alterar Status
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/regulations/${regulation.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/regulations/${regulation.id}/duplicate`}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => confirmDelete(regulation.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {/* Linha expandida com detalhes */}
                {expandedRows.has(regulation.id) && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-gray-100 dark:border-b-zinc-800">
                    <TableCell colSpan={7} className="py-3 px-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block">Protocolo</span>
                          <span className="font-mono text-xs font-medium text-primary">
                            {formatProtocol(regulation.protocolNumber)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Recebimento</span>
                          <span className="text-xs">
                            {new Date(regulation.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Criado por</span>
                          <span className="text-xs">{regulation.creator?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Responsável</span>
                          <span className="text-xs">{regulation.responsible?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">CID</span>
                          <span className="text-xs font-mono">{regulation.cid || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Última Atualização</span>
                          <span className="text-xs">
                            {regulation.updatedAt
                              ? new Date(regulation.updatedAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </span>
                        </div>
                        {/* Indicação Clínica - ocupa 2 colunas */}
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-xs block">Indicação Clínica</span>
                          <span className="text-xs">{regulation.clinicalIndication || '-'}</span>
                        </div>
                        {/* Observações - ocupa toda a largura */}
                        {regulation.notes && (
                          <div className="col-span-2 md:col-span-4">
                            <span className="text-muted-foreground text-xs block">Observações</span>
                            <span className="text-xs">{regulation.notes}</span>
                          </div>
                        )}
                        {/* Cuidados - ocupa toda a largura */}
                        <div className="col-span-2 md:col-span-4">
                          <span className="text-muted-foreground text-xs block mb-1">Cuidados</span>
                          {regulation.cares?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {regulation.cares.map((c, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                  {c.care?.acronym || c.care?.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Nenhum cuidado</span>
                          )}
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
      </div>

      {/* MODAL: ALTERAR STATUS */}
      {selectedRegulation && (
        <UpdateStatusModal
          open={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false)
            setSelectedRegulation(null)
          }}
          regulation={selectedRegulation}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* DIALOG: CONFIRMAÇÃO DE EXCLUSÃO */}
      <ConfirmDialog
        open={!!deleteConfirmation}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        title="Excluir Regulação"
        description="Tem certeza que deseja excluir esta regulação?"
        confirmLabel="Excluir"
        onConfirm={() => {
          if (deleteConfirmation) {
            handleDelete(deleteConfirmation.id)
            setDeleteConfirmation(null)
          }
        }}
        variant="destructive"
      />

      <ListActionModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        selectedIds={selectedIds}
        type="REGULATION"
        onSuccess={() => {
          setSelectedIds([])
          fetchRegulations()
        }}
      />

      {/* Modal de Impressão de Templates */}
      {printRegulation && (
        <PrintTemplateModal
          open={printModalOpen}
          onOpenChange={setPrintModalOpen}
          regulationId={printRegulation.id}
          citizenName={printRegulation.citizenName}
          onPrintComplete={() => fetchRegulations()}
        />
      )}

      {/* Modal de Agendamento em Lote */}
      <ScheduleFormModal
        open={batchScheduleModalOpen}
        onOpenChange={(open) => {
          setBatchScheduleModalOpen(open)
          if (!open) setSelectedIds([])
        }}
        regulationId={selectedIds[0] || 0}
        regulationIds={selectedIds}
        onSuccess={() => {
          setSelectedIds([])
          fetchRegulations()
        }}
      />
    </DataTableLayout>
  )
}
