// ==========================================
// COMPONENTE DE LAYOUT: HEADER (CABEÇALHO)
// ==========================================
// Este é o cabeçalho fixo no topo da página
// Presente em TODAS as páginas após login
// Contém: Logo + Nome + Sino de Notificações + Menu do Usuário
// No mobile: também tem botão de menu hambúrguer
// 'use client' = este código roda no NAVEGADOR (frontend)

'use client'

import { Menu, LogOut, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui-store'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Importar componentes com Radix UI apenas no cliente para evitar erro de hydration
const NotificationBell = dynamic(() => import('./notification-bell').then(mod => ({ default: mod.NotificationBell })), { ssr: false })
const UserButton = dynamic(() => import('./user-button').then(mod => ({ default: mod.UserButton })), { ssr: false })

// COMPONENTE PRINCIPAL
export function Header() {
  const { setSidebarOpen } = useUIStore()
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Verificar se está no modo de gerenciamento de assinante
  const isSubscriberContext = session?.user?.isSubscriberContext

  // Verificar se está no modo lixeira
  const isTrashMode = searchParams.get('trash') === 'true'

  // Alternar modo lixeira
  const toggleTrashMode = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (isTrashMode) {
      params.delete('trash')
    } else {
      params.set('trash', 'true')
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(newUrl)
  }

  // Título e Cores dinâmicos
  let headerBg = "bg-primary border-primary/20"
  let headerTitle = "Sistema de Regulação"
  let showExitButton = false

  if (isSubscriberContext) {
    headerBg = "bg-indigo-700 border-indigo-600"
    headerTitle = `Gerenciando: ${session?.user?.subscriberName}`
    showExitButton = true
  }

  async function handleExitSubscriberContext() {
    try {
      const response = await fetch('/api/admin/exit-subscriber', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao sair')
        return
      }

      toast.success('Modo encerrado')
      window.location.href = '/admin/subscribers'
    } catch (error) {
      toast.error('Erro de conexão')
    }
  }

  return (
    <header className={`sticky top-0 z-50 ${headerBg} text-white border-b transition-colors duration-300`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* LADO ESQUERDO */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>

          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-xl font-bold">SR</span>
            </div>
            
            <div className="flex flex-col">
              <span className="hidden md:block text-xl font-semibold leading-tight">
                {headerTitle}
              </span>
              {isSubscriberContext && (
                <span className="text-xs text-white/80 hidden md:block">
                  Acesso total aos dados do assinante
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* LADO DIREITO */}
        <div className="flex items-center gap-2">
          {showExitButton && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTrashMode}
                className={isTrashMode
                  ? "border-red-500 bg-red-500/20 hover:bg-red-500/30 text-white font-semibold"
                  : "border-red-400 bg-white/10 hover:bg-white/20 text-white font-semibold"
                }
              >
                {isTrashMode ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Voltar
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Lixeira
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleExitSubscriberContext}
                className="hidden md:flex bg-white/10 hover:bg-white/20 text-white border-0"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair do Modo
              </Button>
            </>
          )}
          
          <NotificationBell />
          <UserButton />
        </div>
      </div>
    </header>
  )
}
