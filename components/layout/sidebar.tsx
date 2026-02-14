'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  Package,
  FolderOpen,
  Heart,
  Shield,
  MessageCircle,
  MessageSquare,
  FileBarChart,
  Stethoscope,
  Calendar,
  Activity,
  Cog,
  Database,
  Headphones,
  Timer,
  type LucideIcon,
} from 'lucide-react'

// Mapa de recursos do menu - definição única e simples
// NOTA: 'municipal-dashboard', 'audit' e 'settings' removidos do menu lateral
// 'settings' está acessível pelo menu superior do usuário
const MENU_CONFIG: Record<string, { icon: LucideIcon; label: string; href: string }> = {
  'welcome': { icon: LayoutDashboard, label: 'Início', href: '/welcome' },
  'regulations': { icon: FileText, label: 'Regulações', href: '/regulations' },
  'citizens': { icon: Heart, label: 'Cidadãos', href: '/citizens' },
  'users': { icon: Users, label: 'Usuários', href: '/users' },
  'units': { icon: Building2, label: 'Unidades', href: '/units' },
  'suppliers': { icon: Package, label: 'Fornecedores', href: '/suppliers' },
  'folders': { icon: FolderOpen, label: 'Pastas', href: '/folders' },
  'care': { icon: Stethoscope, label: 'Cuidados', href: '/care' },
  'schedules': { icon: Calendar, label: 'Agendamentos', href: '/schedules' },
  'reports': { icon: FileBarChart, label: 'Relatórios', href: '/reports' },
  'whatsapp': { icon: MessageCircle, label: 'WhatsApp', href: '/whatsapp-programmed' },
  'tenant-settings': { icon: Cog, label: 'Config. Prefeitura', href: '/tenant-settings' },
}

// Itens de menu do System Manager (fixos)
const SYSTEM_MANAGER_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Shield, label: 'Assinantes', href: '/admin/subscribers' },
  { icon: Users, label: 'Usuários', href: '/admin/users' },
  { icon: MessageSquare, label: 'WhatsApp', href: '/admin/whatsapp' },
  { icon: Activity, label: 'Auditoria', href: '/admin/audit-logs' },
  { icon: Timer, label: 'Rotinas', href: '/admin/routines' },
  { icon: Headphones, label: 'Suporte', href: '/admin/support' },
  { icon: Database, label: 'Backups', href: '/admin/backups' },
  { icon: Cog, label: 'Configurações', href: '/admin/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Loading state
  if (status === 'loading') {
    return (
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/20 animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </nav>
      </aside>
    )
  }

  // Verificar se está no modo System Manager (sem contexto de assinante)
  const isInSystemManagerMode = session?.user?.isSystemManager && !session?.user?.isSubscriberContext

  // Determinar itens do menu
  let navItems: Array<{ icon: LucideIcon; label: string; href: string }> = []

  if (isInSystemManagerMode) {
    // System Manager: menus fixos de administração
    navItems = SYSTEM_MANAGER_MENU
  } else {
    // Usuário normal: menus baseados no JWT (carregados do banco no login)
    const userMenus = session?.user?.menus || []
    navItems = userMenus
      .map(menuKey => MENU_CONFIG[menuKey])
      .filter(Boolean)

    // Fallback: se não houver menus, mostrar pelo menos o welcome
    if (navItems.length === 0) {
      navItems = [MENU_CONFIG['welcome']]
    }
  }

  // Label da role para exibir
  const roleLabel = session?.user?.roleDisplayName || session?.user?.role || 'Usuário'

  return (
    <aside
      className="hidden lg:flex w-64 flex-col border-r bg-white dark:bg-zinc-950 h-screen sticky top-0"
      data-tour="sidebar"
    >
      <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400"
        >
          <img src="/Logo.ico" alt="Regula" className="h-8 w-8" />
          <span>Regula</span>
        </Link>
        {isInSystemManagerMode ? (
          <div className="mt-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded inline-block">
            System Manager
          </div>
        ) : (
          <div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded inline-block">
            {roleLabel}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhum menu disponível
          </div>
        ) : (
          navItems.map(item => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon

            // Determinar data-tour baseado no href
            const tourId = item.href.replace('/', '').replace('/', '-')

            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={tourId}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive && 'fill-current')} />
                {item.label}
              </Link>
            )
          })
        )}
      </nav>

    </aside>
  )
}
