'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/page-header'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Heart,
  ShieldOff,
  TrendingUp,
  Activity,
  RefreshCw,
  Headphones,
  UserPlus,
  FilePlus,
  LogIn,
} from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  kpis: {
    subscribers: { total: number; active: number; blocked: number }
    users: { total: number; active: number; blocked: number; without2FA: number }
    regulations: { total: number; pending: number }
    citizens: { total: number }
    support: { total: number; pending: number }
    today: { newUsers: number; newRegulations: number; logins: number }
  }
  charts: {
    regulationsByStatus: Array<{ status: string; count: number }>
    usersByRole: Array<{ role: string; count: number }>
  }
  subscriberStats: Array<{
    id: number
    name: string
    status: string
    users: number
    regulations: number
    citizens: number
  }>
  recentActivity: Array<{
    id: number
    action: string
    objectType: string
    objectId: number
    actor: string
    subscriber: string
    occurredAt: string
    detail: any
  }>
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  TEMPORARY_UNBLOCK: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  OVERDUE: 'Atrasado',
  TEMPORARY_UNBLOCK: 'Desbloq. Temp.',
  BLOCKED: 'Bloqueado',
}

const actionLabels: Record<string, string> = {
  CREATE: 'Criou',
  UPDATE: 'Atualizou',
  DELETE: 'Deletou',
  VIEW: 'Visualizou',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  IMPERSONATE_START: 'Iniciou impersonação',
  IMPERSONATE_STOP: 'Parou impersonação',
  APPROVE: 'Aprovou',
  REJECT: 'Rejeitou',
}

export default function AdminDashboardPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user?.isSystemManager) {
      router.push('/')
      return
    }
    fetchData()
  }, [session, sessionStatus, router])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast.error('Erro ao carregar dashboard')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar dashboard')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard Administrativo"
          description="Visão geral do sistema"
          icon={LayoutDashboard}
        />
        <Button variant="outline" onClick={() => { setIsLoading(true); fetchData(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assinantes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.subscribers.total}</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-green-600">{data.kpis.subscribers.active} ativos</span>
              {data.kpis.subscribers.blocked > 0 && (
                <span className="text-xs text-red-600">{data.kpis.subscribers.blocked} bloqueados</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.users.total}</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-green-600">{data.kpis.users.active} ativos</span>
              {data.kpis.users.blocked > 0 && (
                <span className="text-xs text-red-600">{data.kpis.users.blocked} bloqueados</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Regulações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.regulations.total}</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-amber-600">{data.kpis.regulations.pending} pendentes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cidadãos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.citizens.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Métricas de Hoje */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.kpis.users.without2FA > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">Sem 2FA</CardTitle>
              <ShieldOff className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">{data.kpis.users.without2FA}</div>
              <p className="text-xs text-amber-600">usuários sem autenticação 2FA</p>
            </CardContent>
          </Card>
        )}

        {data.kpis.support.pending > 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Tickets Pendentes</CardTitle>
              <Headphones className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{data.kpis.support.pending}</div>
              <Link href="/admin/support" className="text-xs text-blue-600 hover:underline">
                Ver tickets →
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <UserPlus className="h-3 w-3 text-green-600" />
                <span>{data.kpis.today.newUsers} novos usuários</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FilePlus className="h-3 w-3 text-blue-600" />
                <span>{data.kpis.today.newRegulations} regulações</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LogIn className="h-3 w-3 text-purple-600" />
                <span>{data.kpis.today.logins} logins</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Assinantes e Atividade Recente */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assinantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Assinantes
            </CardTitle>
            <CardDescription>Resumo por assinante</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Usuários</TableHead>
                  <TableHead className="text-right">Regulações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.subscriberStats.slice(0, 5).map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[sub.status]}>
                        {statusLabels[sub.status] || sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{sub.users}</TableCell>
                    <TableCell className="text-right">{sub.regulations}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Link href="/admin/subscribers">
                <Button variant="outline" size="sm" className="w-full">
                  Ver todos os assinantes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              ) : (
                data.recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {activity.actor} {actionLabels[activity.action] || activity.action} {activity.objectType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.subscriber} • {new Date(activity.occurredAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Link href="/admin/audit-logs">
                <Button variant="outline" size="sm" className="w-full">
                  Ver todos os logs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <Link href="/admin/subscribers">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="h-4 w-4 mr-2" />
                Gerenciar Assinantes
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gerenciar Usuários
              </Button>
            </Link>
            <Link href="/admin/support">
              <Button variant="outline" className="w-full justify-start">
                <Headphones className="h-4 w-4 mr-2" />
                Tickets de Suporte
              </Button>
            </Link>
            <Link href="/admin/audit-logs">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                Logs de Auditoria
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
