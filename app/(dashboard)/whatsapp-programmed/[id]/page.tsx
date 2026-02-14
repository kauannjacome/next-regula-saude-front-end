'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, ConfirmDialog } from '@/components/shared'
import {
  MessageSquare,
  Edit,
  Trash2,
  Zap,
  FileText,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'
import { WHATSAPP_TRIGGERS } from '@/lib/constants'

interface WhatsAppTemplateData {
  id: number
  name: string
  triggerType: string
  triggerValue?: string | null
  headerText?: string | null
  bodyText: string
  footerText?: string | null
  buttons?: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const mapTriggerLabel = (trigger: string) => {
  const found = WHATSAPP_TRIGGERS.find((t: { value: string; label: string }) => t.value === trigger)
  return found?.label || trigger
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function WhatsAppTemplateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = Array.isArray(params.id) ? params.id[0] : params.id

  const [template, setTemplate] = useState<WhatsAppTemplateData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.get(`/whatsapp-programmed/${templateId}`)
        setTemplate(response.data || response)
      } catch (error) {
        console.error('Erro ao carregar template:', error)
        toast.error('Erro ao carregar template')
        router.push('/whatsapp-programmed')
      } finally {
        setIsLoading(false)
      }
    }

    if (templateId) {
      fetchTemplate()
    }
  }, [templateId, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/whatsapp-programmed/${templateId}`)
      toast.success('Template excluido com sucesso')
      router.push('/whatsapp-programmed')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir template')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Template nao encontrado</p>
          <Link href="/whatsapp-programmed">
            <Button variant="link" className="mt-4">Voltar</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          title={template.name}
          description="Template de mensagem WhatsApp"
          backHref="/whatsapp-programmed"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Configuracao do Gatilho */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Gatilho de Disparo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Gatilho</p>
                  <Badge variant="outline" className="mt-1">
                    {mapTriggerLabel(template.triggerType)}
                  </Badge>
                </div>
                {template.triggerValue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Valor do Gatilho</p>
                    <p className="font-medium">{template.triggerValue}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card: Conteudo da Mensagem */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle>Conteudo da Mensagem</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.headerText && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cabecalho</p>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{template.headerText}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Corpo da Mensagem</p>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="whitespace-pre-wrap">{template.bodyText}</p>
                </div>
              </div>

              {template.footerText && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rodape</p>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{template.footerText}</p>
                  </div>
                </div>
              )}

              {template.buttons && Object.keys(template.buttons).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Botoes</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(template.buttons) ? (
                      template.buttons.map((btn: any, i: number) => (
                        <Badge key={i} variant="secondary">
                          {btn.text || btn.label || `Botao ${i + 1}`}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {JSON.stringify(template.buttons)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                <CardTitle>Preview da Mensagem</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm mx-auto">
                <div className="bg-[#e5ddd5] p-4 rounded-lg">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    {template.headerText && (
                      <p className="font-bold text-sm mb-2">{template.headerText}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{template.bodyText}</p>
                    {template.footerText && (
                      <p className="text-xs text-gray-500 mt-2">{template.footerText}</p>
                    )}
                    <p className="text-xs text-gray-400 text-right mt-1">12:00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={template.isActive ? 'default' : 'secondary'}>
                {template.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </CardContent>
          </Card>

          {/* Acoes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/whatsapp-programmed/${template.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Template
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Template
              </Button>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Informacoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-medium">#{template.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(template.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{formatDate(template.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Confirmar Exclusao */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Template"
        description={`Tem certeza que deseja excluir o template "${template.name}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
