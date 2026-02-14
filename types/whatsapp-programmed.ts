export type WhatsAppTrigger =
  // Status de Regulação
  | 'STATUS_PENDING'
  | 'STATUS_IN_ANALYSIS'
  | 'STATUS_APPROVED'
  | 'STATUS_DENIED'
  | 'STATUS_RETURNED'
  | 'STATUS_SCHEDULED'
  | 'STATUS_COMPLETED'
  | 'STATUS_CANCELLED'
  | 'STATUS_CHANGE'
  // Agendamentos
  | 'SCHEDULE_CREATED'
  | 'SCHEDULE_REMINDER_24H'
  | 'SCHEDULE_REMINDER_2H'
  | 'SCHEDULE_CONFIRMED'
  | 'SCHEDULE_CANCELLED'
  | 'SCHEDULE_RESCHEDULED'
  | 'SCHEDULE_REMINDER'
  // Medicamentos
  | 'MEDICATION_ARRIVED'
  | 'MEDICATION_READY'
  | 'MEDICATION_EXPIRING'
  | 'PICKUP_READY'
  // Estoque
  | 'STOCK_LOW'
  | 'STOCK_REPLENISHED'
  // Cuidados
  | 'CARE_PLAN_CREATED'
  | 'CARE_PLAN_UPDATED'
  | 'CARE_REMINDER'
  // Documentos
  | 'DOCUMENT_REQUIRED'
  | 'DOCUMENT_RECEIVED'
  // Geral
  | 'CITIZEN_QUESTION'
  | 'CUSTOM'

export interface WhatsAppProgrammed {
  id: number
  uuid: string
  subscriberId: number
  name: string
  triggerType: WhatsAppTrigger
  triggerValue?: string
  headerText?: string
  bodyText: string
  footerText?: string
  buttons?: any
  isActive: boolean
  createdAt: string
}
