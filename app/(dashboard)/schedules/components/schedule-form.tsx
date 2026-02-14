'use client'

import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { scheduleSchema, type ScheduleFormData } from '@/lib/validators'
import { SCHEDULE_STATUSES, RECURRENCE_TYPES } from '@/lib/constants'
import { Loader2 } from 'lucide-react'
import apiClient from '@/lib/api/api-client'

interface ScheduleFormProps {
  defaultValues?: Partial<ScheduleFormData>
  onSubmit: (data: ScheduleFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

type RegulationOption = {
  id: number
  idCode?: string | null
  citizen?: { id: number; name: string; cpf: string }
  cares?: { care: { id: number; name: string; acronym?: string | null } }[]
}

export function ScheduleForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Salvar Agendamento'
}: ScheduleFormProps) {
  const [regulations, setRegulations] = useState<RegulationOption[]>([])
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([])

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema) as any,
    defaultValues: defaultValues || {
      status: 'SCHEDULED',
      recurrenceType: 'NONE',
    }
  })

  const recurrenceType = useWatch({ control, name: 'recurrenceType' })
  const status = useWatch({ control, name: 'status' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regulationsRes, professionalsRes] = await Promise.all([
          apiClient.get('/regulations?limit=200'),
          apiClient.get('/users'),
        ])
        setRegulations(regulationsRes.data?.data || regulationsRes.data || [])
        setProfessionals(professionalsRes.data?.data || professionalsRes.data || [])
      } catch (error) {
        console.error('Error fetching form data:', error)
      }
    }
    fetchData()
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Dados do Agendamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Regulação *</Label>
              <Select
                onValueChange={(value) => setValue('regulationId', parseInt(value))}
                defaultValue={defaultValues?.regulationId?.toString()}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a regulação" /></SelectTrigger>
                <SelectContent>
                  {regulations.map((r) => {
                    const citizenName = r.citizen?.name || 'Sem cidadão'
                    const careNames = (r.cares || []).map((c) => c.care?.name).filter(Boolean)
                    const careLabel = careNames.length ? ` - ${careNames.join(', ')}` : ''
                    const codeLabel = r.idCode ? `${r.idCode} - ` : ''
                    return (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {codeLabel}{citizenName}{careLabel}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {errors.regulationId && <p className="text-sm text-destructive">{errors.regulationId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select
                onValueChange={(value) => setValue('professionalId', value)}
                defaultValue={defaultValues?.professionalId}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
                <SelectContent>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Data/Hora *</Label>
              <Input type="datetime-local" {...register('scheduledDate')} />
              {errors.scheduledDate && <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Data/Hora Fim</Label>
              <Input type="datetime-local" {...register('scheduledEndDate')} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={(value) => setValue('status', value as any)}
                defaultValue={defaultValues?.status || 'SCHEDULED'}
              >
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {SCHEDULE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campo de motivo para cancelamento */}
          {status === 'CANCELED' && (
            <div className="space-y-2">
              <Label>Motivo do Cancelamento <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Descreva o motivo do cancelamento..."
                rows={3}
                {...register('cancellationReason')}
              />
              {errors.cancellationReason && <p className="text-sm text-destructive">{errors.cancellationReason.message}</p>}
            </div>
          )}

          {/* Campo de motivo para falta */}
          {status === 'NO_SHOW' && (
            <div className="space-y-2">
              <Label>Motivo da Falta <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Descreva o motivo da falta..."
                rows={3}
                {...register('noShowReason')}
              />
              {errors.noShowReason && <p className="text-sm text-destructive">{errors.noShowReason.message}</p>}
            </div>
          )}

        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recorrência</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de Recorrência</Label>
              <Select
                onValueChange={(value) => setValue('recurrenceType', value as any)}
                defaultValue={defaultValues?.recurrenceType || 'NONE'}
              >
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {recurrenceType && recurrenceType !== 'NONE' && (
              <>
                <div className="space-y-2">
                  <Label>Intervalo</Label>
                  <Input
                    type="number"
                    min={1}
                    {...register('recurrenceInterval', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim da Recorrência</Label>
                  <Input type="date" {...register('recurrenceEndDate')} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            placeholder="Observações sobre o agendamento..."
            rows={4}
            {...register('notes')}
          />
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : submitLabel}
      </Button>
    </form>
  )
}
