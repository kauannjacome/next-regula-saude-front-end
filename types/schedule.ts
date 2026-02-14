export type ScheduleStatus = 'SCHEDULED' | 'CONFIRMED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW' | 'RESCHEDULED'
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM'

export interface Schedule {
  id: number
  uuid: string
  subscriberId: number
  regulationId: number
  professionalId?: string
  status: ScheduleStatus
  scheduledDate: string
  scheduledEndDate?: string
  notes?: string
  recurrenceType: RecurrenceType
  recurrenceInterval?: number
  recurrenceEndDate?: string
  parentScheduleId?: number
  regulation?: {
    id: number
    citizen?: { id: number; name: string; cpf: string; birthDate?: string }
    cares?: { care: { id: number; name: string; acronym?: string | null } }[]
  }
  professional?: { id: string; name: string }
  createdAt: string
}
