'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader, FormSkeleton } from '@/components/shared';
import { SupplierForm } from '../../components/supplier-form';
import { type SupplierFormData } from '@/lib/validators';
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'

export default function EditSupplierPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [supplier, setSupplier] = useState<SupplierFormData | null>(null)

  useEffect(() => {
    const fetchSupplier = async () => {
      setIsFetching(true)
      try {
        const response = await apiClient.get(`/suppliers/${params.id}`)
        const data = response.data
        setSupplier({
          razaoSocial: data.name || '',
          nomeFantasia: data.tradeName || '',
          cnpj: data.cnpj || '',
          stateRegistration: data.stateRegistration || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          address: {
            cep: data.postalCode || '',
            logradouro: data.address || '',
            numero: data.number || '',
            complemento: data.complement || '',
            bairro: data.neighborhood || '',
            cidade: data.city || '',
            estado: data.state || '',
          },
          contact: {
            name: '',
            phone: '',
            email: '',
          },
        } as any)
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Fornecedor nao encontrado')
          router.push('/suppliers')
        } else {
          toast.error('Erro ao carregar dados do fornecedor')
        }
      } finally {
        setIsFetching(false)
      }
    }
    fetchSupplier()
  }, [params.id, router])

  const handleSubmit = async (data: SupplierFormData) => {
    setIsLoading(true)
    try {
      await apiClient.put(`/suppliers/${params.id}`, {
        name: data.razaoSocial,
        tradeName: data.nomeFantasia,
        cnpj: data.cnpj,
        stateRegistration: data.stateRegistration || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        postalCode: data.address?.cep || null,
        address: data.address?.logradouro || null,
        number: data.address?.numero || null,
        complement: data.address?.complemento || null,
        neighborhood: data.address?.bairro || null,
        city: data.address?.cidade || null,
        state: data.address?.estado || null,
      })
      toast.success('Fornecedor atualizado com sucesso!')
      router.push('/suppliers')
    } catch {
      toast.error('Erro ao atualizar fornecedor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Editar Fornecedor"
        description="Atualize os dados do fornecedor"
        backHref="/suppliers"
      />
      {isFetching ? (
        <FormSkeleton />
      ) : supplier ? (
        <SupplierForm
          defaultValues={supplier}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Atualizar Fornecedor"
        />
      ) : (
        <p className="text-muted-foreground">Fornecedor nao encontrado</p>
      )}
    </div>
  )
}
