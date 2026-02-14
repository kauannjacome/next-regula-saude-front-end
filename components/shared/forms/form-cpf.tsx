'use client'

import { useFormContext } from 'react-hook-form'
import { FormField } from './form-field'
import { formatCPF } from '@/lib/format'

interface FormCPFProps {
  name: string
  label?: string
  error?: string
  required?: boolean
  id?: string
  className?: string
  placeholder?: string
  tooltip?: string
}

export function FormCPF({
  name,
  label = "CPF",
  error,
  required,
  id,
  className,
  placeholder = "000.000.000-00",
  tooltip = "Cadastro de Pessoa Física - documento com 11 dígitos. Ex: 123.456.789-00"
}: FormCPFProps) {
  const { register, setValue } = useFormContext()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
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
      maxLength={14}
      {...register(name)}
      onChange={handleChange}
    />
  )
}
