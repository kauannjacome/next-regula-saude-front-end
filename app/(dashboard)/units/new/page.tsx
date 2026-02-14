'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared';
import { UnitForm } from '../components/unit-form';
import { type UnitFormData } from '@/lib/validators';
import { toast } from 'sonner';

export default function NewUnitPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: UnitFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Erro ao cadastrar unidade')
      toast.success('Unidade cadastrada com sucesso!')
      router.push('/units')
    } catch {
      toast.error('Erro ao cadastrar unidade')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Nova Unidade"
        description="Cadastre uma nova unidade de saúde"
        backHref="/units"
      />
      <UnitForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
