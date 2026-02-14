'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/page-header'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  HardDrive,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Plus,
  Archive,
  Calendar,
  Settings,
  Loader2,
  Cloud,
} from 'lucide-react'

interface Backup {
  id: number
  filename: string
  key?: string
  size: number
  type: 'manual' | 'scheduled' | 'full'
  status: 'completed' | 'failed' | 'in_progress'
  createdAt: string
  createdBy?: string
}

interface BackupStats {
  totalBackups: number
  totalSize: number
  lastBackup: string | null
  storageType?: string
  bucket?: string
  prefix?: string
  autoBackupEnabled: boolean
  retentionDays: number
}

interface BackupConfig {
  enabled: boolean
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  type: 'database' | 'full'
  retentionDays: number
  notifyOnComplete: boolean
  notifyOnError: boolean
  notifyEmail?: string
  lastRun?: string
  nextRun?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`
  if (diffHours > 0) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`
  return 'Agora mesmo'
}

export default function AdminBackupsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [backups, setBackups] = useState<Backup[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteBackup, setDeleteBackup] = useState<Backup | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Auto backup config
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [config, setConfig] = useState<BackupConfig | null>(null)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [configForm, setConfigForm] = useState({
    enabled: false,
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '03:00',
    dayOfWeek: 0,
    dayOfMonth: 1,
    type: 'database' as 'database' | 'full',
    retentionDays: 30,
    notifyOnError: true,
  })

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user?.isSystemManager) {
      router.push('/')
      return
    }
    fetchBackups()
    fetchConfig()
  }, [session, sessionStatus, router])

  const fetchBackups = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/backups')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups)
        setStats(data.stats)
      } else {
        toast.error('Erro ao carregar backups')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar backups')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/backups/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        if (data.config) {
          setConfigForm({
            enabled: data.config.enabled,
            frequency: data.config.schedule?.frequency || 'daily',
            time: data.config.schedule?.time || '03:00',
            dayOfWeek: data.config.schedule?.dayOfWeek ?? 0,
            dayOfMonth: data.config.schedule?.dayOfMonth ?? 1,
            type: data.config.type || 'database',
            retentionDays: data.config.retentionDays || 30,
            notifyOnError: data.config.notifyOnError !== false,
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar config:', error)
    }
  }

  const handleSaveConfig = async () => {
    setIsSavingConfig(true)
    try {
      const response = await fetch('/api/admin/backups/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: configForm.enabled,
          schedule: {
            frequency: configForm.frequency,
            time: configForm.time,
            dayOfWeek: configForm.dayOfWeek,
            dayOfMonth: configForm.dayOfMonth,
          },
          type: configForm.type,
          retentionDays: configForm.retentionDays,
          notifyOnError: configForm.notifyOnError,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setConfig(data.config)
        setShowConfigDialog(false)
        fetchBackups()
      } else {
        toast.error(data.error || 'Erro ao salvar configuração')
      }
    } catch {
      toast.error('Erro ao salvar configuração')
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleCreateBackup = async (type: 'database' | 'full') => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchBackups()
      } else {
        toast.error(data.error || 'Erro ao criar backup')
      }
    } catch {
      toast.error('Erro ao criar backup')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteBackup) return

    setIsDeleting(true)
    try {
      const params = deleteBackup.key
        ? `key=${encodeURIComponent(deleteBackup.key)}`
        : `filename=${encodeURIComponent(deleteBackup.filename)}`

      const response = await fetch(`/api/admin/backups?${params}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Backup removido com sucesso')
        fetchBackups()
      } else {
        toast.error(data.error || 'Erro ao remover backup')
      }
    } catch {
      toast.error('Erro ao remover backup')
    } finally {
      setIsDeleting(false)
      setDeleteBackup(null)
    }
  }

  const handleDownload = async (backup: Backup) => {
    try {
      const params = backup.key
        ? `key=${encodeURIComponent(backup.key)}`
        : `filename=${encodeURIComponent(backup.filename)}`

      const response = await fetch(`/api/admin/backups/download?${params}`)
      const data = await response.json()

      if (response.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
        toast.success(`Download de ${backup.filename} iniciado`)
      } else {
        toast.error('Erro ao gerar link de download')
      }
    } catch {
      toast.error('Erro ao baixar backup')
    }
  }

  if (sessionStatus === 'loading' || isLoading) {
    return <CardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Gestão de Backups"
          description="Backup e recuperação do sistema"
          icon={Database}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConfigDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button variant="outline" onClick={fetchBackups} disabled={isCreating}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isCreating}>
                {isCreating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Novo Backup
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreateBackup('database')}>
                <Database className="h-4 w-4 mr-2" />
                Backup Parcial
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBackup('full')}>
                <Archive className="h-4 w-4 mr-2" />
                Backup Completo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBackups}</div>
              <p className="text-xs text-muted-foreground">
                Arquivos no S3
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Espaço Usado</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                Em backups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastBackup ? getTimeSince(stats.lastBackup) : 'Nunca'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.lastBackup ? formatDate(stats.lastBackup) : 'Nenhum backup realizado'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto Backup</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {config?.enabled ? (
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Desativado</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {config?.enabled && config?.nextRun
                  ? `Próximo: ${formatDate(config.nextRun)}`
                  : 'Clique em Configurar'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Config Card */}
      {config?.enabled && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              Backup Automático Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <span className="text-muted-foreground">Frequência:</span>
                <p className="font-medium">
                  {config.schedule.frequency === 'daily' && 'Diário'}
                  {config.schedule.frequency === 'weekly' && `Semanal (${DAYS_OF_WEEK.find(d => d.value === config.schedule.dayOfWeek)?.label})`}
                  {config.schedule.frequency === 'monthly' && `Mensal (dia ${config.schedule.dayOfMonth})`}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Horário:</span>
                <p className="font-medium">{config.schedule.time}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-medium">{config.type === 'full' ? 'Completo' : 'Parcial'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Retenção:</span>
                <p className="font-medium">{config.retentionDays} dias</p>
              </div>
            </div>
            {config.lastRun && (
              <p className="text-xs text-muted-foreground mt-4">
                Última execução: {formatDate(config.lastRun)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Storage Info */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Armazenamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <p className="font-medium">{stats.storageType || 'S3'}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <span className="text-sm text-muted-foreground">Bucket</span>
                <p className="font-mono text-sm">{stats.bucket || 'nextsaude-uploads'}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <span className="text-sm text-muted-foreground">Pasta</span>
                <p className="font-mono text-sm">{stats.prefix || 'backups/'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Backups Disponíveis</CardTitle>
          <CardDescription>Lista de todos os backups no S3</CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <EmptyState
              icon={Database}
              title="Nenhum backup encontrado"
              description="Crie um backup para proteger seus dados"
            />
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {backup.type === 'full' ? (
                            <Archive className="h-4 w-4 text-purple-500" />
                          ) : backup.type === 'scheduled' ? (
                            <Calendar className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Database className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-mono text-sm">{backup.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {backup.type === 'full' && 'Completo'}
                          {backup.type === 'scheduled' && 'Agendado'}
                          {backup.type === 'manual' && 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatBytes(backup.size)}</TableCell>
                      <TableCell>
                        {backup.status === 'completed' ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Concluído
                          </Badge>
                        ) : backup.status === 'in_progress' ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Em progresso
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Falhou
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatDate(backup.createdAt)}</p>
                          <p className="text-xs text-muted-foreground">{getTimeSince(backup.createdAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(backup)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteBackup(backup)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cron Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Cron Job</CardTitle>
          <CardDescription>Para ativar backup automático, configure um cron job</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Exemplo de Cron (a cada hora)</h4>
            <code className="text-sm block bg-background p-2 rounded border break-all">
              0 * * * * curl -X POST -H "x-cron-secret: SEU_CRON_SECRET" https://seu-dominio.com/api/admin/backups/scheduled
            </code>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Variável de Ambiente</span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Configure <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">CRON_SECRET</code> no seu .env para autenticar o cron job.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="w-[95vw] max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Configurar Backup Automático</DialogTitle>
            <DialogDescription>
              Configure quando os backups devem ser executados automaticamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Ativar Backup Automático</Label>
                <p className="text-sm text-muted-foreground">Executar backups de forma programada</p>
              </div>
              <Switch
                checked={configForm.enabled}
                onCheckedChange={(checked) => setConfigForm({ ...configForm, enabled: checked })}
              />
            </div>

            {configForm.enabled && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select
                      value={configForm.frequency}
                      onValueChange={(value: any) => setConfigForm({ ...configForm, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={configForm.time}
                      onChange={(e) => setConfigForm({ ...configForm, time: e.target.value })}
                    />
                  </div>
                </div>

                {configForm.frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Dia da Semana</Label>
                    <Select
                      value={String(configForm.dayOfWeek)}
                      onValueChange={(value) => setConfigForm({ ...configForm, dayOfWeek: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {configForm.frequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Dia do Mês</Label>
                    <Select
                      value={String(configForm.dayOfMonth)}
                      onValueChange={(value) => setConfigForm({ ...configForm, dayOfMonth: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={String(day)}>
                            Dia {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de Backup</Label>
                    <Select
                      value={configForm.type}
                      onValueChange={(value: any) => setConfigForm({ ...configForm, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="database">Parcial (essenciais)</SelectItem>
                        <SelectItem value="full">Completo (todas tabelas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Retenção (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={configForm.retentionDays}
                      onChange={(e) => setConfigForm({ ...configForm, retentionDays: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificar em caso de erro</Label>
                    <p className="text-sm text-muted-foreground">Receber alerta se o backup falhar</p>
                  </div>
                  <Switch
                    checked={configForm.notifyOnError}
                    onCheckedChange={(checked) => setConfigForm({ ...configForm, notifyOnError: checked })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveConfig} disabled={isSavingConfig}>
              {isSavingConfig ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteBackup}
        onOpenChange={() => setDeleteBackup(null)}
        title="Excluir Backup"
        description={`Tem certeza que deseja excluir o backup "${deleteBackup?.filename}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  )
}


