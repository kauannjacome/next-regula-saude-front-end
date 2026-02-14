'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Save,
  Settings,
  Clock,
  Users,
  ChevronRight,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared'

interface NotificationConfig {
  id: number | null
  isActive: boolean
  sendInApp: boolean
  sendEmail: boolean
  sendWhatsApp: boolean
  sendSMS: boolean
  emailSubject: string | null
  emailTemplate: string | null
  whatsappTemplateId: number | null
  smsTemplate: string | null
  inAppTitle: string | null
  inAppMessage: string | null
  recipientType: string
  sendToRoles: string[]
  delayMinutes: number
  reminderDaysBefore: number | null
}

interface NotificationEvent {
  eventType: string
  label: string
  category: string
  config: NotificationConfig
}

interface WhatsAppTemplate {
  id: number
  name: string
}

interface TenantRole {
  id: string
  name: string
  displayName: string
}

const RECIPIENT_TYPE_LABELS: Record<string, string> = {
  REGULATION_OWNER: 'Criador da regulação',
  REGULATION_ASSIGNED: 'Profissional atribuído',
  CITIZEN: 'Cidadão/Paciente',
  SPECIFIC_ROLES: 'Roles específicos',
  ALL_ADMINS: 'Todos os administradores',
  ALL_USERS: 'Todos os usuários',
  CUSTOM: 'Lista personalizada',
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Regulações': <Settings className="h-5 w-5" />,
  'Agendamentos': <Clock className="h-5 w-5" />,
  'Cidadãos': <Users className="h-5 w-5" />,
  'Usuários': <Users className="h-5 w-5" />,
  'Sistema': <Bell className="h-5 w-5" />,
}

export default function SubscriberNotificationsPage() {
  const params = useParams()
  const subscriberId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subscriberName, setSubscriberName] = useState('')
  const [configs, setConfigs] = useState<Record<string, NotificationEvent[]>>({})
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([])
  const [roles, setRoles] = useState<TenantRole[]>([])
  const [selectedEvent, setSelectedEvent] = useState<NotificationEvent | null>(null)
  const [editedConfig, setEditedConfig] = useState<NotificationConfig | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const loadSubscriber = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/subscribers/${subscriberId}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriberName(data.name || '')
      }
    } catch (error) {
      console.error('Error loading subscriber:', error)
    }
  }, [subscriberId])

  const loadNotificationConfigs = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/subscribers/${subscriberId}/notifications`)
      if (!response.ok) {
        throw new Error('Failed to load notifications')
      }
      const data = await response.json()
      setConfigs(data.configs || {})
      setWhatsappTemplates(data.whatsappTemplates || [])
      setRoles(data.roles || [])
    } catch (error) {
      console.error('Error loading notification configs:', error)
      toast.error('Erro ao carregar configurações de notificação')
    } finally {
      setLoading(false)
    }
  }, [subscriberId])

  useEffect(() => {
    loadSubscriber()
    loadNotificationConfigs()
  }, [loadSubscriber, loadNotificationConfigs])

  const handleToggleActive = async (eventType: string, category: string, isActive: boolean) => {
    // Atualizar localmente
    setConfigs(prev => {
      const updated = { ...prev }
      const categoryEvents = [...(updated[category] || [])]
      const eventIndex = categoryEvents.findIndex(e => e.eventType === eventType)
      if (eventIndex >= 0) {
        categoryEvents[eventIndex] = {
          ...categoryEvents[eventIndex],
          config: { ...categoryEvents[eventIndex].config, isActive },
        }
        updated[category] = categoryEvents
      }
      return updated
    })
    setHasChanges(true)
  }

  const handleOpenDetails = (event: NotificationEvent) => {
    setSelectedEvent(event)
    setEditedConfig({ ...event.config })
    setDialogOpen(true)
  }

  const handleSaveEventConfig = async () => {
    if (!selectedEvent || !editedConfig) return

    try {
      const response = await fetch(`/api/admin/subscribers/${subscriberId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: selectedEvent.eventType,
          ...editedConfig,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save config')
      }

      toast.success('Configuração salva')
      setDialogOpen(false)
      loadNotificationConfigs()
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Erro ao salvar configuração')
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // Coletar todas as configurações modificadas
      const allConfigs: Array<NotificationConfig & { eventType: string }> = []
      Object.values(configs).forEach(events => {
        events.forEach(event => {
          allConfigs.push({
            eventType: event.eventType,
            ...event.config,
          })
        })
      })

      const response = await fetch(`/api/admin/subscribers/${subscriberId}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: allConfigs }),
      })

      if (!response.ok) {
        throw new Error('Failed to save configs')
      }

      toast.success('Todas as configurações foram salvas')
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving all configs:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const getActiveCount = (category: string) => {
    return (configs[category] || []).filter(e => e.config.isActive).length
  }

  const getTotalCount = (category: string) => {
    return (configs[category] || []).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title={`Notificações - ${subscriberName}`}
          description="Configure quais notificações são enviadas e por quais canais"
          backHref="/admin/subscribers"
        />
        {hasChanges && (
          <Button onClick={handleSaveAll} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        )}
      </div>

      {/* Resumo de Canais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Bell className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">In-App</p>
              <p className="text-2xl font-bold">
                {Object.values(configs).flat().filter(e => e.config.isActive && e.config.sendInApp).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-2xl font-bold">
                {Object.values(configs).flat().filter(e => e.config.isActive && e.config.sendEmail).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MessageSquare className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">WhatsApp</p>
              <p className="text-2xl font-bold">
                {Object.values(configs).flat().filter(e => e.config.isActive && e.config.sendWhatsApp).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Smartphone className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">SMS</p>
              <p className="text-2xl font-bold">
                {Object.values(configs).flat().filter(e => e.config.isActive && e.config.sendSMS).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos de Notificação</CardTitle>
          <CardDescription>
            Ative os eventos e configure os canais de envio para cada tipo de notificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={Object.keys(configs)} className="w-full">
            {Object.entries(configs).map(([category, events]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    {CATEGORY_ICONS[category] || <Bell className="h-5 w-5" />}
                    <span className="font-semibold">{category}</span>
                    <Badge variant="secondary">
                      {getActiveCount(category)} / {getTotalCount(category)} ativos
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {events.map((event) => (
                      <div
                        key={event.eventType}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={event.config.isActive}
                            onCheckedChange={(checked) =>
                              handleToggleActive(event.eventType, category, checked)
                            }
                          />
                          <div>
                            <p className="font-medium">{event.label}</p>
                            <div className="flex gap-2 mt-1">
                              {event.config.isActive && (
                                <>
                                  {event.config.sendInApp && (
                                    <Badge variant="outline" className="text-xs">
                                      <Bell className="h-3 w-3 mr-1" /> In-App
                                    </Badge>
                                  )}
                                  {event.config.sendEmail && (
                                    <Badge variant="outline" className="text-xs">
                                      <Mail className="h-3 w-3 mr-1" /> Email
                                    </Badge>
                                  )}
                                  {event.config.sendWhatsApp && (
                                    <Badge variant="outline" className="text-xs">
                                      <MessageSquare className="h-3 w-3 mr-1" /> WhatsApp
                                    </Badge>
                                  )}
                                  {event.config.sendSMS && (
                                    <Badge variant="outline" className="text-xs">
                                      <Smartphone className="h-3 w-3 mr-1" /> SMS
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(event)}
                        >
                          Configurar
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Dialog de Configuração Detalhada */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Configurar Notificação</DialogTitle>
            <DialogDescription>
              {selectedEvent?.label}
            </DialogDescription>
          </DialogHeader>

          {editedConfig && (
            <div className="space-y-6">
              {/* Status Ativo */}
              <div className="flex items-center justify-between">
                <Label>Notificação Ativa</Label>
                <Switch
                  checked={editedConfig.isActive}
                  onCheckedChange={(checked) =>
                    setEditedConfig({ ...editedConfig, isActive: checked })
                  }
                />
              </div>

              {/* Canais de Envio */}
              <div className="space-y-4">
                <h4 className="font-semibold">Canais de Envio</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-500" />
                      <Label>In-App</Label>
                    </div>
                    <Switch
                      checked={editedConfig.sendInApp}
                      onCheckedChange={(checked) =>
                        setEditedConfig({ ...editedConfig, sendInApp: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-500" />
                      <Label>Email</Label>
                    </div>
                    <Switch
                      checked={editedConfig.sendEmail}
                      onCheckedChange={(checked) =>
                        setEditedConfig({ ...editedConfig, sendEmail: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-emerald-500" />
                      <Label>WhatsApp</Label>
                    </div>
                    <Switch
                      checked={editedConfig.sendWhatsApp}
                      onCheckedChange={(checked) =>
                        setEditedConfig({ ...editedConfig, sendWhatsApp: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-purple-500" />
                      <Label>SMS</Label>
                    </div>
                    <Switch
                      checked={editedConfig.sendSMS}
                      onCheckedChange={(checked) =>
                        setEditedConfig({ ...editedConfig, sendSMS: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Destinatário */}
              <div className="space-y-2">
                <Label>Destinatário</Label>
                <Select
                  value={editedConfig.recipientType}
                  onValueChange={(value) =>
                    setEditedConfig({ ...editedConfig, recipientType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destinatário" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECIPIENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Configuração de Delay */}
              <div className="space-y-2">
                <Label>Atraso no Envio (minutos)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editedConfig.delayMinutes}
                  onChange={(e) =>
                    setEditedConfig({
                      ...editedConfig,
                      delayMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Define quantos minutos após o evento a notificação será enviada
                </p>
              </div>

              {/* Template In-App */}
              {editedConfig.sendInApp && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Configuração In-App
                  </h4>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={editedConfig.inAppTitle || ''}
                      onChange={(e) =>
                        setEditedConfig({ ...editedConfig, inAppTitle: e.target.value })
                      }
                      placeholder="Ex: Nova Regulação Criada"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={editedConfig.inAppMessage || ''}
                      onChange={(e) =>
                        setEditedConfig({ ...editedConfig, inAppMessage: e.target.value })
                      }
                      placeholder="Ex: Uma nova regulação foi criada para {{paciente_nome}}"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Variáveis disponíveis: {'{{paciente_nome}}'}, {'{{profissional_nome}}'}, {'{{status}}'}, etc.
                    </p>
                  </div>
                </div>
              )}

              {/* Template Email */}
              {editedConfig.sendEmail && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Configuração de Email
                  </h4>
                  <div className="space-y-2">
                    <Label>Assunto</Label>
                    <Input
                      value={editedConfig.emailSubject || ''}
                      onChange={(e) =>
                        setEditedConfig({ ...editedConfig, emailSubject: e.target.value })
                      }
                      placeholder="Ex: [Regula] Nova Regulação - {{paciente_nome}}"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Corpo do Email (HTML)</Label>
                    <Textarea
                      value={editedConfig.emailTemplate || ''}
                      onChange={(e) =>
                        setEditedConfig({ ...editedConfig, emailTemplate: e.target.value })
                      }
                      placeholder="<p>Olá {{profissional_nome}},</p><p>Uma nova regulação foi criada...</p>"
                      rows={5}
                    />
                  </div>
                </div>
              )}

              {/* Template WhatsApp */}
              {editedConfig.sendWhatsApp && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Configuração WhatsApp
                  </h4>
                  <div className="space-y-2">
                    <Label>Template de Mensagem</Label>
                    <Select
                      value={editedConfig.whatsappTemplateId?.toString() || ''}
                      onValueChange={(value) =>
                        setEditedConfig({
                          ...editedConfig,
                          whatsappTemplateId: value ? parseInt(value) : null,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {whatsappTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {whatsappTemplates.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum template de WhatsApp disponível. Crie um em WhatsApp Programado.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Template SMS */}
              {editedConfig.sendSMS && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> Configuração SMS
                  </h4>
                  <div className="space-y-2">
                    <Label>Mensagem SMS (máx. 160 caracteres)</Label>
                    <Textarea
                      value={editedConfig.smsTemplate || ''}
                      onChange={(e) =>
                        setEditedConfig({ ...editedConfig, smsTemplate: e.target.value })
                      }
                      placeholder="Ex: Regula: Sua regulação foi aprovada. Acesse o sistema para mais informações."
                      rows={2}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      {(editedConfig.smsTemplate || '').length}/160 caracteres
                    </p>
                  </div>
                </div>
              )}

              {/* Dias antes (para lembretes) */}
              {selectedEvent?.eventType.includes('REMINDER') && (
                <div className="space-y-2">
                  <Label>Dias de Antecedência</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editedConfig.reminderDaysBefore || ''}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        reminderDaysBefore: parseInt(e.target.value) || null,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Quantos dias antes do evento o lembrete será enviado
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEventConfig}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
