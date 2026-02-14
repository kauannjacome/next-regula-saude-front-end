'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle, Building2 } from 'lucide-react'
import { COUNCIL_TYPES, BRAZILIAN_STATES, GENDERS, MARITAL_STATUSES } from '@/lib/constants'
import { formatCPF, formatPhone, formatCEP, formatRG, formatCNS } from '@/lib/format'
import { fetchAddressByCEP } from '@/lib/services/cep-service'
import { registrationSchema, type RegistrationFormData } from '@/lib/validators'
import { PasswordInput } from '@/components/shared/password-strength'
import { toast } from 'sonner'
import Link from 'next/link'

const RequiredLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
  <Label htmlFor={htmlFor}>
    {children} <span className="text-red-500">*</span>
  </Label>
)

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('')

  // CNES validation state
  const [cnesValidating, setCnesValidating] = useState(false)
  const [cnesInfo, setCnesInfo] = useState<{ unitName: string; municipalityName: string } | null>(null)
  const [cnesError, setCnesError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema) as any,
  })

  const validateCNES = async (cnes: string) => {
    if (!cnes || cnes.trim().length === 0) {
      setCnesInfo(null)
      setCnesError('')
      return
    }

    setCnesValidating(true)
    setCnesError('')
    setCnesInfo(null)

    try {
      const res = await fetch(`/api/auth/register/validate-cnes?cnes=${encodeURIComponent(cnes.trim())}`)
      const data = await res.json()

      if (res.ok) {
        setCnesInfo({ unitName: data.unitName, municipalityName: data.municipalityName })
      } else {
        setCnesError(data.error || 'Unidade não encontrada')
      }
    } catch {
      setCnesError('Erro ao validar CNES')
    } finally {
      setCnesValidating(false)
    }
  }

  const onSubmit = async (data: RegistrationFormData) => {
    if (!cnesInfo) {
      setCnesError('Valide o CNES antes de continuar')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (res.ok) {
        setSuccess(true)
        toast.success(result.message)
      } else {
        toast.error(result.error || 'Erro ao realizar cadastro')
      }
    } catch {
      toast.error('Erro ao realizar cadastro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Cadastro Enviado!</h2>
          <p className="text-muted-foreground">
            Seu cadastro foi enviado com sucesso. Aguarde a aprovação do administrador da unidade para acessar o sistema.
          </p>
          <Link href="/login">
            <Button className="w-full mt-4">Voltar para o Login</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
          <img src="/Logo.ico" alt="Regula" className="h-16 w-16 object-contain" />
        </div>
        <h1 className="text-3xl font-bold">Solicitar Acesso</h1>
        <p className="text-muted-foreground">Preencha seus dados para solicitar acesso ao sistema</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação da Unidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Identificação da Unidade
            </CardTitle>
            <CardDescription>Digite o CNES da unidade de saúde que deseja se vincular</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="cnes">CNES da Unidade</RequiredLabel>
              <div className="flex gap-2">
                <Input
                  id="cnes"
                  placeholder="Digite o CNES"
                  {...register('cnes')}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => validateCNES(getValues('cnes'))}
                  disabled={cnesValidating}
                >
                  {cnesValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validar'}
                </Button>
              </div>
              {errors.cnes && <p className="text-sm text-destructive">{errors.cnes.message}</p>}
              {cnesError && <p className="text-sm text-destructive">{cnesError}</p>}
              {cnesInfo && (
                <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">{cnesInfo.unitName}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">{cnesInfo.municipalityName}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados Pessoais */}
        <Card>
          <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="name">Nome Completo</RequiredLabel>
                <Input id="name" placeholder="Digite o nome completo" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="email">Email</RequiredLabel>
                <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="cpf">CPF</RequiredLabel>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  {...register('cpf')}
                  onChange={(e) => setValue('cpf', formatCPF(e.target.value))}
                />
                {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="phoneNumber">Telefone</RequiredLabel>
                <Input
                  id="phoneNumber"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  {...register('phoneNumber')}
                  onChange={(e) => setValue('phoneNumber', formatPhone(e.target.value))}
                />
                {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" type="date" {...register('birthDate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <Select onValueChange={(v) => setValue('sex', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Estado Civil</Label>
                <Select onValueChange={(v) => setValue('maritalStatus', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUSES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidade</Label>
                <Select onValueChange={(v) => setValue('nationality', v)} defaultValue="Brasileira">
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Brasileira">Brasileira</SelectItem>
                    <SelectItem value="Outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="motherName">Nome da Mãe</Label>
                <Input id="motherName" {...register('motherName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatherName">Nome do Pai</Label>
                <Input id="fatherName" {...register('fatherName')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identificação */}
        <Card>
          <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  maxLength={12}
                  {...register('rg')}
                  onChange={(e) => setValue('rg', formatRG(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cns">CNS</Label>
                <Input
                  id="cns"
                  maxLength={18}
                  {...register('cns')}
                  onChange={(e) => setValue('cns', formatCNS(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Profissionais */}
        <Card>
          <CardHeader><CardTitle>Dados Profissionais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="council">Conselho</Label>
                <Select onValueChange={(v) => setValue('council', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {COUNCIL_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="councilNumber">Número do Registro</Label>
                <Input id="councilNumber" placeholder="Ex: 123456" {...register('councilNumber')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="councilUf">UF do Registro</Label>
                <Select onValueChange={(v) => setValue('councilUf', v)}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.value} - {s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade / Cargo</Label>
              <Input id="specialty" placeholder="Ex: Cardiologista, Enfermeiro, Técnico..." {...register('specialty')} />
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                maxLength={9}
                {...register('address.cep')}
                onChange={async (e) => {
                  const val = formatCEP(e.target.value)
                  setValue('address.cep', val)
                  if (val.length === 9) {
                    const addr = await fetchAddressByCEP(val)
                    if (addr) {
                      setValue('address.logradouro', addr.logradouro)
                      setValue('address.bairro', addr.bairro)
                      setValue('address.cidade', addr.cidade)
                      setValue('address.estado', addr.estado)
                    }
                  }
                }}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input id="logradouro" {...register('address.logradouro')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" {...register('address.numero')} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" {...register('address.bairro')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" {...register('address.cidade')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select onValueChange={(v) => setValue('address.estado', v)}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input id="complemento" {...register('address.complemento')} />
            </div>
          </CardContent>
        </Card>

        {/* Senha */}
        <Card>
          <CardHeader><CardTitle>Senha de Acesso</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="password">Senha</RequiredLabel>
                <PasswordInput
                  id="password"
                  value={passwordValue}
                  onChange={(value) => {
                    setPasswordValue(value)
                    setValue('password', value)
                  }}
                  placeholder="Mínimo 8 caracteres"
                  showStrength={true}
                  error={errors.password?.message}
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="confirmPassword">Confirmar Senha</RequiredLabel>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPasswordValue}
                  onChange={(value) => {
                    setConfirmPasswordValue(value)
                    setValue('confirmPassword', value)
                  }}
                  placeholder="Repita a senha"
                  showStrength={false}
                  error={errors.confirmPassword?.message}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            'Solicitar Acesso'
          )}
        </Button>

        <div className="text-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Já tem conta? Faça login
          </Link>
        </div>
      </form>
    </div>
  )
}
