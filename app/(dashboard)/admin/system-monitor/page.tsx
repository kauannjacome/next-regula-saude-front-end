'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/shared';
import { Server, Database, HardDrive, Cpu, MemoryStick, RefreshCw, CheckCircle, AlertTriangle, XCircle, Users } from 'lucide-react';
import { TrashSection } from '@/components/admin/trash-section';

const recentLogs = [
  { time: '14:32:15', level: 'info', message: 'Backup automático concluído com sucesso' },
  { time: '14:28:45', level: 'warning', message: 'Alta latência detectada no serviço de email' },
  { time: '14:25:12', level: 'error', message: 'Falha na conexão com serviço de filas' },
  { time: '14:20:00', level: 'info', message: 'Limpeza de cache executada' },
  { time: '14:15:30', level: 'info', message: 'Novo deploy realizado - versão 2.4.1' },
]

const statusConfig = {
  online: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  offline: { color: 'bg-red-100 text-red-800', icon: XCircle },
}

const logLevelConfig = {
  info: 'text-blue-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
}

export default function SystemMonitorPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/admin/monitoring')
      if (res.ok) {
        const data = await res.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Carregar métricas ao montar a página
  useEffect(() => {
    handleRefresh()
    // Atualização automática a cada 30 segundos
    const interval = setInterval(handleRefresh, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const monitoringMetrics = {
    cpu: metrics.cpuUsage || 0,
    memory: metrics.memoryUsage || 0,
    disk: 45, // Placeholder por enquanto pois requer permissões de OS
    network: metrics.activeUsers || 0,
  }

  const servicesList = metrics.services || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title="Monitor do Sistema" description="Acompanhe a saúde e desempenho do sistema" />
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Resource Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">CPU</span>
              </div>
              <span className="text-2xl font-bold">{Math.round(monitoringMetrics.cpu)}%</span>
            </div>
            <Progress value={monitoringMetrics.cpu} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Memória</span>
              </div>
              <span className="text-2xl font-bold">{Math.round(monitoringMetrics.memory)}%</span>
            </div>
            <Progress value={monitoringMetrics.memory} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Disco</span>
              </div>
              <span className="text-2xl font-bold">{Math.round(monitoringMetrics.disk)}%</span>
            </div>
            <Progress value={monitoringMetrics.disk} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Usuários Ativos</span>
              </div>
              <span className="text-2xl font-bold">{monitoringMetrics.network}</span>
            </div>
            <Progress value={(monitoringMetrics.network / 100) * 100} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Status dos Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servicesList.map((service: any) => {
              const config = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.offline
              const StatusIcon = config.icon
              return (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Latência: {service.delay || '-'}
                    </p>
                  </div>
                  <Badge variant="secondary" className={config.color}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {service.status === 'online' ? 'Online' : service.status === 'warning' ? 'Alerta' : 'Offline'}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lixeira */}
      <TrashSection />

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Logs Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 font-mono text-sm"
              >
                <span className="text-muted-foreground">{log.time}</span>
                <span className={`uppercase font-semibold ${logLevelConfig[log.level as keyof typeof logLevelConfig]}`}>
                  [{log.level}]
                </span>
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
