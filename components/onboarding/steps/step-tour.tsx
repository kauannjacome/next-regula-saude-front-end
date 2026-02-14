'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Compass,
  ArrowRight,
  Loader2,
  SkipForward,
  Play,
  FileText,
  Users,
  Calendar,
  Bell,
  Settings,
  BookOpen,
  Video,
  ExternalLink,
} from 'lucide-react'

interface StepTourProps {
  onStartTour: () => void
  onSkip: () => void
  isLoading?: boolean
}

export function StepTour({ onStartTour, onSkip, isLoading }: StepTourProps) {
  const features = [
    {
      icon: FileText,
      title: 'Regulacoes',
      description: 'Crie e gerencie solicitacoes de regulacao',
    },
    {
      icon: Users,
      title: 'Cidadaos',
      description: 'Cadastro e historico de pacientes',
    },
    {
      icon: Calendar,
      title: 'Agendamentos',
      description: 'Agenda de consultas e procedimentos',
    },
    {
      icon: Bell,
      title: 'Notificacoes',
      description: 'Alertas e lembretes importantes',
    },
    {
      icon: Settings,
      title: 'Configuracoes',
      description: 'Personalize o sistema',
    },
  ]

  const resources = [
    {
      icon: BookOpen,
      title: 'Documentacao',
      description: 'Guia completo do sistema',
      url: '#',
    },
    {
      icon: Video,
      title: 'Videos Tutoriais',
      description: 'Aprenda com videos',
      url: '#',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 mb-4">
          <Compass className="h-8 w-8 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold">Tour do Sistema</h1>
        <p className="text-muted-foreground">
          Conheca as principais funcionalidades do NextSaude
        </p>
      </div>

      {/* Features preview */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">O que voce vai conhecer:</h3>
          <div className="grid gap-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Start tour button */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6 text-center space-y-4">
          <p className="text-muted-foreground">
            Faca um tour rapido para conhecer todas as funcionalidades
          </p>
          <Button
            size="lg"
            onClick={onStartTour}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Iniciar Tour Guiado
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recursos adicionais */}
      <div className="grid grid-cols-2 gap-4">
        {resources.map((resource) => {
          const Icon = resource.icon
          return (
            <a
              key={resource.title}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium flex items-center gap-1">
                  {resource.title}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {resource.description}
                </p>
              </div>
            </a>
          )
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={isLoading}
          className="text-muted-foreground"
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Pular tour
        </Button>

        <Button variant="outline" onClick={onSkip} disabled={isLoading}>
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
