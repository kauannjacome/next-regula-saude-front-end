'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { TOUR_STEPS } from '@/lib/onboarding'

interface TourStep {
  id: string
  target: string
  title: string
  description: string
  videoUrl?: string | null
  docUrl?: string | null
}

interface TourContextValue {
  isActive: boolean
  currentStepIndex: number
  currentStep: TourStep | null
  totalSteps: number
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  endTour: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

interface TourProviderProps {
  children: ReactNode
}

export function TourProvider({ children }: TourProviderProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const startTour = useCallback(() => {
    setIsActive(true)
    setCurrentStepIndex(0)
  }, [])

  const nextStep = useCallback(() => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }, [currentStepIndex])

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }, [currentStepIndex])

  const skipTour = useCallback(() => {
    setIsActive(false)
    setCurrentStepIndex(0)
  }, [])

  const endTour = useCallback(() => {
    setIsActive(false)
    setCurrentStepIndex(0)
  }, [])

  const value: TourContextValue = {
    isActive,
    currentStepIndex,
    currentStep: isActive ? TOUR_STEPS[currentStepIndex] : null,
    totalSteps: TOUR_STEPS.length,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    endTour,
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
