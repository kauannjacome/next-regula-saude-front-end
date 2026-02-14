'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared'
import { ScheduleForm } from '../components/schedule-form'
import { type ScheduleFormData } from '@/lib/validators'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

export default function NewSchedulePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: ScheduleFormData) => {
    setIsLoading(true)
    try {
      await apiClient.post('/schedules', data)
      toast.success('Agendamento criado com sucesso!')
      router.push('/schedules')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar agendamento')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Novo Agendamento"
        description="Crie um novo agendamento"
        backHref="/schedules"
      />
      <ScheduleForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
