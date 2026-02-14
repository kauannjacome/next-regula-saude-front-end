'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Heart, LogOut, X } from 'lucide-react'
import {
  StepWelcome,
  StepProfile,
  StepImport,
  StepTour,
  StepComplete,
} from './steps'
import { TourProvider, TourOverlay } from './tour'
import {
  ONBOARDING_STEPS,
  STEP_ORDER,
  STEP_CONFIG,
  OnboardingStepType,
} from '@/lib/onboarding'

interface OnboardingWizardProps {
  initialStep?: string
  userName?: string | null
}

export function OnboardingWizard({
  initialStep = 'WELCOME',
  userName,
}: OnboardingWizardProps) {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [currentStep, setCurrentStep] = useState<OnboardingStepType>(
    (initialStep as OnboardingStepType) || 'WELCOME'
  )
  const [isLoading, setIsLoading] = useState(false)
  const [showTour, setShowTour] = useState(false)

  // Buscar dados do usuario
  const [userData, setUserData] = useState<{
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
    phoneNumber?: string | null
    position?: string | null
  }>({
    name: userName || session?.user?.name,
    email: session?.user?.email,
    avatarUrl: session?.user?.image,
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setUserData({
            name: data.name,
            email: data.email,
            avatarUrl: data.avatarUpload?.fileUrl || null,
            phoneNumber: data.phoneNumber,
            position: data.position,
          })
        })
        .catch(console.error)
    }
  }, [session?.user?.id])

  // Calculo de progresso
  const currentStepIndex = STEP_ORDER.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / STEP_ORDER.length) * 100

  // Atualizar step no backend
  const updateStep = useCallback(
    async (
      action: 'complete' | 'skip',
      step: OnboardingStepType,
      data?: Record<string, unknown>
    ) => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, step, data }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao atualizar onboarding')
        }

        return result
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erro ao atualizar onboarding'
        )
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Handlers para cada step
  const handleWelcomeContinue = async () => {
    try {
      await updateStep('complete', 'WELCOME')
      setCurrentStep('PROFILE')
    } catch {
      // Error handled in updateStep
    }
  }

  const handleProfileContinue = async (data: Record<string, unknown>) => {
    try {
      await updateStep('complete', 'PROFILE', data)
      setCurrentStep('IMPORT')
    } catch {
      // Error handled in updateStep
    }
  }

  const handleImportContinue = async () => {
    try {
      await updateStep('complete', 'IMPORT')
      setCurrentStep('TOUR')
    } catch {
      // Error handled in updateStep
    }
  }

  const handleImportSkip = async () => {
    try {
      await updateStep('skip', 'IMPORT')
      setCurrentStep('TOUR')
    } catch {
      // Error handled in updateStep
    }
  }

  const handleTourStart = () => {
    setShowTour(true)
  }

  const handleTourComplete = async () => {
    setShowTour(false)
    try {
      await updateStep('complete', 'TOUR')
      setCurrentStep('COMPLETE')
    } catch {
      // Error handled in updateStep
    }
  }

  const handleTourSkip = async () => {
    setShowTour(false)
    try {
      await updateStep('skip', 'TOUR')
      setCurrentStep('COMPLETE')
    } catch {
      // Error handled in updateStep
    }
  }

  const handleFinish = async () => {
    try {
      await updateStep('complete', 'COMPLETE')
      // Atualizar sessao
      await updateSession()
      // Redirecionar para dashboard
      router.push('/regulations')
      router.refresh()
    } catch {
      // Error handled in updateStep
    }
  }

  const handleLogout = async () => {
    // Limpar cookies de sessão antes de deslogar
    await fetch('/api/auth/cleanup', { method: 'POST' }).catch(() => {})
    signOut({ callbackUrl: '/login' })
  }

  return (
    <TourProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <span className="font-bold text-lg">NextSaude</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Passo {currentStepIndex + 1} de {STEP_ORDER.length}
              </span>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>

        {/* Mobile progress */}
        <div className="sm:hidden px-6 py-3 bg-white/50 dark:bg-zinc-900/50 border-b">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">
              {STEP_CONFIG[currentStep].title}
            </span>
            <span className="text-muted-foreground">
              {currentStepIndex + 1}/{STEP_ORDER.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto py-8 px-4">
            {/* Step content */}
            {currentStep === 'WELCOME' && (
              <StepWelcome
                userName={userData.name}
                onContinue={handleWelcomeContinue}
              />
            )}

            {currentStep === 'PROFILE' && (
              <StepProfile
                userData={userData}
                onContinue={handleProfileContinue}
                isLoading={isLoading}
              />
            )}

            {currentStep === 'IMPORT' && (
              <StepImport
                onContinue={handleImportContinue}
                onSkip={handleImportSkip}
                isLoading={isLoading}
              />
            )}

            {currentStep === 'TOUR' && !showTour && (
              <StepTour
                onStartTour={handleTourStart}
                onSkip={handleTourSkip}
                isLoading={isLoading}
              />
            )}

            {currentStep === 'COMPLETE' && (
              <StepComplete
                userName={userData.name}
                onFinish={handleFinish}
                isLoading={isLoading}
              />
            )}
          </div>
        </main>

        {/* Step dots (desktop) */}
        <div className="hidden sm:flex justify-center gap-2 py-4 bg-white/50 dark:bg-zinc-900/50 border-t">
          {STEP_ORDER.map((step, index) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-colors ${
                index < currentStepIndex
                  ? 'bg-green-500'
                  : index === currentStepIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              title={STEP_CONFIG[step].title}
            />
          ))}
        </div>

        {/* Tour overlay */}
        {showTour && (
          <TourOverlay
            onComplete={handleTourComplete}
            onSkip={handleTourSkip}
          />
        )}
      </div>
    </TourProvider>
  )
}
