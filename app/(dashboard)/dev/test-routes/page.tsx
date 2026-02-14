'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Square, RotateCcw, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, FileText, Trash2, Download } from 'lucide-react'

// ─── BLOQUEIO: SÓ FUNCIONA EM DESENVOLVIMENTO ───
if (process.env.NODE_ENV === 'production') {
  throw new Error('Test routes page is not available in production')
}

// ─── HELPER: log no terminal do servidor ───
async function serverLog(message: string) {
  await fetch('/api/dev/test-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'log', message }),
  }).catch(() => {})
}

async function saveReport(report: string, filename: string) {
  return fetch('/api/dev/test-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'report', report, filename }),
  }).catch(() => {})
}

async function clearReports() {
  return fetch('/api/dev/test-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'clear' }),
  }).catch(() => {})
}

// ─── PERMISSÕES POR ROLE (baseado no permissions-template.ts) ───

const ROLE_PERMISSIONS: Record<string, string[]> = {
  system_manager: ['*'],
  admin_municipal: ['*'],
  assistant_municipal: [
    'regulations.create', 'regulations.read', 'regulations.update',
    'citizens.read', 'citizens.update',
    'schedules.create', 'schedules.read', 'schedules.update',
    'care.read', 'care-groups.read', 'groups.read',
    'suppliers.read', 'units.read', 'templates.read',
    'reports.view', 'whatsapp.view',
    'stock.read', 'stock.movement',
  ],
  doctor: [
    'regulations.create', 'regulations.read', 'regulations.update', 'regulations.approve',
    'citizens.read', 'citizens.update',
    'schedules.read', 'schedules.update', 'schedules.confirm',
    'care.read', 'care-groups.read', 'groups.read',
  ],
  pharmaceutical: [
    'regulations.read', 'regulations.update',
    'citizens.read', 'schedules.read',
    'care.read', 'care.update',
    'stock.create', 'stock.read', 'stock.update', 'stock.movement',
  ],
  typist: [
    'regulations.create', 'regulations.read',
    'citizens.create', 'citizens.read', 'citizens.update',
    'schedules.create', 'schedules.read',
    'care.read',
  ],
}

function hasPermission(role: string, isSystemManager: boolean, permission: string | null): 'ACESSÍVEL' | 'BLOQUEADO' {
  if (permission === null) return 'ACESSÍVEL'
  if (permission === 'SYSTEM_MANAGER_ONLY') return isSystemManager ? 'ACESSÍVEL' : 'BLOQUEADO'
  if (isSystemManager) return 'ACESSÍVEL'
  const perms = ROLE_PERMISSIONS[role] || []
  if (perms.includes('*')) return 'ACESSÍVEL'
  return perms.includes(permission) ? 'ACESSÍVEL' : 'BLOQUEADO'
}

// ─── TODAS AS ROTAS DO SISTEMA ───

const ROUTES = [
  // Públicas
  { path: '/login', name: 'Login', group: 'Públicas', permission: null },
  { path: '/register', name: 'Cadastro', group: 'Públicas', permission: null },
  { path: '/forgot-password', name: 'Esqueci a senha', group: 'Públicas', permission: null },
  { path: '/privacy', name: 'Privacidade', group: 'Públicas', permission: null },
  { path: '/terms', name: 'Termos', group: 'Públicas', permission: null },

  // Dashboard
  { path: '/', name: 'Home', group: 'Dashboard', permission: null },
  { path: '/regulations', name: 'Regulações', group: 'Dashboard', permission: 'regulations.read' },
  { path: '/regulations/new', name: 'Regulações - Nova', group: 'Dashboard', permission: 'regulations.create' },
  { path: '/citizens', name: 'Cidadãos', group: 'Dashboard', permission: 'citizens.read' },
  { path: '/citizens/new', name: 'Cidadãos - Novo', group: 'Dashboard', permission: 'citizens.create' },
  { path: '/care', name: 'Atendimentos', group: 'Dashboard', permission: 'care.read' },
  { path: '/care/new', name: 'Atendimentos - Novo', group: 'Dashboard', permission: 'care.create' },
  { path: '/care-groups', name: 'Grupos de Atendimento', group: 'Dashboard', permission: 'care-groups.read' },
  { path: '/care-groups/new', name: 'Grupos Atend. - Novo', group: 'Dashboard', permission: 'care-groups.create' },
  { path: '/schedules', name: 'Agendamentos', group: 'Dashboard', permission: 'schedules.read' },
  { path: '/schedules/new', name: 'Agendamentos - Novo', group: 'Dashboard', permission: 'schedules.create' },
  { path: '/suppliers', name: 'Fornecedores', group: 'Dashboard', permission: 'suppliers.read' },
  { path: '/suppliers/new', name: 'Fornecedores - Novo', group: 'Dashboard', permission: 'suppliers.create' },
  { path: '/units', name: 'Unidades', group: 'Dashboard', permission: 'units.read' },
  { path: '/units/new', name: 'Unidades - Nova', group: 'Dashboard', permission: 'units.create' },
  { path: '/users', name: 'Usuários', group: 'Dashboard', permission: 'users.read' },
  { path: '/users/new', name: 'Usuários - Novo', group: 'Dashboard', permission: 'users.create' },
  { path: '/folders', name: 'Pastas', group: 'Dashboard', permission: 'folders.read' },
  { path: '/folders/new', name: 'Pastas - Nova', group: 'Dashboard', permission: 'folders.create' },
  { path: '/groups', name: 'Grupos', group: 'Dashboard', permission: 'groups.read' },
  { path: '/lists', name: 'Listas', group: 'Dashboard', permission: null },
  { path: '/reports', name: 'Relatórios', group: 'Dashboard', permission: 'reports.view' },
  { path: '/notifications', name: 'Notificações', group: 'Dashboard', permission: null },
  { path: '/upload', name: 'Upload', group: 'Dashboard', permission: null },
  { path: '/audit', name: 'Auditoria', group: 'Dashboard', permission: null },
  { path: '/municipal-dashboard', name: 'Dashboard Municipal', group: 'Dashboard', permission: null },
  { path: '/whatsapp-programmed', name: 'WhatsApp Programado', group: 'Dashboard', permission: 'whatsapp.view' },
  { path: '/whatsapp-programmed/new', name: 'WhatsApp - Novo', group: 'Dashboard', permission: 'whatsapp.configure' },
  { path: '/settings', name: 'Configurações', group: 'Dashboard', permission: 'settings.view' },
  { path: '/tenant-settings', name: 'Config. Tenant', group: 'Dashboard', permission: 'tenant-settings.read' },
  { path: '/system/roles', name: 'Papéis do Sistema', group: 'Dashboard', permission: 'users.manage_roles' },

  // Admin (System Manager only)
  { path: '/admin/dashboard', name: 'Admin Dashboard', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/users', name: 'Admin Usuários', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/settings', name: 'Admin Config.', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/audit-logs', name: 'Admin Logs', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/backups', name: 'Admin Backups', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/routines', name: 'Admin Rotinas', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/support', name: 'Admin Suporte', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/system-monitor', name: 'Admin Monitor', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/whatsapp', name: 'Admin WhatsApp', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/subscribers', name: 'Admin Assinantes', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/subscribers/new', name: 'Admin Novo Assin.', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },
  { path: '/admin/reset', name: 'Admin Reset', group: 'Admin', permission: 'SYSTEM_MANAGER_ONLY' },

  // API
  { path: '/api/health', name: 'API Health', group: 'API', permission: null },
]

type RouteStatus = 'pending' | 'testing' | 'ok' | 'error' | 'redirect' | 'timeout'

interface RouteResult {
  path: string
  name: string
  group: string
  permission: string | null
  status: RouteStatus
  expected: 'ACESSÍVEL' | 'BLOQUEADO'
  actual: string
  match: boolean
  timeMs: number
  error?: string
}

export default function TestRoutesPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [results, setResults] = useState<RouteResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [reportSaved, setReportSaved] = useState(false)
  const stopRef = useRef(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const userRole = session?.user?.role || 'unknown'
  const userRoleDisplay = session?.user?.roleDisplayName || userRole
  const userName = session?.user?.name || 'Desconhecido'
  const userEmail = session?.user?.email || ''
  const isSystemManager = session?.user?.isSystemManager || false
  const subscriberName = session?.user?.subscriberName || 'N/A'
  const userPermissions = session?.user?.permissions || []

  // Inicializar resultados
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      setResults(ROUTES.map(r => ({
        ...r,
        status: 'pending' as RouteStatus,
        expected: hasPermission(userRole, isSystemManager, r.permission),
        actual: '-',
        match: false,
        timeMs: 0,
      })))
    }
  }, [sessionStatus, userRole, isSystemManager])

  const testRoute = useCallback(async (route: typeof ROUTES[0]): Promise<RouteResult> => {
    const start = Date.now()
    const expected = hasPermission(userRole, isSystemManager, route.permission)
    const result: RouteResult = {
      ...route,
      status: 'ok',
      expected,
      actual: '-',
      match: false,
      timeMs: 0,
    }

    try {
      if (route.path.startsWith('/api/')) {
        const res = await fetch(route.path, { method: 'GET', redirect: 'follow' })
        result.timeMs = Date.now() - start
        result.status = res.ok ? 'ok' : 'error'
        result.actual = res.ok ? 'ACESSÍVEL' : `ERRO HTTP ${res.status}`
        if (!res.ok) result.error = `HTTP ${res.status}`
        result.match = (result.actual === 'ACESSÍVEL') === (expected === 'ACESSÍVEL')
        return result
      }

      return new Promise<RouteResult>((resolve) => {
        const iframe = iframeRef.current
        if (!iframe) {
          result.status = 'error'
          result.actual = 'ERRO'
          result.error = 'Iframe não encontrado'
          result.timeMs = Date.now() - start
          resolve(result)
          return
        }

        const timeout = setTimeout(() => {
          iframe.removeEventListener('load', onLoad)
          result.status = 'timeout'
          result.actual = 'TIMEOUT'
          result.error = 'Timeout 15s'
          result.timeMs = Date.now() - start
          result.match = false
          resolve(result)
        }, 15000)

        const onLoad = () => {
          clearTimeout(timeout)
          iframe.removeEventListener('load', onLoad)
          result.timeMs = Date.now() - start

          try {
            const iframeUrl = iframe.contentWindow?.location.href || ''
            if (iframeUrl.includes('/login') && !route.path.includes('/login')) {
              result.status = 'redirect'
              result.actual = 'BLOQUEADO'
              result.error = 'Redirect para login'
            } else if (iframeUrl.includes('/no-access')) {
              result.status = 'redirect'
              result.actual = 'BLOQUEADO'
              result.error = 'Sem acesso'
            } else if (iframeUrl.includes('/error')) {
              result.status = 'error'
              result.actual = 'ERRO'
              result.error = 'Página de erro'
            } else {
              result.status = 'ok'
              result.actual = 'ACESSÍVEL'
            }
          } catch {
            result.status = 'ok'
            result.actual = 'ACESSÍVEL'
          }

          result.match = result.actual === result.expected
          resolve(result)
        }

        iframe.addEventListener('load', onLoad)
        iframe.src = route.path
      })
    } catch (err: any) {
      result.timeMs = Date.now() - start
      result.status = 'error'
      result.actual = 'ERRO'
      result.error = err.message?.slice(0, 100)
      result.match = false
      return result
    }
  }, [userRole, isSystemManager])

  const generateReportText = useCallback((finalResults: RouteResult[]) => {
    const div = '═'.repeat(80)
    const thin = '─'.repeat(80)
    const now = new Date().toISOString()
    const ok = finalResults.filter(r => r.actual === 'ACESSÍVEL').length
    const blocked = finalResults.filter(r => r.actual === 'BLOQUEADO').length
    const errors = finalResults.filter(r => r.actual === 'ERRO' || r.actual === 'TIMEOUT').length
    const matchCount = finalResults.filter(r => r.match).length
    const mismatchCount = finalResults.filter(r => !r.match && r.actual !== '-').length

    const lines = [
      div,
      `  RELATÓRIO DE TESTE DE ROTAS`,
      div,
      '',
      `  Data:        ${now}`,
      `  Usuário:     ${userName}`,
      `  Email:       ${userEmail}`,
      `  Role:        ${userRoleDisplay} (${userRole})`,
      `  Assinante:   ${subscriberName}`,
      `  Sys Manager: ${isSystemManager ? 'SIM' : 'NÃO'}`,
      `  Permissões:  ${userPermissions.length} permissões carregadas`,
      '',
      thin,
      `  RESUMO`,
      thin,
      '',
      `  Total de rotas testadas: ${finalResults.length}`,
      `  Acessíveis:             ${ok}`,
      `  Bloqueadas:             ${blocked}`,
      `  Erros/Timeout:          ${errors}`,
      '',
      `  Resultado esperado CORRETO:   ${matchCount}`,
      `  Resultado DIFERENTE do esperado: ${mismatchCount}`,
      '',
      thin,
      `  DETALHES POR ROTA`,
      thin,
      '',
      `  ${'Rota'.padEnd(28)} ${'Esperado'.padEnd(12)} ${'Obtido'.padEnd(12)} ${'Match'.padEnd(8)} ${'Tempo'.padEnd(8)} Obs`,
      `  ${'─'.repeat(28)} ${'─'.repeat(12)} ${'─'.repeat(12)} ${'─'.repeat(8)} ${'─'.repeat(8)} ${'─'.repeat(20)}`,
    ]

    let currentGroup = ''
    for (const r of finalResults) {
      if (r.group !== currentGroup) {
        currentGroup = r.group
        lines.push('')
        lines.push(`  ── ${currentGroup.toUpperCase()} ──`)
      }
      const matchIcon = r.actual === '-' ? '   ' : r.match ? ' ✅ ' : ' ❌ '
      const name = r.name.padEnd(28)
      const expected = r.expected.padEnd(12)
      const actual = r.actual.padEnd(12)
      const match = matchIcon.padEnd(8)
      const time = r.timeMs > 0 ? `${r.timeMs}ms`.padEnd(8) : '   -   '
      const obs = r.error || ''
      lines.push(`  ${name} ${expected} ${actual} ${match} ${time} ${obs}`)
    }

    // Seção de discrepâncias
    const mismatches = finalResults.filter(r => !r.match && r.actual !== '-')
    if (mismatches.length > 0) {
      lines.push('')
      lines.push(div)
      lines.push(`  DISCREPÂNCIAS (resultado diferente do esperado)`)
      lines.push(div)
      lines.push('')
      for (const r of mismatches) {
        lines.push(`  ❌ ${r.name} (${r.path})`)
        lines.push(`     Esperado: ${r.expected}`)
        lines.push(`     Obtido:   ${r.actual}${r.error ? ' - ' + r.error : ''}`)
        lines.push('')
      }
    }

    lines.push('')
    lines.push(div)
    lines.push('  FIM DO RELATÓRIO')
    lines.push(div)

    return lines.join('\n')
  }, [userName, userEmail, userRole, userRoleDisplay, subscriberName, isSystemManager, userPermissions])

  const runTests = useCallback(async () => {
    stopRef.current = false
    setIsRunning(true)
    setReportSaved(false)

    const freshResults: RouteResult[] = ROUTES.map(r => ({
      ...r,
      status: 'pending' as RouteStatus,
      expected: hasPermission(userRole, isSystemManager, r.permission),
      actual: '-',
      match: false,
      timeMs: 0,
    }))
    setResults(freshResults)

    await serverLog('')
    await serverLog('╔══════════════════════════════════════════════════════════════╗')
    await serverLog('║       🤖 TESTE DE ROTAS - INICIANDO                         ║')
    await serverLog('╚══════════════════════════════════════════════════════════════╝')
    await serverLog(`  👤 ${userName} (${userRoleDisplay})`)
    await serverLog(`  📧 ${userEmail}`)
    await serverLog(`  🏢 ${subscriberName}`)
    await serverLog(`  🔑 System Manager: ${isSystemManager ? 'SIM' : 'NÃO'}`)
    await serverLog('')

    const updatedResults = [...freshResults]

    for (let i = 0; i < ROUTES.length; i++) {
      if (stopRef.current) break
      setCurrentIndex(i)

      updatedResults[i] = { ...updatedResults[i], status: 'testing' }
      setResults([...updatedResults])

      const result = await testRoute(ROUTES[i])
      updatedResults[i] = result
      setResults([...updatedResults])

      const icon = result.match ? '✅' : result.actual === '-' ? '⏳' : '❌'
      const matchLabel = result.match ? 'MATCH' : 'DIFF!'
      await serverLog(`  ${icon} [${(i + 1).toString().padStart(2)}/${ROUTES.length}] ${result.name.padEnd(25)} ${result.expected.padEnd(12)} → ${result.actual.padEnd(12)} ${matchLabel}  (${result.timeMs}ms)`)

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Gerar e salvar relatório
    const report = generateReportText(updatedResults)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `test-${userRole}-${timestamp}.txt`
    await saveReport(report, filename)
    setReportSaved(true)

    const ok = updatedResults.filter(r => r.actual === 'ACESSÍVEL').length
    const mismatches = updatedResults.filter(r => !r.match && r.actual !== '-').length

    await serverLog('')
    await serverLog('══════════════════════════════════════════════════════════════')
    await serverLog(`  📊 RESULTADO FINAL: ${ok}/${ROUTES.length} acessíveis | ${mismatches} discrepâncias`)
    await serverLog(`  📄 Relatório: test-reports/${filename}`)
    await serverLog('══════════════════════════════════════════════════════════════')

    setIsRunning(false)
    setCurrentIndex(-1)
  }, [userRole, isSystemManager, userName, userEmail, userRoleDisplay, subscriberName, testRoute, generateReportText])

  const stopTests = () => { stopRef.current = true }

  const handleClearReports = async () => {
    await clearReports()
    setReportSaved(false)
  }

  const handleDownload = () => {
    const report = generateReportText(results)
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-${userRole}-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Contadores
  const done = results.filter(r => r.status !== 'pending' && r.status !== 'testing').length
  const total = results.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  const okCount = results.filter(r => r.actual === 'ACESSÍVEL').length
  const blockedCount = results.filter(r => r.actual === 'BLOQUEADO').length
  const errorCount = results.filter(r => r.actual === 'ERRO' || r.actual === 'TIMEOUT').length
  const matchCount = results.filter(r => r.match).length
  const mismatchCount = results.filter(r => !r.match && r.actual !== '-').length

  const groups = [...new Set(ROUTES.map(r => r.group))]

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teste de Rotas</h1>
          <p className="text-muted-foreground text-sm">
            Testa {total} rotas e compara com as permissões esperadas
          </p>
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={runTests} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Iniciar
            </Button>
          ) : (
            <Button onClick={stopTests} variant="destructive" size="lg">
              <Square className="mr-2 h-4 w-4" />
              Parar
            </Button>
          )}
          <Button onClick={handleDownload} variant="outline" disabled={isRunning || done === 0}>
            <Download className="mr-2 h-4 w-4" />
            Baixar .txt
          </Button>
          <Button onClick={handleClearReports} variant="ghost" disabled={isRunning}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Info do usuário */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Usuário</p>
              <p className="font-semibold">{userName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="font-semibold">{userRoleDisplay}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Assinante</p>
              <p className="font-semibold">{subscriberName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">System Manager</p>
              <p className="font-semibold">{isSystemManager ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso: {done}/{total}</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div className="bg-primary h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex gap-4 mt-4 text-sm flex-wrap">
            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" /> {okCount} Acessíveis</span>
            <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-yellow-500" /> {blockedCount} Bloqueadas</span>
            <span className="flex items-center gap-1"><XCircle className="h-4 w-4 text-red-500" /> {errorCount} Erros</span>
            <span className="ml-auto font-semibold">
              {matchCount > 0 && <span className="text-green-600">{matchCount} corretos</span>}
              {mismatchCount > 0 && <span className="text-red-600 ml-3">{mismatchCount} diferentes do esperado</span>}
            </span>
          </div>
          {reportSaved && (
            <p className="mt-3 text-xs text-green-600 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Relatório salvo em test-reports/
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {groups.map(group => (
        <Card key={group}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{group}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Rota</th>
                    <th className="pb-2 pr-4">Path</th>
                    <th className="pb-2 pr-4">Esperado</th>
                    <th className="pb-2 pr-4">Obtido</th>
                    <th className="pb-2 pr-4">Match</th>
                    <th className="pb-2 text-right">Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {results.filter(r => r.group === group).map(r => (
                    <tr
                      key={r.path}
                      className={`border-b last:border-0 ${
                        r.status === 'testing' ? 'bg-blue-50 dark:bg-blue-950/30' :
                        !r.match && r.actual !== '-' ? 'bg-red-50 dark:bg-red-950/30' :
                        ''
                      }`}
                    >
                      <td className="py-2 pr-4">
                        {r.status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                        {r.status === 'testing' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                        {r.status === 'ok' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {r.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                        {r.status === 'redirect' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        {r.status === 'timeout' && <Clock className="h-4 w-4 text-orange-500" />}
                      </td>
                      <td className="py-2 pr-4 font-medium">{r.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground font-mono text-xs">{r.path}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          r.expected === 'ACESSÍVEL' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {r.expected}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {r.actual !== '-' ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            r.actual === 'ACESSÍVEL' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            r.actual === 'BLOQUEADO' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {r.actual}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {r.actual !== '-' && (
                          r.match
                            ? <span className="text-green-600 font-bold text-xs">✓</span>
                            : <span className="text-red-600 font-bold text-xs">✗ DIFF</span>
                        )}
                      </td>
                      <td className={`py-2 text-right tabular-nums text-xs ${
                        r.timeMs > 5000 ? 'text-red-500' : r.timeMs > 2000 ? 'text-yellow-500' : 'text-muted-foreground'
                      }`}>
                        {r.timeMs > 0 ? `${r.timeMs}ms` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      <iframe ref={iframeRef} className="hidden" sandbox="allow-same-origin allow-scripts allow-forms" />
    </div>
  )
}
