'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import {
  Cog,
  Database,
  Cloud,
  Mail,
  MessageCircle,
  Server,
  Cpu,
  HardDrive,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  Building2,
  FileText,
  Heart,
  Activity,
} from 'lucide-react'

interface SettingsData {
  services: {
    database: { status: string; message: string }
    s3: { status: string; message: string }
    smtp: { status: string; message: string }
    whatsapp: { status: string; message: string }
  }
  systemInfo: {
    nodeVersion: string
    platform: string
    arch: string
    uptime: number
    memory: { total: number; free: number; used: number }
    cpus: number
    hostname: string
  }
  database: {
    users: number
    subscribers: number
    regulations: number
    citizens: number
    auditLogs: number
  }
  config: {
    nodeEnv: string
    nextAuthUrl: string
    databaseUrl: string
    s3Region: string
    s3Bucket: string
    smtpHost: string
    smtpPort: string
    smtpFrom: string
    googleAuthEnabled: boolean
  }
}

const statusIcons: Record<string, any> = {
  connected: CheckCircle,
  configured: CheckCircle,
  not_configured: AlertTriangle,
  error: XCircle,
  unknown: AlertTriangle,
}

const statusColors: Record<string, string> = {
  connected: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  configured: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  not_configured: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  error: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  unknown: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(2)} GB`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  return parts.join(' ') || '< 1m'
}

export default function AdminSettingsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [data, setData] = useState<SettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user?.isSystemManager) {
      router.push('/')
      return
    }
    fetchSettings()
  }, [session, sessionStatus, router])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast.error('Erro ao carregar configurações')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  if (sessionStatus === 'loading' || isLoading) {
    return <CardSkeleton />
  }

  if (!data) {
    return null
  }

  const memoryUsagePercent = (data.systemInfo.memory.used / data.systemInfo.memory.total) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Configurações do Sistema"
          description="Status e configurações globais"
          icon={Cog}
        />
        <Button variant="outline" onClick={() => { setIsLoading(true); fetchSettings(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Status dos Serviços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Status dos Serviços
          </CardTitle>
          <CardDescription>Conexões e integrações do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.services).map(([name, service]) => {
              const StatusIcon = statusIcons[service.status] || AlertTriangle
              const colorClass = statusColors[service.status] || statusColors.unknown
              const icons: Record<string, any> = {
                database: Database,
                s3: Cloud,
                smtp: Mail,
                whatsapp: MessageCircle,
              }
              const ServiceIcon = icons[name] || Server

              return (
                <div key={name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ServiceIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium capitalize">{name}</span>
                    </div>
                    <Badge variant="secondary" className={colorClass}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {service.status === 'connected' || service.status === 'configured' ? 'OK' : 'Pendente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{service.message}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Node.js</p>
                <p className="font-medium">{data.systemInfo.nodeVersion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plataforma</p>
                <p className="font-medium">{data.systemInfo.platform} ({data.systemInfo.arch})</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPUs</p>
                <p className="font-medium">{data.systemInfo.cpus} cores</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hostname</p>
                <p className="font-medium">{data.systemInfo.hostname}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Memória
                </p>
                <span className="text-sm font-medium">{memoryUsagePercent.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${memoryUsagePercent > 80 ? 'bg-red-500' : memoryUsagePercent > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${memoryUsagePercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(data.systemInfo.memory.used)} / {formatBytes(data.systemInfo.memory.total)}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uptime:</span>
              <span className="text-sm font-medium">{formatUptime(data.systemInfo.uptime)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Usuários</span>
                </div>
                <p className="text-2xl font-bold">{data.database.users.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Assinantes</span>
                </div>
                <p className="text-2xl font-bold">{data.database.subscribers.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Regulações</span>
                </div>
                <p className="text-2xl font-bold">{data.database.regulations.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cidadãos</span>
                </div>
                <p className="text-2xl font-bold">{data.database.citizens.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Logs de auditoria:</span>
              <span className="text-sm font-medium">{data.database.auditLogs.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Variáveis de Ambiente</CardTitle>
          <CardDescription>Configurações do ambiente (valores sensíveis ocultados)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">NODE_ENV</p>
              <p className="font-mono text-sm">{data.config.nodeEnv}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">NEXTAUTH_URL</p>
              <p className="font-mono text-sm truncate">{data.config.nextAuthUrl}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">DATABASE_URL</p>
              <Badge variant="secondary" className={data.config.databaseUrl === 'Configurado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                {data.config.databaseUrl}
              </Badge>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">AWS_REGION</p>
              <p className="font-mono text-sm">{data.config.s3Region}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">AWS_S3_BUCKET</p>
              <p className="font-mono text-sm">{data.config.s3Bucket}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">SMTP_HOST</p>
              <p className="font-mono text-sm">{data.config.smtpHost}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">SMTP_PORT</p>
              <p className="font-mono text-sm">{data.config.smtpPort}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">SMTP_FROM</p>
              <p className="font-mono text-sm">{data.config.smtpFrom}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">Google Auth</p>
              <Badge variant="secondary" className={data.config.googleAuthEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {data.config.googleAuthEnabled ? 'Habilitado' : 'Desabilitado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
