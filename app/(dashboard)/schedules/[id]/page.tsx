'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, StatusBadge, ConfirmDialog } from '@/components/shared'
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  MapPin,
  Edit,
  Trash2,
  ArrowLeft,
  Phone,
  CreditCard,
  Printer,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

interface ScheduleData {
  id: number
  status: string
  scheduledDate: string
  scheduledEndDate?: string | null
  notes?: string | null
  recurrenceType: string
  recurrenceInterval?: number | null
  recurrenceEndDate?: string | null
  createdAt: string
  professional?: {
    id: string
    name: string
  } | null
  regulation: {
    id: number
    protocolNumber?: string | null
    status: string
    priority: string
    clinicalIndication?: string | null
    cid?: string | null
    citizen: {
      id: number
      name: string
      cpf?: string | null
      birthDate?: string | null
    }
    cares: {
      care: {
        id: number
        name: string
        acronym?: string | null
      }
      quantity?: number
    }[]
  }
}

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'COMPLETED', label: 'Realizado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'NO_SHOW', label: 'Nao Compareceu' },
]

const RECURRENCE_LABELS: Record<string, string> = {
  NONE: 'Sem recorrencia',
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
}

const formatCPF = (cpf: string | null | undefined) => {
  if (!cpf) return '-'
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const formatDate = (dateStr: string | null | undefined, formatStr: string = 'dd/MM/yyyy') => {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), formatStr, { locale: ptBR })
  } catch {
    return '-'
  }
}

export default function ScheduleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = Array.isArray(params.id) ? params.id[0] : params.id

  const [schedule, setSchedule] = useState<ScheduleData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.get(`/schedules/${scheduleId}`)
        setSchedule(response.data || response)
      } catch (error) {
        console.error('Erro ao carregar agendamento:', error)
        toast.error('Erro ao carregar agendamento')
        router.push('/schedules')
      } finally {
        setIsLoading(false)
      }
    }

    if (scheduleId) {
      fetchSchedule()
    }
  }, [scheduleId, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/schedules/${scheduleId}`)
      toast.success('Agendamento excluido com sucesso')
      router.push('/schedules')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir agendamento')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    setIsUpdatingStatus(true)
    try {
      await apiClient.put(`/schedules/${scheduleId}`, {
        ...schedule,
        status: newStatus,
        scheduledDate: schedule?.scheduledDate,
        regulationId: schedule?.regulation?.id,
      })
      toast.success('Status atualizado com sucesso')
      setSchedule(prev => prev ? { ...prev, status: newStatus } : null)
      setStatusDialogOpen(false)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handlePrint = () => {
    window.print()
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
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Agendamento nao encontrado</p>
          <Link href="/schedules">
            <Button variant="link" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para agendamentos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const citizen = schedule.regulation.citizen

  return (
    <div className="container py-6 max-w-5xl print:max-w-full">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <PageHeader
          title={`Agendamento #${schedule.id}`}
          description={`${citizen.name} - ${formatDate(schedule.scheduledDate, "dd 'de' MMMM 'de' yyyy")}`}
          backHref="/schedules"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Data e Hora */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Data e Hora do Agendamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="text-xl font-bold">
                      {formatDate(schedule.scheduledDate, "dd 'de' MMMM 'de' yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horario</p>
                    <p className="text-xl font-bold">
                      {formatDate(schedule.scheduledDate, 'HH:mm')}
                      {schedule.scheduledEndDate && ` - ${formatDate(schedule.scheduledEndDate, 'HH:mm')}`}
                    </p>
                  </div>
                </div>
              </div>

              {schedule.recurrenceType !== 'NONE' && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    <RefreshCw className="inline h-4 w-4 mr-1" />
                    Recorrencia: {RECURRENCE_LABELS[schedule.recurrenceType] || schedule.recurrenceType}
                    {schedule.recurrenceInterval && schedule.recurrenceInterval > 1 && ` (a cada ${schedule.recurrenceInterval})`}
                  </p>
                  {schedule.recurrenceEndDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Ate: {formatDate(schedule.recurrenceEndDate)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Cidadao */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Dados do Cidadao</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium text-lg">{citizen.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium font-mono">{formatCPF(citizen.cpf)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                  <p className="font-medium">{formatDate(citizen.birthDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Regulacao</p>
                  <Link
                    href={`/regulations/${schedule.regulation.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    #{schedule.regulation.id}
                    {schedule.regulation.protocolNumber && ` - ${schedule.regulation.protocolNumber}`}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Procedimentos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <CardTitle>Procedimentos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {schedule.regulation.cares && schedule.regulation.cares.length > 0 ? (
                <div className="space-y-2">
                  {schedule.regulation.cares.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {item.care.acronym || '#'}
                        </Badge>
                        <span className="font-medium">{item.care.name}</span>
                      </div>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-sm text-muted-foreground">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum procedimento registrado</p>
              )}

              {schedule.regulation.clinicalIndication && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Indicacao Clinica</p>
                  <p className="mt-1">{schedule.regulation.clinicalIndication}</p>
                </div>
              )}

              {schedule.regulation.cid && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">CID</p>
                  <p className="font-mono font-medium">{schedule.regulation.cid}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Observacoes */}
          {schedule.notes && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Observacoes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{schedule.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 no-print">
          {/* Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status do Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge status={schedule.status} type="schedule" className="text-base" />
            </CardContent>
          </Card>

          {/* Profissional */}
          {schedule.professional && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Profissional Responsavel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{schedule.professional.name}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acoes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setNewStatus(schedule.status)
                  setStatusDialogOpen(true)
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Alterar Status
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/schedules/${schedule.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Agendamento
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Agendamento
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
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(schedule.createdAt, "dd/MM/yyyy 'as' HH:mm")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Confirmar Exclusao */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Agendamento"
        description={`Tem certeza que deseja excluir o agendamento de ${citizen.name}?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />

      {/* Dialog: Alterar Status */}
      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title="Alterar Status"
        description="Selecione o novo status do agendamento:"
        confirmLabel="Atualizar"
        onConfirm={handleStatusUpdate}
        isLoading={isUpdatingStatus}
      >
        <div className="grid grid-cols-2 gap-2 mt-4">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={newStatus === option.value ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setNewStatus(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </ConfirmDialog>
    </div>
  )
}
