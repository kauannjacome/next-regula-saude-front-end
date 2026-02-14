'use client'

import { HelpCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface FormSelectProps {
  label: string
  options: readonly Option[]
  placeholder?: string
  value?: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  className?: string
  id?: string
  tooltip?: string
}

export function FormSelect({
  label,
  options,
  placeholder = "Selecione",
  value,
  onChange,
  error,
  required,
  className,
  id,
  tooltip
}: FormSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={`Ajuda: ${label}`}
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[280px] text-sm bg-popover text-popover-foreground border shadow-md"
            >
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <Select onValueChange={onChange} value={value} defaultValue={value}>
        <SelectTrigger 
          id={id}
          className={cn(error && "border-destructive focus-visible:ring-destructive")}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  )
}
