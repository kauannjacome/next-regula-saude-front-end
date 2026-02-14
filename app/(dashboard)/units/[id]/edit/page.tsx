'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader, FormSkeleton } from '@/components/shared';
import { UnitForm } from '../../components/unit-form';
import { type UnitFormData } from '@/lib/validators';
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'

export default function EditUnitPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [unit, setUnit] = useState<UnitFormData | null>(null)

  useEffect(() => {
    const fetchUnit = async () => {
      setIsFetching(true)
      try {
        const response = await apiClient.get(`/units/${params.id}`)
        const data = response.data
        setUnit({
          name: data.name || '',
          type: data.type || '',
          cnes: data.cnes || '',
          phone: data.phone || '',
          email: data.email || '',
          address: {
            cep: data.postalCode || data.address?.cep || '',
            logradouro: data.address?.logradouro || '',
            numero: data.number || data.address?.numero || '',
            bairro: data.neighborhood || data.address?.bairro || '',
            cidade: data.city || data.address?.cidade || '',
            estado: data.state || data.address?.estado || '',
          },
        } as any)
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Unidade nao encontrada')
          router.push('/units')
        } else {
          toast.error('Erro ao carregar dados da unidade')
        }
      } finally {
        setIsFetching(false)
      }
    }
    fetchUnit()
  }, [params.id, router])

  const handleSubmit = async (data: UnitFormData) => {
    setIsLoading(true)
    try {
      await apiClient.put(`/units/${params.id}`, {
        name: data.name,
        type: data.type,
        cnes: data.cnes,
        phone: data.phone,
        email: data.email,
        address: data.address,
        operatingHours: (data as any).operatingHours,
      })
      toast.success('Unidade atualizada com sucesso!')
      router.push('/units')
    } catch {
      toast.error('Erro ao atualizar unidade')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Editar Unidade"
        description="Atualize os dados da unidade de saude"
        backHref="/units"
      />
      {isFetching ? (
        <FormSkeleton />
      ) : unit ? (
        <UnitForm
          defaultValues={unit}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Atualizar Unidade"
        />
      ) : (
        <p className="text-muted-foreground">Unidade nao encontrada</p>
      )}
    </div>
  )
}
