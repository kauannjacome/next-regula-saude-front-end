'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared';
import { WhatsAppProgrammedForm } from '../../components/whatsapp-programmed-form';
import { type WhatsAppProgrammedFormData } from '@/lib/validators';
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'

export default function EditWhatsAppProgrammedPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [template, setTemplate] = useState<WhatsAppProgrammedFormData | null>(null)

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsFetching(true)
      try {
        const response = await apiClient.get(`/whatsapp-programmed/${params.id}`)
        const data = response.data
        setTemplate({
          name: data.name,
          triggerType: data.triggerType,
          triggerValue: data.triggerValue || undefined,
          headerText: data.headerText || undefined,
          bodyText: data.bodyText,
          footerText: data.footerText || undefined,
          isActive: data.isActive,
        })
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Template não encontrado')
          router.push('/whatsapp-programmed')
        } else {
          toast.error('Erro ao carregar dados do template')
        }
      } finally {
        setIsFetching(false)
      }
    }
    fetchTemplate()
  }, [params.id, router])

  const handleSubmit = async (data: WhatsAppProgrammedFormData) => {
    setIsLoading(true)
    try {
      await apiClient.put(`/whatsapp-programmed/${params.id}`, data)
      toast.success('Template atualizado com sucesso!')
      router.push('/whatsapp-programmed')
    } catch {
      toast.error('Erro ao atualizar template')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Template de Mensagem"
        description="Atualize o template com variáveis dinâmicas"
        backHref="/whatsapp-programmed"
      />
      {isFetching ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : template ? (
        <WhatsAppProgrammedForm
          defaultValues={template}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Atualizar Template"
        />
      ) : (
        <p className="text-muted-foreground">Template não encontrado</p>
      )}
    </div>
  )
}
