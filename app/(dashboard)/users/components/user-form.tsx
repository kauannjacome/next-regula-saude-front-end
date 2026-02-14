'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { COUNCIL_TYPES, BRAZILIAN_STATES, GENDERS, MARITAL_STATUSES } from '@/lib/constants';
import { formatCPF, formatPhone, formatCEP, formatRG, formatCNS } from '@/lib/format';
import { fetchAddressByCEP } from '@/lib/services/cep-service';
import { useState } from 'react';
import { userSchema, type UserFormData } from '@/lib/validators';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { PasswordInput, validatePassword } from '@/components/shared/password-strength';

// COMPONENTE: Label com asterisco vermelho para campos obrigatórios
const RequiredLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
  <Label htmlFor={htmlFor}>
    {children} <span className="text-red-500">*</span>
  </Label>
)

interface UserFormProps {
  defaultValues?: Partial<UserFormData>
  onSubmit: (data: UserFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
  isEditMode?: boolean
}

export function UserForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Salvar',
  isEditMode = false,
}: UserFormProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingData, setPendingData] = useState<UserFormData | null>(null)
  const [passwordValue, setPasswordValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      status: 'Ativo',
      role: 'typist',
      ...defaultValues,
    },
  })

  // HANDLER: Interceptar submit para mostrar dialogo de confirmacao
  const handleFormSubmit = (data: UserFormData) => {
    // Validar senha antes de submeter (apenas na criacao)
    if (!isEditMode && data.password) {
      const passwordValidation = validatePassword(data.password)
      if (!passwordValidation.isValid) {
        return // Nao permite submit se senha nao atende requisitos
      }
    }
    setPendingData(data)
    setShowConfirmDialog(true)
  }

  // HANDLER: Confirmar e submeter dados
  const handleConfirm = async () => {
    if (pendingData) {
      setShowConfirmDialog(false)
      await onSubmit(pendingData)
      setPendingData(null)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="name">Nome Completo</RequiredLabel>
                <Input
                  id="name"
                  placeholder="Digite o nome completo"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="email">Email</RequiredLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register('birthDate')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <Select onValueChange={(v) => setValue('sex', v)} defaultValue={defaultValues?.sex || undefined}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(GENDERS || []).map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Estado Civil</Label>
                <Select onValueChange={(v) => setValue('maritalStatus', v)} defaultValue={defaultValues?.maritalStatus || undefined}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(MARITAL_STATUSES || []).map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidade</Label>
                <Select
                  onValueChange={(v) => setValue('nationality', v)}
                  defaultValue={defaultValues?.nationality || 'Brasileira'}
                >
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
                {errors.cpf && (
                  <p className="text-sm text-destructive">{errors.cpf.message}</p>
                )}
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
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            {!isEditMode && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="password">Senha</RequiredLabel>
                  <PasswordInput
                    id="password"
                    value={passwordValue}
                    onChange={(value) => {
                      setPasswordValue(value)
                      setValue('password', value)
                    }}
                    placeholder="Digite uma senha segura"
                    showStrength={true}
                    error={errors.password?.message}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPasswordTemp"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    {...register('isPasswordTemp')}
                  />
                  <Label htmlFor="isPasswordTemp" className="text-sm font-normal cursor-pointer">
                    Forcar troca de senha no proximo login (Senha Temporaria)
                  </Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="role">Papel</RequiredLabel>
                <Select
                  defaultValue={defaultValues?.role || 'typist'}
                  onValueChange={(value) => setValue('role', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_municipal">Administrador Municipal</SelectItem>
                    <SelectItem value="assistant_municipal">Auxiliar Administrativo</SelectItem>
                    <SelectItem value="doctor">Médico</SelectItem>
                    <SelectItem value="pharmaceutical">Farmacêutico</SelectItem>
                    <SelectItem value="typist">Digitador</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="status">Status</RequiredLabel>
                <Select
                  defaultValue={defaultValues?.status || 'Ativo'}
                  onValueChange={(value) => setValue('status', value as 'Ativo' | 'Inativo')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="council">Conselho</Label>
                <Select
                  defaultValue={defaultValues?.council || ''}
                  onValueChange={(value) => setValue('council', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNCIL_TYPES.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="councilNumber">Número do Registro</Label>
                <Input
                  id="councilNumber"
                  placeholder="Ex: 123456"
                  {...register('councilNumber')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="councilUf">UF do Registro</Label>
                <Select
                  defaultValue={defaultValues?.councilUf || ''}
                  onValueChange={(value) => setValue('councilUf', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.value} - {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade / Cargo</Label>
              <Input
                id="specialty"
                placeholder="Ex: Cardiologista, Enfermeiro, Técnico..."
                {...register('specialty')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" placeholder="00000-000" {...register('address.cep')} maxLength={9}
                onChange={async (e) => {
                  const val = formatCEP(e.target.value);
                  setValue('address.cep', val);
                  if (val.length === 9) {
                    const addr = await fetchAddressByCEP(val);
                    if (addr) {
                      setValue('address.logradouro', addr.logradouro);
                      setValue('address.bairro', addr.bairro);
                      setValue('address.cidade', addr.cidade);
                      setValue('address.estado', addr.estado);
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
                <Select onValueChange={(v) => setValue('address.estado', v)} defaultValue={defaultValues?.address?.estado || undefined}>
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

        <div className="flex gap-4">
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>

      {/* DIÁLOGO DE CONFIRMAÇÃO */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirm}
        title="Confirmar Cadastro de Usuário"
        description="Revise os dados antes de confirmar:"
        confirmText="Confirmar Cadastro"
        cancelText="Revisar Dados"
      >
        {pendingData && (
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>Nome:</strong> {pendingData.name}</p>
            <p><strong>Email:</strong> {pendingData.email}</p>
            <p><strong>CPF:</strong> {pendingData.cpf}</p>
            <p><strong>Telefone:</strong> {pendingData.phoneNumber}</p>
            <p><strong>Papel:</strong> {pendingData.role}</p>
          </div>
        )}
      </ConfirmationDialog>
    </>
  )
}
