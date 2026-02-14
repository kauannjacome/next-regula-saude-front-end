// ==========================================
// COMPONENTE: FORMULÁRIO DE CUIDADO
// ==========================================
// Este formulário é COMPARTILHADO entre as páginas de criar e editar cuidado
// Usa React Hook Form para gerenciar estado dos campos
// Usa Zod para validar dados antes de enviar
// 'use client' = este código roda no NAVEGADOR (frontend)

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'              // Biblioteca para gerenciar formulários
import { zodResolver } from '@hookform/resolvers/zod'  // Conecta Zod com React Hook Form
import { z } from 'zod'                                // Biblioteca de validação
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'    // Textarea para textos longos
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import apiClient from '@/lib/api/api-client'

// ==========================================
// CONSTANTES: Tipos de cuidado disponíveis
// ==========================================
const CARE_TYPES = [
  { value: 'clinico', label: 'Clínico' },
  { value: 'domiciliar', label: 'Domiciliar' },
  { value: 'pos-operatorio', label: 'Pós-Operatório' },
  { value: 'preventivo', label: 'Preventivo' },
  { value: 'reabilitacao', label: 'Reabilitação' },
  { value: 'paliativo', label: 'Paliativo' },
]

const COMPLEXITY_OPTIONS = [
  { value: 'BAIXA', label: 'Baixa Complexidade' },
  { value: 'MEDIA', label: 'Média Complexidade' },
  { value: 'ALTA', label: 'Alta Complexidade' },
]

const RESOURCE_ORIGIN_OPTIONS = [
  { value: 'NOT_SPECIFIED', label: 'Não Especificado' },
  { value: 'MUNICIPAL', label: 'Municipal' },
  { value: 'STATE', label: 'Estadual' },
  { value: 'FEDERAL', label: 'Federal' },
]

const GENDER_OPTIONS = [
  { value: 'BOTH', label: 'Ambos os sexos' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
]

const UNIT_MEASURE_OPTIONS = [
  { value: 'UN', label: 'Unidade (UN)' },
  { value: 'SESSION', label: 'Sessão' },
  { value: 'DAILY', label: 'Diária' },
  { value: 'DOSE', label: 'Dose' },
  { value: 'AMP', label: 'Ampola (AMP)' },
  { value: 'COMP', label: 'Comprimido (COMP)' },
  { value: 'CAPS', label: 'Cápsula (CAPS)' },
  { value: 'ML', label: 'Mililitro (ML)' },
  { value: 'MG', label: 'Miligrama (MG)' },
  { value: 'G', label: 'Grama (G)' },
  { value: 'FR', label: 'Frasco (FR)' },
  { value: 'CX', label: 'Caixa (CX)' },
]

const PRIORITY_OPTIONS = [
  { value: 'ELECTIVE', label: 'Eletivo' },
  { value: 'URGENCY', label: 'Urgência' },
  { value: 'EMERGENCY', label: 'Emergência' },
]

// ==========================================
// VALIDAÇÃO: Schema Zod para validar dados
// ==========================================
const careFormSchema = z.object({
  // Dados básicos
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  acronym: z.string().optional(),
  type: z.string().min(1, 'Selecione um tipo'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  protocol: z.string().min(10, 'Protocolo deve ter no mínimo 10 caracteres'),
  minDeadlineDays: z.coerce.number().min(1, 'Duração mínima deve ser 1 dia'),
  status: z.enum(['Ativo', 'Inativo'], {
    message: 'Selecione um status',
  }),
  // Classificação SUS
  sigtapCode: z.string().optional(),
  groupId: z.coerce.number().optional().nullable(),
  subGroupId: z.coerce.number().optional().nullable(),
  complexity: z.string().optional(),
  value: z.coerce.number().optional().nullable(),
  resourceOrigin: z.string().optional(),
  // Restrições
  gender: z.string().optional(),
  minAge: z.coerce.number().optional().nullable(),
  maxAge: z.coerce.number().optional().nullable(),
  stayTime: z.coerce.number().optional().nullable(),
  // Configurações padrão
  supplierId: z.coerce.number().optional().nullable(),
  unitMeasure: z.string().optional(),
  priority: z.string().optional(),
})

// TIPO: Inferir tipo TypeScript do schema Zod
export type CareFormData = z.infer<typeof careFormSchema>

// Interfaces para dados do servidor
interface Group {
  id: number
  name: string
  subGroups?: SubGroup[]
}

interface SubGroup {
  id: number
  name: string
  groupId: number
}

interface Supplier {
  id: number
  name: string
}

// TIPO: Define quais propriedades (props) este componente aceita
interface CareFormProps {
  defaultValues?: Partial<CareFormData>  // Valores iniciais (usado no editar)
  onSubmit: (data: CareFormData) => Promise<void>  // Função chamada ao enviar
  isLoading?: boolean                    // Se está salvando (desabilita botão)
  submitLabel?: string                   // Texto do botão ("Cadastrar" ou "Atualizar")
}

// COMPONENTE PRINCIPAL: Formulário compartilhado
export function CareForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Salvar',
}: CareFormProps) {
  // Estados para dados do servidor
  const [groups, setGroups] = useState<Group[]>([])
  const [subGroups, setSubGroups] = useState<SubGroup[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(defaultValues?.groupId || null)

  // ==========================================
  // REACT HOOK FORM: Gerenciamento do formulário
  // ==========================================
  const {
    register,         // Função para registrar campos
    handleSubmit,     // Função para processar submit
    formState: { errors },  // Erros de validação
    setValue,         // Função para alterar valor de campo
    watch,            // Função para observar valor de campo
  } = useForm<CareFormData>({
    resolver: zodResolver(careFormSchema) as any,
    defaultValues: {
      status: 'Ativo',     // Padrão: Ativo
      priority: 'ELECTIVE',
      resourceOrigin: 'NOT_SPECIFIED',
      gender: 'BOTH',
      ...defaultValues,    // Sobrescrever com valores passados
    },
  })

  // Carregar grupos e fornecedores ao iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, suppliersRes] = await Promise.all([
          apiClient.get('/groups?limit=200'),
          apiClient.get('/suppliers?limit=200'),
        ])
        setGroups(groupsRes.data?.data || groupsRes.data || [])
        setSuppliers(suppliersRes.data?.data || suppliersRes.data || [])
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }
    fetchData()
  }, [])

  // Carregar subgrupos quando grupo mudar
  useEffect(() => {
    if (selectedGroupId) {
      const fetchSubGroups = async () => {
        try {
          const response = await apiClient.get(`/groups/${selectedGroupId}`)
          setSubGroups(response.data?.subGroups || [])
        } catch (error) {
          console.error('Erro ao carregar subgrupos:', error)
          setSubGroups([])
        }
      }
      fetchSubGroups()
    } else {
      setSubGroups([])
    }
  }, [selectedGroupId])

  // ==========================================
  // RENDERIZAÇÃO: Estrutura do formulário
  // ==========================================
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* ===== CARD 1: DADOS BÁSICOS ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Básicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* CAMPO 1: Nome do Cuidado */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Cuidado *</Label>
              <Input
                id="name"
                placeholder="Ex: Cuidado Pós-Operatório"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="acronym">Sigla</Label>
              <Input
                id="acronym"
                placeholder="Ex: CPO"
                {...register('acronym')}
              />
            </div>
          </div>

          {/* CAMPO 2 e 3: Tipo + Duração (lado a lado) */}
          <div className="grid gap-4 md:grid-cols-2">

            {/* CAMPO 2: Tipo de Cuidado (Dropdown) */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Cuidado *</Label>
              <Select
                defaultValue={defaultValues?.type}
                onValueChange={(value) => setValue('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CARE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* CAMPO 3: Duração Estimada (em dias) */}
            <div className="space-y-2">
              <Label htmlFor="minDeadlineDays">Duração Estimada (dias) *</Label>
              <Input
                id="minDeadlineDays"
                type="number"
                placeholder="Ex: 7, 15, 30"
                {...register('minDeadlineDays')}
              />
              {errors.minDeadlineDays && (
                <p className="text-sm text-destructive">{errors.minDeadlineDays.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Tempo médio de duração do cuidado
              </p>
            </div>
          </div>

          {/* CAMPO 4: Status (Dropdown) */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
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
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== CARD 2: CLASSIFICAÇÃO SUS ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Classificação SUS</CardTitle>
          <CardDescription>Dados para integração com o Sistema Único de Saúde</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Código SIGTAP */}
            <div className="space-y-2">
              <Label htmlFor="sigtapCode">Código SIGTAP</Label>
              <Input
                id="sigtapCode"
                placeholder="Ex: 0301010048"
                {...register('sigtapCode')}
              />
              <p className="text-xs text-muted-foreground">
                Código do procedimento na tabela SIGTAP
              </p>
            </div>

            {/* Grupo */}
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select
                defaultValue={defaultValues?.groupId?.toString() || 'none'}
                onValueChange={(value) => {
                  const id = value && value !== 'none' ? parseInt(value) : null
                  setValue('groupId', id)
                  setSelectedGroupId(id)
                  setValue('subGroupId', null) // Limpar subgrupo ao mudar grupo
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SubGrupo */}
            <div className="space-y-2">
              <Label>SubGrupo</Label>
              <Select
                defaultValue={defaultValues?.subGroupId?.toString() || 'none'}
                onValueChange={(value) => setValue('subGroupId', value && value !== 'none' ? parseInt(value) : null)}
                disabled={!selectedGroupId || subGroups.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedGroupId ? "Selecione o subgrupo" : "Selecione um grupo primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {subGroups.map((subGroup) => (
                    <SelectItem key={subGroup.id} value={subGroup.id.toString()}>
                      {subGroup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Complexidade */}
            <div className="space-y-2">
              <Label>Complexidade</Label>
              <Select
                defaultValue={defaultValues?.complexity}
                onValueChange={(value) => setValue('complexity', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLEXITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 150.00"
                {...register('value')}
              />
            </div>

            {/* Origem do Recurso */}
            <div className="space-y-2">
              <Label>Origem do Recurso</Label>
              <Select
                defaultValue={defaultValues?.resourceOrigin || 'NOT_SPECIFIED'}
                onValueChange={(value) => setValue('resourceOrigin', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_ORIGIN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== CARD 3: RESTRIÇÕES ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Restrições</CardTitle>
          <CardDescription>Critérios de elegibilidade para o procedimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Sexo */}
            <div className="space-y-2">
              <Label>Sexo Aplicável</Label>
              <Select
                defaultValue={defaultValues?.gender || 'BOTH'}
                onValueChange={(value) => setValue('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Idade Mínima */}
            <div className="space-y-2">
              <Label htmlFor="minAge">Idade Mínima</Label>
              <Input
                id="minAge"
                type="number"
                min="0"
                max="120"
                placeholder="Ex: 18"
                {...register('minAge')}
              />
            </div>

            {/* Idade Máxima */}
            <div className="space-y-2">
              <Label htmlFor="maxAge">Idade Máxima</Label>
              <Input
                id="maxAge"
                type="number"
                min="0"
                max="120"
                placeholder="Ex: 65"
                {...register('maxAge')}
              />
            </div>

            {/* Tempo de Permanência */}
            <div className="space-y-2">
              <Label htmlFor="stayTime">Permanência (dias)</Label>
              <Input
                id="stayTime"
                type="number"
                min="0"
                placeholder="Ex: 3"
                {...register('stayTime')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== CARD 4: CONFIGURAÇÕES PADRÃO ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Padrão</CardTitle>
          <CardDescription>Valores padrão para regulações com este cuidado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Fornecedor Padrão */}
            <div className="space-y-2">
              <Label>Fornecedor Padrão</Label>
              <Select
                defaultValue={defaultValues?.supplierId?.toString() || 'none'}
                onValueChange={(value) => setValue('supplierId', value && value !== 'none' ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unidade de Medida */}
            <div className="space-y-2">
              <Label>Unidade de Medida</Label>
              <Select
                defaultValue={defaultValues?.unitMeasure || 'UN'}
                onValueChange={(value) => setValue('unitMeasure', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_MEASURE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade Padrão */}
            <div className="space-y-2">
              <Label>Prioridade Padrão</Label>
              <Select
                defaultValue={defaultValues?.priority || 'ELECTIVE'}
                onValueChange={(value) => setValue('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== CARD 5: DESCRIÇÃO E PROTOCOLO ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Descrição e Protocolo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* CAMPO 5: Descrição (Textarea) */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o objetivo e contexto deste cuidado..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Explique para que serve este plano de cuidado
            </p>
          </div>

          {/* CAMPO 6: Protocolo/Procedimentos (Textarea grande) */}
          <div className="space-y-2">
            <Label htmlFor="protocol">Protocolo / Procedimentos *</Label>
            <Textarea
              id="protocol"
              placeholder="Liste os passos, procedimentos e ações que devem ser realizados..."
              rows={8}
              {...register('protocol')}
            />
            {errors.protocol && (
              <p className="text-sm text-destructive">{errors.protocol.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Detalhe as etapas e procedimentos a serem seguidos
            </p>
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
  )
}
