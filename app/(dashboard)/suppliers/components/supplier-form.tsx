// ==========================================
// COMPONENTE: FORMULÁRIO DE FORNECEDOR
// ==========================================

'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supplierSchema, type SupplierFormData } from '@/lib/validators';
import { BRAZILIAN_STATES } from '@/lib/constants';
import { formatPhone, formatCEP, formatCNPJ } from '@/lib/format';
import { fetchAddressByCEP } from '@/lib/services/cep-service';
import { Loader2 } from 'lucide-react';

interface SupplierFormProps {
  defaultValues?: Partial<SupplierFormData>
  onSubmit: (data: SupplierFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function SupplierForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Salvar Fornecedor'
}: SupplierFormProps) {
  const [isFetchingCEP, setIsFetchingCEP] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema) as any,
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

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('cnpj', formatCNPJ(e.target.value))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Razão Social *</Label>
              <Input placeholder="Razão Social" {...register('razaoSocial')} />
              {errors.razaoSocial && <p className="text-sm text-destructive">{errors.razaoSocial.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input placeholder="Nome Fantasia" {...register('nomeFantasia')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>CNPJ *</Label>
              <Input placeholder="00.000.000/0000-00" {...register('cnpj')} onChange={handleCNPJChange} maxLength={18} />
              {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input placeholder="Inscrição Estadual" {...register('stateRegistration')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone Principal *</Label>
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
              <Input type="email" placeholder="email@empresa.com" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Website</Label>
            <Input placeholder="https://www.empresa.com" {...register('website')} />
            {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
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
        <CardHeader><CardTitle>Contato Principal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Contato *</Label>
            <Input placeholder="Nome da pessoa de contato" {...register('contact.name')} />
            {errors.contact?.name && <p className="text-sm text-destructive">{errors.contact.name.message}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone do Contato *</Label>
              <Input
                placeholder="(00) 00000-0000"
                {...register('contact.phone')}
                onChange={(e) => setValue('contact.phone', formatPhone(e.target.value))}
                maxLength={15}
              />
              {errors.contact?.phone && <p className="text-sm text-destructive">{errors.contact.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email do Contato</Label>
              <Input type="email" placeholder="email@contato.com" {...register('contact.email')} />
              {errors.contact?.email && <p className="text-sm text-destructive">{errors.contact.email.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : submitLabel}
      </Button>
    </form>
  )
}
