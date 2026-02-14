'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, ConfirmDialog } from '@/components/shared'
import {
  Stethoscope,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

interface CareData {
  id: number
  name: string
  description?: string | null
  acronym?: string | null
  status: string
  sigtapCode?: string | null
  complexity?: string | null
  gender?: string | null
  stayTime?: string | null
  value?: number | null
  resourceOrigin?: string | null
  priority?: string | null
  unitMeasure?: string | null
  minDeadlineDays?: number | null
  minAge?: number | null
  maxAge?: number | null
  groupId?: number | null
  subGroupId?: number | null
  supplierId?: number | null
  createdAt: string
  updatedAt: string
}

const COMPLEXITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
}

const PRIORITY_LABELS: Record<string, string> = {
  EMERGENCY: 'Emergencia',
  URGENCY: 'Urgencia',
  ELECTIVE: 'Eletiva',
}

const RESOURCE_ORIGIN_LABELS: Record<string, string> = {
  FEDERAL: 'Federal',
  STATE: 'Estadual',
  MUNICIPAL: 'Municipal',
  NOT_SPECIFIED: 'Nao Especificado',
}

const GENDER_LABELS: Record<string, string> = {
  M: 'Masculino',
  F: 'Feminino',
  BOTH: 'Ambos',
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function CareDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const careId = Array.isArray(params.id) ? params.id[0] : params.id

  const [care, setCare] = useState<CareData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchCare = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.get(`/care/${careId}`)
        setCare(response.data || response)
      } catch (error) {
        console.error('Erro ao carregar cuidado:', error)
        toast.error('Erro ao carregar cuidado')
        router.push('/care')
      } finally {
        setIsLoading(false)
      }
    }

    if (careId) {
      fetchCare()
    }
  }, [careId, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/care/${careId}`)
      toast.success('Cuidado excluido com sucesso')
      router.push('/care')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir cuidado')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!care) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cuidado nao encontrado</p>
          <Link href="/care">
            <Button variant="link" className="mt-4">Voltar para cuidados</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          title={care.name}
          description={care.acronym ? `Codigo: ${care.acronym}` : 'Detalhes do cuidado'}
          backHref="/care"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Informacoes Gerais */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <CardTitle>Informacoes Gerais</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{care.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Codigo/Sigla</p>
                  <p className="font-mono font-medium">{care.acronym || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Codigo SIGTAP</p>
                  <p className="font-mono font-medium">{care.sigtapCode || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={care.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {care.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                {care.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Descricao</p>
                    <p className="mt-1">{care.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card: Caracteristicas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <CardTitle>Caracteristicas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Complexidade</p>
                  <p className="font-medium">
                    {care.complexity ? COMPLEXITY_LABELS[care.complexity] || care.complexity : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prioridade</p>
                  <p className="font-medium">
                    {care.priority ? PRIORITY_LABELS[care.priority] || care.priority : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Origem do Recurso</p>
                  <p className="font-medium">
                    {care.resourceOrigin ? RESOURCE_ORIGIN_LABELS[care.resourceOrigin] || care.resourceOrigin : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Genero</p>
                  <p className="font-medium">
                    {care.gender ? GENDER_LABELS[care.gender] || care.gender : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unidade de Medida</p>
                  <p className="font-medium">{care.unitMeasure || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de Permanencia</p>
                  <p className="font-medium">{care.stayTime || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Restricoes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Restricoes de Idade</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Idade Minima</p>
                  <p className="font-medium">
                    {care.minAge !== null && care.minAge !== undefined ? `${care.minAge} anos` : 'Sem restricao'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Idade Maxima</p>
                  <p className="font-medium">
                    {care.maxAge !== null && care.maxAge !== undefined ? `${care.maxAge} anos` : 'Sem restricao'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prazo Minimo</p>
                  <p className="font-medium">
                    {care.minDeadlineDays !== null && care.minDeadlineDays !== undefined
                      ? `${care.minDeadlineDays} dias`
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Valor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(care.value)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Acoes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/care/${care.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Cuidado
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Cuidado
              </Button>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Informacoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-medium">#{care.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(care.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{formatDate(care.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Confirmar Exclusao */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Cuidado"
        description={`Tem certeza que deseja excluir o cuidado "${care.name}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
