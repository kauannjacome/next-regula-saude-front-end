'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared'
import { SupplierForm } from '../components/supplier-form'
import { type SupplierFormData } from '@/lib/validators'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

export default function NewSupplierPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: SupplierFormData) => {
    setIsLoading(true)
    try {
      await apiClient.post('/suppliers', data)
      toast.success('Fornecedor cadastrado com sucesso!')
      router.push('/suppliers')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao cadastrar fornecedor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Novo Fornecedor"
        description="Cadastre um novo fornecedor no sistema"
        backHref="/suppliers"
      />
      <SupplierForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
