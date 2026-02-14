'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader, FormSkeleton } from '@/components/shared';
import { FolderForm } from '../../components/folder-form';
import { type FolderFormData } from '@/lib/validators';
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'

export default function EditFolderPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [folder, setFolder] = useState<FolderFormData | null>(null)

  useEffect(() => {
    const fetchFolder = async () => {
      setIsFetching(true)
      try {
        const response = await apiClient.get(`/folders/${params.id}`)
        const data = response.data
        setFolder({
          name: data.name || '',
          description: data.description || '',
          color: data.color || '#3B82F6',
          responsibleId: data.responsibleId || '',
          startDate: data.startDate ? data.startDate.split('T')[0] : undefined,
          endDate: data.endDate ? data.endDate.split('T')[0] : undefined,
        })
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Pasta nao encontrada')
          router.push('/folders')
        } else {
          toast.error('Erro ao carregar pasta')
        }
      } finally {
        setIsFetching(false)
      }
    }
    fetchFolder()
  }, [params.id, router])

  const handleSubmit = async (data: FolderFormData) => {
    setIsLoading(true)
    try {
      await apiClient.put(`/folders/${params.id}`, data)
      toast.success('Pasta atualizada com sucesso!')
      router.push('/folders')
    } catch {
      toast.error('Erro ao atualizar pasta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Editar Pasta"
        description="Atualize os dados da pasta"
        backHref="/folders"
      />
      {isFetching ? (
        <FormSkeleton />
      ) : folder ? (
        <FolderForm
          defaultValues={folder}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Atualizar Pasta"
        />
      ) : (
        <p className="text-muted-foreground">Pasta nao encontrada</p>
      )}
    </div>
  )
}
