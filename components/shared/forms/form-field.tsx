'use client'

import { HelpCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  required?: boolean
  rightElement?: ReactNode
  tooltip?: string
}

export function FormField({
  label,
  error,
  required,
  id,
  className,
  rightElement,
  tooltip,
  ...props
}: FormFieldProps) {
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
      <div className="relative">
        <Input 
          id={id} 
          className={cn(error && "border-destructive focus-visible:ring-destructive")} 
          {...props} 
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  )
}
