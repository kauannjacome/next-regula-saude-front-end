// CONFIGURAÇÃO GERAL DE CORES E LABELS
export const STATUS_CONFIG = {
  // Status Genéricos / Ateliê
  Aguardando: { label: 'Aguardando', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  'Em Análise': { label: 'Em Análise', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  Agendado: { label: 'Agendado', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  Realizado: { label: 'Realizado', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  Cancelado: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  Ativo: { label: 'Ativo', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  Inativo: { label: 'Inativo', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
} as const

// CONFIGURAÇÃO DE PRIORIDADES (Chaves do Banco/Enum)
export const PRIORITY_CONFIG = {
  ELECTIVE: { label: 'Eletiva', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  URGENCY: { label: 'Urgência', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  EMERGENCY: { label: 'Emergência', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  // Legado / Compatibilidade
  Alta: { label: 'Alta', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  Média: { label: 'Média', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  Baixa: { label: 'Baixa', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
} as const

export const PLAN_CONFIG = {
  Básico: { bg: 'bg-gray-100', text: 'text-gray-800' },
  Profissional: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Enterprise: { bg: 'bg-purple-100', text: 'text-purple-800' },
} as const

export const GENDERS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' },
] as const

export const COUNCIL_TYPES = [
  { value: 'CRM', label: 'CRM - Conselho Regional de Medicina' },
  { value: 'CRO', label: 'CRO - Conselho Regional de Odontologia' },
  { value: 'COREN', label: 'COREN - Conselho Regional de Enfermagem' },
  { value: 'CRF', label: 'CRF - Conselho Regional de Farmácia' },
  { value: 'CREFITO', label: 'CREFITO - Conselho Regional de Fisioterapia' },
  { value: 'CRP', label: 'CRP - Conselho Regional de Psicologia' },
  { value: 'CRN', label: 'CRN - Conselho Regional de Nutrição' },
  { value: 'Outro', label: 'Outro' },
] as const

export const UNIT_TYPES = [
  { value: 'Hospital', label: 'Hospital' },
  { value: 'UBS', label: 'UBS - Unidade Básica de Saúde' },
  { value: 'Clínica', label: 'Clínica' },
  { value: 'Laboratório', label: 'Laboratório' },
  { value: 'Outro', label: 'Outro' },
] as const

export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
] as const

export const REGULATION_STATUSES = [
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'IN_PROGRESS', label: 'Em Análise' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'DENIED', label: 'Negado' },
  { value: 'RETURNED', label: 'Devolvido' },
] as const

export const PRIORITIES = [
  { value: 'ELECTIVE', label: 'Eletiva' },
  { value: 'URGENCY', label: 'Urgência' },
  { value: 'EMERGENCY', label: 'Emergência' },
] as const

// CONFIGURAÇÃO DE STATUS DE REGULAÇÃO (Chaves do Banco/Enum)
export const REGULATION_STATUS_CONFIG = {
  SCHEDULED: { label: 'Agendado', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  IN_PROGRESS: { label: 'Em Análise', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  APPROVED: { label: 'Aprovado', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  DENIED: { label: 'Negado', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  RETURNED: { label: 'Devolvido', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
} as const

export const SCHEDULE_STATUSES = [
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'WAITING', label: 'Aguardando' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'COMPLETED', label: 'Realizado' },
  { value: 'CANCELED', label: 'Cancelado' },
  { value: 'NO_SHOW', label: 'Não Compareceu' },
  { value: 'RESCHEDULED', label: 'Reagendado' },
] as const

// CONFIGURAÇÃO DE STATUS DE AGENDAMENTO (Chaves do Banco/Enum)
export const SCHEDULE_STATUS_CONFIG = {
  SCHEDULED: { label: 'Agendado', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  CONFIRMED: { label: 'Confirmado', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  WAITING: { label: 'Aguardando', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  IN_PROGRESS: { label: 'Em Andamento', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  COMPLETED: { label: 'Realizado', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  CANCELED: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  NO_SHOW: { label: 'Não Compareceu', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  RESCHEDULED: { label: 'Reagendado', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  // Legado / Compatibilidade (Labels em Português)
  Agendado: { label: 'Agendado', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  Confirmado: { label: 'Confirmado', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  Aguardando: { label: 'Aguardando', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  'Em Andamento': { label: 'Em Andamento', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  Realizado: { label: 'Realizado', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  Cancelado: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  'Não Compareceu': { label: 'Não Compareceu', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  Reagendado: { label: 'Reagendado', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
} as const

export const RECURRENCE_TYPES = [
  { value: 'NONE', label: 'Nenhuma' },
  { value: 'DAILY', label: 'Diária' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quinzenal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'CUSTOM', label: 'Personalizada' },
] as const

// Triggers agrupados por categoria
export const WHATSAPP_TRIGGER_GROUPS = {
  status: {
    label: 'Status da Regulação',
    icon: 'FileText',
    color: 'bg-blue-500',
    triggers: [
      { value: 'STATUS_PENDING', label: 'Regulação Criada' },
      { value: 'STATUS_IN_ANALYSIS', label: 'Em Análise' },
      { value: 'STATUS_APPROVED', label: 'Aprovada' },
      { value: 'STATUS_DENIED', label: 'Negada' },
      { value: 'STATUS_RETURNED', label: 'Devolvida' },
      { value: 'STATUS_SCHEDULED', label: 'Agendada' },
      { value: 'STATUS_COMPLETED', label: 'Concluída' },
      { value: 'STATUS_CANCELLED', label: 'Cancelada' },
    ],
  },
  schedule: {
    label: 'Agendamento',
    icon: 'Calendar',
    color: 'bg-orange-500',
    triggers: [
      { value: 'SCHEDULE_CREATED', label: 'Agendamento Criado' },
      { value: 'SCHEDULE_REMINDER_24H', label: 'Lembrete 24h Antes' },
      { value: 'SCHEDULE_REMINDER_2H', label: 'Lembrete 2h Antes' },
      { value: 'SCHEDULE_CONFIRMED', label: 'Confirmado' },
      { value: 'SCHEDULE_CANCELLED', label: 'Cancelado' },
      { value: 'SCHEDULE_RESCHEDULED', label: 'Reagendado' },
    ],
  },
  medication: {
    label: 'Medicamentos',
    icon: 'Pill',
    color: 'bg-purple-500',
    triggers: [
      { value: 'MEDICATION_ARRIVED', label: 'Medicamento Chegou' },
      { value: 'MEDICATION_READY', label: 'Pronto para Retirada' },
      { value: 'MEDICATION_EXPIRING', label: 'Prazo Expirando' },
    ],
  },
  stock: {
    label: 'Estoque',
    icon: 'Package',
    color: 'bg-amber-500',
    triggers: [
      { value: 'STOCK_LOW', label: 'Estoque Baixo' },
      { value: 'STOCK_REPLENISHED', label: 'Estoque Reposto' },
    ],
  },
  care: {
    label: 'Cuidados',
    icon: 'Heart',
    color: 'bg-rose-500',
    triggers: [
      { value: 'CARE_PLAN_CREATED', label: 'Plano Criado' },
      { value: 'CARE_PLAN_UPDATED', label: 'Plano Atualizado' },
      { value: 'CARE_REMINDER', label: 'Lembrete de Cuidado' },
    ],
  },
  document: {
    label: 'Documentos',
    icon: 'FileCheck',
    color: 'bg-emerald-500',
    triggers: [
      { value: 'DOCUMENT_REQUIRED', label: 'Documento Necessário' },
      { value: 'DOCUMENT_RECEIVED', label: 'Documento Recebido' },
    ],
  },
  general: {
    label: 'Geral',
    icon: 'MessageSquare',
    color: 'bg-gray-500',
    triggers: [
      { value: 'CITIZEN_QUESTION', label: 'Pergunta ao Cidadão' },
      { value: 'CUSTOM', label: 'Personalizado' },
    ],
  },
} as const

// Lista flat para compatibilidade
export const WHATSAPP_TRIGGERS = Object.values(WHATSAPP_TRIGGER_GROUPS).flatMap(
  (group) => [...group.triggers]
)

export const MARITAL_STATUSES = [
  { value: 'Solteiro', label: 'Solteiro(a)' },
  { value: 'Casado', label: 'Casado(a)' },
  { value: 'Divorciado', label: 'Divorciado(a)' },
  { value: 'Viuvo', label: 'Viúvo(a)' },
  { value: 'Separado', label: 'Separado(a)' },
  { value: 'UniaoEstavel', label: 'União Estável' },
] as const

export const RACES = [
  { value: 'Branca', label: 'Branca' },
  { value: 'Preta', label: 'Preta' },
  { value: 'Parda', label: 'Parda' },
  { value: 'Amarela', label: 'Amarela' },
  { value: 'Indigena', label: 'Indígena' },
] as const

export const BLOOD_TYPES = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
] as const

// ==========================================
// CONFIGURAÇÕES DE ESTOQUE
// ==========================================

export const STOCK_CATEGORIES = [
  { value: 'MEDICATION', label: 'Medicamento' },
  { value: 'EXAM', label: 'Exame' },
  { value: 'PROSTHESIS', label: 'Prótese' },
  { value: 'ORTHOSIS', label: 'Órtese' },
  { value: 'MATERIAL', label: 'Material Médico' },
  { value: 'EQUIPMENT', label: 'Equipamento' },
  { value: 'SUPPLEMENT', label: 'Suplemento' },
  { value: 'VACCINE', label: 'Vacina' },
  { value: 'OTHER', label: 'Outros' },
] as const

export const STOCK_ITEM_STATUS = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'OUT_OF_STOCK', label: 'Sem Estoque' },
  { value: 'DISCONTINUED', label: 'Descontinuado' },
] as const

export const STOCK_BATCH_STATUS = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'RESERVED', label: 'Reservado' },
  { value: 'EXPIRED', label: 'Vencido' },
  { value: 'DEPLETED', label: 'Esgotado' },
  { value: 'RETURNED', label: 'Devolvido' },
  { value: 'DAMAGED', label: 'Danificado' },
] as const

export const STOCK_MOVEMENT_TYPES = [
  { value: 'ENTRY', label: 'Entrada' },
  { value: 'EXIT', label: 'Saída' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
  { value: 'TRANSFER', label: 'Transferência' },
  { value: 'RETURN', label: 'Devolução' },
  { value: 'LOSS', label: 'Perda' },
] as const

export const STOCK_MOVEMENT_REASONS = [
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'DONATION', label: 'Doação' },
  { value: 'DISPENSATION', label: 'Dispensação' },
  { value: 'EXPIRED', label: 'Vencido' },
  { value: 'DAMAGED', label: 'Danificado' },
  { value: 'ADJUSTMENT', label: 'Ajuste de Inventário' },
  { value: 'TRANSFER_IN', label: 'Transferência Recebida' },
  { value: 'TRANSFER_OUT', label: 'Transferência Enviada' },
  { value: 'RETURN_SUPPLIER', label: 'Devolução ao Fornecedor' },
  { value: 'RETURN_PATIENT', label: 'Devolução do Paciente' },
  { value: 'SAMPLE', label: 'Amostra' },
  { value: 'CONSUMPTION', label: 'Consumo Interno' },
  { value: 'OTHER', label: 'Outros' },
] as const

export const STOCK_ITEM_STATUS_CONFIG = {
  ACTIVE: { label: 'Ativo', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  INACTIVE: { label: 'Inativo', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  OUT_OF_STOCK: { label: 'Sem Estoque', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  DISCONTINUED: { label: 'Descontinuado', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
} as const

export const STOCK_BATCH_STATUS_CONFIG = {
  AVAILABLE: { label: 'Disponível', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  RESERVED: { label: 'Reservado', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  EXPIRED: { label: 'Vencido', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  DEPLETED: { label: 'Esgotado', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  RETURNED: { label: 'Devolvido', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  DAMAGED: { label: 'Danificado', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
} as const

export const STOCK_MOVEMENT_TYPE_CONFIG = {
  ENTRY: { label: 'Entrada', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', icon: 'ArrowDown' },
  EXIT: { label: 'Saída', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: 'ArrowUp' },
  ADJUSTMENT: { label: 'Ajuste', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: 'RefreshCw' },
  TRANSFER: { label: 'Transferência', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', icon: 'ArrowLeftRight' },
  RETURN: { label: 'Devolução', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', icon: 'RotateCcw' },
  LOSS: { label: 'Perda', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: 'XCircle' },
} as const

export const UNIT_MEASURES = [
  { value: 'MG', label: 'Miligrama (mg)' },
  { value: 'G', label: 'Grama (g)' },
  { value: 'MCG', label: 'Micrograma (mcg)' },
  { value: 'KG', label: 'Quilograma (kg)' },
  { value: 'ML', label: 'Mililitro (ml)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'AMP', label: 'Ampola' },
  { value: 'COMP', label: 'Comprimido' },
  { value: 'CAPS', label: 'Cápsula' },
  { value: 'FR', label: 'Frasco' },
  { value: 'TUB', label: 'Tubo' },
  { value: 'DOSE', label: 'Dose' },
  { value: 'UI', label: 'Unidade Internacional (UI)' },
  { value: 'CX', label: 'Caixa' },
  { value: 'UN', label: 'Unidade' },
  { value: 'SESSION', label: 'Sessão' },
  { value: 'DAILY', label: 'Diária' },
  { value: 'MEASURE', label: 'Medida' },
  { value: 'OINTMENT', label: 'Pomada' },
  { value: 'CREAM', label: 'Creme' },
  { value: 'GEL', label: 'Gel' },
] as const

// ==========================================
// QUALIDADE DO CADASTRO DO CIDADÃO
// ==========================================
// Campos obrigatórios para geração de documentos PDF
// A qualidade do cadastro é medida pelo preenchimento destes campos

export const CITIZEN_PDF_REQUIRED_FIELDS = [
  { field: 'cpf', label: 'CPF' },
  { field: 'cns', label: 'Cartão SUS' },
  { field: 'name', label: 'Nome' },
  { field: 'sex', label: 'Sexo' },
  { field: 'birthDate', label: 'Data de Nascimento' },
  { field: 'motherName', label: 'Nome da Mãe' },
  { field: 'postalCode', label: 'CEP' },
  { field: 'state', label: 'Estado' },
  { field: 'city', label: 'Cidade' },
  { field: 'address', label: 'Logradouro' },
  { field: 'number', label: 'Número' },
  { field: 'neighborhood', label: 'Bairro' },
  { field: 'nationality', label: 'Nacionalidade' },
] as const

// Tipo para citizen data (campos necessários para cálculo de qualidade)
export type CitizenQualityData = {
  cpf?: string | null
  cns?: string | null
  name?: string | null
  sex?: string | null
  birthDate?: string | Date | null
  motherName?: string | null
  postalCode?: string | null
  state?: string | null
  city?: string | null
  address?: string | null
  number?: string | null
  neighborhood?: string | null
  nationality?: string | null
}

// Função para calcular a qualidade do cadastro
export function calculateCitizenQuality(citizen: CitizenQualityData): {
  percentage: number
  filled: number
  total: number
  missingFields: { field: string; label: string }[]
} {
  const missingFields: { field: string; label: string }[] = []
  let filled = 0

  for (const { field, label } of CITIZEN_PDF_REQUIRED_FIELDS) {
    const value = citizen[field as keyof CitizenQualityData]
    if (value && String(value).trim() !== '') {
      filled++
    } else {
      missingFields.push({ field, label })
    }
  }

  const total = CITIZEN_PDF_REQUIRED_FIELDS.length
  const percentage = Math.round((filled / total) * 100)

  return { percentage, filled, total, missingFields }
}

// Configuração de cores para qualidade do cadastro
export function getQualityColor(percentage: number): {
  bg: string
  text: string
  border: string
  progressBg: string
} {
  if (percentage >= 80) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      progressBg: 'bg-emerald-500',
    }
  }
  if (percentage >= 50) {
    return {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      progressBg: 'bg-yellow-500',
    }
  }
  return {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    progressBg: 'bg-red-500',
  }
}
