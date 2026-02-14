import { Header, Sidebar, MobileNav, CacheMigration } from '@/components/layout'

import { SubscriptionStatusBanner } from '@/components/layout/subscription-status-banner'
import { Mandatory2FASetup } from '@/components/auth/mandatory-2fa-setup'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { env } from '@/lib/config/env'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // Verificar se o usuário precisa configurar 2FA
  // System Manager e SubscriberContext não precisam verificar 2FA
  const isSystemManager = session?.user?.isSystemManager
  const isSubscriberContext = session?.user?.isSubscriberContext

  // Forçar troca de senha temporária antes de qualquer acesso
  if (!isSystemManager && !isSubscriberContext && session?.user?.isPasswordTemp) {
    redirect('/change-password')
  }

  // Bloqueia para configurar 2FA quando:
  // - Usuário ainda não tem 2FA ativado (twoFactorEnabled === false) OU
  // - Admin explicitamente resetou o 2FA (twoFactorResetRequired === true)
  // SKIP_2FA=true no .env desativa a obrigatoriedade (apenas para desenvolvimento/testes)
  const skip2FA = env.SKIP_2FA
  const needsTwoFactorSetup = !skip2FA && !isSystemManager && !isSubscriberContext &&
    (session?.user?.twoFactorEnabled === false || session?.user?.twoFactorResetRequired === true)

  if (needsTwoFactorSetup) {
    return <Mandatory2FASetup />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <CacheMigration />

      <SubscriptionStatusBanner />
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 min-h-0 overflow-auto p-4 lg:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

