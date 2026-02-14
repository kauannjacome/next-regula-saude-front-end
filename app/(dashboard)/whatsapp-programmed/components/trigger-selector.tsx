import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WHATSAPP_TRIGGER_GROUPS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Calendar, 
  Pill, 
  Package, 
  Heart, 
  FileCheck, 
  MessageSquare 
} from 'lucide-react'

// Mapeamento de ícones para triggers (reutilizado)
const TRIGGER_ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  Calendar,
  Pill,
  Package,
  Heart,
  FileCheck,
  MessageSquare,
}

interface TriggerSelectorProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function TriggerSelector({ value, onChange, error }: TriggerSelectorProps) {
  
  // Encontra o grupo do trigger selecionado
  const getSelectedTriggerGroup = () => {
    for (const [groupKey, group] of Object.entries(WHATSAPP_TRIGGER_GROUPS)) {
      if (group.triggers.some((t) => t.value === value)) {
        return group.label
      }
    }
    return null
  }

  const selectedGroupLabel = getSelectedTriggerGroup()

  return (
    <div className="space-y-4">
      {Object.entries(WHATSAPP_TRIGGER_GROUPS).map(([key, group]) => {
         const GroupIcon = TRIGGER_ICON_MAP[group.icon] || MessageSquare
         
         return (
            <div key={key} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <GroupIcon className="h-4 w-4" />
                    {group.label}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.triggers.map((trigger) => {
                        const isSelected = value === trigger.value
                        return (
                            <button
                                key={trigger.value}
                                type="button"
                                onClick={() => onChange(trigger.value)}
                                className={cn(
                                    "relative flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                                    "hover:border-primary/50 hover:bg-muted/30",
                                    isSelected 
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                                        : "border-border bg-card"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        isSelected ? group.color : "bg-gray-300 dark:bg-gray-600"
                                    )} />
                                    <span className={cn(
                                        "text-sm",
                                        isSelected ? "font-medium text-primary" : "text-muted-foreground"
                                    )}>
                                        {trigger.label}
                                    </span>
                                </div>
                                {isSelected && (
                                    <Check className="h-4 w-4 text-primary animate-in fade-in zoom-in duration-200" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
         )
      })}
      
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
