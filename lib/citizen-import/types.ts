// ==========================================
// TIPOS: IMPORTAÇÃO DE CIDADÃOS VIA CSV
// ==========================================

export type Sex = 'MALE' | 'FEMALE' | 'OTHER'

// Status de uma linha do CSV
export type RowStatus =
  | 'VALID'
  | 'INVALID'
  | 'DUPLICATE'
  | 'SKIPPED_BY_RULE'
  | 'TO_INSERT'
  | 'TO_UPDATE'

// Motivos de skip (Gates de elegibilidade)
export type SkipReason =
  | 'GATE_A_DEATH'           // dt_obito ou st_faleceu = 1
  | 'GATE_B_NOT_DISPLAYABLE' // st_ativo_para_exibicao = 0
  | 'GATE_C_NO_CPF_TERRITORY'// st_territorio_utiliza_cpf = 0
  | 'GATE_D_UNIFIED'         // st_unificado = 1
  | 'GATE_E_MISSING_CPF_CNS' // Sem CPF e sem CNS

// Erros de validação
export type ValidationError =
  | 'ERROR_INVALID_CPF'
  | 'ERROR_MISSING_NAME'
  | 'ERROR_INVALID_BIRTHDATE'
  | 'ERROR_INVALID_EMAIL'
  | 'ERROR_INVALID_PHONE'
  | 'ERROR_INVALID_CEP'

// Regra de deduplicação
export type DeduplicationAction = 'SKIP' | 'UPDATE' | 'CREATE'

// Mapeamento de colunas CSV -> Campos Citizen
export interface ColumnMapping {
  csvColumn: string
  citizenField: string | null
}

// Configuração de importação
export interface ImportConfig {
  hasHeader: boolean
  separator: ',' | ';'
  encoding: 'utf-8' | 'iso-8859-1'
  deduplicationKey: 'cpf' | 'cns' | 'cpf_cns'
  deduplicationAction: DeduplicationAction
  columnMappings: ColumnMapping[]
}

// Linha processada do CSV
export interface ProcessedRow {
  rowIndex: number
  rawData: Record<string, string>
  mappedData: Partial<CitizenImportData>
  status: RowStatus
  errors: ValidationError[]
  skipReason?: SkipReason
  existingCitizenId?: number
}

// Dados para importar cidadão
export interface CitizenImportData {
  cpf: string
  cns?: string
  name: string
  nameNormalized?: string
  socialName?: string
  birthDate: Date
  sex?: Sex
  race?: string
  bloodType?: string
  nationality?: string
  placeOfBirth?: string
  motherName?: string
  fatherName?: string
  email?: string
  phone?: string
  postalCode?: string
  state?: string
  city?: string
  address?: string
  number?: string
  complement?: string
  neighborhood?: string
}

// Resumo da validação
export interface ValidationSummary {
  totalRows: number
  validRows: number
  invalidRows: number
  duplicateRows: number
  skippedRows: number
  toInsert: number
  toUpdate: number
  errorsByType: Record<ValidationError, number>
  skipsByReason: Record<SkipReason, number>
}

// Resultado da importação
export interface ImportResult {
  success: boolean
  totalProcessed: number
  inserted: number
  updated: number
  skipped: number
  errors: number
  errorDetails: Array<{
    rowIndex: number
    error: string
  }>
}

// Campos disponíveis para mapeamento
export const CITIZEN_FIELDS = [
  { key: 'cpf', label: 'CPF', required: true },
  { key: 'cns', label: 'CNS (Cartão SUS)', required: false },
  { key: 'name', label: 'Nome Completo', required: true },
  { key: 'socialName', label: 'Nome Social', required: false },
  { key: 'birthDate', label: 'Data de Nascimento', required: true },
  { key: 'sex', label: 'Sexo', required: false },
  { key: 'race', label: 'Raça/Cor', required: false },
  { key: 'bloodType', label: 'Tipo Sanguíneo', required: false },
  { key: 'nationality', label: 'Nacionalidade', required: false },
  { key: 'placeOfBirth', label: 'Naturalidade', required: false },
  { key: 'motherName', label: 'Nome da Mãe', required: false },
  { key: 'fatherName', label: 'Nome do Pai', required: false },
  { key: 'email', label: 'E-mail', required: false },
  { key: 'phone', label: 'Telefone', required: false },
  { key: 'postalCode', label: 'CEP', required: false },
  { key: 'state', label: 'Estado', required: false },
  { key: 'city', label: 'Cidade', required: false },
  { key: 'address', label: 'Endereço', required: false },
  { key: 'number', label: 'Número', required: false },
  { key: 'complement', label: 'Complemento', required: false },
  { key: 'neighborhood', label: 'Bairro', required: false },
] as const

// Mapeamento automático de colunas conhecidas
export const AUTO_MAPPING: Record<string, string> = {
  'nu_cpf': 'cpf',
  'cpf': 'cpf',
  'cpf_cidadao': 'cpf',
  'nu_cns': 'cns',
  'cns': 'cns',
  'cartao_sus': 'cns',
  'no_cidadao': 'name',
  'nome': 'name',
  'nome_completo': 'name',
  'nome_cidadao': 'name',
  'no_social': 'socialName',
  'nome_social': 'socialName',
  'dt_nascimento': 'birthDate',
  'data_nascimento': 'birthDate',
  'nascimento': 'birthDate',
  'no_sexo': 'sex',
  'sexo': 'sex',
  'co_raca_cor': 'race',
  'raca_cor': 'race',
  'raca': 'race',
  'no_tipo_sanguineo': 'bloodType',
  'tipo_sanguineo': 'bloodType',
  'co_nacionalidade': 'nationality',
  'nacionalidade': 'nationality',
  'co_pais_nascimento': 'placeOfBirth',
  'naturalidade': 'placeOfBirth',
  'no_mae': 'motherName',
  'nome_mae': 'motherName',
  'no_pai': 'fatherName',
  'nome_pai': 'fatherName',
  'ds_email': 'email',
  'email': 'email',
  'nu_telefone_celular': 'phone',
  'nu_telefone_contato': 'phone',
  'telefone': 'phone',
  'celular': 'phone',
  'ds_cep': 'postalCode',
  'cep': 'postalCode',
  'co_uf': 'state',
  'uf': 'state',
  'estado': 'state',
  'no_localidade': 'city',
  'cidade': 'city',
  'municipio': 'city',
  'ds_logradouro': 'address',
  'logradouro': 'address',
  'endereco': 'address',
  'nu_numero': 'number',
  'numero': 'number',
  'ds_complemento': 'complement',
  'complemento': 'complement',
  'no_bairro': 'neighborhood',
  'bairro': 'neighborhood',
}

// Colunas usadas para eligibility gates
export const ELIGIBILITY_COLUMNS = [
  'dt_obito',
  'st_faleceu',
  'st_ativo_para_exibicao',
  'st_territorio_utiliza_cpf',
  'st_unificado',
]
