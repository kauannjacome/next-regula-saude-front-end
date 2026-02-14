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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/page-header'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Activity,
  Search,
  Download,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  X,
} from 'lucide-react'

interface AuditLog {
  id: number
  uuid: string
  action: string
  objectType: string
  objectId: number
  detail: any
  occurredAt: string
  actor: { id: string; name: string | null; email: string | null } | null
  subscriber: { id: number; name: string } | null
}

interface Filters {
  objectTypes: string[]
  actions: string[]
  actors: { id: string; name: string }[]
  subscribers: { id: number; name: string }[]
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  VIEW: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  LOGOUT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  APPROVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  IMPERSONATE_START: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  IMPERSONATE_STOP: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const actionLabels: Record<string, string> = {
  CREATE: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  VIEW: 'Visualização',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  PRINT: 'Impressão',
  EXPORT: 'Exportação',
  IMPORT: 'Importação',
  APPROVE: 'Aprovação',
  REJECT: 'Rejeição',
  SEND: 'Envio',
  RECEIVE: 'Recebimento',
  IMPERSONATE_START: 'Início Impersonação',
  IMPERSONATE_STOP: 'Fim Impersonação',
}

export default function AuditLogsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filters, setFilters] = useState<Filters | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // Filtros
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterSubscriber, setFilterSubscriber] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterObjectType, setFilterObjectType] = useState<string>('all')
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user?.isSystemManager) {
      router.push('/')
      return
    }
    fetchLogs()
  }, [session, sessionStatus, router, page, filterSubscriber, filterAction, filterObjectType, filterStartDate, filterEndDate])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '50')
      if (filterSubscriber !== 'all') params.set('subscriberId', filterSubscriber)
      if (filterAction !== 'all') params.set('action', filterAction)
      if (filterObjectType !== 'all') params.set('objectType', filterObjectType)
      if (filterStartDate) params.set('startDate', filterStartDate)
      if (filterEndDate) params.set('endDate', filterEndDate)

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        if (!filters) {
          setFilters(data.filters)
        }
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar logs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId: filterSubscriber !== 'all' ? filterSubscriber : undefined,
          action: filterAction !== 'all' ? filterAction : undefined,
          objectType: filterObjectType !== 'all' ? filterObjectType : undefined,
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Exportação concluída')
      }
    } catch (error) {
      toast.error('Erro ao exportar')
    } finally {
      setIsExporting(false)
    }
  }

  const clearFilters = () => {
    setFilterSubscriber('all')
    setFilterAction('all')
    setFilterObjectType('all')
    setFilterStartDate('')
    setFilterEndDate('')
    setPage(1)
  }

  const hasFilters = filterSubscriber !== 'all' || filterAction !== 'all' ||
    filterObjectType !== 'all' || filterStartDate || filterEndDate

  if (sessionStatus === 'loading') {
    return <CardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Logs de Auditoria"
          description={`${total} registros encontrados`}
          icon={Activity}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
          <Button variant="outline" onClick={() => { setPage(1); fetchLogs(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <Select value={filterSubscriber} onValueChange={(v) => { setFilterSubscriber(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
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

        <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Ações</SelectItem>
            {filters?.actions.map((action) => (
              <SelectItem key={action} value={action}>
                {actionLabels[action] || action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterObjectType} onValueChange={(v) => { setFilterObjectType(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            {filters?.objectTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={filterStartDate}
            onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }}
            className="w-[140px]"
          />
          <span className="text-muted-foreground">até</span>
          <Input
            type="date"
            value={filterEndDate}
            onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }}
            className="w-[140px]"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Tabela */}
      {isLoading ? (
        <CardSkeleton />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Nenhum log encontrado"
          description="Não há registros de auditoria com os filtros selecionados"
        />
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Assinante</TableHead>
                  <TableHead className="w-[80px]">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm">
                      {new Date(log.occurredAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={actionColors[log.action] || 'bg-gray-100'}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.objectType}#{log.objectId}
                    </TableCell>
                    <TableCell>
                      {log.actor?.name || log.actor?.email || 'Sistema'}
                    </TableCell>
                    <TableCell>
                      {log.subscriber?.name || 'Global'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages} ({total} registros)
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

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="w-[95vw] max-w-2xl rounded-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
            <DialogDescription>
              {selectedLog && new Date(selectedLog.occurredAt).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ação</p>
                  <Badge variant="secondary" className={actionColors[selectedLog.action]}>
                    {actionLabels[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Objeto</p>
                  <p className="font-mono">{selectedLog.objectType}#{selectedLog.objectId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuário</p>
                  <p>{selectedLog.actor?.name || selectedLog.actor?.email || 'Sistema'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assinante</p>
                  <p>{selectedLog.subscriber?.name || 'Global'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Detalhes</p>
                <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs max-h-[300px]">
                  {JSON.stringify(selectedLog.detail, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
