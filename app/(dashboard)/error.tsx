'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
      <div className="rounded-full bg-red-100 p-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold">Erro na pagina</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Ocorreu um erro ao carregar esta pagina. Tente novamente ou volte ao inicio.
      </p>
      <div className="flex gap-3">
        <Button asChild variant="ghost">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Inicio</Link>
        </Button>
        <Button onClick={reset} variant="outline">
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
