'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, PriorityBadge } from '@/components/shared'
import {
  Edit,
  Copy,
  Printer,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { UpdateStatusModal } from './update-status-modal'
import { UpdatePriorityModal } from './update-priority-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface RegulationActionsSidebarProps {
  regulationId: number
  status: string | null | undefined
  priority?: string | null
  citizenName?: string
  protocolNumber?: string
}

export default function RegulationActionsSidebar({
  regulationId,
  status,
  priority,
  citizenName,
  protocolNumber,
}: RegulationActionsSidebarProps) {
  const router = useRouter()
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Função para imprimir
  const handlePrint = async () => {
    setIsPrinting(true)
    try {
      // Abre uma nova janela com a versão para impressão
      const printWindow = window.open(
        `/regulations/${regulationId}/print`,
        '_blank',
        'width=800,height=600'
      )

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      } else {
        // Fallback: imprime a página atual
        window.print()
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      toast.error('Erro ao abrir janela de impressão')
    } finally {
      setIsPrinting(false)
    }
  }

  // Função para alterar status
  const handleStatusChange = async (
    _regulationId: string | number,
    newStatus: string,
    sendWhatsapp: boolean,
    whatsappTemplateId?: string,
    reasonData?: { denialReason?: string; returnReason?: string; cancellationReason?: string }
  ) => {
    try {
      const response = await fetch(`/api/regulations/${regulationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          sendWhatsapp,
          whatsappTemplateId,
          ...reasonData
        }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar status')

      const data = await response.json()

      // Verificar resultado do WhatsApp
      if (sendWhatsapp && data.whatsappResult) {
        const { whatsappResult } = data

        if (whatsappResult.success) {
          toast.success('Status atualizado e mensagem WhatsApp enviada com sucesso!')
        } else if (whatsappResult.attempted) {
          // Status foi atualizado, mas WhatsApp falhou
          toast.success('Status atualizado com sucesso', {
            description: 'Porém a mensagem WhatsApp não foi enviada'
          })

          // Mostrar erro específico
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
        toast.success('Status atualizado com sucesso!')
      }

      router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
      throw error
    }
  }

  // Função para alterar prioridade
  const handlePriorityUpdate = async (newPriority: string, justification: string) => {
    try {
      const response = await fetch(`/api/regulations/${regulationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priority: newPriority,
          notes: justification // Adiciona justificativa nas observações
        }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar prioridade')

      toast.success('Prioridade atualizada com sucesso!')
      router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error)
      toast.error('Erro ao atualizar prioridade')
      throw error
    }
  }

  // Função para excluir
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/regulations/${regulationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir regulação')

      toast.success('Regulação excluída com sucesso!')
      router.push('/regulations')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir regulação')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Status e Prioridade */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Status e Prioridade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <StatusBadge status={status ?? ''} />
          </div>
          {priority && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prioridade:</span>
              <PriorityBadge priority={priority} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href={`/regulations/${regulationId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Regulação
            </Link>
          </Button>

          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href={`/regulations/${regulationId}/duplicate`}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar Regulação
            </Link>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handlePrint}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Imprimir
          </Button>
        </CardContent>
      </Card>

      {/* Gerenciamento */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Gerenciamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setIsStatusModalOpen(true)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Alterar Status
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setIsPriorityModalOpen(true)}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Alterar Prioridade
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Regulação
          </Button>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Informações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">ID da Regulação</p>
            <p className="font-medium">#{regulationId}</p>
          </div>
          {protocolNumber && (
            <div>
              <p className="text-muted-foreground">Protocolo</p>
              <p className="font-medium">{protocolNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <UpdateStatusModal
        open={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        regulation={{
          id: regulationId,
          citizen: { name: citizenName || 'Cidadão' },
          status: status ?? null,
        }}
        onStatusChange={handleStatusChange}
      />

      <UpdatePriorityModal
        open={isPriorityModalOpen}
        onOpenChange={setIsPriorityModalOpen}
        currentPriority={priority || 'ELECTIVE'}
        onUpdate={handlePriorityUpdate}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Regulação"
        description={`Tem certeza que deseja excluir a regulação #${regulationId}${citizenName ? ` de ${citizenName}` : ''}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
