'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Clock,
  Play,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Calendar,
  History,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RoutineExecution {
  id: number
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  startedAt: string
  finishedAt: string | null
  duration: number | null
  triggeredBy: string | null
  error: string | null
}

interface Routine {
  id: number
  name: string
  displayName: string
  description: string | null
  cronExpr: string
  cronHuman: string
  isEnabled: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  available: boolean
  lastExecutions: RoutineExecution[]
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [editCronExpr, setEditCronExpr] = useState('')
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState<Routine | null>(null)

  const fetchRoutines = async () => {
    try {
      const response = await fetch('/api/admin/routines')
      if (response.ok) {
        const data = await response.json()
        setRoutines(data)
      } else {
        toast.error('Erro ao carregar rotinas')
      }
    } catch {
      toast.error('Erro ao carregar rotinas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutines()
  }, [])

  const handleExecute = async (name: string) => {
    setExecuting(name)
    try {
      const response = await fetch(`/api/admin/routines/${name}`, {
        method: 'POST'
      })
      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        fetchRoutines()
      } else {
        toast.error(result.error || 'Erro ao executar rotina')
      }
    } catch {
      toast.error('Erro ao executar rotina')
    } finally {
      setExecuting(null)
    }
  }

  const handleToggle = async (routine: Routine) => {
    try {
      const response = await fetch(`/api/admin/routines/${routine.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !routine.isEnabled })
      })

      if (response.ok) {
        toast.success(`Rotina ${!routine.isEnabled ? 'habilitada' : 'desabilitada'}`)
        fetchRoutines()
      } else {
        toast.error('Erro ao atualizar rotina')
      }
    } catch {
      toast.error('Erro ao atualizar rotina')
    }
  }

  const handleSaveCron = async () => {
    if (!editingRoutine) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/routines/${editingRoutine.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cronExpr: editCronExpr })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Horário atualizado com sucesso')
        setEditingRoutine(null)
        fetchRoutines()
      } else {
        toast.error(result.error || 'Erro ao atualizar')
      }
    } catch {
      toast.error('Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: RoutineExecution['status']) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Sucesso</Badge>
      case 'FAILED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>
      case 'RUNNING':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Executando</Badge>
      case 'CANCELLED':
        return <Badge variant="outline">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rotinas do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie tarefas programadas e automatizadas
          </p>
        </div>
        <Button variant="outline" onClick={fetchRoutines}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {routines.map(routine => (
          <Card key={routine.id} className={!routine.isEnabled ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{routine.displayName}</CardTitle>
                    {!routine.available && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Não disponível
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{routine.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={routine.isEnabled}
                    onCheckedChange={() => handleToggle(routine)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Agendamento */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Agendamento</p>
                    <p className="text-xs text-muted-foreground">{routine.cronHuman}</p>
                    <code className="text-xs text-muted-foreground">{routine.cronExpr}</code>
                  </div>
                </div>

                {/* Última execução */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Última execução</p>
                    <p className="text-xs text-muted-foreground">
                      {routine.lastRunAt
                        ? formatDistanceToNow(new Date(routine.lastRunAt), { addSuffix: true, locale: ptBR })
                        : 'Nunca executada'}
                    </p>
                  </div>
                </div>

                {/* Próxima execução */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Próxima execução</p>
                    <p className="text-xs text-muted-foreground">
                      {routine.nextRunAt && routine.isEnabled
                        ? formatDistanceToNow(new Date(routine.nextRunAt), { addSuffix: true, locale: ptBR })
                        : 'Não agendada'}
                    </p>
                  </div>
                </div>

                {/* Status última execução */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {routine.lastExecutions[0] ? (
                    <>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Último status</p>
                        <div className="mt-1">
                          {getStatusBadge(routine.lastExecutions[0].status)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem execuções</p>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button
                  size="sm"
                  onClick={() => handleExecute(routine.name)}
                  disabled={executing === routine.name || !routine.available}
                >
                  {executing === routine.name ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Executar agora
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingRoutine(routine)
                    setEditCronExpr(routine.cronExpr)
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHistory(routine)}
                >
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de configuração */}
      <Dialog open={!!editingRoutine} onOpenChange={() => setEditingRoutine(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Rotina</DialogTitle>
            <DialogDescription>
              {editingRoutine?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expressão Cron</Label>
              <Input
                value={editCronExpr}
                onChange={(e) => setEditCronExpr(e.target.value)}
                placeholder="0 3 * * *"
              />
              <p className="text-xs text-muted-foreground">
                Formato: minuto hora dia mês diaSemana
              </p>
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
              <p className="font-medium">Exemplos:</p>
              <ul className="text-muted-foreground text-xs space-y-1">
                <li><code>0 3 * * *</code> - Todo dia às 3h</li>
                <li><code>0 0 1 * *</code> - Todo dia 1 à meia-noite</li>
                <li><code>0 0 1 1 *</code> - 1º de janeiro à meia-noite</li>
                <li><code>*/30 * * * *</code> - A cada 30 minutos</li>
                <li><code>0 */6 * * *</code> - A cada 6 horas</li>
                <li><code>0 4 * * 0</code> - Todo domingo às 4h</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRoutine(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCron} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de histórico */}
      <Dialog open={!!showHistory} onOpenChange={() => setShowHistory(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Execuções</DialogTitle>
            <DialogDescription>
              {showHistory?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Disparado por</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showHistory?.lastExecutions.map(exec => (
                  <TableRow key={exec.id}>
                    <TableCell>{getStatusBadge(exec.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(exec.startedAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDuration(exec.duration)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {exec.triggeredBy === 'scheduler' ? 'Automático' : 'Manual'}
                    </TableCell>
                    <TableCell className="text-sm text-destructive max-w-xs truncate">
                      {exec.error || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {showHistory?.lastExecutions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma execução registrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
