'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Lightbulb,
  Copy,
  Check,
  MessageSquare,
  Calendar,
  Bell,
  FileText,
  Package,
  Heart,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TemplateSuggestion {
  id: string
  name: string
  category: 'status' | 'schedule' | 'medication' | 'care' | 'document' | 'general'
  triggerType: string
  bodyText: string
  description: string
  variables: string[]
}

// Templates pré-definidos
const TEMPLATE_SUGGESTIONS: TemplateSuggestion[] = [
  // STATUS
  {
    id: 'status-approved-1',
    name: 'Regulação Aprovada',
    category: 'status',
    triggerType: 'STATUS_APPROVED',
    description: 'Notifica o paciente quando a regulação é aprovada',
    bodyText: `Olá {{paciente.nome}}! 🎉

Temos uma ótima notícia!

Sua solicitação de regulação (Protocolo: {{regulacao.protocolo}}) foi *APROVADA*.

Próximos passos:
- Aguarde o contato para agendamento
- Mantenha seus documentos em mãos

Em caso de dúvidas, entre em contato com a unidade {{unidade.nome}}.`,
    variables: ['paciente.nome', 'regulacao.protocolo', 'unidade.nome'],
  },
  {
    id: 'status-denied-1',
    name: 'Regulação Negada',
    category: 'status',
    triggerType: 'STATUS_DENIED',
    description: 'Notifica o paciente quando a regulação é negada',
    bodyText: `Olá {{paciente.nome}},

Informamos que sua solicitação de regulação (Protocolo: {{regulacao.protocolo}}) não foi aprovada neste momento.

Motivo: {{regulacao.observacoes}}

Você pode entrar em contato com a unidade {{unidade.nome}} para mais informações ou solicitar uma nova avaliação.

Telefone: {{unidade.telefone}}`,
    variables: ['paciente.nome', 'regulacao.protocolo', 'regulacao.observacoes', 'unidade.nome', 'unidade.telefone'],
  },
  {
    id: 'status-in-analysis',
    name: 'Em Análise',
    category: 'status',
    triggerType: 'STATUS_IN_ANALYSIS',
    description: 'Notifica que a regulação está sendo analisada',
    bodyText: `Olá {{paciente.nome}},

Sua solicitação de regulação está sendo analisada pela equipe técnica.

Protocolo: {{regulacao.protocolo}}
Prioridade: {{regulacao.prioridade}}

Você será notificado assim que houver uma atualização.

Atenciosamente,
{{assinante.nome}}`,
    variables: ['paciente.nome', 'regulacao.protocolo', 'regulacao.prioridade', 'assinante.nome'],
  },

  // AGENDAMENTO
  {
    id: 'schedule-created-1',
    name: 'Agendamento Criado',
    category: 'schedule',
    triggerType: 'SCHEDULE_CREATED',
    description: 'Confirmação de novo agendamento',
    bodyText: `Olá {{paciente.nome}}! 📅

Seu agendamento foi confirmado!

*Data:* {{agendamento.data}}
*Local:* {{unidade.nome}}
*Endereço:* {{unidade.endereco}}, {{unidade.numero}} - {{unidade.bairro}}
*Profissional:* {{profissional.nome}}

Lembre-se de:
✓ Chegar com 15 minutos de antecedência
✓ Trazer documento com foto
✓ Trazer cartão SUS

Em caso de impossibilidade, entre em contato: {{unidade.telefone}}`,
    variables: ['paciente.nome', 'agendamento.data', 'unidade.nome', 'unidade.endereco', 'unidade.numero', 'unidade.bairro', 'profissional.nome', 'unidade.telefone'],
  },
  {
    id: 'schedule-reminder-24h',
    name: 'Lembrete 24h',
    category: 'schedule',
    triggerType: 'SCHEDULE_REMINDER_24H',
    description: 'Lembrete 24 horas antes do agendamento',
    bodyText: `Olá {{paciente.nome}}! ⏰

Lembrete: Seu atendimento é *AMANHÃ*!

*Data:* {{agendamento.data}}
*Local:* {{unidade.nome}}
*Profissional:* {{profissional.nome}}

Não se esqueça de:
✓ Documento com foto
✓ Cartão SUS
✓ Exames anteriores (se houver)

Confirme sua presença respondendo esta mensagem.`,
    variables: ['paciente.nome', 'agendamento.data', 'unidade.nome', 'profissional.nome'],
  },
  {
    id: 'schedule-reminder-2h',
    name: 'Lembrete 2h',
    category: 'schedule',
    triggerType: 'SCHEDULE_REMINDER_2H',
    description: 'Lembrete 2 horas antes do agendamento',
    bodyText: `Olá {{paciente.nome}}! 🕐

Seu atendimento será em *2 horas*!

*Horário:* {{agendamento.data}}
*Local:* {{unidade.nome}}

Já está a caminho? Responda SIM para confirmar.`,
    variables: ['paciente.nome', 'agendamento.data', 'unidade.nome'],
  },
  {
    id: 'schedule-cancelled',
    name: 'Agendamento Cancelado',
    category: 'schedule',
    triggerType: 'SCHEDULE_CANCELLED',
    description: 'Notificação de cancelamento de agendamento',
    bodyText: `Olá {{paciente.nome}},

Seu agendamento foi cancelado.

*Data original:* {{agendamento.data}}
*Local:* {{unidade.nome}}

Para reagendar, entre em contato:
📞 {{unidade.telefone}}

Pedimos desculpas pelo inconveniente.`,
    variables: ['paciente.nome', 'agendamento.data', 'unidade.nome', 'unidade.telefone'],
  },
  {
    id: 'schedule-rescheduled',
    name: 'Reagendamento',
    category: 'schedule',
    triggerType: 'SCHEDULE_RESCHEDULED',
    description: 'Notificação de reagendamento',
    bodyText: `Olá {{paciente.nome}}! 📅

Seu atendimento foi reagendado.

*Nova data:* {{agendamento.data}}
*Local:* {{unidade.nome}}
*Profissional:* {{profissional.nome}}

Por favor, confirme o recebimento desta mensagem.`,
    variables: ['paciente.nome', 'agendamento.data', 'unidade.nome', 'profissional.nome'],
  },

  // MEDICAMENTOS
  {
    id: 'medication-ready',
    name: 'Medicamento Pronto',
    category: 'medication',
    triggerType: 'MEDICATION_READY',
    description: 'Avisa quando medicamento está pronto para retirada',
    bodyText: `Olá {{paciente.nome}}! 💊

Seu medicamento está disponível para retirada!

*Local:* {{unidade.nome}}
*Endereço:* {{unidade.endereco}}, {{unidade.numero}}
*Horário:* Segunda a Sexta, 8h às 17h

Documentos necessários:
✓ Documento com foto
✓ Receita médica
✓ Cartão SUS

Prazo para retirada: 30 dias`,
    variables: ['paciente.nome', 'unidade.nome', 'unidade.endereco', 'unidade.numero'],
  },
  {
    id: 'medication-expiring',
    name: 'Prazo Expirando',
    category: 'medication',
    triggerType: 'MEDICATION_EXPIRING',
    description: 'Avisa que o prazo para retirada está acabando',
    bodyText: `⚠️ Atenção {{paciente.nome}}!

O prazo para retirada do seu medicamento está próximo do vencimento.

Retire seu medicamento em até 7 dias na unidade {{unidade.nome}}.

Não perca o prazo!`,
    variables: ['paciente.nome', 'unidade.nome'],
  },

  // CUIDADOS
  {
    id: 'care-plan-created',
    name: 'Plano de Cuidado Criado',
    category: 'care',
    triggerType: 'CARE_PLAN_CREATED',
    description: 'Notifica criação de plano de cuidados',
    bodyText: `Olá {{paciente.nome}}! 💚

Um plano de cuidados foi criado para você.

Protocolo: {{regulacao.protocolo}}
Profissional responsável: {{profissional.nome}}

Em breve você receberá mais orientações sobre seu acompanhamento.

Cuide-se!`,
    variables: ['paciente.nome', 'regulacao.protocolo', 'profissional.nome'],
  },

  // DOCUMENTOS
  {
    id: 'document-required',
    name: 'Documento Necessário',
    category: 'document',
    triggerType: 'DOCUMENT_REQUIRED',
    description: 'Solicita documentos pendentes',
    bodyText: `Olá {{paciente.nome}},

Para dar continuidade ao seu processo, precisamos de documentos adicionais.

Protocolo: {{regulacao.protocolo}}

Por favor, compareça à unidade {{unidade.nome}} com os documentos solicitados.

Endereço: {{unidade.endereco}}, {{unidade.numero}}
Telefone: {{unidade.telefone}}`,
    variables: ['paciente.nome', 'regulacao.protocolo', 'unidade.nome', 'unidade.endereco', 'unidade.numero', 'unidade.telefone'],
  },

  // GERAL
  {
    id: 'general-welcome',
    name: 'Boas-vindas',
    category: 'general',
    triggerType: 'STATUS_PENDING',
    description: 'Mensagem de boas-vindas ao criar regulação',
    bodyText: `Olá {{paciente.nome}}! 👋

Seja bem-vindo(a) ao sistema de regulação de {{assinante.municipio}}.

Sua solicitação foi recebida com sucesso!

Protocolo: {{regulacao.protocolo}}

Você receberá atualizações sobre o andamento do seu processo por este canal.

Atenciosamente,
Secretaria de Saúde`,
    variables: ['paciente.nome', 'assinante.municipio', 'regulacao.protocolo'],
  },
]

const CATEGORY_CONFIG = {
  status: { label: 'Status', icon: Bell, color: 'bg-blue-500' },
  schedule: { label: 'Agendamento', icon: Calendar, color: 'bg-orange-500' },
  medication: { label: 'Medicamentos', icon: Package, color: 'bg-purple-500' },
  care: { label: 'Cuidados', icon: Heart, color: 'bg-rose-500' },
  document: { label: 'Documentos', icon: FileText, color: 'bg-emerald-500' },
  general: { label: 'Geral', icon: MessageSquare, color: 'bg-gray-500' },
}

interface TemplateSuggestionsProps {
  onSelect: (template: TemplateSuggestion) => void
}

export function TemplateSuggestions({ onSelect }: TemplateSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredTemplates = selectedCategory === 'all'
    ? TEMPLATE_SUGGESTIONS
    : TEMPLATE_SUGGESTIONS.filter((t) => t.category === selectedCategory)

  const handleSelect = (template: TemplateSuggestion) => {
    onSelect(template)
    setIsOpen(false)
    toast.success('Template aplicado!')
  }

  const handleCopy = (template: TemplateSuggestion) => {
    navigator.clipboard.writeText(template.bodyText)
    setCopiedId(template.id)
    toast.success('Texto copiado!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Lightbulb className="h-4 w-4" />
          Usar Template Pronto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Templates Prontos para Uso
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
            <TabsTrigger value="all" className="text-xs">
              Todos
            </TabsTrigger>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon
              return (
                <TabsTrigger key={key} value={key} className="text-xs gap-1">
                  <Icon className="h-3 w-3" />
                  {config.label}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="grid gap-3 md:grid-cols-2 pr-4">
              {filteredTemplates.map((template) => {
                const categoryConfig = CATEGORY_CONFIG[template.category]
                const CategoryIcon = categoryConfig.icon

                return (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={cn('p-1.5 rounded-md text-white', categoryConfig.color)}>
                            <CategoryIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                            <CardDescription className="text-xs">{template.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {template.triggerType}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="bg-muted/50 rounded-md p-3 mb-3">
                        <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                          {template.bodyText.substring(0, 200)}...
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((v) => (
                            <Badge key={v} variant="outline" className="text-[9px] font-mono">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-[9px]">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy(template)
                            }}
                          >
                            {copiedId === template.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => handleSelect(template)}
                          >
                            Usar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export { TEMPLATE_SUGGESTIONS }
export type { TemplateSuggestion }
