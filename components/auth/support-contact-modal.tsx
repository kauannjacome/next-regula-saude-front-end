'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { Loader2, CheckCircle, KeyRound, Shield } from 'lucide-react'

interface SupportContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportContactModal({ open, onOpenChange }: SupportContactModalProps) {
  const [ticketType, setTicketType] = useState<string>('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!ticketType) {
      toast.error('Selecione o tipo de problema')
      return
    }

    setIsSubmitting(true)
    try {
      // Mapear tipo para categoria/subcategoria
      const categoryMap: Record<string, { category: string; subcategory: string; subject: string }> = {
        PASSWORD_RESET: {
          category: 'ACCESS',
          subcategory: 'password_reset',
          subject: 'Esqueci minha senha'
        },
        TWO_FACTOR_RESET: {
          category: 'ACCESS',
          subcategory: '2fa_reset',
          subject: 'Problemas com 2FA / Perdi acesso ao celular'
        }
      }

      const ticketData = categoryMap[ticketType] || {
        category: 'ACCESS',
        subcategory: ticketType.toLowerCase(),
        subject: 'Problema de acesso'
      }

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: ticketData.category,
          subcategory: ticketData.subcategory,
          subject: ticketData.subject,
          description: description || ticketData.subject,
          channel: 'WEB',
          errorContext: {
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pedido')
      }

      setIsSuccess(true)
      toast.success('Pedido enviado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setTicketType('')
    setDescription('')
    setIsSuccess(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-md rounded-lg">
        {isSuccess ? (
          <>
            <DialogHeader>
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-center">Pedido Enviado!</DialogTitle>
              <DialogDescription className="text-center">
                Seu pedido de suporte foi registrado com sucesso. Nossa equipe entrará em contato em breve.
              </DialogDescription>
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
              <DialogTitle>Entrar em contato com o suporte</DialogTitle>
              <DialogDescription>
                Selecione o tipo de problema e descreva sua situação. Nossa equipe analisará seu pedido.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de problema *</label>
                <Select value={ticketType} onValueChange={setTicketType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de problema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSWORD_RESET">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-amber-600" />
                        <span>Esqueci minha senha</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="TWO_FACTOR_RESET">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span>Problemas com 2FA / Perdi acesso ao celular</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Descreva sua situação <span className="text-muted-foreground">(opcional)</span>
                </label>
                <Textarea
                  placeholder="Descreva o problema que está enfrentando..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Importante:</strong> Por segurança, o suporte poderá solicitar informações adicionais para confirmar sua identidade antes de processar o pedido.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!ticketType || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Pedido'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
