import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  STATUS_CONFIG, 
  REGULATION_STATUS_CONFIG, 
  SCHEDULE_STATUS_CONFIG 
} from '@/lib/constants'

// TIPO: Define quais propriedades este componente aceita
interface StatusBadgeProps {
  status: string
  type?: 'general' | 'regulation' | 'schedule'
  className?: string
}

const CONFIG_MAP = {
  general: STATUS_CONFIG,
  regulation: REGULATION_STATUS_CONFIG,
  schedule: SCHEDULE_STATUS_CONFIG,
}

// COMPONENTE PRINCIPAL
// Renderiza uma badge colorida baseada no status e no tipo
export function StatusBadge({ status, type = 'general', className }: StatusBadgeProps) {
  // Buscar a configuração correta baseada no tipo
  const configs = CONFIG_MAP[type]
  
  // Buscar configuração específica para o status (Key ou Label)
  // @ts-ignore
  const config = configs[status] || 
                 // @ts-ignore - Fallback para busca por label se a key não for encontrada
                 Object.values(configs).find(c => c.label === status) ||
                 // Default se nada for encontrado
                 { label: status, bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }

  return (
    <Badge
      variant="outline"
      className={cn(config.bg, config.text, 'border', config.border, className)}
    >
      {config.label || status}
    </Badge>
  )
}
