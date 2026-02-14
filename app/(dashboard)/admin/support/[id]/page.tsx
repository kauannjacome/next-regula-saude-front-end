'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  Bug,
  HelpCircle,
  CreditCard,
  Lightbulb,
  KeyRound,
  Gauge,
  Link2,
  Database,
  GraduationCap,
  MoreHorizontal,
  AlertCircle,
  UserCheck,
  Code,
  MessageSquare,
  Send,
} from 'lucide-react'
import Link from 'next/link'

interface Subscriber {
  id: number
  name: string
  municipalityName?: string
  email?: string
  telephone?: string
}

interface UserInfo {
  id: string
  name: string | null
  email: string | null
  phoneNumber?: string | null
}

interface TicketMessage {
  id: number
  message: string
  isInternal: boolean
  isFromUser: boolean
  createdAt: string
  user: { id: string; name: string | null }
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
  errorContext: any
  contactEmail: string | null
  contactName: string | null
  contactPhone: string | null
  createdAt: string
  resolvedAt: string | null
  subscriber: Subscriber | null
  user: UserInfo | null
  assignedTo: UserInfo | null
  resolvedBy: UserInfo | null
  messages: TicketMessage[]
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

const categoryConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  BUG: { label: 'Erro/Bug', icon: Bug, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  QUESTION: { label: 'Duvida', icon: HelpCircle, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  BILLING: { label: 'Faturamento', icon: CreditCard, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  FEATURE: { label: 'Sugestao', icon: Lightbulb, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  ACCESS: { label: 'Problema de Acesso', icon: KeyRound, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  PERFORMANCE: { label: 'Lentidao', icon: Gauge, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  INTEGRATION: { label: 'Integracao', icon: Link2, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  DATA: { label: 'Correcao de Dados', icon: Database, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  TRAINING: { label: 'Treinamento', icon: GraduationCap, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  OTHER: { label: 'Outros', icon: MoreHorizontal, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Baixa', color: 'text-gray-600' },
  NORMAL: { label: 'Normal', color: 'text-blue-600' },
  HIGH: { label: 'Alta', color: 'text-orange-600' },
  URGENT: { label: 'Urgente', color: 'text-red-600' },
}

export default function SupportTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [newPriority, setNewPriority] = useState<string>('')

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user?.isSystemManager) {
      router.push('/')
      return
    }
    fetchTicket()
  }, [session, sessionStatus, router, resolvedParams.id])

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/support/tickets/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data)
        setNewStatus(data.status)
        setNewPriority(data.priority)
      } else {
        toast.error('Ticket nao encontrado')
        router.push('/admin/support')
      }
    } catch (error) {
      console.error('Erro ao carregar ticket:', error)
      toast.error('Erro ao carregar ticket')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTicket = async () => {
    if (!ticket) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          priority: newPriority
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar ticket')
      }

      toast.success('Ticket atualizado!')
      fetchTicket()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar ticket')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!ticket || !newMessage.trim()) return

    setIsSendingMessage(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage.trim(),
          isInternal
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      setNewMessage('')
      setIsInternal(false)
      toast.success('Mensagem enviada!')
      fetchTicket()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem')
    } finally {
      setIsSendingMessage(false)
    }
  }

  if (sessionStatus === 'loading' || isLoading) {
    return <CardSkeleton />
  }

  if (!ticket) {
    return null
  }

  const catConfig = categoryConfig[ticket.category] || { label: ticket.category, icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' }
  const statConfig = statusConfig[ticket.status] || { label: ticket.status, color: 'bg-gray-100 text-gray-800', icon: Clock }
  const prioConfig = priorityConfig[ticket.priority] || { label: ticket.priority, color: 'text-gray-600' }
  const CategoryIcon = catConfig.icon
  const StatusIcon = statConfig.icon
  const canUpdate = !['RESOLVED', 'CLOSED', 'CANCELED'].includes(ticket.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader
          title={ticket.ticketNumber}
          description={ticket.subject}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informacoes do Ticket */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${catConfig.bgColor}`}>
                  <CategoryIcon className={`h-6 w-6 ${catConfig.color}`} />
                </div>
                <div>
                  <CardTitle>{catConfig.label}</CardTitle>
                  <CardDescription>Prioridade: <span className={prioConfig.color}>{prioConfig.label}</span></CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className={statConfig.color}>
                <StatusIcon className={`h-3 w-3 mr-1 ${ticket.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
                {statConfig.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Usuario */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Usuario Solicitante
              </h3>
              <div className="grid gap-2 pl-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{ticket.user?.name || ticket.contactName || 'Nao informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{ticket.user?.email || ticket.contactEmail || '-'}</span>
                </div>
                {(ticket.user?.phoneNumber || ticket.contactPhone) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{ticket.user?.phoneNumber || ticket.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assinante */}
            {ticket.subscriber && (
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Assinante
                </h3>
                <div className="grid gap-2 pl-6">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-medium">{ticket.subscriber.name}</span>
                  </div>
                  {ticket.subscriber.municipalityName && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Municipio:</span>
                      <span>{ticket.subscriber.municipalityName}</span>
                    </div>
                  )}
                  {ticket.subscriber.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{ticket.subscriber.email}</span>
                    </div>
                  )}
                  {ticket.subscriber.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{ticket.subscriber.telephone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descricao */}
            {ticket.description && (
              <div className="space-y-3">
                <h3 className="font-medium">Descricao do Problema</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
            )}

            {/* Contexto de Erro */}
            {ticket.errorContext && (
              <div className="space-y-3">
                <h3 className="font-medium">Contexto Tecnico</h3>
                <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(ticket.errorContext, null, 2)}
                </pre>
              </div>
            )}

            {/* Datas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Criado em
                </p>
                <p className="font-medium">
                  {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {ticket.resolvedAt && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Resolvido em
                  </p>
                  <p className="font-medium">
                    {new Date(ticket.resolvedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {ticket.resolvedBy && (
                    <p className="text-sm text-muted-foreground">
                      por {ticket.resolvedBy.name || ticket.resolvedBy.email}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Acoes */}
        <Card>
          <CardHeader>
            <CardTitle>Acoes</CardTitle>
            <CardDescription>Gerencie este ticket de suporte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canUpdate ? (
              <>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={handleUpdateTicket}
                  disabled={isUpdating || (newStatus === ticket.status && newPriority === ticket.priority)}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Ticket'
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  Este ticket ja foi {ticket.status === 'RESOLVED' ? 'resolvido' : ticket.status === 'CLOSED' ? 'fechado' : 'cancelado'}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensagens ({ticket.messages?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de mensagens */}
          {ticket.messages && ticket.messages.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {ticket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.isInternal
                      ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                      : msg.isFromUser
                      ? 'bg-muted/50'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {msg.user?.name || 'Usuario'}
                      {msg.isInternal && (
                        <Badge variant="outline" className="ml-2 text-xs">Nota Interna</Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma mensagem ainda
            </p>
          )}

          {/* Nova mensagem */}
          {canUpdate && (
            <div className="space-y-3 pt-4 border-t">
              <Textarea
                placeholder="Digite sua resposta..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  Nota interna (nao visivel para o usuario)
                </label>
                <Button
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || !newMessage.trim()}
                >
                  {isSendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
