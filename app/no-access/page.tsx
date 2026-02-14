'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'

export default function NoAccessPage() {
  const router = useRouter()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-500/5 to-muted/5 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <ShieldX className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-3xl">403</CardTitle>
          <CardDescription className="text-lg">
            Acesso Não Autorizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página. Entre em contato com o administrador do sistema caso acredite que isso seja um erro.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Fazer Logout
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Código de erro: ERR_FORBIDDEN_ACCESS
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
