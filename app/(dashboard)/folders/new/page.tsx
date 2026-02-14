'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared';
import { FolderForm } from '../components/folder-form';
import { type FolderFormData } from '@/lib/validators';
import { toast } from 'sonner';

export default function NewFolderPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: FolderFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar pasta')
      }
      toast.success('Pasta criada com sucesso!')
      router.push('/folders')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar pasta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Nova Pasta"
        description="Crie uma nova pasta para organizar regulações"
        backHref="/folders"
      />
      <FolderForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
