'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared'
import { WhatsAppProgrammedForm } from '../components/whatsapp-programmed-form'
import { type WhatsAppProgrammedFormData } from '@/lib/validators'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

export default function NewWhatsAppProgrammedPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: WhatsAppProgrammedFormData) => {
    setIsLoading(true)
    try {
      await apiClient.post('/whatsapp-programmed', data)
      toast.success('Template criado com sucesso!')
      router.push('/whatsapp-programmed')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar template')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Template de Mensagem"
        description="Crie mensagens automáticas personalizadas com variáveis dinâmicas"
        backHref="/whatsapp-programmed"
      />
      <WhatsAppProgrammedForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
