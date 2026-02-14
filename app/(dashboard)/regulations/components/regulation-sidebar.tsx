'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, PriorityBadge } from '@/components/shared'
import { Calendar, Clock, Edit, AlertTriangle, Copy } from 'lucide-react'
import { formatDate } from '@/lib/format'

interface TimelineEvent {
  id: string
  date: string
  type: string
  description: string
  user: string
}

interface RegulationSidebarProps {
  status: string
  priority: string
  timeline: TimelineEvent[]
  onSchedule: () => void
  onUpdateStatus: () => void
  onUpdatePriority: () => void
  onCancel: () => void
  onDuplicate: () => void
}

export function RegulationSidebar({
  status,
  priority,
  timeline,
  onSchedule,
  onUpdateStatus,
  onUpdatePriority,
  onCancel,
  onDuplicate,
}: RegulationSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusBadge status={status} className="text-base px-4 py-1" />
        </CardContent>
      </Card>

      {/* Prioridade */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Prioridade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PriorityBadge priority={priority} showLabel={false} className="text-base px-4 py-1" />
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={onSchedule}>
            <Calendar className="mr-2 h-4 w-4" />
            Agendar
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={onUpdateStatus}>
            <Edit className="mr-2 h-4 w-4" />
            Atualizar Status
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={onUpdatePriority}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Atualizar Prioridade
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={onDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={onCancel}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Cancelar Regulação
          </Button>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event.id} className="relative pl-6">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(event.date, "dd/MM/yyyy 'às' HH:mm")}
                    </div>
                    <p className="text-xs text-muted-foreground">{event.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
