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
  FileText,
  Calendar,
  CheckCircle,
  Heart,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

interface MunicipalDashboardData {
  kpis: {
    pendingRegulations: number
    todaySchedules: number
    approvedThisMonth: number
    totalCitizens: number
  }
  charts: {
    byCareType: { name: string; count: number }[]
    monthlyTrend: { month: string; count: number }[]
  }
  slaAlerts: {
    id: number
    citizenName: string
    priority: string
    daysOverdue: number
  }[]
}

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  NORMAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const priorityLabels: Record<string, string> = {
  HIGH: 'Alta',
  NORMAL: 'Normal',
  LOW: 'Baixa',
}

export default function MunicipalDashboardPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [data, setData] = useState<MunicipalDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user) {
      router.push('/login')
      return
    }
    // Apenas System Managers podem acessar esta página
    if (!session.user.isSystemManager) {
      toast.error('Acesso restrito a administradores do sistema')
      router.push('/regulations')
      return
    }
    fetchData()
  }, [session, sessionStatus, router])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/municipal/dashboard')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else if (response.status === 403) {
        toast.error('Sem permissão para acessar o dashboard')
        router.push('/regulations')
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
          title="Dashboard Municipal"
          description="Visão geral da sua prefeitura"
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
            <CardTitle className="text-sm font-medium">Regulações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.pendingRegulations}</div>
            <p className="text-xs text-muted-foreground">aguardando análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.todaySchedules}</div>
            <p className="text-xs text-muted-foreground">atendimentos programados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas no Mês</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.approvedThisMonth}</div>
            <p className="text-xs text-muted-foreground">regulações aprovadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cidadãos Cadastrados</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.totalCitizens}</div>
            <p className="text-xs text-muted-foreground">no sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 5 Tipos de Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tipos de Atendimento
            </CardTitle>
            <CardDescription>Top 5 com maior demanda este ano</CardDescription>
          </CardHeader>
          <CardContent>
            {data.charts.byCareType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.charts.byCareType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>Regulações nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {data.charts.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.charts.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas de SLA */}
      {data.slaAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              Alertas de SLA
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Regulações pendentes há mais de 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cidadão</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Dias em Atraso</TableHead>
                  <TableHead className="w-[100px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slaAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-mono">#{alert.id}</TableCell>
                    <TableCell>{alert.citizenName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={priorityColors[alert.priority] || priorityColors.NORMAL}>
                        {priorityLabels[alert.priority] || alert.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        {alert.daysOverdue} dias
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/regulations/${alert.id}`}>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Links Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <Link href="/regulations">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Ver Regulações
              </Button>
            </Link>
            <Link href="/schedules">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Agendamentos
              </Button>
            </Link>
            <Link href="/citizens">
              <Button variant="outline" className="w-full justify-start">
                <Heart className="h-4 w-4 mr-2" />
                Ver Cidadãos
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
