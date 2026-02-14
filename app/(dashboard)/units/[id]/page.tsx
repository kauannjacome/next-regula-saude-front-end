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
  Building,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Hash,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

interface UnitData {
  id: number
  name: string
  type?: string | null
  cnes?: string | null
  phone?: string | null
  email?: string | null
  postalCode?: string | null
  address?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  createdAt: string
  updatedAt: string
  // Horário de funcionamento
  mondayOpen?: string | null
  mondayClose?: string | null
  tuesdayOpen?: string | null
  tuesdayClose?: string | null
  wednesdayOpen?: string | null
  wednesdayClose?: string | null
  thursdayOpen?: string | null
  thursdayClose?: string | null
  fridayOpen?: string | null
  fridayClose?: string | null
  saturdayOpen?: string | null
  saturdayClose?: string | null
  sundayOpen?: string | null
  sundayClose?: string | null
  operatingNotes?: string | null
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const

const UNIT_TYPE_LABELS: Record<string, string> = {
  HOSPITAL: 'Hospital',
  UBS: 'UBS - Unidade Basica de Saude',
  UPA: 'UPA - Unidade de Pronto Atendimento',
  CLINIC: 'Clinica',
  LABORATORY: 'Laboratorio',
  PHARMACY: 'Farmacia',
  OTHER: 'Outro',
}

const formatPhone = (phone: string | null | undefined) => {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function UnitDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const unitId = Array.isArray(params.id) ? params.id[0] : params.id

  const [unit, setUnit] = useState<UnitData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.get(`/units/${unitId}`)
        setUnit(response.data || response)
      } catch (error) {
        console.error('Erro ao carregar unidade:', error)
        toast.error('Erro ao carregar unidade')
        router.push('/units')
      } finally {
        setIsLoading(false)
      }
    }

    if (unitId) {
      fetchUnit()
    }
  }, [unitId, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/units/${unitId}`)
      toast.success('Unidade excluida com sucesso')
      router.push('/units')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir unidade')
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

  if (!unit) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unidade nao encontrada</p>
          <Link href="/units">
            <Button variant="link" className="mt-4">Voltar para unidades</Button>
          </Link>
        </div>
      </div>
    )
  }

  const hasAddress = unit.address || unit.city || unit.state

  return (
    <div className="container py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          title={unit.name}
          description={unit.type ? UNIT_TYPE_LABELS[unit.type] || unit.type : 'Detalhes da unidade'}
          backHref="/units"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Dados da Unidade */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle>Dados da Unidade</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{unit.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant="outline">
                    {unit.type ? UNIT_TYPE_LABELS[unit.type] || unit.type : 'Nao especificado'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNES</p>
                  <p className="font-mono font-medium">{unit.cnes || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Contato */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <CardTitle>Contato</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{formatPhone(unit.phone)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">
                      {unit.email ? (
                        <a href={`mailto:${unit.email}`} className="text-primary hover:underline">
                          {unit.email}
                        </a>
                      ) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Endereco */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Endereco</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {hasAddress ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">CEP</p>
                    <p className="font-medium">{unit.postalCode || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Logradouro</p>
                    <p className="font-medium">
                      {unit.address || '-'}
                      {unit.number && `, ${unit.number}`}
                      {unit.complement && ` - ${unit.complement}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bairro</p>
                    <p className="font-medium">{unit.neighborhood || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cidade/Estado</p>
                    <p className="font-medium">
                      {unit.city || '-'}
                      {unit.state && ` - ${unit.state}`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Endereco nao cadastrado</p>
              )}
            </CardContent>
          </Card>

          {/* Card: Horario de Funcionamento */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Horário de Funcionamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const openKey = `${day.key}Open` as keyof UnitData
                  const closeKey = `${day.key}Close` as keyof UnitData
                  const openTime = unit[openKey] as string | null | undefined
                  const closeTime = unit[closeKey] as string | null | undefined
                  const isClosed = !openTime && !closeTime

                  return (
                    <div key={day.key} className="flex items-center justify-between py-1 border-b last:border-0">
                      <span className="font-medium text-sm">{day.label}</span>
                      <span className={`text-sm ${isClosed ? 'text-muted-foreground' : ''}`}>
                        {isClosed ? 'Fechado' : `${openTime || '--:--'} às ${closeTime || '--:--'}`}
                      </span>
                    </div>
                  )
                })}
                {unit.operatingNotes && (
                  <div className="pt-3 mt-3 border-t">
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="text-sm mt-1">{unit.operatingNotes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Acoes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/units/${unit.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Unidade
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Unidade
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
                <p className="font-medium">#{unit.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(unit.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{formatDate(unit.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Confirmar Exclusao */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Unidade"
        description={`Tem certeza que deseja excluir a unidade "${unit.name}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
