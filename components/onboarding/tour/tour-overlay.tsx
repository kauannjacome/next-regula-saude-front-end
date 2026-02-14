'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Video,
  BookOpen,
  ExternalLink,
} from 'lucide-react'
import { TOUR_STEPS } from '@/lib/onboarding'

interface TourOverlayProps {
  onComplete: () => void
  onSkip: () => void
}

interface HighlightRect {
  top: number
  left: number
  width: number
  height: number
}

export function TourOverlay({ onComplete, onSkip }: TourOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number
    left: number
    placement: 'top' | 'bottom' | 'left' | 'right'
  }>({ top: 0, left: 0, placement: 'bottom' })

  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = TOUR_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TOUR_STEPS.length - 1

  // Encontrar e destacar elemento
  const updateHighlight = useCallback(() => {
    if (!step) return

    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      const padding = 8

      setHighlightRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      })

      // Calcular posicao do tooltip
      const tooltipWidth = 320
      const tooltipHeight = 200
      const margin = 16

      let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom'
      let top = rect.bottom + margin
      let left = rect.left + rect.width / 2 - tooltipWidth / 2

      // Ajustar se sair da tela
      if (top + tooltipHeight > window.innerHeight) {
        placement = 'top'
        top = rect.top - tooltipHeight - margin
      }

      if (left < margin) {
        left = margin
      } else if (left + tooltipWidth > window.innerWidth - margin) {
        left = window.innerWidth - tooltipWidth - margin
      }

      // Se nao couber em cima nem embaixo, tentar lado
      if (top < margin) {
        if (rect.right + tooltipWidth + margin < window.innerWidth) {
          placement = 'right'
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.right + margin
        } else {
          placement = 'left'
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.left - tooltipWidth - margin
        }
      }

      setTooltipPosition({ top: Math.max(margin, top), left, placement })
    } else {
      // Elemento nao encontrado - mostrar tooltip centralizado
      setHighlightRect(null)
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 160,
        placement: 'bottom',
      })
    }
  }, [step])

  useEffect(() => {
    updateHighlight()

    // Atualizar ao redimensionar
    window.addEventListener('resize', updateHighlight)
    return () => window.removeEventListener('resize', updateHighlight)
  }, [updateHighlight])

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay escuro com buraco */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left}
                y={highlightRect.top}
                width={highlightRect.width}
                height={highlightRect.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Borda destacada do elemento */}
      {highlightRect && (
        <div
          className="absolute border-2 border-blue-500 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: 320,
        }}
      >
        <Card className="shadow-2xl border-2 border-blue-500">
          <CardContent className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {currentStep + 1} de {TOUR_STEPS.length}
                </p>
                <h3 className="font-bold text-lg">{step?.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-1"
                onClick={onSkip}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Descricao */}
            <p className="text-sm text-muted-foreground">{step?.description}</p>

            {/* Links de recursos */}
            {(step?.videoUrl || step?.docUrl) && (
              <div className="flex gap-2">
                {step?.videoUrl && (
                  <a
                    href={step.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Video className="h-3 w-3" />
                    Ver video
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {step?.docUrl && (
                  <a
                    href={step.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <BookOpen className="h-3 w-3" />
                    Documentacao
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 py-2">
              {TOUR_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Navegacao */}
            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={isFirstStep}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Concluir
                  </>
                ) : (
                  <>
                    Proximo
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
