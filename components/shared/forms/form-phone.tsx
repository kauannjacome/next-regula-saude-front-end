'use client'

import { useFormContext } from 'react-hook-form'
import { FormField } from './form-field'
import { formatPhone } from '@/lib/format'

interface FormPhoneProps {
  name: string
  label?: string
  error?: string
  required?: boolean
  id?: string
  className?: string
  placeholder?: string
  tooltip?: string
}

export function FormPhone({
  name,
  label = "Telefone",
  error,
  required,
  id,
  className,
  placeholder = "(00) 00000-0000",
  tooltip = "Telefone para contato com DDD. Ex: (11) 99999-9999"
}: FormPhoneProps) {
  const { register, setValue } = useFormContext()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue(name, formatted, { shouldValidate: true })
  }

  return (
    <FormField
      id={id || name}
      label={label}
      error={error}
      required={required}
      className={className}
      placeholder={placeholder}
      tooltip={tooltip}
      maxLength={15}
      {...register(name)}
      onChange={handleChange}
    />
  )
}
