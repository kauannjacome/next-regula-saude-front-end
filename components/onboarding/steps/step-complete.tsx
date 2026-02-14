'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
  FileText,
  Users,
  Calendar,
  HelpCircle,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface StepCompleteProps {
  userName?: string | null
  importedData?: {
    citizens?: boolean
    professionals?: boolean
    units?: boolean
  }
  onFinish: () => void
  isLoading?: boolean
}

export function StepComplete({
  userName,
  importedData,
  onFinish,
  isLoading,
}: StepCompleteProps) {
  const firstName = userName?.split(' ')[0] || 'Usuario'

  // Confetti on mount
  useEffect(() => {
    const duration = 2000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#3B82F6', '#10B981', '#8B5CF6'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#3B82F6', '#10B981', '#8B5CF6'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  const nextSteps = [
    {
      icon: FileText,
      title: 'Criar sua primeira regulacao',
      description: 'Registre uma solicitacao de atendimento',
    },
    {
      icon: Users,
      title: 'Cadastrar cidadaos',
      description: 'Adicione pacientes ao sistema',
    },
    {
      icon: Calendar,
      title: 'Gerenciar agendamentos',
      description: 'Organize a agenda de atendimentos',
    },
    {
      icon: HelpCircle,
      title: 'Explorar configuracoes',
      description: 'Personalize o sistema',
    },
  ]

  return (
    <div className="max-w-xl mx-auto text-center space-y-8">
      {/* Icone de sucesso */}
      <div className="space-y-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20" />
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Tudo pronto, {firstName}!</h1>
        <p className="text-muted-foreground text-lg">
          Sua conta esta configurada e voce ja pode comecar a usar o NextSaude
        </p>
      </div>

      {/* Resumo */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Configuracao concluida</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Perfil completo</span>
            </div>
            {importedData?.citizens && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Cidadaos importados</span>
              </div>
            )}
            {importedData?.professionals && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Profissionais importados</span>
              </div>
            )}
            {importedData?.units && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Unidades importadas</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proximos passos */}
      <div className="text-left space-y-4">
        <h3 className="font-medium text-center">Proximos passos sugeridos:</h3>
        <div className="grid gap-3">
          {nextSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Botao finalizar */}
      <Button
        size="lg"
        onClick={onFinish}
        disabled={isLoading}
        className="h-12 px-8"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Finalizando...
          </>
        ) : (
          <>
            Ir para o Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}
