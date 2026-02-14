// ==========================================
// COMPONENTE: FORMULÁRIO DE CIDADÃO
// ==========================================
// Este formulário é COMPARTILHADO entre as páginas de criar e editar cidadão
// Usa React Hook Form para gerenciar estado dos campos
// Usa Zod para validar dados antes de enviar
// Funcionalidades:
// - Formatação automática: CPF, telefone, CEP
// - Busca automática de endereço ao digitar CEP
// - Validação em tempo real
// - Mensagens de erro personalizadas
// 'use client' = este código roda no NAVEGADOR (frontend)

'use client'

import { useState } from 'react'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FormField, 
  FormSelect, 
  FormCPF, 
  FormPhone, 
  FormCEP,
  ConfirmDialog 
} from '@/components/shared'
import { citizenSchema, type CitizenFormData } from '@/lib/validators'
import {
  GENDERS,
  BRAZILIAN_STATES,
  MARITAL_STATUSES,
  RACES,
  BLOOD_TYPES
} from '@/lib/constants'
import { FORM_TOOLTIPS } from '@/lib/form-tooltips'

// COMPONENTE: Label com asterisco vermelho para campos obrigatórios
// RequiredLabel removido em favor do novo FormField

// TIPO: Define quais propriedades (props) este componente aceita
interface CitizenFormProps {
  defaultValues?: Partial<CitizenFormData>  // Valores iniciais (usado no editar)
  onSubmit: (data: CitizenFormData) => Promise<void>  // Função chamada ao enviar
  isLoading?: boolean                       // Se está salvando (desabilita botão)
  submitLabel?: string                      // Texto do botão ("Cadastrar" ou "Atualizar")
}

// COMPONENTE PRINCIPAL: Formulário compartilhado
export function CitizenForm({
  defaultValues,              // Valores iniciais (opcional)
  onSubmit,                   // Função a ser chamada ao enviar
  isLoading = false,          // Valor padrão: false
  submitLabel = 'Salvar',     // Valor padrão: 'Salvar'
}: CitizenFormProps) {
  // isFetchingCEP removido em favor do componente FormCEP

  // ESTADO: Controla diálogo de confirmação
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingData, setPendingData] = useState<CitizenFormData | null>(null)

  // ==========================================
  // REACT HOOK FORM: Gerenciamento do formulário
  // ==========================================
  // Esta biblioteca facilita gerenciar formulários complexos
  // Evita ter que criar useState para cada campo (muito código repetitivo)
  const methods = useForm<CitizenFormData>({
    resolver: zodResolver(citizenSchema) as any,
    defaultValues: {
      gender: 'M',
      ...defaultValues,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = methods

  const rgState = useWatch({ control, name: 'rgState' })
  const gender = useWatch({ control, name: 'gender' })
  const sex = useWatch({ control, name: 'sex' })
  const race = useWatch({ control, name: 'race' })
  const maritalStatus = useWatch({ control, name: 'maritalStatus' })
  const bloodType = useWatch({ control, name: 'bloodType' })
  const addressState = useWatch({ control, name: 'address.estado' })

  // ==========================================
  // FUNÇÕES DE FORMATAÇÃO AUTOMÁTICA
  // ==========================================
  // Estas funções são chamadas quando usuário digita nos campos
  // Aplicam máscara/formatação automaticamente

  // FORMATAR CPF: 12345678900 → 123.456.789-00
  // Handlers manuais de CPF, Telefone e CEP removidos (embutidos nos componentes)

  // HANDLER: Interceptar submit para mostrar diálogo de confirmação
  const handleFormSubmit = (data: CitizenFormData) => {
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
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

        {/* ===== CARD 1: DADOS PESSOAIS ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* CAMPO 1: Nome Completo */}
            {/* * = campo obrigatório */}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                id="name"
                label="Nome Completo"
                placeholder="Digite o nome completo"
                required
                tooltip={FORM_TOOLTIPS.citizen.name}
                error={errors.name?.message}
                {...register('name')}
              />
              <FormField
                id="socialName"
                label="Nome Social"
                placeholder="Nome social (se houver)"
                tooltip={FORM_TOOLTIPS.citizen.socialName}
                error={errors.socialName?.message}
                {...register('socialName')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormCPF
                name="cpf"
                required
                error={errors.cpf?.message}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                id="rg"
                label="RG"
                placeholder="Número do RG"
                tooltip={FORM_TOOLTIPS.citizen.rg}
                error={errors.rg?.message}
                {...register('rg')}
              />
              <FormField
                id="rgIssuer"
                label="Órgão Emissor"
                placeholder="Ex: SSP"
                error={errors.rgIssuer?.message}
                {...register('rgIssuer')}
              />
              <FormSelect
                id="rgState"
                label="UF Emissor"
                options={BRAZILIAN_STATES}
                value={rgState}
                onChange={(v) => setValue('rgState', v)}
                error={errors.rgState?.message}
              />
              <FormField
                id="rgIssueDate"
                label="Data Emissão"
                type="date"
                error={errors.rgIssueDate?.message}
                {...register('rgIssueDate')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                id="birthDate"
                label="Data de Nascimento"
                type="date"
                required
                tooltip={FORM_TOOLTIPS.citizen.birthDate}
                error={errors.birthDate?.message}
                {...register('birthDate')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-4 grid-cols-2">
                <FormSelect
                  id="gender"
                  label="Identidade de Gênero"
                  options={GENDERS}
                  value={gender}
                  onChange={(v) => setValue('gender', v as any)}
                  error={errors.gender?.message}
                />
                <FormSelect
                  id="sex"
                  label="Sexo Biológico"
                  required
                  tooltip={FORM_TOOLTIPS.citizen.sex}
                  options={[
                    { value: 'MALE', label: 'Masculino' },
                    { value: 'FEMALE', label: 'Feminino' }
                  ]}
                  value={sex}
                  onChange={(v) => setValue('sex', v)}
                  error={errors.sex?.message}
                />
              </div>

              <FormPhone
                name="phone"
                required
                error={errors.phone?.message}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                id="email"
                label="Email"
                type="email"
                placeholder="email@exemplo.com"
                tooltip={FORM_TOOLTIPS.citizen.email}
                error={errors.email?.message}
                {...register('email')}
              />
              <FormField
                id="cartaoSus"
                label="Cartão SUS"
                placeholder="Número do Cartão SUS"
                tooltip={FORM_TOOLTIPS.citizen.cns}
                error={errors.cartaoSus?.message}
                {...register('cartaoSus')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormSelect
                id="race"
                label="Raça/Cor"
                options={RACES || []}
                value={race}
                onChange={(v) => setValue('race', v)}
                error={errors.race?.message}
              />
              <FormSelect
                id="maritalStatus"
                label="Estado Civil"
                options={MARITAL_STATUSES || []}
                value={maritalStatus}
                onChange={(v) => setValue('maritalStatus', v)}
                error={errors.maritalStatus?.message}
              />
              <FormSelect
                id="bloodType"
                label="Tipo Sanguíneo"
                options={BLOOD_TYPES || []}
                value={bloodType}
                onChange={(v) => setValue('bloodType', v)}
                error={errors.bloodType?.message}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                id="nationality"
                label="Nacionalidade"
                placeholder="Brasileira"
                error={errors.nationality?.message}
                {...register('nationality')}
              />
              <FormField
                id="placeOfBirth"
                label="Naturalidade"
                placeholder="Cidade de nascimento"
                error={errors.placeOfBirth?.message}
                {...register('placeOfBirth')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                id="motherName"
                label="Nome da Mãe"
                placeholder="Nome completo da mãe"
                required
                tooltip={FORM_TOOLTIPS.citizen.motherName}
                error={errors.motherName?.message}
                {...register('motherName')}
              />
              <FormField
                id="fatherName"
                label="Nome do Pai"
                placeholder="Nome completo do pai"
                tooltip={FORM_TOOLTIPS.citizen.fatherName}
                error={errors.fatherName?.message}
                {...register('fatherName')}
              />
            </div>
          </CardContent>
        </Card>

        {/* ===== CARD 2: ENDEREÇO ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs">
              <FormCEP
                name="address.cep"
                required
                error={errors.address?.cep?.message}
                onAddressFetch={(addr) => {
                  setValue('address.logradouro', addr.logradouro)
                  setValue('address.bairro', addr.bairro)
                  setValue('address.cidade', addr.cidade)
                  setValue('address.estado', addr.estado)
                }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                id="logradouro"
                className="md:col-span-2"
                label="Logradouro"
                required
                tooltip={FORM_TOOLTIPS.citizen.address}
                error={errors.address?.logradouro?.message}
                {...register('address.logradouro')}
              />
              <FormField
                id="numero"
                label="Número"
                required
                tooltip={FORM_TOOLTIPS.citizen.number}
                error={errors.address?.numero?.message}
                {...register('address.numero')}
              />
            </div>

            <FormField
              id="complemento"
              label="Complemento"
              placeholder="Apto, Bloco, etc"
              tooltip={FORM_TOOLTIPS.citizen.complement}
              error={errors.address?.complemento?.message}
              {...register('address.complemento')}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                id="bairro"
                label="Bairro"
                required
                tooltip={FORM_TOOLTIPS.citizen.neighborhood}
                error={errors.address?.bairro?.message}
                {...register('address.bairro')}
              />
              <FormField
                id="cidade"
                label="Cidade"
                required
                tooltip={FORM_TOOLTIPS.citizen.city}
                error={errors.address?.cidade?.message}
                {...register('address.cidade')}
              />
              <FormSelect
                id="estado"
                label="Estado"
                required
                options={BRAZILIAN_STATES}
                value={addressState}
                onChange={(v) => setValue('address.estado', v)}
                error={errors.address?.estado?.message}
              />
            </div>
          </CardContent>
        </Card>

        {/* ===== BOTÃO DE SUBMIT ===== */}
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
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirm}
        title="Confirmar Cadastro de Cidadão"
        description="Revise os dados antes de confirmar:"
        confirmLabel="Confirmar Cadastro"
      >
        {pendingData && (
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>Nome:</strong> {pendingData.name}</p>
            <p><strong>CPF:</strong> {pendingData.cpf}</p>
            <p><strong>Data de Nascimento:</strong> {new Date(pendingData.birthDate).toLocaleDateString('pt-BR')}</p>
            <p><strong>Telefone:</strong> {pendingData.phone}</p>
            <p><strong>Nome da Mãe:</strong> {pendingData.motherName}</p>
          </div>
        )}
      </ConfirmDialog>
    </FormProvider>
  )
}
