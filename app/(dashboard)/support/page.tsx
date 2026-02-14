'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/page-header'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Headphones,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
} from 'lucide-react'

interface Ticket {
  id: number
  ticketNumber: string
  category: string
  subcategory?: string
  subject: string
  description: string
  status: string
  priority: string
  createdAt: string
  resolvedAt?: string
  _count: { messages: number }
  assignedTo?: { name: string }
}

interface TicketMessage {
  id: number
  message: string
  isFromUser: boolean
  createdAt: string
  user?: { name: string }
}

interface TicketDetail extends Ticket {
  messages: TicketMessage[]
  resolution?: string
}

const categoryLabels: Record<string, string> = {
  BUG: 'Erro/Bug',
  QUESTION: 'Duvida',
  BILLING: 'Faturamento',
  FEATURE: 'Sugestao',
  ACCESS: 'Problema de Acesso',
  PERFORMANCE: 'Lentidao',
  INTEGRATION: 'Integracao',
  DATA: 'Correcao de Dados',
  TRAINING: 'Treinamento',
  OTHER: 'Outros',
}

const statusLabels: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Andamento',
  WAITING_USER: 'Aguardando Voce',
  WAITING_DEV: 'Em Desenvolvimento',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
  CANCELED: 'Cancelado',
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_USER: 'bg-orange-100 text-orange-800',
  WAITING_DEV: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  CANCELED: 'bg-red-100 text-red-800',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
  CRITICAL: 'bg-red-200 text-red-800',
}

export default function SupportPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false)
  const [showTicketDetail, setShowTicketDetail] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  // Form state
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user) {
      router.push('/login')
      return
    }
    fetchTickets()
  }, [session, sessionStatus, router])

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/support/tickets')
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTicketDetail = async (id: number) => {
    try {
      const response = await fetch(`/api/support/tickets/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedTicket(data)
        setShowTicketDetail(true)
      }
    } catch (error) {
      toast.error('Erro ao carregar ticket')
    }
  }

  const handleCreateTicket = async () => {
    if (!category || !subject || !description) {
      toast.error('Preencha todos os campos')
      return
    }

    setIsSubmitting(true)
    try {
      // Capturar contexto do erro (navegador, URL, etc)
      const errorContext = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      }

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject,
          description,
          channel: 'WEB',
          errorContext,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Ticket ${data.ticket.ticketNumber} criado com sucesso!`)
        setShowNewTicketDialog(false)
        setCategory('')
        setSubject('')
        setDescription('')
        fetchTickets()
      } else {
        toast.error(data.error || 'Erro ao criar ticket')
      }
    } catch (error) {
      toast.error('Erro ao criar ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      })

      if (response.ok) {
        setNewMessage('')
        fetchTicketDetail(selectedTicket.id)
        toast.success('Mensagem enviada')
      } else {
        toast.error('Erro ao enviar mensagem')
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sessionStatus === 'loading' || isLoading) {
    return <CardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Suporte"
          description="Abra chamados e acompanhe suas solicitacoes"
          icon={Headphones}
        />
        <Button onClick={() => setShowNewTicketDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden xl:inline">Novo Chamado</span>
          <span className="xl:hidden">Novo</span>
        </Button>
      </div>

      {/* Lista de Tickets */}
      {tickets.length === 0 ? (
        <EmptyState
          icon={Headphones}
          title="Nenhum chamado"
          description="Voce ainda nao abriu nenhum chamado de suporte"
          actionLabel="Abrir Chamado"
          onAction={() => setShowNewTicketDialog(true)}
        />
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => fetchTicketDetail(ticket.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {ticket.ticketNumber}
                      </span>
                      {ticket.subject}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {categoryLabels[ticket.category] || ticket.category}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={priorityColors[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={statusColors[ticket.status]}>
                      {statusLabels[ticket.status] || ticket.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {ticket._count.messages} mensagens
                    </span>
                  </div>
                  {ticket.assignedTo && (
                    <span>Atribuido a: {ticket.assignedTo.name}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Novo Ticket */}
      <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
        <DialogContent className="w-[95vw] max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Novo Chamado de Suporte</DialogTitle>
            <DialogDescription>
              Descreva seu problema ou duvida e nossa equipe entrara em contato
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assunto *</Label>
              <Input
                placeholder="Resumo do problema"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Descricao *</Label>
              <Textarea
                placeholder="Descreva o problema com o maximo de detalhes possivel..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTicket} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes do Ticket */}
      <Dialog open={showTicketDetail} onOpenChange={setShowTicketDetail}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-lg">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {selectedTicket.ticketNumber}
                      </span>
                      {selectedTicket.subject}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {categoryLabels[selectedTicket.category]}
                      {' - '}
                      Aberto em {new Date(selectedTicket.createdAt).toLocaleDateString('pt-BR')}
                    </DialogDescription>
                  </div>
                  <Badge className={statusColors[selectedTicket.status]}>
                    {statusLabels[selectedTicket.status]}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Descricao original */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Resolucao */}
              {selectedTicket.resolution && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                    <CheckCircle className="h-4 w-4" />
                    Resolucao
                  </div>
                  <p className="text-sm">{selectedTicket.resolution}</p>
                </div>
              )}

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[300px]">
                {selectedTicket.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.isFromUser
                          ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {msg.isFromUser ? 'Voce' : msg.user?.name || 'Suporte'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Input de nova mensagem */}
              {!['RESOLVED', 'CLOSED', 'CANCELED'].includes(selectedTicket.status) && (
                <div className="flex gap-2 pt-4 border-t">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={isSubmitting || !newMessage.trim()}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
