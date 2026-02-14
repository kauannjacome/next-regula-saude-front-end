import * as z from 'zod'
import { validateCPF } from '@/lib/validators'

type Sex = 'MALE' | 'FEMALE' | 'NOT_INFORMED'

// Helper para limpar CPF
function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

// Helper para validar data no formato DD/MM/YYYY ou YYYY-MM-DD
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null

  // Tentar formato DD/MM/YYYY
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    const [, day, month, year] = brMatch
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) return date
  }

  // Tentar formato YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) return date
  }

  return null
}

// Schema para linha de cidadao na importacao
export const citizenImportRowSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no minimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  cpf: z
    .string()
    .transform(cleanCPF)
    .refine((val) => val.length === 11, 'CPF deve ter 11 digitos')
    .refine(validateCPF, 'CPF invalido'),
  data_nascimento: z
    .string()
    .refine((val) => parseDate(val) !== null, 'Data de nascimento invalida (use DD/MM/YYYY ou YYYY-MM-DD)'),
  sexo: z
    .string()
    .transform((val) => val.toUpperCase())
    .refine((val) => ['M', 'F', 'MASCULINO', 'FEMININO', 'MALE', 'FEMALE'].includes(val), 'Sexo invalido'),
  telefone: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\D/g, '') || ''),
  email: z
    .string()
    .email('Email invalido')
    .optional()
    .or(z.literal('')),
  cep: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\D/g, '') || ''),
  logradouro: z.string().optional().default(''),
  numero: z.string().optional().default(''),
  complemento: z.string().optional().default(''),
  bairro: z.string().optional().default(''),
  cidade: z.string().optional().default(''),
  estado: z
    .string()
    .optional()
    .transform((val) => val?.toUpperCase().slice(0, 2) || ''),
  nome_mae: z.string().optional().default(''),
})

// Schema para linha de profissional na importacao
export const professionalImportRowSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no minimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  cpf: z
    .string()
    .transform(cleanCPF)
    .refine((val) => val.length === 11, 'CPF deve ter 11 digitos')
    .refine(validateCPF, 'CPF invalido'),
  email: z.string().email('Email invalido'),
  telefone: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\D/g, '') || ''),
  cargo: z.string().optional().default(''),
  conselho: z
    .string()
    .optional()
    .transform((val) => val?.toUpperCase() || ''),
  numero_conselho: z.string().optional().default(''),
  uf_conselho: z
    .string()
    .optional()
    .transform((val) => val?.toUpperCase().slice(0, 2) || ''),
})

// Schema para linha de unidade na importacao
export const unitImportRowSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no minimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  tipo: z
    .string()
    .optional()
    .transform((val) => {
      const normalized = val?.toLowerCase() || ''
      if (normalized.includes('hospital')) return 'Hospital'
      if (normalized.includes('ubs') || normalized.includes('basica')) return 'UBS'
      if (normalized.includes('clinica')) return 'Clinica'
      if (normalized.includes('lab')) return 'Laboratorio'
      return 'Outro'
    }),
  cnes: z.string().optional().default(''),
  telefone: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\D/g, '') || ''),
  email: z
    .string()
    .email('Email invalido')
    .optional()
    .or(z.literal('')),
  cep: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\D/g, '') || ''),
  logradouro: z.string().optional().default(''),
  numero: z.string().optional().default(''),
  complemento: z.string().optional().default(''),
  bairro: z.string().optional().default(''),
  cidade: z.string().optional().default(''),
  estado: z
    .string()
    .optional()
    .transform((val) => val?.toUpperCase().slice(0, 2) || ''),
})

// Tipo para resultado de validacao de uma linha
export interface RowValidationResult {
  rowIndex: number
  isValid: boolean
  data?: Record<string, unknown>
  errors?: Array<{ field: string; message: string }>
}

// Tipo para resultado de validacao do arquivo
export interface FileValidationResult {
  isValid: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  results: RowValidationResult[]
}

// Funcao para validar array de linhas
export function validateImportRows(
  rows: Record<string, unknown>[],
  type: 'CITIZENS' | 'PROFESSIONALS' | 'UNITS'
): FileValidationResult {
  const schema =
    type === 'CITIZENS'
      ? citizenImportRowSchema
      : type === 'PROFESSIONALS'
      ? professionalImportRowSchema
      : unitImportRowSchema

  const results: RowValidationResult[] = []
  let validRows = 0
  let invalidRows = 0

  rows.forEach((row, index) => {
    const result = schema.safeParse(row)

    if (result.success) {
      validRows++
      results.push({
        rowIndex: index + 1,
        isValid: true,
        data: result.data as Record<string, unknown>,
      })
    } else {
      invalidRows++
      const errors = result.error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      results.push({
        rowIndex: index + 1,
        isValid: false,
        errors,
      })
    }
  })

  return {
    isValid: invalidRows === 0,
    totalRows: rows.length,
    validRows,
    invalidRows,
    results,
  }
}

// Schema para atualizar perfil no onboarding
export const onboardingProfileSchema = z.object({
  phoneNumber: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\D/g, '') || ''),
  position: z.string().optional(),
  avatarUploadId: z.number().optional(),
})

// Funcao auxiliar para converter sexo para o formato do banco
export function normalizeSex(value: string): Sex {
  const normalized = value.toUpperCase()
  if (['M', 'MASCULINO', 'MALE'].includes(normalized)) return 'MALE'
  if (['F', 'FEMININO', 'FEMALE'].includes(normalized)) return 'FEMALE'
  return 'NOT_INFORMED'
}

// Funcao auxiliar para converter data string para Date
export function parseBirthDate(dateStr: string): Date {
  const parsed = parseDate(dateStr)
  if (!parsed) throw new Error('Data invalida')
  return parsed
}

// Funcao para normalizar nome (remover acentos e deixar uppercase para busca)
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}
