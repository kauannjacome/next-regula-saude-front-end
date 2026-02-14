// ==========================================
// COMPONENTE: FORMULÁRIO DE GRUPO DE ATENDIMENTO
// ==========================================

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { careGroupSchema, type CareGroupFormData } from '@/lib/validators'
import { Loader2 } from 'lucide-react'

interface CareGroupFormProps {
  defaultValues?: Partial<CareGroupFormData>
  onSubmit: (data: CareGroupFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function CareGroupForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Salvar Grupo'
}: CareGroupFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CareGroupFormData>({
    resolver: zodResolver(careGroupSchema) as any,
    defaultValues: defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Dados do Grupo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input placeholder="Nome do grupo de atendimento" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea placeholder="Descrição do grupo" {...register('description')} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : submitLabel}
      </Button>
    </form>
  )
}
