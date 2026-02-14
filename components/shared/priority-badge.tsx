import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PRIORITY_CONFIG } from '@/lib/constants'

interface PriorityBadgeProps {
  priority: string
  className?: string
  showLabel?: boolean
}

export function PriorityBadge({ priority, className, showLabel = true }: PriorityBadgeProps) {
  // @ts-ignore
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || 
                 // @ts-ignore - Fallback para busca por label
                 Object.values(PRIORITY_CONFIG).find(c => c.label === priority) ||
                 PRIORITY_CONFIG['ELECTIVE'] || 
                 PRIORITY_CONFIG['Média']

  return (
    <Badge
      variant="outline"
      className={cn(config.bg, config.text, 'border', config.border, className)}
    >
      {showLabel ? `Prioridade: ${config.label || priority}` : (config.label || priority)}
    </Badge>
  )
}
