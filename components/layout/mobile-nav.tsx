'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
  Cog,
  Activity,
  Headphones,
  Database,
  type LucideIcon,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

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
  { icon: Headphones, label: 'Suporte', href: '/admin/support' },
  { icon: Database, label: 'Backups', href: '/admin/backups' },
  { icon: Cog, label: 'Configurações', href: '/admin/settings' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { data: session } = useSession()

  const isInSystemManagerMode = session?.user?.isSystemManager && !session?.user?.isSubscriberContext

  let navItems: Array<{ icon: LucideIcon; label: string; href: string }> = []

  if (isInSystemManagerMode) {
    navItems = SYSTEM_MANAGER_MENU
  } else {
    const menuKeys = session?.user?.menus || []
    navItems = menuKeys.map(key => MENU_CONFIG[key]).filter(Boolean)

    // Fallback: se não houver menus, mostrar pelo menos o welcome
    if (navItems.length === 0) {
      navItems = [MENU_CONFIG['welcome']]
    }
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLinkClick = () => {
    setSidebarOpen(false)
  }

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-5rem)]">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
                  active
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <Icon className={cn("h-5 w-5", active && "fill-current")} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
