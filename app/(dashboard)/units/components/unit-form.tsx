// ==========================================
// COMPONENTE: FORMULÁRIO DE UNIDADE
// ==========================================
// Compartilhado entre criação e edição de unidades
// 'use client' = necessário para hooks do React Form

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { unitSchema, type UnitFormData } from '@/lib/validators'
import { UNIT_TYPES, BRAZILIAN_STATES } from '@/lib/constants'
import { formatPhone, formatCEP } from '@/lib/format'
import { fetchAddressByCEP } from '@/lib/services/cep-service'
import { Loader2, Clock } from 'lucide-react'

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const

interface UnitFormProps {
  defaultValues?: Partial<UnitFormData>
  onSubmit: (data: UnitFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function UnitForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Salvar Unidade'
}: UnitFormProps) {
  const [isFetchingCEP, setIsFetchingCEP] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema) as any,
    defaultValues: defaultValues || {
      address: {
        estado: ''
      }
    }
  })

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    setValue('address.cep', formatted)
    if (formatted.length === 9) {
      setIsFetchingCEP(true)
      const address = await fetchAddressByCEP(formatted)
      setIsFetchingCEP(false)
      if (address) {
        setValue('address.logradouro', address.logradouro)
        setValue('address.bairro', address.bairro)
        setValue('address.cidade', address.cidade)
        setValue('address.estado', address.estado)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Dados da Unidade</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input placeholder="Nome da unidade" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                onValueChange={(value) => setValue('type', value as any)}
                defaultValue={defaultValues?.type}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>CNES *</Label>
              <Input placeholder="Número CNES" {...register('cnes')} />
              {errors.cnes && <p className="text-sm text-destructive">{errors.cnes.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input
                placeholder="(00) 0000-0000"
                {...register('phone')}
                onChange={(e) => setValue('phone', formatPhone(e.target.value))}
                maxLength={15}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="email@unidade.com" {...register('email')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label>CEP *</Label>
            <div className="relative">
              <Input
                placeholder="00000-000"
                {...register('address.cep')}
                onChange={handleCEPChange}
                maxLength={9}
              />
              {isFetchingCEP && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            </div>
            {errors.address?.cep && <p className="text-sm text-destructive">{errors.address.cep.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Logradouro *</Label>
              <Input {...register('address.logradouro')} />
              {errors.address?.logradouro && <p className="text-sm text-destructive">{errors.address.logradouro.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Número *</Label>
              <Input {...register('address.numero')} />
              {errors.address?.numero && <p className="text-sm text-destructive">{errors.address.numero.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Bairro *</Label>
              <Input {...register('address.bairro')} />
              {errors.address?.bairro && <p className="text-sm text-destructive">{errors.address.bairro.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Input {...register('address.cidade')} />
              {errors.address?.cidade && <p className="text-sm text-destructive">{errors.address.cidade.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select
                onValueChange={(value) => setValue('address.estado', value)}
                defaultValue={defaultValues?.address?.estado}
              >
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.address?.estado && <p className="text-sm text-destructive">{errors.address.estado.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Funcionamento
          </CardTitle>
          <CardDescription>
            Defina os horários de abertura e fechamento para cada dia da semana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.key} className="grid grid-cols-[140px_1fr_1fr] gap-3 items-center">
                <Label className="font-medium">{day.label}</Label>
                <div className="space-y-1">
                  <Input
                    type="time"
                    placeholder="Abertura"
                    {...register(`operatingHours.${day.key}Open` as any)}
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    type="time"
                    placeholder="Fechamento"
                    {...register(`operatingHours.${day.key}Close` as any)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>Observações sobre horário</Label>
            <Textarea
              placeholder="Ex: Fechado em feriados municipais, atendimento especial aos sábados apenas para urgências..."
              {...register('operatingHours.operatingNotes')}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
