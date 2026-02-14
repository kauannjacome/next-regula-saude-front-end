/**
 * =============================================
 * ARQUIVO DE VALIDADORES E SCHEMAS (validators.ts)
 * =============================================
 *
 * Este arquivo contém todos os schemas de validação do sistema NextSaúde,
 * utilizando a biblioteca Zod para garantir que os dados recebidos nos
 * formulários e nas APIs estejam no formato correto.
 *
 * O Zod é uma biblioteca de validação de dados que permite definir
 * "schemas" (moldes) para os dados. Se os dados não seguirem o molde,
 * o Zod retorna mensagens de erro amigáveis.
 *
 * Conceitos básicos do Zod usados neste arquivo:
 * - z.string()    => O campo deve ser uma string (texto)
 * - z.number()    => O campo deve ser um número
 * - z.boolean()   => O campo deve ser verdadeiro ou falso
 * - z.enum([...]) => O campo deve ser um dos valores listados
 * - z.object({})  => O campo deve ser um objeto com os campos definidos
 * - z.array([])   => O campo deve ser uma lista/array
 * - .optional()   => O campo NÃO é obrigatório (pode ser omitido)
 * - .default(x)   => Se o campo não for informado, assume o valor x
 * - .min(n)       => Valor mínimo (para números) ou tamanho mínimo (para strings)
 * - .max(n)       => Valor máximo (para números) ou tamanho máximo (para strings)
 * - .regex(r)     => O texto deve seguir o padrão da expressão regular r
 * - .refine(fn)   => Validação customizada usando uma função
 * - .or(z.literal('')) => Também aceita string vazia como valor válido
 * - z.coerce.number() => Converte automaticamente string para número antes de validar
 */
import * as z from 'zod'

/**
 * Expressão regular para validar o formato do CPF.
 * O CPF deve estar no formato: 000.000.000-00 (com pontos e traço).
 * Usado nos schemas de cidadão, profissional e usuário.
 */
export const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/

/**
 * Função que valida matematicamente se um CPF é válido.
 *
 * O CPF possui 11 dígitos, sendo os 2 últimos os "dígitos verificadores".
 * Esses dígitos são calculados a partir dos 9 primeiros usando um algoritmo
 * específico da Receita Federal.
 *
 * Etapas da validação:
 * 1. Remove todos os caracteres que não são números (pontos, traços etc.)
 * 2. Verifica se tem exatamente 11 dígitos
 * 3. Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
 * 4. Calcula o primeiro dígito verificador (posição 10)
 * 5. Calcula o segundo dígito verificador (posição 11)
 *
 * @param cpf - O CPF a ser validado (pode ter ou não formatação)
 * @returns true se o CPF é válido, false caso contrário
 */
export function validateCPF(cpf: string): boolean {
  // Remove tudo que não é número (pontos, traços, espaços)
  const cleaned = cpf.replace(/\D/g, '')
  // CPF deve ter exatamente 11 dígitos
  if (cleaned.length !== 11) return false
  // Rejeita CPFs com todos os dígitos iguais (ex: 000.000.000-00, 111.111.111-11)
  if (/^(\d)\1+$/.test(cleaned)) return false

  // Cálculo do PRIMEIRO dígito verificador (posição 10)
  // Multiplica cada um dos 9 primeiros dígitos por pesos de 10 a 2
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  // O resto da divisão por 11 determina o dígito verificador
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  // Se o resultado não bater com o 10o dígito, CPF é inválido
  if (remainder !== parseInt(cleaned.charAt(9))) return false

  // Cálculo do SEGUNDO dígito verificador (posição 11)
  // Multiplica cada um dos 10 primeiros dígitos por pesos de 11 a 2
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  // Se o resultado não bater com o 11o dígito, CPF é inválido
  return remainder === parseInt(cleaned.charAt(10))
}

// Validador de CNPJ
export const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let size = cleaned.length - 2
  let numbers = cleaned.substring(0, size)
  const digits = cleaned.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  size = size + 1
  numbers = cleaned.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return result === parseInt(digits.charAt(1))
}

// Schemas de validação
export const addressSchema = z.object({
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
})

export const citizenSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo'),
  cpf: z.string().regex(cpfRegex, 'CPF inválido').refine(validateCPF, 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['M', 'F', 'O'], { message: 'Gênero é obrigatório' }),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cartaoSus: z.string().optional(),
  rg: z.string().optional(),
  rgIssuer: z.string().optional(),
  rgState: z.string().length(2, 'UF precisa ter 2 letras').optional().or(z.literal('')),
  rgIssueDate: z.string().optional(),
  motherName: z.string().min(3, 'Nome da mãe é obrigatório'),
  fatherName: z.string().optional(),
  socialName: z.string().optional(),
  race: z.string().optional(),
  nationality: z.string().optional(),
  placeOfBirth: z.string().optional(),
  maritalStatus: z.string().optional(),
  bloodType: z.string().optional(),
  sex: z.string().optional(),
  address: z.object({
    cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
    logradouro: z.string().min(1, 'Logradouro é obrigatório'),
    numero: z.string().min(1, 'Número é obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(1, 'Bairro é obrigatório'),
    cidade: z.string().min(1, 'Cidade é obrigatória'),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
  }),
})

export const professionalSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().regex(cpfRegex, 'CPF inválido'),
  rg: z.string().optional(),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  council: z.enum(['CRM', 'CRO', 'COREN', 'CRF', 'CREFITO', 'CRP', 'CRN', 'Outro']),
  councilNumber: z.string().min(1, 'Número do conselho é obrigatório'),
  councilUf: z.string().length(2, 'UF inválida'),
  specialty: z.string().min(1, 'Especialidade é obrigatória'),
  registrationDate: z.string().optional(),
  address: addressSchema,
})

export const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  cpf: z.string().regex(cpfRegex, 'CPF inválido').refine(validateCPF, 'CPF inválido'),
  phoneNumber: z.string().min(10, 'Telefone inválido'),
  birthDate: z.string().optional(),
  sex: z.string().optional(),
  maritalStatus: z.string().optional(),
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  nationality: z.string().optional(),
  isPasswordTemp: z.boolean().default(true),

  // Identificação
  rg: z.string().optional(),
  cns: z.string().optional(),

  role: z.enum(['admin_municipal', 'assistant_municipal', 'doctor', 'pharmaceutical', 'typist'], {
    message: 'Selecione um papel',
  }),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),

  // Address (Nested object)
  address: z.object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
  }).optional(),

  council: z.string().optional(),
  councilNumber: z.string().optional(),
  councilUf: z.string().optional(),
  specialty: z.string().optional(),
})


// Schema para horário de funcionamento (formato HH:MM)
const timeSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido (use HH:MM)').optional().or(z.literal(''))

export const operatingHoursSchema = z.object({
  mondayOpen: timeSchema,
  mondayClose: timeSchema,
  tuesdayOpen: timeSchema,
  tuesdayClose: timeSchema,
  wednesdayOpen: timeSchema,
  wednesdayClose: timeSchema,
  thursdayOpen: timeSchema,
  thursdayClose: timeSchema,
  fridayOpen: timeSchema,
  fridayClose: timeSchema,
  saturdayOpen: timeSchema,
  saturdayClose: timeSchema,
  sundayOpen: timeSchema,
  sundayClose: timeSchema,
  operatingNotes: z.string().optional(),
})

export const unitSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  type: z.enum(['Hospital', 'UBS', 'Clínica', 'Laboratório', 'Outro']),
  cnes: z.string().min(1, 'CNES é obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: addressSchema,
  operatingHours: operatingHoursSchema.optional(),
})

export const supplierSchema = z.object({
  razaoSocial: z.string().min(3, 'Razão social é obrigatória'),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().regex(cnpjRegex, 'CNPJ inválido'),
  stateRegistration: z.string().optional(),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  address: addressSchema.optional(),
  contact: z.object({
    name: z.string().min(1, 'Nome do contato é obrigatório'),
    phone: z.string().min(10, 'Telefone do contato inválido'),
    email: z.string().email('Email do contato inválido').optional().or(z.literal('')),
  }).optional(),
})

export const folderSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
  idCode: z.string().optional(),
  responsibleId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const careGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
})

export const groupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().optional(),
  description: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  remember: z.boolean().optional(),
})

export const passwordRecoverySchema = z.object({
  email: z.string().email('Email inválido'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export const scheduleSchema = z.object({
  regulationId: z.number({ message: 'Regulação é obrigatória' }),
  professionalId: z.string().optional(),
  scheduledDate: z.string().min(1, 'Data do agendamento é obrigatória'),
  scheduledEndDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'NO_SHOW', 'RESCHEDULED']).default('SCHEDULED'),
  recurrenceType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM']).default('NONE'),
  recurrenceInterval: z.number().optional(),
  recurrenceEndDate: z.string().optional(),
  cancellationReason: z.string().optional(),
  noShowReason: z.string().optional(),
}).refine((data) => {
  // Se status é CANCELED, motivo é obrigatório
  if (data.status === 'CANCELED' && !data.cancellationReason?.trim()) {
    return false
  }
  return true
}, {
  message: 'Motivo do cancelamento é obrigatório',
  path: ['cancellationReason'],
}).refine((data) => {
  // Se status é NO_SHOW, motivo é obrigatório
  if (data.status === 'NO_SHOW' && !data.noShowReason?.trim()) {
    return false
  }
  return true
}, {
  message: 'Motivo da falta é obrigatório',
  path: ['noShowReason'],
})

// Todos os triggers disponíveis para WhatsApp Programmed
const WHATSAPP_TRIGGER_VALUES = [
  // Status de Regulação
  'STATUS_PENDING',
  'STATUS_IN_ANALYSIS',
  'STATUS_APPROVED',
  'STATUS_DENIED',
  'STATUS_RETURNED',
  'STATUS_SCHEDULED',
  'STATUS_COMPLETED',
  'STATUS_CANCELLED',
  'STATUS_CHANGE', // Legado
  // Agendamentos
  'SCHEDULE_CREATED',
  'SCHEDULE_REMINDER_24H',
  'SCHEDULE_REMINDER_2H',
  'SCHEDULE_CONFIRMED',
  'SCHEDULE_CANCELLED',
  'SCHEDULE_RESCHEDULED',
  'SCHEDULE_REMINDER', // Legado
  // Medicamentos
  'MEDICATION_ARRIVED',
  'MEDICATION_READY',
  'MEDICATION_EXPIRING',
  'PICKUP_READY', // Legado
  // Estoque
  'STOCK_LOW',
  'STOCK_REPLENISHED',
  // Cuidados
  'CARE_PLAN_CREATED',
  'CARE_PLAN_UPDATED',
  'CARE_REMINDER',
  // Documentos
  'DOCUMENT_REQUIRED',
  'DOCUMENT_RECEIVED',
  // Geral
  'CITIZEN_QUESTION',
  'CUSTOM',
] as const

export const whatsappProgrammedSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  triggerType: z.enum(WHATSAPP_TRIGGER_VALUES),
  triggerValue: z.string().optional(),
  headerText: z.string().optional(),
  bodyText: z.string().min(1, 'Conteúdo da mensagem é obrigatório'),
  footerText: z.string().optional(),
  isActive: z.boolean().default(true),
})

// ==========================================
// UPDATE SCHEMAS (para operações PATCH/PUT)
// ==========================================

export const unitUpdateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  type: z.enum(['Hospital', 'UBS', 'Clínica', 'Laboratório', 'Outro']).optional(),
  cnes: z.string().optional(),
  phone: z.string().min(10, 'Telefone inválido').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: addressSchema.partial().optional(),
})

export const supplierUpdateSchema = z.object({
  razaoSocial: z.string().min(3, 'Razão social é obrigatória').optional(),
  nomeFantasia: z.string().optional(),
  name: z.string().optional(),
  tradeName: z.string().optional(),
  cnpj: z.string().optional(),
  stateRegistration: z.string().optional(),
  phone: z.string().min(10, 'Telefone inválido').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  address: addressSchema.partial().optional(),
})

export const folderUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  idCode: z.string().optional(),
  description: z.string().optional(),
  responsibleId: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const groupUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  code: z.string().optional(),
  description: z.string().optional(),
})

// ==========================================
// REGULATION SCHEMAS
// ==========================================

export const regulationCreateSchema = z.object({
  citizenId: z.number({ message: 'Cidadão é obrigatório' }),
  responsibleId: z.number().optional(),
  requestDate: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'APPROVED', 'DENIED', 'RETURNED']).optional(),
  notes: z.string().optional(),
  clinicalIndication: z.string().optional(),
  cid: z.string().optional(),
  folderId: z.number().optional(),
  relationship: z.enum(['FRIEND', 'PARENT', 'CAREGIVER', 'BOYFRIEND_GIRLFRIEND', 'SPOUSE', 'UNCLE_AUNT', 'SIBLING', 'COUSIN', 'NEPHEW_NIECE']).optional(),
  priority: z.enum(['ELECTIVE', 'URGENCY', 'EMERGENCY']).default('ELECTIVE'),
  templateId: z.number().optional(),
  requestingProfessional: z.string().optional(),
  supplierId: z.number().optional(),
  careIds: z.array(z.number()).optional(),
  analyzerId: z.string().optional(),
  resourceOrigin: z.enum(['NOT_SPECIFIED', 'MUNICIPAL', 'STATE', 'FEDERAL']).optional(),
  cares: z.array(z.object({ careId: z.number(), quantity: z.number().optional() })).optional(),
})

export const regulationUpdateSchema = z.object({
  citizenId: z.number().optional(),
  responsibleId: z.number().optional(),
  requestDate: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'APPROVED', 'DENIED', 'RETURNED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  clinicalIndication: z.string().optional(),
  cid: z.string().optional(),
  folderId: z.number().optional(),
  relationship: z.enum(['FRIEND', 'PARENT', 'CAREGIVER', 'BOYFRIEND_GIRLFRIEND', 'SPOUSE', 'UNCLE_AUNT', 'SIBLING', 'COUSIN', 'NEPHEW_NIECE']).optional(),
  priority: z.enum(['ELECTIVE', 'URGENCY', 'EMERGENCY']).optional(),
  templateId: z.number().optional(),
  requestingProfessional: z.string().optional(),
  supplierId: z.number().optional(),
  careIds: z.array(z.number()).optional(),
  analyzerId: z.string().optional(),
  printerId: z.string().optional(),
  denialReason: z.string().optional(),
  returnReason: z.string().optional(),
  cancellationReason: z.string().optional(),
  resourceOrigin: z.enum(['NOT_SPECIFIED', 'MUNICIPAL', 'STATE', 'FEDERAL']).optional(),
  sendWhatsapp: z.boolean().optional(),
  whatsappTemplateId: z.number().optional(),
  cares: z.array(z.object({ careId: z.number(), quantity: z.number().optional() })).optional(),
})

// ==========================================
// CARE SCHEMAS
// ==========================================

export const careCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  acronym: z.string().optional(),
  description: z.string().optional(),
  protocol: z.string().optional(),
  type: z.string().optional(),
  typeDeclaration: z.enum(['NONE', 'RESIDENCE_PEC', 'RESIDENCE_CADSUS', 'UPDATE_CADSUS', 'COST_HELP', 'HIGH_COST_EXAM', 'AUTHORIZATION', 'WITHDRAWAL', 'AIH', 'TRANSPORT', 'CER', 'CONTINUOUS_MEDICATION', 'PHARMACEUTICAL_ASSISTANCE']).optional(),
  sigtapCode: z.string().optional(),
  complexity: z.string().optional(),
  gender: z.string().optional(),
  stayTime: z.coerce.number().optional(),
  value: z.coerce.number().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'Ativo', 'Inativo']).default('ACTIVE'),
  resourceOrigin: z.enum(['NOT_SPECIFIED', 'MUNICIPAL', 'STATE', 'FEDERAL']).optional(),
  priority: z.enum(['ELECTIVE', 'URGENCY', 'EMERGENCY']).default('ELECTIVE'),
  unitMeasure: z.enum(['MG', 'G', 'MCG', 'KG', 'ML', 'L', 'AMP', 'COMP', 'CAPS', 'FR', 'TUB', 'DOSE', 'UI', 'CX', 'UN', 'SESSION', 'DAILY', 'MEASURE', 'OINTMENT', 'CREAM', 'GEL']).optional(),
  minDeadlineDays: z.coerce.number().optional(),
  groupId: z.coerce.number().optional(),
  subGroupId: z.coerce.number().optional(),
  supplierId: z.coerce.number().optional(),
  minAge: z.coerce.number().optional(),
  maxAge: z.coerce.number().optional(),
}).refine((data) => {
  if (data.minAge != null && data.maxAge != null) {
    return data.minAge <= data.maxAge
  }
  return true
}, {
  message: 'Idade mínima deve ser menor ou igual à idade máxima',
  path: ['minAge'],
})

export const careUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  acronym: z.string().optional(),
  description: z.string().optional(),
  protocol: z.string().optional(),
  type: z.string().optional(),
  typeDeclaration: z.enum(['NONE', 'RESIDENCE_PEC', 'RESIDENCE_CADSUS', 'UPDATE_CADSUS', 'COST_HELP', 'HIGH_COST_EXAM', 'AUTHORIZATION', 'WITHDRAWAL', 'AIH', 'TRANSPORT', 'CER', 'CONTINUOUS_MEDICATION', 'PHARMACEUTICAL_ASSISTANCE']).optional(),
  sigtapCode: z.string().optional(),
  complexity: z.string().optional(),
  gender: z.string().optional(),
  stayTime: z.coerce.number().optional(),
  value: z.coerce.number().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'Ativo', 'Inativo']).optional(),
  resourceOrigin: z.enum(['NOT_SPECIFIED', 'MUNICIPAL', 'STATE', 'FEDERAL']).optional(),
  priority: z.enum(['ELECTIVE', 'URGENCY', 'EMERGENCY']).optional(),
  unitMeasure: z.enum(['MG', 'G', 'MCG', 'KG', 'ML', 'L', 'AMP', 'COMP', 'CAPS', 'FR', 'TUB', 'DOSE', 'UI', 'CX', 'UN', 'SESSION', 'DAILY', 'MEASURE', 'OINTMENT', 'CREAM', 'GEL']).optional(),
  minDeadlineDays: z.coerce.number().optional(),
  groupId: z.coerce.number().optional(),
  subGroupId: z.coerce.number().optional(),
  supplierId: z.coerce.number().optional(),
  minAge: z.coerce.number().optional(),
  maxAge: z.coerce.number().optional(),
}).refine((data) => {
  if (data.minAge != null && data.maxAge != null) {
    return data.minAge <= data.maxAge
  }
  return true
}, {
  message: 'Idade mínima deve ser menor ou igual à idade máxima',
  path: ['minAge'],
})

// ==========================================
// SCHEDULE SCHEMAS (renomeado para evitar conflito)
// ==========================================

export const scheduleCreateSchema = z.object({
  regulationId: z.number({ message: 'Regulação é obrigatória' }),
  professionalId: z.string().min(1, 'Profissional é obrigatório'),
  scheduledDate: z.string().min(1, 'Data do agendamento é obrigatória'),
  scheduledEndDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'NO_SHOW', 'RESCHEDULED']).default('SCHEDULED'),
  recurrenceType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM']).default('NONE'),
  recurrenceInterval: z.number().optional(),
  recurrenceEndDate: z.string().optional(),
  parentScheduleId: z.number().optional(),
}).refine((data) => {
  if (data.recurrenceType && data.recurrenceType !== 'NONE') {
    return data.recurrenceInterval != null && data.recurrenceInterval > 0
  }
  return true
}, {
  message: 'Intervalo de recorrência é obrigatório quando o tipo de recorrência não é NONE',
  path: ['recurrenceInterval'],
})

export const scheduleUpdateSchema = z.object({
  regulationId: z.number().optional(),
  professionalId: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledEndDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'NO_SHOW', 'RESCHEDULED']).optional(),
  recurrenceType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
  recurrenceInterval: z.number().optional(),
  recurrenceEndDate: z.string().optional(),
  cancellationReason: z.string().optional(),
  noShowReason: z.string().optional(),
})

// ==========================================
// PAGINATION SCHEMA
// ==========================================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// ==========================================
// ID PARAMS SCHEMA
// ==========================================

export const idParamSchema = z.object({
  id: z.coerce.number().positive('ID inválido'),
})

export const uuidParamSchema = z.object({
  uuid: z.string().uuid('UUID inválido'),
})

// ==========================================
// TYPE EXPORTS
// ==========================================

export type CitizenFormData = z.infer<typeof citizenSchema>
export type ProfessionalFormData = z.infer<typeof professionalSchema>
export type UserFormData = z.infer<typeof userSchema>
export type UnitFormData = z.infer<typeof unitSchema>
export type UnitUpdateFormData = z.infer<typeof unitUpdateSchema>
export type SupplierFormData = z.infer<typeof supplierSchema>
export type SupplierUpdateFormData = z.infer<typeof supplierUpdateSchema>
export type FolderFormData = z.infer<typeof folderSchema>
export type FolderUpdateFormData = z.infer<typeof folderUpdateSchema>
export type CareGroupFormData = z.infer<typeof careGroupSchema>
export type GroupFormData = z.infer<typeof groupSchema>
export type GroupUpdateFormData = z.infer<typeof groupUpdateSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type ScheduleFormData = z.infer<typeof scheduleSchema>
export type ScheduleCreateFormData = z.infer<typeof scheduleCreateSchema>
export type ScheduleUpdateFormData = z.infer<typeof scheduleUpdateSchema>
export type WhatsAppProgrammedFormData = z.infer<typeof whatsappProgrammedSchema>
export type RegulationCreateFormData = z.infer<typeof regulationCreateSchema>
export type RegulationUpdateFormData = z.infer<typeof regulationUpdateSchema>
export type CareCreateFormData = z.infer<typeof careCreateSchema>
export type CareUpdateFormData = z.infer<typeof careUpdateSchema>
export type PaginationParams = z.infer<typeof paginationSchema>

// ==========================================
// REGISTRATION SCHEMA (auto-cadastro público)
// ==========================================

export const registrationSchema = z.object({
  // Unidade
  cnes: z.string().min(1, 'CNES é obrigatório'),

  // Dados Pessoais
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string().regex(cpfRegex, 'CPF inválido').refine(validateCPF, 'CPF inválido'),
  phoneNumber: z.string().min(10, 'Telefone inválido'),
  birthDate: z.string().optional(),
  sex: z.string().optional(),
  maritalStatus: z.string().optional(),
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  nationality: z.string().optional(),

  // Identificação
  rg: z.string().optional(),
  cns: z.string().optional(),

  // Dados Profissionais
  council: z.string().optional(),
  councilNumber: z.string().optional(),
  councilUf: z.string().optional(),
  specialty: z.string().optional(),

  // Endereço
  address: z.object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
  }).optional(),

  // Senha
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export type RegistrationFormData = z.infer<typeof registrationSchema>
