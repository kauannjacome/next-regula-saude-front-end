'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared';
import { careGroupSchema, type CareGroupFormData } from '@/lib/validators';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import apiClient from '@/lib/api/api-client'

export default function NewCareGroupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<CareGroupFormData>({
    resolver: zodResolver(careGroupSchema) as any,
  })

  const onSubmit = async (data: CareGroupFormData) => {
    setIsLoading(true)
    try {
      await apiClient.post('/groups', {
        name: data.name,
        description: data.description,
      })
      toast.success('Grupo de atendimento criado com sucesso!')
      router.push('/care-groups')
    } catch {
      toast.error('Erro ao criar grupo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Novo Grupo de Atendimento" description="Crie um novo grupo de atendimento" backHref="/care-groups" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados do Grupo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Nome do grupo" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea placeholder="Descricao do grupo de atendimento" {...register('description')} rows={4} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : 'Criar Grupo'}
        </Button>
      </form>
    </div>
  )
}
