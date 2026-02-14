'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { User, LogOut, Settings, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserImage } from '@/hooks/use-user-image'
import { useInvalidateAllCaches } from '@/hooks/use-cached-data'
import { SupportModal } from '@/components/shared/support-modal'

export function UserButton() {
  const router = useRouter()
  const { data: session } = useSession()
  const userImage = useUserImage()
  const invalidateAllCaches = useInvalidateAllCaches()
  const [showSupportModal, setShowSupportModal] = useState(false)

  const handleLogout = async () => {
    invalidateAllCaches()
    await fetch('/api/auth/cleanup', { method: 'POST' }).catch(() => {})
    signOut({ callbackUrl: '/login' })
  }

  const displayName = session?.user?.name || 'Usuario'
  const userEmail = session?.user?.email || ''
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full hover:bg-white/10"
          data-tour="user-menu"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={userImage} alt={displayName} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail || 'Carregando...'}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <User className="mr-2 h-4 w-4" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuracoes</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setShowSupportModal(true)}>
          <Headphones className="mr-2 h-4 w-4" />
          <span>Suporte</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      <SupportModal open={showSupportModal} onOpenChange={setShowSupportModal} />
    </DropdownMenu>
  )
}
