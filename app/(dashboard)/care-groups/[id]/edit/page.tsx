'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader, FormSkeleton } from '@/components/shared';
import { CareGroupForm } from '../../components/care-group-form';
import { type CareGroupFormData } from '@/lib/validators';
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'

export default function EditCareGroupPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [careGroup, setCareGroup] = useState<CareGroupFormData | null>(null)

  useEffect(() => {
    const fetchCareGroup = async () => {
      setIsFetching(true)
      try {
        const response = await apiClient.get(`/groups/${params.id}`)
        const data = response.data
        setCareGroup({
          name: data.name || '',
          description: data.description || '',
        })
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Grupo nao encontrado')
          router.push('/care-groups')
        } else {
          toast.error('Erro ao carregar grupo')
        }
      } finally {
        setIsFetching(false)
      }
    }
    fetchCareGroup()
  }, [params.id, router])

  const handleSubmit = async (data: CareGroupFormData) => {
    setIsLoading(true)
    try {
      await apiClient.put(`/groups/${params.id}`, data)
      toast.success('Grupo atualizado com sucesso!')
      router.push('/care-groups')
    } catch {
      toast.error('Erro ao atualizar grupo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Editar Grupo"
        description="Atualize os dados do grupo de atendimento"
        backHref="/care-groups"
      />
      {isFetching ? (
        <FormSkeleton />
      ) : careGroup ? (
        <CareGroupForm
          defaultValues={careGroup}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Atualizar Grupo"
        />
      ) : (
        <p className="text-muted-foreground">Grupo nao encontrado</p>
      )}
    </div>
  )
}
