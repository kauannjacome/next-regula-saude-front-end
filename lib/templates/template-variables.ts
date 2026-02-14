/**
 * Sistema Completo de Variáveis para Templates
 * Inclui TODOS os campos do banco de dados com formatação e máscaras
 */

import extenso from 'extenso'

import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ==========================================
// FORMATADORES E MÁSCARAS
// ==========================================

/**
 * Formata CPF com máscara: 000.000.000-00
 */
export function formatCPF(cpf: string | null | undefined, hidePartial = false): string {
  if (!cpf) return ''
  const cleaned = cpf.replace(/\D/g, '')

  if (hidePartial) {
    // CPF parcialmente oculto: 000.000.***-**
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
  }

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formata CNS (Cartão Nacional de Saúde) com máscara: 000 0000 0000 0000
 */
export function formatCNS(cns: string | null | undefined, hidePartial = false): string {
  if (!cns) return ''
  const cleaned = cns.replace(/\D/g, '')

  if (hidePartial) {
    // CNS parcialmente oculto: 000 0000 **** ****
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 **** ****')
  }

  return cleaned.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4')
}

/**
 * Formata CNPJ com máscara: 00.000.000/0000-00
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return ''
  const cleaned = cnpj.replace(/\D/g, '')
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formata telefone: (00) 00000-0000 ou (00) 0000-0000
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

/**
 * Formata CEP: 00000-000
 */
export function formatCEP(cep: string | null | undefined): string {
  if (!cep) return ''
  const cleaned = cep.replace(/\D/g, '')
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Formata valor monetário: R$ 1.234,56
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Converte número para extenso em português
 */
export function numberToText(value: number | null | undefined, currency = false): string {
  if (value === null || value === undefined) return ''

  try {
    if (currency) {
      return extenso(value.toString(), { mode: 'currency' })
    }
    return extenso(value.toString(), { mode: 'number' })
  } catch {
    return value.toString()
  }
}

/**
 * Formata data: 01/01/2024
 */
export function formatDate(date: Date | string | null | undefined, pattern = 'dd/MM/yyyy'): string {
  if (!date) return ''

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, pattern, { locale: ptBR })
  } catch {
    return ''
  }
}

/**
 * Calcula idade em anos
 */
export function calculateAge(birthDate: Date | string | null | undefined): number {
  if (!birthDate) return 0

  try {
    const dateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
    return differenceInYears(new Date(), dateObj)
  } catch {
    return 0
  }
}

/**
 * Formata idade completa: "nascido em 01/01/1990 com 34 anos de idade"
 */
export function formatFullAge(birthDate: Date | string | null | undefined): string {
  if (!birthDate) return ''

  try {
    const dateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
    const age = calculateAge(dateObj)
    const formattedDate = formatDate(dateObj)

    return `nascido em ${formattedDate} com ${age} ${age === 1 ? 'ano' : 'anos'} de idade`
  } catch {
    return ''
  }
}

/**
 * Formata idade por extenso
 */
export function formatAgeInText(birthDate: Date | string | null | undefined): string {
  if (!birthDate) return ''

  try {
    const age = calculateAge(birthDate)
    return numberToText(age, false) + (age === 1 ? ' ano' : ' anos')
  } catch {
    return ''
  }
}

/**
 * Formata endereço completo
 */
export function formatAddress(
  address?: string | null,
  number?: string | null,
  complement?: string | null,
  neighborhood?: string | null,
  city?: string | null,
  state?: string | null,
  postalCode?: string | null
): string {
  const parts: string[] = []

  if (address) parts.push(address)
  if (number) parts.push(`nº ${number}`)
  if (complement) parts.push(complement)
  if (neighborhood) parts.push(neighborhood)
  if (city && state) parts.push(`${city}/${state}`)
  else if (city) parts.push(city)
  if (postalCode) parts.push(`CEP: ${formatCEP(postalCode)}`)

  return parts.join(', ')
}

/**
 * Retorna pronome baseado no gênero
 */
export function getGenderPronoun(
  gender: string | null | undefined,
  type: 'subject' | 'object' | 'possessive' | 'article'
): string {
  const genderLower = (gender || '').toLowerCase()

  const pronouns: Record<string, Record<string, string>> = {
    masculino: {
      subject: 'ele',      // Ele está bem
      object: 'dele',      // O documento dele
      possessive: 'seu',   // Seu nome
      article: 'o'         // O cidadão
    },
    feminino: {
      subject: 'ela',      // Ela está bem
      object: 'dela',      // O documento dela
      possessive: 'sua',   // Sua nome
      article: 'a'         // A cidadão
    }
  }

  if (genderLower.includes('masculino') || genderLower.includes('homem')) {
    return pronouns.masculino[type] || ''
  }

  if (genderLower.includes('feminino') || genderLower.includes('mulher')) {
    return pronouns.feminino[type] || ''
  }

  // Neutro/indefinido
  return type === 'subject' ? 'ele/ela' :
         type === 'object' ? 'dele/dela' :
         type === 'possessive' ? 'seu/sua' : 'o/a'
}

/**
 * Retorna tratamento formal baseado no gênero
 */
export function getGenderTreatment(
  gender: string | null | undefined,
  type: 'full' | 'abbr'
): string {
  const genderLower = (gender || '').toLowerCase()

  const treatments: Record<string, Record<string, string>> = {
    masculino: {
      full: 'Senhor',
      abbr: 'Sr.'
    },
    feminino: {
      full: 'Senhora',
      abbr: 'Sra.'
    }
  }

  if (genderLower.includes('masculino') || genderLower.includes('homem')) {
    return treatments.masculino[type] || ''
  }

  if (genderLower.includes('feminino') || genderLower.includes('mulher')) {
    return treatments.feminino[type] || ''
  }

  return type === 'full' ? 'Sr./Sra.' : 'Sr./Sra.'
}

// ==========================================
// DEFINIÇÕES DE VARIÁVEIS
// ==========================================

export interface VariableField {
  label: string
  variable: string
  description?: string
  formatter?: (value: string | number | Date | null | undefined, data?: Record<string, unknown>) => string
}

export interface VariableCategory {
  title: string
  icon: string
  fields: VariableField[]
}

/**
 * TODAS as variáveis disponíveis no sistema
 */
export const allVariables: Record<string, VariableCategory> = {
  // ==========================================
  // CIDADÃO (Citizen)
  // ==========================================
  citizen: {
    title: 'Dados do Cidadão',
    icon: 'User',
    fields: [
      // Identificação Básica
      { label: 'Nome Completo', variable: 'PAC_NOME', description: 'Nome completo do cidadão' },
      { label: 'Nome Social', variable: 'PAC_NOME_SOCIAL', description: 'Nome social do cidadão' },
      { label: 'CPF', variable: 'PAC_CPF', formatter: (v) => formatCPF(v as string | null | undefined) },
      { label: 'CPF Oculto', variable: 'PAC_CPF_OCULTO', formatter: (v) => formatCPF(v as string | null | undefined, true) },
      { label: 'CNS/SUS', variable: 'PAC_CNS', formatter: (v) => formatCNS(v as string | null | undefined) },
      { label: 'CNS Oculto', variable: 'PAC_CNS_OCULTO', formatter: (v) => formatCNS(v as string | null | undefined, true) },

      // Dados Pessoais
      { label: 'Data de Nascimento', variable: 'PAC_DATA_NASC', formatter: (v) => formatDate(v as Date | string | null | undefined) },
      { label: 'Idade', variable: 'PAC_IDADE', formatter: (v) => calculateAge(v as Date | string | null | undefined).toString() },
      { label: 'Idade por Extenso', variable: 'PAC_IDADE_EXTENSO', formatter: (v) => formatAgeInText(v as Date | string | null | undefined) },
      { label: 'Idade Completa', variable: 'PAC_IDADE_COMPLETA', formatter: (v) => formatFullAge(v as Date | string | null | undefined) },
      { label: 'Sexo', variable: 'PAC_SEXO' },
      { label: 'Gênero', variable: 'PAC_GENERO' },
      { label: 'Raça/Cor', variable: 'PAC_RACA' },
      { label: 'Estado Civil', variable: 'PAC_ESTADO_CIVIL' },
      { label: 'Tipo Sanguíneo', variable: 'PAC_TIPO_SANGUE' },

      // Filiação
      { label: 'Nome da Mãe', variable: 'PAC_NOME_MAE' },
      { label: 'Nome do Pai', variable: 'PAC_NOME_PAI' },

      // Contato
      { label: 'Telefone', variable: 'PAC_TELEFONE', formatter: (v) => formatPhone(v as string | null | undefined) },
      { label: 'Email', variable: 'PAC_EMAIL' },

      // Endereço
      { label: 'CEP', variable: 'PAC_CEP', formatter: (v) => formatCEP(v as string | null | undefined) },
      { label: 'Endereço', variable: 'PAC_ENDERECO' },
      { label: 'Número', variable: 'PAC_NUMERO' },
      { label: 'Complemento', variable: 'PAC_COMPLEMENTO' },
      { label: 'Bairro', variable: 'PAC_BAIRRO' },
      { label: 'Cidade', variable: 'PAC_CIDADE' },
      { label: 'Estado', variable: 'PAC_ESTADO' },
      { label: 'Endereço Completo', variable: 'PAC_ENDERECO_COMPLETO',
        formatter: (v, data) => formatAddress(
          data?.address as string | null | undefined, data?.number as string | null | undefined, data?.complement as string | null | undefined,
          data?.neighborhood as string | null | undefined, data?.city as string | null | undefined, data?.state as string | null | undefined, data?.postalCode as string | null | undefined
        )
      },

      // Origem
      { label: 'Nacionalidade', variable: 'PAC_NACIONALIDADE' },
      { label: 'Naturalidade', variable: 'PAC_NATURALIDADE' },
    ],
  },

  // ==========================================
  // PROFISSIONAL / USUÁRIO (User)
  // ==========================================
  professional: {
    title: 'Dados do Profissional',
    icon: 'UserCog',
    fields: [
      // Identificação
      { label: 'Nome Completo', variable: 'PROF_NOME' },
      { label: 'Nome Social', variable: 'PROF_NOME_SOCIAL' },
      { label: 'CPF', variable: 'PROF_CPF', formatter: (v) => formatCPF(v as string | null | undefined) },
      { label: 'CPF Oculto', variable: 'PROF_CPF_OCULTO', formatter: (v) => formatCPF(v as string | null | undefined, true) },
      { label: 'CNS', variable: 'PROF_CNS', formatter: (v) => formatCNS(v as string | null | undefined) },

      // Profissional
      { label: 'Cargo/Função', variable: 'PROF_CARGO' },
      { label: 'Especialidade', variable: 'PROF_ESPECIALIDADE' },
      { label: 'Registro Profissional', variable: 'PROF_REGISTRO' },
      { label: 'Tipo de Registro', variable: 'PROF_TIPO_REGISTRO', description: 'CRM, COREN, CRO, etc.' },
      { label: 'Número do Registro', variable: 'PROF_NUM_REGISTRO' },
      { label: 'UF do Registro', variable: 'PROF_UF_REGISTRO' },
      { label: 'Assinatura Digital', variable: 'PROF_ASSINATURA' },

      // Contato
      { label: 'Email', variable: 'PROF_EMAIL' },
      { label: 'Telefone', variable: 'PROF_TELEFONE', formatter: (v) => formatPhone(v as string | null | undefined) },

      // Endereço
      { label: 'Endereço', variable: 'PROF_ENDERECO' },
      { label: 'Cidade', variable: 'PROF_CIDADE' },
      { label: 'Estado', variable: 'PROF_ESTADO' },
    ],
  },

  // ==========================================
  // INSTITUIÇÃO / SUBSCRIBER
  // ==========================================
  institution: {
    title: 'Dados da Instituição',
    icon: 'Building2',
    fields: [
      // Identificação
      { label: 'Nome da Instituição', variable: 'INST_NOME' },
      { label: 'Nome do Município', variable: 'INST_MUNICIPIO' },
      { label: 'CNPJ', variable: 'INST_CNPJ', formatter: (v) => formatCNPJ(v as string | null | undefined) },

      // Contato
      { label: 'Email', variable: 'INST_EMAIL' },
      { label: 'Telefone', variable: 'INST_TELEFONE', formatter: (v) => formatPhone(v as string | null | undefined) },

      // Endereço
      { label: 'CEP', variable: 'INST_CEP', formatter: (v) => formatCEP(v as string | null | undefined) },
      { label: 'Rua', variable: 'INST_RUA' },
      { label: 'Número', variable: 'INST_NUMERO' },
      { label: 'Bairro', variable: 'INST_BAIRRO' },
      { label: 'Cidade', variable: 'INST_CIDADE' },
      { label: 'Estado', variable: 'INST_ESTADO' },
      { label: 'UF', variable: 'INST_UF' },

      // Logos
      { label: 'Logo Estadual', variable: 'INST_LOGO_ESTADO' },
      { label: 'Logo Municipal', variable: 'INST_LOGO_MUNICIPAL' },
      { label: 'Logo Administração', variable: 'INST_LOGO_ADMIN' },
    ],
  },

  // ==========================================
  // REGULAÇÃO (Regulation)
  // ==========================================
  regulation: {
    title: 'Dados da Regulação',
    icon: 'ClipboardList',
    fields: [
      // Identificação
      { label: 'Código/ID', variable: 'REG_CODIGO' },
      { label: 'Status', variable: 'REG_STATUS' },
      { label: 'Prioridade', variable: 'REG_PRIORIDADE' },

      // Datas
      { label: 'Data de Solicitação', variable: 'REG_DATA_SOLICITACAO', formatter: (v) => formatDate(v as Date | string | null | undefined) },
      { label: 'Data Agendada', variable: 'REG_DATA_AGENDADA', formatter: (v) => formatDate(v as Date | string | null | undefined) },
      { label: 'Data de Resolução', variable: 'REG_DATA_RESOLUCAO', formatter: (v) => formatDate(v as Date | string | null | undefined) },
      { label: 'Data de Impressão', variable: 'REG_DATA_IMPRESSAO', formatter: (v) => formatDate(v as Date | string | null | undefined) },

      // Clínico
      { label: 'Indicação Clínica', variable: 'REG_INDICACAO_CLINICA' },
      { label: 'CID', variable: 'REG_CID' },
      { label: 'Observações', variable: 'REG_OBSERVACOES' },

      // Profissional Solicitante
      { label: 'Profissional Solicitante', variable: 'REG_PROF_SOLICITANTE' },

      // Relacionamento com Cidadão Responsável
      { label: 'Tipo de Relacionamento', variable: 'REG_TIPO_RELACIONAMENTO' },

      // Versões
      { label: 'Versão do Documento', variable: 'REG_VERSAO_DOC' },
      { label: 'Histórico', variable: 'REG_HISTORICO' },
    ],
  },

  // ==========================================
  // CUIDADOS (Care) - Relacionamento M:N com Regulation
  // ==========================================
  care: {
    title: 'Cuidados/Procedimentos',
    icon: 'Heart',
    fields: [
      // Informações Básicas
      { label: 'Nome do Cuidado', variable: 'CUID_NOME' },
      { label: 'Sigla', variable: 'CUID_SIGLA' },
      { label: 'Descrição', variable: 'CUID_DESCRICAO' },
      { label: 'Tipo', variable: 'CUID_TIPO' },
      { label: 'Status', variable: 'CUID_STATUS' },

      // Valores e Quantidades
      { label: 'Valor Unitário', variable: 'CUID_VALOR', formatter: (v) => formatCurrency(v as number | null | undefined) },
      { label: 'Valor por Extenso', variable: 'CUID_VALOR_EXTENSO', formatter: (v) => numberToText(v as number | null | undefined, true) },
      { label: 'Quantidade', variable: 'CUID_QUANTIDADE' },
      { label: 'Quantidade por Extenso', variable: 'CUID_QTD_EXTENSO', formatter: (v) => numberToText(v as number | null | undefined) },
      { label: 'Valor Total', variable: 'CUID_VALOR_TOTAL',
        formatter: (v, data) => {
          const value = (data?.value as number) || 0
          const qty = (data?.quantity as number) || 1
          return formatCurrency(value * qty)
        }
      },
      { label: 'Valor Total por Extenso', variable: 'CUID_VALOR_TOTAL_EXTENSO',
        formatter: (v, data) => {
          const value = (data?.value as number) || 0
          const qty = (data?.quantity as number) || 1
          return numberToText(value * qty, true)
        }
      },

      // Unidade e Medida
      { label: 'Unidade de Medida', variable: 'CUID_UNIDADE_MEDIDA' },

      // Prazo e Prioridade
      { label: 'Prazo Mínimo (dias)', variable: 'CUID_PRAZO_MIN' },
      { label: 'Prioridade', variable: 'CUID_PRIORIDADE' },

      // Origem e Declaração
      { label: 'Origem do Recurso', variable: 'CUID_ORIGEM_RECURSO' },
      { label: 'Tipo de Declaração', variable: 'CUID_TIPO_DECLARACAO' },

      // Protocolo
      { label: 'Protocolo', variable: 'CUID_PROTOCOLO' },
      { label: 'Duração (dias)', variable: 'CUID_DURACAO' },
    ],
  },

  // ==========================================
  // FORNECEDOR (Supplier)
  // ==========================================
  supplier: {
    title: 'Dados do Fornecedor',
    icon: 'Package',
    fields: [
      { label: 'Nome do Fornecedor', variable: 'FORN_NOME' },
      { label: 'Nome Fantasia', variable: 'FORN_NOME_FANTASIA' },
      { label: 'CNPJ', variable: 'FORN_CNPJ', formatter: (v) => formatCNPJ(v as string | null | undefined) },
      { label: 'CEP', variable: 'FORN_CEP', formatter: (v) => formatCEP(v as string | null | undefined) },
      { label: 'Cidade', variable: 'FORN_CIDADE' },
      { label: 'Estado', variable: 'FORN_ESTADO' },
    ],
  },

  // ==========================================
  // PASTA (Folder)
  // ==========================================
  folder: {
    title: 'Dados da Pasta',
    icon: 'FolderOpen',
    fields: [
      { label: 'Nome da Pasta', variable: 'PASTA_NOME' },
      { label: 'Código', variable: 'PASTA_CODIGO' },
      { label: 'Descrição', variable: 'PASTA_DESCRICAO' },
      { label: 'Data de Início', variable: 'PASTA_DATA_INICIO', formatter: (v) => formatDate(v as Date | string | null | undefined) },
      { label: 'Data de Fim', variable: 'PASTA_DATA_FIM', formatter: (v) => formatDate(v as Date | string | null | undefined) },
    ],
  },

  // ==========================================
  // SISTEMA / DATA ATUAL
  // ==========================================
  system: {
    title: 'Data e Hora Atual',
    icon: 'Calendar',
    fields: [
      { label: 'Data Atual', variable: 'SYS_DATA_ATUAL', formatter: () => formatDate(new Date()) },
      { label: 'Data Atual por Extenso', variable: 'SYS_DATA_EXTENSO',
        formatter: () => formatDate(new Date(), "dd 'de' MMMM 'de' yyyy")
      },
      { label: 'Hora Atual', variable: 'SYS_HORA_ATUAL', formatter: () => formatDate(new Date(), 'HH:mm') },
      { label: 'Data e Hora', variable: 'SYS_DATA_HORA',
        formatter: () => formatDate(new Date(), "dd/MM/yyyy 'às' HH:mm")
      },
      { label: 'Dia', variable: 'SYS_DIA', formatter: () => formatDate(new Date(), 'dd') },
      { label: 'Mês', variable: 'SYS_MES', formatter: () => formatDate(new Date(), 'MM') },
      { label: 'Ano', variable: 'SYS_ANO', formatter: () => formatDate(new Date(), 'yyyy') },
      { label: 'Dia da Semana', variable: 'SYS_DIA_SEMANA', formatter: () => formatDate(new Date(), 'EEEE') },
    ],
  },

  // ==========================================
  // TRATAMENTO DE GÊNERO
  // ==========================================
  gender: {
    title: 'Tratamento por Gênero',
    icon: 'Users',
    fields: [
      // Pronomes
      {
        label: 'Ele/Ela',
        variable: 'GEN_PRONOME_SUJEITO',
        description: 'Pronome sujeito baseado no gênero',
        formatter: (v, data) => getGenderPronoun((data?.gender || data?.sex) as string | null | undefined, 'subject')
      },
      {
        label: 'Dele/Dela',
        variable: 'GEN_PRONOME_OBJETO',
        description: 'Pronome objeto baseado no gênero',
        formatter: (v, data) => getGenderPronoun((data?.gender || data?.sex) as string | null | undefined, 'object')
      },
      {
        label: 'Seu/Sua',
        variable: 'GEN_PRONOME_POSSESSIVO',
        description: 'Pronome possessivo baseado no gênero',
        formatter: (v, data) => getGenderPronoun((data?.gender || data?.sex) as string | null | undefined, 'possessive')
      },
      {
        label: 'O/A (artigo)',
        variable: 'GEN_ARTIGO',
        description: 'Artigo definido baseado no gênero',
        formatter: (v, data) => getGenderPronoun((data?.gender || data?.sex) as string | null | undefined, 'article')
      },

      // Tratamento Formal
      {
        label: 'Senhor/Senhora',
        variable: 'GEN_TRATAMENTO',
        description: 'Tratamento formal completo',
        formatter: (v, data) => getGenderTreatment((data?.gender || data?.sex) as string | null | undefined, 'full')
      },
      {
        label: 'Sr./Sra.',
        variable: 'GEN_TRATAMENTO_ABREV',
        description: 'Tratamento formal abreviado',
        formatter: (v, data) => getGenderTreatment((data?.gender || data?.sex) as string | null | undefined, 'abbr')
      },

      // Combinações Úteis
      {
        label: 'O/A Cidadão',
        variable: 'GEN_CIDADÃO',
        description: 'Artigo + "cidadão"',
        formatter: (v, data) => {
          const article = getGenderPronoun((data?.gender || data?.sex) as string | null | undefined, 'article')
          return `${article} cidadão`
        }
      },
      {
        label: 'Sr./Sra. + Nome',
        variable: 'GEN_TRATAMENTO_NOME',
        description: 'Tratamento + Nome do cidadão',
        formatter: (v, data) => {
          const treatment = getGenderTreatment((data?.gender || data?.sex) as string | null | undefined, 'abbr')
          const name = (data?.name as string) || ''
          return `${treatment} ${name}`.trim()
        }
      },
      {
        label: 'Senhor/Senhora + Nome',
        variable: 'GEN_TRATAMENTO_NOME_COMPLETO',
        description: 'Tratamento completo + Nome do cidadão',
        formatter: (v, data) => {
          const treatment = getGenderTreatment((data?.gender || data?.sex) as string | null | undefined, 'full')
          const name = (data?.name as string) || ''
          return `${treatment} ${name}`.trim()
        }
      },
    ],
  },
}

/**
 * Retorna todas as variáveis em um array plano
 */
export function getAllVariablesFlat(): VariableField[] {
  const flat: VariableField[] = []

  Object.values(allVariables).forEach(category => {
    flat.push(...category.fields)
  })

  return flat
}

/**
 * Busca uma variável pelo nome
 */
export function findVariable(variableName: string): VariableField | undefined {
  const allFlat = getAllVariablesFlat()
  return allFlat.find(v => v.variable === variableName)
}

// =====================================================================
// SISTEMA DE INTELLISENSE PARA TEMPLATES WHATSAPP
// Formato: {{modelo.campo}} - Baseado no texto.txt
// =====================================================================

export interface TemplateToken {
  token: string           // Ex: "paciente.nome"
  label: string           // Ex: "Nome do Paciente"
  description?: string    // Descrição adicional
  category: string        // Categoria para agrupamento
  derived?: boolean       // Se é um campo derivado (calculado)
}

export interface TokenCategory {
  id: string
  label: string
  icon: string
  color: string
  description?: string
}

// Categorias disponíveis para IntelliSense
export const TOKEN_CATEGORIES: TokenCategory[] = [
  { id: 'paciente', label: 'Paciente', icon: 'User', color: 'bg-blue-500', description: 'Dados do cidadão/paciente' },
  { id: 'responsavel', label: 'Responsável', icon: 'Users', color: 'bg-purple-500', description: 'Responsável pelo paciente' },
  { id: 'regulacao', label: 'Regulação', icon: 'FileText', color: 'bg-green-500', description: 'Dados da regulação' },
  { id: 'agendamento', label: 'Agendamento', icon: 'Calendar', color: 'bg-orange-500', description: 'Dados do agendamento' },
  { id: 'criador', label: 'Criador', icon: 'UserPlus', color: 'bg-cyan-500', description: 'Quem criou a regulação' },
  { id: 'analista', label: 'Analista', icon: 'UserCheck', color: 'bg-indigo-500', description: 'Quem analisou' },
  { id: 'profissional', label: 'Profissional', icon: 'Stethoscope', color: 'bg-teal-500', description: 'Profissional de saúde' },
  { id: 'unidade', label: 'Unidade', icon: 'Building2', color: 'bg-rose-500', description: 'Unidade de saúde' },
  { id: 'pasta', label: 'Pasta', icon: 'Folder', color: 'bg-amber-500', description: 'Pasta/agrupamento' },
  { id: 'fornecedor', label: 'Fornecedor', icon: 'Truck', color: 'bg-lime-500', description: 'Fornecedor/prestador' },
  { id: 'assinante', label: 'Assinante', icon: 'Building', color: 'bg-sky-500', description: 'Dados do município' },
  { id: 'status', label: 'Status/Ação', icon: 'Activity', color: 'bg-red-500', description: 'Atualizações de status' },
]

// Todas as variáveis disponíveis para IntelliSense (formato {{modelo.campo}})
export const TEMPLATE_TOKENS: TemplateToken[] = [
  // =====================================================================
  // PACIENTE (Citizen)
  // =====================================================================
  { token: 'paciente.id', label: 'ID', category: 'paciente' },
  { token: 'paciente.uuid', label: 'UUID', category: 'paciente' },
  { token: 'paciente.nome', label: 'Nome Completo', category: 'paciente' },
  { token: 'paciente.nomeSocial', label: 'Nome Social', category: 'paciente' },
  { token: 'paciente.cpf', label: 'CPF', category: 'paciente' },
  { token: 'paciente.cns', label: 'Cartão SUS', category: 'paciente' },
  { token: 'paciente.rg', label: 'RG', category: 'paciente' },
  { token: 'paciente.email', label: 'Email', category: 'paciente' },
  { token: 'paciente.telefone', label: 'Telefone', category: 'paciente' },
  { token: 'paciente.sexo', label: 'Sexo', category: 'paciente' },
  { token: 'paciente.genero', label: 'Gênero', category: 'paciente' },
  { token: 'paciente.raca', label: 'Raça/Cor', category: 'paciente' },
  { token: 'paciente.dataNascimento', label: 'Data de Nascimento', category: 'paciente' },
  { token: 'paciente.nomeMae', label: 'Nome da Mãe', category: 'paciente' },
  { token: 'paciente.nomePai', label: 'Nome do Pai', category: 'paciente' },
  { token: 'paciente.nacionalidade', label: 'Nacionalidade', category: 'paciente' },
  { token: 'paciente.naturalidade', label: 'Naturalidade', category: 'paciente' },
  { token: 'paciente.estadoCivil', label: 'Estado Civil', category: 'paciente' },
  { token: 'paciente.tipoSanguineo', label: 'Tipo Sanguíneo', category: 'paciente' },
  { token: 'paciente.endereco', label: 'Endereço', category: 'paciente' },
  { token: 'paciente.numero', label: 'Número', category: 'paciente' },
  { token: 'paciente.complemento', label: 'Complemento', category: 'paciente' },
  { token: 'paciente.bairro', label: 'Bairro', category: 'paciente' },
  { token: 'paciente.cep', label: 'CEP', category: 'paciente' },
  { token: 'paciente.cidade', label: 'Cidade', category: 'paciente' },
  { token: 'paciente.estado', label: 'Estado', category: 'paciente' },
  { token: 'paciente.idade', label: 'Idade', category: 'paciente', derived: true, description: 'Calculado automaticamente' },
  { token: 'paciente.enderecoCompleto', label: 'Endereço Completo', category: 'paciente', derived: true, description: 'Endereço formatado' },

  // =====================================================================
  // RESPONSÁVEL (Citizen - quando houver)
  // =====================================================================
  { token: 'responsavel.id', label: 'ID', category: 'responsavel' },
  { token: 'responsavel.nome', label: 'Nome', category: 'responsavel' },
  { token: 'responsavel.cpf', label: 'CPF', category: 'responsavel' },
  { token: 'responsavel.cns', label: 'Cartão SUS', category: 'responsavel' },
  { token: 'responsavel.email', label: 'Email', category: 'responsavel' },
  { token: 'responsavel.telefone', label: 'Telefone', category: 'responsavel' },
  { token: 'responsavel.dataNascimento', label: 'Data de Nascimento', category: 'responsavel' },
  { token: 'responsavel.sexo', label: 'Sexo', category: 'responsavel' },
  { token: 'responsavel.cidade', label: 'Cidade', category: 'responsavel' },
  { token: 'responsavel.estado', label: 'Estado', category: 'responsavel' },
  { token: 'responsavel.idade', label: 'Idade', category: 'responsavel', derived: true },

  // =====================================================================
  // REGULAÇÃO (Regulation)
  // =====================================================================
  { token: 'regulacao.id', label: 'ID', category: 'regulacao' },
  { token: 'regulacao.uuid', label: 'UUID', category: 'regulacao' },
  { token: 'regulacao.codigo', label: 'Código', category: 'regulacao' },
  { token: 'regulacao.protocolo', label: 'Número do Protocolo', category: 'regulacao' },
  { token: 'regulacao.tipoDocumento', label: 'Tipo de Documento', category: 'regulacao' },
  { token: 'regulacao.status', label: 'Status', category: 'regulacao' },
  { token: 'regulacao.prioridade', label: 'Prioridade', category: 'regulacao' },
  { token: 'regulacao.dataSolicitacao', label: 'Data da Solicitação', category: 'regulacao' },
  { token: 'regulacao.indicacaoClinica', label: 'Indicação Clínica', category: 'regulacao' },
  { token: 'regulacao.cid', label: 'CID', category: 'regulacao' },
  { token: 'regulacao.observacoes', label: 'Observações', category: 'regulacao' },
  { token: 'regulacao.relacionamento', label: 'Relacionamento', category: 'regulacao' },
  { token: 'regulacao.historico', label: 'Histórico', category: 'regulacao' },
  { token: 'regulacao.criadoEm', label: 'Criado Em', category: 'regulacao' },
  { token: 'regulacao.atualizadoEm', label: 'Atualizado Em', category: 'regulacao' },

  // =====================================================================
  // AGENDAMENTO (Schedule)
  // =====================================================================
  { token: 'agendamento.id', label: 'ID', category: 'agendamento' },
  { token: 'agendamento.uuid', label: 'UUID', category: 'agendamento' },
  { token: 'agendamento.status', label: 'Status', category: 'agendamento' },
  { token: 'agendamento.data', label: 'Data e Hora', category: 'agendamento' },
  { token: 'agendamento.dataFim', label: 'Data/Hora Fim', category: 'agendamento' },
  { token: 'agendamento.observacoes', label: 'Observações', category: 'agendamento' },
  { token: 'agendamento.recorrenciaTipo', label: 'Tipo de Recorrência', category: 'agendamento' },
  { token: 'agendamento.recorrenciaIntervalo', label: 'Intervalo', category: 'agendamento' },
  { token: 'agendamento.recorrenciaFim', label: 'Fim da Recorrência', category: 'agendamento' },
  { token: 'agendamento.criadoEm', label: 'Criado Em', category: 'agendamento' },

  // =====================================================================
  // CRIADOR (User - Regulation.creator)
  // =====================================================================
  { token: 'criador.id', label: 'ID', category: 'criador' },
  { token: 'criador.nome', label: 'Nome', category: 'criador' },
  { token: 'criador.cpf', label: 'CPF', category: 'criador' },
  { token: 'criador.email', label: 'Email', category: 'criador' },
  { token: 'criador.telefone', label: 'Telefone', category: 'criador' },
  { token: 'criador.cargo', label: 'Cargo', category: 'criador' },
  { token: 'criador.funcao', label: 'Função', category: 'criador' },

  // =====================================================================
  // ANALISTA (User - Regulation.analyzer)
  // =====================================================================
  { token: 'analista.id', label: 'ID', category: 'analista' },
  { token: 'analista.nome', label: 'Nome', category: 'analista' },
  { token: 'analista.email', label: 'Email', category: 'analista' },
  { token: 'analista.cpf', label: 'CPF', category: 'analista' },
  { token: 'analista.funcao', label: 'Função', category: 'analista' },

  // =====================================================================
  // PROFISSIONAL (User - Schedule.professional)
  // =====================================================================
  { token: 'profissional.id', label: 'ID', category: 'profissional' },
  { token: 'profissional.nome', label: 'Nome', category: 'profissional' },
  { token: 'profissional.email', label: 'Email', category: 'profissional' },
  { token: 'profissional.cpf', label: 'CPF', category: 'profissional' },
  { token: 'profissional.cargo', label: 'Cargo', category: 'profissional' },
  { token: 'profissional.funcao', label: 'Função', category: 'profissional' },

  // =====================================================================
  // UNIDADE (Unit)
  // =====================================================================
  { token: 'unidade.id', label: 'ID', category: 'unidade' },
  { token: 'unidade.nome', label: 'Nome', category: 'unidade' },
  { token: 'unidade.cnes', label: 'CNES', category: 'unidade' },
  { token: 'unidade.email', label: 'Email', category: 'unidade' },
  { token: 'unidade.telefone', label: 'Telefone', category: 'unidade' },
  { token: 'unidade.endereco', label: 'Endereço', category: 'unidade' },
  { token: 'unidade.numero', label: 'Número', category: 'unidade' },
  { token: 'unidade.complemento', label: 'Complemento', category: 'unidade' },
  { token: 'unidade.bairro', label: 'Bairro', category: 'unidade' },
  { token: 'unidade.cep', label: 'CEP', category: 'unidade' },
  { token: 'unidade.cidade', label: 'Cidade', category: 'unidade' },
  { token: 'unidade.estado', label: 'Estado', category: 'unidade' },

  // =====================================================================
  // PASTA (Folder)
  // =====================================================================
  { token: 'pasta.id', label: 'ID', category: 'pasta' },
  { token: 'pasta.nome', label: 'Nome', category: 'pasta' },
  { token: 'pasta.codigo', label: 'Código', category: 'pasta' },
  { token: 'pasta.descricao', label: 'Descrição', category: 'pasta' },
  { token: 'pasta.cor', label: 'Cor', category: 'pasta' },
  { token: 'pasta.dataInicio', label: 'Data Início', category: 'pasta' },
  { token: 'pasta.dataFim', label: 'Data Fim', category: 'pasta' },

  // =====================================================================
  // FORNECEDOR (Supplier)
  // =====================================================================
  { token: 'fornecedor.id', label: 'ID', category: 'fornecedor' },
  { token: 'fornecedor.nome', label: 'Razão Social', category: 'fornecedor' },
  { token: 'fornecedor.nomeFantasia', label: 'Nome Fantasia', category: 'fornecedor' },
  { token: 'fornecedor.cnpj', label: 'CNPJ', category: 'fornecedor' },
  { token: 'fornecedor.email', label: 'Email', category: 'fornecedor' },
  { token: 'fornecedor.telefone', label: 'Telefone', category: 'fornecedor' },
  { token: 'fornecedor.site', label: 'Website', category: 'fornecedor' },
  { token: 'fornecedor.endereco', label: 'Endereço', category: 'fornecedor' },
  { token: 'fornecedor.cidade', label: 'Cidade', category: 'fornecedor' },
  { token: 'fornecedor.estado', label: 'Estado', category: 'fornecedor' },

  // =====================================================================
  // ASSINANTE (Subscriber)
  // =====================================================================
  { token: 'assinante.id', label: 'ID', category: 'assinante' },
  { token: 'assinante.nome', label: 'Nome', category: 'assinante' },
  { token: 'assinante.municipio', label: 'Município', category: 'assinante' },
  { token: 'assinante.email', label: 'Email', category: 'assinante' },
  { token: 'assinante.telefone', label: 'Telefone', category: 'assinante' },
  { token: 'assinante.cnpj', label: 'CNPJ', category: 'assinante' },
  { token: 'assinante.cidade', label: 'Cidade', category: 'assinante' },
  { token: 'assinante.estadoSigla', label: 'Estado (Sigla)', category: 'assinante' },
  { token: 'assinante.estadoNome', label: 'Estado (Nome)', category: 'assinante' },

  // =====================================================================
  // STATUS/AÇÃO (RegulationUser)
  // =====================================================================
  { token: 'statusAtualizacao.usuario.nome', label: 'Usuário que Atualizou', category: 'status' },
  { token: 'statusAtualizacao.usuario.email', label: 'Email do Usuário', category: 'status' },
  { token: 'statusAtualizacao.dataHora', label: 'Data/Hora da Atualização', category: 'status' },
  { token: 'statusAtualizacao.de', label: 'Status Anterior', category: 'status' },
  { token: 'statusAtualizacao.para', label: 'Novo Status', category: 'status' },
  { token: 'ultimaAcao.usuario.nome', label: 'Usuário da Última Ação', category: 'status' },
  { token: 'ultimaAcao.dataHora', label: 'Data/Hora da Ação', category: 'status' },
  { token: 'ultimaAcao.acao', label: 'Tipo da Ação', category: 'status' },
  { token: 'ultimaAcao.detalhes', label: 'Detalhes da Ação', category: 'status' },
]

// Aliases para normalização de entrada do usuário
export const TOKEN_ALIASES: Record<string, string> = {
  // Data de nascimento
  'data-de-nascimento': 'dataNascimento',
  'data nascimento': 'dataNascimento',
  'nascimento': 'dataNascimento',
  'birth': 'dataNascimento',

  // Código
  'idcode': 'codigo',
  'idCode': 'codigo',
  'codigo-regulacao': 'codigo',

  // Sexo
  'sex': 'sexo',
  'gender': 'genero',

  // Idade
  'age': 'idade',

  // Telefone
  'fone': 'telefone',
  'celular': 'telefone',
  'phone': 'telefone',

  // Observações
  'obs': 'observacoes',
  'observacao': 'observacoes',
  'notes': 'observacoes',

  // Nome
  'name': 'nome',

  // Email
  'mail': 'email',
  'e-mail': 'email',

  // Endereço
  'address': 'endereco',
  'logradouro': 'endereco',
  'rua': 'endereco',
}

/**
 * Busca tokens com filtro para IntelliSense
 */
export function searchTokens(query: string): TemplateToken[] {
  if (!query || query.trim() === '') return TEMPLATE_TOKENS

  const normalizedQuery = normalizeTokenQuery(query)

  return TEMPLATE_TOKENS.filter((token) => {
    const tokenLower = token.token.toLowerCase()
    const labelLower = token.label.toLowerCase()
    const categoryLower = token.category.toLowerCase()

    return (
      tokenLower.includes(normalizedQuery) ||
      labelLower.includes(normalizedQuery) ||
      categoryLower.includes(normalizedQuery)
    )
  })
}

/**
 * Normaliza a query de busca
 */
function normalizeTokenQuery(query: string): string {
  let normalized = query.toLowerCase().trim()

  // Remove acentos
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Substitui espaços e hífens
  normalized = normalized.replace(/[-\s]/g, '')

  // Verifica se existe um alias
  if (TOKEN_ALIASES[normalized]) {
    normalized = TOKEN_ALIASES[normalized].toLowerCase()
  }

  return normalized
}

/**
 * Obtém tokens por categoria
 */
export function getTokensByCategory(category: string): TemplateToken[] {
  return TEMPLATE_TOKENS.filter((t) => t.category === category)
}

/**
 * Obtém categoria por ID
 */
export function getTokenCategoryById(id: string): TokenCategory | undefined {
  return TOKEN_CATEGORIES.find((c) => c.id === id)
}

/**
 * Formata token como Mustache {{token}}
 */
export function formatMustacheToken(token: string): string {
  return `{{${token}}}`
}

/**
 * Extrai tokens de um texto
 */
export function extractMustacheTokens(text: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const tokens: string[] = []
  let match

  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[1].trim())
  }

  return tokens
}

/**
 * Valida se um token existe
 */
export function isValidMustacheToken(token: string): boolean {
  return TEMPLATE_TOKENS.some((t) => t.token === token)
}

/**
 * Obtém token por nome
 */
export function getTokenByName(token: string): TemplateToken | undefined {
  return TEMPLATE_TOKENS.find((t) => t.token === token)
}

/**
 * Agrupa tokens por categoria para exibição
 */
export function getTokensGroupedByCategory(): Record<string, TemplateToken[]> {
  const grouped: Record<string, TemplateToken[]> = {}

  for (const category of TOKEN_CATEGORIES) {
    grouped[category.id] = TEMPLATE_TOKENS.filter((t) => t.category === category.id)
  }

  return grouped
}
