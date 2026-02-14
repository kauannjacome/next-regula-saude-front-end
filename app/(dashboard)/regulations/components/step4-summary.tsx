'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, ClipboardList, FileText, Edit, Check } from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/shared'

interface Citizen {
  id?: string
  name: string
  cpf: string
  birthDate: string
  phone: string
}

interface SelectedCare {
  careId: number
  name: string
  acronym?: string | null
  quantity: number
  unitMeasure?: string | null
}

interface Step2Data {
  requestingProfessional: string
  requestDate: string
  notes: string
  clinicalIndication: string
  cid: string
  cares: SelectedCare[]
}

interface Step3Data {
  status: string
  folderId?: string
  priority: string
  templateId?: string
  analyzerId?: string
  supplierId?: string
  resourceOrigin?: string
}

interface RegulationDocument {
  id: string
  file: File
  name: string
  size: number
  type: string
  tag?: string
}

interface Step4SummaryProps {
  citizen: Citizen | null
  responsible: Citizen | null
  relationship: string | null
  step2Data: Step2Data
  step3Data: Step3Data
  documents: RegulationDocument[]
  onEditStep: (step: number) => void
  subscriberId?: string | null
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  PARENT: 'Pai/Mae',
  SPOUSE: 'Conjuge',
  CAREGIVER: 'Cuidador(a)',
  SIBLING: 'Irmao(a)',
  UNCLE_AUNT: 'Tio(a)',
  COUSIN: 'Primo(a)',
  NEPHEW_NIECE: 'Sobrinho(a)',
  BOYFRIEND_GIRLFRIEND: 'Namorado(a)',
  FRIEND: 'Amigo(a)',
}

const RESOURCE_ORIGIN_LABELS: Record<string, string> = {
  MUNICIPAL: 'Municipal',
  NOT_SPECIFIED: 'Nao especificado',
  FEDERAL: 'Federal',
  STATE: 'Estadual',
}

const UNIT_MEASURE_LABELS: Record<string, string> = {
  MG: 'mg',
  G: 'g',
  MCG: 'mcg',
  KG: 'kg',
  ML: 'ml',
  L: 'L',
  AMP: 'Ampola',
  COMP: 'Comprimido',
  CAPS: 'Capsula',
  FR: 'Frasco',
  TUB: 'Tubo',
  DOSE: 'Dose',
  UI: 'UI',
  CX: 'Caixa',
  UN: 'Unidade',
  SESSION: 'Sessao',
  DAILY: 'Diario',
  MEASURE: 'Medida',
  OINTMENT: 'Pomada',
  CREAM: 'Creme',
  GEL: 'Gel',
}

const formatUnitMeasure = (value?: string | null) => {
  if (!value) return '-'
  return UNIT_MEASURE_LABELS[value] || value
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR')
}

export function Step4Summary({
  citizen,
  responsible,
  relationship,
  step2Data,
  step3Data,
  documents,
  onEditStep,
  subscriberId,
}: Step4SummaryProps) {
  const [foldersMap, setFoldersMap] = useState<Record<string, string>>({})
  const [templatesMap, setTemplatesMap] = useState<Record<string, string>>({})
  const [usersMap, setUsersMap] = useState<Record<string, string>>({})
  const [suppliersMap, setSuppliersMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [foldersRes, suppliersRes, usersRes] = await Promise.all([
          fetch('/api/folders'),
          fetch('/api/suppliers'),
          fetch('/api/users?limit=100'),
        ])

        if (foldersRes.ok) {
          const data = await foldersRes.json()
          const items = Array.isArray(data) ? data : data.data || []
          const map: Record<string, string> = {}
          items.forEach((item: { id: number | string; name: string }) => {
            map[String(item.id)] = item.name
          })
          setFoldersMap(map)
        }

        if (suppliersRes.ok) {
          const data = await suppliersRes.json()
          const items = Array.isArray(data) ? data : data.data || []
          const map: Record<string, string> = {}
          items.forEach((item: { id: number | string; name: string }) => {
            map[String(item.id)] = item.name
          })
          setSuppliersMap(map)
        }

        if (usersRes.ok) {
          const result = await usersRes.json()
          const items = result.data || result || []
          const map: Record<string, string> = {}
          items.forEach((item: { id: string; name?: string; email?: string }) => {
            map[item.id] = item.name || item.email || ''
          })
          setUsersMap(map)
        }
      } catch (error) {
        console.error('Erro ao buscar metadados:', error)
      }
    }

    fetchMetadata()
  }, [])

  useEffect(() => {
    if (!subscriberId) return
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`/api/templates?subscriberId=${subscriberId}`)
        if (!response.ok) return
        const data = await response.json()
        const items = Array.isArray(data) ? data : data.data || []
        const map: Record<string, string> = {}
        items.forEach((item: { id: number | string; name: string }) => {
          map[String(item.id)] = item.name
        })
        setTemplatesMap(map)
      } catch (error) {
        console.error('Erro ao buscar templates:', error)
      }
    }
    fetchTemplates()
  }, [subscriberId])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
        <Check className="h-5 w-5 text-green-600" />
        <p className="text-sm text-green-800">
          Revise as informacoes antes de finalizar a regulacao
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados do Cidadao
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEditStep(1)}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {citizen ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{citizen.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{citizen.cpf}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                <p className="font-medium">{citizen.birthDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{citizen.phone}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum cidadao selecionado</p>
          )}

          {responsible && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Responsavel</p>
              <p className="font-medium">{responsible.name}</p>
              {relationship && (
                <p className="text-sm text-muted-foreground">
                  Relacao: {RELATIONSHIP_LABELS[relationship] || relationship}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Dados da Solicitacao
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEditStep(2)}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Data da Solicitacao</p>
              <p className="font-medium">{formatDate(step2Data.requestDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profissional Solicitante</p>
              <p className="font-medium">{step2Data.requestingProfessional || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Indicacao Clinica</p>
              <p className="font-medium">{step2Data.clinicalIndication || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CID</p>
              <p className="font-medium">{step2Data.cid || '-'}</p>
            </div>
            {step2Data.notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Observacoes</p>
                <p className="font-medium">{step2Data.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Cuidados selecionados</p>
            {step2Data.cares.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cuidado informado</p>
            ) : (
              <div className="space-y-2">
                {step2Data.cares.map((care) => (
                  <div key={care.careId} className="flex items-center justify-between rounded-md border p-2">
                    <div>
                      <p className="font-medium">
                        {care.acronym ? `${care.acronym} - ${care.name}` : care.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Unidade: {formatUnitMeasure(care.unitMeasure)}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">Qtd: {care.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Regulação
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEditStep(3)}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={step3Data.status} type="regulation" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Prioridade</p>
            <PriorityBadge priority={step3Data.priority} showLabel={false} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pasta</p>
            <p className="font-medium">{foldersMap[step3Data.folderId || ''] || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Template</p>
            <p className="font-medium">{templatesMap[step3Data.templateId || ''] || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Responsavel Analise</p>
            <p className="font-medium">{usersMap[step3Data.analyzerId || ''] || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fornecedor</p>
            <p className="font-medium">{suppliersMap[step3Data.supplierId || ''] || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Origem do recurso</p>
            <p className="font-medium">{RESOURCE_ORIGIN_LABELS[step3Data.resourceOrigin || ''] || '-'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Anexados
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEditStep(3)}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{doc.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum documento anexado</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
