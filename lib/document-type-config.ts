import {
  CreditCard,
  Fingerprint,
  Car,
  Home,
  IdCard,
  Baby,
  FileText,
  Heart,
  Briefcase,
  Vote,
  Shield,
  Smartphone,
  Monitor,
  Award,
  ScrollText,
  GraduationCap,
  BadgeCheck,
  LucideIcon,
} from 'lucide-react'

export type CitizenDocumentType =
  | 'RG'
  | 'CPF'
  | 'CNH'
  | 'PROOF_OF_RESIDENCE'
  | 'SUS_CARD'
  | 'SUS_MIRROR'
  | 'BIRTH_CERTIFICATE'
  | 'MARRIAGE_CERTIFICATE'
  | 'VOTER_ID'
  | 'WORK_CARD'
  | 'PIS_PASEP'
  | 'RESERVIST_CERTIFICATE'
  | 'GOV_BR'
  | 'DIGITAL_CNH'
  | 'DIGITAL_RG'
  | 'OTHER'
  | 'PROFESSIONAL_REGISTRY'
  | 'CONTRACT'
  | 'DIPLOMA'
  | 'CERTIFICATION'

export interface DocumentTypeConfig {
  value: CitizenDocumentType
  label: string
  icon: LucideIcon
  defaultExpiryDays: number | null
}

export const DOCUMENT_TYPE_CONFIG: Record<CitizenDocumentType, DocumentTypeConfig> = {
  RG: {
    value: 'RG',
    label: 'RG',
    icon: CreditCard,
    defaultExpiryDays: null,
  },
  CPF: {
    value: 'CPF',
    label: 'CPF',
    icon: Fingerprint,
    defaultExpiryDays: null,
  },
  CNH: {
    value: 'CNH',
    label: 'CNH',
    icon: Car,
    defaultExpiryDays: null,
  },
  PROOF_OF_RESIDENCE: {
    value: 'PROOF_OF_RESIDENCE',
    label: 'Comprovante de Residência',
    icon: Home,
    defaultExpiryDays: 90,
  },
  SUS_CARD: {
    value: 'SUS_CARD',
    label: 'Cartão SUS',
    icon: IdCard,
    defaultExpiryDays: null,
  },
  SUS_MIRROR: {
    value: 'SUS_MIRROR',
    label: 'Espelho SUS',
    icon: Heart,
    defaultExpiryDays: null,
  },
  BIRTH_CERTIFICATE: {
    value: 'BIRTH_CERTIFICATE',
    label: 'Certidão de Nascimento',
    icon: Baby,
    defaultExpiryDays: null,
  },
  MARRIAGE_CERTIFICATE: {
    value: 'MARRIAGE_CERTIFICATE',
    label: 'Certidão de Casamento',
    icon: FileText,
    defaultExpiryDays: null,
  },
  VOTER_ID: {
    value: 'VOTER_ID',
    label: 'Título de Eleitor',
    icon: Vote,
    defaultExpiryDays: null,
  },
  WORK_CARD: {
    value: 'WORK_CARD',
    label: 'Carteira de Trabalho',
    icon: Briefcase,
    defaultExpiryDays: null,
  },
  PIS_PASEP: {
    value: 'PIS_PASEP',
    label: 'PIS/PASEP',
    icon: FileText,
    defaultExpiryDays: null,
  },
  RESERVIST_CERTIFICATE: {
    value: 'RESERVIST_CERTIFICATE',
    label: 'Certificado de Reservista',
    icon: Shield,
    defaultExpiryDays: null,
  },
  GOV_BR: {
    value: 'GOV_BR',
    label: 'Gov.br',
    icon: Monitor,
    defaultExpiryDays: null,
  },
  DIGITAL_CNH: {
    value: 'DIGITAL_CNH',
    label: 'CNH Digital',
    icon: Smartphone,
    defaultExpiryDays: null,
  },
  DIGITAL_RG: {
    value: 'DIGITAL_RG',
    label: 'RG Digital',
    icon: Smartphone,
    defaultExpiryDays: null,
  },
  OTHER: {
    value: 'OTHER',
    label: 'Outro',
    icon: FileText,
    defaultExpiryDays: null,
  },
  PROFESSIONAL_REGISTRY: {
    value: 'PROFESSIONAL_REGISTRY',
    label: 'Registro Profissional',
    icon: Award,
    defaultExpiryDays: null,
  },
  CONTRACT: {
    value: 'CONTRACT',
    label: 'Contrato',
    icon: ScrollText,
    defaultExpiryDays: 365,
  },
  DIPLOMA: {
    value: 'DIPLOMA',
    label: 'Diploma',
    icon: GraduationCap,
    defaultExpiryDays: null,
  },
  CERTIFICATION: {
    value: 'CERTIFICATION',
    label: 'Certificação',
    icon: BadgeCheck,
    defaultExpiryDays: 730,
  },
}

export const DOCUMENT_TYPES_LIST = Object.values(DOCUMENT_TYPE_CONFIG)

export function isDocumentExpired(createdAt: Date | string, expiryDays: number | null): boolean {
  if (!expiryDays) return false
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const expiryDate = new Date(created)
  expiryDate.setDate(expiryDate.getDate() + expiryDays)
  return new Date() > expiryDate
}

export function getExpiryDate(createdAt: Date | string, expiryDays: number | null): Date | null {
  if (!expiryDays) return null
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const expiryDate = new Date(created)
  expiryDate.setDate(expiryDate.getDate() + expiryDays)
  return expiryDate
}
