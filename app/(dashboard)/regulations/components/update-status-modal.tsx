// ==========================================
// MODAL: ATUALIZAR STATUS DA REGULAÇÃO
// ==========================================
// Modal para alterar o status de uma regulação
// Permite selecionar template de WhatsApp quando ativo
// Quando status = SCHEDULED, mostra campos de agendamento

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, MessageCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react'
import { SCHEDULE_STATUSES, RECURRENCE_TYPES } from '@/lib/constants'
import { toast } from 'sonner'

// Interface para templates do banco
interface DbTemplate {
  id: number
  name: string
  bodyText: string
  headerText?: string | null
  footerText?: string | null
  isActive?: boolean
}

// Helpers para datas
const formatDateForInput = (date: Date) => date.toISOString().split('T')[0]
const formatTimeForInput = (date: Date) => date.toTimeString().slice(0, 5)

const getQuickDates = () => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextMonth = new Date(today)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  return {
    today: formatDateForInput(today),
    tomorrow: formatDateForInput(tomorrow),
    nextWeek: formatDateForInput(nextWeek),
    nextMonth: formatDateForInput(nextMonth),
  }
}

interface Regulation {
  id: string | number
  citizen: {
    name: string
    cpf?: string
    phone?: string
  } | null
  status: string | null
}

interface StatusChangeData {
  denialReason?: string
  returnReason?: string
  cancellationReason?: string
}

interface UpdateStatusModalProps {
  open: boolean
  onClose: () => void
  regulation: Regulation
  onStatusChange: (regulationId: string | number, newStatus: string, sendWhatsapp: boolean, whatsappTemplateId?: string, reasonData?: StatusChangeData) => Promise<void>
}

// Tipo para triggers de WhatsApp
type WhatsAppTriggerType =
  | 'STATUS_APPROVED'
  | 'STATUS_DENIED'
  | 'STATUS_PENDING'
  | 'STATUS_IN_ANALYSIS'
  | 'STATUS_RETURNED'
  | 'STATUS_SCHEDULED'

// CONFIGURAÇÃO DE STATUS (usa enum do banco: IN_PROGRESS, APPROVED, DENIED, RETURNED, SCHEDULED, CANCELLED)
const statusOptions = [
  { value: 'IN_PROGRESS', label: 'Em Análise' },
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'DENIED', label: 'Negado', requiresReason: true },
  { value: 'RETURNED', label: 'Devolvido', requiresReason: true },
  { value: 'CANCELLED', label: 'Cancelado', requiresReason: true },
]

// Status que requerem motivo obrigatório
const STATUS_REQUIRING_REASON = ['DENIED', 'RETURNED', 'CANCELLED']

// Mapear status do banco para trigger do WhatsApp
const statusToTriggerMap: Record<string, WhatsAppTriggerType> = {
  'IN_PROGRESS': 'STATUS_IN_ANALYSIS',
  'APPROVED': 'STATUS_APPROVED',
  'DENIED': 'STATUS_DENIED',
  'RETURNED': 'STATUS_RETURNED',
  'SCHEDULED': 'STATUS_SCHEDULED',
  'PENDING': 'STATUS_PENDING',
}

export function UpdateStatusModal({
  open,
  onClose,
  regulation,
  onStatusChange,
}: UpdateStatusModalProps) {
  const { data: session } = useSession()
  const [selectedStatus, setSelectedStatus] = useState(regulation.status || 'IN_PROGRESS')
  const [isLoading, setIsLoading] = useState(false)
  const [sendWhatsapp, setSendWhatsapp] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [templates, setTemplates] = useState<DbTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [whatsappStatus, setWhatsappStatus] = useState<{
    isConnected: boolean
    loading: boolean
  }>({ isConnected: false, loading: true })

  // Estados para motivos obrigatórios (quando status = DENIED, RETURNED, CANCELLED)
  const [denialReason, setDenialReason] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  // Estados do agendamento (quando status = SCHEDULED)
  const [scheduleStatus, setScheduleStatus] = useState('SCHEDULED')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduledEndDate, setScheduledEndDate] = useState('')
  const [scheduledEndTime, setScheduledEndTime] = useState('')
  const [scheduleNotes, setScheduleNotes] = useState('')
  const [recurrenceType, setRecurrenceType] = useState('NONE')
  const [recurrenceInterval, setRecurrenceInterval] = useState('')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [parentScheduleId, setParentScheduleId] = useState<string>('none')
  const [existingSchedules, setExistingSchedules] = useState<{ id: number; scheduledDate: string; status: string }[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [scheduleTemplateActive, setScheduleTemplateActive] = useState<boolean | null>(null)
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({})

  // Datas rápidas
  const quickDates = getQuickDates()

  // Verificar status do WhatsApp ao abrir o modal
  useEffect(() => {
    if (open) {
      // Resetar campos de motivo
      setDenialReason('')
      setReturnReason('')
      setCancellationReason('')
      setReasonError('')
      // Resetar campos de agendamento com valores padrão
      setScheduleStatus('SCHEDULED')
      setScheduledDate(quickDates.today) // Sugerir hoje
      setScheduledTime('08:00') // Horário padrão
      setScheduledEndDate('')
      setScheduledEndTime('')
      setScheduleNotes('')
      setRecurrenceType('NONE')
      setRecurrenceInterval('')
      setRecurrenceEndDate('')
      setParentScheduleId('')
      setScheduleErrors({})
      // Buscar dados iniciais em paralelo
      Promise.all([
        checkWhatsappStatus(),
        fetchExistingSchedules(),
        checkScheduleTemplateActive(),
      ])
    }
  }, [open, quickDates.today])

  // Buscar agendamentos existentes da regulação
  const fetchExistingSchedules = async () => {
    setLoadingSchedules(true)
    try {
      const response = await fetch(`/api/regulations/${regulation.id}/schedules`)
      if (response.ok) {
        const data = await response.json()
        setExistingSchedules(data.schedules || [])
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
    } finally {
      setLoadingSchedules(false)
    }
  }

  // Verificar se template de agendamento está ativo
  const checkScheduleTemplateActive = async () => {
    try {
      const response = await fetch('/api/whatsapp/templates-by-trigger?trigger=SCHEDULE_REMINDER_24H')
      if (response.ok) {
        const data = await response.json()
        const templates = data.templates || []
        setScheduleTemplateActive(templates.length > 0)
      } else {
        setScheduleTemplateActive(false)
      }
    } catch (error) {
      console.error('Erro ao verificar template:', error)
      setScheduleTemplateActive(false)
    }
  }

  // Buscar templates do banco quando status mudar
  useEffect(() => {
    const trigger = statusToTriggerMap[selectedStatus]
    if (!trigger) {
      setTemplates([])
      setSelectedTemplateId('')
      return
    }

    const fetchTemplates = async () => {
      setLoadingTemplates(true)
      try {
        // Buscar templates do banco via API
        const response = await fetch(`/api/whatsapp/templates-by-trigger?trigger=${trigger}`)
        if (response.ok) {
          const data = await response.json()
          const availableTemplates = data.templates || []
          setTemplates(availableTemplates)
          if (availableTemplates.length > 0) {
            setSelectedTemplateId(String(availableTemplates[0].id))
          } else {
            setSelectedTemplateId('')
          }
        } else {
          setTemplates([])
          setSelectedTemplateId('')
        }
      } catch (error) {
        console.error('Erro ao buscar templates:', error)
        setTemplates([])
        setSelectedTemplateId('')
      } finally {
        setLoadingTemplates(false)
      }
    }

    fetchTemplates()
  }, [selectedStatus])

  const checkWhatsappStatus = async () => {
    setWhatsappStatus({ isConnected: false, loading: true })
    try {
      const res = await fetch('/api/whatsapp/test')

      // Verificar se a resposta é JSON antes de parsear
      const contentType = res.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        console.warn('[WhatsApp] Resposta não é JSON:', contentType)
        setWhatsappStatus({ isConnected: false, loading: false })
        return
      }

      if (res.ok) {
        const data = await res.json()
        setWhatsappStatus({
          isConnected: data.evolutionApi?.isConnected || false,
          loading: false
        })
        // Se conectado e cidadão tem telefone, ativar por padrão
        if (data.evolutionApi?.isConnected && regulation.citizen?.phone) {
          setSendWhatsapp(true)
        }
      } else {
        setWhatsappStatus({ isConnected: false, loading: false })
      }
    } catch (error) {
      console.error('Erro ao verificar WhatsApp:', error)
      setWhatsappStatus({ isConnected: false, loading: false })
    }
  }

  // Validar campos de agendamento
  const validateSchedule = () => {
    const errors: Record<string, string> = {}
    if (!scheduledDate) errors.scheduledDate = 'Data é obrigatória'
    if (!scheduledTime) errors.scheduledTime = 'Hora é obrigatória'

    const selectedDateObj = new Date(scheduledDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDateObj < today) {
      errors.scheduledDate = 'Data não pode ser anterior a hoje'
    }

    if (recurrenceType !== 'NONE') {
      if (recurrenceType === 'CUSTOM' && !recurrenceInterval) {
        errors.recurrenceInterval = 'Intervalo é obrigatório'
      }
      if (!recurrenceEndDate) {
        errors.recurrenceEndDate = 'Data final é obrigatória'
      }
    }

    setScheduleErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Validar motivo obrigatório
  const validateReason = () => {
    if (selectedStatus === 'DENIED' && !denialReason.trim()) {
      setReasonError('Motivo da negação é obrigatório')
      return false
    }
    if (selectedStatus === 'RETURNED' && !returnReason.trim()) {
      setReasonError('Motivo da devolução é obrigatório')
      return false
    }
    if (selectedStatus === 'CANCELLED' && !cancellationReason.trim()) {
      setReasonError('Motivo do cancelamento é obrigatório')
      return false
    }
    setReasonError('')
    return true
  }

  // Obter motivo atual baseado no status
  const getCurrentReason = () => {
    if (selectedStatus === 'DENIED') return denialReason
    if (selectedStatus === 'RETURNED') return returnReason
    if (selectedStatus === 'CANCELLED') return cancellationReason
    return undefined
  }

  const handleSubmit = async () => {
    // Validar motivo se status requer
    if (STATUS_REQUIRING_REASON.includes(selectedStatus)) {
      if (!validateReason()) return
    }

    // Se status = SCHEDULED, validar campos de agendamento
    if (selectedStatus === 'SCHEDULED') {
      if (!validateSchedule()) return
    }

    setIsLoading(true)
    try {
      // Se status = SCHEDULED, criar agendamento primeiro
      if (selectedStatus === 'SCHEDULED') {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`)
        let scheduledEndDateTime = null
        if (scheduledEndDate && scheduledEndTime) {
          scheduledEndDateTime = new Date(`${scheduledEndDate}T${scheduledEndTime}:00`)
        }

        const scheduleResponse = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            regulationId: Number(regulation.id),
            status: scheduleStatus,
            scheduledDate: scheduledDateTime.toISOString(),
            scheduledEndDate: scheduledEndDateTime?.toISOString() || null,
            notes: scheduleNotes || null,
            recurrenceType,
            recurrenceInterval: recurrenceInterval ? parseInt(recurrenceInterval) : null,
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
            parentScheduleId: parentScheduleId && parentScheduleId !== 'none' ? parseInt(parentScheduleId) : null,
            professionalId: session?.user?.id || null, // Usar o usuário logado automaticamente
          }),
        })

        if (!scheduleResponse.ok) {
          const data = await scheduleResponse.json()
          throw new Error(data.error || 'Erro ao criar agendamento')
        }

        toast.success('Agendamento criado com sucesso!')
      }

      // Preparar dados de motivo se necessário
      const reasonData: StatusChangeData = {}
      if (selectedStatus === 'DENIED') reasonData.denialReason = denialReason
      if (selectedStatus === 'RETURNED') reasonData.returnReason = returnReason
      if (selectedStatus === 'CANCELLED') reasonData.cancellationReason = cancellationReason

      // Atualizar status da regulação
      await onStatusChange(
        regulation.id,
        selectedStatus,
        sendWhatsapp && whatsappStatus.isConnected,
        sendWhatsapp ? selectedTemplateId : undefined,
        STATUS_REQUIRING_REASON.includes(selectedStatus) ? reasonData : undefined
      )
      onClose()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error(error.message || 'Erro ao atualizar')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTemplate = templates.find(t => String(t.id) === selectedTemplateId)

  // Formatar preview do template - suporta ambos os formatos: {{nome_cidadao}} e {{paciente.nome}}
  const formatPreview = (template: DbTemplate) => {
    let text = template.bodyText

    // Dados reais disponíveis
    const citizenName = regulation.citizen?.name || '[Nome do Cidadão]'
    const citizenPhone = regulation.citizen?.phone || '[Telefone]'
    const protocolNumber = 'REG-' + regulation.id

    // Dados de agendamento (se status = SCHEDULED e campos preenchidos)
    const scheduleDate = scheduledDate
      ? new Date(scheduledDate).toLocaleDateString('pt-BR')
      : '[Data do agendamento]'
    const scheduleTime = scheduledTime || '[Horário]'

    // Mapeamento de variáveis para valores
    const variables: Record<string, string> = {
      // Formato underscore
      'nome_cidadao': citizenName,
      'telefone_cidadao': citizenPhone,
      'numero_protocolo': protocolNumber,
      'protocolo': protocolNumber,
      'cuidados': '[Cuidados serão preenchidos]',
      'lista_cuidados': '[Lista de cuidados]',
      'procedimentos': '[Procedimentos]',
      'tipo_atendimento': '[Tipo de atendimento]',
      'procedimento': '[Procedimento]',
      'especialidade': '[Especialidade]',
      'nome_municipio': '[Nome do município]',
      'nome_unidade': '[Unidade de Saúde]',
      'unidade_saude': '[Unidade de Saúde]',
      'telefone_unidade': '[Telefone da unidade]',
      'prioridade': '[Prioridade]',
      'observacao': scheduleNotes || '[Observações]',
      'motivo': scheduleNotes || '[Motivo]',
      'notas': scheduleNotes || '[Notas]',
      'indicacao_clinica': '[Indicação clínica]',
      'data_agendamento': scheduleDate,
      'hora_agendamento': scheduleTime,
      'local_agendamento': '[Local do atendimento]',
      'endereco': '[Endereço]',
      'nome_profissional': session?.user?.name || '[Profissional]',
      'profissional': session?.user?.name || '[Profissional]',
      'status': selectedStatus,
      // Formato com ponto (paciente.nome, etc)
      'paciente.nome': citizenName,
      'paciente.telefone': citizenPhone,
      'paciente.cpf': regulation.citizen?.cpf || '[CPF]',
      'agendamento.data': scheduleDate,
      'agendamento.hora': scheduleTime,
      'regulacao.protocolo': protocolNumber,
      'regulacao.status': selectedStatus,
    }

    // Substituir todas as variáveis (suporta ambos os formatos)
    for (const [key, value] of Object.entries(variables)) {
      // Escapar caracteres especiais do regex (o ponto precisa ser escapado)
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      text = text.replace(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g'), value)
    }

    // Remover variáveis não substituídas (limpar o preview)
    text = text.replace(/\{\{[^}]+\}\}/g, '[...]')

    return text
  }

  const citizenHasPhone = !!regulation.citizen?.phone

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alterar Status</DialogTitle>
          <DialogDescription>
            Regulação de {regulation.citizen?.name || 'Cidadão'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção de Status */}
          <div className="space-y-3">
            <Label>Selecione o novo status</Label>
            <RadioGroup value={selectedStatus} onValueChange={setSelectedStatus}>
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="cursor-pointer font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Campo de Motivo (quando status = DENIED, RETURNED ou CANCELLED) */}
          {STATUS_REQUIRING_REASON.includes(selectedStatus) && (
            <div className="border-t pt-4 space-y-3">
              <Label className="font-medium">
                {selectedStatus === 'DENIED' && 'Motivo da Negação'}
                {selectedStatus === 'RETURNED' && 'Motivo da Devolução'}
                {selectedStatus === 'CANCELLED' && 'Motivo do Cancelamento'}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                placeholder={
                  selectedStatus === 'DENIED'
                    ? 'Descreva o motivo da negação...'
                    : selectedStatus === 'RETURNED'
                    ? 'Descreva o motivo da devolução...'
                    : 'Descreva o motivo do cancelamento...'
                }
                value={
                  selectedStatus === 'DENIED'
                    ? denialReason
                    : selectedStatus === 'RETURNED'
                    ? returnReason
                    : cancellationReason
                }
                onChange={(e) => {
                  setReasonError('')
                  if (selectedStatus === 'DENIED') setDenialReason(e.target.value)
                  else if (selectedStatus === 'RETURNED') setReturnReason(e.target.value)
                  else setCancellationReason(e.target.value)
                }}
                rows={3}
                className={reasonError ? 'border-destructive' : ''}
              />
              {reasonError && (
                <p className="text-sm text-destructive">{reasonError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Este motivo será registrado no histórico da regulação.
              </p>
            </div>
          )}

          {/* Campos de Agendamento (quando status = SCHEDULED) */}
          {selectedStatus === 'SCHEDULED' && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Calendar className="h-5 w-5" />
                <Label className="font-medium text-base">Dados do Agendamento</Label>
              </div>

              {/* Status do Agendamento */}
              <div className="space-y-2">
                <Label>Status do Agendamento</Label>
                <Select value={scheduleStatus} onValueChange={setScheduleStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botões rápidos de data */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Sugestões de data</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={scheduledDate === quickDates.today ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setScheduledDate(quickDates.today)
                      setScheduleErrors({ ...scheduleErrors, scheduledDate: '' })
                    }}
                  >
                    Hoje
                  </Button>
                  <Button
                    type="button"
                    variant={scheduledDate === quickDates.tomorrow ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setScheduledDate(quickDates.tomorrow)
                      setScheduleErrors({ ...scheduleErrors, scheduledDate: '' })
                    }}
                  >
                    Amanhã
                  </Button>
                  <Button
                    type="button"
                    variant={scheduledDate === quickDates.nextWeek ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setScheduledDate(quickDates.nextWeek)
                      setScheduleErrors({ ...scheduleErrors, scheduledDate: '' })
                    }}
                  >
                    +7 dias
                  </Button>
                  <Button
                    type="button"
                    variant={scheduledDate === quickDates.nextMonth ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setScheduledDate(quickDates.nextMonth)
                      setScheduleErrors({ ...scheduleErrors, scheduledDate: '' })
                    }}
                  >
                    +30 dias
                  </Button>
                </div>
              </div>

              {/* Data e Hora de Início */}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Data <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => {
                      setScheduledDate(e.target.value)
                      setScheduleErrors({ ...scheduleErrors, scheduledDate: '' })
                    }}
                    min={quickDates.today}
                    className={scheduleErrors.scheduledDate ? 'border-destructive' : ''}
                  />
                  {scheduleErrors.scheduledDate && (
                    <p className="text-xs text-destructive">{scheduleErrors.scheduledDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Hora <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => {
                        setScheduledTime(e.target.value)
                        setScheduleErrors({ ...scheduleErrors, scheduledTime: '' })
                      }}
                      className={scheduleErrors.scheduledTime ? 'border-destructive flex-1' : 'flex-1'}
                    />
                    <Select value={scheduledTime} onValueChange={(val) => {
                      setScheduledTime(val)
                      setScheduleErrors({ ...scheduleErrors, scheduledTime: '' })
                    }}>
                      <SelectTrigger className="w-[90px]">
                        <SelectValue placeholder="Rápido" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="07:00">07:00</SelectItem>
                        <SelectItem value="08:00">08:00</SelectItem>
                        <SelectItem value="09:00">09:00</SelectItem>
                        <SelectItem value="10:00">10:00</SelectItem>
                        <SelectItem value="11:00">11:00</SelectItem>
                        <SelectItem value="13:00">13:00</SelectItem>
                        <SelectItem value="14:00">14:00</SelectItem>
                        <SelectItem value="15:00">15:00</SelectItem>
                        <SelectItem value="16:00">16:00</SelectItem>
                        <SelectItem value="17:00">17:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {scheduleErrors.scheduledTime && (
                    <p className="text-xs text-destructive">{scheduleErrors.scheduledTime}</p>
                  )}
                </div>
              </div>

              {/* Data e Hora de Término (opcional) */}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Data Término (opcional)</Label>
                  <Input
                    type="date"
                    value={scheduledEndDate}
                    onChange={(e) => setScheduledEndDate(e.target.value)}
                    min={scheduledDate || new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hora Término (opcional)</Label>
                  <Input
                    type="time"
                    value={scheduledEndTime}
                    onChange={(e) => setScheduledEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Recorrência */}
              <div className="space-y-3 border-t pt-3">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recorrência
                </Label>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_TYPES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {recurrenceType === 'CUSTOM' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Intervalo (dias) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={recurrenceInterval}
                        onChange={(e) => {
                          setRecurrenceInterval(e.target.value)
                          setScheduleErrors({ ...scheduleErrors, recurrenceInterval: '' })
                        }}
                        placeholder="Ex: 7"
                        className={scheduleErrors.recurrenceInterval ? 'border-destructive' : ''}
                      />
                      {scheduleErrors.recurrenceInterval && (
                        <p className="text-xs text-destructive">{scheduleErrors.recurrenceInterval}</p>
                      )}
                    </div>
                  )}
                </div>

                {recurrenceType !== 'NONE' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Data Final da Recorrência <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => {
                        setRecurrenceEndDate(e.target.value)
                        setScheduleErrors({ ...scheduleErrors, recurrenceEndDate: '' })
                      }}
                      min={scheduledDate || new Date().toISOString().split('T')[0]}
                      className={scheduleErrors.recurrenceEndDate ? 'border-destructive' : ''}
                    />
                    {scheduleErrors.recurrenceEndDate && (
                      <p className="text-xs text-destructive">{scheduleErrors.recurrenceEndDate}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Agendamento Pai (para reagendamentos) */}
              {existingSchedules.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Reagendar a partir de</Label>
                  <Select value={parentScheduleId} onValueChange={setParentScheduleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Novo agendamento (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Novo agendamento</SelectItem>
                      {existingSchedules.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {new Date(s.scheduledDate).toLocaleDateString('pt-BR')} - {s.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações sobre o agendamento..."
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Aviso sobre template WhatsApp */}
              {scheduleTemplateActive === false && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Aviso:</strong> Nenhum template de WhatsApp para agendamento está configurado.
                    A notificação automática não será enviada.
                    Configure em WhatsApp → Meus Templates.
                  </p>
                </div>
              )}
              {scheduleTemplateActive === true && whatsappStatus.isConnected && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Notificação de agendamento será enviada via WhatsApp.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Seção WhatsApp */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <Label className="font-medium">Notificar via WhatsApp</Label>
              </div>

              {whatsappStatus.loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </div>
              ) : whatsappStatus.isConnected ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Conectado
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <XCircle className="h-4 w-4" />
                  Desconectado
                </div>
              )}
            </div>

            {/* Switch para ativar/desativar envio */}
            {whatsappStatus.isConnected && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="send-whatsapp">Enviar mensagem</Label>
                    <p className="text-xs text-muted-foreground">
                      {citizenHasPhone
                        ? `Telefone: ${regulation.citizen?.phone}`
                        : 'Cidadão não possui telefone cadastrado'
                      }
                    </p>
                  </div>
                  <Switch
                    id="send-whatsapp"
                    checked={sendWhatsapp}
                    onCheckedChange={setSendWhatsapp}
                    disabled={!citizenHasPhone}
                  />
                </div>

                {/* Seleção de Template */}
                {sendWhatsapp && citizenHasPhone && loadingTemplates && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando templates...
                  </div>
                )}
                {sendWhatsapp && citizenHasPhone && !loadingTemplates && templates.length > 0 && (
                  <div className="space-y-3">
                    <Label>Template da mensagem</Label>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={String(template.id)}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Preview do Template */}
                    {selectedTemplate && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          {showPreview ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Ocultar preview
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Ver preview da mensagem
                            </>
                          )}
                        </button>

                        {showPreview && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                            <p className="text-xs text-green-700 font-medium mb-2">
                              Preview (variáveis serão substituídas):
                            </p>
                            <pre className="whitespace-pre-wrap text-green-900 font-sans text-xs">
                              {formatPreview(selectedTemplate)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {sendWhatsapp && citizenHasPhone && !loadingTemplates && templates.length === 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Nenhum template configurado para este status.
                      Crie um template em WhatsApp → Meus Templates para habilitar notificações.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!whatsappStatus.isConnected && !whatsappStatus.loading && (
              <p className="text-sm text-muted-foreground">
                Configure o WhatsApp em Administração para enviar notificações.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || selectedStatus === regulation.status}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {selectedStatus === 'SCHEDULED' ? 'Agendando...' : 'Atualizando...'}
              </>
            ) : selectedStatus === 'SCHEDULED' ? (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Criar Agendamento
              </>
            ) : sendWhatsapp && whatsappStatus.isConnected ? (
              <>
                <MessageCircle className="mr-2 h-4 w-4" />
                Atualizar e Enviar
              </>
            ) : (
              'Atualizar Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
