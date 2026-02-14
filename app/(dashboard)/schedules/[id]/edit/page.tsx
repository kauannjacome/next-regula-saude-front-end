'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared';
import { ScheduleForm } from '../../components/schedule-form';
import { type ScheduleFormData } from '@/lib/validators';
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'

export default function EditSchedulePage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [schedule, setSchedule] = useState<ScheduleFormData | null>(null)

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsFetching(true)
      try {
        const response = await apiClient.get(`/schedules/${params.id}`)
        const data = response.data
        setSchedule({
          professionalId: data.professionalId || undefined,
          regulationId: data.regulationId,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate).toISOString().slice(0, 16) : '',
          scheduledEndDate: data.scheduledEndDate ? new Date(data.scheduledEndDate).toISOString().slice(0, 16) : undefined,
          notes: data.notes || undefined,
          status: data.status,
          recurrenceType: data.recurrenceType,
          recurrenceInterval: data.recurrenceInterval || undefined,
          recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate).toISOString().slice(0, 10) : undefined,
        })
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Agendamento não encontrado')
          router.push('/schedules')
        } else {
          toast.error('Erro ao carregar dados do agendamento')
        }
      } finally {
        setIsFetching(false)
      }
    }
    fetchSchedule()
  }, [params.id, router])

  const handleSubmit = async (data: ScheduleFormData) => {
    setIsLoading(true)
    try {
      await apiClient.put(`/schedules/${params.id}`, data)
      toast.success('Agendamento atualizado com sucesso!')
      router.push('/schedules')
    } catch {
      toast.error('Erro ao atualizar agendamento')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Editar Agendamento"
        description="Atualize os dados do agendamento"
        backHref="/schedules"
      />
      {isFetching ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : schedule ? (
        <ScheduleForm
          defaultValues={schedule}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Atualizar Agendamento"
        />
      ) : (
        <p className="text-muted-foreground">Agendamento não encontrado</p>
      )}
    </div>
  )
}
