'use client'

import { useFormContext } from 'react-hook-form'
import { FormField } from './form-field'
import { formatCNS } from '@/lib/format'

interface FormCNSProps {
  name: string
  label?: string
  error?: string
  required?: boolean
  id?: string
  className?: string
  placeholder?: string
  tooltip?: string
}

export function FormCNS({
  name,
  label = "CNS",
  error,
  required,
  id,
  className,
  placeholder = "000 0000 0000 0000",
  tooltip = "Cartão Nacional de Saúde - documento com 15 dígitos. Ex: 123 4567 8901 2345"
}: FormCNSProps) {
  const { register, setValue } = useFormContext()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNS(e.target.value)
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
      maxLength={18}
      {...register(name)}
      onChange={handleChange}
    />
  )
}
