'use client'

import { useSession } from 'next-auth/react'
import { AlertTriangle, Clock, CreditCard } from 'lucide-react'
import { SubscriptionStatus } from '@/lib/generated/prisma'

const STATUS_CONFIG: Record<SubscriptionStatus, {
  show: boolean
  bgClass: string
  borderClass: string
  iconClass: string
  textClass: string
  subTextClass: string
  icon: typeof AlertTriangle
  title: string
  message: string
} | null> = {
  ACTIVE: null,
  OVERDUE: {
    show: true,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    borderClass: 'border-b-2 border-amber-400 dark:border-amber-700',
    iconClass: 'text-amber-600 dark:text-amber-400',
    textClass: 'text-amber-900 dark:text-amber-100',
    subTextClass: 'text-amber-700 dark:text-amber-300',
    icon: CreditCard,
    title: 'Pagamento em atraso',
    message: 'Seu assinante está com pagamento pendente. Regularize para evitar o bloqueio do acesso.'
  },
  TEMPORARY_UNBLOCK: {
    show: true,
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    borderClass: 'border-b-2 border-blue-400 dark:border-blue-700',
    iconClass: 'text-blue-600 dark:text-blue-400',
    textClass: 'text-blue-900 dark:text-blue-100',
    subTextClass: 'text-blue-700 dark:text-blue-300',
    icon: Clock,
    title: 'Desbloqueio temporário',
    message: 'Seu acesso foi liberado temporariamente. Regularize o pagamento para manter o acesso.'
  },
  BLOCKED: {
    show: true,
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    borderClass: 'border-b-2 border-red-400 dark:border-red-700',
    iconClass: 'text-red-600 dark:text-red-400',
    textClass: 'text-red-900 dark:text-red-100',
    subTextClass: 'text-red-700 dark:text-red-300',
    icon: AlertTriangle,
    title: 'Acesso bloqueado',
    message: 'Seu assinante está bloqueado por falta de pagamento. Entre em contato com o administrador.'
  }
}

export function SubscriptionStatusBanner() {
  const { data: session } = useSession()

  const status = session?.user?.subscriptionStatus as SubscriptionStatus | undefined

  if (!status) return null

  const config = STATUS_CONFIG[status]

  if (!config || !config.show) return null

  const Icon = config.icon

  return (
    <div className={`${config.bgClass} ${config.borderClass}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${config.iconClass} flex-shrink-0`} />
          <div>
            <p className={`text-sm font-bold ${config.textClass}`}>
              {config.title}
            </p>
            <p className={`text-xs ${config.subTextClass} mt-0.5`}>
              {config.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
