'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, ArrowRight, Sparkles } from 'lucide-react'

interface StepWelcomeProps {
  userName?: string | null
  onContinue: () => void
}

export function StepWelcome({ userName, onContinue }: StepWelcomeProps) {
  const firstName = userName?.split(' ')[0] || 'Usuario'

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      {/* Logo e titulo */}
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 shadow-lg">
          <Heart className="h-10 w-10 text-white fill-current" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Bem-vindo ao <span className="text-blue-600">NextSaude</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Ola, <span className="font-medium text-foreground">{firstName}</span>!
        </p>
      </div>

      {/* Card de boas-vindas */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Vamos comecar!</span>
          </div>
          <p className="text-muted-foreground">
            Em poucos passos voce estara pronto para usar todas as
            funcionalidades do sistema. Vamos configurar seu perfil, importar
            dados iniciais e conhecer as principais funcoes.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
            <span className="text-xl">1</span>
          </div>
          <h3 className="font-medium">Complete seu perfil</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione suas informacoes basicas
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <span className="text-xl">2</span>
          </div>
          <h3 className="font-medium">Importe seus dados</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Cidadaos, profissionais e unidades
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
            <span className="text-xl">3</span>
          </div>
          <h3 className="font-medium">Faca o tour</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Conheca as funcionalidades
          </p>
        </div>
      </div>

      {/* Botao continuar */}
      <Button size="lg" onClick={onContinue} className="h-12 px-8">
        Comecar
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>

      <p className="text-sm text-muted-foreground">
        Isso levara apenas alguns minutos
      </p>
    </div>
  )
}
