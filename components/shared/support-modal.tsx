'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  CheckCircle,
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
} from 'lucide-react'

interface SupportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCategory?: string
  defaultSubcategory?: string
}

const categoryOptions = [
  { value: 'BUG', label: 'Erro/Bug', icon: Bug, color: 'text-red-600' },
  { value: 'QUESTION', label: 'Duvida', icon: HelpCircle, color: 'text-blue-600' },
  { value: 'BILLING', label: 'Faturamento', icon: CreditCard, color: 'text-green-600' },
  { value: 'FEATURE', label: 'Sugestao', icon: Lightbulb, color: 'text-yellow-600' },
  { value: 'ACCESS', label: 'Problema de Acesso', icon: KeyRound, color: 'text-amber-600' },
  { value: 'PERFORMANCE', label: 'Lentidao', icon: Gauge, color: 'text-orange-600' },
  { value: 'INTEGRATION', label: 'Integracao', icon: Link2, color: 'text-purple-600' },
  { value: 'DATA', label: 'Correcao de Dados', icon: Database, color: 'text-cyan-600' },
  { value: 'TRAINING', label: 'Treinamento', icon: GraduationCap, color: 'text-indigo-600' },
  { value: 'OTHER', label: 'Outros', icon: MoreHorizontal, color: 'text-gray-600' },
]

export function SupportModal({
  open,
  onOpenChange,
  defaultCategory = '',
  defaultSubcategory = '',
}: SupportModalProps) {
  const { data: session } = useSession()
  const [category, setCategory] = useState(defaultCategory)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')

  const handleSubmit = async () => {
    if (!category) {
      toast.error('Selecione a categoria')
      return
    }
    if (!subject.trim()) {
      toast.error('Digite o assunto')
      return
    }
    if (!description.trim()) {
      toast.error('Descreva o problema')
      return
    }

    setIsSubmitting(true)
    try {
      // Capturar contexto do erro
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
          subcategory: defaultSubcategory || undefined,
          subject,
          description,
          channel: 'WEB',
          errorContext,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar chamado')
      }

      setTicketNumber(data.ticket?.ticketNumber || '')
      setIsSuccess(true)
      toast.success('Chamado criado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar chamado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Reset state
    setCategory(defaultCategory)
    setSubject('')
    setDescription('')
    setIsSuccess(false)
    setTicketNumber('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-lg rounded-lg">
        {isSuccess ? (
          <>
            <DialogHeader>
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-center">Chamado Enviado!</DialogTitle>
              <div className="text-center space-y-2 text-sm text-muted-foreground">
                <span className="block">Seu chamado foi registrado com sucesso.</span>
                {ticketNumber && (
                  <span className="font-mono text-sm bg-muted px-3 py-1 rounded inline-block">
                    {ticketNumber}
                  </span>
                )}
                <span className="block text-xs">Nossa equipe entrara em contato em breve.</span>
              </div>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Abrir Chamado de Suporte</DialogTitle>
              <DialogDescription>
                Descreva seu problema ou duvida e nossa equipe entrara em contato.
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
                    {categoryOptions.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${opt.color}`} />
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assunto *</Label>
                <Input
                  placeholder="Resumo do problema"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Descricao *</Label>
                <Textarea
                  placeholder="Descreva o problema com o maximo de detalhes possivel..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {session?.user?.email && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">Resposta sera enviada para: </span>
                  <span className="font-medium">{session.user.email}</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Chamado'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
