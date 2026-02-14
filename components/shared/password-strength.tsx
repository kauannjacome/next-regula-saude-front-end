'use client'

import { useState, useEffect } from 'react'
import { Check, X, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Requisitos de senha
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 50,
  hasNumber: /[0-9]/,
  hasLowercase: /[a-z]/,
  hasUppercase: /[A-Z]/,
  hasSymbol: /[-().&@?'#,/;+]/,
  allowedSymbols: '-().&@?\'#,/;+'
}

export interface PasswordValidation {
  isValid: boolean
  hasMinLength: boolean
  hasMaxLength: boolean
  hasNumber: boolean
  hasLowercase: boolean
  hasUppercase: boolean
  hasSymbol: boolean
}

// Funcao para validar senha
export function validatePassword(password: string): PasswordValidation {
  const hasMinLength = password.length >= PASSWORD_REQUIREMENTS.minLength
  const hasMaxLength = password.length <= PASSWORD_REQUIREMENTS.maxLength
  const hasNumber = PASSWORD_REQUIREMENTS.hasNumber.test(password)
  const hasLowercase = PASSWORD_REQUIREMENTS.hasLowercase.test(password)
  const hasUppercase = PASSWORD_REQUIREMENTS.hasUppercase.test(password)
  const hasSymbol = PASSWORD_REQUIREMENTS.hasSymbol.test(password)

  const isValid = hasMinLength && hasMaxLength && hasNumber && hasLowercase && hasUppercase && hasSymbol

  return {
    isValid,
    hasMinLength,
    hasMaxLength,
    hasNumber,
    hasLowercase,
    hasUppercase,
    hasSymbol
  }
}

interface RequirementItemProps {
  met: boolean
  text: string
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 text-sm transition-colors',
      met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
    )}>
      {met ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span>{text}</span>
    </div>
  )
}

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password)

  // Calcula porcentagem de requisitos atendidos
  const requirements = [
    validation.hasMinLength,
    validation.hasNumber,
    validation.hasLowercase,
    validation.hasUppercase,
    validation.hasSymbol
  ]
  const metCount = requirements.filter(Boolean).length
  const percentage = (metCount / requirements.length) * 100

  // Define cor da barra baseado na porcentagem
  const getBarColor = () => {
    if (percentage <= 20) return 'bg-red-500'
    if (percentage <= 40) return 'bg-orange-500'
    if (percentage <= 60) return 'bg-yellow-500'
    if (percentage <= 80) return 'bg-lime-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (percentage <= 20) return 'Muito fraca'
    if (percentage <= 40) return 'Fraca'
    if (percentage <= 60) return 'Razoavel'
    if (percentage <= 80) return 'Boa'
    return 'Forte'
  }

  if (!password) return null

  return (
    <div className={cn('space-y-3 mt-2', className)}>
      {/* Barra de forca */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Forca da senha</span>
          <span className={cn(
            'font-medium',
            percentage === 100 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
          )}>
            {getStrengthText()}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300 rounded-full', getBarColor())}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Lista de requisitos */}
      <div className="grid gap-1.5 p-3 bg-muted/50 rounded-lg border">
        <p className="text-xs font-medium text-muted-foreground mb-1">Requisitos da senha:</p>
        <RequirementItem
          met={validation.hasMinLength && validation.hasMaxLength}
          text={`${PASSWORD_REQUIREMENTS.minLength}-${PASSWORD_REQUIREMENTS.maxLength} caracteres`}
        />
        <RequirementItem
          met={validation.hasUppercase}
          text="Uma letra maiuscula (A-Z)"
        />
        <RequirementItem
          met={validation.hasLowercase}
          text="Uma letra minuscula (a-z)"
        />
        <RequirementItem
          met={validation.hasNumber}
          text="Um numero (0-9)"
        />
        <RequirementItem
          met={validation.hasSymbol}
          text={`Um simbolo (${PASSWORD_REQUIREMENTS.allowedSymbols})`}
        />
      </div>
    </div>
  )
}

interface PasswordInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showStrength?: boolean
  className?: string
  disabled?: boolean
  required?: boolean
  error?: string
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Digite sua senha',
  showStrength = true,
  className,
  disabled,
  required,
  error
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            'pr-10',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          maxLength={PASSWORD_REQUIREMENTS.maxLength}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {showStrength && <PasswordStrengthIndicator password={value} />}
    </div>
  )
}

// Hook para usar validacao de senha em formularios
export function usePasswordValidation(password: string) {
  const [validation, setValidation] = useState<PasswordValidation>({
    isValid: false,
    hasMinLength: false,
    hasMaxLength: true,
    hasNumber: false,
    hasLowercase: false,
    hasUppercase: false,
    hasSymbol: false
  })

  useEffect(() => {
    setValidation(validatePassword(password))
  }, [password])

  return validation
}
