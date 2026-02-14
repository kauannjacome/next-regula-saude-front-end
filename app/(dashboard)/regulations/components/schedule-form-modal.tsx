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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { SCHEDULE_STATUSES, RECURRENCE_TYPES } from '@/lib/constants'

// Helpers para datas
const formatDateForInput = (date: Date) => date.toISOString().split('T')[0]

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

interface ScheduleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  regulationId: number
  regulationIds?: number[] // Para agendamento em lote
  citizenName?: string
  onSuccess?: () => void
}

export function ScheduleFormModal({
  open,
  onOpenChange,
  regulationId,
  regulationIds,
  citizenName,
  onSuccess,
}: ScheduleFormModalProps) {
  const { data: session } = useSession()

  // Estados do formulario
  const [status, setStatus] = useState('SCHEDULED')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduledEndDate, setScheduledEndDate] = useState('')
  const [scheduledEndTime, setScheduledEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [recurrenceType, setRecurrenceType] = useState('NONE')
  const [recurrenceInterval, setRecurrenceInterval] = useState('')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isBatchMode = regulationIds && regulationIds.length > 1
  const idsToSchedule = isBatchMode ? regulationIds : [regulationId]

  // Datas rápidas
  const quickDates = getQuickDates()


  // Resetar formulario quando abre com valores padrão
  useEffect(() => {
    if (open) {
      setStatus('SCHEDULED')
      setScheduledDate(quickDates.today) // Sugerir hoje
      setScheduledTime('08:00') // Horário padrão
      setScheduledEndDate('')
      setScheduledEndTime('')
      setNotes('')
      setRecurrenceType('NONE')
      setRecurrenceInterval('')
      setRecurrenceEndDate('')
      setErrors({})
    }
  }, [open, quickDates.today])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!scheduledDate) newErrors.scheduledDate = 'Data e obrigatoria'
    if (!scheduledTime) newErrors.scheduledTime = 'Hora e obrigatoria'

    const selectedDate = new Date(scheduledDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      newErrors.scheduledDate = 'Data nao pode ser anterior a hoje'
    }

    // Validar recorrencia
    if (recurrenceType !== 'NONE') {
      if (recurrenceType === 'CUSTOM' && !recurrenceInterval) {
        newErrors.recurrenceInterval = 'Intervalo e obrigatorio para recorrencia personalizada'
      }
      if (!recurrenceEndDate) {
        newErrors.recurrenceEndDate = 'Data final e obrigatoria para recorrencia'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsLoading(true)
    try {
      // Montar datetime
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`)
      let scheduledEndDateTime = null
      if (scheduledEndDate && scheduledEndTime) {
        scheduledEndDateTime = new Date(`${scheduledEndDate}T${scheduledEndTime}:00`)
      }

      // Criar agendamento para cada regulacao
      const promises = idsToSchedule.map(async (regId) => {
        const response = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            regulationId: regId,
            status,
            scheduledDate: scheduledDateTime.toISOString(),
            scheduledEndDate: scheduledEndDateTime?.toISOString() || null,
            notes: notes || null,
            recurrenceType,
            recurrenceInterval: recurrenceInterval ? parseInt(recurrenceInterval) : null,
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
            professionalId: session?.user?.id || null, // Usar o usuário logado automaticamente
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro ao criar agendamento')
        }

        return response.json()
      })

      await Promise.all(promises)

      toast.success(
        isBatchMode
          ? `${idsToSchedule.length} agendamentos criados com sucesso!`
          : 'Agendamento criado com sucesso!'
      )

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error)
      toast.error(error.message || 'Erro ao criar agendamento')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {isBatchMode ? 'Agendar Regulacoes em Lote' : 'Agendar Regulacao'}
          </DialogTitle>
          <DialogDescription>
            {isBatchMode
              ? `Criar agendamento para ${idsToSchedule.length} regulacoes selecionadas`
              : citizenName
              ? `Agendamento para ${citizenName}`
              : 'Preencha os dados do agendamento'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
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
                  setErrors({ ...errors, scheduledDate: '' })
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
                  setErrors({ ...errors, scheduledDate: '' })
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
                  setErrors({ ...errors, scheduledDate: '' })
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
                  setErrors({ ...errors, scheduledDate: '' })
                }}
              >
                +30 dias
              </Button>
            </div>
          </div>

          {/* Data e Hora de Inicio */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Data de Inicio <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value)
                  setErrors({ ...errors, scheduledDate: '' })
                }}
                min={quickDates.today}
                className={errors.scheduledDate ? 'border-destructive' : ''}
              />
              {errors.scheduledDate && (
                <p className="text-sm text-destructive">{errors.scheduledDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Hora de Inicio <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => {
                    setScheduledTime(e.target.value)
                    setErrors({ ...errors, scheduledTime: '' })
                  }}
                  className={errors.scheduledTime ? 'border-destructive flex-1' : 'flex-1'}
                />
                <Select value={scheduledTime} onValueChange={(val) => {
                  setScheduledTime(val)
                  setErrors({ ...errors, scheduledTime: '' })
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
              {errors.scheduledTime && (
                <p className="text-sm text-destructive">{errors.scheduledTime}</p>
              )}
            </div>
          </div>

          {/* Data e Hora de Fim (opcional) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data de Termino (opcional)</Label>
              <Input
                type="date"
                value={scheduledEndDate}
                onChange={(e) => setScheduledEndDate(e.target.value)}
                min={scheduledDate || new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Hora de Termino (opcional)</Label>
              <Input
                type="time"
                value={scheduledEndTime}
                onChange={(e) => setScheduledEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Recorrencia */}
          <div className="space-y-4 border-t pt-4">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recorrencia
            </Label>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Recorrencia</Label>
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
                  <Label>
                    Intervalo (dias) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={recurrenceInterval}
                    onChange={(e) => {
                      setRecurrenceInterval(e.target.value)
                      setErrors({ ...errors, recurrenceInterval: '' })
                    }}
                    placeholder="Ex: 7 para semanal"
                    className={errors.recurrenceInterval ? 'border-destructive' : ''}
                  />
                  {errors.recurrenceInterval && (
                    <p className="text-sm text-destructive">{errors.recurrenceInterval}</p>
                  )}
                </div>
              )}
            </div>

            {recurrenceType !== 'NONE' && (
              <div className="space-y-2">
                <Label>
                  Data Final da Recorrencia <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => {
                    setRecurrenceEndDate(e.target.value)
                    setErrors({ ...errors, recurrenceEndDate: '' })
                  }}
                  min={scheduledDate || new Date().toISOString().split('T')[0]}
                  className={errors.recurrenceEndDate ? 'border-destructive' : ''}
                />
                {errors.recurrenceEndDate && (
                  <p className="text-sm text-destructive">{errors.recurrenceEndDate}</p>
                )}
              </div>
            )}
          </div>

          {/* Observacoes */}
          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea
              placeholder="Observacoes sobre o agendamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isBatchMode ? 'Agendando...' : 'Agendando...'}
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                {isBatchMode ? `Agendar ${idsToSchedule.length} Regulacoes` : 'Agendar'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
