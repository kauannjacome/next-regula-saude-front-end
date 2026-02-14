'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function ErrorPage() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 to-muted/5 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-3xl">500</CardTitle>
          <CardDescription className="text-lg">
            Erro Interno do Servidor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            <Link href="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Ir para Início
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Se o problema persistir, entre em contato com o suporte técnico.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
