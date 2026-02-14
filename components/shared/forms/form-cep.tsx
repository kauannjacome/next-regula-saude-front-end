'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField } from './form-field'
import { formatCEP } from '@/lib/format'
import { fetchAddressByCEP } from '@/lib/services/cep-service'
import { Loader2 } from 'lucide-react'

interface FormCEPProps {
  name: string
  label?: string
  error?: string
  required?: boolean
  id?: string
  className?: string
  onAddressFetch?: (address: any) => void
  tooltip?: string
}

export function FormCEP({
  name,
  label = "CEP",
  error,
  required,
  id,
  className,
  onAddressFetch,
  tooltip = "Código de Endereçamento Postal com 8 dígitos. Ex: 01310-100. O endereço será preenchido automaticamente."
}: FormCEPProps) {
  const [isFetching, setIsFetching] = useState(false)
  const { register, setValue } = useFormContext()

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    setValue(name, formatted, { shouldValidate: true })

    if (formatted.length === 9) {
      setIsFetching(true)
      const address = await fetchAddressByCEP(formatted)
      setIsFetching(false)

      if (address && onAddressFetch) {
        onAddressFetch(address)
      }
    }
  }

  return (
    <FormField
      id={id || name}
      label={label}
      error={error}
      required={required}
      className={className}
      placeholder="00000-000"
      tooltip={tooltip}
      maxLength={9}
      rightElement={isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      {...register(name)}
      onChange={handleChange}
    />
  )
}
