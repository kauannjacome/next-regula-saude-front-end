'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download,
  Calendar as CalendarIcon,
  RefreshCw,
  Eye,
  AlertCircle,
  Building2,
  User,
  UserCheck,
  Truck,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Search,
  FileText,
  Loader2
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import apiClient from '@/lib/api/api-client'
import { PageHeader } from '@/components/shared/page-header'

// Tipos
interface Care {
  care: {
    id: number
    name: string
    acronym: string | null
  }
}

interface Regulation {
  id: number
  uuid: string
  idCode: string | null
  protocolNumber: string | null
  status: string
  priority: string
  requestDate: string
  createdAt: string
  citizen: {
    id: number
    name: string
    cpf: string | null
    cns: string | null
    birthDate: string
  }
  folder: { id: number; name: string } | null
  unit: { id: number; name: string } | null
  creator: { id: string; name: string } | null
  responsible: { id: number; name: string } | null
  supplier: { id: number; name: string; tradeName: string | null } | null
  cares: Care[]
}

interface Meta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface SelectOption {
  id: string | number
  name: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em Análise',
  APPROVED: 'Aprovado',
  DENIED: 'Negado',
  RETURNED: 'Devolvido',
  CANCELLED: 'Cancelado',
}

const PRIORITY_LABELS: Record<string, string> = {
  ELECTIVE: 'Eletivo',
  URGENCY: 'Urgência',
  EMERGENCY: 'Emergência',
}

export default function ReportsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [data, setData] = useState<Regulation[]>([])
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Dados dos filtros
  const [units, setUnits] = useState<SelectOption[]>([])
  const [users, setUsers] = useState<SelectOption[]>([])
  const [suppliers, setSuppliers] = useState<SelectOption[]>([])
  const [cares, setCares] = useState<SelectOption[]>([])
  const [filtersLoaded, setFiltersLoaded] = useState(false)

  // Filtros
  const [status, setStatus] = useState<string>('IN_PROGRESS')
  const [priority, setPriority] = useState<string>('all')
  const [unitId, setUnitId] = useState<string>('all')
  const [createdById, setCreatedById] = useState<string>('all')
  const [responsibleId, setResponsibleId] = useState<string>('all')
  const [supplierId, setSupplierId] = useState<string>('all')
  const [careId, setCareId] = useState<string>('all')
  const [showOnlySelectedCare, setShowOnlySelectedCare] = useState<boolean>(false)

  // Período obrigatório
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 30))
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date())
  const [requestDateFrom, setRequestDateFrom] = useState<Date | undefined>()
  const [requestDateTo, setRequestDateTo] = useState<Date | undefined>()

  const [dateOpen, setDateOpen] = useState(false)
  const [requestDateOpen, setRequestDateOpen] = useState(false)

  const isPeriodValid = dateFrom && dateTo

  // Carregar dados dos filtros
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [unitsRes, usersRes, suppliersRes, caresRes] = await Promise.all([
          apiClient.get<{ data: SelectOption[] }>('/units?limit=500').catch(() => ({ data: { data: [] } })),
          apiClient.get<{ data: SelectOption[] }>('/users?limit=500').catch(() => ({ data: { data: [] } })),
          apiClient.get<{ data: SelectOption[] }>('/suppliers?limit=500').catch(() => ({ data: { data: [] } })),
          apiClient.get<{ data: SelectOption[] }>('/care?limit=500').catch(() => ({ data: { data: [] } })),
        ])

        setUnits(unitsRes.data.data || [])
        setUsers(usersRes.data.data || [])
        setSuppliers(suppliersRes.data.data || [])
        setCares(caresRes.data.data || [])
        setFiltersLoaded(true)
      } catch (error) {
        console.error('Erro ao carregar dados dos filtros:', error)
        setFiltersLoaded(true)
      }
    }
    loadFilterData()
  }, [])

  // Buscar regulações
  const fetchRegulations = useCallback(async (page = 1) => {
    if (!isPeriodValid) {
      setData([])
      setMeta({ page: 1, limit: 20, total: 0, totalPages: 1 })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', meta.limit.toString())

      if (status && status !== 'all') params.append('status', status)
      if (priority && priority !== 'all') params.append('priority', priority)
      if (unitId && unitId !== 'all') params.append('unitId', unitId)
      if (createdById && createdById !== 'all') params.append('createdById', createdById)
      if (responsibleId && responsibleId !== 'all') params.append('responsibleId', responsibleId)
      if (supplierId && supplierId !== 'all') params.append('supplierId', supplierId)

      if (dateFrom) params.append('dateFrom', dateFrom.toISOString())
      if (dateTo) params.append('dateTo', dateTo.toISOString())
      if (requestDateFrom) params.append('requestDateFrom', requestDateFrom.toISOString())
      if (requestDateTo) params.append('requestDateTo', requestDateTo.toISOString())

      const response = await apiClient.get<{ data: Regulation[], pagination: Meta }>(`/regulations?${params.toString()}`)

      let filteredData = response.data.data
      if (careId && careId !== 'all') {
        filteredData = filteredData.filter(reg =>
          reg.cares?.some(c => c.care.id.toString() === careId)
        )
      }

      setData(filteredData)
      setMeta(response.data.pagination)
      setExpandedRows(new Set())
      setSearched(true)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar regulações.')
    } finally {
      setLoading(false)
    }
  }, [status, priority, unitId, createdById, responsibleId, supplierId, careId, dateFrom, dateTo, requestDateFrom, requestDateTo, meta.limit, isPeriodValid])

  const handleSearch = () => {
    if (!isPeriodValid) {
      toast.error('Selecione o período da regulação.')
      return
    }
    fetchRegulations(1)
  }

  // Não buscar automaticamente - aguardar clique no botão Buscar

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      DENIED: 'bg-red-100 text-red-800 border-red-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      SCHEDULED: 'bg-purple-100 text-purple-800 border-purple-200',
      RETURNED: 'bg-orange-100 text-orange-800 border-orange-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return (
      <Badge variant="outline" className={cn("font-medium text-xs", styles[status] || styles.PENDING)}>
        {STATUS_LABELS[status] || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      URGENCY: 'bg-red-100 text-red-800 border-red-200',
      EMERGENCY: 'bg-orange-100 text-orange-800 border-orange-200',
      ELECTIVE: 'bg-blue-100 text-blue-800 border-blue-200',
    }
    return (
      <Badge variant="outline" className={cn("font-medium text-xs", styles[priority] || "bg-gray-100")}>
        {PRIORITY_LABELS[priority] || priority}
      </Badge>
    )
  }

  const clearFilters = () => {
    setStatus('IN_PROGRESS')
    setPriority('all')
    setUnitId('all')
    setCreatedById('all')
    setResponsibleId('all')
    setSupplierId('all')
    setCareId('all')
    setShowOnlySelectedCare(false)
    setDateFrom(subDays(new Date(), 30))
    setDateTo(new Date())
    setRequestDateFrom(undefined)
    setRequestDateTo(undefined)
  }

  const handleExport = () => {
    if (data.length === 0) {
      toast.error('Não há dados para exportar.')
      return
    }

    const headers = [
      'Protocolo', 'Status', 'Prioridade', 'Cidadão', 'CPF/CNS',
      'Data Criação', 'Data Solicitação', 'Unidade', 'Criado Por',
      'Responsável', 'Fornecedor', 'Cuidados'
    ]

    const rows = data.map(reg => [
      reg.idCode || reg.protocolNumber || '-',
      STATUS_LABELS[reg.status] || reg.status,
      PRIORITY_LABELS[reg.priority] || reg.priority,
      reg.citizen?.name || 'N/A',
      reg.citizen?.cpf || reg.citizen?.cns || 'N/A',
      reg.createdAt ? format(new Date(reg.createdAt), "dd/MM/yyyy HH:mm") : '-',
      reg.requestDate ? format(new Date(reg.requestDate), "dd/MM/yyyy HH:mm") : '-',
      reg.unit?.name || '-',
      reg.creator?.name || '-',
      reg.responsible?.name || '-',
      reg.supplier?.tradeName || reg.supplier?.name || '-',
      reg.cares?.map(c => c.care.name).join('; ') || '-'
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-regulacoes-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Relatório exportado com sucesso!')
  }

  const handleGeneratePdf = async () => {
    if (data.length === 0) {
      toast.error('Não há dados para gerar o relatório.')
      return
    }

    setGeneratingPdf(true)
    try {
      // Criar documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = 210
      const marginLeft = 15
      const marginRight = 15
      const contentWidth = pageWidth - marginLeft - marginRight

      // Cores
      const primaryColor: [number, number, number] = [59, 130, 246]
      const grayColor: [number, number, number] = [100, 100, 100]
      const lightGrayColor: [number, number, number] = [200, 200, 200]

      // ==========================================
      // CABEÇALHO
      // ==========================================
      doc.setFillColor(248, 250, 252)
      doc.rect(0, 0, pageWidth, 35, 'F')
      doc.setDrawColor(...primaryColor)
      doc.setLineWidth(0.5)
      doc.line(0, 35, pageWidth, 35)

      // Título
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryColor)
      doc.text('Relatório de Regulações', pageWidth / 2, 15, { align: 'center' })

      // Data de geração
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grayColor)
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, 22, { align: 'center' })

      // Total de registros e usuário que gerou
      doc.setFontSize(8)
      doc.text(`Total: ${data.length} regulações | Gerado por: ${session?.user?.name || 'Usuário'}`, pageWidth / 2, 28, { align: 'center' })

      let currentY = 42

      // ==========================================
      // FILTROS UTILIZADOS
      // ==========================================
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Filtros Utilizados:', marginLeft, currentY)
      currentY += 5

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grayColor)

      const filters: string[] = []
      if (dateFrom && dateTo) filters.push(`Período: ${format(dateFrom, 'dd/MM/yyyy')} a ${format(dateTo, 'dd/MM/yyyy')}`)
      if (status && status !== 'all') filters.push(`Status: ${STATUS_LABELS[status] || status}`)
      if (priority && priority !== 'all') filters.push(`Prioridade: ${PRIORITY_LABELS[priority] || priority}`)
      if (unitId && unitId !== 'all') {
        const unit = units.find(u => u.id.toString() === unitId)
        filters.push(`Unidade: ${unit?.name || unitId}`)
      }
      if (supplierId && supplierId !== 'all') {
        const supplier = suppliers.find(s => s.id.toString() === supplierId)
        filters.push(`Fornecedor: ${supplier?.name || supplierId}`)
      }

      if (filters.length === 0) {
        doc.text('Nenhum filtro específico aplicado', marginLeft, currentY)
        currentY += 4
      } else {
        const filtersText = filters.join(' | ')
        const lines = doc.splitTextToSize(filtersText, contentWidth)
        lines.forEach((line: string) => {
          doc.text(line, marginLeft, currentY)
          currentY += 4
        })
      }

      // Linha separadora
      currentY += 2
      doc.setDrawColor(...lightGrayColor)
      doc.line(marginLeft, currentY, pageWidth - marginRight, currentY)
      currentY += 5

      // ==========================================
      // TABELA DE DADOS
      // ==========================================

      // Função para mascarar CPF (085.xxx.041-xx)
      const maskCpf = (cpf: string | null): string => {
        if (!cpf) return '-'
        const cleaned = cpf.replace(/\D/g, '')
        if (cleaned.length !== 11) return cpf
        // Formato: 085.xxx.041-xx (mostra 3 primeiros, oculta 3 do meio, mostra 3, oculta 2)
        return `${cleaned.slice(0, 3)}.xxx.${cleaned.slice(6, 9)}-xx`
      }

      // Função para mascarar CNS
      const maskCns = (cns: string | null): string => {
        if (!cns) return '-'
        const cleaned = cns.replace(/\D/g, '')
        if (cleaned.length < 6) return cns
        // Mostra 3 primeiros, xxx, 3 últimos
        return `${cleaned.slice(0, 3)}xxxxxx${cleaned.slice(-3)}`
      }

      // Função para obter cuidados formatados
      const getCares = (reg: Regulation): string => {
        if (!reg.cares || reg.cares.length === 0) return '-'

        let caresToShow = reg.cares

        // Se filtrou por cuidado e marcou para mostrar apenas o selecionado
        if (showOnlySelectedCare && careId && careId !== 'all') {
          caresToShow = reg.cares.filter(c => c.care.id.toString() === careId)
        }

        return caresToShow.map(c => c.care.acronym || c.care.name).join(', ')
      }

      const headers = [['Cidadão', 'CPF/CNS', 'Prior.', 'Status', 'Criação', 'Criado Por', 'Cuidados']]

      const rows = data.map(reg => [
        reg.citizen?.name || 'N/A',
        reg.citizen?.cpf ? maskCpf(reg.citizen.cpf) : maskCns(reg.citizen?.cns),
        PRIORITY_LABELS[reg.priority] || reg.priority,
        STATUS_LABELS[reg.status] || reg.status,
        reg.createdAt ? format(new Date(reg.createdAt), 'dd/MM/yy') : '-',
        reg.creator?.name || '-',
        getCares(reg)
      ])

      // Usar autoTable
      autoTable(doc, {
        startY: currentY,
        head: headers,
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center',
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 6,
          cellPadding: 2,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 28 },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 28 },
          6: { cellWidth: 35 },
        },
        margin: { left: marginLeft, right: marginRight },
        showHead: 'everyPage',
        didDrawPage: (hookData: any) => {
          // Rodapé em cada página
          const pageNum = hookData.pageNumber
          doc.setFontSize(7)
          doc.setTextColor(...grayColor)
          doc.text(`Página ${pageNum}`, pageWidth - marginRight, 290, { align: 'right' })
          doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, marginLeft, 290)
        }
      })

      // Baixar PDF
      doc.save(`relatorio-regulacoes-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`)
      toast.success('Relatório PDF gerado com sucesso!')

    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar relatório PDF.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 pb-20">
      <PageHeader
        title="Relatórios de Regulação"
        description="Visualize as solicitações de regulação do município."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchRegulations(meta.page)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={data.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button size="sm" onClick={handleGeneratePdf} disabled={data.length === 0 || generatingPdf}>
              {generatingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {generatingPdf ? 'Gerando...' : 'PDF'}
            </Button>
          </div>
        }
      />

      {/* Alerta período obrigatório */}
      {!isPeriodValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            O período da regulação é obrigatório. Selecione uma data inicial e final.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros - Sempre Visíveis */}
      <Card>
        <CardContent className="pt-4">
          {/* Header dos filtros */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filtros
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              Limpar filtros
            </Button>
          </div>

          {/* Grid de Filtros */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Período da Regulação (OBRIGATÓRIO) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Período da Regulação <span className="text-red-500">*</span>
              </label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !isPeriodValid && "border-red-500 text-red-500"
                    )}
                  >
                    {dateFrom && dateTo ? (
                      <span className="text-xs truncate">
                        {format(dateFrom, "dd/MM/yy")} - {format(dateTo, "dd/MM/yy")}
                      </span>
                    ) : (
                      <span className="text-red-500 text-xs">Selecione</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateFrom}
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={(range) => {
                      setDateFrom(range?.from)
                      setDateTo(range?.to)
                      if (range?.from && range?.to) setDateOpen(false)
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Análise</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="SCHEDULED">Agendado</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="DENIED">Negado</SelectItem>
                  <SelectItem value="RETURNED">Devolvido</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas (Urg → Emerg → Elet)</SelectItem>
                  <SelectItem value="URGENCY">Urgência</SelectItem>
                  <SelectItem value="EMERGENCY">Emergência</SelectItem>
                  <SelectItem value="ELECTIVE">Eletivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Solicitação */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Data Solicitação
              </label>
              <Popover open={requestDateOpen} onOpenChange={setRequestDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-9">
                    <span className="text-xs truncate">
                      {requestDateFrom && requestDateTo
                        ? `${format(requestDateFrom, "dd/MM")} - ${format(requestDateTo, "dd/MM")}`
                        : 'Todas'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={{ from: requestDateFrom, to: requestDateTo }}
                    onSelect={(range) => {
                      setRequestDateFrom(range?.from)
                      setRequestDateTo(range?.to)
                      if (range?.from && range?.to) setRequestDateOpen(false)
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Unidade */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Unidade
              </label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Criado Por */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Criado Por
              </label>
              <Select value={createdById} onValueChange={setCreatedById}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Responsável */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Responsável
              </label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fornecedor */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Fornecedor
              </label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cuidado */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Stethoscope className="h-3 w-3" />
                Cuidado
              </label>
              <Select value={careId} onValueChange={(val) => {
                setCareId(val)
                if (val === 'all') setShowOnlySelectedCare(false)
              }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {cares.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opção para mostrar apenas cuidado selecionado no PDF */}
          {careId && careId !== 'all' && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Checkbox
                id="showOnlySelectedCare"
                checked={showOnlySelectedCare}
                onCheckedChange={(checked) => setShowOnlySelectedCare(checked === true)}
              />
              <label htmlFor="showOnlySelectedCare" className="text-xs text-muted-foreground cursor-pointer">
                No PDF, mostrar apenas o cuidado selecionado (ocultar outros cuidados da regulação)
              </label>
            </div>
          )}

          {/* Botão Buscar */}
          <div className="flex justify-end mt-4 pt-4 border-t">
            <Button onClick={handleSearch} disabled={loading || !isPeriodValid}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Cidadão</TableHead>
                <TableHead className="w-[100px]">Prioridade</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[60px] text-right">Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-8 w-48 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-6 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : !searched ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Selecione os filtros e clique em Buscar</p>
                    <p className="text-xs mt-1">O período da regulação é obrigatório</p>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhuma regulação encontrada com os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((reg) => (
                  <Fragment key={reg.id}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleRow(reg.id)}
                        >
                          {expandedRows.has(reg.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{reg.citizen?.name || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">
                            {reg.citizen?.cpf || reg.citizen?.cns || 'Sem CPF/CNS'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(reg.priority)}</TableCell>
                      <TableCell>{getStatusBadge(reg.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => router.push(`/regulations/${reg.uuid}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(reg.id) && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={5} className="py-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground text-xs block">Protocolo</span>
                              <span className="font-mono text-xs">{reg.idCode || reg.protocolNumber || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Data Criação</span>
                              <span className="text-xs">
                                {reg.createdAt ? format(new Date(reg.createdAt), "dd/MM/yy HH:mm") : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Data Solicitação</span>
                              <span className="text-xs">
                                {reg.requestDate ? format(new Date(reg.requestDate), "dd/MM/yy HH:mm") : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Unidade</span>
                              <span className="text-xs">{reg.unit?.name || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Criado Por</span>
                              <span className="text-xs">{reg.creator?.name || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Responsável</span>
                              <span className="text-xs">{reg.responsible?.name || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Fornecedor</span>
                              <span className="text-xs">{reg.supplier?.tradeName || reg.supplier?.name || '-'}</span>
                            </div>
                            <div className="col-span-2 md:col-span-4">
                              <span className="text-muted-foreground text-xs block mb-1">Cuidados</span>
                              {reg.cares?.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {reg.cares.map((c, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                      {c.care.acronym || c.care.name}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs">-</span>
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

          {/* Paginação */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-xs text-muted-foreground">
              {data.length} de {meta.total} resultados
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => fetchRegulations(meta.page - 1)}
                disabled={meta.page <= 1 || loading || !isPeriodValid}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                {meta.page}/{meta.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => fetchRegulations(meta.page + 1)}
                disabled={meta.page >= meta.totalPages || loading || !isPeriodValid}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
