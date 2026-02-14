'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared';
import { formatCNPJ, formatPhone, formatCEP } from '@/lib/format';
import { fetchAddressByCEP } from '@/lib/services/cep-service';
import { BRAZILIAN_STATES } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'OVERDUE', label: 'Em Atraso' },
  { value: 'TEMPORARY_UNBLOCK', label: 'Desbloqueio Temporário' },
  { value: 'BLOCKED', label: 'Bloqueado' },
] as const

const subscriberSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  municipalityName: z.string().min(3, 'Nome do municipio deve ter pelo menos 3 caracteres'),
  cnpj: z.string().min(18, 'CNPJ invalido'),
  email: z.string().email('Email invalido'),
  telephone: z.string().min(14, 'Telefone invalido'),
  postalCode: z.string().min(9, 'CEP invalido'),
  street: z.string().min(1, 'Logradouro obrigatorio'),
  number: z.string().min(1, 'Numero obrigatorio'),
  neighborhood: z.string().min(1, 'Bairro obrigatorio'),
  city: z.string().min(1, 'Cidade obrigatoria'),
  stateAcronym: z.string().min(2, 'Estado obrigatorio'),
  stateName: z.string().min(2, 'Estado obrigatorio'),
  subscriptionStatus: z.enum(['ACTIVE', 'OVERDUE', 'TEMPORARY_UNBLOCK', 'BLOCKED']),
})

type SubscriberFormData = z.infer<typeof subscriberSchema>

export default function EditSubscriberPage() {
  const router = useRouter()
  const params = useParams()
  const subscriberId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isFetchingCEP, setIsFetchingCEP] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<SubscriberFormData>({
    resolver: zodResolver(subscriberSchema),
  })

  useEffect(() => {
    const fetchSubscriber = async () => {
      try {
        const response = await fetch(`/api/admin/subscribers/${subscriberId}`)
        if (!response.ok) throw new Error('Erro ao buscar assinante')
        const data = await response.json()

        reset({
          name: data.name || '',
          municipalityName: data.municipalityName || '',
          cnpj: formatCNPJ(data.cnpj || ''),
          email: data.email || '',
          telephone: formatPhone(data.telephone || ''),
          postalCode: formatCEP(data.postalCode || ''),
          street: data.street || '',
          number: data.number || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          stateAcronym: data.stateAcronym || '',
          stateName: data.stateName || '',
          subscriptionStatus: data.subscriptionStatus || 'ACTIVE',
        })
      } catch (error) {
        console.error('Erro ao buscar assinante:', error)
        toast.error('Erro ao carregar dados do assinante')
        router.push('/admin/subscribers')
      } finally {
        setIsFetching(false)
      }
    }

    fetchSubscriber()
  }, [subscriberId, reset, router])

  const onSubmit = async (data: SubscriberFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/subscribers/${subscriberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao atualizar assinante')
      }

      toast.success('Assinante atualizado com sucesso!')
      router.push('/admin/subscribers')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar assinante')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    setValue('postalCode', formatted)
    if (formatted.length === 9) {
      setIsFetchingCEP(true)
      const address = await fetchAddressByCEP(formatted)
      setIsFetchingCEP(false)
      if (address) {
        setValue('street', address.logradouro)
        setValue('neighborhood', address.bairro)
        setValue('city', address.cidade)
        setValue('stateAcronym', address.estado)
        const state = BRAZILIAN_STATES.find(s => s.value === address.estado)
        if (state) {
          setValue('stateName', state.label)
        }
      }
    }
  }

  const handleStateChange = (stateAcronym: string) => {
    setValue('stateAcronym', stateAcronym)
    const state = BRAZILIAN_STATES.find(s => s.value === stateAcronym)
    if (state) {
      setValue('stateName', state.label)
    }
  }

  const watchedStateAcronym = watch('stateAcronym')
  const watchedSubscriptionStatus = watch('subscriptionStatus')

  if (isFetching) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Editar Assinante"
          description="Carregando dados..."
          backHref="/admin/subscribers"
        />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Editar Assinante"
        description="Atualize os dados do assinante"
        backHref="/admin/subscribers"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Assinante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Razao Social *</Label>
                <Input placeholder="Nome da empresa/instituicao" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nome do Municipio *</Label>
                <Input placeholder="Ex: Prefeitura de Sao Paulo" {...register('municipalityName')} />
                {errors.municipalityName && <p className="text-sm text-destructive">{errors.municipalityName.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>CNPJ *</Label>
                <Input
                  placeholder="00.000.000/0000-00"
                  {...register('cnpj')}
                  onChange={(e) => setValue('cnpj', formatCNPJ(e.target.value))}
                  maxLength={18}
                />
                {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="contato@empresa.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  placeholder="(00) 0000-0000"
                  {...register('telephone')}
                  onChange={(e) => setValue('telephone', formatPhone(e.target.value))}
                  maxLength={15}
                />
                {errors.telephone && <p className="text-sm text-destructive">{errors.telephone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Status da Assinatura *</Label>
                <Select value={watchedSubscriptionStatus} onValueChange={(v) => setValue('subscriptionStatus', v as 'ACTIVE' | 'OVERDUE' | 'TEMPORARY_UNBLOCK' | 'BLOCKED')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subscriptionStatus && <p className="text-sm text-destructive">{errors.subscriptionStatus.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereco</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label>CEP *</Label>
              <div className="relative">
                <Input
                  placeholder="00000-000"
                  {...register('postalCode')}
                  onChange={handleCEPChange}
                  maxLength={9}
                />
                {isFetchingCEP && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
              {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode.message}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label>Logradouro *</Label>
                <Input {...register('street')} />
                {errors.street && <p className="text-sm text-destructive">{errors.street.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Numero *</Label>
                <Input {...register('number')} />
                {errors.number && <p className="text-sm text-destructive">{errors.number.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Bairro *</Label>
                <Input {...register('neighborhood')} />
                {errors.neighborhood && <p className="text-sm text-destructive">{errors.neighborhood.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Input {...register('city')} />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Select value={watchedStateAcronym} onValueChange={handleStateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.value} - {s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stateAcronym && <p className="text-sm text-destructive">{errors.stateAcronym.message}</p>}
              </div>
            </div>
            <input type="hidden" {...register('stateName')} />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Alteracoes'
          )}
        </Button>
      </form>
    </div>
  )
}
