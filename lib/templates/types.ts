// ==========================================
// TIPOS PARA O SISTEMA DE TEMPLATES
// ==========================================
// Este arquivo define os tipos usados em todos os templates
// Os templates são documentos que podem ser impressos ou exportados como PDF

// ==========================================
// ENUMS - TIPOS DE TEMPLATES DISPONÍVEIS
// ==========================================

/**
 * TemplateType - Tipos de templates disponíveis no sistema
 * Cada tipo representa um documento diferente que pode ser gerado
 */
export enum TemplateType {
  // === DOCUMENTOS DE REGULAÇÃO ===
  REGULATION = 'REGULATION',                     // Documento principal de regulação
  REGULATION_WITHDRAWAL = 'REGULATION_WITHDRAWAL', // Declaração de desistência

  // === DECLARAÇÕES GERAIS ===
  REQUEST = 'REQUEST',                           // Requerimento genérico
  RESIDENCE_DECLARATION = 'RESIDENCE_DECLARATION', // Declaração de residência
  WITHDRAWAL_DECLARATION = 'WITHDRAWAL_DECLARATION', // Declaração de desistência
  COST_ASSISTANCE = 'COST_ASSISTANCE',           // Ajuda de custo

  // === CARTÃO SUS ===
  SUS_CARD_CREATE = 'SUS_CARD_CREATE',           // Criação de cartão SUS
  SUS_CARD_UPDATE = 'SUS_CARD_UPDATE',           // Atualização de cartão SUS

  // === MEDICAMENTOS ===
  HIGH_COST_MEDICATION = 'HIGH_COST_MEDICATION', // Medicamento de alto custo
  RECEIPT_DECLARATION = 'RECEIPT_DECLARATION',   // Declaração de recebimento

  // === DOCUMENTOS HOSPITALARES ===
  AIH = 'AIH',                                   // Autorização de Internação Hospitalar

  // === TERMOS ===
  TCLE = 'TCLE',                                 // Termo de Consentimento Livre e Esclarecido
  TREATMENT_REFUSAL = 'TREATMENT_REFUSAL',       // Termo de Recusa de Tratamento
  PATIENT_RESPONSIBILITY = 'PATIENT_RESPONSIBILITY', // Termo de Responsabilidade do Paciente
  TREATMENT_ADHERENCE = 'TREATMENT_ADHERENCE',   // Termo de Adesão ao Tratamento

  // === LISTAS E CONTROLES ===
  SCHEDULING_CARD = 'SCHEDULING_CARD',           // Cartão de agendamento
  CARE_CONTROL = 'CARE_CONTROL',                 // Controle de cuidado
  SCHEDULING_LIST = 'SCHEDULING_LIST',           // Lista de agendamento
  SUPPLIER_LIST = 'SUPPLIER_LIST',               // Lista por fornecedor
  MEDICATION_FAST_LIST = 'MEDICATION_FAST_LIST', // Lista rápida de medicamentos com QR
}

// ==========================================
// INTERFACES - ESTRUTURA DOS DADOS
// ==========================================

/**
 * TemplateConfig - Configuração de um template
 * Define as propriedades de cada template disponível
 */
export interface TemplateConfig {
  type: TemplateType           // Tipo único do template
  name: string                 // Nome amigável para exibição
  description: string          // Descrição do que o template faz
  category: TemplateCategory   // Categoria para agrupamento
  pages: 1 | 2 | 'dynamic'     // Número de páginas (1, 2, ou dinâmico)
  requiresRegulation: boolean  // Se precisa de uma regulação associada
  requiresCitizen: boolean     // Se precisa de um cidadão associado
}

/**
 * TemplateCategory - Categorias para organizar os templates
 */
export type TemplateCategory =
  | 'regulation'    // Documentos de regulação
  | 'declaration'   // Declarações
  | 'term'          // Termos
  | 'sus'           // Cartão SUS
  | 'medication'    // Medicamentos
  | 'hospital'      // Hospitalar
  | 'list'          // Listas e controles

/**
 * PrintHistory - Histórico de impressão de um documento
 */
export interface PrintHistory {
  id: number
  printedAt: Date | null       // null = nunca impresso
  printedBy: {
    id: string
    name: string
  } | null
  printCount: number           // Quantas vezes foi impresso
  documentDate: Date           // Data do documento
}

/**
 * SubscriberHeader - Dados do cabeçalho municipal
 * Usado em todos os documentos oficiais
 */
export interface SubscriberHeader {
  subscriberName: string | null // Nome do sistema/administração (ex: "Simples City")
  stateName: string            // Nome do estado (ex: "Estado de São Paulo")
  municipalityName: string     // Nome do município (ex: "Prefeitura Municipal de São Paulo")
  secretariatName: string | null // Nome da secretaria (ex: "Secretaria Municipal de Saúde")
  logoStateUrl: string | null  // URL da logo do estado
  logoMunicipalUrl: string | null // URL da logo do município
  logoAdministrationUrl: string | null // URL da logo da administração
}

/**
 * CitizenData - Dados do cidadão para os templates
 */
export interface CitizenData {
  id: number
  name: string
  cpf: string                  // CPF completo (será mascarado na exibição)
  cns: string | null           // Cartão Nacional de Saúde
  birthDate: Date
  phone: string | null
  email: string | null         // E-mail do cidadão
  address: string | null
  number: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  motherName: string | null
}

/**
 * CareItem - Item de cuidado/procedimento
 */
export interface CareItem {
  id: number
  name: string
  unitMeasure: string | null
  quantity: number
  value: number | null
}

/**
 * RegulationData - Dados da regulação para os templates
 */
export interface RegulationData {
  id: number
  protocolNumber: string | null
  status: string
  priority: string
  requestDate: Date | null
  notes: string | null
  clinicalIndication: string | null
  cid: string | null
  requestingProfessional: string | null
  cares: CareItem[]
  citizen: CitizenData
  createdAt: Date
  creator: {
    id: string
    name: string
  } | null
}

/**
 * TemplateRenderOptions - Opções para renderizar um template
 */
export interface TemplateRenderOptions {
  subscriberHeader: SubscriberHeader
  regulation?: RegulationData
  citizen?: CitizenData
  documentDate: Date
  showQrCode: boolean
  qrCodeUrl?: string
}

// ==========================================
// CONFIGURAÇÃO DOS TEMPLATES DISPONÍVEIS
// ==========================================

/**
 * TEMPLATE_CONFIGS - Mapa de configuração de todos os templates
 * Cada template tem sua configuração específica
 */
export const TEMPLATE_CONFIGS: Record<TemplateType, TemplateConfig> = {
  // === REGULAÇÃO ===
  [TemplateType.REGULATION]: {
    type: TemplateType.REGULATION,
    name: 'Documento de Regulação',
    description: 'Documento principal com dados da solicitação de procedimentos',
    category: 'regulation',
    pages: 'dynamic', // 1 página se > 15 cuidados, 2 vias se <= 15
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.REGULATION_WITHDRAWAL]: {
    type: TemplateType.REGULATION_WITHDRAWAL,
    name: 'Declaração de Desistência de Regulação',
    description: 'Documento gerado quando regulação é devolvida/cancelada',
    category: 'regulation',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },

  // === DECLARAÇÕES ===
  [TemplateType.REQUEST]: {
    type: TemplateType.REQUEST,
    name: 'Requerimento',
    description: 'Requerimento genérico para solicitações',
    category: 'declaration',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.RESIDENCE_DECLARATION]: {
    type: TemplateType.RESIDENCE_DECLARATION,
    name: 'Declaração de Residência',
    description: 'Declaração de endereço baseada no cartão SUS',
    category: 'declaration',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.WITHDRAWAL_DECLARATION]: {
    type: TemplateType.WITHDRAWAL_DECLARATION,
    name: 'Declaração de Desistência',
    description: 'Declaração de desistência genérica',
    category: 'declaration',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.COST_ASSISTANCE]: {
    type: TemplateType.COST_ASSISTANCE,
    name: 'Ajuda de Custo',
    description: 'Solicitação de ajuda de custo para deslocamento',
    category: 'declaration',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },

  // === CARTÃO SUS ===
  [TemplateType.SUS_CARD_CREATE]: {
    type: TemplateType.SUS_CARD_CREATE,
    name: 'Criação de Cartão SUS',
    description: 'Solicitação de criação de novo cartão SUS',
    category: 'sus',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.SUS_CARD_UPDATE]: {
    type: TemplateType.SUS_CARD_UPDATE,
    name: 'Atualização de Cartão SUS',
    description: 'Solicitação de atualização de dados do cartão SUS',
    category: 'sus',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },

  // === MEDICAMENTOS ===
  [TemplateType.HIGH_COST_MEDICATION]: {
    type: TemplateType.HIGH_COST_MEDICATION,
    name: 'Medicamento de Alto Custo',
    description: 'Declaração de solicitação de medicamento de alto custo',
    category: 'medication',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.RECEIPT_DECLARATION]: {
    type: TemplateType.RECEIPT_DECLARATION,
    name: 'Declaração de Recebimento',
    description: 'Declaração de recebimento de medicamento ou material',
    category: 'medication',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },

  // === HOSPITALAR ===
  [TemplateType.AIH]: {
    type: TemplateType.AIH,
    name: 'AIH - Autorização de Internação Hospitalar',
    description: 'Autorização para internação hospitalar pelo SUS',
    category: 'hospital',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },

  // === TERMOS ===
  [TemplateType.TCLE]: {
    type: TemplateType.TCLE,
    name: 'TCLE - Termo de Consentimento',
    description: 'Termo de Consentimento Livre e Esclarecido',
    category: 'term',
    pages: 2,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.TREATMENT_REFUSAL]: {
    type: TemplateType.TREATMENT_REFUSAL,
    name: 'Termo de Recusa de Tratamento',
    description: 'Quando paciente recusa procedimento ou tratamento',
    category: 'term',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.PATIENT_RESPONSIBILITY]: {
    type: TemplateType.PATIENT_RESPONSIBILITY,
    name: 'Termo de Responsabilidade',
    description: 'Termo de responsabilidade do paciente',
    category: 'term',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.TREATMENT_ADHERENCE]: {
    type: TemplateType.TREATMENT_ADHERENCE,
    name: 'Termo de Adesão ao Tratamento',
    description: 'Termo de adesão a tratamento contínuo',
    category: 'term',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },

  // === LISTAS ===
  [TemplateType.SCHEDULING_CARD]: {
    type: TemplateType.SCHEDULING_CARD,
    name: 'Cartão de Agendamento',
    description: 'Cartão com dados do agendamento para o paciente',
    category: 'list',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.CARE_CONTROL]: {
    type: TemplateType.CARE_CONTROL,
    name: 'Controle de Cuidado',
    description: 'Lista de controle de cuidados por lote',
    category: 'list',
    pages: 'dynamic',
    requiresRegulation: false,
    requiresCitizen: false,
  },
  [TemplateType.SCHEDULING_LIST]: {
    type: TemplateType.SCHEDULING_LIST,
    name: 'Lista de Agendamento',
    description: 'Lista de agendamentos por lote',
    category: 'list',
    pages: 'dynamic',
    requiresRegulation: false,
    requiresCitizen: false,
  },
  [TemplateType.SUPPLIER_LIST]: {
    type: TemplateType.SUPPLIER_LIST,
    name: 'Lista por Fornecedor',
    description: 'Lista de procedimentos agrupados por fornecedor',
    category: 'list',
    pages: 'dynamic',
    requiresRegulation: false,
    requiresCitizen: false,
  },
  [TemplateType.MEDICATION_FAST_LIST]: {
    type: TemplateType.MEDICATION_FAST_LIST,
    name: 'Lista Rápida de Medicamentos',
    description: 'Lista com QR codes para controle rápido de medicamentos',
    category: 'list',
    pages: 'dynamic',
    requiresRegulation: false,
    requiresCitizen: false,
  },
}

/**
 * getTemplatesByCategory - Retorna templates filtrados por categoria
 * @param category - Categoria desejada
 * @returns Array de configurações de templates
 */
export function getTemplatesByCategory(category: TemplateCategory): TemplateConfig[] {
  return Object.values(TEMPLATE_CONFIGS).filter(t => t.category === category)
}

/**
 * getTemplateConfig - Retorna a configuração de um template específico
 * @param type - Tipo do template
 * @returns Configuração do template ou undefined
 */
export function getTemplateConfig(type: TemplateType): TemplateConfig | undefined {
  return TEMPLATE_CONFIGS[type]
}
