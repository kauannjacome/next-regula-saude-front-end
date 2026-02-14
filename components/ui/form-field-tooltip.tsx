"use client"

import * as React from "react"
import { HelpCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface LabelWithTooltipProps {
  label: string
  tooltip?: string
  htmlFor?: string
  required?: boolean
  className?: string
}

export function LabelWithTooltip({
  label,
  tooltip,
  htmlFor,
  required,
  className,
}: LabelWithTooltipProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
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
  )
}

interface FormFieldProps {
  label: string
  tooltip?: string
  htmlFor?: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  tooltip,
  htmlFor,
  required,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <LabelWithTooltip
        label={label}
        tooltip={tooltip}
        htmlFor={htmlFor}
        required={required}
      />
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
