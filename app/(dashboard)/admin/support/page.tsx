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
import { PageHeader } from '@/components/shared/page-header'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Headphones,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Bug,
  HelpCircle,
  CreditCard,
  Lightbulb,
  KeyRound,
  Gauge,
  Link2,
  Database,
  GraduationCap,
  AlertCircle,
  UserCheck,
  Code,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Subscriber {
  id: number
  name: string
  municipalityName?: string
}

interface User {
  id: string
  name: string | null
  email: string | null
}

interface SupportTicket {
  id: number
  ticketNumber: string
  category: string
  subcategory: string | null
  subject: string
  description: string | null
  status: string
  priority: string
  createdAt: string
  resolvedAt: string | null
  subscriber: Subscriber | null
  user: User | null
  assignedTo: User | null
  resolvedBy: User | null
  _count?: { messages: number }
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: 'Aberto', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  IN_PROGRESS: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Loader2 },
  WAITING_USER: { label: 'Aguardando Usuario', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: UserCheck },
  WAITING_DEV: { label: 'Aguardando Dev', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Code },
  RESOLVED: { label: 'Resolvido', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  CLOSED: { label: 'Fechado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: CheckCircle },
  CANCELED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
}

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  BUG: { label: 'Erro/Bug', icon: Bug, color: 'text-red-600' },
  QUESTION: { label: 'Duvida', icon: HelpCircle, color: 'text-blue-600' },
  BILLING: { label: 'Faturamento', icon: CreditCard, color: 'text-green-600' },
  FEATURE: { label: 'Sugestao', icon: Lightbulb, color: 'text-yellow-600' },
  ACCESS: { label: 'Problema de Acesso', icon: KeyRound, color: 'text-amber-600' },
  PERFORMANCE: { label: 'Lentidao', icon: Gauge, color: 'text-orange-600' },
  INTEGRATION: { label: 'Integracao', icon: Link2, color: 'text-purple-600' },
  DATA: { label: 'Correcao de Dados', icon: Database, color: 'text-cyan-600' },
  TRAINING: { label: 'Treinamento', icon: GraduationCap, color: 'text-indigo-600' },
  OTHER: { label: 'Outros', icon: MoreHorizontal, color: 'text-gray-600' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Baixa', color: 'text-gray-600' },
  NORMAL: { label: 'Normal', color: 'text-blue-600' },
  HIGH: { label: 'Alta', color: 'text-orange-600' },
  URGENT: { label: 'Urgente', color: 'text-red-600' },
}

export default function SupportPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSubscriber, setFilterSubscriber] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user?.isSystemManager) {
      router.push('/')
      return
    }
    fetchTickets()
    fetchSubscribers()
  }, [session, sessionStatus, router])

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams()
      if (filterSubscriber !== 'all') params.set('subscriberId', filterSubscriber)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterCategory !== 'all') params.set('category', filterCategory)

      const response = await fetch(`/api/support/tickets?${params}`)
      if (response.ok) {
        const result = await response.json()
        // API retorna { tickets: [...], pagination: {...} }
        const data = result.tickets || result.data || result
        setTickets(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
      toast.error('Erro ao carregar tickets')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/subscribers')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result
        setSubscribers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erro ao carregar assinantes:', error)
    }
  }

  useEffect(() => {
    if (session?.user?.isSystemManager) {
      setIsLoading(true)
      fetchTickets()
    }
  }, [filterSubscriber, filterStatus, filterCategory])

  const filteredTickets = tickets.filter(ticket => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      ticket.ticketNumber?.toLowerCase().includes(searchLower) ||
      ticket.subject?.toLowerCase().includes(searchLower) ||
      ticket.user?.name?.toLowerCase().includes(searchLower) ||
      ticket.user?.email?.toLowerCase().includes(searchLower) ||
      ticket.subscriber?.name?.toLowerCase().includes(searchLower)
    )
  })

  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && !session?.user?.isSystemManager)) {
    return <CardSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suporte"
        description="Gerencie os chamados de suporte"
        icon={Headphones}
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por numero, assunto, usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select value={filterSubscriber} onValueChange={setFilterSubscriber}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Assinante" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Assinantes</SelectItem>
            {subscribers.map((sub) => (
              <SelectItem key={sub.id} value={String(sub.id)}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="OPEN">Aberto</SelectItem>
            <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
            <SelectItem value="WAITING_USER">Aguardando Usuario</SelectItem>
            <SelectItem value="WAITING_DEV">Aguardando Dev</SelectItem>
            <SelectItem value="RESOLVED">Resolvido</SelectItem>
            <SelectItem value="CLOSED">Fechado</SelectItem>
            <SelectItem value="CANCELED">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {Object.entries(categoryConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => { setIsLoading(true); fetchTickets(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <CardSkeleton />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={Headphones}
          title="Nenhum ticket encontrado"
          description="Nao ha chamados de suporte com os filtros selecionados"
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Ticket</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[80px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const catConfig = categoryConfig[ticket.category] || { label: ticket.category, icon: AlertCircle, color: 'text-gray-600' }
                const statConfig = statusConfig[ticket.status] || { label: ticket.status, color: 'bg-gray-100 text-gray-800', icon: Clock }
                const CategoryIcon = catConfig.icon
                const StatusIcon = statConfig.icon

                return (
                  <TableRow key={ticket.id} className="hover:bg-muted/30">
                    <TableCell>
                      <span className="font-mono text-sm">{ticket.ticketNumber}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryIcon className={`h-4 w-4 ${catConfig.color}`} />
                        <span className="text-sm">{catConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium truncate max-w-[200px]" title={ticket.subject}>
                        {ticket.subject}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{ticket.user?.name || 'Anonimo'}</p>
                        <p className="text-xs text-muted-foreground">{ticket.subscriber?.name || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statConfig.color}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${ticket.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
                        {statConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/support/${ticket.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
